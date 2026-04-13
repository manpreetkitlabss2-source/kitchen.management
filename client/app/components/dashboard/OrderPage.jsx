import { useState, useEffect } from "react";
import { ShoppingCart, Plus, Trash2 } from "lucide-react";
import DataGrid from "../utils/DataGrid";
import { FloatingFormCard } from "../utils/FloatingFormCard";
import { useOrders } from "../../../hooks/useOrders";
import { useRecipes } from "../../../hooks/useRecipes";

const defaultItem = () => ({ recipe_id: '', quantity: 1 });

const OrderPage = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [orderItems, setOrderItems] = useState([defaultItem()]);
  const [limit, setLimit] = useState(10);

  const { data: orders, loading, fetch: fetchOrders, place, page, totalPages, total } = useOrders();
  const { data: recipes, fetch: fetchRecipes } = useRecipes();

  useEffect(() => {
    fetchOrders(1, limit);
    fetchRecipes(1, 100);
  }, []);

  const handleItemChange = (index, field, value) => {
    const updated = [...orderItems];
    updated[index][field] = value;
    setOrderItems(updated);
  };

  const addRow = () => setOrderItems([...orderItems, defaultItem()]);
  const removeRow = (index) => setOrderItems(orderItems.filter((_, i) => i !== index));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const invalid = orderItems.some(i => !i.recipe_id || Number(i.quantity) < 1);
    if (invalid) return alert("Please fill all items with valid quantities.");
    try {
      await place({
        items: orderItems.map(i => ({
          recipe_id: i.recipe_id,
          quantity: Number(i.quantity),
        }))
      });
      alert("Order placed successfully!");
      setOrderItems([defaultItem()]);
      setIsFormOpen(false);
      fetchOrders(1, limit);
    } catch (err) {
      alert(err.response?.data?.error || "Error placing order");
    }
  };

  const todayOrders = orders.filter(o =>
    o.created_at?.startsWith(new Date().toISOString().split('T')[0])
  ).length;

  const columns = [
    {
      key: "created_at",
      label: "Date",
      sortable: true,
      render: (o) => new Date(o.created_at).toLocaleDateString()
    },
    {
      key: "items",
      label: "Recipes",
      sortable: false,
      render: (o) => (
        <div className="space-y-0.5">
          {o.items?.map((item, i) => (
            <div key={i} className="text-xs text-slate-600">
              {item.recipe_name} <span className="text-slate-400">× {item.quantity}</span>
            </div>
          ))}
        </div>
      )
    },
    {
      key: "status",
      label: "Status",
      sortable: false,
      render: (o) => (
        <span className="px-2 py-1 rounded text-xs font-bold text-emerald-600 bg-emerald-50">
          {o.status}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-slate-500 text-sm font-medium">Orders Today</p>
          <h2 className="text-3xl font-bold text-slate-900 mt-1">
            {todayOrders < 10 ? `0${todayOrders}` : todayOrders}
          </h2>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-emerald-500">
          <p className="text-slate-500 text-sm font-medium">Total Orders</p>
          <h2 className="text-3xl font-bold text-emerald-600 mt-1">{total}</h2>
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
        <DataGrid
          title="Order History"
          columns={columns}
          data={orders}
          keyField="_id"
          onAddClick={() => setIsFormOpen(true)}
          pagination={{ page, totalPages, total, limit }}
          onPageChange={(newPage) => fetchOrders(newPage, limit)}
          onLimitChange={(newLimit) => { setLimit(newLimit); fetchOrders(1, newLimit); }}
          loading={loading}
        />
      )}

      <FloatingFormCard
        isOpen={isFormOpen}
        onClose={() => { setIsFormOpen(false); setOrderItems([defaultItem()]); }}
        title="Place New Order"
      >
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-sm font-semibold text-slate-700">Order Items</label>
              <button
                type="button"
                onClick={addRow}
                className="text-xs flex items-center text-emerald-600 font-bold hover:text-emerald-700"
              >
                <Plus size={14} className="mr-1" /> Add Recipe
              </button>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-3 pr-1">
              {orderItems.map((item, index) => (
                <div key={index} className="flex gap-2 items-center animate-in fade-in slide-in-from-top-1">
                  <select
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                    value={item.recipe_id}
                    onChange={(e) => handleItemChange(index, 'recipe_id', e.target.value)}
                    required
                  >
                    <option value="">Select Recipe...</option>
                    {recipes.map(r => (
                      <option key={r._id || r.id} value={r._id || r.id}>{r.name}</option>
                    ))}
                  </select>

                  <input
                    type="number"
                    min="1"
                    placeholder="Qty"
                    className="w-20 px-3 py-2 bg-white border border-emerald-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 shadow-sm"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                    required
                  />

                  {orderItems.length > 1 && (
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

          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-emerald-600 text-white font-bold py-3 rounded-lg hover:bg-emerald-700 shadow-lg flex items-center justify-center gap-2 transition-all ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
            ) : (
              <><ShoppingCart size={20} /> Confirm Order</>
            )}
          </button>
        </form>
      </FloatingFormCard>
    </div>
  );
};

export default OrderPage;
