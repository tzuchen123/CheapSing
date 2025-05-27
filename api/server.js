const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.json());

// 加這段來提供 public/index.html
app.use(express.static(path.join(__dirname, '../public')));

app.get('/', (req, res) => {
    res.send('Hello from backend!');
});


// API: 取得所有分店列表
app.get('/api/stores', (req, res) => {
    const filePath = path.join(__dirname, 'json', 'cashbox_stores.json');
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('讀取分店資料錯誤:', err);
            return res.status(500).json({ error: '伺服器錯誤' });
        }
        res.json(JSON.parse(data));
    });
});

// 計算價格 API
app.post('/api/calculate', (req, res) => {
    const { storeCode, people, day, time, mode } = req.body;

    const boxData = require('./json/cashbox_box_price.json');
    const personData = require('./json/cashbox_person_price.json');

    const storeBox = boxData.find(s => s.storeCode === storeCode);
    const storePerson = personData.find(s => s.storeCode === storeCode);

    if (!storeBox || !storePerson) {
        return res.status(404).json({ message: '找不到該分店' });
    }

    const normalize = s => s.replace(/[\uFF5E~]/g, '~').replace(/\s/g, '');

    function calculateBoxPricing() {
        let selectedBox, boxRow, pricePerHour = null, usedHours = null, boxPrice = null;

        for (const box of storeBox.boxes) {
            const maxPeople = parseInt(box.boxName.match(/\d+(?=人)/g)?.pop() || '0');
            if (people <= maxPeople) {
                selectedBox = box;
                break;
            }
        }

        if (selectedBox) {
            const dayIndex = selectedBox.content[0].findIndex(col => normalize(col) === normalize(day));
            boxRow = selectedBox.content.find(r => normalize(r[0]) === normalize(time));

            const hourCount = (() => {
                const [startH, startM] = time.split('~')[0].split(':').map(Number);
                const [endH, endM] = time.split('~')[1].split(':').map(Number);
                const start = startH + startM / 60;
                const end = endH + endM / 60;
                return Math.max(1, Math.round(end - start));
            })();

            if (boxRow && dayIndex !== -1 && boxRow[dayIndex] !== '-') {
                pricePerHour = parseInt(boxRow[dayIndex]);
                usedHours = hourCount;
                boxPrice = pricePerHour * hourCount;
            }
        }

        const boxMinCharge = parseInt(storeBox.minimum.match(/\d+/)?.[0] || '0');
        if (boxPrice !== null) {
            const baseTotal = boxPrice + (boxMinCharge * people);
            return {
                boxName: selectedBox.boxName,
                boxPrice,
                usedHours,
                minCharge: boxMinCharge,
                total: Math.ceil(baseTotal * 1.1),
                perPerson: Math.ceil((baseTotal * 1.1) / people)
            };
        }

        return null;
    }

    function calculatePersonPricing() {
        let personRow = null, personRaw = null;

        for (const row of storePerson.content) {
            if (normalize(row[0]) === normalize(time)) {
                const header = storePerson.content[0];
                const col = header.findIndex(h => normalize(h) === normalize(day));
                if (col !== -1 && row[col]) {
                    personRow = row;
                    personRaw = row[col];
                    break;
                }
            }
        }

        if (!personRaw) return null;

        const matchPrice = personRaw.match(/\d+/);
        const matchGift = personRaw.match(/買(\d+)H送(\d+)H/);
        const matchHours = personRaw.match(/(\d+)H/);
        const matchExt = personRaw.match(/\((\d+)\)/);

        const price = matchPrice ? parseInt(matchPrice[0]) : 0;
        const personMin = parseInt(storePerson.minimum.match(/\d+/)?.[0] || '0');
        const total = Math.ceil((price + personMin) * 1.1);

        let totalHours = null;
        if (matchGift) {
            totalHours = parseInt(matchGift[1]) + parseInt(matchGift[2]);
        } else if (matchHours) {
            totalHours = parseInt(matchHours[1]);
        } else if (personRow?.[1]) {
            const fallback = personRow[1].match(/(\d+)H/);
            if (fallback) totalHours = parseInt(fallback[1]);
        }

        return {
            rawPrice: price + personMin,
            totalPerPerson: total,
            totalHours,
            extraHourPrice: matchExt ? parseInt(matchExt[1]) : null
        };
    }

    // 根據 mode 呼叫對應的計算方式
    const result = {};
    if (mode === 'box') {
        const boxPricing = calculateBoxPricing();
        if (boxPricing) result.boxPricing = boxPricing;
    } else if (mode === 'person') {
        const personPricing = calculatePersonPricing();
        if (personPricing) result.personPricing = personPricing;
    }

    res.json(result);
});


// 啟動伺服器
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
