import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
  // Option A: Using layout() → No extra URL segment (clean URLs)
  layout("components/dashboard/AdminLayout.jsx", [
    index("components/dashboard/DashboardPage.jsx"),
    route("recipes", "components/dashboard/RecipePage.jsx"),
    route("ingredients", "components/dashboard/IngredientPage.jsx"),
    route("consumption", "components/dashboard/ConsumptionPage.jsx"),
    route("waste", "components/dashboard/WasteManagementPage.jsx"),
    route("notifications", "components/notifications/NotificationsPage.jsx"),
  ]),


  route("login", "components/auth/Login.jsx"),
  route("signup", "components/auth/Signup.jsx"),
] satisfies RouteConfig;