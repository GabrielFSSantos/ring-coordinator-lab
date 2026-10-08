const {
  parseMoneyToCents,
  centsToMoney,
  isValidTransactionDelta,
} = require("../../shared/money");

describe("money", () => {
  it("converte reais para centavos", () => {
    expect(parseMoneyToCents("10.50")).toBe(1050);
  });

  it("valida delta de transação", () => {
    expect(isValidTransactionDelta(100)).toBe(true);
    expect(isValidTransactionDelta(0)).toBe(false);
    expect(isValidTransactionDelta(501)).toBe(false);
  });

  it("formata centavos", () => {
    expect(centsToMoney(1050)).toBe("10.50");
  });
});
