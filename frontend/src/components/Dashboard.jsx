import React from 'react';

export default function Dashboard({ stats, onViewInventory }) {
  if (!stats) return <div style={{ padding: '20px', color: 'var(--text-secondary)' }}>Loading dashboard statistics...</div>;

  const {
    total_products,
    total_stock_items,
    total_stock_value,
    low_stock_count,
    active_alerts_count,
    category_distribution,
    low_stock_items
  } = stats;

  // Find max category value to scale the category distribution bars
  const categories = Object.keys(category_distribution || {});
  const maxCategoryValue = Math.max(...Object.values(category_distribution || {}), 1);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* Upper Grid Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '20px'
      }}>
        
        {/* Total Products Card */}
        <div className="glass-panel glass-card-grad" style={{ padding: '24px', position: 'relative' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Unique Products</div>
          <div style={{ fontSize: '36px', fontWeight: '700', marginTop: '8px', background: 'var(--grad-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'inline-block' }}>
            {total_products}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>Active database items</div>
        </div>

        {/* Total Stock Volume Card */}
        <div className="glass-panel glass-card-grad" style={{ padding: '24px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Stock Items</div>
          <div style={{ fontSize: '36px', fontWeight: '700', marginTop: '8px', color: 'var(--text-primary)' }}>
            {total_stock_items.toLocaleString()}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>Physical stock total</div>
        </div>

        {/* Total Value Card */}
        <div className="glass-panel glass-card-grad" style={{ padding: '24px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Stock Valuation</div>
          <div style={{ fontSize: '36px', fontWeight: '700', marginTop: '8px', color: 'var(--status-success)' }}>
            ${total_stock_value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>Asset cumulative price</div>
        </div>

        {/* Low Stock count Card */}
        <div className="glass-panel glass-card-grad" style={{
          padding: '24px',
          borderColor: low_stock_count > 0 ? 'rgba(239, 68, 68, 0.25)' : 'var(--border-color)'
        }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Low Stock Warns</div>
          <div style={{ 
            fontSize: '36px', 
            fontWeight: '700', 
            marginTop: '8px', 
            color: low_stock_count > 0 ? 'var(--status-danger)' : 'var(--text-primary)' 
          }}>
            {low_stock_count}
          </div>
          <div style={{ fontSize: '12px', color: low_stock_count > 0 ? 'var(--status-danger)' : 'var(--text-muted)', marginTop: '8px' }}>
            {low_stock_count > 0 ? 'Requires attention' : 'All levels healthy'}
          </div>
        </div>

      </div>

      {/* Main Grid Sections */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '24px'
      }}>
        
        {/* Category distribution visual */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600' }}>Stock Category Distribution</h3>
          
          {categories.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0' }}>No product categories registered.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '4px' }}>
              {categories.map(cat => {
                const qty = category_distribution[cat];
                const percentage = (qty / maxCategoryValue) * 100;
                return (
                  <div key={cat} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>{cat}</span>
                      <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{qty.toLocaleString()} units</span>
                    </div>
                    <div style={{ height: '8px', background: 'rgba(255,255,255,0.04)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${percentage}%`,
                        background: 'var(--grad-primary)',
                        borderRadius: '4px',
                        transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)'
                      }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Low stock table shortcut */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600' }}>Items Needing Reorder</h3>
            {low_stock_count > 0 && (
              <button onClick={onViewInventory} className="btn btn-secondary btn-sm">
                View All
              </button>
            )}
          </div>

          {low_stock_items.length === 0 ? (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              color: 'var(--text-muted)', 
              textAlign: 'center', 
              padding: '40px 0',
              gap: '12px'
            }}>
              <span style={{ fontSize: '24px', color: 'var(--status-success)' }}>✓</span>
              <div>All items are above their minimum thresholds. Excellent inventory health!</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {low_stock_items.slice(0, 5).map(prod => (
                <div key={prod.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  background: 'rgba(239, 68, 68, 0.04)',
                  border: '1px solid rgba(239, 68, 68, 0.1)',
                  borderRadius: 'var(--border-radius-md)'
                }}>
                  <div>
                    <div style={{ fontWeight: '500', fontSize: '14px' }}>{prod.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Reorder Threshold: {prod.reorder_threshold}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="badge badge-danger">
                      {prod.quantity} Left
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Supplier: {prod.supplier_name || 'None'}
                    </div>
                  </div>
                </div>
              ))}
              {low_stock_items.length > 5 && (
                <div style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  And {low_stock_items.length - 5} other products require restocking...
                </div>
              )}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
