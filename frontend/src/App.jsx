import { useState } from "react";
import { ToastProvider } from "./ToastContext";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import Categories from "./pages/Categories";
import Analytics from "./pages/Analytics";
import "./App.css";

const PAGES = {
  dashboard: Dashboard,
  transactions: Transactions,
  categories: Categories,
  analytics: Analytics,
};

export default function App() {
  const [page, setPage] = useState("dashboard");
  const Page = PAGES[page] || Dashboard;

  return (
    <ToastProvider>
      <div className="app-shell">
        <Sidebar active={page} onNavigate={setPage} />
        <main className="app-main">
          <Page onNavigate={setPage} />
        </main>
      </div>
    </ToastProvider>
  );
}
