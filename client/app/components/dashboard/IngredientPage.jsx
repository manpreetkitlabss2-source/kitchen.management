import { useState, useEffect } from "react";
import DataGrid from "../utils/DataGrid";
import { FloatingFormCard } from "../utils/FloatingFormCard";
import { useIngredients } from "../../../hooks/useIngredients";

const IngredientPage = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState(null);
  const [limit, setLimit] = useState(10);

  const [editFormData, setEditFormData] = useState({
    name: "",
    unit: "kg",
    currentStock: 0,
    minThreshold: ""
  });

  const [formData, setFormData] = useState({
    name: '',
    unit: 'kg',
    currentStock: 0,
    minThreshold: ''
  });

  const { data: ingredients, loading, error, fetch, add, update, page, totalPages, total } = useIngredients();

  useEffect(() => {
    fetch(1, limit);
  }, []);

  const lowStockItems = ingredients.filter(
    (ing) => ing.current_stock > 0 && ing.current_stock < ing.threshold_value
  ).length;
  const totalItems = total || ingredients.length;
  const outOfStockItems = ingredients.filter(item => Number(item.current_stock) <= 0).length;

  const handleEditClick = (item) => {
    setEditingIngredient(item);
    setEditFormData({
      name: item.name,
      unit: item.unit,
      currentStock: item.current_stock,
      minThreshold: item.threshold_value
    });
    setIsEditFormOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await update({
        _id: editingIngredient._id,
        name: editFormData.name,
        unit: editFormData.unit,
        current_stock: Number(editFormData.currentStock),
        threshold_value: Number(editFormData.minThreshold)
      });
      alert("Ingredient updated successfully");
      setIsEditFormOpen(false);
      fetch(page, limit);
    } catch (err) {
      alert("Failed to update ingredient");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await add({
        name: formData.name,
        unit: formData.unit,
        currentStock: Number(formData.currentStock),
        minThreshold: Number(formData.minThreshold || 0),
      });
      setFormData({ name: '', unit: 'kg', minThreshold: '', currentStock: 0 });
      setIsFormOpen(false);
      alert("Ingredient added successfully!");
      fetch(1, limit);
    } catch (err) {
      alert("Failed to save ingredient.");
    }
  };

  const columns = [
    {
      key: "name",
      label: "Name",
      sortable: true,
    },
    {
      key: "unit",
      label: "Unit",
      sortable: true,
    },
    {
      key: "current_stock",
      label: "Stock Level",
      sortable: true,
    },
    {
      key: "threshold_value",
      label: "Threshold",
      sortable: true,
    },
    {
      key: "status",
      label: "Status",
      sortable: false,
      render: (item) => (
        <span className={`px-2 py-1 rounded text-xs font-bold ${item.current_stock <= 0
          ? "text-red-700 bg-red-100"
          : item.current_stock <= item.threshold_value
            ? "text-orange-600 bg-orange-50"
            : "text-emerald-600 bg-emerald-50"
          }`}>
          {item.current_stock <= 0 ? "Out of Stock" : item.current_stock <= item.threshold_value ? "Low Stock" : "In Stock"}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      align: "right",
      render: (item) => (
        <button
          onClick={() => handleEditClick(item)}
          className="px-3 py-1 text-xs font-semibold rounded bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
        >
          Edit
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-slate-500 text-sm font-medium">Total Ingredients</p>
          <h2 className="text-3xl font-bold text-slate-900 mt-1">{totalItems}</h2>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-orange-500">
          <p className="text-slate-500 text-sm font-medium">Low Stock Items</p>
          <h2 className="text-3xl font-bold text-orange-600 mt-1">
            {lowStockItems < 10 ? `0${lowStockItems}` : lowStockItems}
          </h2>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-red-500">
          <p className="text-slate-500 text-sm font-medium">Out of Stock</p>
          <h2 className="text-3xl font-bold text-red-600 mt-1">
            {outOfStockItems < 10 ? `0${outOfStockItems}` : outOfStockItems}
          </h2>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
        </div>
      ) : (
        <DataGrid
          title="Ingredient Inventory"
          columns={columns}
          data={ingredients}
          keyField="_id"
          onAddClick={() => setIsFormOpen(true)}
          pagination={{
            page,
            totalPages,
            total: totalItems,
            limit
          }}
          onPageChange={(newPage) => fetch(newPage, limit)}
          onLimitChange={(newLimit) => {
            setLimit(newLimit);
            fetch(1, newLimit);
          }}
          loading={loading}
        />
      )}

      <FloatingFormCard
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title="Add New Ingredient"
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-slate-700">Ingredient Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="mt-1 block w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
              placeholder="e.g. Mozzarella"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Unit</label>
              <select
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
              >
                <option value="kg">kg</option>
                <option value="Liters">Liters</option>
                <option value="Pieces">Pieces</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Min. Threshold</label>
              <input
                type="number"
                name="minThreshold"
                value={formData.minThreshold}
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                placeholder="5"
                required
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700">Initial Stock</label>
              <input
                type="number"
                name="currentStock"
                value={formData.currentStock}
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                placeholder="0"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-600 text-white font-bold py-3 rounded-lg hover:bg-emerald-700 transition-all shadow-lg mt-4"
          >
            Save Ingredient
          </button>
        </form>
      </FloatingFormCard>

      <FloatingFormCard
        isOpen={isEditFormOpen}
        onClose={() => setIsEditFormOpen(false)}
        title="Edit Ingredient"
      >
        <form className="space-y-4" onSubmit={handleEditSubmit}>
          <div>
            <label className="block text-sm font-medium text-slate-700">Ingredient Name</label>
            <input
              type="text"
              name="name"
              value={editFormData.name}
              onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
              className="mt-1 block w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Unit</label>
              <select
                value={editFormData.unit}
                onChange={(e) => setEditFormData({ ...editFormData, unit: e.target.value })}
                className="mt-1 block w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg"
              >
                <option value="kg">kg</option>
                <option value="Liters">Liters</option>
                <option value="Pieces">Pieces</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Min Threshold</label>
              <input
                type="number"
                value={editFormData.minThreshold}
                onChange={(e) => setEditFormData({ ...editFormData, minThreshold: e.target.value })}
                className="mt-1 block w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg"
                required
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700">Current Stock</label>
              <input
                type="number"
                value={editFormData.currentStock}
                onChange={(e) => setEditFormData({ ...editFormData, currentStock: e.target.value })}
                className="mt-1 block w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition shadow-lg"
          >
            Update Ingredient
          </button>
        </form>
      </FloatingFormCard>
    </div>
  );
};

export default IngredientPage;
