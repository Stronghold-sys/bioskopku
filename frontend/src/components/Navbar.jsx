import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Film, User, LogOut, LayoutDashboard, Ticket, Menu, X } from 'lucide-react';

const Navbar = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogoutClick = () => {
    onLogout();
    setIsOpen(false);
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <header className="nav-header">
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: 'white', zIndex: 101 }} onClick={() => setIsOpen(false)}>
        <Film size={28} style={{ color: 'var(--accent-gold)' }} />
        <span style={{ fontSize: '1.5rem', fontWeight: '800', letterSpacing: '2px', fontFamily: 'var(--font-sans)' }}>
          BIOSKOP<span style={{ color: 'var(--accent-gold)' }}>KU</span>
        </span>
      </Link>

      {/* Hamburger button for mobile devices */}
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        style={{ 
          background: 'none', 
          border: 'none', 
          color: 'white', 
          cursor: 'pointer', 
          padding: '4px',
          zIndex: 101 
        }}
        className="menu-toggle"
      >
        {isOpen ? <X size={28} /> : <Menu size={28} />}
      </button>

      <nav className={`nav-links ${isOpen ? 'open' : ''}`}>
        <Link to="/" className={`nav-link ${isActive('/')}`} onClick={() => setIsOpen(false)}>
          Beranda
        </Link>
        <Link to="/movies" className={`nav-link ${isActive('/movies')}`} onClick={() => setIsOpen(false)}>
          Film
        </Link>
        <Link to="/promos" className={`nav-link ${isActive('/promos')}`} onClick={() => setIsOpen(false)}>
          Promo
        </Link>

        {user ? (
          <>
            <Link to="/tickets" className={`nav-link ${isActive('/tickets')}`} style={{ display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => setIsOpen(false)}>
              <Ticket size={16} /> Tiket Saya
            </Link>
            
            {user.role === 'admin' && (
              <Link to="/admin" className={`nav-link ${isActive('/admin')}`} style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-gold)' }} onClick={() => setIsOpen(false)}>
                <LayoutDashboard size={16} /> Dashboard Admin
              </Link>
            )}

            <Link to="/profile" className={`nav-link ${isActive('/profile')}`} style={{ display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => setIsOpen(false)}>
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
          <Link to="/login" className="btn btn-primary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }} onClick={() => setIsOpen(false)}>
            Masuk
          </Link>
        )}
      </nav>
    </header>
  );
};

export default Navbar;
