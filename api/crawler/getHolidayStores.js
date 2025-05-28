const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('https://www.holiday.com.tw/', { waitUntil: 'networkidle2' });

    const stores = await page.evaluate(() => {
        const result = [];
        const ul = document.querySelector('#ulStoreArea');
        if (!ul) return [];

        ul.querySelectorAll('li.sub-menu ul li a').forEach(a => {
            const storeName = a.textContent.trim();
            const href = a.getAttribute('href') || '';
            const match = href.match(/sid=(\d+)/);
            const storeCode = match ? match[1] : null;
            if (storeName && storeCode) {
                result.push({ storeName, storeCode });
            }
        });

        return result;
    });

    await browser.close();

    fs.writeFileSync(
        '../json/holiday_stores.json',
        JSON.stringify(stores, null, 2),
        'utf8'
    );

})();
