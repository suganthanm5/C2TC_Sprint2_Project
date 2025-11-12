import React, { useEffect, useState } from 'react';
import { apiFetch } from './api';
import OrderForm from './components/OrderForm';
import OrderList from './components/OrderList';
import './App.css';

function App() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editingOrder, setEditingOrder] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch('');
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError('Failed to load orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleCreate = async (order) => {
    await apiFetch('', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    });
    await fetchOrders();
  };

  const handleUpdate = async (id, order) => {
    await apiFetch(`/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    });
    setEditingOrder(null);
    await fetchOrders();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this order?')) return;
    await apiFetch(`/${id}`, { method: 'DELETE' });
    await fetchOrders();
  };

  return (
    <div className="app">
      <header>
        <h1>Order Management</h1>
      </header>

      <main>
        <section className="left">
          <OrderForm
            onCreate={handleCreate}
            onUpdate={handleUpdate}
            editingOrder={editingOrder}
            cancelEdit={() => setEditingOrder(null)}
          />
        </section>

        <section className="right">
          {loading && <div role="status">Loading orders…</div>}
          {error && <div className="error">{error}</div>}
          <OrderList
            orders={orders}
            onEdit={(order) => setEditingOrder(order)}
            onDelete={handleDelete}
          />
        </section>
      </main>

      <footer>
        <small>Frontend for Orders API</small>
      </footer>
    </div>
  );
}

export default App;
