import { useEffect } from "react";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { LayoutDashboard, AlertTriangle, TrendingUp, ShoppingBasket } from "lucide-react";
import { useDashboard } from "../../../hooks/useDashboard";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const DashboardPage = () => {
  const { data, loading, error, refetch } = useDashboard();

  useEffect(() => {
    refetch();
  }, []);

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500" />
    </div>
  );

  if (error) return (
    <div className="flex justify-center py-20 text-red-500 text-sm">{error}</div>
  );

  if (!data) return null;

  const { summary, recent, metrics } = data;

  // --- Chart 1: Stock Status (Doughnut) ---
  const healthyStock = summary.totalIngredients - summary.lowStockCount - summary.outOfStockCount;
  const doughnutData = {
    labels: ['Healthy', 'Low Stock', 'Out of Stock'],
    datasets: [{
      data: [healthyStock, summary.lowStockCount, summary.outOfStockCount],
      backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
      hoverOffset: 4,
      borderWidth: 0,
    }]
  };

  // --- Chart 2: Consumption vs Waste (Bar) ---
  const barData = {
    labels: ['Consumption', 'Waste'],
    datasets: [{
      label: 'Volume',
      data: [metrics.consumptionTotal, metrics.wasteTotal],
      backgroundColor: ['#3b82f6', '#f43f5e'],
      borderRadius: 8,
    }]
  };

  // --- Chart 3: Top Ingredients in Stock (Horizontal Bar) ---
  const horizontalBarData = {
    labels: metrics.topStock.map(i => i.name),
    datasets: [{
      label: 'Current Stock',
      indexAxis: 'y',
      data: metrics.topStock.map(i => i.current_stock),
      backgroundColor: '#6366f1',
      borderRadius: 5,
    }]
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <LayoutDashboard className="text-emerald-600" />
        <h1 className="text-2xl font-bold text-slate-800">Business Overview</h1>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Ingredients" value={summary.totalIngredients} icon={<ShoppingBasket size={20} />} color="blue" />
        <StatCard title="Low Stock" value={summary.lowStockCount} icon={<AlertTriangle size={20} />} color="orange" />
        <StatCard title="Out of Stock" value={summary.outOfStockCount} icon={<AlertTriangle size={20} />} color="red" />
        <StatCard title="Total Waste" value={summary.totalWaste.toFixed(1)} icon={<TrendingUp size={20} />} color="emerald" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Doughnut Chart */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-600 mb-4 uppercase tracking-wider">Inventory Health</h3>
          <div className="h-[250px] flex justify-center">
            <Doughnut data={doughnutData} options={{ maintainAspectRatio: false }} />
          </div>
        </div>

        {/* Horizontal Bar Chart */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-600 mb-4 uppercase tracking-wider">Top Stock Levels</h3>
          <div className="h-[250px]">
            <Bar data={horizontalBarData} options={{ indexAxis: 'y', maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
          </div>
        </div>

        {/* Vertical Bar Chart */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-600 mb-4 uppercase tracking-wider">Usage vs Loss</h3>
          <div className="h-[250px]">
            <Bar data={barData} options={{ maintainAspectRatio: false }} />
          </div>
        </div>

        {/* Critical Low Stock Table */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <h3 className="text-sm font-semibold text-slate-600 mb-4 uppercase tracking-wider">Critical Low Stock</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Item</th>
                  <th className="px-4 py-2 font-medium">In Stock</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recent.lowStockItems.map((ing, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-3 font-medium text-slate-700">{ing.name}</td>
                    <td className="px-4 py-3">{ing.current_stock} {ing.unit}</td>
                    <td className="px-4 py-3">
                      <span className="text-red-600 text-xs font-bold px-2 py-0.5 bg-red-50 rounded">Action Required</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color }) => {
  const colors = {
    blue: "text-blue-600 bg-blue-50 border-blue-100",
    emerald: "text-emerald-600 bg-emerald-50 border-emerald-100",
    orange: "text-orange-600 bg-orange-50 border-orange-100",
    red: "text-red-600 bg-red-50 border-red-100",
  };

  return (
    <div className={`p-5 rounded-xl border shadow-sm ${colors[color]}`}>
      <div className="flex justify-between items-center">
        <div>
          <p className="text-xs font-bold uppercase opacity-80">{title}</p>
          <h2 className="text-2xl font-black mt-1">{value}</h2>
        </div>
        <div className="p-2 bg-white rounded-lg shadow-sm">
          {icon}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
