export type Category = "Protein" | "Carbohydrate" | "Vegetable" | "Fat" | "Extra";

export type Ingredient = {
    id : string;
    name: string;
    category: Category;
    cookingTime: number; // in minutes
    calories: number; // per 100g
    protein: number; // per 100g
    carbohydrates: number; // per 100g
    fat: number; // per 100g
    imageUrl?: string; // optional, for displaying an image of the ingredient
};

export type UserPreferences = {
    includeCategories: Category[];
    excludeIngredients: string[];
    maxCookingTime: number; // in minutes
};

export type RecipeResults = {
    selectedIngredients: Ingredient[];
    totalCalories: number;
    totalProtein: number;
    totalCarbohydrates: number;
    totalFat: number;
    totalCookingTime: number; // in minutes
};