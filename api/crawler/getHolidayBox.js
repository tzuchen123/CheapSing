const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const stores = require('../json/holiday_stores.json');

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    const allStores = [];

    for (const store of stores) {
        const url = `https://www.holiday.com.tw/StoreInfo/StoreDetail.aspx?sid=${store.storeCode}`;
        console.log(`🔍 抓取 ${store.storeName} (${store.storeCode})`);

        try {
            await page.goto(url, { waitUntil: 'networkidle0' });

            // 點擊開啟 modal（包廂計費）
            await page.click('button[data-target=".bs-example-modal-lg-box"]');

            // 等 modal 裡的 tbody 載入
            await page.waitForSelector('.bs-example-modal-lg-box.show tbody', { timeout: 5000 });

            const boxData = await page.evaluate(() => {
                const modal = document.querySelector('.bs-example-modal-lg-box.show');
                const tbody = modal.querySelector('tbody');
                const rows = Array.from(tbody.querySelectorAll('tr'));
                const note = modal?.querySelector('#box_item > li:nth-child(1)')?.innerText?.trim() || '';

                const result = [];

                let currentDay = null;
                const buffer = [];

                rows.forEach(row => {
                    const cells = Array.from(row.querySelectorAll('th, td')).map(td =>
                        td.innerText.trim()
                    );
                    const isDayHeader = cells[0]?.startsWith('週');
                    if (isDayHeader) {
                        if (currentDay && buffer.length > 0) {
                            result.push({
                                boxName: currentDay,
                                content: [...buffer],
                            });
                            buffer.length = 0;
                        }
                        currentDay = cells[0];
                        buffer.push(['時間／星期', ...cells.slice(1)]);
                    } else if (currentDay && cells.length > 1) {
                        buffer.push(cells);
                    }
                });

                if (currentDay && buffer.length > 0) {
                    result.push({
                        boxName: currentDay,
                        content: [...buffer],
                        note: note
                    });
                }

                return result;
            });

            allStores.push({
                storeName: store.storeName,
                storeCode: store.storeCode,
                boxes: boxData,
            });

        } catch (err) {
            console.error(`❌ ${store.storeName} 失敗：${err.message}`);
        }
    }

    await browser.close();

    const outputPath = path.join(__dirname, '../json/holiday_box_price.json');
    fs.writeFileSync(outputPath, JSON.stringify(allStores, null, 2), 'utf8');

    console.log(`✅ 共抓取 ${allStores.length} 間好樂迪分店包廂計費，已儲存至 holiday_box_price.json`);
})();
