exports.addMoney = (current, amount) =>
  Number((Number(current || 0) + Number(amount || 0)).toFixed(2));