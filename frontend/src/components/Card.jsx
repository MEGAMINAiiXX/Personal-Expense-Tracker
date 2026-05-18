import "./Card.css";

export default function Card({ children, className = "", style, onClick }) {
  return (
    <div className={`card ${className} ${onClick ? "card-clickable" : ""}`} style={style} onClick={onClick}>
      {children}
    </div>
  );
}

export function StatCard({ label, value, sub, color, icon, trend }) {
  return (
    <div className="stat-card" style={{ "--accent-color": color }}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-body">
        <div className="stat-label">{label}</div>
        <div className="stat-value" style={{ color }}>{value}</div>
        {sub && <div className="stat-sub">{sub}</div>}
      </div>
      {trend !== undefined && (
        <div className={`stat-trend ${trend >= 0 ? "up" : "down"}`}>
          {trend >= 0 ? "▲" : "▼"} {Math.abs(trend).toFixed(1)}%
        </div>
      )}
    </div>
  );
}
