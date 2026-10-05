export const KELLY_DEFAULTS = Object.freeze({
  capital: 100000,
  probability: 55,
  upside: 20,
  downside: 20,
  scale: 50,
});

export function calculateKelly(input) {
  const limits = [
    ["capital", 0, 1e12, false, "總本金需大於 0，且不超過一兆。"],
    ["probability", 0, 100, true, "勝率請填 0–100%。"],
    ["upside", 0.01, 10000, true, "預期上漲幅請填 0.01–10,000%。"],
    ["downside", 0.01, 100, true, "預期下跌幅請填 0.01–100%。"],
    ["scale", 0, 100, true, "凱利比例請填 0–100%。"],
  ];
  for (const [field, min, max, inclusive, message] of limits) {
    const value = input[field];
    if (
      !Number.isFinite(value) ||
      (inclusive ? value < min : value <= min) ||
      value > max
    )
      throw Object.assign(new Error(message), { field });
  }
  const p = input.probability / 100,
    gain = input.upside / 100,
    loss = input.downside / 100;
  // Maximize p*log(1+f*gain)+(1-p)*log(1-f*loss), with cash return zero.
  const rawFraction = p / loss - (1 - p) / gain;
  const discounted = (Math.max(0, rawFraction) * input.scale) / 100;
  const allocation = Math.min(1, discounted);
  const amount = input.capital * allocation;
  return {
    rawFraction,
    allocation,
    amount,
    remaining: input.capital - amount,
    capped: discounted > 1,
  };
}
