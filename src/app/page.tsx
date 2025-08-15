"use client";

import { useMemo, useState } from "react";
import { Badge, Button, Card, Checkbox, Label, Select, TextInput } from "flowbite-react";
import { CATEGORIES, INGREDIENTS } from "./data";
import { generateRecipe } from "./recipe";
import type { Category, Ingredient, UserPreferences, RecipeResults } from "./types";

export default function Home() {
  // State
  const [maxCookingTime, setMaxCookingTime] = useState<number>(20);
  const [selectedCats, setSelectedCats] = useState<Category[]>([
    "Protein", "Carbohydrate", "Vegetable", "Fat", "Extra",
  ]);
  const [exclude, setExclude] = useState<string[]>([]);

  // For the exclude dropdown
  const visibleIngredients = useMemo(() => INGREDIENTS, []);

  // Build prefs once per change
  const prefs = useMemo<UserPreferences>(
    () => ({
      includeCategories: selectedCats,
      excludeIngredients: exclude,
      maxCookingTime,
    }),
    [selectedCats, exclude, maxCookingTime]
  );

  // Fallback result to keep UI stable
  const EMPTY_RESULT: RecipeResults = useMemo(
    () => ({
      selectedIngredients: [],
      totalCalories: 0,
      totalProtein: 0,
      totalCarbohydrates: 0,
      totalFat: 0,
      totalCookingTime: 0,
    }),
    []
  );

  // Helper: sum macros safely from a list of ingredients
  function sumMacros(items: Ingredient[]) {
    return items.reduce(
      (acc, i) => ({
        calories: acc.calories + (i.calories ?? 0),
        protein: acc.protein + (i.protein ?? 0),
        carbs: acc.carbs + (i.carbohydrates ?? 0),
        fat: acc.fat + (i.fat ?? 0),
        time: acc.time + (i.cookingTime ?? 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, time: 0 }
    );
  }

  // Normalize any generateRecipe() shape into RecipeResults
  const result: RecipeResults = useMemo(() => {
    const raw: any = generateRecipe?.(prefs);
    if (!raw) return EMPTY_RESULT;

    // If it's already the new shape, use it as-is
    if (Array.isArray(raw.selectedIngredients)) {
      return raw as RecipeResults;
    }

    // Backward-compat: old shape { picks, totalTime }
    const picks: Ingredient[] = Array.isArray(raw.picks) ? raw.picks : [];
    const totals = sumMacros(picks);

    return {
      selectedIngredients: picks,
      totalCalories: totals.calories,
      totalProtein: totals.protein,
      totalCarbohydrates: totals.carbs,
      totalFat: totals.fat,
      totalCookingTime: typeof raw.totalTime === "number" ? raw.totalTime : totals.time,
    };
  }, [prefs, EMPTY_RESULT]);

  // Handlers
  function toggleCategory(cat: Category) {
    setSelectedCats((prev) => (prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]));
  }
  function toggleExclude(id: string) {
    setExclude((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  return (
    <main className="mx-auto max-w-4xl p-6 space-y-8">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold">Max's Meal Builder</h1>
        <p className="text-gray-600">Pick your preferences and generate a quick, balanced meal idea.</p>
      </header>

      {/* Controls */}
      <Card className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            {/* Max cooking time */}
            <div>
              <Label htmlFor="time">Max cooking time (minutes)</Label>
              <div className="flex items-center gap-3">
                <input
                  id="time"
                  aria-label="Max cooking time in minutes"
                  type="range"
                  min={5}
                  max={60}
                  value={maxCookingTime}
                  onChange={(e) => setMaxCookingTime(parseInt(e.target.value))}
                  className="w-full"
                />
                <TextInput
                  aria-label="Max cooking time textbox"
                  value={String(maxCookingTime)}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    const clamped = Math.max(0, Math.min(240, Number.isFinite(n) ? n : 0));
                    setMaxCookingTime(clamped);
                  }}
                  className="w-24"
                />
              </div>
            </div>

            {/* Categories */}
            <div className="space-y-2">
              <Label>Include categories</Label>
              <div className="flex flex-wrap gap-3">
                {CATEGORIES.map((c) => (
                  <label key={c.key} className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedCats.includes(c.key)}
                      onChange={() => toggleCategory(c.key)}
                    />
                    <span>{c.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Exclusions */}
          <div className="space-y-2">
            <Label htmlFor="exclude">Exclude ingredients</Label>
            <Select
              id="exclude"
              onChange={(e) => e.target.value && toggleExclude(e.target.value)}
              value=""
            >
              <option value="" disabled>Choose ingredient to exclude…</option>
              {visibleIngredients.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </Select>

            {exclude.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {exclude.map((id) => {
                  const ing = INGREDIENTS.find((i) => i.id === id);
                  if (!ing) return null;
                  return (
                    <Badge
                      key={id}
                      color="gray"
                      onClick={() => toggleExclude(id)}
                      className="cursor-pointer"
                    >
                      {ing.name} ×
                    </Badge>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="pt-2">
          <Button onClick={() => { /* result recomputes via useMemo */ }}>
            Generate
          </Button>
        </div>
      </Card>

      {/* Result */}
      <Card>
        <h2 className="text-xl font-semibold">Your meal idea</h2>

        {result.selectedIngredients.length === 0 ? (
          <p className="text-red-600">
            No combination fits your settings. Try increasing time or removing exclusions.
          </p>
        ) : (
          <>
            <ul className="list-disc pl-6 space-y-1">
              {result.selectedIngredients.map((i) => (
                <li key={i.id}>
                  <span className="font-medium">{i.name}</span>{" "}
                  <span className="text-gray-500">
                    ({i.category}, ~{i.cookingTime} min)
                  </span>
                </li>
              ))}
            </ul>

            <div className="pt-3 grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
              <div><span className="font-semibold">Calories:</span> {Math.round(result.totalCalories)} kcal</div>
              <div><span className="font-semibold">Protein:</span> {Math.round(result.totalProtein)} g</div>
              <div><span className="font-semibold">Carbs:</span> {Math.round(result.totalCarbohydrates)} g</div>
              <div><span className="font-semibold">Fat:</span> {Math.round(result.totalFat)} g</div>
              <div><span className="font-semibold">Time:</span> {result.totalCookingTime} min</div>
            </div>
          </>
        )}
      </Card>

      <footer className="text-sm text-gray-500">Tip: click an “Exclude” badge to remove it.</footer>
    </main>
  );
}
