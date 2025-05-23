const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const iconv = require('iconv-lite');

const stores = require('../json/cashbox_stores.json');

const baseUrl = 'https://www.cashboxparty.com/price/special/ks';
const fetchData = async () => {
    const allStores = [];

    for (const store of stores) {
        const url = `${baseUrl}${store.storeCode}.html`;
        //店鋪資料暫存
        const storeTemp = {};

        storeTemp['storeName'] = store.storeName;
        storeTemp['storeCode'] = store.storeCode;

        try {
            const response = await axios.get(url, { responseType: 'arraybuffer' });
            // <meta http-equiv="Content-Type" content="text/html; charset=big5">
            // 指定big5編碼
            const html = iconv.decode(response.data, 'big5');
            const $ = cheerio.load(html);

            //最低消費
            const minimum = $('h3').text();
            storeTemp['minimum'] = minimum;

            const content = [];
            $('#table5 tbody tr').each((index, element) => {
                const temp = [];
                $(element).find('td').each((index, tdElement) => {
                    temp.push($(tdElement).text().trim());
                });
                content.push(temp);
            });
            storeTemp['content'] = content;
        } catch (error) {
            console.error(`Error : ${error.message}`);
        }

        allStores.push(storeTemp);
    }

    // Save the data as JSON
    const jsonContent = JSON.stringify(allStores, null, 2);
    fs.writeFileSync('../json/cashbox_person_price.json', jsonContent);
};

fetchData();
