const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const source = fs.readFileSync(
  path.join(__dirname, "../src/lib/amounts.ts"),
  "utf8",
);
const code = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
  },
}).outputText;
const context = { exports: {} };
vm.runInNewContext(code, context);
const { formatAmount, amountText, limitAmountInput } = context.exports;

for (const [value, expected] of [
  [10.15, "10.150"],
  [10.1509, "10.150"],
  [10.9999, "10.999"],
  [-10.9999, "-10.999"],
  ["10.150999", "10.150"],
  ["-.1509", "-0.150"],
  [0.0009, "0.000"],
  [1e-7, "0.000"],
  ["1.23456e3", "1,234.560"],
  [1.005 * 3, "3.015"],
  [0.1 + 0.2, "0.300"],
  [29 / 100, "0.290"],
  [null, "0.000"],
  [undefined, "0.000"],
])
  assert.equal(formatAmount(value), expected, String(value));
assert.equal(formatAmount(123456.7899, "en-IN"), "1,23,456.789");
assert.equal(amountText("10.150"), "10.150");
for (const [value, expected] of [
  ["", ""],
  ["10.", "10."],
  ["10.150", "10.150"],
  ["10.1509", "10.150"],
  ["-10.9999", "-10.999"],
  ["1.23456e2", "123.456"],
])
  assert.equal(limitAmountInput(value), expected);
console.log("Amount precision checks passed.");
