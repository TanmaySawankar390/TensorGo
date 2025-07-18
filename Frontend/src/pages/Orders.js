import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Orders = ({ user }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data } = await axios.get(
          `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/purchase/my-orders`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        setOrders(data);
      } catch (error) {
        console.error('Failed to fetch orders:', error);
        setError('Failed to load your orders. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return '✅';
      case 'pending':
        return '⏳';
      case 'failed':
        return '❌';
      default:
        return '📦';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="orders-page">
        <div className="loading">
          <div className="spinner-large"></div>
          <p>Loading your orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-page">
      <div className="orders-header">
        <h1>My Orders</h1>
        <p>View and track all your purchases</p>
      </div>

      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}

      {orders.length === 0 ? (
        <div className="no-orders">
          <div className="no-orders-icon">🛒</div>
          <h2>No orders yet</h2>
          <p>When you make a purchase, your orders will appear here.</p>
          <a href="/" className="shop-now-btn">Start Shopping</a>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map(order => (
            <div key={order._id} className="order-card">
              <div className="order-header">
                <div className="order-info">
                  <h3>Order #{order._id.slice(-8).toUpperCase()}</h3>
                  <p className="order-date">{formatDate(order.createdAt)}</p>
                </div>
                <div className="order-status">
                  <span className={`status-badge ${order.paymentStatus}`}>
                    {getStatusIcon(order.paymentStatus)} {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                  </span>
                </div>
              </div>

              <div className="order-content">
                <div className="product-details">
                  <img 
                    src={order.productId.imageUrl} 
                    alt={order.productId.name}
                    className="order-product-image"
                  />
                  <div className="product-info">
                    <h4>{order.productId.name}</h4>
                    <p className="product-description">{order.productId.description}</p>
                  </div>
                </div>

                <div className="order-summary">
                  <div className="price-info">
                    <span className="price-label">Total Paid:</span>
                    <span className="price-amount">${order.amount}</span>
                  </div>
                  {order.stripePaymentId && (
                    <div className="payment-id">
                      <span className="payment-label">Payment ID:</span>
                      <span className="payment-value">{order.stripePaymentId.slice(-12)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="order-actions">
                {order.paymentStatus === 'completed' && (
                  <button className="download-receipt-btn">
                    📄 Download Receipt
                  </button>
                )}
                <button className="view-details-btn">
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="orders-stats">
        <div className="stat-card">
          <h3>{orders.length}</h3>
          <p>Total Orders</p>
        </div>
        <div className="stat-card">
          <h3>${orders.reduce((total, order) => total + order.amount, 0).toFixed(2)}</h3>
          <p>Total Spent</p>
        </div>
        <div className="stat-card">
          <h3>{orders.filter(order => order.paymentStatus === 'completed').length}</h3>
          <p>Completed Orders</p>
        </div>
      </div>
    </div>
  );
};

export default Orders;