function parseMoneyToCents(value) {
  const n = typeof value === "string" ? parseFloat(value) : Number(value);
  if (!Number.isFinite(n)) {
    throw new Error("Valor inválido");
  }
  const rounded = Math.round(n * 100);
  return rounded;
}

function centsToMoney(cents) {
  return (cents / 100).toFixed(2);
}

function isValidTransactionDelta(delta) {
  const cents = parseMoneyToCents(delta);
  if (cents === 0) return false;
  const min = -50000;
  const max = 50000;
  return cents >= min && cents <= max;
}

function randomDeltaCents(minDollars, maxDollars) {
  const minC = parseMoneyToCents(minDollars);
  const maxC = parseMoneyToCents(maxDollars);
  let cents = 0;
  while (cents === 0) {
    cents = Math.floor(Math.random() * (maxC - minC + 1)) + minC;
  }
  return cents;
}

module.exports = {
  parseMoneyToCents,
  centsToMoney,
  isValidTransactionDelta,
  randomDeltaCents,
};
