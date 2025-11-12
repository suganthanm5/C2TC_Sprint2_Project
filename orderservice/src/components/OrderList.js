// src/components/OrderList.js
import React, { useMemo, useState } from "react";
import PropTypes from "prop-types";
import "./OrderList.css";

/* Utility: format many orderDate shapes to "YYYY-MM-DD HH:MM:SS" */
function safeFormatDate(value) {
  if (!value && value !== 0) return "";
  if (typeof value === "string") {
    const s = value.split(".")[0].replace("Z", "");
    return s.includes("T") ? s.replace("T", " ") : s;
  }
  if (typeof value === "number") {
    const ms = value < 1e12 ? value * 1000 : value;
    const d = new Date(ms);
    return d.toISOString().split(".")[0].replace("T", " ");
  }
  if (value instanceof Date) {
    return value.toISOString().split(".")[0].replace("T", " ");
  }
  if (typeof value === "object") {
    const year = value.year ?? value.Y ?? value.y;
    const month = value.month ?? value.m;
    const day = value.day ?? value.d;
    if (year && month && day) {
      const hh = String(value.hour ?? 0).padStart(2, "0");
      const mm = String(value.minute ?? value.min ?? 0).padStart(2, "0");
      const ss = String(value.second ?? value.s ?? 0).padStart(2, "0");
      return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")} ${hh}:${mm}:${ss}`;
    }
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

function formatMoney(n) {
  const num = Number(n || 0);
  if (Number.isNaN(num)) return "0.00";
  return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/* Small SVG icons (inline so no dependencies) */
const IconEdit = ({ className = "icon" }) => (
  <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconDelete = ({ className = "icon" }) => (
  <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M3 6h18" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8 6v14a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M10 6V4h4v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function OrderList({ orders = [], onEdit, onDelete }) {
  // UI state
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [sortBy, setSortBy] = useState({ key: "id", dir: "asc" });

  // Derived: filtered & sorted orders
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((o) => {
      if (!q) return true;
      const fields = [
        String(o.id ?? ""),
        (o.customerName ?? "").toString(),
        (o.product ?? "").toString(),
        (o.status ?? "").toString(),
        safeFormatDate(o.orderDate),
        formatMoney(o.unitPrice),
      ];
      return fields.join(" ").toLowerCase().includes(q);
    });
  }, [orders, query]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    const { key, dir } = sortBy;
    arr.sort((a, b) => {
      const va = a?.[key];
      const vb = b?.[key];
      if (key === "unitPrice" || key === "quantity" || key === "id") {
        return (Number(va) - Number(vb)) * (dir === "asc" ? 1 : -1);
      }
      const sa = String(key === "orderDate" ? safeFormatDate(va) : va ?? "").toLowerCase();
      const sb = String(key === "orderDate" ? safeFormatDate(vb) : vb ?? "").toLowerCase();
      return sa.localeCompare(sb) * (dir === "asc" ? 1 : -1);
    });
    return arr;
  }, [filtered, sortBy]);

  // Pagination
  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const display = sorted.slice((page - 1) * pageSize, page * pageSize);

  const changeSort = (key) => {
    if (sortBy.key === key) {
      setSortBy({ key, dir: sortBy.dir === "asc" ? "desc" : "asc" });
    } else {
      setSortBy({ key, dir: "asc" });
    }
  };

  const handlePage = (n) => {
    setPage(Math.max(1, Math.min(totalPages, n)));
  };

  return (
    <div className="order-list card">
      <div className="order-list-header">
        <h2>Orders</h2>

        <div className="controls">
          <input
            className="search"
            placeholder="Search by id, customer, product, status..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            aria-label="Search orders"
          />

          <label className="pagesize">
            <span>Per page</span>
            <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}>
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </label>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th onClick={() => changeSort("id")} className={sortBy.key === "id" ? sortBy.dir : ""}>ID</th>
              <th onClick={() => changeSort("customerName")} className={sortBy.key === "customerName" ? sortBy.dir : ""}>Customer</th>
              <th onClick={() => changeSort("product")} className={sortBy.key === "product" ? sortBy.dir : ""}>Product</th>
              <th onClick={() => changeSort("quantity")} className={sortBy.key === "quantity" ? sortBy.dir : ""}>Qty</th>
              <th onClick={() => changeSort("unitPrice")} className={sortBy.key === "unitPrice" ? sortBy.dir : ""}>Unit Price</th>
              <th onClick={() => changeSort("orderDate")} className={sortBy.key === "orderDate" ? sortBy.dir : ""}>Order Date</th>
              <th onClick={() => changeSort("status")} className={sortBy.key === "status" ? sortBy.dir : ""}>Status</th>
              <th>Total</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {display.map((o) => (
              <tr key={o.id}>
                <td>{o.id}</td>
                <td className="customer">{o.customerName}</td>
                <td>{o.product}</td>
                <td>{o.quantity}</td>
                <td>{formatMoney(o.unitPrice)}</td>
                <td className="date">{safeFormatDate(o.orderDate)}</td>
                <td><span className={`status ${o.status?.toLowerCase() ?? ""}`}>{o.status}</span></td>
                <td><span className="total-pill">{formatMoney((Number(o.unitPrice) || 0) * (Number(o.quantity) || 0))}</span></td>
                <td className="actions">
                  <button className="btn edit" onClick={() => onEdit(o)} title="Edit">
                    <IconEdit />
                    <span className="btn-label">Edit</span>
                  </button>
                  <button className="btn delete" onClick={() => onDelete(o.id)} title="Delete">
                    <IconDelete />
                    <span className="btn-label">Delete</span>
                  </button>
                </td>
              </tr>
            ))}

            {display.length === 0 && (
              <tr className="empty-row">
                <td colSpan="9">No orders match your search.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* pagination */}
      <div className="list-footer">
        <div className="summary">
          Showing <strong>{display.length}</strong> of <strong>{total}</strong> orders
        </div>

        <div className="pager">
          <button onClick={() => handlePage(1)} disabled={page <= 1}>«</button>
          <button onClick={() => handlePage(page - 1)} disabled={page <= 1}>‹</button>
          <span className="page-indicator">{page} / {totalPages}</span>
          <button onClick={() => handlePage(page + 1)} disabled={page >= totalPages}>›</button>
          <button onClick={() => handlePage(totalPages)} disabled={page >= totalPages}>»</button>
        </div>
      </div>
    </div>
  );
}

OrderList.propTypes = {
  orders: PropTypes.array.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};
