import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import InventoryList from './components/InventoryList';
import AIChat from './components/AIChat';
import AlertsManager from './components/AlertsManager';

const API_BASE = 'http://localhost:8000';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [products, setProducts] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [webhooks, setWebhooks] = useState([]);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  // Load initial backend datasets
  const loadData = async () => {
    try {
      setError(null);
      const [prodRes, alertsRes, webhooksRes, statsRes] = await Promise.all([
        fetch(`${API_BASE}/api/products`),
        fetch(`${API_BASE}/api/alerts`),
        fetch(`${API_BASE}/api/webhooks`),
        fetch(`${API_BASE}/api/dashboard`)
      ]);

      if (!prodRes.ok || !alertsRes.ok || !webhooksRes.ok || !statsRes.ok) {
        throw new Error("One or more backend API endpoints returned an error.");
      }

      const [prodData, alertsData, webhooksData, statsData] = await Promise.all([
        prodRes.json(),
        alertsRes.json(),
        webhooksRes.json(),
        statsRes.json()
      ]);

      setProducts(prodData);
      setAlerts(alertsData);
      setWebhooks(webhooksData);
      setStats(statsData);
    } catch (err) {
      console.error("Failed to fetch data from FastAPI backend:", err);
      setError("Cannot connect to FastAPI backend server. Verify the server is running on port 8000.");
    }
  };

  useEffect(() => {
    loadData();
    // Poll stats every 10 seconds to keep dashboard and alerts log up to date
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  // --- API Handlers ---

  const handleAddProduct = async (productData) => {
    try {
      const response = await fetch(`${API_BASE}/api/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });
      if (!response.ok) throw new Error("Failed to add product.");
      await loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUpdateProduct = async (id, productData) => {
    try {
      const response = await fetch(`${API_BASE}/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });
      if (!response.ok) throw new Error("Failed to update product.");
      await loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteProduct = async (id) => {
    try {
      const response = await fetch(`${API_BASE}/api/products/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error("Failed to delete product.");
      await loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAddWebhook = async (webhookData) => {
    const response = await fetch(`${API_BASE}/api/webhooks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(webhookData)
    });
    if (!response.ok) throw new Error("Failed to subscribe webhook.");
    await loadData();
  };

  const handleDeleteWebhook = async (id) => {
    try {
      const response = await fetch(`${API_BASE}/api/webhooks/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error("Failed to remove webhook.");
      await loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleClearAlerts = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/alerts`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error("Failed to clear alerts log.");
      await loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSendQuery = async (queryText) => {
    const response = await fetch(`${API_BASE}/api/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: queryText })
    });
    if (!response.ok) throw new Error("Assistant response failed.");
    const data = await response.json();
    return data.response;
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-darker)' }}>
      
      {/* Decorative Glow Circles in background */}
      <div className="glow-circle" style={{ width: '400px', height: '400px', top: '-100px', left: '-100px', background: 'var(--accent-violet-glow)' }} />
      <div className="glow-circle" style={{ width: '400px', height: '400px', bottom: '-100px', right: '-100px', background: 'var(--accent-teal-glow)' }} />

      {/* Sidebar Navigation */}
      <div className="glass-panel" style={{
        width: '260px',
        borderRadius: '0 var(--border-radius-lg) var(--border-radius-lg) 0',
        borderLeft: 'none',
        padding: '32px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '40px',
        position: 'sticky',
        top: 0,
        height: '100vh',
        zIndex: 10
      }}>
        {/* Title / Logo */}
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '700', letterSpacing: '-0.02em', background: 'var(--grad-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>⚡</span> ethara.ai IMS
          </h2>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>AI Automation Console</div>
        </div>

        {/* Menu Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexGrow: 1 }}>
          {[
            { id: 'dashboard', label: '📊 Dashboard' },
            { id: 'inventory', label: '📦 Inventory List' },
            { id: 'ai_chat', label: '💬 AI Assistant' },
            { id: 'alerts', label: '🔔 Webhook Alerts' }
          ].map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  textAlign: 'left',
                  padding: '12px 16px',
                  borderRadius: 'var(--border-radius-md)',
                  background: isActive ? 'var(--grad-primary)' : 'transparent',
                  color: isActive ? '#fff' : 'var(--text-secondary)',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: isActive ? '600' : '400',
                  cursor: 'pointer',
                  transition: 'var(--transition-smooth)',
                  boxShadow: isActive ? '0 4px 12px rgba(139, 92, 246, 0.2)' : 'none'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.target.style.background = 'rgba(255,255,255,0.03)';
                    e.target.style.color = 'var(--text-primary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.target.style.background = 'transparent';
                    e.target.style.color = 'var(--text-secondary)';
                  }
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Footer info */}
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px', fontSize: '11px', color: 'var(--text-muted)' }}>
          <div>Assessed Candidate:</div>
          <div style={{ color: 'var(--text-primary)', fontWeight: '500', marginTop: '2px' }}>Anshu (AI Automation)</div>
        </div>
      </div>

      {/* Main Content Workspace */}
      <div style={{ flexGrow: 1, padding: '40px', overflowY: 'auto', zIndex: 1, position: 'relative' }}>
        
        {/* Error Alert Display */}
        {error && (
          <div className="glass-panel" style={{
            padding: '16px 20px',
            borderColor: 'var(--status-danger)',
            background: 'var(--status-danger-bg)',
            color: '#fca5a5',
            marginBottom: '28px',
            fontSize: '14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span><strong>Connection Error:</strong> {error}</span>
            <button onClick={loadData} className="btn btn-secondary btn-sm" style={{ background: 'rgba(255,255,255,0.08)' }}>
              Retry Connect
            </button>
          </div>
        )}

        {/* View switching logic */}
        {activeTab === 'dashboard' && (
          <Dashboard stats={stats} onViewInventory={() => setActiveTab('inventory')} />
        )}
        {activeTab === 'inventory' && (
          <InventoryList
            products={products}
            onAddProduct={handleAddProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
          />
        )}
        {activeTab === 'ai_chat' && (
          <AIChat onSendQuery={handleSendQuery} />
        )}
        {activeTab === 'alerts' && (
          <AlertsManager
            alerts={alerts}
            webhooks={webhooks}
            onAddWebhook={handleAddWebhook}
            onDeleteWebhook={handleDeleteWebhook}
            onClearAlerts={handleClearAlerts}
          />
        )}

      </div>

    </div>
  );
}
