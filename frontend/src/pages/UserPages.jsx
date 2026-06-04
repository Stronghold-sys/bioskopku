import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Calendar, Clock, MapPin, Tag, ChevronRight, Check, AlertTriangle, Compass, Ticket, Play } from 'lucide-react';
import { io } from 'socket.io-client';
import confetti from 'canvas-confetti';
import ConfirmationModal from '../components/ConfirmationModal';
import SkeletonCard from '../components/SkeletonCard';

const API_URL = 'http://localhost:5000/api/v1';

// Helper to format currency
const formatRupiah = (val) => `Rp ${val.toLocaleString('id-ID')}`;

// ==========================================
// 1. HOME VIEW
// ==========================================
export const Home = () => {
  const [movies, setMovies] = useState([]);
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const movieRes = await fetch(`${API_URL}/movies?limit=150`);
      const movieData = await movieRes.json();
      const promoRes = await fetch(`${API_URL}/promos`);
      const promoData = await promoRes.json();
      
      if (movieData.success) setMovies(movieData.movies);
      if (promoData.success) setPromos(promoData.promos);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 0);

    // Setup Socket.io real-time listeners for all roles
    const socket = io('http://localhost:5000');
    socket.on('movies-updated', () => {
      console.log('⚡ Real-time Broadcast: Movies database changed. Reloading Home list...');
      fetchData();
    });
    socket.on('promos-updated', () => {
      console.log('⚡ Real-time Broadcast: Promos database changed. Reloading Home promos...');
      fetchData();
    });

    return () => {
      clearTimeout(timer);
      socket.disconnect();
    };
  }, []);

  const todayStr = '2026-06-04';
  const nowShowing = movies.filter(m => m.releaseDate <= todayStr).slice(0, 4);
  const upcoming = movies.filter(m => m.releaseDate > todayStr).slice(0, 4);

  return (
    <div style={{ paddingBottom: '4rem' }}>
      {/* Hero Banner Component */}
      <div style={{ position: 'relative', height: '60vh', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: "url('https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1600&auto=format&fit=crop&q=80')", backgroundSize: 'cover', backgroundPosition: 'center', filter: 'brightness(0.25) blur(2px)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, var(--bg-primary) 100%)' }} />
        
        <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', maxWidth: '800px', padding: '0 20px' }}>
          <h1 className="text-glow" style={{ fontFamily: 'var(--font-sans)', fontSize: '3.5rem', fontWeight: '900', letterSpacing: '4px', marginBottom: '1rem', color: '#ffffff' }}>
            Nonton Seru Tanpa Ribet
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', marginBottom: '2rem', fontFamily: 'var(--font-mono)' }}>
            Pesan tiket bioskop film favorit Anda hanya dalam hitungan detik.
          </p>
          <Link to="/movies" className="btn btn-primary" style={{ fontSize: '1rem', padding: '1rem 2rem' }}>
            Jelajahi Film Sekarang <ChevronRight size={18} />
          </Link>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
        {/* Promos Section */}
        <section style={{ margin: '3rem 0' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Tag style={{ color: 'var(--accent-gold)' }} /> Promo Menarik
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {loading ? (
              [1, 2, 3].map((n) => <div key={n} className="skeleton" style={{ height: '160px', borderRadius: '12px' }} />)
            ) : (
              promos.map((p) => (
                <div key={p._id} className="glass" style={{ borderRadius: '12px', overflow: 'hidden', display: 'flex', height: '160px' }}>
                  <img src={p.posterUrl} alt={p.code} style={{ width: '120px', height: '100%', objectFit: 'cover' }} />
                  <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 1 }}>
                    <div>
                      <span style={{ backgroundColor: 'rgba(255,170,0,0.15)', color: 'var(--accent-gold)', border: '1px solid var(--accent-gold)', fontSize: '0.75rem', fontWeight: '700', padding: '4px 8px', borderRadius: '4px', fontFamily: 'var(--font-mono)' }}>
                        {p.code}
                      </span>
                      <h4 style={{ fontSize: '1.1rem', fontWeight: '700', marginTop: '0.5rem', color: 'white' }}>Diskon {p.discountPercentage}%</h4>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {p.description}
                      </p>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>S/D {p.expiryDate}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Screening Movies Section (Now Showing) */}
        <section style={{ margin: '3rem 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: '800' }}>Sedang Tayang</h2>
            <Link to="/movies?filter=now" style={{ color: 'var(--accent-gold)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.95rem', fontWeight: '600' }}>
              Lihat Semua <ChevronRight size={16} />
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '2rem' }}>
            {loading ? (
              [1, 2, 4].map((n) => <SkeletonCard key={n} />)
            ) : nowShowing.length > 0 ? (
              nowShowing.map((m) => (
                <div key={m._id} className="glass" style={{ borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <div style={{ position: 'relative', overflow: 'hidden' }}>
                    <img src={m.posterUrl} alt={m.title} style={{ width: '100%', height: '360px', objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', top: '12px', right: '12px', padding: '4px 8px', borderRadius: '4px', backgroundColor: 'rgba(5,7,15,0.85)', backdropFilter: 'blur(4px)', fontSize: '0.8rem', fontWeight: '700', border: '1px solid rgba(255,255,255,0.1)' }}>
                      {m.rating}
                    </div>
                  </div>
                  <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '0.5rem', color: 'white' }}>{m.title}</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>{m.genre}</p>
                    <div style={{ marginTop: 'auto', display: 'flex', gap: '0.5rem' }}>
                      <Link to={`/movies/${m._id}`} className="btn btn-primary" style={{ flex: 1, fontSize: '0.85rem' }}>Pesan Tiket</Link>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p style={{ color: 'var(--text-secondary)', gridColumn: 'span 4', textAlign: 'center' }}>Tidak ada film yang sedang tayang saat ini.</p>
            )}
          </div>
        </section>

        {/* Upcoming Movies Section */}
        <section style={{ margin: '4rem 0 3rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'white' }}>Akan Datang (Upcoming)</h2>
            <Link to="/movies?filter=upcoming" style={{ color: 'var(--accent-gold)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.95rem', fontWeight: '600' }}>
              Lihat Semua <ChevronRight size={16} />
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '2rem' }}>
            {loading ? (
              [1, 2, 4].map((n) => <SkeletonCard key={n} />)
            ) : upcoming.length > 0 ? (
              upcoming.map((m) => (
                <div key={m._id} className="glass" style={{ borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%', border: '1px solid rgba(255, 170, 0, 0.05)' }}>
                  <div style={{ position: 'relative', overflow: 'hidden' }}>
                    <img src={m.posterUrl} alt={m.title} style={{ width: '100%', height: '360px', objectFit: 'cover', opacity: 0.75 }} />
                    <div style={{ position: 'absolute', top: '12px', left: '12px', padding: '4px 8px', borderRadius: '4px', backgroundColor: 'rgba(255, 170, 0, 0.2)', border: '1px solid var(--accent-gold)', color: 'var(--accent-gold)', fontSize: '0.75rem', fontWeight: '700' }}>
                      Rilis: {m.releaseDate}
                    </div>
                  </div>
                  <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '0.5rem', color: 'white' }}>{m.title}</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>{m.genre}</p>
                    <div style={{ marginTop: 'auto' }}>
                      <Link to={`/movies/${m._id}`} className="btn btn-secondary" style={{ width: '100%', fontSize: '0.85rem' }}>Lihat Detail</Link>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p style={{ color: 'var(--text-secondary)', gridColumn: 'span 4', textAlign: 'center' }}>Tidak ada film akan datang yang dijadwalkan.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

// ==========================================
// 2. MOVIE LIST VIEW
// ==========================================
export const MovieList = () => {
  const [movies, setMovies] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [categoryTab, setCategoryTab] = useState('all');
  
  // Read filter query from URL parameters
  const queryParams = new URLSearchParams(window.location.search);
  const initialFilter = queryParams.get('filter');
  
  const [activeTab, setActiveTab] = useState(
    initialFilter === 'upcoming' ? 'upcoming' : initialFilter === 'now' ? 'now' : 'all'
  );

  const fetchMovies = async () => {
    try {
      const res = await fetch(`${API_URL}/movies?search=${encodeURIComponent(search)}&limit=150`);
      const data = await res.json();
      if (data.success) setMovies(data.movies);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchMovies, 400); // Debounce search
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const socket = io('http://localhost:5000');
    socket.on('movies-updated', () => {
      console.log('⚡ Real-time Broadcast: Movies database changed. Reloading MovieList...');
      fetchMovies();
    });

    return () => {
      socket.disconnect();
    };
  }, [search]);

  const todayStr = '2026-06-04';

  const filteredMovies = movies.filter((m) => {
    // 1. Filter by screening status
    if (activeTab === 'now') {
      if (m.releaseDate > todayStr) return false;
    } else if (activeTab === 'upcoming') {
      if (m.releaseDate <= todayStr) return false;
    }
    
    // 2. Filter by category (Indonesia, Luar Negeri, Anime)
    if (categoryTab === 'indonesia') {
      return m.genre.includes('Indonesia');
    } else if (categoryTab === 'foreign') {
      return m.genre.includes('Luar Negeri');
    } else if (categoryTab === 'anime') {
      return m.genre.includes('Anime');
    }
    
    return true; // 'all'
  });

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 20px 4rem' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontSize: '2.25rem', fontWeight: '800', marginBottom: '0.25rem' }}>Daftar Film</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Temukan film-film terbaik tahun 2026 di BioskopKu.</p>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'flex-end' }}>
            {/* Status Screening Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-secondary)', padding: '4px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <button 
                className="btn" 
                style={{ 
                  padding: '0.5rem 1.25rem', 
                  fontSize: '0.85rem', 
                  background: activeTab === 'all' ? 'var(--accent-gold)' : 'transparent',
                  color: activeTab === 'all' ? '#05070f' : 'var(--text-secondary)'
                }}
                onClick={() => setActiveTab('all')}
              >
                Semua Status
              </button>
              <button 
                className="btn" 
                style={{ 
                  padding: '0.5rem 1.25rem', 
                  fontSize: '0.85rem', 
                  background: activeTab === 'now' ? 'var(--accent-gold)' : 'transparent',
                  color: activeTab === 'now' ? '#05070f' : 'var(--text-secondary)'
                }}
                onClick={() => setActiveTab('now')}
              >
                Sedang Tayang
              </button>
              <button 
                className="btn" 
                style={{ 
                  padding: '0.5rem 1.25rem', 
                  fontSize: '0.85rem', 
                  background: activeTab === 'upcoming' ? 'var(--accent-gold)' : 'transparent',
                  color: activeTab === 'upcoming' ? '#05070f' : 'var(--text-secondary)'
                }}
                onClick={() => setActiveTab('upcoming')}
              >
                Akan Datang
              </button>
            </div>

            {/* Category Nationality Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-secondary)', padding: '4px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', flexWrap: 'wrap' }}>
              <button 
                className="btn" 
                style={{ 
                  padding: '0.4rem 1rem', 
                  fontSize: '0.8rem', 
                  background: categoryTab === 'all' ? 'var(--accent-gold)' : 'transparent',
                  color: categoryTab === 'all' ? '#05070f' : 'var(--text-secondary)'
                }}
                onClick={() => setCategoryTab('all')}
              >
                Semua Kategori
              </button>
              <button 
                className="btn" 
                style={{ 
                  padding: '0.4rem 1rem', 
                  fontSize: '0.8rem', 
                  background: categoryTab === 'indonesia' ? 'var(--accent-gold)' : 'transparent',
                  color: categoryTab === 'indonesia' ? '#05070f' : 'var(--text-secondary)'
                }}
                onClick={() => setCategoryTab('indonesia')}
              >
                Indonesia (80)
              </button>
              <button 
                className="btn" 
                style={{ 
                  padding: '0.4rem 1rem', 
                  fontSize: '0.8rem', 
                  background: categoryTab === 'foreign' ? 'var(--accent-gold)' : 'transparent',
                  color: categoryTab === 'foreign' ? '#05070f' : 'var(--text-secondary)'
                }}
                onClick={() => setCategoryTab('foreign')}
              >
                Luar Negeri (45)
              </button>
              <button 
                className="btn" 
                style={{ 
                  padding: '0.4rem 1rem', 
                  fontSize: '0.8rem', 
                  background: categoryTab === 'anime' ? 'var(--accent-gold)' : 'transparent',
                  color: categoryTab === 'anime' ? '#05070f' : 'var(--text-secondary)'
                }}
                onClick={() => setCategoryTab('anime')}
              >
                Anime (25)
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="input-group" style={{ maxWidth: '480px', marginBottom: '2.5rem' }}>
        <input 
          type="text" 
          className="input-field" 
          placeholder="Cari film berdasarkan judul, genre, atau sinopsis..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '2rem' }}>
        {loading ? (
          [1, 2, 3, 4].map((n) => <SkeletonCard key={n} />)
        ) : filteredMovies.length > 0 ? (
          filteredMovies.map((m) => (
            <div key={m._id} className="glass" style={{ borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
              <div style={{ position: 'relative' }}>
                <img src={m.posterUrl} alt={m.title} style={{ width: '100%', height: '360px', objectFit: 'cover', opacity: m.releaseDate > todayStr ? 0.75 : 1 }} />
                <div style={{ position: 'absolute', top: '12px', right: '12px', padding: '4px 8px', borderRadius: '4px', backgroundColor: 'rgba(5,7,15,0.85)', backdropFilter: 'blur(4px)', fontSize: '0.8rem', fontWeight: '700', border: '1px solid rgba(255,255,255,0.1)' }}>
                  {m.rating}
                </div>
                {m.releaseDate > todayStr && (
                  <div style={{ position: 'absolute', top: '12px', left: '12px', padding: '4px 8px', borderRadius: '4px', backgroundColor: 'rgba(255, 170, 0, 0.2)', border: '1px solid var(--accent-gold)', color: 'var(--accent-gold)', fontSize: '0.75rem', fontWeight: '700' }}>
                    Rilis: {m.releaseDate}
                  </div>
                )}
              </div>
              <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '0.5rem', color: 'white' }}>{m.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>{m.genre}</p>
                <div style={{ marginTop: 'auto' }}>
                  {m.releaseDate <= todayStr ? (
                    <Link to={`/movies/${m._id}`} className="btn btn-primary" style={{ width: '100%', fontSize: '0.85rem' }}>Detail & Pesan</Link>
                  ) : (
                    <Link to={`/movies/${m._id}`} className="btn btn-secondary" style={{ width: '100%', fontSize: '0.85rem' }}>Lihat Detail (Segera)</Link>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem 0', color: 'var(--text-secondary)' }}>
            Tidak ada film yang cocok dengan pencarian Anda.
          </div>
        )}
      </div>
    </div>
  );
};

// ==========================================
// 3. MOVIE DETAILS VIEW
// ==========================================
export const MovieDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [showtimes, setShowtimes] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [dates, setDates] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMovie = async () => {
    try {
      const movieRes = await fetch(`${API_URL}/movies/${id}`);
      const movieData = await movieRes.json();
      
      if (movieData.success) {
        setMovie(movieData.movie);
        
        // Generate 3 show dates starting today
        const dateArr = [];
        for (let i = 0; i < 3; i++) {
          const d = new Date();
          d.setDate(d.getDate() + i);
          dateArr.push(d.toISOString().split('T')[0]);
        }
        setDates(dateArr);
        setSelectedDate(dateArr[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchShowtimes = async () => {
    if (!selectedDate) return;
    try {
      const res = await fetch(`${API_URL}/showtimes?movieId=${id}&date=${selectedDate}`);
      const data = await res.json();
      if (data.success) {
        setShowtimes(data.showtimes);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMovie();
    }, 0);
    return () => clearTimeout(timer);
  }, [id]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchShowtimes();
    }, 0);
    return () => clearTimeout(timer);
  }, [id, selectedDate]);

  useEffect(() => {
    const socket = io('http://localhost:5000');
    
    socket.on('showtimes-updated', () => {
      console.log('⚡ Real-time Broadcast: Showtimes database changed. Reloading showtimes details...');
      fetchShowtimes();
    });

    socket.on('movies-updated', () => {
      console.log('⚡ Real-time Broadcast: Movies database changed. Reloading movie details...');
      fetchMovie();
    });

    return () => {
      socket.disconnect();
    };
  }, [id, selectedDate]);

  if (loading) {
    return (
      <div style={{ maxWidth: '1000px', margin: '2rem auto', padding: '0 20px' }} className="skeleton">
        <div style={{ height: '400px', width: '100%', borderRadius: '12px' }} />
      </div>
    );
  }

  if (!movie) {
    return <div style={{ textAlign: 'center', padding: '4rem 0' }}>Film tidak ditemukan.</div>;
  }

  const todayStr = '2026-06-04';
  const isUpcoming = movie.releaseDate > todayStr;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 20px 4rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '3rem', marginBottom: '3rem' }}>
        
        {/* Poster Column */}
        <div style={{ textAlign: 'center' }}>
          <img src={movie.posterUrl} alt={movie.title} style={{ width: '100%', maxWidth: '380px', borderRadius: '16px', boxShadow: '0 15px 30px rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.05)' }} />
        </div>

        {/* Info Column */}
        <div>
          <h1 className="text-glow" style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '1rem', color: 'white' }}>{movie.title}</h1>
          
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            <span style={{ border: '1px solid var(--text-muted)', padding: '2px 8px', borderRadius: '4px', fontWeight: '700' }}>{movie.rating}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={16} /> {movie.duration} Menit</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={16} /> Rilis: {movie.releaseDate}</span>
          </div>

          <h3 style={{ fontSize: '1rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '0.5rem' }}>Genre</h3>
          <p style={{ color: 'white', marginBottom: '1.5rem', fontWeight: '500' }}>{movie.genre}</p>

          <h3 style={{ fontSize: '1rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '0.5rem' }}>Sinopsis</h3>
          <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '2rem', fontSize: '0.95rem' }}>{movie.synopsis}</p>

          {/* Embed official Youtube trailer link */}
          <h3 style={{ fontSize: '1rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '1rem' }}>Trailer Resmi</h3>
          <div style={{ position: 'relative', width: '100%', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <iframe 
              src={movie.trailerUrl} 
              title={`${movie.title} Official Trailer`} 
              frameBorder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
            />
          </div>
        </div>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '3rem 0' }} />

      {/* Showtime selection Section */}
      <section>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '1.5rem' }}>Jadwal Tayang & Tiket</h2>
        
        {isUpcoming ? (
          <div style={{ 
            background: 'rgba(255, 170, 0, 0.08)', 
            border: '1px solid var(--accent-gold)', 
            borderRadius: '12px', 
            padding: '2.5rem 1.5rem', 
            textAlign: 'center', 
            maxWidth: '620px', 
            margin: '0 auto' 
          }}>
            <Calendar size={48} style={{ color: 'var(--accent-gold)', marginBottom: '1.25rem' }} />
            <h3 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'white', marginBottom: '0.5rem' }}>Segera Tayang</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: '1.6' }}>
              Jadwal pemesanan tiket untuk film ini belum dibuka. Film ini dijadwalkan akan dirilis secara resmi pada tanggal <strong style={{ color: 'white' }}>{movie.releaseDate}</strong>.
            </p>
          </div>
        ) : (
          <>
            {/* Date Selector */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
              {dates.map((dateString) => {
                const formatted = new Date(dateString).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' });
                const active = selectedDate === dateString;
                return (
                  <button 
                    key={dateString} 
                    className="btn" 
                    style={{ 
                      background: active ? 'linear-gradient(135deg, #ffc107, #ffaa00)' : 'var(--bg-secondary)', 
                      color: active ? '#05070f' : 'var(--text-secondary)',
                      border: active ? 'none' : '1px solid rgba(255,255,255,0.05)',
                      minWidth: '150px'
                    }}
                    onClick={() => setSelectedDate(dateString)}
                  >
                    {formatted}
                  </button>
                );
              })}
            </div>

            {/* Showtimes List Grouped by Cinema */}
            {showtimes.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {(() => {
                  const groups = {};
                  showtimes.forEach(s => {
                    const studio = s.studioId;
                    const cinemaName = studio ? (studio.cinemaId?.name || 'BioskopKu Cinema') : 'BioskopKu Cinema';
                    if (!groups[cinemaName]) groups[cinemaName] = [];
                    groups[cinemaName].push(s);
                  });

                  return Object.entries(groups).map(([cinemaName, list]) => (
                    <div key={cinemaName} className="glass" style={{ padding: '1.75rem', borderRadius: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'white', marginBottom: '1.25rem' }}>
                        <MapPin style={{ color: 'var(--accent-gold)' }} size={20} />
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '700' }}>{cinemaName}</h3>
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
                        {list.map((st) => (
                          <div 
                            key={st._id} 
                            style={{ 
                              backgroundColor: 'rgba(5,7,15,0.4)', 
                              padding: '1rem', 
                              borderRadius: '8px', 
                              border: '1px solid rgba(255,255,255,0.05)',
                              minWidth: '220px',
                              display: 'flex', 
                              flexDirection: 'column',
                              justifyContent: 'space-between'
                            }}
                          >
                            <div>
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                                {st.studioId?.name} ({st.studioId?.classType})
                              </span>
                              <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--accent-gold)', margin: '4px 0' }}>
                                {st.startTime}
                              </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.75rem' }}>
                              <span style={{ fontSize: '0.9rem', fontWeight: '600', color: 'white' }}>{formatRupiah(st.price)}</span>
                              <button 
                                className="btn btn-primary" 
                                style={{ padding: '0.4rem 0.85rem', fontSize: '0.75rem' }}
                                onClick={() => {
                                  const userObj = localStorage.getItem('user');
                                  if (!userObj) {
                                    navigate('/login');
                                  } else {
                                    navigate(`/booking/${st._id}`);
                                  }
                                }}
                              >
                                Pilih Kursi
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-secondary)', background: 'var(--bg-secondary)', borderRadius: '12px' }}>
                Tidak ada jadwal tayang tersedia untuk tanggal yang dipilih.
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
};

// ==========================================
// 4. SEAT BOOKING VIEW (WITH SOCKET REALTIME)
// ==========================================
export const SeatBooking = () => {
  const { showtimeId } = useParams();
  const navigate = useNavigate();
  const [details, setDetails] = useState(null);
  const [seats, setSeats] = useState([]);
  const [selected, setSelected] = useState([]);
  const [othersSelecting, setOthersSelecting] = useState({});
  const [modal, setModal] = useState({ isOpen: false, type: 'info', title: '', message: '' });
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null);

  // Fetch showtime details & seats
  const fetchSeatDetails = async () => {
    try {
      const res = await fetch(`${API_URL}/showtimes/${showtimeId}`);
      const data = await res.json();
      if (data.success) {
        setDetails(data.showtime);
        setSeats(data.seats);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSeatDetails();
    }, 0);

    // Set up Socket connection for real-time seat synching
    socketRef.current = io('http://localhost:5000');
    const socket = socketRef.current;

    socket.emit('join-showtime', showtimeId);

    // Dynamic real-time socket listeners
    socket.on('seats-locked', ({ showtimeId: sid, lockedSeats }) => {
      if (sid === showtimeId) {
        setSeats(prev => prev.map(s => 
          lockedSeats.includes(`${s.row}-${s.number}`) ? { ...s, isBooked: true } : s
        ));
      }
    });

    socket.on('seats-sold', ({ showtimeId: sid, soldSeats }) => {
      if (sid === showtimeId) {
        setSeats(prev => prev.map(s => 
          soldSeats.includes(`${s.row}-${s.number}`) ? { ...s, isBooked: true } : s
        ));
        // Filter out if user selected one of these sold seats
        setSelected(prev => prev.filter(seat => !soldSeats.includes(seat)));
      }
    });

    socket.on('seats-released', ({ showtimeId: sid, releasedSeats }) => {
      if (sid === showtimeId) {
        setSeats(prev => prev.map(s => 
          releasedSeats.includes(`${s.row}-${s.number}`) ? { ...s, isBooked: false } : s
        ));
      }
    });

    // Handle temporary selection marks from other users
    socket.on('seats-selecting', ({ seats: userSeats, userId }) => {
      setOthersSelecting(prev => {
        const copy = { ...prev };
        if (userSeats && userSeats.length > 0) {
          copy[userId] = userSeats;
        } else {
          delete copy[userId];
        }
        return copy;
      });
    });

    return () => {
      socket.emit('leave-showtime', showtimeId);
      socket.disconnect();
      clearTimeout(timer);
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [showtimeId]);

  // Handle local seat selection
  const handleSelectSeat = (seatLabel, isBooked) => {
    if (isBooked) return;

    let updatedSelection;
    if (selected.includes(seatLabel)) {
      updatedSelection = selected.filter(s => s !== seatLabel);
    } else {
      if (selected.length >= 8) {
        setModal({ isOpen: true, type: 'error', title: 'Batas Maksimal', message: 'Anda hanya dapat memesan maksimal 8 kursi sekaligus.' });
        return;
      }
      updatedSelection = [...selected, seatLabel];
    }
    setSelected(updatedSelection);

    // Notify other sockets of selection change
    const userObj = JSON.parse(localStorage.getItem('user') || '{}');
    if (socketRef.current) {
      socketRef.current.emit('select-seats', {
        showtimeId,
        seats: updatedSelection,
        userId: userObj.id || 'anonymous'
      });
    }
  };

  const handleProceed = async () => {
    if (selected.length === 0) {
      setModal({ isOpen: true, type: 'error', title: 'Belum Pilih Kursi', message: 'Harap pilih minimal satu kursi terlebih dahulu.' });
      return;
    }

    const token = localStorage.getItem('accessToken');
    try {
      const res = await fetch(`${API_URL}/bookings`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ showtimeId, selectedSeats: selected })
      });
      const data = await res.json();

      if (data.success) {
        navigate(`/checkout/${data.booking._id}`);
      } else {
        setModal({ isOpen: true, type: 'error', title: 'Gagal Memesan', message: data.message });
        // Refresh seats
        fetchSeatDetails();
      }
    } catch {
      setModal({ isOpen: true, type: 'error', title: 'Kesalahan Sistem', message: 'Gagal membuat reservasi kursi.' });
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '4rem 0' }}>Memuat layout kursi...</div>;
  }

  // Identify seats selected by other users in real-time
  const getOtherSelected = () => {
    const list = [];
    Object.values(othersSelecting).forEach(arr => {
      list.push(...arr);
    });
    return list;
  };
  const otherSelectedList = getOtherSelected();

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem 20px 4rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', color: 'white' }}>PILIH KURSI</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '4px' }}>
            {details?.movie?.title} — {details?.studio?.cinema?.name} ({details?.studio?.name})
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', color: 'var(--accent-gold)', fontWeight: '600' }}>
          <Calendar size={18} /> {details?.date} | <Clock size={18} /> {details?.startTime}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '3rem' }}>
        
        {/* Layout Grid */}
        <div className="glass" style={{ padding: '2.5rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          
          {/* Cinema Screen semicircle curve */}
          <div className="screen-container">
            <div className="screen-bar" />
            <div className="screen-text">Layar Bioskop Utama</div>
          </div>

          {/* Seat Grid Map */}
          <div className="seats-grid" style={{ gridTemplateColumns: 'repeat(8, 32px)' }}>
            {seats.map((seat) => {
              const label = `${seat.row}-${seat.number}`;
              const isReserved = seat.isBooked;
              const isLocallySelected = selected.includes(label);
              const isOtherSelecting = otherSelectedList.includes(label);

              let seatClass = 'seat-available';
              if (isReserved) seatClass = 'seat-booked';
              else if (isLocallySelected) seatClass = 'seat-selected';
              else if (isOtherSelecting) seatClass = 'seat-selecting-other';
              else if (seat.type === 'Sweetbox') seatClass = 'seat-available seat-sweetbox';

              return (
                <div 
                  key={seat._id} 
                  className={`seat-cell ${seatClass}`}
                  onClick={() => handleSelectSeat(label, isReserved)}
                  title={isReserved ? 'Sudah Dipesan' : isOtherSelecting ? 'Sedang Dipilih User Lain' : `Kursi ${label}`}
                >
                  {seat.row}{seat.number}
                </div>
              );
            })}
          </div>

          {/* Legends */}
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginTop: '2rem', justifyContent: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
              <div className="seat-cell seat-available" style={{ width: '18px', height: '18px', cursor: 'default' }} />
              <span>Tersedia</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
              <div className="seat-cell seat-selected" style={{ width: '18px', height: '18px', cursor: 'default' }} />
              <span>Pilihan Anda</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
              <div className="seat-cell seat-selecting-other" style={{ width: '18px', height: '18px', cursor: 'default' }} />
              <span>Dipilih User Lain (Real-time)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
              <div className="seat-cell seat-booked" style={{ width: '18px', height: '18px', cursor: 'default' }} />
              <span>Sudah Dipesan</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
              <div className="seat-cell seat-available seat-sweetbox" style={{ width: '18px', height: '18px', cursor: 'default' }} />
              <span>Sweetbox (Double)</span>
            </div>
          </div>
        </div>

        {/* Sidebar Summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass" style={{ padding: '1.5rem', borderRadius: '12px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Ringkasan Pesanan</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Kelas Studio:</span>
                <span style={{ fontWeight: '600', color: 'white' }}>{details?.studio?.classType}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Harga per Kursi:</span>
                <span style={{ fontWeight: '600', color: 'white' }}>{formatRupiah(details?.price || 0)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Kursi Dipilih:</span>
                <span style={{ fontWeight: '700', color: 'var(--accent-gold)' }}>
                  {selected.length > 0 ? selected.join(', ') : 'Belum memilih'}
                </span>
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px dashed var(--border-color)', margin: '1rem 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <span style={{ fontWeight: '600' }}>Subtotal:</span>
              <span style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--accent-gold)' }}>
                {formatRupiah((details?.price || 0) * selected.length)}
              </span>
            </div>

            <button onClick={handleProceed} className="btn btn-primary" style={{ width: '100%' }}>
              Konfirmasi Pemesanan
            </button>
          </div>

          <div style={{ display: 'flex', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.8rem', backgroundColor: 'rgba(255, 170, 0, 0.05)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255, 170, 0, 0.1)', lineHeight: '1.4' }}>
            <AlertTriangle size={24} style={{ color: 'var(--accent-gold)', flexShrink: 0 }} />
            <span>Kursi akan dikunci sementara selama 5 menit saat Anda melanjutkan ke halaman checkout.</span>
          </div>
        </div>
      </div>

      <ConfirmationModal 
        isOpen={modal.isOpen}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        onConfirm={() => setModal({ isOpen: false })}
      />
    </div>
  );
};

// ==========================================
// 5. CHECKOUT VIEW
// ==========================================
export const Checkout = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [promo, setPromo] = useState('');
  const [promoDetails, setPromoDetails] = useState(null);
  const [timer, setTimer] = useState('05:00');
  const [modal, setModal] = useState({ isOpen: false, type: 'info', title: '', message: '' });
  const [loading, setLoading] = useState(true);

  const startCountdown = (expiryString) => {
    const expiry = new Date(expiryString).getTime();
    
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = expiry - now;

      if (distance < 0) {
        clearInterval(interval);
        setTimer('00:00');
        setModal({
          isOpen: true,
          type: 'error',
          title: 'Waktu Habis',
          message: 'Sesi pemesanan Anda telah kedaluwarsa. Silakan lakukan pemesanan ulang.',
          onConfirm: () => {
            setModal({ isOpen: false });
            navigate('/');
          }
        });
      } else {
        const mins = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((distance % (1000 * 60)) / 1000);
        setTimer(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  };

  const fetchCheckoutData = async () => {
    const token = localStorage.getItem('accessToken');
    try {
      const res = await fetch(`${API_URL}/bookings/${bookingId}/checkout`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setBooking(data.booking);
        startCountdown(data.booking.expiresAt);
      } else {
        setModal({
          isOpen: true,
          type: 'error',
          title: 'Checkout Kedaluwarsa',
          message: data.message,
          onConfirm: () => {
            setModal({ isOpen: false });
            navigate('/');
          }
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCheckoutData();
    }, 0);
    return () => clearTimeout(timer);
  }, [bookingId]);



  const handleApplyPromo = async () => {
    if (!promo) return;
    const token = localStorage.getItem('accessToken');
    try {
      const res = await fetch(`${API_URL}/promos/validate`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ code: promo })
      });
      const data = await res.json();
      if (data.success) {
        setPromoDetails(data.promo);
        setModal({ isOpen: true, type: 'success', title: 'Promo Berhasil', message: data.message });
      } else {
        setModal({ isOpen: true, type: 'error', title: 'Promo Gagal', message: data.message });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleProceedToPayment = () => {
    // Navigate passing the discount calculations
    const finalPrice = promoDetails 
      ? Math.max(booking.subtotal - Math.min((booking.subtotal * promoDetails.discountPercentage) / 100, promoDetails.maxDiscount), 0)
      : booking.totalPrice;

    navigate(`/payment/${bookingId}`, { 
      state: { 
        total: finalPrice, 
        promoCode: promoDetails ? promoDetails.code : null 
      } 
    });
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem 0' }}>Memuat checkout...</div>;

  const discount = promoDetails 
    ? Math.min((booking.subtotal * promoDetails.discountPercentage) / 100, promoDetails.maxDiscount)
    : 0;
  const finalTotal = booking.subtotal - discount;

  const movie = booking.showtimeId?.movieId;
  const studio = booking.showtimeId?.studioId;

  return (
    <div style={{ maxWidth: '720px', margin: '2rem auto 4rem', padding: '0 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '800' }}>Konfirmasi Pesanan</h1>
        <div style={{ backgroundColor: 'rgba(255, 23, 68, 0.15)', border: '1px solid var(--status-error)', color: 'var(--status-error)', padding: '6px 12px', borderRadius: '6px', fontWeight: '700', fontSize: '1rem', fontFamily: 'var(--font-mono)' }}>
          ⏱️ Sisa Waktu: {timer}
        </div>
      </div>

      <div className="glass" style={{ padding: '2rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Ticket Header Details */}
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <img src={movie?.posterUrl} alt={movie?.title} style={{ width: '100px', height: '140px', objectFit: 'cover', borderRadius: '8px' }} />
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'white' }}>{movie?.title}</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>{movie?.genre}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.85rem', color: 'white', marginTop: '1rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={14} /> {booking.showtimeId?.date}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={14} /> {booking.showtimeId?.startTime}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Compass size={14} /> {studio?.name}</span>
            </div>
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)' }} />

        {/* Selected seats list */}
        <div>
          <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>Kursi Yang Dipesan</h3>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {booking.selectedSeats.map(seat => (
              <span key={seat} style={{ backgroundColor: 'rgba(255,170,0,0.1)', border: '1px solid rgba(255,170,0,0.3)', color: 'var(--accent-gold)', fontWeight: '700', padding: '4px 12px', borderRadius: '4px', fontSize: '0.85rem' }}>
                {seat}
              </span>
            ))}
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)' }} />

        {/* Promo code block */}
        <div>
          <label className="input-label">Gunakan Kode Promo</label>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <input 
              type="text" 
              className="input-field" 
              style={{ textTransform: 'uppercase' }}
              placeholder="TIKETKUSTART" 
              value={promo}
              onChange={(e) => setPromo(e.target.value)}
              disabled={!!promoDetails}
            />
            <button className="btn btn-secondary" onClick={handleApplyPromo} disabled={!!promoDetails || !promo}>
              Terapkan
            </button>
          </div>
          {promoDetails && (
            <p style={{ color: 'var(--status-success)', fontSize: '0.85rem', marginTop: '0.5rem', fontWeight: '500' }}>
              ✓ Promo diskon {promoDetails.discountPercentage}% diterapkan (potongan maksimal {formatRupiah(promoDetails.maxDiscount)})
            </p>
          )}
        </div>

        <hr style={{ border: 'none', borderTop: '1px dashed var(--border-color)' }} />

        {/* Checkout math */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.95rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Harga Tiket ({booking.selectedSeats.length}x):</span>
            <span>{formatRupiah(booking.subtotal)}</span>
          </div>
          {discount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--status-success)' }}>
              <span>Diskon Promo:</span>
              <span>-{formatRupiah(discount)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.4rem', fontWeight: '800', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
            <span>Total Bayar:</span>
            <span style={{ color: 'var(--accent-gold)' }}>{formatRupiah(finalTotal)}</span>
          </div>
        </div>

        <button onClick={handleProceedToPayment} className="btn btn-primary" style={{ width: '100%', padding: '0.9rem', fontSize: '1rem', marginTop: '1rem' }}>
          Lanjut ke Pembayaran
        </button>
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

// ==========================================
// 6. PAYMENT SIMULATION VIEW
// ==========================================
export const PaymentSim = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [method, setMethod] = useState('');
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState({ isOpen: false, type: 'info', title: '', message: '' });

  // Read total from state
  const total = window.history.state?.usr?.total || 0;

  const handlePay = async () => {
    if (!method) {
      setModal({ isOpen: true, type: 'error', title: 'Pilih Pembayaran', message: 'Harap pilih salah satu metode pembayaran.' });
      return;
    }

    setLoading(true);
    const token = localStorage.getItem('accessToken');
    try {
      const res = await fetch(`${API_URL}/payments/confirm`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ bookingId, paymentMethod: method })
      });
      const data = await res.json();
      setLoading(false);

      if (data.success) {
        navigate(`/success/${bookingId}/${data.ticketId}`);
      } else {
        setModal({ isOpen: true, type: 'error', title: 'Pembayaran Gagal', message: data.message });
      }
    } catch {
      setLoading(false);
      setModal({ isOpen: true, type: 'error', title: 'Kesalahan Sistem', message: 'Tidak dapat mengonfirmasi pembayaran.' });
    }
  };

  return (
    <div style={{ maxWidth: '520px', margin: '4rem auto', padding: '0 20px' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '1.5rem', textAlign: 'center' }}>Pembayaran</h1>
      
      <div className="glass" style={{ padding: '2rem', borderRadius: '16px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Jumlah Tagihan</span>
          <div style={{ fontSize: '2.25rem', fontWeight: '900', color: 'var(--accent-gold)', marginTop: '0.25rem' }}>
            {formatRupiah(total)}
          </div>
        </div>

        <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1rem', color: 'white' }}>Pilih Metode Pembayaran</h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
          {[
            { id: 'E-Wallet (GoPay/OVO/Dana)', name: 'E-Wallet (GoPay, OVO, Dana)' },
            { id: 'Virtual Account BCA', name: 'Virtual Account BCA' },
            { id: 'Kartu Kredit / Debit', name: 'Kartu Kredit / Debit' }
          ].map((m) => (
            <label 
              key={m.id} 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px', 
                padding: '1rem', 
                borderRadius: '8px', 
                backgroundColor: method === m.id ? 'rgba(255, 170, 0, 0.08)' : 'rgba(5,7,15,0.4)',
                border: method === m.id ? '1px solid var(--accent-gold)' : '1px solid rgba(255,255,255,0.05)',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <input 
                type="radio" 
                name="payment" 
                value={m.id} 
                checked={method === m.id}
                onChange={() => setMethod(m.id)}
                style={{ accentColor: 'var(--accent-gold)' }}
              />
              <span style={{ fontWeight: '500', color: 'white' }}>{m.name}</span>
            </label>
          ))}
        </div>

        <button onClick={handlePay} className="btn btn-primary" style={{ width: '100%', padding: '0.9rem' }} disabled={loading}>
          {loading ? 'Memproses Transaksi...' : 'Bayar Sekarang'}
        </button>
      </div>

      <ConfirmationModal 
        isOpen={modal.isOpen}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        onConfirm={() => setModal({ isOpen: false })}
      />
    </div>
  );
};

// ==========================================
// 7. SUCCESS PAYMENT VIEW
// ==========================================
export const Success = () => {
  const { bookingId } = useParams();

  useEffect(() => {
    // Beautiful fireworks explosion upon page entry
    const duration = 2.5 * 1000;
    const end = Date.now() + duration;

    (function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#ffaa00', '#ffc107', '#00e676']
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#ffaa00', '#ffc107', '#00e676']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
  }, []);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 120px)', padding: '20px' }}>
      <div className="glass" style={{ width: '100%', maxWidth: '460px', borderRadius: '16px', padding: '3rem', textAlign: 'center', border: '1px solid var(--status-success)' }}>
        
        <div style={{ width: '72px', height: '72px', borderRadius: '50%', backgroundColor: 'rgba(0, 230, 118, 0.15)', color: 'var(--status-success)', border: '1px solid rgba(0, 230, 118, 0.3)', display: 'flex', alignItems: 'center', justify: 'center', margin: '0 auto 1.5rem' }}>
          <Check size={40} />
        </div>

        <h1 className="text-glow" style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '0.5rem', color: 'white' }}>Pembayaran Sukses!</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '2rem' }}>
          Pembayaran Anda telah berhasil diproses. Tiket digital Anda telah dikirim ke email dan siap diunduh.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Link to={`/ticket/${bookingId}`} className="btn btn-primary">
            <Ticket size={18} /> Buka Tiket Digital
          </Link>
          <Link to="/" className="btn btn-secondary">
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 8. TICKET LIST / BOOKING HISTORY
// ==========================================
export const TicketList = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      const token = localStorage.getItem('accessToken');
      try {
        const res = await fetch(`${API_URL}/bookings/user`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setBookings(data.bookings);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  return (
    <div style={{ maxWidth: '800px', margin: '2rem auto 4rem', padding: '0 20px' }}>
      <h1 style={{ fontSize: '2.25rem', fontWeight: '800', marginBottom: '1.5rem' }}>Riwayat Pemesanan Tiket</h1>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[1, 2].map(n => <div key={n} className="skeleton" style={{ height: '120px', borderRadius: '12px' }} />)}
        </div>
      ) : bookings.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {bookings.map((b) => {
            const movie = b.showtimeId?.movieId;
            const studio = b.showtimeId?.studioId;
            const isPaid = b.paymentStatus === 'Paid';
            const isPending = b.paymentStatus === 'Pending';
            
            return (
              <div 
                key={b._id} 
                className="glass" 
                style={{ 
                  borderRadius: '12px', 
                  padding: '1.5rem', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  borderLeft: isPaid ? '4px solid var(--status-success)' : isPending ? '4px solid var(--status-pending)' : '4px solid var(--text-muted)'
                }}
              >
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <img src={movie?.posterUrl} alt={movie?.title} style={{ width: '60px', height: '90px', objectFit: 'cover', borderRadius: '6px' }} />
                  <div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'white' }}>{movie?.title}</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '2px' }}>
                      {studio?.name} | Kursi: {b.selectedSeats.join(', ')}
                    </p>
                    <div style={{ display: 'flex', gap: '8px', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                      <span>🗓️ {b.showtimeId?.date}</span>
                      <span>⏱️ {b.showtimeId?.startTime}</span>
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                  <span style={{ 
                    fontSize: '0.75rem', 
                    fontWeight: '700', 
                    padding: '4px 8px', 
                    borderRadius: '4px',
                    backgroundColor: isPaid ? 'rgba(0, 230, 118, 0.15)' : isPending ? 'rgba(255, 193, 7, 0.15)' : 'rgba(255,255,255,0.05)',
                    color: isPaid ? 'var(--status-success)' : isPending ? 'var(--status-pending)' : 'var(--text-secondary)'
                  }}>
                    {b.paymentStatus === 'Paid' ? 'LUNAS' : b.paymentStatus}
                  </span>
                  
                  <span style={{ fontSize: '1.1rem', fontWeight: '700', color: 'white' }}>
                    {formatRupiah(b.totalPrice)}
                  </span>

                  {isPaid ? (
                    <Link to={`/ticket/${b._id}`} className="btn btn-primary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}>
                      Buka Tiket
                    </Link>
                  ) : isPending ? (
                    <Link to={`/checkout/${b._id}`} className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}>
                      Bayar
                    </Link>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass" style={{ padding: '3rem', textAlign: 'center', borderRadius: '12px', color: 'var(--text-secondary)' }}>
          Anda belum pernah melakukan pemesanan tiket.
        </div>
      )}
    </div>
  );
};

// ==========================================
// 9. TICKET DETAIL VIEW
// ==========================================
export const TicketDetail = () => {
  const { bookingId } = useParams();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTicket = async () => {
      const token = localStorage.getItem('accessToken');
      try {
        const res = await fetch(`${API_URL}/tickets/${bookingId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setTicket(data.ticket);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchTicket();
  }, [bookingId]);

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem 0' }}>Memuat tiket digital...</div>;
  if (!ticket) return <div style={{ textAlign: 'center', padding: '4rem 0' }}>Tiket tidak ditemukan.</div>;

  return (
    <div style={{ maxWidth: '800px', margin: '2rem auto 4rem', padding: '0 20px' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '2rem', textAlign: 'center' }}>E-Ticket Anda</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
        
        {/* Cinematic Ticket Card Layout */}
        <div className="ticket-card glass" style={{ border: '1px solid rgba(255, 170, 0, 0.25)' }}>
          <div className="glow-effect" />
          
          <img src={ticket.movie.posterUrl} alt={ticket.movie.title} style={{ width: '100%', height: '220px', objectFit: 'cover' }} />
          
          <div style={{ padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'white' }}>{ticket.movie.title}</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{ticket.movie.genre} | {ticket.movie.duration} Mins</p>
            
            <div className="ticket-divider" />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.85rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>KODE BOOKING</span>
                <span style={{ fontWeight: '700', color: 'var(--accent-gold)', fontSize: '1rem', fontFamily: 'var(--font-mono)' }}>{ticket.ticketCode}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>NAMA</span>
                <span style={{ fontWeight: '700', color: 'white' }}>{ticket.user.name}</span>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>BIOSKOP</span>
                <span style={{ fontWeight: '700', color: 'var(--accent-gold)', fontSize: '0.95rem' }}>{ticket.showtime.cinemaName}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>STUDIO</span>
                <span style={{ fontWeight: '700', color: 'white' }}>{ticket.showtime.studioName}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>KURSI</span>
                <span style={{ fontWeight: '700', color: 'var(--accent-gold)', fontSize: '1rem' }}>{ticket.booking.selectedSeats.join(', ')}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>TANGGAL</span>
                <span style={{ fontWeight: '700', color: 'white' }}>{ticket.showtime.date}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>JAM TAYANG</span>
                <span style={{ fontWeight: '700', color: 'white' }}>{ticket.showtime.startTime}</span>
              </div>
            </div>

            <div className="ticket-divider" />

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '1rem 0' }}>
              <img src={ticket.qrCode} alt="QR Code" style={{ width: '150px', height: '150px', backgroundColor: 'white', padding: '8px', borderRadius: '8px' }} />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', letterSpacing: '1px' }}>SCAN QR PADA CO-TICKET READER</span>
            </div>
          </div>
        </div>

        {/* Media trailer inside digital ticket */}
        <div className="glass" style={{ padding: '1.5rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'white', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Play size={18} style={{ color: 'var(--accent-gold)' }} /> Official Movie Trailer
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Tonton trailer film di bawah ini sambil menunggu jadwal tayang Anda.</p>
          
          <div style={{ position: 'relative', width: '100%', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: '12px' }}>
            <iframe 
              src={ticket.movie.trailerUrl} 
              title={`${ticket.movie.title} Trailer`} 
              frameBorder="0" 
              allowFullScreen
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 'auto', backgroundColor: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px' }}>
            <div><strong>Lokasi:</strong> {ticket.showtime.cinemaName} ({ticket.showtime.cinemaLocation})</div>
            <div><strong>Metode Bayar:</strong> {ticket.payment?.paymentMethod || 'Tunai'}</div>
            <div><strong>Metode Transaksi:</strong> {ticket.payment?.transactionId}</div>
            <div><strong>Tanggal Transaksi:</strong> {ticket.payment?.paidAt ? new Date(ticket.payment.paidAt).toLocaleString('id-ID') : ''}</div>
          </div>
        </div>

      </div>
    </div>
  );
};

// ==========================================
// 10. PROFILE VIEW
// ==========================================
export const Profile = ({ onProfileUpdate }) => {
  const [name, setName] = useState(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.name || '';
  });
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState({ isOpen: false, type: 'info', title: '', message: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const token = localStorage.getItem('accessToken');
    try {
      const res = await fetch(`${API_URL}/auth/profile`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, password: password || undefined })
      });
      const data = await res.json();
      setLoading(false);

      if (data.success) {
        localStorage.setItem('user', JSON.stringify(data.user));
        onProfileUpdate(data.user);
        setModal({ isOpen: true, type: 'success', title: 'Profil Diupdate', message: data.message });
        setPassword('');
      } else {
        setModal({ isOpen: true, type: 'error', title: 'Gagal Update', message: data.message });
      }
    } catch {
      setLoading(false);
      setModal({ isOpen: true, type: 'error', title: 'Kesalahan Sistem', message: 'Gagal memperbarui profil.' });
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '4rem auto', padding: '0 20px' }}>
      <h1 style={{ fontSize: '2.25rem', fontWeight: '800', marginBottom: '1.5rem' }}>Pengaturan Profil</h1>

      <div className="glass" style={{ padding: '2rem', borderRadius: '16px' }}>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">Nama Lengkap</label>
            <input 
              type="text" 
              className="input-field" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
            />
          </div>

          <div className="input-group">
            <label className="input-label">Ubah Password</label>
            <input 
              type="password" 
              className="input-field" 
              placeholder="Masukkan password baru (opsional)" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
            {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </form>
      </div>

      <ConfirmationModal 
        isOpen={modal.isOpen}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        onConfirm={() => setModal({ isOpen: false })}
      />
    </div>
  );
};
