const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

async function fetchHTML(url) {
    try {
        const { data } = await axios.get(url);
        return data;
    } catch (error) {
        console.error(`Error fetching the URL: ${url}`, error);
    }
}

async function extractData() {
    const url = 'https://www.cashboxparty.com/';
    const html = await fetchHTML(url);

    const $ = cheerio.load(html);
    let stores = [];


    $('.mega-menu__list .liStore').each(function () {
        let storeName = $(this).find('a').text().trim(); // 提取店名
        let storeCode = $(this).attr('data-extent'); // 提取代號

        stores.push({ storeName, storeCode });
    });

    const jsonContent = JSON.stringify(stores, null, 4);

    fs.writeFile('../json/cashbox_stores.json', jsonContent, 'utf8', function (err) {
        if (err) {
            console.log("An error occured while writing JSON Object to File.");
            return console.log(err);
        }

        console.log("JSON file has been saved.");
    });
}

extractData();
