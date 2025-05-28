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

// 分店代碼映射：for group mode only
const storeCodeMap = {
    '0114': 'k17',
    '0200': 'k02',
    'K01': 'k03',
    '0600': 'k07',
    '0105': 'k11',
    '0107': 'k15',
    '0104': 'k21',
    '0109': 'k25',
    '0108': 'k23',
    '0900': 'k29',
    '0103': 'k31',
    '0112': 'k65',
    '0116': 'k63',
    '0120': 'k68',
};


// 取得所有分店列表
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

// 取得某分店可用的時間段（依照模式）
app.get('/api/time-options', (req, res) => {
    const { storeCode, mode } = req.query;
    const normalize = s => s.replace(/[\uFF5E~]/g, '~').replace(/\s/g, '');

    if (mode === 'person') {
        const personData = require('./json/cashbox_person_price.json');
        const store = personData.find(s => s.storeCode === storeCode);
        if (!store) return res.status(404).json({ error: '找不到分店' });
        const times = store.content.slice(1).map(row => normalize(row[0]));
        return res.json(times);
    }

    if (mode === 'box') {
        const boxData = require('./json/cashbox_box_price.json');
        const store = boxData.find(s => s.storeCode === storeCode);
        if (!store) return res.status(404).json({ error: '找不到分店' });
        const allTimes = new Set();
        for (const box of store.boxes) {
            for (let i = 1; i < box.content.length; i++) {
                allTimes.add(normalize(box.content[i][0]));
            }
        }
        return res.json(Array.from(allTimes));
    }

    if (mode === 'group') {
        const groupData = require('./json/cashbox_group_price.json');
        const mappedCode = storeCodeMap[storeCode];
        const store = groupData.find(s => s.storeCode === mappedCode);
        if (!store) return res.status(404).json({ error: '找不到分店' });

        const options = store.content.slice(1).map(row => `${row[0]}：${row[1]}`);
        return res.json(options);
    }

    res.status(400).json({ error: '未知的 mode' });
});

// 計算價格 
app.post('/api/calculate', (req, res) => {
    const { storeCode, people, day, time, mode, hours } = req.body;

    const boxData = require('./json/cashbox_box_price.json');
    const personData = require('./json/cashbox_person_price.json');

    const storeBox = boxData.find(s => s.storeCode === storeCode);
    const storePerson = personData.find(s => s.storeCode === storeCode);

    if (!storeBox || !storePerson) {
        return res.status(404).json({ message: '找不到該分店' });
    }

    const normalize = s => s.replace(/[\uFF5E~]/g, '~').replace(/\s/g, '');

    // 將時間段格式轉換成分鐘值，例如 "18:00~19:59" -> [1080, 1199]
    function parseHourRange(rangeStr) {
        if (!rangeStr.includes('~')) return [0, 0]; // 防錯處理
        const [start, end] = rangeStr.split('~');
        const toMins = t => {
            const parts = t.split(':');
            const h = parseInt(parts[0] || '0');
            const m = parseInt(parts[1] || '0');
            return h * 60 + m;
        };
        return [toMins(start), toMins(end) + 1];
    }

    function calculateBoxPricing() {
        let selectedBox = null;

        for (const box of storeBox.boxes) {
            const maxPeople = parseInt(box.boxName.match(/\d+(?=人)/g)?.pop() || '0');
            if (people <= maxPeople) {
                selectedBox = box;
                break;
            }
        }

        if (!selectedBox) return null;

        const baseTimeMins = parseHourRange(time)[0];
        const totalMinutes = hours * 60;
        const dayIndex = selectedBox.content[0].findIndex(col => normalize(col) === normalize(day));
        if (dayIndex === -1) return null;

        const segments = selectedBox.content.slice(1)
            .map(row => ({
                timeRange: row[0],
                from: parseHourRange(row[0])[0],
                to: parseHourRange(row[0])[1],
                rate: row[dayIndex] === '-' ? null : parseInt(row[dayIndex])
            }))
            .filter(s => s.rate !== null)
            .sort((a, b) => a.from - b.from);

        let remaining = totalMinutes;
        let curStart = baseTimeMins;
        let boxPrice = 0;
        let breakdown = [];

        for (const seg of segments) {
            if (remaining <= 0) break;
            if (curStart >= seg.to) continue;
            if (curStart < seg.from) {
                const gap = Math.min(seg.from - curStart, remaining);
                curStart += gap;
                remaining -= gap;
            }
            const segStart = Math.max(curStart, seg.from);
            const segEnd = Math.min(seg.to, segStart + remaining);
            const duration = segEnd - segStart;
            const perMinuteRate = seg.rate / 60;
            const cost = Math.ceil(duration * perMinuteRate);

            boxPrice += cost;
            remaining -= duration;
            curStart = segEnd;
            breakdown.push({
                timeRange: seg.timeRange,
                rate: seg.rate,
                minutes: duration,
                subtotal: cost
            });
        }

        const boxMinCharge = parseInt(storeBox.minimum.match(/\d+/)?.[0] || '0');
        const baseTotal = boxPrice + (boxMinCharge * people);

        return {
            boxName: selectedBox.boxName,
            boxPrice,
            usedHours: hours,
            minCharge: boxMinCharge,
            total: Math.ceil(baseTotal * 1.1),
            perPerson: Math.ceil((baseTotal * 1.1) / people),
            breakdown
        };
    }

    function calculatePersonPricing() {
        let personRow = null, personRaw = null;

        for (const row of storePerson.content) {
            if (normalize(row[0]) === normalize(time)) {
                const header = storePerson.content[0];
                const col = header.findIndex(h => normalize(h) === normalize(day));
                if (col !== -1 && row[col] && row[col].trim() !== '-') {
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
            rawPrice: price,
            personMin: personMin,
            totalPerPerson: total,
            totalHours,
            extraHourPrice: matchExt ? parseInt(matchExt[1]) : null
        };
    }

    function calculateGroupPricing() {
        const groupData = require('./json/cashbox_group_price.json');
        const mappedCode = storeCodeMap[storeCode]; // ➜ 做店碼轉換
        const store = groupData.find(s => s.storeCode === mappedCode);

        if (!store) return null;

        const normalize = s => s.replace(/[\uFF5E~－—–‒–]/g, '-').replace(/\s/g, '');
        const match = store.content.find(row =>
            normalize(row[0]) === normalize(day) && normalize(row[1]) === normalize(time)
        );

        if (!match) return null;
        const price = parseInt(match[3]);
        const baseHours = match[2];
        const minCharge = parseInt(store.note?.[0]?.find(n => /基消|基礎消費/.test(n))?.match(/\d+/)?.[0] || '99');
        const baseTotal = price + (people * minCharge);

        return {
            baseHours,
            basePrice: price,
            minCharge,
            total: Math.ceil(baseTotal * 1.1),
            perPerson: Math.ceil((baseTotal * 1.1) / people)
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
    } else if (mode === 'group') {
        const groupPricing = calculateGroupPricing();
        if (groupPricing) result.groupPricing = groupPricing;
    }

    res.json(result);
});


// 啟動伺服器
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
