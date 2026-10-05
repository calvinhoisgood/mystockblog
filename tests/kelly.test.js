import test from "node:test";
import assert from "node:assert/strict";
import { calculateKelly, KELLY_DEFAULTS } from "../src/kelly.js";

const close = (actual, expected) =>
  assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} != ${expected}`);
test("partial-loss Kelly example allocates 1,250 from 5,000 with half Kelly", () => {
  const result = calculateKelly(KELLY_DEFAULTS);
  close(result.rawFraction, 0.5);
  close(result.allocation, 0.25);
  close(result.amount, 1250);
  close(result.remaining, 3750);
});
test("quarter and full Kelly apply the chosen multiplier", () => {
  close(calculateKelly({ ...KELLY_DEFAULTS, scale: 25 }).amount, 625);
  close(calculateKelly({ ...KELLY_DEFAULTS, scale: 100 }).amount, 2500);
});
test("negative edge produces no long allocation", () => {
  const result = calculateKelly({ ...KELLY_DEFAULTS, probability: 40 });
  assert.ok(result.rawFraction < 0);
  assert.equal(result.amount, 0);
  assert.equal(result.remaining, 5000);
});
test("discount theoretical Kelly before capping, rather than capping it first", () => {
  const result = calculateKelly({
    ...KELLY_DEFAULTS,
    probability: 60,
    upside: 30,
    downside: 20,
    scale: 50,
  });
  close(result.rawFraction, 5 / 3);
  close(result.allocation, 5 / 6);
  assert.equal(result.capped, false);
  const full = calculateKelly({
    ...KELLY_DEFAULTS,
    probability: 60,
    upside: 30,
    downside: 20,
    scale: 100,
  });
  assert.equal(full.allocation, 1);
  assert.equal(full.amount, 5000);
  assert.equal(full.capped, true);
});
test("certainty endpoints and zero Kelly multiplier remain bounded", () => {
  assert.equal(calculateKelly({ ...KELLY_DEFAULTS, probability: 0 }).amount, 0);
  assert.equal(
    calculateKelly({ ...KELLY_DEFAULTS, probability: 100 }).allocation,
    1,
  );
  assert.equal(calculateKelly({ ...KELLY_DEFAULTS, scale: 0 }).amount, 0);
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
  const growth = (f) =>
    0.55 * Math.log(1 + f * 0.2) + 0.45 * Math.log(1 - f * 0.2);
  assert.ok(growth(result.rawFraction) > growth(result.rawFraction - 0.05));
  assert.ok(growth(result.rawFraction) > growth(result.rawFraction + 0.05));
});
