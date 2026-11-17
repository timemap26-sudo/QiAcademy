# 氣學苑 QiAcademy — 互動式中醫教學 App

純前端 PWA（無需建置）：網頁 + 可安裝到手機。

## 執行
    npx serve .        # 或 python -m http.server 8080
開啟 http://localhost:8080 。手機：以 HTTPS 部署（GitHub Pages / Netlify），用瀏覽器「加入主畫面」即成 App。

## 打包成原生 App（選用）
    npm i -D @capacitor/cli @capacitor/core @capacitor/android @capacitor/ios
    npx cap init QiAcademy com.qiacademy.app --web-dir=.
    npx cap add android && npx cap sync

## 內容修改
教材資料皆在 `data.js`（中藥、穴位、方劑、五行、體質題），測驗題由資料自動產生。
內容僅供學習，不能取代專業醫療。
