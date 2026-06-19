import React, { useState } from 'react';

export default function AlertsManager({
  alerts,
  webhooks,
  onAddWebhook,
  onDeleteWebhook,
  onClearAlerts
}) {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!webhookUrl.trim()) return;
    setIsSubmitting(true);
    try {
      await onAddWebhook({ url: webhookUrl, event_type: 'low_stock' });
      setWebhookUrl('');
    } catch (err) {
      alert(`Error subscribing webhook: ${err.message || err}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClear = () => {
    if (window.confirm("Are you sure you want to clear all historical stock alerts from the database?")) {
      onClearAlerts();
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '28px' }}>
      
      {/* Configuration Section: Webhooks */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '24px'
      }}>
        
        {/* Create Webhook Subscription */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '600' }}>Register Outbound Webhook</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Subscribe an external URL to receive real-time JSON payloads when stock drops below thresholds.
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '4px' }}>
            <div>
              <label>Target HTTP POST URL</label>
              <input
                type="url"
                required
                placeholder="https://your-server.com/hooks/low-stock"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>
            
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary"
              style={{ width: '100%' }}
            >
              {isSubmitting ? 'Registering...' : 'Register Webhook'}
            </button>
          </form>

          {/* Testing Tips */}
          <div style={{
            background: 'rgba(139, 92, 246, 0.04)',
            border: '1px solid rgba(139, 92, 246, 0.1)',
            borderRadius: 'var(--border-radius-md)',
            padding: '16px',
            fontSize: '12px',
            lineHeight: '1.5',
            marginTop: '8px'
          }}>
            <strong style={{ color: 'var(--accent-violet)', display: 'block', marginBottom: '6px' }}>💡 How to Test:</strong>
            1. Use a service like **webhook.site** or **pipedream** to get a free test URL.
            2. Subscribe the test URL above.
            3. Go to the **Inventory** tab, edit a product's stock to fall below its reorder threshold.
            4. Verify the outbound POST request with the JSON payload is delivered.
          </div>
        </div>

        {/* Active Webhook Subscriptions */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600' }}>Active Webhooks ({webhooks.length})</h3>
          
          {webhooks.length === 0 ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: 'var(--text-muted)',
              fontSize: '13px',
              textAlign: 'center',
              padding: '40px 0'
            }}>
              No active webhook URLs configured. Add one on the left to stream events!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', maxHeight: '320px' }}>
              {webhooks.map(wh => (
                <div key={wh.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--border-radius-md)'
                }}>
                  <div style={{ overflow: 'hidden', marginRight: '12px' }}>
                    <div style={{ fontWeight: '500', fontSize: '13px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={wh.url}>
                      {wh.url}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Event Type: <span style={{ color: 'var(--accent-teal)' }}>{wh.event_type}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => onDeleteWebhook(wh.id)}
                    className="btn btn-danger btn-sm"
                    style={{ padding: '4px 8px' }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Historical Stock Alerts logs */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '600' }}>Historical Stock Alerts Log</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Chronological log of alerts written to the database whenever stock thresholds were breached.
            </p>
          </div>
          {alerts.length > 0 && (
            <button onClick={handleClear} className="btn btn-secondary btn-sm" style={{ borderColor: 'rgba(239,68,68,0.2)' }}>
              Clear Logs
            </button>
          )}
        </div>

        {alerts.length === 0 ? (
          <div style={{
            color: 'var(--text-muted)',
            textAlign: 'center',
            padding: '60px 0',
            fontSize: '14px'
          }}>
            No alerts logged. Your inventory is healthy and quiet!
          </div>
        ) : (
          <div className="table-container" style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Product</th>
                  <th>Message</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map(alert => (
                  <tr key={alert.id}>
                    <td style={{ whiteSpace: 'nowrap', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {new Date(alert.triggered_at).toLocaleString()}
                    </td>
                    <td style={{ fontWeight: '600', color: 'var(--accent-teal)' }}>
                      {alert.product_name || `ID: ${alert.product_id}`}
                    </td>
                    <td style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                      {alert.message}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
