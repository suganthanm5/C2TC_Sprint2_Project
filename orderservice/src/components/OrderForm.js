import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import './OrderForm.css';



function pad(n) {
  return String(n).padStart(2, '0');
}

function dateToInputValue(d) {

  const Y = d.getFullYear();
  const M = pad(d.getMonth() + 1);
  const D = pad(d.getDate());
  const h = pad(d.getHours());
  const m = pad(d.getMinutes());
  return `${Y}-${M}-${D}T${h}:${m}`;
}

function dateToBackendValue(d) {
  
  const Y = d.getFullYear();
  const M = pad(d.getMonth() + 1);
  const D = pad(d.getDate());
  const h = pad(d.getHours());
  const m = pad(d.getMinutes());
  const s = pad(d.getSeconds());
  return `${Y}-${M}-${D}T${h}:${m}:${s}`;
}

function parseAnyToDate(value) {
  if (value === null || value === undefined) return new Date();

  if (typeof value === 'string') {
    
    const cleaned = value.split('.')[0].replace('Z', '');
    // If it contains 'T', try Date.parse
    if (cleaned.includes('T')) {
      const parsed = new Date(cleaned);
      if (!isNaN(parsed)) return parsed;
    }
   
    const parsed = new Date(value);
    if (!isNaN(parsed)) return parsed;
    return new Date(); 
  }

  if (typeof value === 'number') {
    const ms = value < 1e12 ? value * 1000 : value;
    const parsed = new Date(ms);
    if (!isNaN(parsed)) return parsed;
    return new Date();
  }

  
  if (value instanceof Date) {
    return value;
  }


  if (typeof value === 'object') {
    const year = value.year ?? value.Y ?? value.y;
    const month = value.month ?? value.m;
    const day = value.day ?? value.d;
    if (year && month && day) {
      const h = value.hour ?? value.h ?? 0;
      const min = value.minute ?? value.min ?? 0;
      const sec = value.second ?? value.s ?? 0;
      // months in JS Date are 0-indexed
      return new Date(year, month - 1, day, h, min, sec);
    }
  
    try {
      const maybe = JSON.stringify(value);
      const parsed = new Date(maybe);
      if (!isNaN(parsed)) return parsed;
    } catch {}
  }

 
  return new Date();
}

export default function OrderForm({ onCreate, onUpdate, editingOrder, cancelEdit }) {
  const [id, setId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [product, setProduct] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);
  const [orderDateInput, setOrderDateInput] = useState(() => dateToInputValue(new Date()));
  const [status, setStatus] = useState('NEW');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // when editingOrder changes, normalize values safely
  useEffect(() => {
    if (editingOrder) {
      setId(editingOrder.id ?? '');
      setCustomerName(editingOrder.customerName ?? '');
      setProduct(editingOrder.product ?? '');
      setQuantity(editingOrder.quantity ?? 1);
      setUnitPrice(editingOrder.unitPrice ?? 0);
      try {
        // Normalize orderDate from any shape to a Date, then to input string
        const d = parseAnyToDate(editingOrder.orderDate);
        setOrderDateInput(dateToInputValue(d));
      } catch (err) {
        console.warn('Could not parse editingOrder.orderDate', editingOrder?.orderDate, err);
        setOrderDateInput(dateToInputValue(new Date()));
      }
      setStatus(editingOrder.status ?? 'NEW');
    } else {
      // reset
      setId('');
      setCustomerName('');
      setProduct('');
      setQuantity(1);
      setUnitPrice(0);
      setOrderDateInput(dateToInputValue(new Date()));
      setStatus('NEW');
      setFormError(null);
    }
  }, [editingOrder]);

  const validate = () => {
    if (!customerName.trim()) return 'Customer name is required';
    if (!product.trim()) return 'Product is required';
    if (!Number.isFinite(Number(quantity)) || Number(quantity) <= 0) return 'Quantity must be a positive number';
    if (!Number.isFinite(Number(unitPrice)) || Number(unitPrice) < 0) return 'Unit price must be a non-negative number';
    if (!orderDateInput || isNaN(new Date(orderDateInput).getTime())) return 'Order date is invalid';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    const v = validate();
    if (v) {
      setFormError(v);
      return;
    }

    
    const dateObj = new Date(orderDateInput);
    const backendOrderDate = dateToBackendValue(dateObj);

    const payload = {
     
      ...(id ? { id: Number(id) } : {}),
      customerName: customerName.trim(),
      product: product.trim(),
      quantity: Number(quantity),
      unitPrice: Number(unitPrice),
      orderDate: backendOrderDate,
      status: status.trim(),
    };

    setSubmitting(true);
    try {
      if (editingOrder) {
        
        await onUpdate(editingOrder.id, payload);
      } else {
        await onCreate(payload);
      }

     
      if (!editingOrder) {
        setId('');
        setCustomerName('');
        setProduct('');
        setQuantity(1);
        setUnitPrice(0);
        setOrderDateInput(dateToInputValue(new Date()));
        setStatus('NEW');
      }
    } catch (err) {
      console.error('Save failed', err);
      setFormError(err?.message || 'Failed to save order');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="order-form card">
      <h2>{editingOrder ? 'Edit Order' : 'New Order'}</h2>
      <form onSubmit={handleSubmit}>
        <label>
          ID
          <input
            type="number"
            value={id}
            onChange={(e) => setId(e.target.value)}
            placeholder="Leave blank to auto-create"
            aria-label="Order ID"
            disabled={!!editingOrder}
          />
        </label>

        <label>
          Customer Name
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            required
            aria-label="Customer Name"
          />
        </label>

        <label>
          Product
          <input
            type="text"
            value={product}
            onChange={(e) => setProduct(e.target.value)}
            required
            aria-label="Product"
          />
        </label>

        <label>
          Quantity
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            min="1"
            required
            aria-label="Quantity"
          />
        </label>

        <label>
          Unit Price
          <input
            type="number"
            value={unitPrice}
            onChange={(e) => setUnitPrice(e.target.value)}
            step="0.01"
            min="0"
            required
            aria-label="Unit Price"
          />
        </label>

        <label>
          Order Date
          <input
            type="datetime-local"
            value={orderDateInput}
            onChange={(e) => setOrderDateInput(e.target.value)}
            aria-label="Order Date"
            required
          />
        </label>

        <label>
          Status
          <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
            <option value="NEW">NEW</option>
            <option value="PROCESSING">PROCESSING</option>
            <option value="SHIPPED">SHIPPED</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </label>

        {formError && <div className="form-error" role="alert">{formError}</div>}

        <div className="form-actions">
          <button type="submit" disabled={submitting}>
            {editingOrder ? (submitting ? 'Updating…' : 'Update Order') : (submitting ? 'Creating…' : 'Create Order')}
          </button>

          {editingOrder ? (
            <button type="button" className="secondary" onClick={cancelEdit} disabled={submitting}>
              Cancel
            </button>
          ) : (
            <button
              type="button"
              className="secondary"
              onClick={() => {
                setId('');
                setCustomerName('');
                setProduct('');
                setQuantity(1);
                setUnitPrice(0);
                setOrderDateInput(dateToInputValue(new Date()));
                setStatus('NEW');
                setFormError(null);
              }}
              disabled={submitting}
            >
              Reset
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

OrderForm.propTypes = {
  onCreate: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired,
  editingOrder: PropTypes.object,
  cancelEdit: PropTypes.func.isRequired,
};
