import api from "./axiosAuth";

export async function scanNotifications() {
  const response = await api.post("/notifications/scan");
  return response.data;
}

export async function fetchNotifications({ page = 1, limit = 20 } = {}) {
  const response = await api.get("/notifications", { params: { page, limit } });
  return response.data;
}

export async function fetchUnreadCount() {
  const response = await api.get("/notifications/unread-count");
  return response.data;
}

export async function markNotificationRead(id) {
  const response = await api.patch(`/notifications/${id}/read`);
  return response.data;
}

export async function markAllNotificationsRead() {
  const response = await api.patch("/notifications/read-all");
  return response.data;
}
