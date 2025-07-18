import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Admin = ({ user }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [analytics, setAnalytics] = useState(null);
  const [purchases, setPurchases] = useState([]);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      if (activeTab === 'dashboard') {
        fetchAnalytics(true);
      }
      setLastRefresh(new Date());
    }, 3000);

    return () => clearInterval(interval);
  }, [activeTab]);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  useEffect(() => {
    switch (activeTab) {
      case 'dashboard':
        fetchAnalytics();
        break;
      case 'purchases':
        fetchPurchases();
        break;
      case 'users':
        fetchUsers();
        break;
      case 'products':
        fetchProducts();
        break;
      default:
        break;
    }
  }, [activeTab]);

  const fetchAnalytics = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data } = await axios.get(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/admin/analytics`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const fetchPurchases = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/admin/purchases?limit=100`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );
      setPurchases(data.purchases || data);
    } catch (error) {
      console.error('Failed to fetch purchases:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/admin/users`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );
      setUsers(data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/admin/products`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );
      setProducts(data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserAdmin = async (userId, currentStatus) => {
    try {
      await axios.patch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/admin/users/${userId}/admin`,
        { isAdmin: !currentStatus },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );
      fetchUsers();
    } catch (error) {
      console.error('Failed to update user admin status:', error);
      alert(error.response?.data?.message || 'Failed to update user admin status');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCustomerValueColor = (value) => {
    switch (value) {
      case 'High': return '#28a745';
      case 'Medium': return '#ffc107';
      case 'Low': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const renderDashboard = () => (
    <div className="admin-dashboard">
      <div className="welcome-message">
        <h2>🎉 Real-Time Super Admin Dashboard</h2>
        <p>Live data from your e-commerce store - Last updated: {lastRefresh.toLocaleTimeString()}</p>
        <button onClick={() => fetchAnalytics()} className="refresh-btn">
          🔄 Refresh Data
        </button>
      </div>
      
      <div className="admin-stats">
        <div className="stat-card primary">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>{analytics?.totalUsers || 0}</h3>
            <p>Total Users</p>
            <small>Real registered customers</small>
          </div>
        </div>
        <div className="stat-card success">
          <div className="stat-icon"></div>
          <div className="stat-content">
            <h3>{analytics?.totalProducts || 0}</h3>
            <p>Active Products</p>
            <small>Available in store</small>
          </div>
        </div>
        <div className="stat-card info">
          <div className="stat-icon"></div>
          <div className="stat-content">
            <h3>{analytics?.completedPurchases || 0}</h3>
            <p>Successful Orders</p>
            <small>{analytics?.totalPurchases || 0} total attempts</small>
            <small>Conversion: {analytics?.conversionRate || 0}%</small>
          </div>
        </div>
        <div className="stat-card revenue">
          <div className="stat-icon"></div>
          <div className="stat-content">
            <h3>${analytics?.totalRevenue || '0.00'}</h3>
            <p>Total Revenue</p>
            <small>Avg: ${analytics?.avgOrderValue || '0.00'} per order</small>
          </div>
        </div>
      </div>

      <div className="admin-sections">
        <div className="section">
          <h3>Live Purchase Activity</h3>
          <div className="recent-purchases">
            {analytics?.recentPurchases?.slice(0, 8).map(purchase => (
              <div key={purchase._id} className="recent-purchase-item">
                <img 
                  src={purchase.userId.profileImage} 
                  alt={purchase.userId.name}
                  className="user-avatar"
                />
                <div className="purchase-details">
                  <p><strong>{purchase.userId.name}</strong></p>
                  <p className="product-name">{purchase.productId.name}</p>
                  <p className="purchase-amount">${purchase.amount}</p>
                  <p className="purchase-time">{formatDate(purchase.createdAt)}</p>
                </div>
                <div className="purchase-status">
                  <span className={`status ${purchase.paymentStatus}`}>
                    {purchase.paymentStatus.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
            {(!analytics?.recentPurchases || analytics.recentPurchases.length === 0) && (
              <div className="no-data">
                <p>No recent purchases yet</p>
                <small>When customers make purchases, they'll appear here</small>
              </div>
            )}
          </div>
        </div>

        <div className="section">
          <h3>Best Performing Products</h3>
          <div className="top-products">
            {analytics?.topProducts?.map((item, index) => (
              <div key={item._id} className="top-product-item">
                <div className="rank">#{index + 1}</div>
                <img 
                  src={item.product.imageUrl} 
                  alt={item.product.name}
                  className="product-thumb"
                />
                <div className="product-stats">
                  <h4>{item.product.name}</h4>
                  <p><strong>{item.totalSold}</strong> units sold</p>
                  <p className="revenue">${item.totalRevenue.toFixed(2)} revenue</p>
                  <p className="avg-order">Avg: ${item.avgOrderValue?.toFixed(2) || '0.00'}</p>
                </div>
              </div>
            ))}
            {(!analytics?.topProducts || analytics.topProducts.length === 0) && (
              <div className="no-data">
                <p>No sales data yet</p>
                <small>Top selling products will appear here</small>
              </div>
            )}
          </div>
        </div>

        <div className="section">
          <h3>VIP Customers</h3>
          <div className="top-customers">
            {analytics?.topUsers?.map((item, index) => (
              <div key={item._id} className="top-customer-item">
                <div className="rank">#{index + 1}</div>
                <img 
                  src={item.user.profileImage} 
                  alt={item.user.name}
                  className="customer-avatar"
                />
                <div className="customer-stats">
                  <h4>{item.user.name}</h4>
                  <p className="customer-email">{item.user.email}</p>
                  <p><strong>{item.orderCount}</strong> orders completed</p>
                  <p className="spent">${item.totalSpent.toFixed(2)} total spent</p>
                  <p className="avg-spent">Avg: ${item.avgOrderValue?.toFixed(2) || '0.00'} per order</p>
                  <p className="last-purchase">Last purchase: {formatDate(item.lastPurchase)}</p>
                </div>
              </div>
            ))}
            {(!analytics?.topUsers || analytics.topUsers.length === 0) && (
              <div className="no-data">
                <p>No customer data yet</p>
                <small>Top customers will appear here</small>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="admin-users">
      <div className="section-header">
        <h3>👥 Customer Management ({users.length} Users)</h3>
        <p>Complete customer analytics with real spending data and behavior insights</p>
      </div>
      
      <div className="users-grid">
        {users.map(user => (
          <div key={user._id} className="user-card enhanced">
            <div className="user-header">
              <img 
                src={user.profileImage} 
                alt={user.name}
                className="user-card-image"
              />
              <div className="user-info">
                <h4>{user.name}</h4>
                <p className="user-email">{user.email}</p>
                <span className={`user-role ${user.isAdmin ? 'admin' : 'user'}`}>
                  {!user.isAdmin ? 'Customer' : 'Admin'}
                </span>
                {user.email === 'tanmaysawankar9175@gmail.com' && (
                  <span className="super-admin-badge"> Super Admin</span>
                )}
                <span 
                  className="customer-value"
                  style={{ color: getCustomerValueColor(user.customerValue) }}
                >
                   {/* {user.customerValue} Value Customer */}
                </span>
              </div>
            </div>
            
            <div className="user-stats enhanced">
              <div className="stat-row">
                <div className="stat">
                  <span className="stat-label">Total Orders:</span>
                  <span className="stat-value">{user.completedPurchases}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Total Spent:</span>
                  <span className="stat-value">${user.totalSpent}</span>
                </div>
              </div>
              <div className="stat-row">
                <div className="stat">
                  <span className="stat-label">Avg Order:</span>
                  <span className="stat-value">${user.avgOrderValue}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Failed Orders:</span>
                  <span className="stat-value">{user.failedPurchases || 0}</span>
                </div>
              </div>
              <div className="stat-row">
                <div className="stat">
                  <span className="stat-label">Account Age:</span>
                  <span className="stat-value">{user.accountAge} days</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Purchase Frequency:</span>
                  <span className="stat-value">
                    {user.purchaseFrequency > 0 ? `${user.purchaseFrequency} days` : 'N/A'}
                  </span>
                </div>
              </div>
              {user.lastPurchase && (
                <div className="stat-row">
                  <div className="stat full-width">
                    <span className="stat-label">Last Purchase:</span>
                    <span className="stat-value">{formatDate(user.lastPurchase)}</span>
                  </div>
                </div>
              )}
              <div className="stat-row">
                <div className="stat full-width">
                  <span className="stat-label">Member Since:</span>
                  <span className="stat-value">{formatDate(user.createdAt)}</span>
                </div>
              </div>
              
              {user.favoriteProducts && user.favoriteProducts.length > 0 && (
                <div className="favorite-products">
                  <h5>Favorite Products:</h5>
                  {user.favoriteProducts.slice(0, 2).map(fav => (
                    <div key={fav._id} className="favorite-item">
                      <span>{fav.product.name}</span>
                      <span className="purchase-count">({fav.count} purchases)</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* <div className="user-actions">
              {user.email !== 'tanmaysawankar9175@gmail.com' && (
                <button 
                  className={`admin-toggle ${user.isAdmin ? 'revoke' : 'grant'}`}
                  onClick={() => toggleUserAdmin(user._id, user.isAdmin)}
                >
                  {user.isAdmin ? '❌ Revoke Admin' : '✅ Grant Admin'}
                </button>
              )}
              {user.email === 'tanmaysawankar9175@gmail.com' && (
                <div className="super-admin-note">
                  Super Admin (Protected Account)
                </div>
              )}
            </div> */}
          </div>
        ))}
      </div>
    </div>
  );

  const renderProducts = () => (
    <div className="admin-products">
      <div className="section-header">
        <h3>Product Performance Analytics ({products.length} Products)</h3>
        <p>Real-time product sales data, customer insights, and performance metrics</p>
      </div>
      
      <div className="products-grid enhanced">
        {products.map(product => (
          <div key={product._id} className="product-admin-card enhanced">
            <div className="product-header">
              <img 
                src={product.imageUrl} 
                alt={product.name}
                className="product-admin-image"
              />
              <div className="product-status-badge">
                <span className={`status-indicator ${product.status.toLowerCase()}`}>
                  {product.status}
                </span>
                <span className={`trend-indicator ${product.trending.toLowerCase()}`}>
                  {product.trending === 'Up' ? '📈' : '📊'} {product.trending}
                </span>
              </div>
            </div>
            
            <div className="product-admin-info">
              <h4>{product.name}</h4>
              <p className="product-description">{product.description}</p>
              
              <div className="product-admin-stats">
                <div className="stat-grid">
                  <div className="product-stat">
                    <span className="stat-label">Listed Price:</span>
                    <span className="stat-value price">${product.price}</span>
                  </div>
                  <div className="product-stat">
                    <span className="stat-label">Units Sold:</span>
                    <span className="stat-value success">{product.totalSales}</span>
                  </div>
                  <div className="product-stat">
                    <span className="stat-label">Total Revenue:</span>
                    <span className="stat-value revenue">${product.totalRevenue}</span>
                  </div>
                  <div className="product-stat">
                    <span className="stat-label">Conversion Rate:</span>
                    <span className="stat-value">{product.conversionRate}%</span>
                  </div>
                  <div className="product-stat">
                    <span className="stat-label">Avg Sale Value:</span>
                    <span className="stat-value">${product.avgSaleValue}</span>
                  </div>
                  <div className="product-stat">
                    <span className="stat-label">Recent Sales (30d):</span>
                    <span className="stat-value">{product.recentSales30Days}</span>
                  </div>
                  <div className="product-stat">
                    <span className="stat-label">Failed Attempts:</span>
                    <span className="stat-value warning">{product.failedSales}</span>
                  </div>
                  <div className="product-stat">
                    <span className="stat-label">Popularity Score:</span>
                    <span className="stat-value">{product.popularityScore}</span>
                  </div>
                </div>

                {product.firstSale && (
                  <div className="timeline-info">
                    <p><strong>First Sale:</strong> {formatDate(product.firstSale)}</p>
                    {product.lastSale && (
                      <p><strong>Last Sale:</strong> {formatDate(product.lastSale)}</p>
                    )}
                  </div>
                )}
              </div>

              {product.recentBuyers && product.recentBuyers.length > 0 && (
                <div className="recent-buyers">
                  <h5>Recent Customers ({product.recentBuyers.length}):</h5>
                  <div className="buyers-list">
                    {product.recentBuyers.slice(0, 3).map((buyer, index) => (
                      <div key={index} className="buyer-item">
                        <img 
                          src={buyer.user.profileImage} 
                          alt={buyer.user.name}
                          className="buyer-avatar"
                        />
                        <div className="buyer-info">
                          <span className="buyer-name">{buyer.user.name}</span>
                          <span className="buyer-amount">${buyer.amount}</span>
                          <span className="buyer-date">{formatDate(buyer.purchaseDate)}</span>
                        </div>
                      </div>
                    ))}
                    {product.recentBuyers.length > 3 && (
                      <div className="more-buyers">
                        +{product.recentBuyers.length - 3} more customers
                      </div>
                    )}
                  </div>
                </div>
              )}

              {product.totalSales === 0 && (
                <div className="no-sales-notice">
                  <p>🚀 No sales yet - promote this product!</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPurchases = () => (
    <div className="admin-purchases">
      <div className="section-header">
        <h3>🛒 Complete Order History ({purchases.length} Orders)</h3>
        <p>Real-time order tracking with customer details and payment information</p>
      </div>
      
      <div className="purchases-table">
        <table>
          <thead>
            <tr>
              <th>Order Info</th>
              <th>Customer Details</th>
              <th>Product Details</th>
              <th>Financial Info</th>
              <th>Status & Payment</th>
            </tr>
          </thead>
          <tbody>
            {purchases.map(purchase => (
              <tr key={purchase._id}>
                <td>
                  <div className="order-info">
                    <strong>#{purchase._id.slice(-8).toUpperCase()}</strong>
                    <p>{formatDate(purchase.createdAt)}</p>
                  </div>
                </td>
                <td>
                  <div className="customer-info">
                    <img 
                      src={purchase.userId.profileImage} 
                      alt={purchase.userId.name}
                      className="table-user-image"
                    />
                    <div>
                      <div className="customer-name">{purchase.userId.name}</div>
                      <div className="email">{purchase.userId.email}</div>
                      <div className="member-since">
                        Member since {formatDate(purchase.userId.createdAt)}
                      </div>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="product-info">
                    <img 
                      src={purchase.productId.imageUrl} 
                      alt={purchase.productId.name}
                      className="table-product-image"
                    />
                    <div>
                      <div className="product-name">{purchase.productId.name}</div>
                      <div className="product-price">Listed: ${purchase.productId.price}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="financial-info">
                    <div className="amount">${purchase.amount}</div>
                    <div className="payment-method">Card Payment</div>
                  </div>
                </td>
                <td>
                  <div className="status-info">
                    <span className={`status ${purchase.paymentStatus}`}>
                      {purchase.paymentStatus.toUpperCase()}
                    </span>
                    <div className="payment-id">
                      {purchase.stripePaymentId ? (
                        <span title={purchase.stripePaymentId}>
                          ID: {purchase.stripePaymentId.slice(-8)}
                        </span>
                      ) : (
                        'No Payment ID'
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {purchases.length === 0 && (
          <div className="no-data-table">
            <p>No orders found</p>
            <small>When customers make purchases, they'll appear here in real-time</small>
          </div>
        )}
      </div>
    </div>
  );

  if (loading && !analytics && !purchases.length && !users.length && !products.length) {
    return (
      <div className="admin-page">
        <div className="loading">
          <div className="spinner-large"></div>
          <p>Loading real-time admin data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>👑 Live E-Commerce Control Center</h1>
        <p>Welcome {user.name} - Real-time insights into your store performance</p>
      </div>

      <div className="admin-tabs">
        <button 
          className={`tab-button ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          📊 Live Dashboard
        </button>
        <button 
          className={`tab-button ${activeTab === 'purchases' ? 'active' : ''}`}
          onClick={() => setActiveTab('purchases')}
        >
          🛒 All Orders ({purchases.length})
        </button>
        <button 
          className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          👥 Customers ({users.length})
        </button>
        <button 
          className={`tab-button ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => setActiveTab('products')}
        >
          📦 Products ({products.length})
        </button>
      </div>

      <div className="admin-content">
        {loading && <div className="loading-overlay">Updating real-time data...</div>}
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'purchases' && renderPurchases()}
        {activeTab === 'users' && renderUsers()}
        {activeTab === 'products' && renderProducts()}
      </div>
    </div>
  );
};

export default Admin;