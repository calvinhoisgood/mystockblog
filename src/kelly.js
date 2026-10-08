export const KELLY_DEFAULTS = Object.freeze({
  capital: 5000,
  probability: 60,
  odds: 1.5,
  scale: 100,
});

export function calculateKelly(input) {
  const limits = [
    ["capital", 0, 1e12, false, "總本金需大於 0，且不超過一兆。"],
    ["probability", 0, 100, true, "勝率請填 0–100%。"],
    ["odds", 0.0001, 1000000, true, "盈虧比 b 請填 0.0001–1,000,000。"],
    ["scale", 0, 100, true, "採用比例請填 0–100%。"],
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
    q = 1 - p,
    b = input.odds;
  const rawFraction = (b * p - q) / b;
  const fullFraction = Math.min(1, Math.max(0, rawFraction));
  const allocation = (fullFraction * input.scale) / 100;
  const amount = input.capital * allocation;
  return {
    rawFraction,
    fullFraction,
    allocation,
    amount,
    remaining: input.capital - amount,
    fullAmount: input.capital * fullFraction,
    odds: b,
  };
}

export const TRADE_DEFAULTS = Object.freeze({ entry: 100, stop: 90, target: 115 });

export function calculateTradeKelly(input) {
  for (const field of ["entry", "stop", "target"]) {
    if (!Number.isFinite(input[field]) || input[field] <= 0 || input[field] > 1e12)
      throw Object.assign(new Error("進場、止損及止盈價需大於 0，且不超過一兆。"), { field });
  }
  if (input.stop >= input.entry)
    throw Object.assign(new Error("做多時，止損價必須低於進場價。"), { field: "stop" });
  if (input.target <= input.entry)
    throw Object.assign(new Error("做多時，止盈價必須高於進場價。"), { field: "target" });
  const lossPerShare = input.entry - input.stop;
  const gainPerShare = input.target - input.entry;
  const odds = gainPerShare / lossPerShare;
  if (!Number.isFinite(odds) || odds < 0.0001 || odds > 1000000)
    throw Object.assign(new Error("價格算出的盈虧比需介於 0.0001–1,000,000；請調整止損或止盈價。"), { field: "target" });
  const result = calculateKelly({ ...input, odds });
  const shares = Math.floor(result.amount / input.entry);
  const cost = shares * input.entry;
  return { ...result, shares, cost, cash: input.capital - cost,
    loss: shares * lossPerShare, gain: shares * gainPerShare,
    lossRate: lossPerShare / input.entry, gainRate: gainPerShare / input.entry };
}
