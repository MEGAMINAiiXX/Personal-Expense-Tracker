import "./Sidebar.css";

const NAV = [
  { id: "dashboard",    icon: "⬡", label: "Dashboard" },
  { id: "transactions", icon: "↔", label: "Transactions" },
  { id: "analytics",   icon: "◈", label: "Analytics" },
  { id: "categories",  icon: "◉", label: "Categories" },
];

export default function Sidebar({ active, onNavigate }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="brand-icon">◈</span>
        <span className="brand-name">Fintrak</span>
      </div>

      <nav className="sidebar-nav">
        {NAV.map((n) => (
          <button
            key={n.id}
            className={`nav-item ${active === n.id ? "active" : ""}`}
            onClick={() => onNavigate(n.id)}
          >
            <span className="nav-icon">{n.icon}</span>
            <span className="nav-label">{n.label}</span>
            {active === n.id && <span className="nav-indicator" />}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-version">v1.0.0</div>
      </div>
    </aside>
  );
}
