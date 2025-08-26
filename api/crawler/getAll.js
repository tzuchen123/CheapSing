// getAll.js
const { execSync } = require('child_process');

try {
    // 錢櫃資料
    console.log('開始抓取錢櫃分店資料...');
    execSync('node getCashboxStores.js', { stdio: 'inherit' });

    console.log('開始抓取錢櫃包廂價錢...');
    execSync('node getCashboxBox.js', { stdio: 'inherit' });

    console.log('開始抓取錢櫃團體優惠價...');
    execSync('node getCashboxGroup.js', { stdio: 'inherit' });

    console.log('開始抓取錢櫃歡樂唱個人價...');
    execSync('node getCashboxPerson.js', { stdio: 'inherit' });

    // 好樂迪資料
    console.log('開始抓取好樂迪分店資料...');
    execSync('node getHolidayStores.js', { stdio: 'inherit' });

    console.log('開始抓取好樂迪包廂價錢...');
    execSync('node getHolidayBox.js', { stdio: 'inherit' });

    // console.log('開始抓取好樂迪團體優惠價...');
    // execSync('node getHolidayGroup.js', { stdio: 'inherit' });

    console.log('開始抓取好樂迪歡樂唱個人價...');
    execSync('node getHolidayPerson.js', { stdio: 'inherit' });

    console.log('所有爬蟲完成');
} catch (err) {
    console.error('執行過程發生錯誤：', err.message);
}
