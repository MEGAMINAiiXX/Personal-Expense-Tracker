import { useState, useEffect } from "react";

const EMPTY = {
  amount: "",
  type: "expense",
  date: new Date().toISOString().slice(0, 10),
  description: "",
  category_id: "",
};

export default function TransactionModal({ tx, categories, onSave, onClose }) {
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tx) {
      setForm({
        amount: tx.amount,
        type: tx.type,
        date: tx.date,
        description: tx.description || "",
        category_id: tx.category_id ?? "",
      });
    }
  }, [tx]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handle = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave({
        ...form,
        amount: parseFloat(form.amount),
        category_id: form.category_id ? parseInt(form.category_id) : null,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2>{tx ? "Edit Transaction" : "New Transaction"}</h2>
        <form onSubmit={handle}>
          {/* Type toggle */}
          <div className="field">
            <label>Type</label>
            <div className="type-toggle">
              {["expense", "income"].map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`type-btn ${form.type === t ? "active " + t : ""}`}
                  onClick={() => set("type", t)}
                >
                  {t === "income" ? "▲ Income" : "▼ Expense"}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label>Amount</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              placeholder="0.00"
              value={form.amount}
              onChange={(e) => set("amount", e.target.value)}
            />
          </div>

          <div className="field">
            <label>Date</label>
            <input
              type="date"
              required
              value={form.date}
              onChange={(e) => set("date", e.target.value)}
            />
          </div>

          <div className="field">
            <label>Category</label>
            <select value={form.category_id} onChange={(e) => set("category_id", e.target.value)}>
              <option value="">— None —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>Description</label>
            <input
              type="text"
              placeholder="Optional note"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner" /> : (tx ? "Update" : "Add")}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .type-toggle { display:flex; gap:8px; }
        .type-btn {
          flex:1; padding:10px; border-radius:var(--radius-sm);
          background:var(--surface2); border:1px solid var(--border);
          color:var(--text2); font-size:.9rem; font-weight:500; cursor:pointer;
          transition: all .2s;
        }
        .type-btn.active.expense { background:rgba(248,113,113,.15); border-color:var(--expense); color:var(--expense); }
        .type-btn.active.income  { background:rgba(52,211,153,.15);  border-color:var(--income);  color:var(--income);  }
      `}</style>
    </div>
  );
}
