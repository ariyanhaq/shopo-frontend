import { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useShop } from '@/context/ShopContext';
import api from '@/services/api';
import toast from 'react-hot-toast';
import { Card, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import {
  BookOpen, Plus, Trash2, Edit3, DollarSign, Percent,
  Sparkles, RefreshCw, ChefHat, Layers, X, CheckCircle2
} from 'lucide-react';

export default function RestaurantRecipes() {
  const { lang } = useLanguage();
  const { activeShop } = useShop();

  const [dishes, setDishes] = useState([]);
  const [rawMaterials, setRawMaterials] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedDish, setSelectedDish] = useState(null);
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
  const [recipeIngredients, setRecipeIngredients] = useState([]);

  const [selectedIngredientId, setSelectedIngredientId] = useState('');
  const [ingredientQty, setIngredientQty] = useState('');

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [menuRes, rawRes] = await Promise.all([
        api.restaurant.menu.list(),
        api.restaurant.rawMaterials.list(),
      ]);

      if (menuRes?.success) setDishes(menuRes.data);
      if (rawRes?.success) setRawMaterials(rawRes.data);
    } catch (err) {
      console.error('Failed to load recipes data:', err);
      toast.error('Failed to load recipe data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeShop]);

  const handleOpenRecipeModal = (dish) => {
    setSelectedDish(dish);
    setRecipeIngredients(dish.recipe_ingredients || []);
    setSelectedIngredientId('');
    setIngredientQty('');
    setIsRecipeModalOpen(true);
  };

  const handleAddIngredientToRecipe = () => {
    if (!selectedIngredientId || !ingredientQty || Number(ingredientQty) <= 0) {
      toast.error('Select ingredient and valid quantity');
      return;
    }

    const raw = rawMaterials.find((r) => r._id === selectedIngredientId);
    if (!raw) return;

    const unitCost = Number(raw.unit_cost || 0);
    const quantity = Number(ingredientQty);
    let calculatedCost = 0;

    // Estimate cost based on unit
    if (raw.unit === 'kg' || raw.unit === 'ltr') {
      calculatedCost = (unitCost / 1000) * quantity; // Assuming grams / ml
    } else {
      calculatedCost = unitCost * quantity;
    }

    setRecipeIngredients([
      ...recipeIngredients,
      {
        raw_material_id: raw._id,
        name: raw.name,
        quantity,
        unit: raw.unit === 'kg' ? 'g' : raw.unit === 'ltr' ? 'ml' : raw.unit,
        unit_cost: Math.round(calculatedCost),
      },
    ]);

    setSelectedIngredientId('');
    setIngredientQty('');
  };

  const handleRemoveIngredient = (index) => {
    setRecipeIngredients(recipeIngredients.filter((_, i) => i !== index));
  };

  const handleSaveRecipe = async () => {
    if (!selectedDish) return;
    const totalCost = recipeIngredients.reduce((sum, ing) => sum + Number(ing.unit_cost || 0), 0);

    try {
      await api.restaurant.menu.update(selectedDish._id, {
        recipe_ingredients: recipeIngredients,
        cost_price: totalCost,
      });
      toast.success('Recipe BOM saved! Food cost updated.');
      setIsRecipeModalOpen(false);
      loadData();
    } catch (err) {
      toast.error('Failed to save recipe');
    }
  };

  return (
    <div className="space-y-6 font-sans pb-16">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <span>{lang === 'bn' ? 'রেসিপি ও খাদ্য উপাদান খরচ (BOM)' : 'Recipe Management & Food Costing (BOM)'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 font-normal mt-0.5">
            {lang === 'bn'
              ? 'খাবারের সাথে কাঁচামাল লিঙ্ক করুন, অটো স্টক কর্তন এবং সঠিক লাভ হিসাব করুন।'
              : 'Link raw pantry ingredients to menu dishes for automated inventory deduction & food costing.'}
          </p>
        </div>

        <button
          onClick={loadData}
          className="p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 transition-all cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* DISHES RECIPE LIST */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="p-4 rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-3.5 shadow-2xs">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <Skeleton className="h-3 w-16 rounded" />
                  <Skeleton className="h-5 w-32 rounded-md" />
                </div>
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl border border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/20">
                <div className="space-y-1 text-center"><Skeleton className="h-3 w-10 mx-auto rounded" /><Skeleton className="h-4 w-12 mx-auto rounded" /></div>
                <div className="space-y-1 text-center"><Skeleton className="h-3 w-10 mx-auto rounded" /><Skeleton className="h-4 w-12 mx-auto rounded" /></div>
                <div className="space-y-1 text-center"><Skeleton className="h-3 w-10 mx-auto rounded" /><Skeleton className="h-4 w-12 mx-auto rounded" /></div>
              </div>
              <Skeleton className="h-9 w-full rounded-xl pt-2" />
            </div>
          ))}
        </div>
      ) : dishes.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-2xl border border-dashed border-slate-200 dark:border-zinc-800 p-8">
          <BookOpen className="w-10 h-10 mx-auto text-slate-300 dark:text-zinc-600 mb-2" />
          <div className="text-sm font-bold text-slate-900 dark:text-white">No Recipes Found</div>
          <p className="text-xs text-slate-500 mt-1">Add dishes to your food menu first to configure recipes.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dishes.map((dish) => {
          const ingredients = dish.recipe_ingredients || [];
          const foodCost = Number(dish.cost_price || 0);
          const price = Number(dish.price || 0);
          const marginPercent = price > 0 ? Math.round(((price - foodCost) / price) * 100) : 0;
          const foodCostRatio = price > 0 ? Math.round((foodCost / price) * 100) : 0;

          return (
            <Card
              key={dish._id}
              className="p-4 bg-white dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 shadow-xs rounded-2xl flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">
                      {dish.category}
                    </span>
                    <div className="font-bold text-sm text-slate-900 dark:text-white mt-0.5">
                      {lang === 'bn' && dish.name_bn ? dish.name_bn : dish.name}
                    </div>
                  </div>

                  <Badge className="bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30 text-[10px]">
                    {ingredients.length} Ingredients
                  </Badge>
                </div>

                {/* Pricing & Cost breakdown */}
                <div className="mt-3 p-2.5 bg-slate-50 dark:bg-zinc-800/40 rounded-xl border border-slate-100 dark:border-zinc-800/80 grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500">Sell Price</span>
                    <div className="font-bold font-mono text-slate-900 dark:text-white">৳ {price}</div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500">Food Cost</span>
                    <div className="font-bold font-mono text-orange-600 dark:text-orange-400">৳ {foodCost}</div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500">Profit Margin</span>
                    <div className="font-bold font-mono text-emerald-600 dark:text-emerald-400">{marginPercent}%</div>
                  </div>
                </div>

                {/* Ingredients summary */}
                <div className="mt-3 space-y-1">
                  <span className="text-[11px] font-semibold text-slate-600 dark:text-zinc-400 block">
                    Recipe Ingredients:
                  </span>
                  {ingredients.length === 0 ? (
                    <div className="text-[11px] text-slate-400 italic">
                      No raw ingredients assigned yet.
                    </div>
                  ) : (
                    <div className="space-y-1 max-h-24 overflow-y-auto">
                      {ingredients.map((ing, i) => (
                        <div key={i} className="text-[11px] text-slate-700 dark:text-zinc-300 flex justify-between">
                          <span>• {ing.name} ({ing.quantity} {ing.unit})</span>
                          <span className="font-mono text-slate-500">৳{ing.unit_cost}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800">
                <button
                  onClick={() => handleOpenRecipeModal(dish)}
                  className="w-full py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold hover:bg-slate-800 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Configure Recipe BOM</span>
                </button>
              </div>
            </Card>
          );
        })}
      </div>
      )}

      {/* MODAL: CONFIGURE RECIPE BOM */}
      {isRecipeModalOpen && selectedDish && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <Card className="max-w-lg w-full p-6 bg-white dark:bg-[#121215] border-slate-200 dark:border-zinc-800 shadow-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3 mb-4">
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-purple-500" />
                <span>Recipe BOM — {selectedDish.name}</span>
              </CardTitle>
              <button
                onClick={() => setIsRecipeModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Add Ingredient Selector */}
              <div className="p-3 bg-slate-50 dark:bg-zinc-800/40 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-2">
                <label className="font-semibold text-slate-700 dark:text-zinc-300 block">
                  Add Raw Material / Pantry Ingredient:
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-2">
                    <Select
                      value={selectedIngredientId}
                      onValueChange={setSelectedIngredientId}
                    >
                      <SelectTrigger className="h-9 text-xs rounded-xl bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800">
                        <SelectValue placeholder="Choose Ingredient" />
                      </SelectTrigger>
                      <SelectContent className="max-h-56">
                        {rawMaterials.map((r) => (
                          <SelectItem key={r._id} value={r._id}>
                            <div className="flex items-center justify-between w-full gap-2 text-xs font-medium">
                              <span>{r.name}</span>
                              <span className="text-[11px] text-slate-400 font-mono">({r.current_stock} {r.unit} - ৳{r.unit_cost}/{r.unit})</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      placeholder="Qty (g/ml)"
                      value={ingredientQty}
                      onChange={(e) => setIngredientQty(e.target.value)}
                      className="h-9 text-xs font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleAddIngredientToRecipe}
                      className="px-3 h-9 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Ingredients List */}
              <div className="space-y-2">
                <span className="font-semibold text-slate-700 dark:text-zinc-300 block">
                  Current Ingredients in Recipe ({recipeIngredients.length}):
                </span>

                {recipeIngredients.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-xs">
                    No ingredients added yet.
                  </div>
                ) : (
                  recipeIngredients.map((ing, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/40 border border-slate-100 dark:border-zinc-800"
                    >
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white">{ing.name}</span>
                        <div className="text-[10px] text-slate-500">
                          {ing.quantity} {ing.unit} portion
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-bold font-mono text-orange-600 dark:text-orange-400">
                          ৳ {ing.unit_cost}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveIngredient(idx)}
                          className="text-rose-500 hover:text-rose-700 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Total Calculated Cost */}
              <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 flex items-center justify-between">
                <span className="font-bold text-emerald-900 dark:text-emerald-200">
                  Total Food Cost (BOM):
                </span>
                <span className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400">
                  ৳ {recipeIngredients.reduce((s, i) => s + Number(i.unit_cost || 0), 0)}
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsRecipeModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveRecipe}
                  className="px-4 py-2 rounded-xl bg-[#00df89] text-slate-950 text-xs font-bold shadow-xs hover:bg-[#00c578] cursor-pointer"
                >
                  Save Recipe BOM
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}

    </div>
  );
}
