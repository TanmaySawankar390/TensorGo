import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ProductCard from '../components/ProductCard';

const Home = ({ user }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adminStats, setAdminStats] = useState(null);

  const isSuperAdmin = user?.email === 'tanmaysawankar9175@gmail.com' || user?.isAdmin;

  useEffect(() => {
    fetchProducts();
    if (isSuperAdmin) {
      fetchAdminStats();
    }
  }, [isSuperAdmin]);

  const fetchProducts = async () => {
    try {
      const { data } = await axios.get(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/products`
      );
      setProducts(data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminStats = async () => {
    try {
      const { data } = await axios.get(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/admin/analytics`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );
      setAdminStats(data);
    } catch (error) {
      console.error('Failed to fetch admin stats:', error);
    }
  };

  if (loading) {
    return <div className="loading">Loading products...</div>;
  }

  return (
    <div className="home-page">
      {isSuperAdmin ? (
        <div className="admin-hero-section">
          <h1>👑 Super Admin Store Overview</h1>
          <p>You're viewing the store as an administrator - purchasing is disabled</p>
          
          {adminStats && (
            <div className="admin-quick-stats">
              <div className="quick-stat">
                <span className="stat-number">{adminStats.totalUsers}</span>
                <span className="stat-label">Total Customers</span>
              </div>
              <div className="quick-stat">
                <span className="stat-number">{adminStats.completedPurchases}</span>
                <span className="stat-label">Orders Completed</span>
              </div>
              <div className="quick-stat">
                <span className="stat-number">${adminStats.totalRevenue || '0.00'}</span>
                <span className="stat-label">Total Revenue</span>
              </div>
              <div className="quick-stat">
                <span className="stat-number">{products.length}</span>
                <span className="stat-label">Products Listed</span>
              </div>
            </div>
          )}
          
          <div className="admin-actions">
            <a href="/admin" className="admin-action-btn">
              📊 View Full Dashboard
            </a>
            <button 
              className="admin-action-btn secondary"
              onClick={() => window.location.reload()}
            >
              🔄 Refresh Data
            </button>
          </div>
        </div>
      ) : (
        <div className="hero-section">
          <h1>Welcome to our Store</h1>
          <p>Discover amazing products at great prices</p>
        </div>
      )}
      
      <div className="products-section">
        {isSuperAdmin && (
          <div className="admin-section-header">
            <h2>📦 Product Catalog Management</h2>
            <p>Monitor your product listings and their performance</p>
          </div>
        )}
        
        <div className="products-grid">
          {products.map(product => (
            <ProductCard 
              key={product._id} 
              product={product} 
              user={user}
            />
          ))}
        </div>
      </div>
      
      {isSuperAdmin && adminStats && (
        <div className="admin-insights">
          <h2>🎯 Quick Insights</h2>
          <div className="insights-grid">
            <div className="insight-card">
              <h3>🏆 Top Performer</h3>
              {adminStats.topProducts && adminStats.topProducts.length > 0 ? (
                <div className="top-product">
                  <p><strong>{adminStats.topProducts[0].product.name}</strong></p>
                  <p>{adminStats.topProducts[0].totalSold} units sold</p>
                  <p>${adminStats.topProducts[0].totalRevenue.toFixed(2)} revenue</p>
                </div>
              ) : (
                <p>No sales data yet</p>
              )}
            </div>
            
            <div className="insight-card">
              <h3>👑 VIP Customer</h3>
              {adminStats.topUsers && adminStats.topUsers.length > 0 ? (
                <div className="top-customer">
                  <p><strong>{adminStats.topUsers[0].user.name}</strong></p>
                  <p>{adminStats.topUsers[0].orderCount} orders</p>
                  <p>${adminStats.topUsers[0].totalSpent.toFixed(2)} spent</p>
                </div>
              ) : (
                <p>No customer data yet</p>
              )}
            </div>
            
            <div className="insight-card">
              <h3>📈 Recent Activity</h3>
              {adminStats.recentPurchases && adminStats.recentPurchases.length > 0 ? (
                <div className="recent-activity">
                  <p><strong>Latest Order:</strong></p>
                  <p>{adminStats.recentPurchases[0].userId.name}</p>
                  <p>bought {adminStats.recentPurchases[0].productId.name}</p>
                  <p>${adminStats.recentPurchases[0].amount}</p>
                </div>
              ) : (
                <p>No recent activity</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;