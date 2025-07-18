import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Admin from './pages/Admin';
import Orders from './pages/Orders';
import './App.css';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || 'pk_test_your_stripe_key');

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
    
    setLoading(false);
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <Elements stripe={stripePromise}>
      <Router>
        <div className="App">
          <Navbar user={user} logout={logout} />
          <Routes>
            <Route 
              path="/" 
              element={user ? <Home user={user} /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/login" 
              element={!user ? <Login setUser={setUser} /> : <Navigate to="/" />} 
            />
            <Route 
              path="/orders" 
              element={user ? <Orders user={user} /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/admin" 
              element={
                user && user.isAdmin ? 
                <Admin user={user} /> : 
                <Navigate to="/" />
              } 
            />
          </Routes>
        </div>
      </Router>
    </Elements>
  );
}

export default App;