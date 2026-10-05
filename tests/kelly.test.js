import test from "node:test";
import assert from "node:assert/strict";
import { calculateKelly, KELLY_DEFAULTS } from "../src/kelly.js";
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-8, `${a} != ${b}`);
test("user example: capital5000, probability60%, odds1.5 gives full Kelly33.33% and1666.67", () => {
  const r = calculateKelly(KELLY_DEFAULTS);
  close(r.rawFraction, 1 / 3);
  close(r.allocation, 1 / 3);
  close(r.amount, 5000 / 3);
  close(r.remaining, 10000 / 3);
});
test("half and quarter retain full Kelly comparison and scale only adopted amount", () => {
  const half = calculateKelly({ ...KELLY_DEFAULTS, scale: 50 });
  close(half.fullAmount, 5000 / 3);
  close(half.amount, 5000 / 6);
  close(half.allocation, 1 / 6);
  close(calculateKelly({ ...KELLY_DEFAULTS, scale: 25 }).amount, 5000 / 12);
});
test("55% win chance and equal odds yields half Kelly250", () => {
  const r = calculateKelly({
    ...KELLY_DEFAULTS,
    probability: 55,
    odds: 1,
    scale: 50,
  });
  close(r.rawFraction, 0.1);
  close(r.amount, 250);
});
test("negative and zero edge do not allocate", () => {
  for (const probability of [40, 50]) {
    const r = calculateKelly({ ...KELLY_DEFAULTS, probability, odds: 1 });
    assert.equal(r.amount, 0);
    assert.equal(r.fullFraction, 0);
    assert.equal(r.remaining, 5000);
  }
});
test("probability endpoints and zero scale remain bounded", () => {
  assert.equal(calculateKelly({ ...KELLY_DEFAULTS, probability: 0 }).amount, 0);
  assert.equal(
    calculateKelly({ ...KELLY_DEFAULTS, probability: 100 }).amount,
    5000,
  );
  assert.equal(
    calculateKelly({ ...KELLY_DEFAULTS, probability: 100, scale: 50 }).amount,
    2500,
  );
  assert.equal(calculateKelly({ ...KELLY_DEFAULTS, scale: 0 }).amount, 0);
});
test("Stanford loaded die: 20% probability, 5:1 net odds gives4% and200", () => {
  const r = calculateKelly({ ...KELLY_DEFAULTS, probability: 20, odds: 5 });
  close(r.rawFraction, 0.04);
  close(r.amount, 200);
});
test("nonfinite values and invalid odds are rejected", () => {
  for (const patch of [
    { capital: 0 },
    { capital: Infinity },
    { probability: -1 },
    { probability: 101 },
    { odds: 0 },
    { odds: -1 },
    { odds: NaN },
    { odds: Infinity },
    { odds: 1e-300 },
    { scale: 101 },
  ])
    assert.throws(() => calculateKelly({ ...KELLY_DEFAULTS, ...patch }));
});
test("full Kelly maximizes the independent normalized log growth objective", () => {
  const r = calculateKelly(KELLY_DEFAULTS);
  const growth = (f) => 0.6 * Math.log(1 + 1.5 * f) + 0.4 * Math.log(1 - f);
  assert.ok(growth(r.rawFraction) > growth(r.rawFraction - 0.02));
  assert.ok(growth(r.rawFraction) > growth(r.rawFraction + 0.02));
});
