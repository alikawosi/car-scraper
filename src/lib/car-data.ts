export const CAR_MAKE_MODEL_MAP: Record<string, string[]> = {
  Audi: ["A1", "A3", "A4", "A5", "Q3", "Q5", "Q7"],
  BMW: ["1 Series", "2 Series", "3 Series", "4 Series", "X1", "X3", "X5"],
  Ford: ["Fiesta", "Focus", "Puma", "Kuga", "Mustang"],
  Honda: ["Civic", "Jazz", "CR-V", "HR-V", "E"],
  Hyundai: ["i10", "i20", "i30", "Kona", "Tucson"],
  Kia: ["Picanto", "Rio", "Ceed", "Sportage", "Sorento"],
  Mercedes: ["A-Class", "C-Class", "E-Class", "GLA", "GLC", "GLE"],
  Nissan: ["Micra", "Juke", "Qashqai", "X-Trail", "Leaf"],
  Toyota: ["Aygo", "Yaris", "Corolla", "C-HR", "RAV4", "Prius"],
  Volkswagen: ["Polo", "Golf", "T-Roc", "Passat", "Tiguan", "ID.3"],
  Volvo: ["XC40", "XC60", "XC90", "S60", "S90", "V60"],
};

export const CAR_MAKES = Object.keys(CAR_MAKE_MODEL_MAP).sort();

export function getModelsForMake(make?: string): string[] {
  if (!make) {
    return [];
  }
  return CAR_MAKE_MODEL_MAP[make] ?? [];
}

