import React, { useEffect } from 'react';

const GoogleLoginButton = ({ onSuccess }) => {
  useEffect(() => {
    if (window.google) {
      window.google.accounts.id.initialize({
        client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
        callback: onSuccess,
      });

      window.google.accounts.id.renderButton(
        document.getElementById("google-signin-button"),
        {
          theme: "outline",
          size: "large",
          width: 250,
          text: "signin_with"
        }
      );
    }
  }, [onSuccess]);

  return <div id="google-signin-button"></div>;
};

export default GoogleLoginButton;