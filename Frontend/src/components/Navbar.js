import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = ({ user, logout }) => {
  const location = useLocation();
  const isSuperAdmin = user?.email === 'tanmaysawankar9175@gmail.com';

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          E-Commerce Store
          {isSuperAdmin && <span className="super-admin-indicator"></span>}
        </Link>
        
        <div className="nav-menu">
          {user ? (
            <>
              <Link 
                to="/" 
                className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
              >
                 {isSuperAdmin ? 'Store Overview' : 'Home'}
              </Link>
              
              {!isSuperAdmin && (
                <Link 
                  to="/orders" 
                  className={`nav-link ${location.pathname === '/orders' ? 'active' : ''}`}
                >
                   My Orders
                </Link>
              )}
              
              {user.isAdmin && (
                <Link 
                  to="/admin" 
                  className={`nav-link ${location.pathname === '/admin' ? 'active' : ''}`}
                >
                   Admin Dashboard
                </Link>
              )}
              
              <div className="nav-user">
                <img src={user.profileImage} alt="Profile" className="profile-img" />
                <div className="user-info">
                  <span className="user-name">{user.name}</span>
                  {isSuperAdmin && <span className="user-role">Super Admin</span>}
                </div>
              </div>
              
              <button onClick={logout} className="nav-link logout-btn">
                🚪 Logout
              </button>
            </>
          ) : (
            <Link to="/login" className="nav-link">
               Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;