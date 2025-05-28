const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const stores = require('../json/cashbox_stores.json');

const baseUrl = 'https://www.cashboxparty.com/price/normal/kp';

const fetchData = async () => {
    const allStores = [];

    for (const store of stores) {
        const url = `${baseUrl}${store.storeCode}.html`;
        //店鋪資料暫存
        const storeTemp = {};
        //包廂資料
        const boxes = [];

        storeTemp['storeName'] = store.storeName;
        storeTemp['storeCode'] = store.storeCode;

        try {
            const response = await axios.get(url);
            const $ = cheerio.load(response.data);

            //最低消費
            const minimum = $('.copyright.container h3').text();
            storeTemp['minimum'] = minimum;

            $('.columns').each((index, element) => {
                //包廂名稱
                const boxName = $(element).find('h3').text().trim();

                const table = $(element).find('table');
                const content = [];

                table.find('thead tr').each((index, element) => {
                    const row = [];
                    $(element).find('th').each((index, element) => {
                        row.push($(element).text().trim());
                    });
                    content.push(row);
                });

                table.find('tbody tr').each((index, element) => {
                    const row = [];
                    $(element).find('td').each((index, element) => {
                        row.push($(element).text().trim());
                    });
                    content.push(row);
                });

                //包廂資料暫存
                const boxTemp = {
                    boxName: boxName,
                    content: content
                };
                //將包廂資料暫存加入包廂資料
                boxes.push(boxTemp);
            });

            //將包廂資料加入店鋪資料暫存
            storeTemp['boxes'] = boxes;

        } catch (error) {
            console.error(`Error : ${error.message}`);
        }
        //將店鋪資料暫存加入店鋪資料
        allStores.push(storeTemp);
    }

    // Save the data as JSON
    const jsonContent = JSON.stringify(allStores, null, 2);



    fs.writeFileSync('../json/cashbox_box_price.json', jsonContent);
};

fetchData();
