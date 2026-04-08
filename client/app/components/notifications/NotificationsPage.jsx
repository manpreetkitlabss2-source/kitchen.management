import { useEffect } from "react";
import { Bell, CheckCheck, RefreshCw } from "lucide-react";
import { useNotifications } from "../../../hooks/useNotifications";

const NotificationsPage = () => {
  const {
    data, loading, error,
    page, totalPages,
    fetch, scan, markRead, markAll
  } = useNotifications();

  useEffect(() => {
    fetch(1);
  }, []);

  const handleScan = async () => {
    await scan();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Bell className="text-emerald-600" size={20} />
          <h1 className="text-lg font-bold text-slate-800 sm:text-2xl">Notifications</h1>
        </div>
        <div className="flex items-center gap-2">
          {/* Mobile: icon-only buttons */}
          <button
            onClick={handleScan}
            title="Scan Stock"
            className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition"
          >
            <RefreshCw size={14} />
            <span className="hidden sm:inline">Scan Stock</span>
          </button>
          <button
            onClick={markAll}
            title="Mark All Read"
            className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition"
          >
            <CheckCheck size={14} />
            <span className="hidden sm:inline">Mark All Read</span>
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500" />
        </div>
      ) : error ? (
        <div className="text-center py-20 text-red-500 text-sm">{error}</div>
      ) : data.length === 0 ? (
        <div className="text-center py-20 text-slate-400 text-sm">
          No notifications. Click "Scan Stock" to check inventory levels.
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {data.map((notif) => (
              <div
                key={notif._id}
                className={`flex items-start justify-between p-4 rounded-xl border shadow-sm transition ${
                  notif.is_read
                    ? "bg-white border-slate-200"
                    : notif.type === "out_of_stock"
                    ? "bg-red-50 border-red-200"
                    : "bg-orange-50 border-orange-200"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${
                      notif.is_read
                        ? "bg-slate-300"
                        : notif.type === "out_of_stock"
                        ? "bg-red-500"
                        : "bg-orange-500"
                    }`}
                  />
                  <div>
                    <p className={`text-sm ${notif.is_read ? "text-slate-500" : "text-slate-800 font-medium"}`}>
                      {notif.message}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {new Date(notif.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                {!notif.is_read && (
                  <button
                    onClick={() => markRead(notif._id)}
                    className="ml-4 text-xs text-emerald-600 font-semibold hover:underline flex-shrink-0"
                  >
                    Mark read
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-3 pt-2">
              <button
                onClick={() => fetch(page - 1)}
                disabled={page <= 1}
                className="px-3 py-1 text-sm rounded border border-slate-300 disabled:opacity-40 hover:bg-slate-50"
              >
                Prev
              </button>
              <span className="text-sm text-slate-600">Page {page} of {totalPages}</span>
              <button
                onClick={() => fetch(page + 1)}
                disabled={page >= totalPages}
                className="px-3 py-1 text-sm rounded border border-slate-300 disabled:opacity-40 hover:bg-slate-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default NotificationsPage;
