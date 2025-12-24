export function abbreviateUnit(unit: string): string {
  const abbreviations: Record<string, string> = {
    teaspoon: "tsp",
    teaspoons: "tsp",
    tablespoon: "tbsp",
    tablespoons: "tbsp",
    cup: "cup",
    cups: "cups",
    ounce: "oz",
    ounces: "oz",
    pound: "lb",
    pounds: "lbs",
    gram: "g",
    grams: "g",
    kilogram: "kg",
    kilograms: "kg",
    milliliter: "ml",
    milliliters: "ml",
    liter: "L",
    liters: "L",
    pinch: "pinch",
    dash: "dash",
  };

  const lower = unit.toLowerCase().trim();
  return abbreviations[lower] || unit;
}
