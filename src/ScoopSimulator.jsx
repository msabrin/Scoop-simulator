import { useState, useMemo, useCallback, useRef, useEffect } from "react";

const DEFAULT_ITEMS = [
  { id: 1, name: "Bracelet", base: 30, packaged: 36 },
  { id: 2, name: "Ring", base: 20, packaged: 26 },
  { id: 3, name: "Hair Clip", base: 20, packaged: 26 },
  { id: 4, name: "Hair Crunchy", base: 20, packaged: 26 },
  { id: 5, name: "Locket & Earring", base: 55, packaged: 61 },
  { id: 6, name: "Stone Locket & Earring", base: 110, packaged: 116 },
  { id: 7, name: "Earring", base: 100, packaged: 106 },
  { id: 8, name: "Beauty Blender", base: 15, packaged: 21 },
  { id: 9, name: "Lipstick", base: 70, packaged: 76 },
  { id: 10, name: "Lip oil", base: 65, packaged: 71 },
  { id: 11, name: "Lip gel", base: 100, packaged: 106 },
  { id: 12, name: "Sheet mask", base: 40, packaged: 46 },
  { id: 13, name: "Candy mask", base: 6, packaged: 12 },
  { id: 14, name: "Mud mask", base: 15, packaged: 21 },
  { id: 15, name: "Diary", base: 60, packaged: 66 },
  { id: 16, name: "Mirror", base: 100, packaged: 106 },
  { id: 17, name: "Eraser", base: 50, packaged: 56 },
  { id: 18, name: "Cup", base: 110, packaged: 116 },
  { id: 19, name: "Fake nails", base: 100, packaged: 106 },
  { id: 20, name: "Nail sticker", base: 50, packaged: 56 },
  { id: 21, name: "Washi Tape", base: 10, packaged: 16 },
  { id: 22, name: "Bag", base: 105, packaged: 111 },
  { id: 23, name: "Plushy", base: 110, packaged: 116 },
  { id: 24, name: "Highlighter", base: 30, packaged: 36 },
  { id: 25, name: "Charm", base: 10, packaged: 16 },
  { id: 26, name: "Tip × 3", base: 15, packaged: 21 },
];

const PACKAGING_COST = 6;

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function runSimulation(items, numScoops, mrp, discount, minItems, maxItems) {
  const results = [];
  const sp = mrp * (1 - discount / 100);
  for (let i = 0; i < numScoops; i++) {
    const count = minItems + Math.floor(Math.random() * (maxItems - minItems + 1));
    const picked = shuffle(items).slice(0, Math.min(count, items.length));
    const totalCost = picked.reduce((s, it) => s + it.packaged, 0);
    const profit = sp - totalCost;
    const margin = sp > 0 ? (profit / sp) * 100 : 0;
    results.push({ count, totalCost, profit, margin, items: picked });
  }
  return results;
}

function computeStats(results, sp) {
  if (!results.length) return null;
  const margins = results.map((r) => r.margin).sort((a, b) => a - b);
  const costs = results.map((r) => r.totalCost).sort((a, b) => a - b);
  const profits = results.map((r) => r.profit);
  const avg = margins.reduce((s, m) => s + m, 0) / margins.length;
  const median = margins[Math.floor(margins.length / 2)];
  const p5 = margins[Math.floor(margins.length * 0.05)];
  const p10 = margins[Math.floor(margins.length * 0.1)];
  const p90 = margins[Math.floor(margins.length * 0.9)];
  const p95 = margins[Math.floor(margins.length * 0.95)];
  const above40 = margins.filter((m) => m >= 40).length;
  const above50 = margins.filter((m) => m >= 50).length;
  const negative = margins.filter((m) => m < 0).length;
  const avgCost = costs.reduce((s, c) => s + c, 0) / costs.length;
  const avgProfit = profits.reduce((s, p) => s + p, 0) / profits.length;
  return {
    avg, median, p5, p10, p90, p95,
    above40Pct: (above40 / margins.length) * 100,
    above50Pct: (above50 / margins.length) * 100,
    negativePct: (negative / margins.length) * 100,
    avgCost, minCost: costs[0], maxCost: costs[costs.length - 1],
    avgProfit, totalRevenue: sp * results.length,
    totalCost: costs.reduce((s, c) => s + c, 0),
  };
}

