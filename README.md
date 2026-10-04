# Stock Notes · 股票研究筆記

只用 GitHub 的個人 HTML 簡報庫。訪客公開閱讀；你用原本的 GitHub 帳號上傳 HTML，提交後網站自動更新。股票代碼由檔名或資料夾取得，標題自動從 HTML 讀取。

## 日常只要上傳簡報

1. 先把檔案命名為 `NVDA.html` 或 `NVDA_2026-10-04.html`，再在網站點「管理簡報」前往 GitHub。
2. 把 HTML 拖入，按 **Commit changes**，提交到 `main`。
3. 等 GitHub Actions 部署完成，網站就會出現新的簡報。

直接上傳到簡報庫根目錄，不需要先建立股票資料夾。檔名用股票代碼開頭，後面可加底線和日期。原有的股票資料夾也繼續支援。

```text
public/reports/
  NVDA.html
  NVDA_2026-10-05.html
  AMD_2026-10-04.html
  AVGO/
    AVGO.html
```

檔名有 `YYYY-MM-DD` 時，用該日期排序；沒有時用最近一次修改該檔案的 Git 提交日期。沒有 HTML `<title>` 時，標題使用檔名。中文、空格等檔名會自動處理。

要移除或更換簡報，直接在 GitHub 刪除或更新該 HTML，提交後目錄會自動跟著更新。不用手動改 JSON。

## 第一次上線

1. 在 GitHub 建立儲存庫，把這個專案推送到 `main`。
2. 在 **Settings → Pages → Source** 選 **GitHub Actions**。
3. 在 Actions 執行 **Deploy Stock Notes to GitHub Pages**，或再推送一次。完成後 Pages 頁面會顯示網站網址。

部署會自動取得儲存庫名稱，所以「管理簡報」能連到正確位置。無須設定帳號密碼、API 金鑰或 Actions variables。管理權限使用 GitHub 自己的儲存庫權限。

若使用自訂域名，在 Pages 的 Custom domain 填入網域並依官方說明設定 DNS。一般 `username.github.io/repo/` 網址可直接使用。

## 本機預覽

需要 Node.js 24。

```powershell
npm install
npm run dev
```

開啟 http://127.0.0.1:5173 。本機加入／移除簡報後，重新啟動預覽即可更新目錄。若沒有 GitHub remote，本機管理入口會顯示說明；正式 Actions 部署會自動連接儲存庫。

```powershell
npm test
npm run build
npm run preview
```

建置會自動產生 `public/catalogue.json`，此檔案不用提交。日期若沒有 Git 歷史（例如下載 ZIP 後預覽），會使用檔案修改時間。

## 簡報檔案

單檔 HTML 最方便。需要圖片或 CSS 時，可把資源一起上傳到同一股票資料夾，讀取器會以該簡報所在資料夾解析相對路徑。簡報庫根目錄的 HTML 依檔名開頭分類；股票資料夾內的 HTML 依資料夾代碼分類。其他檔案只作為資源。

簡報在 sandbox iframe 中閱讀，保留 JavaScript 圖表並隔離主網站。需要同源資料存取或彈出視窗的特殊簡報可能需調整。GitHub 網頁上傳每個檔案上限 25 MiB。簡報及同目錄資源會公開發布。

## 官方說明

- [GitHub 網頁上傳](https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository?platform=windows)
- [GitHub Pages 部署](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
- [自訂網域](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site)
