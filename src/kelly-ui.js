import { calculateKelly, calculateTradeKelly, KELLY_DEFAULTS, TRADE_DEFAULTS } from "./kelly.js";

export function kellyMarkup() {
  return `<div class="hero-copy kelly-panel">
    <div class="eyebrow"><span></span>KELLY · TRADE PLANNER</div>
    <h1>凱利本金與進場試算</h1><p class="kelly-intro">設定進場、止損與止盈，自動連動盈虧比。以下為做多範例。</p>
    <label class="kelly-mode" for="kelly-mode">盈虧比來源 <select id="kelly-mode"><option value="prices">進場／止損／止盈價</option><option value="manual">手動輸入盈虧比</option></select></label>
    <form id="kelly-form" class="kelly-fields" aria-label="經典凱利計算器" novalidate>
      <label class="kelly-capital" for="kelly-capital">總本金<div class="kelly-input"><input id="kelly-capital" name="capital" type="number" inputmode="decimal" min="0.01" max="1000000000000" step="any" value="${KELLY_DEFAULTS.capital}" required /></div></label>
      <label for="kelly-probability">勝率 p<div class="kelly-input"><input id="kelly-probability" name="probability" type="number" inputmode="decimal" min="0" max="100" step="any" value="${KELLY_DEFAULTS.probability}" required /><span>%</span></div></label>
      <label id="kelly-odds-field" for="kelly-odds-input" hidden>盈虧比 b <span>淨獲利／虧損</span><div class="kelly-input"><input id="kelly-odds-input" name="odds" type="number" inputmode="decimal" min="0.0001" max="1000000" step="any" value="${KELLY_DEFAULTS.odds}" required /><span>: 1</span></div></label>
      <label for="kelly-scale">採用比例 <span>全100% · 半50%</span><div class="kelly-input"><input id="kelly-scale" name="scale" type="number" inputmode="decimal" min="0" max="100" step="any" value="${KELLY_DEFAULTS.scale}" required /><span>%</span></div></label>
      ${Object.entries(TRADE_DEFAULTS).map(([field, value]) => `<label data-trade-price for="kelly-${field}">${{entry:"進場價",stop:"止損價",target:"止盈價"}[field]}<div class="kelly-input"><input id="kelly-${field}" name="${field}" type="number" inputmode="decimal" min="0.000001" max="1000000000000" step="any" value="${value}" required /></div></label>`).join("")}
      <button type="button" id="kelly-reset" class="kelly-reset">恢復示範數值 ↺</button>
    </form>
    <p id="kelly-prices-equation" class="kelly-equation"></p>
    <p id="kelly-equation" class="kelly-equation"></p>
    <div class="kelly-result" aria-live="polite" aria-atomic="true"><div><span class="kelly-result-label">本次投入本金</span><strong id="kelly-amount">—</strong></div><div class="kelly-result-meta"><span>全凱利比例 <b id="kelly-full">—</b></span><span>全凱利金額 <b id="kelly-full-amount">—</b></span><span>本次投入比例 <b id="kelly-allocation">—</b></span><span>未投入本金 <b id="kelly-remaining">—</b></span></div></div>
    <p id="kelly-status" class="kelly-status" role="status"></p>
    <div id="kelly-trade-results" class="kelly-trade-results"><span>可買整股 <b id="kelly-shares">—</b></span><span>實際買入金額 <b id="kelly-cost">—</b></span><span>止損預估虧損 <b id="kelly-loss">—</b></span><span>止盈預估獲利 <b id="kelly-gain">—</b></span><span>整股後剩餘現金 <b id="kelly-cash">—</b></span></div>
    <details class="kelly-method"><summary>公式與使用前提</summary><p>價格模式：b =（止盈價 − 進場價）÷（進場價 − 止損價）。勝率由你估計，價格不會自動推算勝率。經典公式 f* = (b × p − q) ÷ b，q = 1 − p；本次試算本金＝總本金 × 正的全凱利比例 × 採用比例。公式值不為正時，投入為 0。</p><p>本頁依你的指定，將經典凱利比例直接用作試算倉位。經典模型的 f* 原指可能全損的下注本金比例；股票止損只損失部分倉位，因此此處不是股票收益模型的最優倉位。整股數向下取整，再以整股計算買入金額及止損／止盈損益；所有金額及股價需使用同一幣別，未計交易費用與滑價，止損不保證以指定價格成交。</p><a href="https://theory.stanford.edu/~blynn/pr/kelly.html" target="_blank" rel="noopener noreferrer">經典公式來源：Stanford ↗</a></details>
  </div>`;
}

