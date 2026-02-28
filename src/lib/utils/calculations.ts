/**
 * Calculate wastage weight from base weight and wastage percentage
 */
export function calculateWastage(weight: number, wastagePct: number): number {
  return Number(((weight * wastagePct) / 100).toFixed(3));
}

/**
 * Calculate total weight (base weight + wastage)
 */
export function calculateTotalWeight(
  weight: number,
  wastagePct: number
): number {
  const wastage = calculateWastage(weight, wastagePct);
  return Number((weight + wastage).toFixed(3));
}

/**
 * Calculate line total for a material
 */
export function calculateLineTotal(
  totalWeight: number,
  ratePerUnit: number
): number {
  return Number((totalWeight * ratePerUnit).toFixed(2));
}

/**
 * Calculate charge amount based on type
 * - FIXED: return value as-is
 * - PERCENTAGE: percentage of subtotal
 * - PER_GRAM: value × total weight
 */
export function calculateChargeAmount(
  chargeType: "FIXED" | "PERCENTAGE" | "PER_GRAM",
  chargeValue: number,
  subtotal: number,
  totalWeight: number
): number {
  switch (chargeType) {
    case "FIXED":
      return Number(chargeValue.toFixed(2));
    case "PERCENTAGE":
      return Number(((subtotal * chargeValue) / 100).toFixed(2));
    case "PER_GRAM":
      return Number((totalWeight * chargeValue).toFixed(2));
    default:
      return 0;
  }
}

/**
 * Calculate tax amount
 */
export function calculateTax(subtotal: number, taxPct: number): number {
  return Number(((subtotal * taxPct) / 100).toFixed(2));
}

/**
 * Material line item input
 */
interface MaterialInput {
  weight: number;
  ratePerUnit: number;
  wastagePct: number;
}

/**
 * Charge input
 */
interface ChargeInput {
  chargeType: "FIXED" | "PERCENTAGE" | "PER_GRAM";
  chargeValue: number;
}

/**
 * Old gold input
 */
interface OldGoldInput {
  deductionAmount: number;
}

/**
 * Return type for variant totals
 */
export interface VariantTotals {
  totalMaterialCost: number;
  totalMakingCharges: number;
  totalAdditionalCharges: number;
  subtotal: number;
  cgstAmount: number;
  sgstAmount: number;
  taxAmount: number;
  oldGoldDeduction: number;
  grandTotal: number;
}

/**
 * Calculate complete variant totals
 */
export function calculateVariantTotals(
  materials: MaterialInput[],
  charges: ChargeInput[],
  oldGoldEntries: OldGoldInput[],
  cgstPct: number = 1.5,
  sgstPct: number = 1.5
): VariantTotals {
  // 1. Calculate total material cost
  let totalMaterialCost = 0;
  let totalWeight = 0;

  for (const mat of materials) {
    const tw = calculateTotalWeight(mat.weight, mat.wastagePct);
    totalWeight += tw;
    totalMaterialCost += calculateLineTotal(tw, mat.ratePerUnit);
  }

  // 2. Calculate charges
  let totalMakingCharges = 0;
  let totalAdditionalCharges = 0;

  for (let i = 0; i < charges.length; i++) {
    const charge = charges[i];
    const amount = calculateChargeAmount(
      charge.chargeType,
      charge.chargeValue,
      totalMaterialCost,
      totalWeight
    );
    if (i === 0) {
      totalMakingCharges = amount;
    } else {
      totalAdditionalCharges += amount;
    }
  }

  // 3. Subtotal
  const subtotal = Number(
    (totalMaterialCost + totalMakingCharges + totalAdditionalCharges).toFixed(2)
  );

  // 4. Tax
  const cgstAmount = calculateTax(subtotal, cgstPct);
  const sgstAmount = calculateTax(subtotal, sgstPct);
  const taxAmount = Number((cgstAmount + sgstAmount).toFixed(2));

  // 5. Old gold deduction
  const oldGoldDeduction = oldGoldEntries.reduce(
    (sum, entry) => sum + entry.deductionAmount,
    0
  );

  // 6. Grand total
  const grandTotal = Number(
    (subtotal + taxAmount - oldGoldDeduction).toFixed(2)
  );

  return {
    totalMaterialCost: Number(totalMaterialCost.toFixed(2)),
    totalMakingCharges,
    totalAdditionalCharges: Number(totalAdditionalCharges.toFixed(2)),
    subtotal,
    cgstAmount,
    sgstAmount,
    taxAmount,
    oldGoldDeduction: Number(oldGoldDeduction.toFixed(2)),
    grandTotal,
  };
}