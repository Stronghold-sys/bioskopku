import { useState, useEffect, useRef } from 'react';
import { LayoutDashboard, Film, Calendar, Tag, FileText, Plus, Edit2, Trash2, Filter, DollarSign, Users, Film as FilmIcon, Activity } from 'lucide-react';
import { io } from 'socket.io-client';
import ConfirmationModal from '../components/ConfirmationModal';
import { API_BASE, API_URL } from '../config';

// Helper to format currency
const formatRupiah = (val) => `Rp ${val.toLocaleString('id-ID')}`;

// Helper headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

// Helper to extract YouTube video ID and return embed URL
const getYouTubeEmbedUrl = (url) => {
  if (!url) return '';
  if (url.includes('youtube.com/embed/')) return url;
  
  let videoId = '';
  try {
    if (url.includes('youtube.com/watch')) {
      const urlObj = new URL(url);
      videoId = urlObj.searchParams.get('v');
    } else if (url.includes('youtu.be/')) {
      const urlParts = url.split('/');
      videoId = urlParts[urlParts.length - 1].split('?')[0];
    } else if (url.includes('youtube.com/shorts/')) {
      const urlParts = url.split('/shorts/');
      videoId = urlParts[1].split('?')[0];
    }
  } catch (e) {
    console.error('Invalid YouTube URL:', e);
  }
  
  return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
};

