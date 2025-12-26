// Helper functions to format food display with dual units

export interface FoodWithUnit {
  name: string;
  grams: number;
  unit_type?: string;
  grams_per_unit?: number | null;
}

const unitLabels: Record<string, string> = {
  GRAMA: "g",
  UNIDADE: "unidade",
  COLHER_SOPA: "colher",
  COLHER_CHA: "colher chá",
  XICARA: "xícara",
};

const unitLabelsPlural: Record<string, string> = {
  GRAMA: "g",
  UNIDADE: "unidades",
  COLHER_SOPA: "colheres",
  COLHER_CHA: "colheres chá",
  XICARA: "xícaras",
};

/**
 * Formats food display with dual units when applicable
 * Example: "2 ovos (100g)" or "100g" for foods without unit conversion
 */
export function formatFoodWithDualUnit(food: FoodWithUnit): string {
  const { name, grams, unit_type, grams_per_unit } = food;

  // If no unit conversion or unit is grams, just show grams
  if (!unit_type || unit_type === "GRAMA" || !grams_per_unit || grams_per_unit <= 0) {
    return `${name} (${grams}g)`;
  }

  // Calculate units from grams
  const units = grams / grams_per_unit;
  const roundedUnits = Math.round(units * 10) / 10; // Round to 1 decimal

  // Format based on quantity
  if (roundedUnits === 1) {
    return `1 ${unitLabels[unit_type]} de ${name} (${grams}g)`;
  } else if (roundedUnits > 0) {
    return `${roundedUnits} ${unitLabelsPlural[unit_type]} de ${name} (${grams}g)`;
  }

  return `${name} (${grams}g)`;
}

/**
 * Shorter format for lists: "2 ovos (100g)"
 */
export function formatFoodShort(food: FoodWithUnit): string {
  const { name, grams, unit_type, grams_per_unit } = food;

  if (!unit_type || unit_type === "GRAMA" || !grams_per_unit || grams_per_unit <= 0) {
    return `${name} (${grams}g)`;
  }

  const units = grams / grams_per_unit;
  const roundedUnits = Math.round(units * 10) / 10;

  if (roundedUnits === 1) {
    return `1 ${getShortName(name, unit_type)} (${grams}g)`;
  } else if (roundedUnits > 0) {
    return `${roundedUnits} ${getShortNamePlural(name, unit_type)} (${grams}g)`;
  }

  return `${name} (${grams}g)`;
}

/**
 * Creates a short name for unit display
 * "Ovo de galinha" with UNIDADE becomes "ovo"
 */
function getShortName(name: string, unitType: string): string {
  if (unitType === "UNIDADE") {
    // Extract first word and lowercase it
    const firstWord = name.split(" ")[0].toLowerCase();
    return firstWord;
  }
  return name;
}

function getShortNamePlural(name: string, unitType: string): string {
  if (unitType === "UNIDADE") {
    const firstWord = name.split(" ")[0].toLowerCase();
    // Simple pluralization for Portuguese
    if (firstWord.endsWith("o")) {
      return firstWord.slice(0, -1) + "os";
    } else if (firstWord.endsWith("a")) {
      return firstWord.slice(0, -1) + "as";
    }
    return firstWord + "s";
  }
  return name;
}

/**
 * Calculate quantity in units from grams
 */
export function gramsToUnits(grams: number, gramsPerUnit: number | null | undefined): number | null {
  if (!gramsPerUnit || gramsPerUnit <= 0) return null;
  return Math.round((grams / gramsPerUnit) * 10) / 10;
}

/**
 * Calculate grams from quantity in units
 */
export function unitsToGrams(units: number, gramsPerUnit: number | null | undefined): number {
  if (!gramsPerUnit || gramsPerUnit <= 0) return 0;
  return Math.round(units * gramsPerUnit);
}
