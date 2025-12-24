// Convert decimal to fraction string for recipe display
export function decimalToFraction(decimal: number): string {
  if (decimal === 0) return "0";
  
  const tolerance = 0.0001;
  const sign = decimal < 0 ? "-" : "";
  decimal = Math.abs(decimal);
  
  const wholeNumber = Math.floor(decimal);
  const fractionalPart = decimal - wholeNumber;
  
  if (fractionalPart < tolerance) {
    return sign + wholeNumber.toString();
  }
  
  // Common fractions used in cooking
  const fractions: [number, string][] = [
    [0.125, "1/8"],
    [0.25, "1/4"],
    [0.333, "1/3"],
    [0.375, "3/8"],
    [0.5, "1/2"],
    [0.625, "5/8"],
    [0.667, "2/3"],
    [0.75, "3/4"],
    [0.875, "7/8"],
  ];
  
  for (const [value, fraction] of fractions) {
    if (Math.abs(fractionalPart - value) < tolerance) {
      if (wholeNumber === 0) {
        return sign + fraction;
      }
      return sign + wholeNumber + " " + fraction;
    }
  }
  
  // If no common fraction matches, return decimal rounded to 2 places
  return sign + decimal.toFixed(2).replace(/\.?0+$/, "");
}

// Parse fraction string to decimal
export function fractionToDecimal(fraction: string): number {
  const trimmed = fraction.trim();
  
  // Handle mixed numbers like "1 1/2"
  const mixedMatch = trimmed.match(/^(-?)(\d+)\s+(\d+)\/(\d+)$/);
  if (mixedMatch) {
    const sign = mixedMatch[1] === "-" ? -1 : 1;
    const whole = parseInt(mixedMatch[2], 10);
    const numerator = parseInt(mixedMatch[3], 10);
    const denominator = parseInt(mixedMatch[4], 10);
    return sign * (whole + numerator / denominator);
  }
  
  // Handle simple fractions like "1/2"
  const fractionMatch = trimmed.match(/^(-?)(\d+)\/(\d+)$/);
  if (fractionMatch) {
    const sign = fractionMatch[1] === "-" ? -1 : 1;
    const numerator = parseInt(fractionMatch[2], 10);
    const denominator = parseInt(fractionMatch[3], 10);
    return sign * (numerator / denominator);
  }
  
  // Handle whole numbers or decimals
  const num = parseFloat(trimmed);
  return isNaN(num) ? 0 : num;
}

// Scale an ingredient amount
export function scaleAmount(amount: string, scale: number): string {
  const decimal = fractionToDecimal(amount);
  const scaled = decimal * scale;
  return decimalToFraction(scaled);
}

// Units that don't scale well and should be kept minimal
const discreteUnits = new Set([
  "clove", "cloves",
  "leaf", "leaves",
  "sprig", "sprigs",
  "whole", "piece", "pieces",
  "egg", "eggs",
]);

// Units where very small amounts should round up
const smallUnits = new Set([
  "pinch", "dash", "smidgen",
]);

export function shouldRoundUp(unit: string): boolean {
  return smallUnits.has(unit.toLowerCase());
}

export function isDiscreteUnit(unit: string): boolean {
  return discreteUnits.has(unit.toLowerCase());
}
