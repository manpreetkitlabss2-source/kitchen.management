import { useState, useEffect } from "react";
import { Trash2, Info } from "lucide-react";
import DataGrid from "../utils/DataGrid";
import { FloatingFormCard } from "../utils/FloatingFormCard";
import { useWaste } from "../../../hooks/useWaste";
import { useIngredients } from "../../../hooks/useIngredients";
import ToastContainer from "../utils/Toast";
import { useToast } from "../../../hooks/useToast";

const WasteManagementPage = () => {
  const { toasts, remove, success, error: toastError, warning } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [limit, setLimit] = useState(10);
  const [formData, setFormData] = useState({ ingredientId: "", quantity: "", reason: "" });

  const { data: wasteLogs, loading, fetch: fetchWaste, log: logWaste, page, totalPages, total } = useWaste();
  const { data: ingredients, fetch: fetchIngredients } = useIngredients();

  useEffect(() => { fetchWaste(1, limit); fetchIngredients(1); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { ingredientId, quantity, reason } = formData;
    if (!ingredientId || !quantity || !reason) {
      warning('Missing Fields', 'Please fill in all fields: ingredient, quantity, and reason.');
      return;
    }
    const selected = ingredients.find(i => i._id === ingredientId);
    if (selected && Number(quantity) > selected.current_stock) {
      toastError('Invalid Quantity', `Quantity exceeds current stock of ${selected.current_stock} ${selected.unit}.`);
      return;
    }
    try {
      await logWaste({ ingredientId, quantity, reason });
      success('Waste Logged', 'Waste entry recorded and stock deducted successfully.');
      setFormData({ ingredientId: "", quantity: "", reason: "" });
      setIsFormOpen(false);
      fetchWaste(1, limit);
    } catch (err) {
      toastError('Log Failed', err.response?.data?.message || err.response?.data?.error || 'Could not log waste. Please try again.');
    }
  };

  const today = new Date().toISOString().split("T")[0];
  const logsToday = wasteLogs.filter(log => log.created_at?.startsWith(today)).length;
  const totalWaste = wasteLogs.reduce((acc, curr) => acc + (curr.quantity || 0), 0);
  const uniqueItems = new Set(wasteLogs.map(log => log.ingredient_id?._id || log.ingredient_id)).size;

  const columns = [
    { key: "created_at", label: "Date", sortable: true, render: (log) => new Date(log.created_at).toLocaleDateString() },
    { key: "ingredient_id", label: "Ingredient", sortable: false, render: (log) => log.ingredient_id?.name || "Unknown" },
    { key: "quantity", label: "Quantity", sortable: true, render: (log) => `${log.quantity} ${log.ingredient_id?.unit || ""}` },
    { key: "reason", label: "Reason", sortable: true, render: (log) => <span className="px-2 py-1 rounded text-xs font-bold text-red-600 bg-red-50">{log.reason}</span> }
  ];

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} onRemove={remove} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-slate-500 text-sm font-medium">Waste Logs Today</p>
          <h2 className="text-3xl font-bold text-slate-900 mt-1">{logsToday < 10 ? `0${logsToday}` : logsToday}</h2>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-red-500">
          <p className="text-slate-500 text-sm font-medium">Total Waste Volume</p>
          <h2 className="text-3xl font-bold text-red-600 mt-1">{totalWaste.toFixed(1)}</h2>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-amber-500">
          <p className="text-slate-500 text-sm font-medium">Affected Ingredients</p>
          <h2 className="text-3xl font-bold text-amber-600 mt-1">{uniqueItems}</h2>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500" /></div>
      ) : (
        <DataGrid title="Waste History" columns={columns} data={wasteLogs} keyField="_id" onAddClick={() => setIsFormOpen(true)}
          pagination={{ page, totalPages, total: total || wasteLogs.length, limit }}
          onPageChange={(p) => fetchWaste(p, limit)}
          onLimitChange={(l) => { setLimit(l); fetchWaste(1, l); }}
          loading={loading}
        />
      )}

      <FloatingFormCard isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title="Log Ingredient Waste">
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="bg-red-50 p-4 rounded-lg flex items-start gap-3 border border-red-100">
            <Info className="text-red-500 mt-0.5" size={18} />
            <p className="text-xs text-red-700 leading-relaxed">Logging waste will automatically deduct the specified quantity from inventory and maintain a permanent waste history record.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Ingredient</label>
            <select required value={formData.ingredientId} onChange={(e) => setFormData({ ...formData, ingredientId: e.target.value })} className="mt-1 block w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500">
              <option value="">Select ingredient...</option>
              {ingredients.map(ing => <option key={ing._id} value={ing._id}>{ing.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Quantity Wasted</label>
            <input type="number" step="0.01" required placeholder="e.g. 2.5" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} className="mt-1 block w-full px-4 py-3 bg-white border border-red-300 rounded-lg text-sm shadow-sm focus:ring-2 focus:ring-red-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Reason</label>
            <select required value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} className="mt-1 block w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500">
              <option value="">Select reason...</option>
              <option value="Expired">Expired</option>
              <option value="Spoiled">Spoiled</option>
              <option value="Overcooked">Overcooked</option>
              <option value="Damaged">Damaged</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <button type="submit" disabled={loading} className={`w-full bg-red-600 text-white font-bold py-3 rounded-lg hover:bg-red-700 shadow-lg flex items-center justify-center gap-2 transition-all ${loading ? "opacity-70 cursor-not-allowed" : ""}`}>
            <Trash2 size={20} /> Log Waste & Deduct Stock
          </button>
        </form>
      </FloatingFormCard>
    </div>
  );
};

export default WasteManagementPage;
