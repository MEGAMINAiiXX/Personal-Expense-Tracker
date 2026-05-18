import { useState, useEffect } from "react";
import { getCategories, createCategory, updateCategory, deleteCategory } from "../api";
import { useToast } from "../ToastContext";

const ICONS = ["💰","🍽️","🚗","🛍️","🎬","💊","🏠","📚","💼","💻","📈","✈️","🎮","🏋️","☕","🎵","📦","🐾","🌿","💡"];
const COLORS = ["#6366f1","#f97316","#3b82f6","#ec4899","#8b5cf6","#10b981","#f59e0b","#22c55e","#14b8a6","#a855f7","#94a3b8","#ef4444","#06b6d4","#84cc16"];

const EMPTY = { name: "", color: "#6366f1", icon: "💰" };

export default function Categories() {
  const toast = useToast();
  const [cats, setCats] = useState([]);
  const [modal, setModal] = useState(null); // null | "new" | cat
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = () => getCategories().then(setCats).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const openNew = () => { setForm(EMPTY); setModal("new"); };
  const openEdit = (c) => { setForm({ name: c.name, color: c.color, icon: c.icon }); setModal(c); };
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal === "new") {
        await createCategory(form);
        toast("Category created!", "success");
      } else {
        await updateCategory(modal.id, form);
        toast("Category updated!", "success");
      }
      setModal(null);
      load();
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this category? Transactions will not be deleted but will lose their category.")) return;
    try {
      await deleteCategory(id);
      toast("Deleted.", "success");
      load();
    } catch (e) {
      toast(e.message, "error");
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Categories</h1>
          <p className="page-subtitle">{cats.length} categories</p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>+ New Category</button>
      </div>

      {loading ? (
        <div className="grid-auto">
          {[1,2,3,4,5,6].map(i=><div key={i} className="skeleton" style={{height:100,borderRadius:14}}/>)}
        </div>
      ) : cats.length === 0 ? (
        <div className="empty-state" style={{ marginTop:48 }}>
          <div className="icon">🗂️</div>
          <p>No categories yet — add one!</p>
        </div>
      ) : (
        <div className="grid-auto">
          {cats.map((c) => (
            <div key={c.id} className="cat-card" style={{ "--cat-color": c.color }}>
              <div className="cat-icon">{c.icon}</div>
              <div className="cat-name">{c.name}</div>
              <div className="cat-dot" style={{ background: c.color }} />
              <div className="cat-actions">
                <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openEdit(c)} title="Edit">✏</button>
                <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(c.id)} title="Delete">✕</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal">
            <h2>{modal === "new" ? "New Category" : "Edit Category"}</h2>
            <form onSubmit={handleSave}>
              <div className="field">
                <label>Name</label>
                <input required placeholder="e.g. Groceries" value={form.name} onChange={e=>set("name",e.target.value)} />
              </div>

              <div className="field">
                <label>Icon</label>
                <div className="icon-picker">
                  {ICONS.map(ic => (
                    <button
                      key={ic} type="button"
                      className={`icon-btn ${form.icon === ic ? "active" : ""}`}
                      onClick={() => set("icon", ic)}
                    >{ic}</button>
                  ))}
                </div>
              </div>

              <div className="field">
                <label>Color</label>
                <div className="color-picker">
                  {COLORS.map(col => (
                    <button
                      key={col} type="button"
                      className={`color-btn ${form.color === col ? "active" : ""}`}
                      style={{ background: col }}
                      onClick={() => set("color", col)}
                    />
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div className="cat-preview">
                <div className="cat-preview-icon" style={{ background: `${form.color}22`, color: form.color }}>
                  {form.icon}
                </div>
                <span style={{ fontWeight:600 }}>{form.name || "Preview"}</span>
                <div style={{ width:10, height:10, borderRadius:"50%", background:form.color }} />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <span className="spinner" /> : (modal === "new" ? "Create" : "Save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .cat-card {
          background:var(--surface); border:1px solid var(--border);
          border-radius:var(--radius); padding:20px;
          display:flex; flex-direction:column; gap:8px;
          position:relative; overflow:hidden;
          transition: border-color .2s, transform .2s;
        }
        .cat-card::before {
          content:""; position:absolute; inset:0;
          background:radial-gradient(ellipse at 0% 0%, color-mix(in srgb, var(--cat-color) 8%, transparent), transparent 65%);
          pointer-events:none;
        }
        .cat-card:hover { border-color:var(--border2); transform:translateY(-2px); }
        .cat-icon { font-size:1.8rem; }
        .cat-name { font-weight:600; font-size:.95rem; }
        .cat-dot { width:8px; height:8px; border-radius:50%; }
        .cat-actions { display:flex; gap:6px; margin-top:4px; }

        .icon-picker { display:flex; flex-wrap:wrap; gap:6px; }
        .icon-btn {
          width:38px; height:38px; font-size:1.2rem; border-radius:8px;
          background:var(--surface2); border:1px solid var(--border);
          cursor:pointer; transition:all .15s;
        }
        .icon-btn.active { border-color:var(--accent); background:rgba(124,107,255,.15); }
        .icon-btn:hover { border-color:var(--border2); }

        .color-picker { display:flex; flex-wrap:wrap; gap:8px; }
        .color-btn {
          width:28px; height:28px; border-radius:50%; border:3px solid transparent;
          cursor:pointer; transition:all .15s;
        }
        .color-btn.active { border-color:white; transform:scale(1.15); }
        .color-btn:hover { transform:scale(1.1); }

        .cat-preview {
          display:flex; align-items:center; gap:10px;
          background:var(--surface2); border-radius:var(--radius-sm);
          padding:12px 16px; margin:4px 0 0;
        }
        .cat-preview-icon {
          width:36px; height:36px; border-radius:8px;
          display:flex; align-items:center; justify-content:center; font-size:1.2rem;
        }
      `}</style>
    </div>
  );
}
