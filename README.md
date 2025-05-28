# 🎤 錢櫃價格比價工具｜CheapSing

這是一個專為台灣錢櫃 KTV 所打造的價格比較工具，幫助使用者快速查詢各分店在不同計費模式下的歡唱費用，並自動計算平均每人價格與總金額。

## 功能特色

- **支援三種計費模式：**
  - 包廂計費
  - 歡樂唱（人頭計費）
  - 團唱

- **實用體驗**
  - 即時查詢價格
  - 計算總金額與平均每人費用
  - 團唱升等費用與服務費自動計入

- **支援所有錢櫃分店資料**
  - 自動載入 JSON 價格資料
  - 自動根據分店與模式顯示可用時段

- **價格資料可自動更新（爬蟲模組）**
  - getAll.js 可一次執行所有爬蟲，更新所有 JSON 資料
  - 爬蟲來源為錢櫃官網

## 線上體驗

👉 點我一鍵部署到 Render  
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/tzuchen123/CheapSing)

## 資料來源

- `json/cashbox_box_price.json`：包廂時段與價格
- `json/cashbox_person_price.json`：歡樂唱時段與價格
- `json/cashbox_group_price.json`：團唱時段與價格
- `json/cashbox_stores.json`：分店代碼與名稱

## 技術架構

- 前端：純 HTML + 原生 JavaScript（無框架）
- 後端：Node.js + Express

## 🧪 本機開發

```bash
git clone https://github.com/tzuchen123/CheapSing.git
cd CheapSing
npm install
node server.js
```
