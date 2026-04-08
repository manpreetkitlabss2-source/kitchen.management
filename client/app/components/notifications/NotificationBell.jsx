import { useEffect } from "react";
import { Bell } from "lucide-react";
import { Link } from "react-router";
import { useNotifications } from "../../../hooks/useNotifications";

const NotificationBell = () => {
  const { unreadCount, loadUnreadCount } = useNotifications();

  useEffect(() => {
    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Link
      to="/notifications"
      className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
      aria-label="Notifications"
    >
      <Bell size={22} />
      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </Link>
  );
};

export default NotificationBell;
