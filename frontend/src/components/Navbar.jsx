import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Film, User, LogOut, LayoutDashboard, Ticket, FileText } from 'lucide-react';

const Navbar = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogoutClick = () => {
    onLogout();
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <header className="nav-header">
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: 'white' }}>
        <Film size={28} style={{ color: 'var(--accent-gold)' }} />
        <span style={{ fontSize: '1.5rem', fontWeight: '800', letterSpacing: '2px', fontFamily: 'var(--font-sans)' }}>
          BIOSKOP<span style={{ color: 'var(--accent-gold)' }}>KU</span>
        </span>
      </Link>

      <nav className="nav-links">
        <Link to="/" className={`nav-link ${isActive('/')}`}>
          Beranda
        </Link>
        <Link to="/movies" className={`nav-link ${isActive('/movies')}`}>
          Film
        </Link>
        <Link to="/promos" className={`nav-link ${isActive('/promos')}`}>
          Promo
        </Link>

        {user ? (
          <>
            <Link to="/tickets" className={`nav-link ${isActive('/tickets')}`} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Ticket size={16} /> Tiket Saya
            </Link>
            
            {user.role === 'admin' && (
              <Link to="/admin" className={`nav-link ${isActive('/admin')}`} style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-gold)' }}>
                <LayoutDashboard size={16} /> Dashboard Admin
              </Link>
            )}

            <Link to="/profile" className={`nav-link ${isActive('/profile')}`} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <User size={16} /> {user.name}
            </Link>

            <button 
              onClick={handleLogoutClick} 
              className="nav-link" 
              style={{ 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '4px',
                fontFamily: 'var(--font-sans)',
                fontSize: '0.95rem'
              }}
            >
              <LogOut size={16} /> Keluar
            </button>
          </>
        ) : (
          <Link to="/login" className="btn btn-primary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}>
            Masuk
          </Link>
        )}
      </nav>
    </header>
  );
};

export default Navbar;
