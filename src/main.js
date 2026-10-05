import "./styles.css";
import { kellyMarkup, mountKelly } from "./kelly-ui.js";
import { sortedTickers } from "./stock-order.js";

const icons = {
  book: '<path d="M4 4h6a3 3 0 0 1 3 3v13a4 4 0 0 0-4-2H4z"/><path d="M20 4h-4a3 3 0 0 0-3 3v13a4 4 0 0 1 4-2h3z"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
  arrow: '<path d="M7 17 17 7M7 7h10v10"/>',
  right: '<path d="m9 5 7 7-7 7"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M5 21v-2a7 7 0 0 1 14 0v2"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  back: '<path d="m12 5-7 7 7 7M5 12h15"/>',
  expand: '<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>',
  upload:
    '<path d="M12 16V3m-5 5 5-5 5 5M4 16v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
};
const icon = (name) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.book}</svg>`;
const escape = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const companies = {
  AVGO: "Broadcom Inc.",
  NVDA: "NVIDIA Corporation",
  AAPL: "Apple Inc.",
  MSFT: "Microsoft Corporation",
  AMD: "Advanced Micro Devices",
  GOOGL: "Alphabet Inc.",
  TSLA: "Tesla, Inc.",
};
let reports = [],
  selectedTicker = "all",
  search = "",
  repository = "",
  stockOrder = [];
let loading = true,
  readerRequest = 0,
  controller,
  downloadUrl;
const date = (value) =>
  new Intl.DateTimeFormat("zh-Hant", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Shanghai",
  }).format(new Date(value));

document.querySelector("#app").innerHTML = `
  <header class="topbar">
    <a class="brand" href="./" aria-label="Stock Notes 首頁"><span class="brand-mark"><i></i><i></i><i></i></span><span>Stock<span class="brand-light">Notes</span><small>股票研究筆記</small></span></a>
    <div class="header-actions"><span class="public-label"><span class="status-dot"></span>公開研究庫</span><button id="manage-button" class="button subtle">${icon("upload")}管理簡報</button></div>
  </header>
  <div class="layout">
    <aside class="sidebar">
      <div class="nav-heading">研究資料庫 <span id="ticker-count">01</span></div>
      <nav id="ticker-nav" aria-label="股票代碼"></nav>
      <div class="sidebar-bottom"><span class="small-symbol">↗</span><p>把研究留下來。<br><span>讓每一次判斷，都有跡可循。</span></p><div>PERSONAL RESEARCH ARCHIVE</div></div>
    </aside>
    <main id="main">
      <section id="catalogue">
        <div class="breadcrumb">研究資料庫 <span>/</span> <b id="breadcrumb-current">全部簡報</b></div>
        <section class="hero kelly-hero">
          ${kellyMarkup()}
          <div class="hero-art" aria-hidden="true"><div class="art-orbit orbit-one"></div><div class="art-orbit orbit-two"></div><div class="art-sheet"><div class="sheet-label">RESEARCH NOTE <span>↗</span></div><div class="sheet-lines"><i></i><i></i></div><div class="art-chart"><span></span><span></span><span></span><span></span><span></span><span></span><span></span></div><div class="sheet-footer">LONG-TERM PERSPECTIVE <span>01</span></div></div><div class="art-tag">THINK IN YEARS.</div></div>
        </section>
        <div class="metrics"><div><span>研究簡報</span><strong id="report-count">—</strong><small>份已公開的研究</small></div><div><span>追蹤公司</span><strong id="company-count">—</strong><small>個獨立投資視角</small></div><div><span>最近發布</span><strong class="date-value" id="latest-date">—</strong><small>持續更新研究筆記</small></div><div class="archive-note">${icon("book")}<p>每一份簡報<br><b>都是一次完整的思考。</b></p></div></div>
        <div class="section-header"><div><div class="eyebrow muted">THE RESEARCH LIBRARY</div><h2 id="list-title">全部研究簡報 <span id="list-count"></span></h2></div><label class="search">${icon("search")}<input id="search" type="search" placeholder="搜尋代碼或簡報" aria-label="搜尋代碼或簡報" /></label></div>
        <p id="catalogue-status" class="inline-status" role="status" hidden></p><button id="retry-button" class="button subtle" hidden>重新載入</button>
        <div id="report-grid" class="report-grid"></div>
        <footer class="page-footer"><span>Stock Notes <i>／</i> 個人股票研究筆記</span><span>研究內容僅供交流，投資決策請自行判斷。</span></footer>
      </section>
      <section id="reader" class="reader" hidden>
        <div class="reader-toolbar"><button id="back-button" class="button subtle">${icon("back")}返回簡報庫</button><div class="reader-info"><span id="reader-ticker" class="ticker-pill"></span><h2 id="reader-title"></h2></div><button id="fullscreen-button" class="button icon-button" aria-label="全螢幕閱讀" title="全螢幕閱讀">${icon("expand")}</button><a id="download-button" class="button subtle" hidden>下載 HTML</a></div>
        <p id="reader-status" class="reader-status" role="status"></p>
        <div id="frame-slot" class="frame-slot"></div>
      </section>
    </main>
  </div>
  <dialog id="manage-dialog"><div class="modal-form"><button type="button" class="modal-close" data-close="manage-dialog" aria-label="關閉">${icon("close")}</button><span class="modal-icon">${icon("upload")}</span><div class="eyebrow muted">PUBLISH A NEW NOTE</div><h2>把研究加入簡報庫</h2><p>使用你的 GitHub 帳號管理。上傳 HTML 並提交後，網站會自動更新。</p><ol class="publish-steps"><li>檔名以股票代碼開頭，例如 NVDA.html。</li><li>拖入 HTML，按 Commit changes 提交。</li><li>等待部署完成，即可在這裡閱讀。</li></ol><p>想保留不同日期的研究，可用 NVDA_2026-10-04.html 這類檔名。代碼、標題和日期會自動整理。</p><p id="repository-status" class="form-hint" hidden></p><a id="github-upload-link" class="button primary full" target="_blank" rel="noopener noreferrer" hidden>${icon("arrow")}前往 GitHub 上傳</a><a id="github-order-link" class="button subtle full" target="_blank" rel="noopener noreferrer" hidden>調整股票順序</a><p class="form-hint">一行一個股票代碼，提交後全網站同步排序。</p></div></dialog>
  <div id="toast" class="toast" role="status" hidden></div>`;

const $ = (id) => document.getElementById(id);
function status(id, message) {
  $(id).textContent = message;
  $(id).hidden = !message;
}
function notify(message) {
  status("toast", message);
  clearTimeout(notify.timer);
  notify.timer = setTimeout(() => ($("toast").hidden = true), 4500);
}

function renderCatalogue() {
  const tickers = sortedTickers(reports, stockOrder);
  $("ticker-count").textContent = String(tickers.length).padStart(2, "0");
  $("ticker-nav").innerHTML =
    `<button class="ticker-link ${selectedTicker === "all" ? "active" : ""}" data-ticker="all" aria-pressed="${selectedTicker === "all"}"><span class="ticker-logo all">${icon("grid")}</span><span class="ticker-detail"><b>全部簡報</b><small>All research notes</small></span><span class="nav-count">${reports.length}</span></button>` +
    tickers
      .map(
        (t) =>
          `<button class="ticker-link ${selectedTicker === t ? "active" : ""}" data-ticker="${escape(t)}" aria-pressed="${selectedTicker === t}"><span class="ticker-detail"><b>${escape(t)}</b></span>${icon("right")}</button>`,
      )
      .join("");
  $("report-count").textContent = String(reports.length).padStart(2, "0");
  $("company-count").textContent = String(tickers.length).padStart(2, "0");
  $("latest-date").textContent = reports.length
    ? date(reports[0].created_at)
    : "—";
  $("breadcrumb-current").textContent =
    selectedTicker === "all" ? "全部簡報" : selectedTicker;
  $("list-title").firstChild.textContent =
    selectedTicker === "all" ? "全部研究簡報 " : `${selectedTicker} 研究簡報 `;
  const filtered = reports.filter(
    (r) =>
      (selectedTicker === "all" || r.ticker === selectedTicker) &&
      `${r.ticker} ${r.title}`.toLowerCase().includes(search.toLowerCase()),
  );
  $("list-count").textContent = filtered.length;
  if (loading) {
    $("report-grid").innerHTML =
      '<div class="empty-state">正在載入研究簡報…</div>';
    return;
  }
  $("report-grid").innerHTML = filtered.length
    ? filtered
        .map(
          (r, index) =>
            `<button class="report-card" data-report="${escape(r.id)}"><div class="card-cover"><div class="cover-top"><span>${escape(r.ticker)}</span><span>${index === 0 && !search ? "LATEST NOTE" : "RESEARCH NOTE"}</span></div><div class="cover-word">${escape(r.ticker)}<span>Equity Research</span></div><div class="cover-lines" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></div><span class="cover-index">${String(index + 1).padStart(2, "0")} / RESEARCH</span></div><div class="card-body"><div class="card-meta"><span class="ticker-pill">${escape(r.ticker)}</span><span>HTML 簡報</span></div><h3>${escape(r.title)}</h3><p>${escape(companies[r.ticker] || r.ticker)} · 股票分析</p><div class="card-bottom"><span>${icon("clock")}${date(r.created_at)}</span><span class="read-link">閱讀簡報 ${icon("arrow")}</span></div></div></button>`,
        )
        .join("")
    : `<div class="empty-state">${icon("book")}<h3>${search ? "沒有找到相關簡報" : "研究即將開始"}</h3><p>${search ? "試試其他股票代碼或關鍵字。" : "新的股票研究簡報發布後，會出現在這裡。"}</p></div>`;
}

async function loadReports() {
  loading = true;
  status("catalogue-status", "");
  $("retry-button").hidden = true;
  renderCatalogue();
  try {
    const response = await fetch(import.meta.env.BASE_URL + "catalogue.json", {
      cache: "no-cache",
    });
    if (!response.ok) throw new Error("HTTP " + response.status);
    const catalogue = await response.json();
    if (!Array.isArray(catalogue.reports)) throw new Error("簡報清單格式錯誤");
    reports = catalogue.reports;
    stockOrder = catalogue.stock_order || [];
    repository = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(catalogue.repository)
      ? catalogue.repository
      : "";
  } catch (error) {
    status("catalogue-status", `暫時無法載入簡報：${error.message}`);
    $("retry-button").hidden = false;
  }
  loading = false;
  renderCatalogue();
}

function closeReader() {
  readerRequest++;
  controller?.abort();
  if (downloadUrl) {
    URL.revokeObjectURL(downloadUrl);
    downloadUrl = null;
  }
  $("frame-slot").replaceChildren();
  $("reader").hidden = true;
  $("catalogue").hidden = false;
}

async function openReport(report) {
  closeReader();
  const request = ++readerRequest;
  controller = new AbortController();
  $("catalogue").hidden = true;
  $("reader").hidden = false;
  $("reader-ticker").textContent = report.ticker;
  $("reader-title").textContent = report.title;
  $("download-button").hidden = true;
  status("reader-status", "正在開啟簡報…");
  const url = new URL(import.meta.env.BASE_URL + report.path, document.baseURI)
    .href;
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const html = await response.text();
    if (request !== readerRequest) return;
    const frame = document.createElement("iframe");
    frame.id = "report-frame";
    frame.title = "股票分析 HTML 簡報";
    frame.setAttribute("sandbox", "allow-scripts");
    frame.referrerPolicy = "no-referrer";
    // Static hosting serves real HTML, so native navigation preserves relative
    // assets and section anchors while the sandbox isolates the parent site.
    frame.src = url;
    $("frame-slot").replaceChildren(frame);
    status("reader-status", "");
    downloadUrl = URL.createObjectURL(
      new Blob([html], { type: "text/html;charset=utf-8" }),
    );
    $("download-button").href = downloadUrl;
    $("download-button").download = report.original_filename;
    $("download-button").hidden = false;
  } catch (error) {
    if (request === readerRequest && error.name !== "AbortError")
      status(
        "reader-status",
        `簡報暫時無法開啟：${error.message}。請返回後再試。`,
      );
  }
}

$("ticker-nav").addEventListener("click", (event) => {
  const button = event.target.closest("[data-ticker]");
  if (!button) return;
  selectedTicker = button.dataset.ticker;
  closeReader();
  renderCatalogue();
});
$("report-grid").addEventListener("click", (event) => {
  const button = event.target.closest("[data-report]");
  if (button) openReport(reports.find((r) => r.id === button.dataset.report));
});
$("search").addEventListener("input", (event) => {
  search = event.target.value;
  renderCatalogue();
});
$("retry-button").addEventListener("click", loadReports);
$("back-button").addEventListener("click", closeReader);
$("fullscreen-button").addEventListener("click", async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await $("reader").requestFullscreen();
  } catch {
    notify("此瀏覽器不支援全螢幕，請使用一般閱讀模式。");
  }
});
document
  .querySelectorAll("[data-close]")
  .forEach((button) =>
    button.addEventListener("click", () => $(button.dataset.close).close()),
  );
$("manage-button").addEventListener("click", () => {
  $("github-upload-link").hidden = !repository;
  $("github-order-link").hidden = !repository;
  if (repository)
    $("github-upload-link").href =
      "https://github.com/" + repository + "/upload/main/public/reports/";
  if (repository)
    $("github-order-link").href =
      "https://github.com/" + repository + "/edit/main/stock-order.txt";
  status(
    "repository-status",
    repository
      ? ""
      : "本機預覽尚未連接 GitHub。將 NVDA.html 等檔案放在 public/reports，連接儲存庫並部署後即可使用管理入口。",
  );
  $("manage-dialog").showModal();
});
mountKelly();
loadReports();
