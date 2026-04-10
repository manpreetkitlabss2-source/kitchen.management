import { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import DataGrid from "../utils/DataGrid";
import { FloatingFormCard } from "../utils/FloatingFormCard";
import { useRecipes } from "../../../hooks/useRecipes";
import { useIngredients } from "../../../hooks/useIngredients";

const RecipePage = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [limit, setLimit] = useState(10);
  const [formData, setFormData] = useState({
    name: '',
    recipeIngredients: [{ ingredientId: '', quantity: '' }]
  });

  const { data: recipes, loading, fetch: fetchRecipes, add: addRecipe, page, totalPages, total } = useRecipes();
  const { data: ingredientsList, fetch: fetchIngredients } = useIngredients();

  useEffect(() => {
    fetchRecipes(1, limit);
    fetchIngredients(1);
  }, []);

  const addIngredientRow = () => {
    setFormData({
      ...formData,
      recipeIngredients: [...formData.recipeIngredients, { ingredientId: '', quantity: '' }]
    });
  };

  const removeIngredientRow = (index) => {
    setFormData({ ...formData, recipeIngredients: formData.recipeIngredients.filter((_, i) => i !== index) });
  };

  const handleIngredientChange = (index, field, value) => {
    const updated = [...formData.recipeIngredients];
    updated[index][field] = value;
    setFormData({ ...formData, recipeIngredients: updated });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addRecipe({
        name: formData.name,
        ingredientsMap: formData.recipeIngredients.map(ing => ({
          ingredient_id: ing.ingredientId,
          quantity_required: Number(ing.quantity)
        }))
      });
      setFormData({ name: '', recipeIngredients: [{ ingredientId: '', quantity: '' }] });
      setIsFormOpen(false);
      alert("Recipe created successfully!");
      fetchRecipes(1, limit);
    } catch (err) {
      alert("Error saving recipe");
    }
  };

  const columns = [
    {
      key: "name",
      label: "Recipe Name",
      sortable: true,
    },
    {
      key: "ingredients_count",
      label: "Total Ingredients",
      sortable: true,
      render: (recipe) => `${recipe.ingredients?.length || 0} items`
    },
    {
      key: "complexity",
      label: "Complexity",
      sortable: false,
      render: (recipe) => (
        <span className="text-slate-600 bg-slate-100 px-2 py-1 rounded text-xs font-medium">
          {(recipe.ingredients?.length || 0) > 5 ? 'High' : 'Standard'}
        </span>
      )
    },
    {
      key: "status",
      label: "Status",
      sortable: false,
      render: () => <span className="text-emerald-600 bg-emerald-50 px-2 py-1 rounded text-xs font-bold">Active</span>
    }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-slate-500 text-sm font-medium">Total Recipes</p>
          <h2 className="text-3xl font-bold text-slate-900 mt-1">{recipes.length}</h2>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-emerald-500">
          <p className="text-slate-500 text-sm font-medium">Menu Items</p>
          <h2 className="text-3xl font-bold text-emerald-600 mt-1">{recipes.length}</h2>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
        </div>
      ) : (
        <DataGrid
          title="Recipe Menu"
          columns={columns}
          data={recipes}
          keyField="_id"
          onAddClick={() => setIsFormOpen(true)}
          pagination={{
            page,
            totalPages,
            total: total || recipes.length,
            limit
          }}
          onPageChange={(newPage) => fetchRecipes(newPage, limit)}
          onLimitChange={(newLimit) => {
            setLimit(newLimit);
            fetchRecipes(1, newLimit);
          }}
          loading={loading}
        />
      )}

      <FloatingFormCard
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title="Create New Recipe"
      >
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-slate-700">Dish Name</label>
            <input
              type="text"
              className="mt-1 block w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-emerald-500 sm:text-sm"
              placeholder="e.g. Pepperoni Pizza"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-sm font-semibold text-slate-700">Ingredients Required</label>
              <button
                type="button"
                onClick={addIngredientRow}
                className="text-xs flex items-center text-emerald-600 font-bold hover:text-emerald-700"
              >
                <Plus size={14} className="mr-1" /> Add Item
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-3 pr-2">
              {formData.recipeIngredients.map((row, index) => (
                <div key={index} className="flex gap-2 items-center animate-in fade-in slide-in-from-top-1">
                  <select
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                    value={row.ingredientId}
                    onChange={(e) => handleIngredientChange(index, 'ingredientId', e.target.value)}
                    required
                  >
                    <option value="">Select Ingredient</option>
                    {ingredientsList.map(ing => (
                      <option key={ing._id} value={ing._id}>{ing.name} ({ing.unit})</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    placeholder="Qty"
                    className="w-20 px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                    value={row.quantity}
                    onChange={(e) => handleIngredientChange(index, 'quantity', e.target.value)}
                    required
                  />
                  {formData.recipeIngredients.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeIngredientRow(index)}
                      className="p-2 text-slate-400 hover:text-red-500"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-600 text-white font-bold py-3 rounded-lg hover:bg-emerald-700 shadow-lg"
          >
            Create Recipe
          </button>
        </form>
      </FloatingFormCard>
    </div>
  );
};

export default RecipePage;
