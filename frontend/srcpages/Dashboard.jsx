import { useState, useEffect } from "react";
import { getSummary, getByCategory, getMonthly, getTransactions } from "../api";
import { StatCard } from "../components/Card";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell, Legend,
} from "recharts";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const fmt = (n) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

export default function Dashboard({ onNavigate }) {
  const year = new Date().getFullYear();
  const [summary, setSummary] = useState(null);
  const [monthly, setMonthly] = useState([]);
  const [byCategory, setByCategory] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getSummary(year),
      getMonthly(year),
      getByCategory(year, null, "expense"),
      getTransactions({ limit: 8 }),
    ]).then(([sum, mon, cats, txList]) => {
      setSummary(sum);
      setMonthly(mon.map((m) => ({ ...m, name: MONTHS[m.month - 1] })));
      setByCategory(cats.slice(0, 6));
      setRecent(txList.items);
    }).finally(() => setLoading(false));
  }, [year]);

  if (loading) return (
    <div className="page">
      <div style={{ display:"flex", gap:20, marginBottom:20 }}>
        {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{height:100,flex:1,borderRadius:14}} />)}
      </div>
    </div>
  );

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Financial overview for {year}</p>
        </div>
        <button className="btn btn-primary" onClick={() => onNavigate("transactions")}>
          + Add Transaction
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid-4" style={{ marginBottom: 28 }}>
        <StatCard
          label="Total Income" icon="▲"
          value={fmt(summary?.income || 0)}
          color="var(--income)"
        />
        <StatCard
          label="Total Expenses" icon="▼"
          value={fmt(summary?.expense || 0)}
          color="var(--expense)"
        />
        <StatCard
          label="Net Balance" icon="◈"
          value={fmt(summary?.balance || 0)}
          color={(summary?.balance || 0) >= 0 ? "var(--income)" : "var(--expense)"}
        />
        <StatCard
          label="Savings Rate" icon="◉"
          value={summary?.income ? `${Math.max(0, ((summary.income - summary.expense) / summary.income * 100)).toFixed(0)}%` : "—"}
          color="var(--accent2)"
        />
      </div>

      {/* Charts row */}
      <div className="grid-2" style={{ marginBottom: 28 }}>
        {/* Monthly Area Chart */}
        <div className="card">
          <div className="card-title" style={{fontFamily:"var(--font-display)",fontWeight:700,marginBottom:20}}>
            Monthly Flow
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthly}>
              <defs>
                <linearGradient id="gi" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#34d399" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="ge" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f87171" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#f87171" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="name" tick={{fill:"#9191a8",fontSize:11}} axisLine={false} tickLine={false} />
              <YAxis tick={{fill:"#9191a8",fontSize:11}} axisLine={false} tickLine={false} tickFormatter={v=>`$${(v/1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{background:"var(--surface3)",border:"1px solid var(--border2)",borderRadius:8,color:"var(--text)"}}
                formatter={(v, n) => [fmt(v), n]}
              />
              <Area type="monotone" dataKey="income"  stroke="#34d399" fill="url(#gi)" strokeWidth={2} name="Income" />
              <Area type="monotone" dataKey="expense" stroke="#f87171" fill="url(#ge)" strokeWidth={2} name="Expense" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="card">
          <div className="card-title" style={{fontFamily:"var(--font-display)",fontWeight:700,marginBottom:20}}>
            Expenses by Category
          </div>
          {byCategory.length === 0 ? (
            <div className="empty-state"><div className="icon">📊</div><p>No expense data</p></div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={byCategory} dataKey="total" nameKey="name" cx="50%" cy="50%" outerRadius={80} paddingAngle={3}>
                  {byCategory.map((c, i) => (
                    <Cell key={i} fill={c.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{background:"var(--surface3)",border:"1px solid var(--border2)",borderRadius:8}}
                  formatter={(v) => fmt(v)}
                />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{fontSize:12,color:"var(--text2)"}} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent transactions */}
      <div className="card">
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
          <div style={{fontFamily:"var(--font-display)",fontWeight:700}}>Recent Transactions</div>
          <button className="btn btn-ghost btn-sm" onClick={() => onNavigate("transactions")}>View all →</button>
        </div>
        {recent.length === 0 ? (
          <div className="empty-state"><div className="icon">💸</div><p>No transactions yet</p></div>
        ) : (
          <div className="tx-list">
            {recent.map((tx) => (
              <div key={tx.id} className="tx-row">
                <div className="tx-icon">{tx.category?.icon || "💰"}</div>
                <div className="tx-info">
                  <div className="tx-desc">{tx.description || tx.category?.name || "—"}</div>
                  <div className="tx-meta">{tx.category?.name} · {tx.date}</div>
                </div>
                <div className={`tx-amount ${tx.type}`}>
                  {tx.type === "income" ? "+" : "-"}{fmt(tx.amount)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .tx-list { display:flex; flex-direction:column; gap:4px; }
        .tx-row {
          display:flex; align-items:center; gap:12px;
          padding:10px 12px; border-radius:var(--radius-sm);
          transition: background .15s;
        }
        .tx-row:hover { background:var(--surface2); }
        .tx-icon { font-size:1.3rem; width:36px; height:36px; display:flex; align-items:center; justify-content:center; background:var(--surface2); border-radius:8px; flex-shrink:0; }
        .tx-info { flex:1; }
        .tx-desc { font-size:.9rem; font-weight:500; }
        .tx-meta { font-size:.78rem; color:var(--text3); margin-top:1px; }
        .tx-amount { font-family:var(--font-display); font-size:.95rem; font-weight:600; }
        .tx-amount.income  { color:var(--income); }
        .tx-amount.expense { color:var(--expense); }
      `}</style>
    </div>
  );
}
