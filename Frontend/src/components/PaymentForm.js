import React, { useState } from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import axios from 'axios';

const PaymentForm = ({ product, user, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [cardComplete, setCardComplete] = useState(false);

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#333',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        '::placeholder': {
          color: '#aab7c4',
        },
        iconColor: '#666ee8',
      },
      invalid: {
        color: '#fa755a',
        iconColor: '#fa755a',
      },
      complete: {
        color: '#28a745',
        iconColor: '#28a745',
      },
    },
    hidePostalCode: true,
  };

  const handleCardChange = (event) => {
    setCardComplete(event.complete);
    if (event.error) {
      setMessage(event.error.message);
    } else {
      setMessage('');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    if (!stripe || !elements) {
      setMessage('Payment system is loading. Please try again.');
      setLoading(false);
      return;
    }

    const cardElement = elements.getElement(CardElement);

    try {
      const { data } = await axios.post(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/purchase/create-payment-intent`,
        { productId: product._id },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      const result = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: user.name,
            email: user.email
          }
        }
      });

      if (result.error) {
        setMessage(result.error.message);
      } else {
        await axios.post(
          `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/purchase/confirm`,
          {
            paymentIntentId: result.paymentIntent.id,
            productId: product._id
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          }
        );

        setMessage('🎉 Payment successful! Thank you for your purchase.');
        setTimeout(() => {
          onCancel();
        }, 3000);
      }
    } catch (error) {
      setMessage('❌ Payment failed. Please try again.');
      console.error('Payment error:', error);
    }

    setLoading(false);
  };

  return (
    <div className="payment-overlay">
      <div className="payment-modal">
        <div className="payment-header">
          <h3>Complete Your Purchase</h3>
          <button className="close-button" onClick={onCancel}>×</button>
        </div>
        
        <div className="payment-content">
          <div className="order-summary">
            <h4>Order Summary</h4>
            <div className="order-item">
              <img src={product.imageUrl} alt={product.name} className="order-image" />
              <div className="order-details">
                <p className="order-name">{product.name}</p>
                <p className="order-price">${product.price}</p>
              </div>
            </div>
            <div className="order-total">
              <strong>Total: ${product.price}</strong>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="payment-form">
            <div className="form-section">
              <h4>Payment Information</h4>
              <div className="card-input-container">
                <CardElement
                  options={cardElementOptions}
                  onChange={handleCardChange}
                />
              </div>
              <p className="card-help-text">
                Use test card: 4242 4242 4242 4242, any future date, any CVC
              </p>
            </div>
            
            <div className="billing-info">
              <h4>Billing Information</h4>
              <div className="billing-details">
                <p><strong>Name:</strong> {user.name}</p>
                <p><strong>Email:</strong> {user.email}</p>
              </div>
            </div>

            {message && (
              <div className={`payment-message ${message.includes('successful') ? 'success' : 'error'}`}>
                {message}
              </div>
            )}
            
            <div className="payment-actions">
              <button 
                type="button" 
                onClick={onCancel}
                className="cancel-btn"
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={!stripe || loading || !cardComplete}
                className="pay-btn"
              >
                {loading ? (
                  <span className="loading-spinner">
                    <span className="spinner"></span>
                    Processing...
                  </span>
                ) : (
                  `Pay $${product.price}`
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PaymentForm;