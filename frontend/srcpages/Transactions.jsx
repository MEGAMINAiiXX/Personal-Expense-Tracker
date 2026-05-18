import { useState, useEffect, useCallback } from "react";
import {
  getTransactions, createTransaction, updateTransaction, deleteTransaction,
  getCategories, exportCSV,
} from "../api";
import TransactionModal from "../components/TransactionModal";
import { useToast } from "../ToastContext";

const fmt = (n) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
const PAGE = 20;

export default function Transactions() {
  const toast = useToast();
  const [txs, setTxs] = useState([]);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | "new" | transaction obj
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState({
    search: "", type: "", category_id: "", date_from: "", date_to: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getTransactions({ ...filters, skip: page * PAGE, limit: PAGE });
      setTxs(data.items);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => { getCategories().then(setCategories); }, []);
  useEffect(() => { load(); }, [load]);

  const setFilter = (k, v) => { setFilters((f) => ({ ...f, [k]: v })); setPage(0); };

  const handleSave = async (form) => {
    try {
      if (modal === "new") {
        await createTransaction(form);
        toast("Transaction added!", "success");
      } else {
        await updateTransaction(modal.id, form);
        toast("Transaction updated!", "success");
      }
      setModal(null);
      load();
    } catch (e) {
      toast(e.message, "error");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this transaction?")) return;
    try {
      await deleteTransaction(id);
      toast("Deleted.", "success");
      load();
    } catch (e) {
      toast(e.message, "error");
    }
  };

  const totalPages = Math.ceil(total / PAGE);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Transactions</h1>
          <p className="page-subtitle">{total} records</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-ghost" onClick={() => exportCSV(filters)}>⬇ Export CSV</button>
          <button className="btn btn-primary" onClick={() => setModal("new")}>+ Add</button>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <input
          className="filter-input"
          placeholder="🔍  Search..."
          value={filters.search}
          onChange={(e) => setFilter("search", e.target.value)}
        />
        <select className="filter-select" value={filters.type} onChange={(e) => setFilter("type", e.target.value)}>
          <option value="">All types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
        <select className="filter-select" value={filters.category_id} onChange={(e) => setFilter("category_id", e.target.value)}>
          <option value="">All categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
        </select>
        <input type="date" className="filter-input" value={filters.date_from} onChange={(e) => setFilter("date_from", e.target.value)} />
        <input type="date" className="filter-input" value={filters.date_to} onChange={(e) => setFilter("date_to", e.target.value)} />
        {Object.values(filters).some(Boolean) && (
          <button className="btn btn-ghost btn-sm" onClick={() => { setFilters({ search:"",type:"",category_id:"",date_from:"",date_to:"" }); setPage(0); }}>
            ✕ Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 32 }}>
            {[1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{height:48,marginBottom:8,borderRadius:8}} />)}
          </div>
        ) : txs.length === 0 ? (
          <div className="empty-state">
            <div className="icon">📭</div>
            <p>No transactions found</p>
          </div>
        ) : (
          <table className="tx-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Category</th>
                <th>Type</th>
                <th style={{ textAlign: "right" }}>Amount</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {txs.map((tx) => (
                <tr key={tx.id}>
                  <td className="cell-date">{tx.date}</td>
                  <td>{tx.description || <span style={{ color: "var(--text3)" }}>—</span>}</td>
                  <td>
                    {tx.category ? (
                      <span style={{ display:"flex", alignItems:"center", gap:6 }}>
                        <span>{tx.category.icon}</span>
                        <span style={{ color: "var(--text2)", fontSize: ".85rem" }}>{tx.category.name}</span>
                      </span>
                    ) : "—"}
                  </td>
                  <td>
                    <span className={`badge badge-${tx.type}`}>
                      {tx.type === "income" ? "▲" : "▼"} {tx.type}
                    </span>
                  </td>
                  <td style={{ textAlign: "right", fontFamily: "var(--font-display)", fontWeight: 600 }}>
                    <span style={{ color: tx.type === "income" ? "var(--income)" : "var(--expense)" }}>
                      {tx.type === "income" ? "+" : "−"}{fmt(tx.amount)}
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div style={{ display:"flex", gap:6, justifyContent:"flex-end" }}>
                      <button className="btn btn-ghost btn-sm btn-icon" title="Edit" onClick={() => setModal(tx)}>✏</button>
                      <button className="btn btn-danger btn-sm btn-icon" title="Delete" onClick={() => handleDelete(tx.id)}>✕</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display:"flex", justifyContent:"center", gap:8, marginTop:20 }}>
          <button className="btn btn-ghost btn-sm" disabled={page === 0} onClick={() => setPage(0)}>«</button>
          <button className="btn btn-ghost btn-sm" disabled={page === 0} onClick={() => setPage(p => p-1)}>‹</button>
          <span style={{ padding:"6px 14px", fontSize:".85rem", color:"var(--text2)" }}>
            {page + 1} / {totalPages}
          </span>
          <button className="btn btn-ghost btn-sm" disabled={page >= totalPages-1} onClick={() => setPage(p => p+1)}>›</button>
          <button className="btn btn-ghost btn-sm" disabled={page >= totalPages-1} onClick={() => setPage(totalPages-1)}>»</button>
        </div>
      )}

      {modal && (
        <TransactionModal
          tx={modal === "new" ? null : modal}
          categories={categories}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}

      <style>{`
        .filters-bar {
          display:flex; gap:10px; flex-wrap:wrap; margin-bottom:16px; align-items:center;
        }
        .filter-input, .filter-select {
          background:var(--surface); border:1px solid var(--border);
          border-radius:var(--radius-sm); padding:9px 14px;
          color:var(--text); font-size:.875rem; outline:none;
          transition:border-color .2s; font-family:inherit;
        }
        .filter-input:focus, .filter-select:focus { border-color:var(--accent); }
        .filter-select { appearance:none; cursor:pointer; }
        .filter-input { min-width:160px; }

        .tx-table { width:100%; border-collapse:collapse; }
        .tx-table th {
          text-align:left; font-size:.75rem; color:var(--text3);
          font-weight:500; text-transform:uppercase; letter-spacing:.05em;
          padding:14px 20px; border-bottom:1px solid var(--border);
        }
        .tx-table td {
          padding:13px 20px; border-bottom:1px solid var(--border);
          font-size:.9rem;
        }
        .tx-table tbody tr:last-child td { border-bottom:none; }
        .tx-table tbody tr:hover { background:var(--surface2); }
        .cell-date { color:var(--text3); font-size:.82rem; font-variant-numeric:tabular-nums; white-space:nowrap; }
      `}</style>
    </div>
  );
}
