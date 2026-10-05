import test from "node:test";
import assert from "node:assert/strict";
import { calculateKelly, KELLY_DEFAULTS } from "../src/kelly.js";

const close = (actual, expected) =>
  assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} != ${expected}`);
test("classic Kelly example allocates risk capital 250 from 5000 with half Kelly", () => {
  const result = calculateKelly(KELLY_DEFAULTS);
  close(result.rawFraction, 0.1);
  close(result.allocation, 0.05);
  close(result.amount, 250);
  close(result.remaining, 4750);
});
test("quarter and full Kelly apply the chosen multiplier", () => {
  close(calculateKelly({ ...KELLY_DEFAULTS, scale: 25 }).amount, 125);
  close(calculateKelly({ ...KELLY_DEFAULTS, scale: 100 }).amount, 500);
});
test("negative edge produces no long allocation", () => {
  const result = calculateKelly({ ...KELLY_DEFAULTS, probability: 40 });
  assert.ok(result.rawFraction < 0);
  assert.equal(result.amount, 0);
  assert.equal(result.remaining, 5000);
});
test("classic Kelly uses gain/loss ratio and applies fractional Kelly", () => {
  const r = calculateKelly({
    ...KELLY_DEFAULTS,
    probability: 60,
    upside: 30,
    downside: 20,
    scale: 50,
  });
  close(r.odds, 1.5);
  close(r.rawFraction, 1 / 3);
  close(r.allocation, 1 / 6);
  close(r.amount, 5000 / 6);
  const sameRatio = calculateKelly({
    ...KELLY_DEFAULTS,
    probability: 60,
    upside: 60,
    downside: 40,
    scale: 50,
  });
  close(sameRatio.amount, r.amount);
});
test("certainty endpoints and zero Kelly multiplier remain bounded", () => {
  assert.equal(calculateKelly({ ...KELLY_DEFAULTS, probability: 0 }).amount, 0);
  assert.equal(
    calculateKelly({ ...KELLY_DEFAULTS, probability: 100 }).allocation,
    0.5,
  );
  assert.equal(calculateKelly({...KELLY_DEFAULTS,probability:100,scale:100}).allocation,1);
  assert.equal(calculateKelly({ ...KELLY_DEFAULTS, scale: 0 }).amount, 0);
});

test("Stanford loaded-die example uses 20% win chance and 5:1 payout for 4% Kelly", () => {
  const r = calculateKelly({
    ...KELLY_DEFAULTS,
    probability: 20,
    upside: 500,
    downside: 100,
    scale: 100,
  });
  close(r.rawFraction, 0.04);
  close(r.amount, 200);
});
test("invalid input, impossible losses and zero returns are rejected", () => {
  for (const input of [
    { capital: NaN },
    { capital: Infinity },
    { capital: 0 },
    { probability: -1 },
    { probability: 101 },
    { upside: 0 },
    { upside: 0.001 },
    { downside: 0 },
    { downside: 1e-320 },
    { downside: 101 },
    { scale: 101 },
  ])
    assert.throws(() => calculateKelly({ ...KELLY_DEFAULTS, ...input }));
});
test("theoretical fraction maximizes the independent two-outcome log objective", () => {
  const result = calculateKelly(KELLY_DEFAULTS);
  const growth = (f) => 0.55 * Math.log(1 + f) + 0.45 * Math.log(1 - f);
  assert.ok(growth(result.rawFraction) > growth(result.rawFraction - 0.02));
  assert.ok(growth(result.rawFraction) > growth(result.rawFraction + 0.02));
});