/* ─── Histogram ─── */
function Histogram({ data }) {
  const step = 5;
  const buckets = useMemo(() => {
    const b = {};
    for (let i = -80; i <= 100; i += step) b[i] = 0;
    data.forEach((d) => {
      const k = Math.max(-80, Math.min(95, Math.floor(d.margin / step) * step));
      b[k] = (b[k] || 0) + 1;
    });
    return Object.entries(b).map(([k, v]) => [Number(k), v]).sort((a, b) => a[0] - b[0]);
  }, [data]);
  const max = Math.max(...buckets.map((e) => e[1]), 1);

  return (
    <div style={{ marginTop: 20 }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "#8a7560", marginBottom: 10 }}>Margin Distribution</div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 1, height: 130 }}>
        {buckets.map(([bucket, count]) => {
          const h = (count / max) * 120;
          const isNeg = bucket < 0;
          const isHigh = bucket >= 50;
          return (
            <div key={bucket} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}
              title={`${bucket}% – ${bucket + step}%: ${count} scoops`}>
              <div style={{
                width: "100%", height: h, minWidth: 3,
                borderRadius: "2px 2px 0 0",
                background: isNeg
                  ? "linear-gradient(180deg, #e87461, #c0392b)"
                  : isHigh
                    ? "linear-gradient(180deg, #2ecc71, #1a9c54)"
                    : "linear-gradient(180deg, #d4a574, #b8865a)",
                opacity: count === 0 ? 0.15 : 0.9,
              }} />
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#a09080", marginTop: 4, fontFamily: "'JetBrains Mono', monospace" }}>
        <span>-80%</span><span>-40%</span><span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
      </div>
      <div style={{ display: "flex", gap: 20, marginTop: 10, fontSize: 11, color: "#8a7560" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: "#c0392b" }} />Loss</span>
        <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: "#b8865a" }} />Profit &lt;50%</span>
        <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: "#1a9c54" }} />Profit ≥50%</span>
      </div>
    </div>
  );
}