export const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/dashboard`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Wrap in setTimeout to ensure setState is not called synchronously within the effect
    const timer = setTimeout(() => {
      fetchStats();
    }, 0);

    // Socket listener for live sales dashboard updates (Real-time!)
    socketRef.current = io(API_BASE);
    const socket = socketRef.current;

    socket.on('dashboard-update', (payload) => {
      console.log('⚡ Live dashboard update received:', payload);
      // Re-trigger stats fetch or merge values locally
      fetchStats();
    });

    return () => {
      clearTimeout(timer);
      socket.disconnect();
    };
  }, []);

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Memuat data statistik...</div>;

  return (
    <div style={{ padding: '2rem 0' }}>
      <h1 style={{ fontSize: '2.25rem', fontWeight: '800', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <LayoutDashboard size={28} style={{ color: 'var(--accent-gold)' }} /> Dashboard Admin
      </h1>

      {/* Stats Cards */}
      <div className="admin-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        <div className="glass" style={{ padding: '1.5rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'rgba(0, 230, 118, 0.1)', color: 'var(--status-success)' }}>
            <DollarSign size={28} />
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Total Pendapatan</span>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'white', marginTop: '4px' }}>
              {formatRupiah(stats?.totalRevenue || 0)}
            </div>
          </div>
        </div>

        <div className="glass" style={{ padding: '1.5rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'rgba(255, 170, 0, 0.1)', color: 'var(--accent-gold)' }}>
            <Users size={28} />
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Pelanggan</span>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'white', marginTop: '4px' }}>
              {stats?.totalUsers || 0}
            </div>
          </div>
        </div>

        <div className="glass" style={{ padding: '1.5rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'rgba(77, 208, 225, 0.1)', color: '#4dd0e1' }}>
            <FilmIcon size={28} />
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Film Screening</span>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'white', marginTop: '4px' }}>
              {stats?.totalMovies || 0}
            </div>
          </div>
        </div>

        <div className="glass" style={{ padding: '1.5rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'rgba(124, 77, 255, 0.1)', color: '#7c4dff' }}>
            <Users size={28} />
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Tiket Terjual</span>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'white', marginTop: '4px' }}>
              {stats?.totalTicketsSold || 0}
            </div>
          </div>
        </div>
      </div>

      <div className="admin-main-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '2rem' }}>
        
        {/* Sales by Movie */}
        <div className="glass" style={{ padding: '1.75rem', borderRadius: '12px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '1.25rem', color: 'white' }}>Penjualan Berdasarkan Film</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {stats?.movieSales && stats.movieSales.length > 0 ? (
              stats.movieSales.map((ms) => (
                <div key={ms.title} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', backgroundColor: 'rgba(5,7,15,0.4)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.02)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img src={ms.posterUrl} alt={ms.title} style={{ width: '40px', height: '60px', objectFit: 'cover', borderRadius: '4px' }} />
                    <div>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'white' }}>{ms.title}</h4>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{ms.tickets} Tiket terjual</span>
                    </div>
                  </div>
                  <span style={{ fontWeight: '700', color: 'var(--accent-gold)' }}>{formatRupiah(ms.revenue)}</span>
                </div>
              ))
            ) : (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem 0' }}>Belum ada data penjualan film.</p>
            )}
          </div>
        </div>

        {/* Transaksi Terbaru */}
        <div className="glass" style={{ padding: '1.75rem', borderRadius: '12px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '1.25rem', color: 'white', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Activity size={20} style={{ color: 'var(--accent-gold)' }} /> Transaksi Terbaru
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '380px', overflowY: 'auto', paddingRight: '4px' }}>
            {stats?.recentBookings && stats.recentBookings.length > 0 ? (
              stats.recentBookings.map((b) => (
                <div key={b._id} style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '12px', backgroundColor: 'rgba(5,7,15,0.6)', borderRadius: '8px', fontSize: '0.85rem', borderLeft: `3px solid ${b.paymentStatus === 'Paid' ? 'var(--status-success)' : b.paymentStatus === 'Pending' ? 'var(--status-pending)' : 'var(--status-error)'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: '700', color: 'white' }}>{b.userId?.name || b.userId?.email || 'Pelanggan'}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(b.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Film: {b.showtimeId?.movieId?.title || 'Film Tidak Ditemukan'}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                    <span style={{ fontWeight: '600', color: 'var(--accent-gold)' }}>{formatRupiah(b.totalPrice)}</span>
                    <span style={{ 
                      fontSize: '0.7rem', 
                      fontWeight: '700', 
                      padding: '2px 8px', 
                      borderRadius: '4px', 
                      backgroundColor: b.paymentStatus === 'Paid' ? 'rgba(0, 230, 118, 0.1)' : b.paymentStatus === 'Pending' ? 'rgba(255, 193, 7, 0.1)' : 'rgba(255, 23, 68, 0.1)',
                      color: b.paymentStatus === 'Paid' ? 'var(--status-success)' : b.paymentStatus === 'Pending' ? 'var(--status-pending)' : 'var(--status-error)'
                    }}>
                      {b.paymentStatus}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem 0' }}>Belum ada transaksi tercatat.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

// ==========================================
// 2. MOVIE MANAGEMENT CRUD
// ==========================================
export const MovieManagement = () => {
  const [movies, setMovies] = useState([]);
  const [modal, setModal] = useState({ isOpen: false, type: 'info', title: '', message: '' });
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  
  // Form fields
  const [title, setTitle] = useState('');
  const [posterUrl, setPosterUrl] = useState('');
  const [trailerUrl, setTrailerUrl] = useState('');
  const [synopsis, setSynopsis] = useState('');
  const [genre, setGenre] = useState('');
  const [duration, setDuration] = useState('');
  const [rating, setRating] = useState('');
  const [releaseDate, setReleaseDate] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setModal({ isOpen: true, type: 'error', title: 'File Terlalu Besar', message: 'Maksimal ukuran file poster adalah 5MB.' });
      return;
    }

    setUploading(true);

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const res = await fetch(`${API_URL}/upload`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            name: file.name,
            type: file.type,
            base64: reader.result
          })
        });

        const data = await res.json();
        if (data.success) {
          setPosterUrl(data.url);
          setModal({ isOpen: true, type: 'success', title: 'Poster Diunggah', message: 'Poster berhasil diunggah dari perangkat!' });
        } else {
          setModal({ isOpen: true, type: 'error', title: 'Gagal Unggah', message: data.message });
        }
      } catch (err) {
        console.error(err);
        setModal({ isOpen: true, type: 'error', title: 'Error', message: 'Gagal menghubungi server untuk unggah poster.' });
      } finally {
        setUploading(false);
      }
    };
    reader.onerror = () => {
      setModal({ isOpen: true, type: 'error', title: 'Error', message: 'Gagal membaca berkas gambar.' });
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const fetchMovies = async () => {
    try {
      const res = await fetch(`${API_URL}/movies?limit=50`);
      const data = await res.json();
      if (data.success) setMovies(data.movies);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMovies();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleOpenCreate = () => {
    setEditId(null);
    setTitle('');
    setPosterUrl('');
    setTrailerUrl('');
    setSynopsis('');
    setGenre('');
    setDuration('');
    setRating('PG-13');
    setReleaseDate('');
    setFormOpen(true);
  };

  const handleOpenEdit = (m) => {
    setEditId(m._id);
    setTitle(m.title);
    setPosterUrl(m.posterUrl);
    setTrailerUrl(m.trailerUrl);
    setSynopsis(m.synopsis);
    setGenre(m.genre);
    setDuration(m.duration);
    setRating(m.rating);
    setReleaseDate(m.releaseDate);
    setFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !posterUrl || !trailerUrl || !synopsis || !genre || !duration || !rating || !releaseDate) {
      setModal({ isOpen: true, type: 'error', title: 'Data Kurang', message: 'Harap lengkapi semua kolom data film.' });
      return;
    }

    const embedTrailerUrl = getYouTubeEmbedUrl(trailerUrl);
    const payload = { title, posterUrl, trailerUrl: embedTrailerUrl, synopsis, genre, duration: Number(duration), rating, releaseDate };
    
    try {
      let res;
      if (editId) {
        res = await fetch(`${API_URL}/movies/${editId}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch(`${API_URL}/movies`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(payload)
        });
      }
      const data = await res.json();
      if (data.success) {
        setFormOpen(false);
        setModal({ isOpen: true, type: 'success', title: 'Berhasil', message: data.message });
        fetchMovies();
      } else {
        setModal({ isOpen: true, type: 'error', title: 'Gagal', message: data.message });
      }
    } catch {
      setModal({ isOpen: true, type: 'error', title: 'Error', message: 'Gagal memproses data film.' });
    }
  };

  const handleDelete = async (id) => {
    setModal({
      isOpen: true,
      type: 'info',
      title: 'Hapus Film',
      message: 'Apakah Anda yakin ingin menghapus film ini? Jadwal tayang terkait juga mungkin terpengaruh.',
      confirmText: 'Ya, Hapus',
      onCancel: () => setModal({ isOpen: false }),
      onConfirm: async () => {
        try {
          const res = await fetch(`${API_URL}/movies/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
          });
          const data = await res.json();
          if (data.success) {
            setModal({ isOpen: true, type: 'success', title: 'Dihapus', message: data.message });
            fetchMovies();
          } else {
            setModal({ isOpen: true, type: 'error', title: 'Gagal', message: data.message });
          }
        } catch {
          setModal({ isOpen: true, type: 'error', title: 'Error', message: 'Kesalahan saat menghapus film.' });
        }
      }
    });
  };

  return (
    <div style={{ padding: '2rem 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.25rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Film size={28} style={{ color: 'var(--accent-gold)' }} /> Kelola Film
        </h1>
        <button className="btn btn-primary" onClick={handleOpenCreate}>
          <Plus size={16} /> Tambah Film Baru
        </button>
      </div>

      {/* Grid of Movies for Edit/Delete */}
      <div className="glass admin-table-container" style={{ borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
              <th style={{ padding: '1rem' }}>Poster</th>
              <th style={{ padding: '1rem' }}>Judul</th>
              <th style={{ padding: '1rem' }}>Genre</th>
              <th style={{ padding: '1rem' }}>Durasi</th>
              <th style={{ padding: '1rem' }}>Rating</th>
              <th style={{ padding: '1rem' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {movies.map((m) => (
              <tr key={m._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '1rem' }}>
                  <img src={m.posterUrl} alt={m.title} style={{ width: '40px', height: '60px', objectFit: 'cover', borderRadius: '4px' }} />
                </td>
                <td style={{ padding: '1rem', fontWeight: '600', color: 'white' }}>{m.title}</td>
                <td style={{ padding: '1rem' }}>{m.genre}</td>
                <td style={{ padding: '1rem' }}>{m.duration} Min</td>
                <td style={{ padding: '1rem' }}><span style={{ border: '1px solid rgba(255,255,255,0.2)', padding: '2px 6px', borderRadius: '4px' }}>{m.rating}</span></td>
                <td style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => handleOpenEdit(m)}>
                      <Edit2 size={12} />
                    </button>
                    <button className="btn" style={{ padding: '6px 12px', fontSize: '0.8rem', backgroundColor: 'rgba(255, 23, 68, 0.1)', color: 'var(--status-error)', border: '1px solid rgba(255, 23, 68, 0.2)' }} onClick={() => handleDelete(m._id)}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Form Dialog Box Modal */}
      {formOpen && (
        <div className="confirm-overlay">
          <div className="glass" style={{ width: '100%', maxWidth: '600px', borderRadius: '16px', padding: '2rem', overflowY: 'auto', maxHeight: '90vh' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '1.5rem', color: 'white' }}>
              {editId ? 'Edit Data Film' : 'Tambah Film Baru'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="input-group">
                  <label className="input-label">Judul Film</label>
                  <input type="text" className="input-field" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Dune: Part Two" />
                </div>
                <div className="input-group">
                  <label className="input-label">Genre</label>
                  <input type="text" className="input-field" value={genre} onChange={(e) => setGenre(e.target.value)} placeholder="e.g. Action, Sci-Fi" />
                </div>
                <div className="input-group" style={{ gridColumn: 'span 2' }}>
                  <label className="input-label">Poster Film</label>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    {posterUrl && (
                      <img src={posterUrl} alt="Poster Preview" style={{ width: '80px', height: '120px', objectFit: 'cover', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.1)' }} />
                    )}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <input 
                        type="text" 
                        className="input-field" 
                        value={posterUrl} 
                        onChange={(e) => setPosterUrl(e.target.value)} 
                        placeholder="Masukkan URL Gambar (https://...) atau unggah di bawah" 
                      />
                      <div style={{ position: 'relative' }}>
                        <input 
                          type="file" 
                          id="poster-upload" 
                          accept="image/*" 
                          style={{ display: 'none' }} 
                          onChange={handleFileUpload} 
                          disabled={uploading}
                        />
                        <label 
                          htmlFor="poster-upload" 
                          className="btn btn-secondary" 
                          style={{ 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: '8px', 
                            cursor: uploading ? 'not-allowed' : 'pointer',
                            opacity: uploading ? 0.6 : 1,
                            fontSize: '0.85rem',
                            padding: '0.5rem 1rem'
                          }}
                        >
                          {uploading ? 'Mengunggah...' : 'Pilih File dari Device'}
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="input-group" style={{ gridColumn: 'span 2' }}>
                  <label className="input-label">Trailer Resmi (YouTube Link)</label>
                  <input type="text" className="input-field" value={trailerUrl} onChange={(e) => setTrailerUrl(e.target.value)} placeholder="e.g. https://www.youtube.com/watch?v=... atau https://youtu.be/..." />
                </div>
                <div className="input-group">
                  <label className="input-label">Durasi (Menit)</label>
                  <input type="number" className="input-field" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="120" />
                </div>
                <div className="input-group">
                  <label className="input-label">Rating</label>
                  <select className="input-field" value={rating} onChange={(e) => setRating(e.target.value)}>
                    <option value="SU">SU</option>
                    <option value="PG-13">PG-13</option>
                    <option value="R">R</option>
                  </select>
                </div>
                <div className="input-group" style={{ gridColumn: 'span 2' }}>
                  <label className="input-label">Tanggal Rilis</label>
                  <input type="date" className="input-field" value={releaseDate} onChange={(e) => setReleaseDate(e.target.value)} />
                </div>
                <div className="input-group" style={{ gridColumn: 'span 2' }}>
                  <label className="input-label">Sinopsis</label>
                  <textarea className="input-field" style={{ height: '100px', resize: 'vertical' }} value={synopsis} onChange={(e) => setSynopsis(e.target.value)} placeholder="Masukkan cerita film..." />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setFormOpen(false)}>Batal</button>
                <button type="submit" className="btn btn-primary">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmationModal 
        isOpen={modal.isOpen}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        confirmText={modal.confirmText}
        onCancel={modal.onCancel}
        onConfirm={modal.onConfirm || (() => setModal({ isOpen: false }))}
      />
    </div>
  );
};

// ==========================================
// 3. SHOWTIME MANAGEMENT CRUD
// ==========================================
export const ShowtimeManagement = () => {
  const [showtimes, setShowtimes] = useState([]);
  const [movies, setMovies] = useState([]);
  const [studios, setStudios] = useState([]);
  const [modal, setModal] = useState({ isOpen: false, type: 'info', title: '', message: '' });
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState(null);

  // Form Fields
  const [movieId, setMovieId] = useState('');
  const [studioId, setStudioId] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [price, setPrice] = useState('');

  const fetchData = async () => {
    try {
      const showtimeRes = await fetch(`${API_URL}/showtimes`);
      const showtimeData = await showtimeRes.json();
      const movieRes = await fetch(`${API_URL}/movies?limit=100`);
      const movieData = await movieRes.json();
      const cinemaRes = await fetch(`${API_URL}/cinemas`);
      const cinemaData = await cinemaRes.json();

      if (showtimeData.success) setShowtimes(showtimeData.showtimes);
      if (movieData.success) setMovies(movieData.movies);

      // Collect studios
      if (cinemaData.success) {
        const studioArr = [];
        for (const c of cinemaData.cinemas) {
          const sRes = await fetch(`${API_URL}/cinemas/${c._id}/studios`);
          const sData = await sRes.json();
          if (sData.success) {
            studioArr.push(...sData.studios.map(st => ({ ...st, cinemaName: c.name })));
          }
        }
        setStudios(studioArr);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleOpenCreate = () => {
    setEditId(null);
    setMovieId(movies[0]?._id || '');
    setStudioId(studios[0]?._id || '');
    setDate(new Date().toISOString().split('T')[0]);
    setStartTime('14:00');
    setPrice(studios[0]?.basePrice || '40000');
    setFormOpen(true);
  };

  const handleStudioChange = (id) => {
    setStudioId(id);
    const select = studios.find(s => s._id === id);
    if (select) setPrice(select.basePrice);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!movieId || !studioId || !date || !startTime || !price) {
      setModal({ isOpen: true, type: 'error', title: 'Data Kurang', message: 'Harap lengkapi semua data jadwal tayang.' });
      return;
    }

    const payload = { movieId, studioId, date, startTime, price: Number(price) };
    try {
      let res;
      if (editId) {
        res = await fetch(`${API_URL}/showtimes/${editId}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch(`${API_URL}/showtimes`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(payload)
        });
      }
      const data = await res.json();
      if (data.success) {
        setFormOpen(false);
        setModal({ isOpen: true, type: 'success', title: 'Berhasil', message: data.message });
        fetchData();
      } else {
        setModal({ isOpen: true, type: 'error', title: 'Gagal', message: data.message });
      }
    } catch {
      setModal({ isOpen: true, type: 'error', title: 'Error', message: 'Gagal memproses jadwal tayang.' });
    }
  };

  const handleDelete = async (id) => {
    setModal({
      isOpen: true,
      type: 'info',
      title: 'Hapus Jadwal',
      message: 'Apakah Anda yakin ingin menghapus jadwal tayang ini?',
      confirmText: 'Hapus',
      onCancel: () => setModal({ isOpen: false }),
      onConfirm: async () => {
        try {
          const res = await fetch(`${API_URL}/showtimes/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
          });
          const data = await res.json();
          if (data.success) {
            setModal({ isOpen: true, type: 'success', title: 'Dihapus', message: data.message });
            fetchData();
          } else {
            setModal({ isOpen: true, type: 'error', title: 'Gagal', message: data.message });
          }
        } catch {
          setModal({ isOpen: true, type: 'error', title: 'Error', message: 'Gagal menghapus jadwal.' });
        }
      }
    });
  };

  return (
    <div style={{ padding: '2rem 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.25rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={28} style={{ color: 'var(--accent-gold)' }} /> Kelola Jadwal Tayang
        </h1>
        <button className="btn btn-primary" onClick={handleOpenCreate}>
          <Plus size={16} /> Tambah Jadwal Tayang
        </button>
      </div>

      <div className="glass admin-table-container" style={{ borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
              <th style={{ padding: '1rem' }}>Film</th>
              <th style={{ padding: '1rem' }}>Bioskop / Studio</th>
              <th style={{ padding: '1rem' }}>Tanggal</th>
              <th style={{ padding: '1rem' }}>Jam</th>
              <th style={{ padding: '1rem' }}>Harga</th>
              <th style={{ padding: '1rem' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {showtimes.map((st) => (
              <tr key={st._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '1rem', fontWeight: '600', color: 'white' }}>{st.movieId?.title}</td>
                <td style={{ padding: '1rem' }}>{st.studioId?.cinemaId?.name || 'TiketKu Cinema'} — {st.studioId?.name}</td>
                <td style={{ padding: '1rem' }}>{st.date}</td>
                <td style={{ padding: '1rem', fontWeight: '700', color: 'var(--accent-gold)' }}>{st.startTime}</td>
                <td style={{ padding: '1rem' }}>{formatRupiah(st.price)}</td>
                <td style={{ padding: '1rem' }}>
                  <button className="btn" style={{ padding: '6px 12px', fontSize: '0.8rem', backgroundColor: 'rgba(255, 23, 68, 0.1)', color: 'var(--status-error)', border: '1px solid rgba(255, 23, 68, 0.2)' }} onClick={() => handleDelete(st._id)}>
                    <Trash2 size={12} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {formOpen && (
        <div className="confirm-overlay">
          <div className="glass" style={{ width: '100%', maxWidth: '500px', borderRadius: '16px', padding: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '1.5rem', color: 'white' }}>Tambah Jadwal</h2>
            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <label className="input-label">Pilih Film</label>
                <select className="input-field" value={movieId} onChange={(e) => setMovieId(e.target.value)}>
                  {movies.map(m => <option key={m._id} value={m._id}>{m.title}</option>)}
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">Pilih Bioskop & Studio</label>
                <select className="input-field" value={studioId} onChange={(e) => handleStudioChange(e.target.value)}>
                  {studios.map(s => <option key={s._id} value={s._id}>{s.cinemaName} — {s.name}</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="input-group">
                  <label className="input-label">Tanggal</label>
                  <input type="date" className="input-field" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
                <div className="input-group">
                  <label className="input-label">Jam Mulai</label>
                  <input type="text" className="input-field" value={startTime} onChange={(e) => setStartTime(e.target.value)} placeholder="e.g. 14:00" />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Harga Tiket (Rupiah)</label>
                <input type="number" className="input-field" value={price} onChange={(e) => setPrice(e.target.value)} />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setFormOpen(false)}>Batal</button>
                <button type="submit" className="btn btn-primary">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmationModal 
        isOpen={modal.isOpen}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        confirmText={modal.confirmText}
        onCancel={modal.onCancel}
        onConfirm={modal.onConfirm || (() => setModal({ isOpen: false }))}
      />
    </div>
  );
};

// ==========================================
// 4. PROMO MANAGEMENT CRUD
// ==========================================
export const PromoManagement = () => {
  const [promos, setPromos] = useState([]);
  const [modal, setModal] = useState({ isOpen: false, type: 'info', title: '', message: '' });
  const [formOpen, setFormOpen] = useState(false);

  // Form fields
  const [code, setCode] = useState('');
  const [discountPercentage, setDiscountPercentage] = useState('');
  const [description, setDescription] = useState('');
  const [posterUrl, setPosterUrl] = useState('');
  const [maxDiscount, setMaxDiscount] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  const fetchPromos = async () => {
    try {
      const res = await fetch(`${API_URL}/promos`);
      const data = await res.json();
      if (data.success) setPromos(data.promos);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPromos();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleOpenCreate = () => {
    setCode('');
    setDiscountPercentage('');
    setDescription('');
    setPosterUrl('https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=500&auto=format&fit=crop&q=60');
    setMaxDiscount('');
    setExpiryDate('2026-12-31');
    setFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code || !discountPercentage || !description || !posterUrl || !maxDiscount || !expiryDate) {
      setModal({ isOpen: true, type: 'error', title: 'Data Kurang', message: 'Harap lengkapi semua kolom data promo.' });
      return;
    }

    const payload = { code, discountPercentage: Number(discountPercentage), description, posterUrl, maxDiscount: Number(maxDiscount), expiryDate };
    try {
      const res = await fetch(`${API_URL}/promos`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setFormOpen(false);
        setModal({ isOpen: true, type: 'success', title: 'Berhasil', message: data.message });
        fetchPromos();
      } else {
        setModal({ isOpen: true, type: 'error', title: 'Gagal', message: data.message });
      }
    } catch {
      setModal({ isOpen: true, type: 'error', title: 'Error', message: 'Gagal menyimpan promo.' });
    }
  };

  const handleDelete = async (id) => {
    setModal({
      isOpen: true,
      type: 'info',
      title: 'Hapus Promo',
      message: 'Apakah Anda yakin ingin menghapus promo ini?',
      confirmText: 'Hapus',
      onCancel: () => setModal({ isOpen: false }),
      onConfirm: async () => {
        try {
          const res = await fetch(`${API_URL}/promos/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
          });
          const data = await res.json();
          if (data.success) {
            setModal({ isOpen: true, type: 'success', title: 'Dihapus', message: data.message });
            fetchPromos();
          } else {
            setModal({ isOpen: true, type: 'error', title: 'Gagal', message: data.message });
          }
        } catch {
          setModal({ isOpen: true, type: 'error', title: 'Error', message: 'Gagal menghapus promo.' });
        }
      }
    });
  };

  return (
    <div style={{ padding: '2rem 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.25rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Tag size={28} style={{ color: 'var(--accent-gold)' }} /> Kelola Kode Promo
        </h1>
        <button className="btn btn-primary" onClick={handleOpenCreate}>
          <Plus size={16} /> Tambah Promo Baru
        </button>
      </div>

      <div className="glass admin-table-container" style={{ borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
              <th style={{ padding: '1rem' }}>Kode Promo</th>
              <th style={{ padding: '1rem' }}>Diskon (%)</th>
              <th style={{ padding: '1rem' }}>Potongan Maksimal</th>
              <th style={{ padding: '1rem' }}>Kadaluarsa</th>
              <th style={{ padding: '1rem' }}>Deskripsi</th>
              <th style={{ padding: '1rem' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {promos.map((p) => (
              <tr key={p._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '1rem', fontWeight: '700', color: 'var(--accent-gold)', fontFamily: 'var(--font-mono)' }}>{p.code}</td>
                <td style={{ padding: '1rem', fontWeight: '600', color: 'white' }}>{p.discountPercentage}%</td>
                <td style={{ padding: '1rem' }}>{formatRupiah(p.maxDiscount)}</td>
                <td style={{ padding: '1rem' }}>{p.expiryDate}</td>
                <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{p.description}</td>
                <td style={{ padding: '1rem' }}>
                  <button className="btn" style={{ padding: '6px 12px', fontSize: '0.8rem', backgroundColor: 'rgba(255, 23, 68, 0.1)', color: 'var(--status-error)', border: '1px solid rgba(255, 23, 68, 0.2)' }} onClick={() => handleDelete(p._id)}>
                    <Trash2 size={12} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {formOpen && (
        <div className="confirm-overlay">
          <div className="glass" style={{ width: '100%', maxWidth: '500px', borderRadius: '16px', padding: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '1.5rem', color: 'white' }}>Tambah Promo</h2>
            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <label className="input-label">Kode Promo (Huruf Kapital)</label>
                <input type="text" className="input-field" style={{ textTransform: 'uppercase' }} value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. TIKETKUSTART" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="input-group">
                  <label className="input-label">Diskon (%)</label>
                  <input type="number" className="input-field" value={discountPercentage} onChange={(e) => setDiscountPercentage(e.target.value)} placeholder="20" />
                </div>
                <div className="input-group">
                  <label className="input-label">Potongan Maks (Rp)</label>
                  <input type="number" className="input-field" value={maxDiscount} onChange={(e) => setMaxDiscount(e.target.value)} placeholder="20000" />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Poster URL Promo</label>
                <input type="text" className="input-field" value={posterUrl} onChange={(e) => setPosterUrl(e.target.value)} />
              </div>

              <div className="input-group">
                <label className="input-label">Tanggal Kadaluarsa</label>
                <input type="date" className="input-field" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
              </div>

              <div className="input-group">
                <label className="input-label">Deskripsi Promo</label>
                <textarea className="input-field" style={{ height: '70px', resize: 'vertical' }} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Penjelasan promo..." />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setFormOpen(false)}>Batal</button>
                <button type="submit" className="btn btn-primary">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmationModal 
        isOpen={modal.isOpen}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        confirmText={modal.confirmText}
        onCancel={modal.onCancel}
        onConfirm={modal.onConfirm || (() => setModal({ isOpen: false }))}
      />
    </div>
  );
};

// ==========================================
// 5. REPORT MANAGEMENT
// ==========================================
export const ReportManagement = () => {
  const [reports, setReports] = useState(null);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [movieId, setMovieId] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');

  const fetchMovies = async () => {
    try {
      const res = await fetch(`${API_URL}/movies?limit=100`);
      const data = await res.json();
      if (data.success) setMovies(data.movies);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (startDate) qs.append('startDate', startDate);
      if (endDate) qs.append('endDate', endDate);
      if (movieId) qs.append('movieId', movieId);
      if (paymentStatus) qs.append('paymentStatus', paymentStatus);

      const res = await fetch(`${API_URL}/admin/reports?${qs.toString()}`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.success) {
        setReports(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMovies();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchReports();
    }, 0);
    return () => clearTimeout(timer);
  }, [startDate, endDate, movieId, paymentStatus]);

  const handleResetFilters = () => {
    setStartDate('');
    setEndDate('');
    setMovieId('');
    setPaymentStatus('');
  };

  return (
    <div style={{ padding: '2rem 0' }}>
      <h1 style={{ fontSize: '2.25rem', fontWeight: '800', marginBottom: '2.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <FileText size={28} style={{ color: 'var(--accent-gold)' }} /> Laporan Transaksi Keuangan
      </h1>

      {/* Filter bar */}
      <div className="glass" style={{ padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1rem', color: 'white', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Filter size={16} /> Filter Laporan
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', alignItems: 'end' }}>
          <div className="input-group" style={{ margin: 0 }}>
            <label className="input-label">Mulai Tanggal</label>
            <input type="date" className="input-field" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>

          <div className="input-group" style={{ margin: 0 }}>
            <label className="input-label">Sampai Tanggal</label>
            <input type="date" className="input-field" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>

          <div className="input-group" style={{ margin: 0 }}>
            <label className="input-label">Pilih Film</label>
            <select className="input-field" value={movieId} onChange={(e) => setMovieId(e.target.value)}>
              <option value="">Semua Film</option>
              {movies.map(m => <option key={m._id} value={m._id}>{m.title}</option>)}
            </select>
          </div>

          <div className="input-group" style={{ margin: 0 }}>
            <label className="input-label">Status Bayar</label>
            <select className="input-field" value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}>
              <option value="">Semua Status</option>
              <option value="Paid">LUNAS (Paid)</option>
              <option value="Pending">Tertunda (Pending)</option>
              <option value="Expired">Kedaluwarsa (Expired)</option>
              <option value="Cancelled">Dibatalkan</option>
            </select>
          </div>

          <button className="btn btn-secondary" style={{ height: '42px' }} onClick={handleResetFilters}>
            Reset Filter
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem 0' }}>Memuat data laporan...</div>
      ) : (
        <>
          {/* Summary Math Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            <div className="glass" style={{ padding: '1.25rem', borderRadius: '8px', borderLeft: '4px solid var(--accent-gold)' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>TOTAL PENDAPATAN FILTERED</span>
              <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'white', marginTop: '4px' }}>
                {formatRupiah(reports?.summary?.totalRevenue || 0)}
              </div>
            </div>
            <div className="glass" style={{ padding: '1.25rem', borderRadius: '8px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>TOTAL TRANSAKSI</span>
              <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'white', marginTop: '4px' }}>
                {reports?.summary?.totalTransactions || 0}
              </div>
            </div>
            <div className="glass" style={{ padding: '1.25rem', borderRadius: '8px', borderLeft: '4px solid var(--status-success)' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>TRANSAKSI LUNAS</span>
              <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--status-success)', marginTop: '4px' }}>
                {reports?.summary?.paidCount || 0}
              </div>
            </div>
            <div className="glass" style={{ padding: '1.25rem', borderRadius: '8px', borderLeft: '4px solid var(--status-pending)' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>TRANSAKSI PENDING</span>
              <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--status-pending)', marginTop: '4px' }}>
                {reports?.summary?.pendingCount || 0}
              </div>
            </div>
          </div>

          {/* Grid Grid Transaction */}
          <div className="glass admin-table-container" style={{ borderRadius: '12px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                  <th style={{ padding: '1rem' }}>ID Transaksi</th>
                  <th style={{ padding: '1rem' }}>Pelanggan</th>
                  <th style={{ padding: '1rem' }}>Film</th>
                  <th style={{ padding: '1rem' }}>Tanggal Pesan</th>
                  <th style={{ padding: '1rem' }}>Kursi</th>
                  <th style={{ padding: '1rem' }}>Harga</th>
                  <th style={{ padding: '1rem' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {reports?.transactions && reports.transactions.length > 0 ? (
                  reports.transactions.map((t) => (
                    <tr key={t._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '1rem', fontFamily: 'var(--font-mono)' }}>{t._id.substring(0, 8)}...</td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: '600', color: 'white' }}>{t.userId?.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.userId?.email}</div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: '600', color: 'white' }}>{t.showtimeId?.movieId?.title}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.showtimeId?.studioId?.name}</div>
                      </td>
                      <td style={{ padding: '1rem' }}>{new Date(t.createdAt).toLocaleDateString('id-ID')}</td>
                      <td style={{ padding: '1rem', fontWeight: '700', color: 'var(--accent-gold)' }}>{t.selectedSeats.join(', ')}</td>
                      <td style={{ padding: '1rem', fontWeight: '600', color: 'white' }}>{formatRupiah(t.totalPrice)}</td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ 
                          fontSize: '0.75rem', 
                          fontWeight: '700', 
                          padding: '3px 6px', 
                          borderRadius: '4px',
                          backgroundColor: t.paymentStatus === 'Paid' ? 'rgba(0, 230, 118, 0.15)' : t.paymentStatus === 'Pending' ? 'rgba(255, 193, 7, 0.15)' : 'rgba(255,255,255,0.05)',
                          color: t.paymentStatus === 'Paid' ? 'var(--status-success)' : t.paymentStatus === 'Pending' ? 'var(--status-pending)' : 'var(--text-secondary)'
                        }}>
                          {t.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-secondary)' }}>
                      Tidak ada laporan transaksi yang memenuhi kriteria filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};
