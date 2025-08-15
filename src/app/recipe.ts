import { Ingredient, RecipeResult, UserPrefs, Category } from "./types";
import { INGREDIENTS } from "./data";

const TARGET_COUNTS: Record<Category, number> = {
    Protein: 1,
    Carbohydrate: 1,
    Vegetable: 2,
    Fat: 1,
};

export function generateRecipe(prefs: UserPrefs): RecipeResult {
  // Filter the pool by categories, excludes, and vegan constraint
  let pool = INGREDIENTS.filter((i) =>
    prefs.includeCategories.includes(i.category) &&
    !prefs.excludeIngredients.includes(i.id));

  // Sort each category by ascending cookTime so “fast” options are chosen first
  const byCatSorted = (cat: Category) =>
    pool
      .filter((i) => i.category === cat)
      .sort((a, b) => a.cookingTime - b.cookingTime);

  // Initial picks aiming for balance
  let picks: Ingredient[] = [];
  (Object.keys(TARGET_COUNTS) as Category[]).forEach((cat) => {
    const need = TARGET_COUNTS[cat];
    const choices = byCatSorted(cat);
    if (choices.length > 0) picks.push(...choices.slice(0, Math.min(need, choices.length)));
  });

  // Compute total time
  let totalTime = picks.reduce((s, i) => s + i.cookingTime, 0);

  // If over time, drop extras first, then highest-time veg/carb until it fits
  if (totalTime > prefs.maxTime) {
    const dropOne = (cat?: Category) => {
      if (cat) {
        const idx = picks.findIndex((i) => i.category === cat);
        if (idx >= 0) picks.splice(idx, 1);
      } else {
        // drop the single item with the largest cookTime
        const idx = picks.reduce((maxIdx, item, i, arr) =>
          item.cookingTime > arr[maxIdx].cookingTime ? i : maxIdx, 0);
        picks.splice(idx, 1);
      }
    };

    // Try a gentle reduction strategy
    dropOne("Extra");
    totalTime = picks.reduce((s, i) => s + i.cookingTime, 0);
    if (totalTime > prefs.maxTime) dropOne("Vegetable");
    totalTime = picks.reduce((s, i) => s + i.cookingTime, 0);
    if (totalTime > prefs.maxTime) dropOne("Carbohydrate");
    totalTime = picks.reduce((s, i) => s + i.cookingTime, 0);
    while (totalTime > prefs.maxTime && picks.length > 0) {
      dropOne(); // last resort
      totalTime = picks.reduce((s, i) => s + i.cookingTime, 0);
    }

    return { picks, totalTime, note: "Adjusted to fit your time limit." };
  }

  return { picks, totalTime, note: "Balanced picks under your time cap." };
}
