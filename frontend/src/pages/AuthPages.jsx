import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, Key, Eye, EyeOff } from 'lucide-react';
import ConfirmationModal from '../components/ConfirmationModal';

import { API_URL } from '../config';

export const Login = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState({ isOpen: false, type: 'info', title: '', message: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setModal({ isOpen: true, type: 'error', title: 'Data Kurang', message: 'Harap isi email dan password Anda.' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      setLoading(false);

      if (data.success) {
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        localStorage.setItem('user', JSON.stringify(data.user));
        onLoginSuccess(data.user);
        
        setModal({
          isOpen: true,
          type: 'success',
          title: 'Berhasil Masuk',
          message: 'Selamat datang kembali di TiketKu!',
          onConfirm: () => {
            setModal({ isOpen: false });
            navigate(data.user.role === 'admin' ? '/admin' : '/');
          }
        });
      } else {
        if (data.needsVerification) {
          setModal({
            isOpen: true,
            type: 'info',
            title: 'Verifikasi Diperlukan',
            message: data.message,
            onConfirm: () => {
              setModal({ isOpen: false });
              navigate(`/verify-otp?email=${encodeURIComponent(email)}`);
            }
          });
        } else {
          setModal({ isOpen: true, type: 'error', title: 'Login Gagal', message: data.message });
        }
      }
    } catch (err) {
      setLoading(false);
      setModal({ isOpen: true, type: 'error', title: 'Kesalahan Sistem', message: 'Tidak dapat terhubung ke server.' });
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 80px)', padding: '20px' }}>
      <div className="glass" style={{ width: '100%', maxWidth: '400px', borderRadius: '16px', padding: '2.5rem', border: '1px solid rgba(255, 170, 0, 0.1)' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: '800', textAlign: 'center', marginBottom: '0.5rem' }}>MASUK</h2>
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', fontSize: '0.9rem', marginBottom: '2rem' }}>Akses akun TiketKu Anda</p>
        
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="email" 
                className="input-field" 
                style={{ paddingLeft: '40px' }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
              />
            </div>
          </div>

          <div className="input-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <label className="input-label" style={{ margin: 0 }}>Password</label>
              <Link to="/forgot-password" style={{ color: 'var(--accent-gold)', fontSize: '0.85rem', textDecoration: 'none' }}>Lupa Password?</Link>
            </div>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type={showPassword ? 'text' : 'password'} 
                className="input-field" 
                style={{ paddingLeft: '40px', paddingRight: '40px' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
            {loading ? 'Memproses...' : 'Masuk ke Akun'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '2rem' }}>
          Belum punya akun? <Link to="/register" style={{ color: 'var(--accent-gold)', textDecoration: 'none', fontWeight: '600' }}>Daftar</Link>
        </p>
      </div>

      <ConfirmationModal 
        isOpen={modal.isOpen}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        onConfirm={modal.onConfirm || (() => setModal({ isOpen: false }))}
      />
    </div>
  );
};

export const Register = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState({ isOpen: false, type: 'info', title: '', message: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setModal({ isOpen: true, type: 'error', title: 'Data Kurang', message: 'Harap lengkapi semua kolom pendaftaran.' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      const data = await res.json();
      setLoading(false);

      if (data.success) {
        setModal({
          isOpen: true,
          type: 'success',
          title: 'Registrasi Berhasil',
          message: data.message,
          onConfirm: () => {
            setModal({ isOpen: false });
            navigate(`/verify-otp?email=${encodeURIComponent(email)}`);
          }
        });
      } else {
        setModal({ isOpen: true, type: 'error', title: 'Registrasi Gagal', message: data.message });
      }
    } catch (err) {
      setLoading(false);
      setModal({ isOpen: true, type: 'error', title: 'Kesalahan Sistem', message: 'Tidak dapat terhubung ke server.' });
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 80px)', padding: '20px' }}>
      <div className="glass" style={{ width: '100%', maxWidth: '400px', borderRadius: '16px', padding: '2.5rem', border: '1px solid rgba(255, 170, 0, 0.1)' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: '800', textAlign: 'center', marginBottom: '0.5rem' }}>DAFTAR</h2>
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', fontSize: '0.9rem', marginBottom: '2rem' }}>Buat akun TiketKu gratis baru</p>
        
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">Nama Lengkap</label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                className="input-field" 
                style={{ paddingLeft: '40px' }}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Masukan nama lengkap"
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="email" 
                className="input-field" 
                style={{ paddingLeft: '40px' }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="password" 
                className="input-field" 
                style={{ paddingLeft: '40px' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
            {loading ? 'Mendaftarkan...' : 'Buat Akun'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '2rem' }}>
          Sudah punya akun? <Link to="/login" style={{ color: 'var(--accent-gold)', textDecoration: 'none', fontWeight: '600' }}>Masuk</Link>
        </p>
      </div>

      <ConfirmationModal 
        isOpen={modal.isOpen}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        onConfirm={modal.onConfirm || (() => setModal({ isOpen: false }))}
      />
    </div>
  );
};

export const VerifyOTP = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState({ isOpen: false, type: 'info', title: '', message: '' });

  // Get email from URL params
  const emailParam = new URLSearchParams(window.location.search).get('email') || '';
  const [email] = useState(emailParam);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!otp) {
      setModal({ isOpen: true, type: 'error', title: 'OTP Kosong', message: 'Harap masukkan 6 digit kode OTP.' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });
      const data = await res.json();
      setLoading(false);

      if (data.success) {
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        localStorage.setItem('user', JSON.stringify(data.user));
        onLoginSuccess(data.user);

        setModal({
          isOpen: true,
          type: 'success',
          title: 'Verifikasi Berhasil',
          message: 'Akun Anda telah berhasil diaktifkan. Selamat menonton!',
          onConfirm: () => {
            setModal({ isOpen: false });
            navigate('/');
          }
        });
      } else {
        setModal({ isOpen: true, type: 'error', title: 'Verifikasi Gagal', message: data.message });
      }
    } catch (err) {
      setLoading(false);
      setModal({ isOpen: true, type: 'error', title: 'Kesalahan Sistem', message: 'Tidak dapat memverifikasi OTP.' });
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 80px)', padding: '20px' }}>
      <div className="glass" style={{ width: '100%', maxWidth: '400px', borderRadius: '16px', padding: '2.5rem', border: '1px solid rgba(255, 170, 0, 0.1)' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: '800', textAlign: 'center', marginBottom: '0.5rem' }}>VERIFIKASI</h2>
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          Masukkan kode OTP 6-digit yang kami kirimkan ke <strong>{email}</strong>
        </p>


        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label" style={{ textAlign: 'center' }}>Kode OTP</label>
            <div style={{ position: 'relative' }}>
              <Key size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                maxLength="6"
                className="input-field" 
                style={{ paddingLeft: '40px', letterSpacing: '8px', fontSize: '1.25rem', fontWeight: 'bold', textAlign: 'center' }}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
            {loading ? 'Memproses...' : 'Verifikasi Akun'}
          </button>
        </form>
      </div>

      <ConfirmationModal 
        isOpen={modal.isOpen}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        onConfirm={modal.onConfirm || (() => setModal({ isOpen: false }))}
      />
    </div>
  );
};

export const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState({ isOpen: false, type: 'info', title: '', message: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setModal({ isOpen: true, type: 'error', title: 'Email Kosong', message: 'Harap masukkan email Anda.' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      setLoading(false);

      if (data.success) {
        setModal({
          isOpen: true,
          type: 'success',
          title: 'OTP Terkirim',
          message: data.message,
          onConfirm: () => {
            setModal({ isOpen: false });
            navigate(`/reset-password?email=${encodeURIComponent(email)}`);
          }
        });
      } else {
        setModal({ isOpen: true, type: 'error', title: 'Lupa Password Gagal', message: data.message });
      }
    } catch (err) {
      setLoading(false);
      setModal({ isOpen: true, type: 'error', title: 'Kesalahan Sistem', message: 'Gagal mengirim OTP.' });
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 80px)', padding: '20px' }}>
      <div className="glass" style={{ width: '100%', maxWidth: '400px', borderRadius: '16px', padding: '2.5rem', border: '1px solid rgba(255, 170, 0, 0.1)' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: '800', textAlign: 'center', marginBottom: '0.5rem' }}>LUPA PASSWORD</h2>
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', fontSize: '0.9rem', marginBottom: '2rem' }}>Kami akan mengirimkan OTP verifikasi untuk mengganti password Anda.</p>
        
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">Email Terdaftar</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="email" 
                className="input-field" 
                style={{ paddingLeft: '40px' }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
            {loading ? 'Memproses...' : 'Kirim Kode OTP'}
          </button>
        </form>
      </div>

      <ConfirmationModal 
        isOpen={modal.isOpen}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        onConfirm={modal.onConfirm || (() => setModal({ isOpen: false }))}
      />
    </div>
  );
};

export const ResetPassword = () => {
  const navigate = useNavigate();
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState({ isOpen: false, type: 'info', title: '', message: '' });

  const emailParam = new URLSearchParams(window.location.search).get('email') || '';
  const [email] = useState(emailParam);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!otp || !newPassword) {
      setModal({ isOpen: true, type: 'error', title: 'Data Kurang', message: 'Harap isi OTP dan password baru Anda.' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword })
      });
      const data = await res.json();
      setLoading(false);

      if (data.success) {
        setModal({
          isOpen: true,
          type: 'success',
          title: 'Reset Password Sukses',
          message: data.message,
          onConfirm: () => {
            setModal({ isOpen: false });
            navigate('/login');
          }
        });
      } else {
        setModal({ isOpen: true, type: 'error', title: 'Gagal Mengubah Password', message: data.message });
      }
    } catch (err) {
      setLoading(false);
      setModal({ isOpen: true, type: 'error', title: 'Kesalahan Sistem', message: 'Gagal mengatur ulang password.' });
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 80px)', padding: '20px' }}>
      <div className="glass" style={{ width: '100%', maxWidth: '400px', borderRadius: '16px', padding: '2.5rem', border: '1px solid rgba(255, 170, 0, 0.1)' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: '800', textAlign: 'center', marginBottom: '0.5rem' }}>RESET PASSWORD</h2>
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', fontSize: '0.9rem', marginBottom: '2rem' }}>Ubah password Anda untuk email {email}</p>
        
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">Kode OTP</label>
            <div style={{ position: 'relative' }}>
              <Key size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                maxLength="6"
                className="input-field" 
                style={{ paddingLeft: '40px', textAlign: 'center', letterSpacing: '4px', fontWeight: 'bold' }}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Password Baru</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="password" 
                className="input-field" 
                style={{ paddingLeft: '40px' }}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
            {loading ? 'Memproses...' : 'Ubah Password'}
          </button>
        </form>
      </div>

      <ConfirmationModal 
        isOpen={modal.isOpen}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        onConfirm={modal.onConfirm || (() => setModal({ isOpen: false }))}
      />
    </div>
  );
};
