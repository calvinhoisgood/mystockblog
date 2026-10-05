import { calculateKelly, KELLY_DEFAULTS } from "./kelly.js";

export function kellyMarkup() {
  return `<div class="hero-copy kelly-panel">
    <div class="eyebrow"><span></span>KELLY CRITERION · 本金配置試算</div>
    <h1>經典凱利本金計算器</h1><p class="kelly-intro">以勝率與盈虧比，試算單次風險配置。</p>
    <form id="kelly-form" class="kelly-fields" aria-label="凱利本金計算器" novalidate>
      <label class="kelly-capital" for="kelly-capital">總本金 <span>你的幣別</span><div class="kelly-input"><input id="kelly-capital" name="capital" type="number" inputmode="decimal" min="0.01" max="1000000000000" step="any" value="${KELLY_DEFAULTS.capital}" required /></div></label>
      <label for="kelly-probability">勝率<div class="kelly-input"><input id="kelly-probability" name="probability" type="number" inputmode="decimal" min="0" max="100" step="any" value="55" required /><span>%</span></div></label>
      <label for="kelly-upside">預期獲利幅<div class="kelly-input"><input id="kelly-upside" name="upside" type="number" inputmode="decimal" min="0.01" max="10000" step="any" value="20" required /><span>%</span></div></label>
      <label for="kelly-downside">預期虧損幅<div class="kelly-input"><input id="kelly-downside" name="downside" type="number" inputmode="decimal" min="0.01" max="100" step="any" value="20" required /><span>%</span></div></label>
      <label for="kelly-scale">凱利比例 <span>半凱利＝50%</span><div class="kelly-input"><input id="kelly-scale" name="scale" type="number" inputmode="decimal" min="0" max="100" step="any" value="50" required /><span>%</span></div></label>
      <button type="button" id="kelly-reset" class="kelly-reset">恢復示範數值 ↺</button>
    </form>
    <div class="kelly-result" aria-live="polite" aria-atomic="true"><div><span class="kelly-result-label">凱利風險本金</span><strong id="kelly-amount">—</strong></div><div class="kelly-result-meta"><span>配置比例 <b id="kelly-allocation">—</b></span><span>保留本金 <b id="kelly-remaining">—</b></span><span>理論全凱利 <b id="kelly-raw">—</b></span><span>盈虧比 <b id="kelly-odds">—</b></span></div></div>
    <p id="kelly-status" class="kelly-status" role="status"></p>
    <details class="kelly-method"><summary>計算方式與假設</summary><p>經典凱利：f* = p − (1 − p) ÷ b；p 為勝率，b＝預期獲利幅 ÷ 預期虧損幅。輸入的獲利／虧損幅只用來計算盈虧比。正的凱利比例再乘你設定的凱利折扣，沒有正值時配置為 0。</p><p>這個金額代表單次可承擔損失的風險本金；實際股票買入市值還取決於止損幅。示範：勝率 55%、盈虧比 1:1，全凱利為 10%；半凱利為 5%，本金 5,000 的風險本金為 250。這是自訂假設試算，未計費用、相關性或極端風險，並非股票預測。</p><a href="https://theory.stanford.edu/~blynn/pr/kelly.html" target="_blank" rel="noopener noreferrer">模型參考：Stanford 經典凱利 ↗</a></details>
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
      set("kelly-odds", amount.format(result.odds) + " : 1");
      set(
        "kelly-status",
        result.rawFraction <= 0
          ? "依目前假設，沒有正的凱利配置，試算投入為 0。"
          : `採用 ${amount.format(values.scale)}% 凱利折扣；金額代表單次風險本金。`,
      );
    } catch (error) {
      for (const id of [
        "kelly-amount",
        "kelly-allocation",
        "kelly-remaining",
        "kelly-raw",
        "kelly-odds",
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
