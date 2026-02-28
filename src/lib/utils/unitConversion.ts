// 1 Tola = 11.6638 grams
const TOLA_TO_GRAM = 11.6638;
// 1 Troy Ounce = 31.1035 grams
const OUNCE_TO_GRAM = 31.1035;

export function gramToTola(grams: number): number {
  return Number((grams / TOLA_TO_GRAM).toFixed(4));
}

export function tolaToGram(tola: number): number {
  return Number((tola * TOLA_TO_GRAM).toFixed(3));
}

export function gramToOunce(grams: number): number {
  return Number((grams / OUNCE_TO_GRAM).toFixed(4));
}

export function ounceToGram(ounce: number): number {
  return Number((ounce * OUNCE_TO_GRAM).toFixed(3));
}

/**
 * Universal unit converter
 */
export function convertUnit(
  value: number,
  from: "GRAM" | "TOLA" | "CARAT" | "PIECE",
  to: "GRAM" | "TOLA" | "CARAT" | "PIECE"
): number {
  if (from === to) return value;

  // Convert to grams first (base unit)
  let inGrams: number;
  switch (from) {
    case "GRAM":
      inGrams = value;
      break;
    case "TOLA":
      inGrams = tolaToGram(value);
      break;
    case "CARAT":
      inGrams = value * 0.2; // 1 carat = 0.2 grams
      break;
    case "PIECE":
      return value; // Can't convert pieces to weight
    default:
      return value;
  }

  // Convert from grams to target unit
  switch (to) {
    case "GRAM":
      return Number(inGrams.toFixed(3));
    case "TOLA":
      return gramToTola(inGrams);
    case "CARAT":
      return Number((inGrams / 0.2).toFixed(3));
    case "PIECE":
      return value;
    default:
      return value;
  }
}

/**
 * Get display label for unit
 */
export function getUnitLabel(unit: string): string {
  const labels: Record<string, string> = {
    GRAM: "Gram (g)",
    TOLA: "Tola",
    CARAT: "Carat (ct)",
    PIECE: "Piece (pc)",
  };
  return labels[unit] || unit;
}

/**
 * Get short unit symbol
 */
export function getUnitSymbol(unit: string): string {
  const symbols: Record<string, string> = {
    GRAM: "g",
    TOLA: "tola",
    CARAT: "ct",
    PIECE: "pc",
  };
  return symbols[unit] || unit;
}