/* ─── Stat Card ─── */
function Stat({ label, value, sub, accent }) {
  return (
    <div style={{
      background: "#faf6f1", borderRadius: 10, padding: "14px 16px",
      border: "1px solid #ebe3d9",
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", color: "#a09080" }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: accent || "#3d2e1f", marginTop: 4, fontFamily: "'JetBrains Mono', monospace" }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "#a09080", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

/* ─── Tab Button ─── */
function TabBtn({ active, children, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: "10px 22px", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600,
      cursor: "pointer", transition: "all 0.2s",
      background: active ? "#3d2e1f" : "transparent",
      color: active ? "#faf6f1" : "#8a7560",
    }}>{children}</button>
  );
}

/* ─── Main App ─── */
export default function ScoopSimulator() {
  const [items, setItems] = useState(DEFAULT_ITEMS);
  const [tab, setTab] = useState("simulate");
  const [mrp, setMrp] = useState(1499);
  const [discount, setDiscount] = useState(25);
  const [minItems, setMinItems] = useState(8);
  const [maxItems, setMaxItems] = useState(10);
  const [simCount, setSimCount] = useState(10000);
  const [results, setResults] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [newItem, setNewItem] = useState({ name: "", base: "" });
  const [showAdd, setShowAdd] = useState(false);
  const [simRunning, setSimRunning] = useState(false);
  const nextId = useRef(Math.max(...DEFAULT_ITEMS.map(i => i.id)) + 1);

  const sp = mrp * (1 - discount / 100);
  const stats = useMemo(() => results ? computeStats(results, sp) : null, [results, sp]);
  const avgItemCost = items.length ? (items.reduce((s, i) => s + i.packaged, 0) / items.length) : 0;
  const avgScoopSize = (minItems + maxItems) / 2;
  const estAvgCost = avgItemCost * avgScoopSize;

  const handleRun = useCallback(() => {
    if (items.length < maxItems) return;
    setSimRunning(true);
    setTimeout(() => {
      const r = runSimulation(items, simCount, mrp, discount, minItems, maxItems);
      setResults(r);
      setSimRunning(false);
      setTab("results");
    }, 50);
  }, [items, simCount, mrp, discount, minItems, maxItems]);

  const updateItem = (id, field, value) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, [field]: field === "name" ? value : Number(value) || 0 };
      if (field === "base") updated.packaged = updated.base + PACKAGING_COST;
      if (field === "packaged") updated.base = Math.max(0, updated.packaged - PACKAGING_COST);
      return updated;
    }));
  };

  const deleteItem = (id) => {
    setItems(prev => prev.filter(i => i.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const addItem = () => {
    if (!newItem.name.trim() || !newItem.base) return;
    const base = Number(newItem.base);
    setItems(prev => [...prev, { id: nextId.current++, name: newItem.name.trim(), base, packaged: base + PACKAGING_COST }]);
    setNewItem({ name: "", base: "" });
    setShowAdd(false);
  };

  /* ─── Quick Reference Prices ─── */
  const quickPrices = useMemo(() => {
    const prices = [799, 999, 1199, 1299, 1399, 1499, 1599, 1699, 1799, 1999, 2499];
    return prices.map(p => {
      const s = p * (1 - discount / 100);
      const margin = s > 0 ? ((s - estAvgCost) / s) * 100 : -100;
      return { price: p, sp: s, margin };
    });
  }, [discount, estAvgCost]);

  /* ─── Styles ─── */
  const container = {
    fontFamily: "'Newsreader', 'Georgia', serif",
    maxWidth: 860, margin: "0 auto", padding: "32px 20px",
    background: "#fefcf9", minHeight: "100vh", color: "#3d2e1f",
  };
  const card = {
    background: "#fff", borderRadius: 14, padding: 24,
    border: "1px solid #ebe3d9", boxShadow: "0 2px 12px rgba(61,46,31,0.04)",
    marginBottom: 20,
  };
  const inputBase = {
    padding: "10px 14px", border: "1.5px solid #ddd3c7", borderRadius: 8,
    fontSize: 14, background: "#fefcf9", color: "#3d2e1f",
    outline: "none", fontFamily: "'JetBrains Mono', monospace",
    transition: "border-color 0.2s",
    width: "100%", boxSizing: "border-box",
  };
  const btnPrimary = {
    padding: "12px 28px", border: "none", borderRadius: 10, fontSize: 14,
    fontWeight: 700, cursor: "pointer", transition: "all 0.25s",
    background: "linear-gradient(135deg, #3d2e1f, #5a4332)",
    color: "#faf6f1", fontFamily: "'Newsreader', serif", letterSpacing: 0.5,
  };
  const btnSecondary = {
    padding: "8px 18px", border: "1.5px solid #d4c4b0", borderRadius: 8,
    fontSize: 13, fontWeight: 600, cursor: "pointer", background: "transparent",
    color: "#6d5d4b", fontFamily: "'Newsreader', serif",
    transition: "all 0.2s",
  };

  return (
    <div style={container}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", color: "#b8865a", marginBottom: 8 }}>Mystery Box Pricing Engine</div>
        <h1 style={{ fontSize: 34, fontWeight: 800, margin: 0, lineHeight: 1.1, color: "#3d2e1f" }}>Scoop Simulator</h1>
        <p style={{ fontSize: 15, color: "#8a7560", marginTop: 8, fontStyle: "italic", maxWidth: 500, margin: "8px auto 0" }}>
          Monte Carlo simulation to find your optimal scoop price — edit items, tweak costs, and run thousands of scenarios.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, background: "#f5ede4", borderRadius: 10, padding: 4, marginBottom: 24, justifyContent: "center" }}>
        <TabBtn active={tab === "items"} onClick={() => setTab("items")}>📦 Items ({items.length})</TabBtn>
        <TabBtn active={tab === "simulate"} onClick={() => setTab("simulate")}>⚙️ Simulate</TabBtn>
        <TabBtn active={tab === "results"} onClick={() => setTab("results")}>📊 Results</TabBtn>
      </div>

      {/* ─── ITEMS TAB ─── */}
      {tab === "items" && (
        <div style={card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>Product Inventory</div>
              <div style={{ fontSize: 12, color: "#a09080", marginTop: 2 }}>
                {items.length} items · Avg cost ₹{avgItemCost.toFixed(0)} · Packaging ₹{PACKAGING_COST}/item
              </div>
            </div>
            <button style={btnSecondary} onClick={() => setShowAdd(!showAdd)}>
              {showAdd ? "✕ Cancel" : "+ Add Item"}
            </button>
          </div>

          {/* Add New Item */}
          {showAdd && (
            <div style={{
              display: "flex", gap: 10, alignItems: "flex-end", marginBottom: 16,
              padding: 16, background: "#faf6f1", borderRadius: 10, border: "1px solid #ebe3d9",
            }}>
              <div style={{ flex: 2 }}>
                <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "#a09080", display: "block", marginBottom: 4 }}>Name</label>
                <input style={inputBase} placeholder="e.g. Keychain" value={newItem.name}
                  onChange={e => setNewItem(p => ({ ...p, name: e.target.value }))}
                  onKeyDown={e => e.key === "Enter" && addItem()} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "#a09080", display: "block", marginBottom: 4 }}>Base Price (₹)</label>
                <input style={inputBase} type="number" placeholder="0" value={newItem.base}
                  onChange={e => setNewItem(p => ({ ...p, base: e.target.value }))}
                  onKeyDown={e => e.key === "Enter" && addItem()} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "#a09080", display: "block", marginBottom: 4 }}>With Packaging</label>
                <div style={{ ...inputBase, background: "#f0ebe4", color: "#8a7560", display: "flex", alignItems: "center" }}>
                  ₹{newItem.base ? Number(newItem.base) + PACKAGING_COST : "—"}
                </div>
              </div>
              <button style={{ ...btnPrimary, padding: "10px 20px", whiteSpace: "nowrap" }} onClick={addItem}>Add</button>
            </div>
          )}

          {/* Table Header */}
          <div style={{
            display: "grid", gridTemplateColumns: "40px 2fr 1fr 1fr 70px",
            gap: 8, padding: "8px 12px", fontSize: 10, fontWeight: 700,
            letterSpacing: 1.2, textTransform: "uppercase", color: "#a09080",
            borderBottom: "2px solid #ebe3d9",
          }}>
            <span>#</span><span>Product</span><span>Base ₹</span><span>Packaged ₹</span><span></span>
          </div>

          {/* Items */}
          <div style={{ maxHeight: 440, overflowY: "auto" }}>
            {items.map((item, idx) => (
              <div key={item.id} style={{
                display: "grid", gridTemplateColumns: "40px 2fr 1fr 1fr 70px",
                gap: 8, padding: "10px 12px", alignItems: "center",
                borderBottom: "1px solid #f5ede4",
                background: editingId === item.id ? "#faf6f1" : "transparent",
                transition: "background 0.15s",
              }}>
                <span style={{ fontSize: 12, color: "#a09080", fontFamily: "'JetBrains Mono', monospace" }}>{idx + 1}</span>
                {editingId === item.id ? (
                  <>
                    <input style={{ ...inputBase, padding: "6px 10px", fontSize: 13, fontFamily: "'Newsreader', serif" }}
                      value={item.name} onChange={e => updateItem(item.id, "name", e.target.value)} autoFocus />
                    <input style={{ ...inputBase, padding: "6px 10px", fontSize: 13 }} type="number"
                      value={item.base} onChange={e => updateItem(item.id, "base", e.target.value)} />
                    <div style={{ fontSize: 14, fontFamily: "'JetBrains Mono', monospace", color: "#6d5d4b" }}>₹{item.packaged}</div>
                    <button style={{ ...btnSecondary, padding: "4px 10px", fontSize: 11 }} onClick={() => setEditingId(null)}>Done</button>
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: 14, fontWeight: 500 }}>{item.name}</span>
                    <span style={{ fontSize: 14, fontFamily: "'JetBrains Mono', monospace", color: "#6d5d4b" }}>₹{item.base}</span>
                    <span style={{ fontSize: 14, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600,
                      color: item.packaged > 80 ? "#c0392b" : item.packaged > 50 ? "#b8865a" : "#1a9c54"
                    }}>₹{item.packaged}</span>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, padding: 2 }}
                        onClick={() => setEditingId(item.id)} title="Edit">✏️</button>
                      <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, padding: 2 }}
                        onClick={() => deleteItem(item.id)} title="Delete">🗑️</button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Cost Tier Summary */}
          <div style={{ marginTop: 16, display: "flex", gap: 12, flexWrap: "wrap" }}>
            {[
              { label: "Budget (≤₹30)", count: items.filter(i => i.packaged <= 30).length, color: "#1a9c54" },
              { label: "Mid (₹31–₹80)", count: items.filter(i => i.packaged > 30 && i.packaged <= 80).length, color: "#b8865a" },
              { label: "Premium (₹80+)", count: items.filter(i => i.packaged > 80).length, color: "#c0392b" },
            ].map(t => (
              <div key={t.label} style={{
                flex: 1, minWidth: 120, padding: "10px 14px", background: "#faf6f1", borderRadius: 8,
                fontSize: 12, border: "1px solid #ebe3d9",
              }}>
                <span style={{ color: "#8a7560" }}>{t.label}</span>
                <span style={{ float: "right", fontWeight: 700, color: t.color, fontFamily: "'JetBrains Mono', monospace" }}>{t.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── SIMULATE TAB ─── */}
      {tab === "simulate" && (
        <>
          {/* Config */}
          <div style={card}>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Simulation Parameters</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", color: "#a09080", display: "block", marginBottom: 6 }}>Scoop MRP (₹)</label>
                <input style={inputBase} type="number" value={mrp} onChange={e => setMrp(Number(e.target.value))} />
              </div>
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", color: "#a09080", display: "block", marginBottom: 6 }}>Discount (%)</label>
                <input style={inputBase} type="number" value={discount} onChange={e => setDiscount(Number(e.target.value))} />
              </div>
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", color: "#a09080", display: "block", marginBottom: 6 }}>Min Items per Scoop</label>
                <input style={inputBase} type="number" value={minItems} onChange={e => setMinItems(Math.max(1, Number(e.target.value)))} />
              </div>
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", color: "#a09080", display: "block", marginBottom: 6 }}>Max Items per Scoop</label>
                <input style={inputBase} type="number" value={maxItems} onChange={e => setMaxItems(Math.max(minItems, Number(e.target.value)))} />
              </div>
            </div>
            <div style={{ marginTop: 16 }}>
              <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", color: "#a09080", display: "block", marginBottom: 6 }}>Number of Simulations</label>
              <div style={{ display: "flex", gap: 8 }}>
                {[1000, 5000, 10000, 50000].map(n => (
                  <button key={n} onClick={() => setSimCount(n)} style={{
                    ...btnSecondary, flex: 1,
                    background: simCount === n ? "#3d2e1f" : "transparent",
                    color: simCount === n ? "#faf6f1" : "#6d5d4b",
                    border: simCount === n ? "1.5px solid #3d2e1f" : "1.5px solid #d4c4b0",
                  }}>{n >= 1000 ? `${n / 1000}K` : n}</button>
                ))}
              </div>
            </div>

            {/* Live Preview */}
            <div style={{ marginTop: 20, padding: 16, background: "#faf6f1", borderRadius: 10, border: "1px solid #ebe3d9" }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", color: "#a09080", marginBottom: 10 }}>Live Preview</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 11, color: "#a09080" }}>Selling Price</div>
                  <div style={{ fontSize: 20, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: "#3d2e1f" }}>₹{sp.toFixed(0)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "#a09080" }}>Est. Avg Cost</div>
                  <div style={{ fontSize: 20, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: "#b8865a" }}>₹{estAvgCost.toFixed(0)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "#a09080" }}>Est. Avg Margin</div>
                  <div style={{ fontSize: 20, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace",
                    color: sp > 0 ? (((sp - estAvgCost) / sp) * 100 >= 50 ? "#1a9c54" : ((sp - estAvgCost) / sp) * 100 >= 30 ? "#b8865a" : "#c0392b") : "#c0392b"
                  }}>
                    {sp > 0 ? `${(((sp - estAvgCost) / sp) * 100).toFixed(1)}%` : "—"}
                  </div>
                </div>
              </div>
            </div>

            {items.length < maxItems && (
              <div style={{ marginTop: 12, padding: "10px 14px", background: "#fde8e8", borderRadius: 8, fontSize: 13, color: "#c0392b" }}>
                ⚠️ You need at least {maxItems} items to simulate. Currently: {items.length}. Add more in the Items tab.
              </div>
            )}

            <button style={{ ...btnPrimary, width: "100%", marginTop: 20, padding: "14px 0", fontSize: 16,
              opacity: items.length < maxItems || simRunning ? 0.5 : 1,
              pointerEvents: items.length < maxItems || simRunning ? "none" : "auto",
            }} onClick={handleRun}>
              {simRunning ? "⏳ Running..." : `▶ Run ${simCount.toLocaleString()} Simulations`}
            </button>
          </div>

          {/* Quick Reference Table */}
          <div style={card}>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Quick Price Reference</div>
            <div style={{ fontSize: 12, color: "#a09080", marginBottom: 14 }}>
              Based on avg {avgScoopSize} items · avg cost ₹{estAvgCost.toFixed(0)} · {discount}% discount. Click a row to set MRP.
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr>
                    {["MRP", "After Discount", "Est. Margin", "Est. Profit", "Verdict"].map(h => (
                      <th key={h} style={{ padding: "8px 10px", textAlign: "left", borderBottom: "2px solid #ebe3d9",
                        fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "#a09080" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {quickPrices.map(r => (
                    <tr key={r.price} onClick={() => setMrp(r.price)}
                      style={{
                        cursor: "pointer", transition: "background 0.15s",
                        background: r.price === mrp ? "#f5ede4" : "transparent",
                        fontWeight: r.price === mrp ? 700 : 400,
                      }}>
                      <td style={{ padding: "9px 10px", borderBottom: "1px solid #f5ede4", fontFamily: "'JetBrains Mono', monospace" }}>₹{r.price}</td>
                      <td style={{ padding: "9px 10px", borderBottom: "1px solid #f5ede4", fontFamily: "'JetBrains Mono', monospace" }}>₹{r.sp.toFixed(0)}</td>
                      <td style={{ padding: "9px 10px", borderBottom: "1px solid #f5ede4", fontFamily: "'JetBrains Mono', monospace",
                        color: r.margin >= 50 ? "#1a9c54" : r.margin >= 35 ? "#b8865a" : "#c0392b" }}>{r.margin.toFixed(1)}%</td>
                      <td style={{ padding: "9px 10px", borderBottom: "1px solid #f5ede4", fontFamily: "'JetBrains Mono', monospace" }}>₹{(r.sp - estAvgCost).toFixed(0)}</td>
                      <td style={{ padding: "9px 10px", borderBottom: "1px solid #f5ede4" }}>
                        {r.margin >= 55 ? "🟢 Safe" : r.margin >= 48 ? "🟡 Sweet spot" : r.margin >= 35 ? "🟠 Tight" : "🔴 Loss-prone"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ─── RESULTS TAB ─── */}
      {tab === "results" && (
        <>
          {!stats ? (
            <div style={{ ...card, textAlign: "center", padding: 48, color: "#a09080" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>No results yet</div>
              <div style={{ fontSize: 13, marginTop: 6 }}>Go to the Simulate tab and run a simulation first.</div>
            </div>
          ) : (
            <>
              {/* Key Metrics */}
              <div style={card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 16 }}>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>Key Metrics</div>
                  <div style={{ fontSize: 12, color: "#a09080" }}>MRP ₹{mrp} → Selling ₹{sp.toFixed(0)} · {simCount.toLocaleString()} scoops</div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                  <Stat label="Average Margin" value={`${stats.avg.toFixed(1)}%`}
                    accent={stats.avg >= 50 ? "#1a9c54" : stats.avg >= 35 ? "#b8865a" : "#c0392b"} />
                  <Stat label="Median Margin" value={`${stats.median.toFixed(1)}%`}
                    accent={stats.median >= 50 ? "#1a9c54" : "#b8865a"} />
                  <Stat label="Avg Profit / Scoop" value={`₹${stats.avgProfit.toFixed(0)}`}
                    accent={stats.avgProfit > 0 ? "#1a9c54" : "#c0392b"} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 12 }}>
                  <Stat label="Scoops ≥ 50% Margin" value={`${stats.above50Pct.toFixed(1)}%`}
                    sub={`${Math.round(stats.above50Pct * simCount / 100).toLocaleString()} of ${simCount.toLocaleString()}`} accent="#1a9c54" />
                  <Stat label="Scoops ≥ 40% Margin" value={`${stats.above40Pct.toFixed(1)}%`} accent="#b8865a" />
                  <Stat label="Scoops at Loss" value={`${stats.negativePct.toFixed(1)}%`}
                    accent={stats.negativePct > 5 ? "#c0392b" : stats.negativePct > 0 ? "#b8865a" : "#1a9c54"} />
                </div>
              </div>

              {/* Distribution */}
              <div style={card}>
                <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Profit Distribution</div>
                <Histogram data={results} />

                <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                  <Stat label="5th Percentile" value={`${stats.p5.toFixed(1)}%`} sub="Worst case" accent={stats.p5 < 0 ? "#c0392b" : "#b8865a"} />
                  <Stat label="10th Percentile" value={`${stats.p10.toFixed(1)}%`} accent={stats.p10 < 0 ? "#c0392b" : "#b8865a"} />
                  <Stat label="90th Percentile" value={`${stats.p90.toFixed(1)}%`} accent="#1a9c54" />
                  <Stat label="95th Percentile" value={`${stats.p95.toFixed(1)}%`} sub="Best case" accent="#1a9c54" />
                </div>
              </div>

              {/* Cost Analysis */}
              <div style={card}>
                <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 14 }}>Cost Analysis</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                  <Stat label="Average Scoop Cost" value={`₹${stats.avgCost.toFixed(0)}`} />
                  <Stat label="Min Cost Observed" value={`₹${stats.minCost}`} sub="Lucky scoop" accent="#1a9c54" />
                  <Stat label="Max Cost Observed" value={`₹${stats.maxCost}`} sub="Expensive scoop" accent="#c0392b" />
                </div>

                {/* Cost bar */}
                <div style={{ marginTop: 20, padding: 16, background: "#faf6f1", borderRadius: 10 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", color: "#a09080", marginBottom: 10 }}>Cost vs Selling Price</div>
                  <div style={{ position: "relative", height: 32, background: "#ebe3d9", borderRadius: 6, overflow: "hidden" }}>
                    <div style={{
                      position: "absolute", left: 0, top: 0, bottom: 0,
                      width: `${Math.min(100, (stats.avgCost / sp) * 100)}%`,
                      background: "linear-gradient(90deg, #b8865a, #d4a574)",
                      borderRadius: 6, transition: "width 0.5s",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12, fontWeight: 700, color: "#fff",
                    }}>
                      Cost: ₹{stats.avgCost.toFixed(0)}
                    </div>
                    <div style={{
                      position: "absolute", right: 8, top: 0, bottom: 0,
                      display: "flex", alignItems: "center",
                      fontSize: 12, fontWeight: 700, color: "#1a9c54",
                    }}>
                      Profit: ₹{stats.avgProfit.toFixed(0)}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", fontSize: 11, color: "#a09080", marginTop: 4 }}>
                    Selling Price: ₹{sp.toFixed(0)}
                  </div>
                </div>
              </div>

              {/* Recommendation */}
              <div style={{
                ...card,
                background: stats.avg >= 48 && stats.avg <= 56 ? "#f0f9f0" : stats.avg > 56 ? "#eef4ff" : "#fef5f5",
                borderColor: stats.avg >= 48 && stats.avg <= 56 ? "#a8d8a8" : stats.avg > 56 ? "#a8c4e8" : "#e8a8a8",
              }}>
                <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
                  {stats.avg >= 48 && stats.avg <= 56 ? "✅ Excellent Price Point" : stats.avg > 56 ? "💰 High Margin — Room to Be Competitive" : "⚠️ Consider Raising MRP"}
                </div>
                <div style={{ fontSize: 14, lineHeight: 1.7, color: "#5a4a3a" }}>
                  {stats.avg >= 48 && stats.avg <= 56
                    ? `At ₹${mrp} MRP with ${discount}% off (₹${sp.toFixed(0)} selling price), your average margin is ${stats.avg.toFixed(1)}% — right in the sweet spot. ${stats.above40Pct.toFixed(0)}% of scoops hit ≥40% margin, and loss probability is just ${stats.negativePct.toFixed(1)}%. This price balances profitability with perceived customer value.`
                    : stats.avg > 56
                      ? `Average margin of ${stats.avg.toFixed(1)}% is above your 50% target. You could lower MRP to improve customer appeal. Even at ₹${Math.round(mrp * 0.9 / 100) * 100}, you'd likely maintain ~50% margins.`
                      : `Average margin of ${stats.avg.toFixed(1)}% is below your 50% target. Consider raising MRP or adjusting the item mix. At the current price, ${stats.negativePct.toFixed(1)}% of scoops would result in a loss.`}
                </div>
                {stats.avg >= 48 && stats.avg <= 56 && (
                  <div style={{ marginTop: 12, padding: "10px 14px", background: "rgba(26,156,84,0.08)", borderRadius: 8, fontSize: 13, color: "#1a7a44" }}>
                    💡 <strong>Pro Tip:</strong> If you sell 100 scoops/month at ₹{sp.toFixed(0)}, that's ~₹{(stats.avgProfit * 100).toLocaleString(undefined, { maximumFractionDigits: 0 })} monthly profit with avg cost of ₹{(stats.avgCost * 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}.
                  </div>
                )}
              </div>

              {/* Re-run button */}
              <div style={{ textAlign: "center", marginTop: 8 }}>
                <button style={btnPrimary} onClick={() => setTab("simulate")}>← Back to Simulation Settings</button>
              </div>
            </>
          )}
        </>
      )}

      {/* Footer */}
      <div style={{ textAlign: "center", marginTop: 36, fontSize: 11, color: "#b8a89a", letterSpacing: 0.5 }}>
        Charm Mystery Box · Scoop Pricing Simulator · Monte Carlo Engine
      </div>
    </div>
  );
}
