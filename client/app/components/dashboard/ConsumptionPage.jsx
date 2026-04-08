import { useState, useEffect } from "react";
import { ArrowDownCircle, Info, Plus, Trash2 } from "lucide-react";
import { GlobalTable } from "../utils/GlobalTable";
import { FloatingFormCard } from "../utils/FloatingFormCard";
import { useConsumption } from "../../../hooks/useConsumption";
import { useIngredients } from "../../../hooks/useIngredients";
import { useRecipes } from "../../../hooks/useRecipes";

const ConsumptionPage = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [mode, setMode] = useState('recipe');
  const [selectedRecipeId, setSelectedRecipeId] = useState("");
  const [consumptionItems, setConsumptionItems] = useState([]);

  const { data: consumptionLogs, loading, fetch: fetchConsumptionLogs, prepare, page, totalPages } = useConsumption();
  const { data: ingredients, fetch: fetchIngredients } = useIngredients();
  const { data: recipes, fetch: fetchRecipes } = useRecipes();

  useEffect(() => {
    fetchConsumptionLogs(1);
    fetchRecipes(1);
    fetchIngredients(1);
  }, []);

  const handleModeChange = (newMode) => {
    setMode(newMode);
    setSelectedRecipeId("");
    setConsumptionItems(newMode === 'manual' ? [{ ingredientId: '', quantity: '' }] : []);
  };

  const handleRecipeSelect = (e) => {
    const rId = e.target.value;
    setSelectedRecipeId(rId);
    if (!rId) {
      setConsumptionItems([]);
      return;
    }
    const recipe = recipes.find(r => r._id === rId || r.id === rId);
    if (recipe?.ingredients) {
      setConsumptionItems(recipe.ingredients.map(item => ({
        ingredientId: item.ingredient_id?._id || item.ingredient_id || item.ingredientId,
        quantity: item.quantity_required || item.quantity || 0
      })));
    }
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...consumptionItems];
    updated[index][field] = value;
    setConsumptionItems(updated);
  };

  const addRow = () => setConsumptionItems([...consumptionItems, { ingredientId: '', quantity: '' }]);
  const removeRow = (index) => setConsumptionItems(consumptionItems.filter((_, i) => i !== index));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await prepare({
        recipe_id: mode === 'recipe' ? selectedRecipeId : null,
        items: consumptionItems.map(item => ({
          ingredient_id: item.ingredientId,
          quantity_required: Number(item.quantity)
        }))
      });
      alert("Stock updated successfully!");
      handleModeChange('recipe');
      setIsFormOpen(false);
    } catch (err) {
      alert(err.response?.data?.error || "Error processing consumption");
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const logsToday = consumptionLogs.filter(log => log.created_at?.startsWith(today)).length;
  const totalVolume = consumptionLogs.reduce((acc, curr) => acc + (curr.quantity || 0), 0);

  const columns = ["Date", "Item / Recipe", "Ingredient", "Qty Used", "Type"];

  const tableData = consumptionLogs.map((log) => ({
    date: new Date(log.created_at).toLocaleDateString(),
    item: log.recipe_id?.name || "Manual Entry",
    ingredient: log.ingredient_id?.name || "Unknown",
    quantity: `${log.quantity} ${log.ingredient_id?.unit || ""}`,
    type: (
      <span className={`px-2 py-1 rounded text-xs font-bold ${log.recipe_id ? "text-blue-600 bg-blue-50" : "text-amber-600 bg-amber-50"}`}>
        {log.recipe_id ? "Recipe" : "Manual"}
      </span>
    )
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-slate-500 text-sm font-medium">Logs Today</p>
          <h2 className="text-3xl font-bold text-slate-900 mt-1">
            {logsToday < 10 ? `0${logsToday}` : logsToday}
          </h2>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-emerald-500">
          <p className="text-slate-500 text-sm font-medium">Total Usage (Volume)</p>
          <h2 className="text-3xl font-bold text-emerald-600 mt-1">{totalVolume.toFixed(1)}</h2>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-blue-500">
          <p className="text-slate-500 text-sm font-medium">Active Recipes</p>
          <h2 className="text-3xl font-bold text-blue-600 mt-1">{recipes.length}</h2>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
        </div>
      ) : (
        <>
          <GlobalTable
            title="Consumption History"
            columns={columns}
            data={tableData}
            onAddClick={() => setIsFormOpen(true)}
          />
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-3 pt-2">
              <button
                onClick={() => fetchConsumptionLogs(page - 1)}
                disabled={page <= 1}
                className="px-3 py-1 text-sm rounded border border-slate-300 disabled:opacity-40 hover:bg-slate-50"
              >
                Prev
              </button>
              <span className="text-sm text-slate-600">Page {page} of {totalPages}</span>
              <button
                onClick={() => fetchConsumptionLogs(page + 1)}
                disabled={page >= totalPages}
                className="px-3 py-1 text-sm rounded border border-slate-300 disabled:opacity-40 hover:bg-slate-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      <FloatingFormCard
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title="Record Recipe Consumption"
      >
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="flex p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => handleModeChange('recipe')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${mode === 'recipe' ? 'bg-white shadow text-emerald-600' : 'text-slate-500'}`}
            >
              Prepare Recipe
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('manual')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${mode === 'manual' ? 'bg-white shadow text-emerald-600' : 'text-slate-500'}`}
            >
              Manual Override
            </button>
          </div>

          {mode === 'recipe' && (
            <div>
              <label className="block text-sm font-medium text-slate-700">Select Dish Prepared</label>
              <select
                className="mt-1 block w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                value={selectedRecipeId}
                onChange={handleRecipeSelect}
                required
              >
                <option value="">Choose a recipe...</option>
                {recipes.map(r => (
                  <option key={r._id || r.id} value={r._id || r.id}>{r.name}</option>
                ))}
              </select>
            </div>
          )}

          {(mode === 'manual' || (mode === 'recipe' && selectedRecipeId)) && (
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-slate-700">
                  {mode === 'recipe' ? 'Review & Edit Quantities' : 'Add Ingredients'}
                </label>
                {mode === 'manual' && (
                  <button
                    type="button"
                    onClick={addRow}
                    className="text-xs flex items-center text-emerald-600 font-bold hover:text-emerald-700"
                  >
                    <Plus size={14} className="mr-1" /> Add Item
                  </button>
                )}
              </div>

              <div className="max-h-60 overflow-y-auto space-y-3 pr-2">
                {consumptionItems.map((item, index) => (
                  <div key={index} className="flex gap-2 items-center animate-in fade-in slide-in-from-top-1">
                    <select
                      className={`flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm ${mode === 'recipe' ? 'bg-slate-200 text-slate-600 cursor-not-allowed' : 'bg-slate-50'}`}
                      value={item.ingredientId}
                      onChange={(e) => handleItemChange(index, 'ingredientId', e.target.value)}
                      disabled={mode === 'recipe'}
                      required
                    >
                      <option value="">Select Ingredient</option>
                      {ingredients.map(ing => (
                        <option key={ing._id || ing.id} value={ing._id || ing.id}>
                          {ing.name} ({ing.unit})
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      step="0.01"
                      placeholder="Qty"
                      className="w-24 px-3 py-2 bg-white border border-emerald-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 shadow-sm"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      required
                    />

                    {mode === 'manual' && consumptionItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeRow(index)}
                        className="p-2 text-slate-400 hover:text-red-500"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-emerald-600 text-white font-bold py-3 rounded-lg hover:bg-emerald-700 shadow-lg flex items-center justify-center gap-2 transition-all ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                <ArrowDownCircle size={20} />
                Confirm & Deduct Stock
              </>
            )}
          </button>
        </form>
      </FloatingFormCard>
    </div>
  );
};

export default ConsumptionPage;
