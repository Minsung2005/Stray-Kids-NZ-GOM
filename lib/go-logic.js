export function isSecured(claimedSlots, totalSlots, threshold = 2 / 3) {
  return totalSlots > 0 && claimedSlots / totalSlots >= threshold;
}

export function allocateBatch(claimedCount, batchSize) {
  if (batchSize < 1) throw new Error('batchSize must be positive');
  const nextTotal = claimedCount + 1;
  return {
    batch: Math.ceil(nextTotal / batchSize),
    slot: ((nextTotal - 1) % batchSize) + 1,
    nextTotal,
    batchComplete: nextTotal % batchSize === 0
  };
}

export function calculateCredit(paymentAmount, amountOwed, existingCredit = 0) {
  const applied = Math.min(paymentAmount + existingCredit, amountOwed);
  return {
    applied,
    credit: Math.max(0, paymentAmount + existingCredit - amountOwed),
    remaining: Math.max(0, amountOwed - applied)
  };
}

export function calculateShipping({ method, packages = 1, weightGrams = 0 }) {
  const base = method === 'tracked' ? 8.5 : 4.5;
  const weightSurcharge = weightGrams > 500 ? Math.ceil((weightGrams - 500) / 500) * 3.5 : 0;
  return Number((base * packages + weightSurcharge).toFixed(2));
}
