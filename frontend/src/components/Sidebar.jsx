import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { path: '/brief', label: 'Weekly Brief', icon: 'history' },
  { path: '/health', label: 'Business Health', icon: 'favorite' },
  { path: '/advisor', label: 'AI Advisor', icon: 'smart_toy' },
  { path: '/recommendations', label: 'Recommendations', icon: 'task_alt' },
  { path: '/economy', label: 'Economic Pulse', icon: 'monitoring' },
  { path: '/decision-history', label: 'Decision History', icon: 'book' },
  { path: '/settings', label: 'Settings', icon: 'settings' },
];

const Sidebar = () => {
  const { logoutUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async (e) => {
    e.preventDefault();
    await logoutUser();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
        <div className="sidebar-title">
            <div className="logo">
                <img src="/logo.png" alt="Logo" style={{ width: '100%' }} />
            </div>
            <h2 style={{ margin: 0, fontSize: '20px' }}>HazonSight</h2>
        </div>

        <nav className="sidebar-nav">
            <ul className="nav-links">
                {navItems.map((item) => (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      className={({ isActive }) => (isActive ? 'nav-btn active' : 'nav-btn')}
                    >
                      <span className="material-symbols-outlined">{item.icon}</span> 
                      {item.label}
                    </NavLink>
                  </li>
                ))}
                <li>
                  <a href="/logout" className="nav-btn" onClick={handleLogout}>
                    <span className="material-symbols-outlined">logout</span> 
                    Logout
                  </a>
                </li>
            </ul>
        </nav>
    </aside>
  );
};

export default Sidebar;
