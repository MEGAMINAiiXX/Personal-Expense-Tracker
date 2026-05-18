import { useState, useEffect } from "react";
import { getSummary, getByCategory, getMonthly } from "../api";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from "recharts";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const fmt = (n) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
const YEARS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

export default function Analytics() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState("");
  const [summary, setSummary] = useState(null);
  const [monthly, setMonthly] = useState([]);
  const [byCatExpense, setByCatExpense] = useState([]);
  const [byCatIncome, setByCatIncome] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getSummary(year, month || undefined),
      getMonthly(year),
      getByCategory(year, month || undefined, "expense"),
      getByCategory(year, month || undefined, "income"),
    ]).then(([sum, mon, cats_e, cats_i]) => {
      setSummary(sum);
      setMonthly(mon.map(m => ({ ...m, name: MONTHS[m.month-1] })));
      setByCatExpense(cats_e);
      setByCatIncome(cats_i);
    }).finally(() => setLoading(false));
  }, [year, month]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">In-depth financial analysis</p>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <select className="filter-select" value={year} onChange={e => setYear(+e.target.value)}>
            {YEARS.map(y => <option key={y}>{y}</option>)}
          </select>
          <select className="filter-select" value={month} onChange={e => setMonth(e.target.value)}>
            <option value="">Full year</option>
            {MONTHS.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ display:"flex", gap:20, flexDirection:"column" }}>
          {[1,2,3].map(i=><div key={i} className="skeleton" style={{height:260,borderRadius:14}}/>)}
        </div>
      ) : (
        <>
          {/* KPI Strip */}
          <div className="grid-3" style={{ marginBottom:28 }}>
            {[
              { label:"Income",  value:fmt(summary?.income||0),  color:"var(--income)",  icon:"▲" },
              { label:"Expenses",value:fmt(summary?.expense||0), color:"var(--expense)", icon:"▼" },
              { label:"Balance", value:fmt(summary?.balance||0), color:(summary?.balance||0)>=0?"var(--income)":"var(--expense)", icon:"◈" },
            ].map(s=>(
              <div key={s.label} className="card" style={{ textAlign:"center" }}>
                <div style={{ fontSize:"1.5rem", marginBottom:8 }}>{s.icon}</div>
                <div style={{ fontSize:".8rem", color:"var(--text2)", textTransform:"uppercase", letterSpacing:".05em", marginBottom:6 }}>{s.label}</div>
                <div style={{ fontFamily:"var(--font-display)", fontSize:"1.8rem", fontWeight:700, color:s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Monthly Bar Chart */}
          <div className="card" style={{ marginBottom:24 }}>
            <div style={{ fontFamily:"var(--font-display)", fontWeight:700, marginBottom:20 }}>Monthly Income vs Expenses</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={monthly} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill:"var(--text2)", fontSize:11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill:"var(--text2)", fontSize:11 }} axisLine={false} tickLine={false} tickFormatter={v=>`$${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{background:"var(--surface3)",border:"1px solid var(--border2)",borderRadius:8}}
                  formatter={(v,n)=>[fmt(v),n]}
                />
                <Bar dataKey="income"  fill="var(--income)"  radius={[6,6,0,0]} name="Income" />
                <Bar dataKey="expense" fill="var(--expense)" radius={[6,6,0,0]} name="Expenses" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Net Balance Line */}
          <div className="card" style={{ marginBottom:24 }}>
            <div style={{ fontFamily:"var(--font-display)", fontWeight:700, marginBottom:20 }}>Net Balance Trend</div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill:"var(--text2)", fontSize:11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill:"var(--text2)", fontSize:11 }} axisLine={false} tickLine={false} tickFormatter={v=>`$${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{background:"var(--surface3)",border:"1px solid var(--border2)",borderRadius:8}}
                  formatter={(v)=>[fmt(v),"Balance"]}
                />
                <Line
                  type="monotone" dataKey="balance" stroke="var(--accent2)"
                  strokeWidth={2.5} dot={{ fill:"var(--accent)", r:4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Category Pies */}
          <div className="grid-2">
            {[
              { title:"Expenses by Category", data:byCatExpense },
              { title:"Income by Category",   data:byCatIncome  },
            ].map(({ title, data }) => (
              <div key={title} className="card">
                <div style={{ fontFamily:"var(--font-display)", fontWeight:700, marginBottom:20 }}>{title}</div>
                {data.length === 0 ? (
                  <div className="empty-state"><div className="icon">📊</div><p>No data</p></div>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={data} dataKey="total" nameKey="name" cx="50%" cy="50%" outerRadius={76} innerRadius={36} paddingAngle={3}>
                          {data.map((c, i) => <Cell key={i} fill={c.color} />)}
                        </Pie>
                        <Tooltip
                          contentStyle={{background:"var(--surface3)",border:"1px solid var(--border2)",borderRadius:8}}
                          formatter={v=>fmt(v)}
                        />
                        <Legend iconType="circle" iconSize={8} wrapperStyle={{fontSize:11,color:"var(--text2)"}} />
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Category list */}
                    <div style={{ marginTop:16, display:"flex", flexDirection:"column", gap:8 }}>
                      {data.map((c) => {
                        const tot = data.reduce((a,x)=>a+x.total,0);
                        const pct = tot ? (c.total/tot*100).toFixed(1) : 0;
                        return (
                          <div key={c.id} style={{ display:"flex", alignItems:"center", gap:8 }}>
                            <span style={{ fontSize:"1rem" }}>{c.icon}</span>
                            <div style={{ flex:1 }}>
                              <div style={{ display:"flex", justifyContent:"space-between", fontSize:".82rem", marginBottom:3 }}>
                                <span style={{ color:"var(--text2)" }}>{c.name}</span>
                                <span style={{ fontWeight:600 }}>{fmt(c.total)}</span>
                              </div>
                              <div style={{ background:"var(--surface2)", borderRadius:99, height:4 }}>
                                <div style={{ background:c.color, borderRadius:99, height:4, width:`${pct}%`, transition:"width .5s" }} />
                              </div>
                            </div>
                            <span style={{ fontSize:".78rem", color:"var(--text3)", width:38, textAlign:"right" }}>{pct}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      <style>{`
        .filter-select {
          background:var(--surface); border:1px solid var(--border);
          border-radius:var(--radius-sm); padding:9px 14px;
          color:var(--text); font-size:.875rem; outline:none;
          transition:border-color .2s; font-family:inherit;
          appearance:none; cursor:pointer;
        }
        .filter-select:focus { border-color:var(--accent); }
      `}</style>
    </div>
  );
}
