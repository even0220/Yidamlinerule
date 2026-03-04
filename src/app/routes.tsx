import { createBrowserRouter, Navigate } from "react-router";
import MainLayout from "./layout/MainLayout";
import GlobalRuleBuilder from "./pages/GlobalRuleBuilder";
import TemplateManagement from "./pages/TemplateManagement";
import ShipmentDetails from "./pages/ShipmentDetails";

function RedirectToRules() {
  return <Navigate to="/rules" replace />;
}

function NotFound() {
  return <div className="p-8 text-slate-500">404 - 页面未找到</div>;
}

export const router = createBrowserRouter([
  {
    path: "/",
    Component: MainLayout,
    children: [
      { index: true, Component: RedirectToRules },
      { path: "rules", Component: GlobalRuleBuilder },
      { path: "templates", Component: TemplateManagement },
      { path: "shipments", Component: ShipmentDetails },
      { path: "*", Component: NotFound },
    ],
  },
]);