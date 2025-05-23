// getAll.js
const { execSync } = require('child_process');

try {
    console.log('開始抓取分店資料...');
    execSync('node getStores.js', { stdio: 'inherit' });

    console.log('開始抓取包廂價錢...');
    execSync('node getBox.js', { stdio: 'inherit' });

    console.log('開始抓取團體優惠價...');
    execSync('node getGroup.js', { stdio: 'inherit' });

    console.log('開始抓取歡樂唱個人價...');
    execSync('node getPerson.js', { stdio: 'inherit' });

    console.log('所有爬蟲完成');
} catch (err) {
    console.error('執行過程發生錯誤：', err.message);
}
