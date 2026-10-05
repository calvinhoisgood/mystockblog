import { calculateKelly, KELLY_DEFAULTS } from "./kelly.js";

export function kellyMarkup() {
  return `<div class="hero-copy kelly-panel">
    <div class="eyebrow"><span></span>KELLY CRITERION · 本金配置試算</div>
    <h1>凱利本金計算器</h1><p class="kelly-intro">把你的投資假設，轉成配置比例與金額。</p>
    <form id="kelly-form" class="kelly-fields" aria-label="凱利本金計算器" novalidate>
      <label class="kelly-capital" for="kelly-capital">總本金 <span>你的幣別</span><div class="kelly-input"><input id="kelly-capital" name="capital" type="number" inputmode="decimal" min="0.01" max="1000000000000" step="any" value="100000" required /></div></label>
      <label for="kelly-probability">勝率<div class="kelly-input"><input id="kelly-probability" name="probability" type="number" inputmode="decimal" min="0" max="100" step="any" value="55" required /><span>%</span></div></label>
      <label for="kelly-upside">預期上漲幅<div class="kelly-input"><input id="kelly-upside" name="upside" type="number" inputmode="decimal" min="0.01" max="10000" step="any" value="20" required /><span>%</span></div></label>
      <label for="kelly-downside">預期下跌幅<div class="kelly-input"><input id="kelly-downside" name="downside" type="number" inputmode="decimal" min="0.01" max="100" step="any" value="20" required /><span>%</span></div></label>
      <label for="kelly-scale">凱利比例 <span>半凱利＝50%</span><div class="kelly-input"><input id="kelly-scale" name="scale" type="number" inputmode="decimal" min="0" max="100" step="any" value="50" required /><span>%</span></div></label>
      <button type="button" id="kelly-reset" class="kelly-reset">恢復示範數值 ↺</button>
    </form>
    <div class="kelly-result" aria-live="polite" aria-atomic="true"><div><span class="kelly-result-label">試算投入本金</span><strong id="kelly-amount">—</strong></div><div class="kelly-result-meta"><span>配置比例 <b id="kelly-allocation">—</b></span><span>保留本金 <b id="kelly-remaining">—</b></span><span>理論全凱利 <b id="kelly-raw">—</b></span></div></div>
    <p id="kelly-status" class="kelly-status" role="status"></p>
    <details class="kelly-method"><summary>計算方式與假設</summary><p>f* = p ÷ L − (1 − p) ÷ G；p 為勝率，G、L 為上漲與下跌幅的小數值。先乘你設定的凱利比例，再將配置限制在 0–100%，不計槓桿或做空。</p><p>勝率和漲跌幅應對應同一期間。這是上漲／下跌二情境模型，假設未投入本金報酬為 0，未計費用、相關性或極端風險；示範數值不是對任何股票的預測，結果僅為自訂假設試算。金額與本金使用同一幣別。</p><a href="https://web.stanford.edu/class/cme241/lecture_slides/assignments/assignment4.pdf" target="_blank" rel="noopener noreferrer">模型參考：Stanford CME 241 ↗</a></details>
  </div>`;
}

export function mountKelly() {
  const form = document.getElementById("kelly-form");
  const fields = Object.keys(KELLY_DEFAULTS);
  const amount = new Intl.NumberFormat("zh-Hant", { maximumFractionDigits: 2 });
  const percent = new Intl.NumberFormat("zh-Hant", {
    style: "percent",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const set = (id, text) => (document.getElementById(id).textContent = text);
  function update() {
    const values = Object.fromEntries(
      fields.map((field) => [
        field,
        form.elements.namedItem(field).valueAsNumber,
      ]),
    );
    fields.forEach((field) =>
      form.elements.namedItem(field).removeAttribute("aria-invalid"),
    );
    const status = document.getElementById("kelly-status");
    status.classList.remove("invalid");
    try {
      const result = calculateKelly(values);
      set("kelly-amount", amount.format(result.amount));
      set("kelly-allocation", percent.format(result.allocation));
      set("kelly-remaining", amount.format(result.remaining));
      set("kelly-raw", percent.format(result.rawFraction));
      set(
        "kelly-status",
        result.rawFraction <= 0
          ? "依目前假設，沒有正的凱利配置，試算投入為 0。"
          : result.capped
            ? "折扣後的配置超過 100%，本工具已以總本金為上限。"
            : `目前採用 ${amount.format(values.scale)}% 凱利比例；金額為假設試算。`,
      );
    } catch (error) {
      for (const id of [
        "kelly-amount",
        "kelly-allocation",
        "kelly-remaining",
        "kelly-raw",
      ])
        set(id, "—");
      set("kelly-status", error.message);
      status.classList.add("invalid");
      if (error.field)
        form.elements
          .namedItem(error.field)
          .setAttribute("aria-invalid", "true");
    }
  }
  form.addEventListener("input", update);
  form.addEventListener("submit", (event) => event.preventDefault());
  document.getElementById("kelly-reset").addEventListener("click", () => {
    fields.forEach(
      (field) => (form.elements.namedItem(field).value = KELLY_DEFAULTS[field]),
    );
    update();
  });
  update();
}
