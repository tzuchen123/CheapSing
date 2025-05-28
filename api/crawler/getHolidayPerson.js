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

            // 點擊「人數計費」按鈕
            await page.click('button[data-target=".bs-example-modal-lg-person"]');
            await page.waitForSelector('.bs-example-modal-lg-person.show tbody', { timeout: 5000 });

            const content = await page.evaluate(() => {
                const modal = document.querySelector('.bs-example-modal-lg-person.show');
                const tbody = modal.querySelector('tbody');
                const rows = Array.from(tbody.querySelectorAll('tr'));
                const table = [];

                rows.forEach(row => {
                    const cells = Array.from(row.querySelectorAll('th, td')).map(cell => {
                        const main = cell.childNodes[0]?.textContent.trim() || '';
                        const small = cell.querySelector('small')?.innerText.trim();
                        return small ? `${main} (${small})` : main;
                    });

                    table.push(cells);
                });

                return table;
            });

            allStores.push({
                storeName: store.storeName,
                storeCode: store.storeCode,
                content: content
            });
        } catch (err) {
            console.error(`❌ ${store.storeName} 抓取失敗：${err.message}`);
        }
    }

    await browser.close();

    const outputPath = path.join(__dirname, '../json/holiday_person_price.json');
    fs.writeFileSync(outputPath, JSON.stringify(allStores, null, 2), 'utf8');

    console.log(`✅ 共抓取 ${allStores.length} 間好樂迪分店人數計費，已儲存至 holiday_person_price.json`);
})();
