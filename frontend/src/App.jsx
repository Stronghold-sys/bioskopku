import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import SplashScreen from './components/SplashScreen';
import { LayoutDashboard, Film, Calendar, Tag, FileText } from 'lucide-react';
import { API_URL } from './config';


// Import User views
import { 
  Home, 
  MovieList, 
  MovieDetails, 
  SeatBooking, 
  Checkout, 
  PaymentSim, 
  Success, 
  TicketList, 
  TicketDetail, 
  Profile 
} from './pages/UserPages';

// Import Auth views
import { 
  Login, 
  Register, 
  VerifyOTP, 
  ForgotPassword, 
  ResetPassword 
} from './pages/AuthPages';

// Import Admin views
import { 
  AdminDashboard, 
  MovieManagement, 
  ShowtimeManagement, 
  PromoManagement, 
  ReportManagement 
} from './pages/AdminPages';

// Intercept all fetch requests to handle token expiration (401 Unauthorized)
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  const response = await originalFetch(...args);
  if (response.status === 401) {
    try {
      const clone = response.clone();
      const data = await clone.json();
      if (data.message && (data.message.toLowerCase().includes('token failed') || data.message.toLowerCase().includes('expired') || data.message.toLowerCase().includes('not authorized'))) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        alert('Sesi Anda telah berakhir. Silakan login kembali.');
        window.location.href = '/login';
      }
    } catch {
      // ignore
    }
  }
  return response;
};

// Guard for protected routes — defined outside App to avoid recreation on every render
const ProtectedRoute = ({ children, allowedRole = 'user', user }) => {
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (allowedRole === 'admin' && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  return children;
};

const App = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
  };

  const handleProfileUpdate = (updatedUser) => {
    setUser(updatedUser);
  };


  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return (
    <Router>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-primary)' }}>
        <Navbar user={user} onLogout={handleLogout} />
        
        <main style={{ flex: 1 }}>
          <Routes>
            {/* User Public/Protected Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/movies" element={<MovieList />} />
            <Route path="/movies/:id" element={<MovieDetails />} />
            <Route path="/promos" element={<PromoList />} />

            <Route path="/booking/:showtimeId" element={
              <ProtectedRoute user={user}>
                <SeatBooking />
              </ProtectedRoute>
            } />
            
            <Route path="/checkout/:bookingId" element={
              <ProtectedRoute user={user}>
                <Checkout />
              </ProtectedRoute>
            } />

            <Route path="/payment/:bookingId" element={
              <ProtectedRoute user={user}>
                <PaymentSim />
              </ProtectedRoute>
            } />

            <Route path="/success/:bookingId/:ticketId" element={
              <ProtectedRoute user={user}>
                <Success />
              </ProtectedRoute>
            } />

            <Route path="/tickets" element={
              <ProtectedRoute user={user}>
                <TicketList />
              </ProtectedRoute>
            } />

            <Route path="/ticket/:bookingId" element={
              <ProtectedRoute user={user}>
                <TicketDetail />
              </ProtectedRoute>
            } />

            <Route path="/profile" element={
              <ProtectedRoute user={user}>
                <Profile onProfileUpdate={handleProfileUpdate} />
              </ProtectedRoute>
            } />

            {/* Auth Routes */}
            <Route path="/login" element={
              user ? <Navigate to="/" replace /> : <Login onLoginSuccess={handleLoginSuccess} />
            } />
            <Route path="/register" element={
              user ? <Navigate to="/" replace /> : <Register />
            } />
            <Route path="/verify-otp" element={
              <VerifyOTP onLoginSuccess={handleLoginSuccess} />
            } />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Protected Admin Routes (Modular Sidebar Layout) */}
            <Route path="/admin/*" element={
              <ProtectedRoute allowedRole="admin" user={user}>
                <AdminLayout />
              </ProtectedRoute>
            } />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

// Simple standalone view for Promo listing page
const PromoList = () => {
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/promos`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setPromos(data.promos);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div style={{ maxWidth: '1200px', margin: '2rem auto 4rem', padding: '0 20px' }}>
      <h1 style={{ fontSize: '2.25rem', fontWeight: '800', marginBottom: '2rem' }}>Kode Promo BioskopKu</h1>
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem 0' }}>Memuat promo...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '2rem' }}>
          {promos.map((p) => (
            <div key={p._id} className="glass" style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255, 170, 0, 0.15)' }}>
              <img src={p.posterUrl} alt={p.code} style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
              <div style={{ padding: '1.5rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--accent-gold)', backgroundColor: 'rgba(255,170,0,0.1)', border: '1px solid rgba(255,170,0,0.3)', padding: '4px 10px', borderRadius: '4px', fontFamily: 'var(--font-mono)' }}>
                  {p.code}
                </span>
                <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'white', marginTop: '1rem' }}>Diskon {p.discountPercentage}% Potongan s/d {formatRupiah(p.maxDiscount)}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem', lineHeight: '1.5' }}>{p.description}</p>
                <div style={{ marginTop: '1.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Berlaku hingga: {p.expiryDate}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Sidebar / Workspace container layout for admin dashboard pages
const AdminLayout = () => {
  const [tab, setTab] = useState('dashboard');

  const renderTabContent = () => {
    switch (tab) {
      case 'movies':
        return <MovieManagement />;
      case 'showtimes':
        return <ShowtimeManagement />;
      case 'promos':
        return <PromoManagement />;
      case 'reports':
        return <ReportManagement />;
      case 'dashboard':
      default:
        return <AdminDashboard />;
    }
  };

  const linkStyle = (activeTab) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '0.85rem 1.25rem',
    borderRadius: '8px',
    color: tab === activeTab ? 'white' : 'var(--text-secondary)',
    backgroundColor: tab === activeTab ? 'var(--accent-gold)' : 'transparent',
    border: 'none',
    width: '100%',
    textAlign: 'left',
    cursor: 'pointer',
    fontSize: '0.95rem',
    fontWeight: '600',
    fontFamily: 'var(--font-sans)',
    transition: 'all 0.2s',
    textShadow: tab === activeTab ? '0 1px 3px rgba(0,0,0,0.3)' : 'none'
  });

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', minHeight: 'calc(100vh - 70px)' }}>
      {/* Admin Sidebar */}
      <aside style={{ backgroundColor: 'var(--bg-secondary)', borderRight: '1px solid var(--border-color)', padding: '2rem 1.25rem' }}>
        <h3 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '1.5rem', paddingLeft: '0.5rem' }}>Navigasi Admin</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <button style={linkStyle('dashboard')} onClick={() => setTab('dashboard')}>
            <LayoutDashboard size={18} /> Dashboard
          </button>
          <button style={linkStyle('movies')} onClick={() => setTab('movies')}>
            <Film size={18} /> Kelola Film
          </button>
          <button style={linkStyle('showtimes')} onClick={() => setTab('showtimes')}>
            <Calendar size={18} /> Kelola Jadwal
          </button>
          <button style={linkStyle('promos')} onClick={() => setTab('promos')}>
            <Tag size={18} /> Kelola Promo
          </button>
          <button style={linkStyle('reports')} onClick={() => setTab('reports')}>
            <FileText size={18} /> Laporan Transaksi
          </button>
        </div>
      </aside>

      {/* Main Admin Workspace Panel */}
      <section style={{ padding: '2rem 3rem', overflowY: 'auto' }}>
        {renderTabContent()}
      </section>
    </div>
  );
};

const formatRupiah = (val) => `Rp ${val.toLocaleString('id-ID')}`;

export default App;
