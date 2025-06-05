# 錢櫃價格比價工具｜CheapSing

這是一個專為台灣錢櫃 KTV 所打造的價格比較工具，幫助使用者快速查詢各分店在不同計費模式下的歡唱費用，並自動計算平均每人價格與總金額。

---

## Demo
https://cheapsing.onrender.com/

---

## 技術棧

- 前端：純 HTML + 原生 JavaScript（無框架）
- 後端：Node.js + Express

---

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

---

## 專案結構

```
  api/
  ├── crawler/
  │ ├── getAll.js # 一鍵爬取所有錢櫃與好樂迪資料
  │ ├── getCashboxBox.js # 爬取錢櫃包廂計費資料
  │ ├── getCashboxGroup.js # 爬取錢櫃團體優惠方案
  │ ├── getCashboxPerson.js # 爬取錢櫃人頭計費資料
  │ ├── getCashboxStores.js # 爬取錢櫃分店列表
  │ ├── getHolidayBox.js # 爬取好樂迪包廂計費資料
  │ ├── getHolidayPerson.js # 爬取好樂迪人頭計費資料
  │ └── getHolidayStores.js # 爬取好樂迪分店列表
  │
  ├── json/
  │ ├── cashbox_box_price.json # 錢櫃包廂資料
  │ ├── cashbox_group_price.json # 錢櫃團體方案
  │ ├── cashbox_person_price.json # 錢櫃人頭資料
  │ ├── cashbox_stores.json # 錢櫃分店列表
  │ ├── holiday_box_price.json # 好樂迪包廂資料
  │ ├── holiday_person_price.json # 好樂迪人頭資料
  │ └── holiday_stores.json # 好樂迪分店列表
  │
  ├── server.js # Express 主伺服器，處理 API 與價格查詢邏輯

  public/
  └── index.html # 前端畫面（純 HTML + JS），用於查詢價格

```

--- 

## 安裝與運行

```bash
git clone https://github.com/tzuchen123/CheapSing.git
cd CheapSing
cd api
npm install
node server.js
```
---
