const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const url = 'https://www.cashboxparty.com/act/ktv/20200903/index.aspx';

const fetchData = async () => {
    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);

        const jsonData = [];

        // 選擇所有帶有"tab-pane"類別的div元素
        $('.tab-pane').each(function () {
            const storeCode = $(this).attr('id');
            const storeName = $(this).find('h3').text();

            const content = [];
            $(this).find('table tbody tr').each((index, element) => {
                const row = [];
                $(element).find('td').each((tdIndex, tdElement) => {
                    if (index === 0) {
                        switch (tdIndex) {
                            case 0:
                                row.push("日期");
                                break;
                            case 1:
                                row.push("進場時段");
                                break;
                            case 2:
                                row.push("可歡唱時間");
                                break;
                            case 3:
                                row.push("優惠價");
                                break;
                            default:
                                row.push($(tdElement).text().trim());
                        }
                    } else {
                        row.push($(tdElement).text().trim());
                    }
                });
                content.push(row);
            });

            const note = [];
            $(this).find('ul').each((index, element) => {
                const li = [];
                $(element).find('li').each((index, element) => {
                    li.push($(element).text().trim());
                });
                note.push(li);
            });


            // 構建每個tab的JSON數據
            jsonData.push({
                storeCode,
                storeName,
                content,
                note
            });
        });

        // 將JSON數據另存為檔案
        fs.writeFileSync('../json/cashbox_group_price.json', JSON.stringify(jsonData, null, 2), 'utf-8');
    } catch (error) {
        console.error(`Error: ${error.message}`);
    }
};

fetchData();
