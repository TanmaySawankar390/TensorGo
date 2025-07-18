import React, { useEffect, useRef } from 'react';
import axios from 'axios';

const Login = ({ setUser }) => {
  const googleButtonRef = useRef(null);

  useEffect(() => {
    if (window.google) {
      window.google.accounts.id.initialize({
        client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
      });

      window.google.accounts.id.renderButton(
        googleButtonRef.current,
        {
          theme: 'outline',
          size: 'large',
          width: 250
        }
      );
    }
  }, []);

  const handleCredentialResponse = async (response) => {
    try {
      const { data } = await axios.post(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/google`,
        { token: response.credential }
      );

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
    } catch (error) {
      console.error('Login failed:', error);
      alert('Login failed. Please try again.');
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h2>Welcome to E-Commerce Store</h2>
        <p>Please sign in with your Google account to continue</p>
        
        <div ref={googleButtonRef} className="google-login-button"></div>
      </div>
    </div>
  );
};

export default Login;