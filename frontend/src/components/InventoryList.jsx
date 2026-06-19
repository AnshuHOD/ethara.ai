import React, { useState } from 'react';

export default function InventoryList({ products, onAddProduct, onUpdateProduct, onDeleteProduct }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [lowStockFilter, setLowStockFilter] = useState(false);
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  
  // Form State
  const initialFormState = {
    name: '',
    category: '',
    quantity: 0,
    reorder_threshold: 10,
    price: 0.0,
    supplier_name: '',
    supplier_contact: ''
  };
  const [formData, setFormData] = useState(initialFormState);

  // Extract unique categories for filter dropdown
  const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));

  // Filter products locally for instantaneous UI updates
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.lowerCase?.includes(searchTerm.toLowerCase()) || 
                          p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === '' || p.category === categoryFilter;
    const matchesLowStock = !lowStockFilter || (p.quantity <= p.reorder_threshold);
    return matchesSearch && matchesCategory && matchesLowStock;
  });

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData(initialFormState);
    setShowModal(true);
  };

  const openEditModal = (prod) => {
    setEditingProduct(prod);
    setFormData({
      name: prod.name,
      category: prod.category || '',
      quantity: prod.quantity,
      reorder_threshold: prod.reorder_threshold,
      price: prod.price,
      supplier_name: prod.supplier_name || '',
      supplier_contact: prod.supplier_contact || ''
    });
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'quantity' || name === 'reorder_threshold' 
        ? parseInt(value) || 0 
        : name === 'price' 
          ? parseFloat(value) || 0.0 
          : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingProduct) {
      onUpdateProduct(editingProduct.id, formData);
    } else {
      onAddProduct(formData);
    }
    setShowModal(false);
  };

  const handleDelete = (id, name) => {
    if (window.confirm(`Are you sure you want to delete product "${name}"?`)) {
      onDeleteProduct(id);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Action Header & Filters */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'center' }}>
        
        {/* Left: Filters */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', flexGrow: 1, maxWidth: '80%' }}>
          
          {/* Search Box */}
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ minWidth: '200px', flexGrow: 1 }}
          />

          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{ minWidth: '150px' }}
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* Low Stock Switch */}
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0, textTransform: 'none', fontSize: '14px', color: 'var(--text-primary)' }}>
            <input
              type="checkbox"
              checked={lowStockFilter}
              onChange={(e) => setLowStockFilter(e.target.checked)}
              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
            />
            <span>Show Low Stock Only</span>
          </label>

        </div>

        {/* Right: Add Product Button */}
        <button onClick={openAddModal} className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>
          + Add Product
        </button>

      </div>

      {/* Main Inventory Table */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Category</th>
                <th>Stock Level</th>
                <th>Price</th>
                <th>Supplier Info</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No products found matching filters.
                  </td>
                </tr>
              ) : (
                filteredProducts.map(prod => {
                  const isLow = prod.quantity <= prod.reorder_threshold;
                  return (
                    <tr key={prod.id}>
                      <td style={{ fontWeight: '600' }}>{prod.name}</td>
                      <td>
                        <span style={{ background: 'rgba(255,255,255,0.04)', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                          {prod.category || 'Unassigned'}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: '500' }}>{prod.quantity}</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '6px' }}>
                          (Min: {prod.reorder_threshold})
                        </span>
                      </td>
                      <td style={{ fontWeight: '500', color: 'var(--text-primary)' }}>
                        ${prod.price.toFixed(2)}
                      </td>
                      <td>
                        <div style={{ fontSize: '13px' }}>{prod.supplier_name || 'N/A'}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{prod.supplier_contact || ''}</div>
                      </td>
                      <td>
                        <span className={`badge ${isLow ? 'badge-danger' : 'badge-success'}`}>
                          {isLow ? 'Low Stock' : 'Healthy'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button onClick={() => openEditModal(prod)} className="btn btn-secondary btn-sm">
                            Edit
                          </button>
                          <button onClick={() => handleDelete(prod.id, prod.name)} className="btn btn-danger btn-sm">
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit / Add Modal Popup */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(5, 5, 10, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(8px)'
        }}>
          
          <div className="glass-panel glass-card-grad animate-fade-in" style={{
            width: '100%',
            maxWidth: '520px',
            padding: '28px',
            background: 'var(--bg-dark)'
          }}>
            
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>
              {editingProduct ? `Edit Product: ${editingProduct.name}` : 'Create New Product'}
            </h3>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Product Name */}
              <div>
                <label>Product Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g. Dell XPS Laptop"
                  style={{ width: '100%' }}
                />
              </div>

              {/* Category */}
              <div>
                <label>Category</label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  placeholder="e.g. Electronics"
                  style={{ width: '100%' }}
                />
              </div>

              {/* Numeric Row: Quantity & Reorder Threshold */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label>Quantity in Stock</label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    min="0"
                    required
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label>Min Reorder Threshold</label>
                  <input
                    type="number"
                    name="reorder_threshold"
                    value={formData.reorder_threshold}
                    onChange={handleInputChange}
                    min="0"
                    required
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              {/* Price */}
              <div>
                <label>Unit Price ($)</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  min="0.0"
                  step="0.01"
                  required
                  style={{ width: '100%' }}
                />
              </div>

              {/* Supplier Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label>Supplier Name</label>
                  <input
                    type="text"
                    name="supplier_name"
                    value={formData.supplier_name}
                    onChange={handleInputChange}
                    placeholder="e.g. Ingram Micro"
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label>Supplier Contact</label>
                  <input
                    type="text"
                    name="supplier_contact"
                    value={formData.supplier_contact}
                    onChange={handleInputChange}
                    placeholder="e.g. contact@ingram.com"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              {/* Modal Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
