import { Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import DataGrid from "../utils/DataGrid";
import { FloatingFormCard } from "../utils/FloatingFormCard";
import { useIngredients } from "../../../hooks/useIngredients";
import ToastContainer from "../utils/Toast";
import { useToast } from "../../../hooks/useToast";

const IngredientPage = () => {
  const { toasts, remove, success, error: toastError } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState(null);
  const [limit, setLimit] = useState(10);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [editFormData, setEditFormData] = useState({ name: "", unit: "kg", currentStock: 0, minThreshold: "" });
  const [formData, setFormData] = useState({ name: '', unit: 'kg', currentStock: 0, minThreshold: '' });

  const { data: ingredients, loading, fetch, add, update, remove: removeIngredient, page, totalPages, total } = useIngredients();

  useEffect(() => { fetch(1, limit); }, []);

  const lowStockItems = ingredients.filter(i => i.current_stock > 0 && i.current_stock < i.threshold_value).length;
  const totalItems = total || ingredients.length;
  const outOfStockItems = ingredients.filter(i => Number(i.current_stock) <= 0).length;

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await removeIngredient(deleteTarget._id);
      success('Ingredient Deleted', `"${deleteTarget.name}" has been removed from inventory.`);
      setDeleteTarget(null);
      fetch(page, limit);
    } catch {
      toastError('Delete Failed', 'Could not delete this ingredient. Please try again.');
      setDeleteTarget(null);
    }
  };

  const handleEditClick = (item) => {
    setEditingIngredient(item);
    setEditFormData({ name: item.name, unit: item.unit, currentStock: item.current_stock, minThreshold: item.threshold_value });
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
      success('Ingredient Updated', `"${editFormData.name}" has been updated successfully.`);
      setIsEditFormOpen(false);
      fetch(page, limit);
    } catch (err) {
      toastError('Update Failed', err.response?.data?.error || 'Could not update ingredient. Please try again.');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await add({ name: formData.name, unit: formData.unit, currentStock: Number(formData.currentStock), minThreshold: Number(formData.minThreshold || 0) });
      setFormData({ name: '', unit: 'kg', minThreshold: '', currentStock: 0 });
      setIsFormOpen(false);
      success('Ingredient Added', `"${formData.name}" has been added to inventory.`);
      fetch(1, limit);
    } catch (err) {
      toastError('Save Failed', err.response?.data?.error || 'Could not save ingredient. Please try again.');
    }
  };

  const columns = [
    { key: "name", label: "Name", sortable: true },
    { key: "unit", label: "Unit", sortable: true },
    { key: "current_stock", label: "Stock Level", sortable: true },
    { key: "threshold_value", label: "Threshold", sortable: true },
    {
      key: "status", label: "Status", sortable: false,
      render: (item) => (
        <span className={`px-2 py-1 rounded text-xs font-bold ${item.current_stock <= 0 ? "text-red-700 bg-red-100" : item.current_stock < item.threshold_value ? "text-orange-600 bg-orange-50" : "text-emerald-600 bg-emerald-50"}`}>
          {item.current_stock <= 0 ? "Out of Stock" : item.current_stock < item.threshold_value ? "Low Stock" : "In Stock"}
        </span>
      ),
    },
    {
      key: "actions", label: "Actions", sortable: false, align: "right",
      render: (item) => (
        <div className="flex gap-2 justify-end">
          <button onClick={() => handleEditClick(item)} className="px-3 py-1 text-xs font-semibold rounded bg-blue-50 text-blue-600 hover:bg-blue-100 transition">Edit</button>
          <button onClick={() => setDeleteTarget(item)} className="px-2 py-1 text-xs font-semibold rounded bg-red-50 text-red-600 hover:bg-red-100 transition"><Trash2 size={14} /></button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} onRemove={remove} />

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <Trash2 size={18} className="text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-800">Delete Ingredient</h3>
                <p className="text-xs text-slate-500 mt-0.5">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-slate-600">Are you sure you want to delete <strong>"{deleteTarget.name}"</strong>?</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 px-4 py-2 text-sm font-medium text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition">Cancel</button>
              <button onClick={handleDelete} className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition">Delete</button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-slate-500 text-sm font-medium">Total Ingredients</p>
          <h2 className="text-3xl font-bold text-slate-900 mt-1">{totalItems}</h2>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-orange-500">
          <p className="text-slate-500 text-sm font-medium">Low Stock Items</p>
          <h2 className="text-3xl font-bold text-orange-600 mt-1">{lowStockItems < 10 ? `0${lowStockItems}` : lowStockItems}</h2>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-red-500">
          <p className="text-slate-500 text-sm font-medium">Out of Stock</p>
          <h2 className="text-3xl font-bold text-red-600 mt-1">{outOfStockItems < 10 ? `0${outOfStockItems}` : outOfStockItems}</h2>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" /></div>
      ) : (
        <DataGrid title="Ingredient Inventory" columns={columns} data={ingredients} keyField="_id" onAddClick={() => setIsFormOpen(true)}
          pagination={{ page, totalPages, total: totalItems, limit }}
          onPageChange={(p) => fetch(p, limit)}
          onLimitChange={(l) => { setLimit(l); fetch(1, l); }}
          loading={loading}
        />
      )}

      <FloatingFormCard isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title="Add New Ingredient">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-slate-700">Ingredient Name</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} className="mt-1 block w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm" placeholder="e.g. Mozzarella" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Unit</label>
              <select name="unit" value={formData.unit} onChange={handleChange} className="mt-1 block w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm">
                <option value="kg">kg</option><option value="Liters">Liters</option><option value="Pieces">Pieces</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Min. Threshold</label>
              <input type="number" name="minThreshold" value={formData.minThreshold} onChange={handleChange} className="mt-1 block w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm" placeholder="5" required />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700">Initial Stock</label>
              <input type="number" name="currentStock" value={formData.currentStock} onChange={handleChange} className="mt-1 block w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm" placeholder="0" required />
            </div>
          </div>
          <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-3 rounded-lg hover:bg-emerald-700 transition-all shadow-lg mt-4">Save Ingredient</button>
        </form>
      </FloatingFormCard>

      <FloatingFormCard isOpen={isEditFormOpen} onClose={() => setIsEditFormOpen(false)} title="Edit Ingredient">
        <form className="space-y-4" onSubmit={handleEditSubmit}>
          <div>
            <label className="block text-sm font-medium text-slate-700">Ingredient Name</label>
            <input type="text" name="name" value={editFormData.name} onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })} className="mt-1 block w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Unit</label>
              <select value={editFormData.unit} onChange={(e) => setEditFormData({ ...editFormData, unit: e.target.value })} className="mt-1 block w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg">
                <option value="kg">kg</option><option value="Liters">Liters</option><option value="Pieces">Pieces</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Min Threshold</label>
              <input type="number" value={editFormData.minThreshold} onChange={(e) => setEditFormData({ ...editFormData, minThreshold: e.target.value })} className="mt-1 block w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg" required />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700">Current Stock</label>
              <input type="number" value={editFormData.currentStock} onChange={(e) => setEditFormData({ ...editFormData, currentStock: e.target.value })} className="mt-1 block w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg" required />
            </div>
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition shadow-lg">Update Ingredient</button>
        </form>
      </FloatingFormCard>
    </div>
  );
};

export default IngredientPage;
