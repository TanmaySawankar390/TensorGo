import React, { useState } from 'react';
import PaymentForm from './PaymentForm';

const ProductCard = ({ product, user }) => {
  const [showPayment, setShowPayment] = useState(false);

  const isSuperAdmin = user?.email === 'tanmaysawankar9175@gmail.com' || user?.isAdmin;

  return (
    <>
      <div className="product-card">
        <div className="product-image-container">
          <img src={product.imageUrl} alt={product.name} className="product-image" />
          {isSuperAdmin && (
            <div className="admin-overlay">
              <span className="admin-badge"> ADMIN VIEW</span>
            </div>
          )}
        </div>
        <div className="product-info">
          <h3 className="product-name">{product.name}</h3>
          <p className="product-description">{product.description}</p>
          <div className="product-footer">
            <p className="product-price">${product.price}</p>
            
            {isSuperAdmin ? (
              <div className="admin-product-info">
                <div className="admin-stats">
                  <div className="admin-stat">
                    <span className="stat-icon"></span>
                    <span className="stat-text">View Analytics</span>
                  </div>
                  <div className="admin-stat">
                    <span className="stat-icon"></span>
                    <span className="stat-text">Manage Product</span>
                  </div>
                </div>
                <div className="admin-note">
                  <small>Admin accounts cannot purchase products</small>
                </div>
              </div>
            ) : (
              <button 
                className="buy-button"
                onClick={() => setShowPayment(true)}
              >
                Buy Now
              </button>
            )}
          </div>
        </div>
      </div>
      {showPayment && !isSuperAdmin && (
        <PaymentForm 
          product={product} 
          user={user}
          onCancel={() => setShowPayment(false)}
        />
      )}
    </>
  );
};

export default ProductCard;