export function mountKelly() {
  const form = document.getElementById("kelly-form");
  const defaults = { ...KELLY_DEFAULTS, ...TRADE_DEFAULTS };
  const fields = Object.keys(defaults);
  const mode = document.getElementById("kelly-mode");
  const money = new Intl.NumberFormat("zh-Hant", { maximumFractionDigits: 2 });
  const pct = new Intl.NumberFormat("zh-Hant", {
    style: "percent",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const decimal = new Intl.NumberFormat("en-US", { maximumFractionDigits: 8 });
  const set = (id, text) => (document.getElementById(id).textContent = text);
  const outputs = [
    "kelly-amount",
    "kelly-full",
    "kelly-full-amount",
    "kelly-allocation",
    "kelly-remaining",
    "kelly-shares", "kelly-cost", "kelly-loss", "kelly-gain", "kelly-cash",
  ];
  function update() {
    const input = Object.fromEntries(
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
    const priceMode = mode.value === "prices";
    document.getElementById("kelly-odds-field").hidden = priceMode;
    form.elements.namedItem("odds").disabled = priceMode;
    form.querySelectorAll("[data-trade-price]").forEach((label) => {
      label.hidden = !priceMode;
      label.querySelector("input").disabled = !priceMode;
    });
    document.getElementById("kelly-trade-results").hidden = !priceMode;
    try {
      const result = priceMode ? calculateTradeKelly(input) : calculateKelly(input);
      set("kelly-amount", money.format(result.amount));
      set("kelly-full", pct.format(result.fullFraction));
      set("kelly-full-amount", money.format(result.fullAmount));
      set("kelly-allocation", pct.format(result.allocation));
      set("kelly-remaining", money.format(result.remaining));
      const p = input.probability / 100,
        q = 1 - p;
      set(
        "kelly-equation",
        `全凱利：(${decimal.format(result.odds)} × ${decimal.format(p)} − ${decimal.format(q)}) ÷ ${decimal.format(result.odds)} = ${pct.format(result.rawFraction)}`,
      );
      set("kelly-prices-equation", priceMode ? `盈虧比 b = (${decimal.format(input.target)} − ${decimal.format(input.entry)}) ÷ (${decimal.format(input.entry)} − ${decimal.format(input.stop)}) = ${decimal.format(result.odds)} : 1 · 止盈 +${pct.format(result.gainRate)}／止損 −${pct.format(result.lossRate)}` : "");
      if (priceMode) {
        set("kelly-shares", `${money.format(result.shares)} 股`);
        set("kelly-cost", money.format(result.cost));
        set("kelly-loss", `−${money.format(result.loss)}`);
        set("kelly-gain", `+${money.format(result.gain)}`);
        set("kelly-cash", money.format(result.cash));
      }
      set(
        "kelly-status",
        result.rawFraction <= 0
          ? "期望值不為正，本次投入為 0。"
          : `本次採用 ${money.format(input.scale)}% 的全凱利金額。100%＝全凱利，50%＝半凱利，25%＝四分之一凱利。${priceMode ? "股數按整股向下取整；本頁將經典比例用作倉位試算。" : ""}`,
      );
    } catch (error) {
      outputs.forEach((id) => set(id, "—"));
      set("kelly-equation", "");
      set("kelly-prices-equation", "");
      set("kelly-status", error.message);
      status.classList.add("invalid");
      if (error.field)
        form.elements
          .namedItem(error.field)
          .setAttribute("aria-invalid", "true");
    }
  }
  form.addEventListener("input", update);
  mode.addEventListener("change", update);
  form.addEventListener("submit", (e) => e.preventDefault());
  document.getElementById("kelly-reset").addEventListener("click", () => {
    fields.forEach(
      (field) => (form.elements.namedItem(field).value = defaults[field]),
    );
    mode.value = "prices";
    update();
  });
  update();
}
