import { useState } from 'react';
import { Mail, Phone, Clock, Send, HelpCircle, Shield, Info, FileText, BookOpen, AlertCircle } from 'lucide-react';

const Footer = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [error, setError] = useState('');

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email) {
      setError('Email wajib diisi.');
      return;
    }
    // Simple email regex validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Format email tidak valid.');
      return;
    }

    // Simulate subscription API request
    setSubscribed(true);
    setEmail('');
    setError('');
    setTimeout(() => {
      setSubscribed(false);
    }, 5000);
  };

  return (
    <footer className="main-footer">
      <div className="footer-glow-container">
        <div className="footer-glow-violet"></div>
        <div className="footer-glow-blue"></div>
      </div>
      
      <div className="footer-top-container">
        <div className="footer-grid">
          {/* Column 1: Brand & Newsletter */}
          <div className="footer-column brand-column">
            <h2 className="footer-brand">
              Bioskop<span>Ku</span>
            </h2>
            <p className="footer-tagline">
              Platform pemesanan tiket bioskop digital modern, cepat, dan terpercaya. Temukan film favorit Anda dan pesan kursi terbaik dengan mudah.
            </p>
            <div className="newsletter-box">
              <h4 className="newsletter-title">Berlangganan Newsletter</h4>
              <p className="newsletter-desc">Dapatkan update film terbaru langsung ke email Anda.</p>
              <form onSubmit={handleSubscribe} className="newsletter-form">
                <div className="newsletter-input-wrapper">
                  <input
                    type="email"
                    placeholder="Masukkan email Anda..."
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError('');
                    }}
                    className="newsletter-input"
                  />
                  <button type="submit" className="newsletter-btn" aria-label="Subscribe">
                    <Send size={16} />
                  </button>
                </div>
                {error && <span className="newsletter-status error">{error}</span>}
                {subscribed && <span className="newsletter-status success">Terima kasih! Anda telah berlangganan.</span>}
              </form>
            </div>
          </div>

          {/* Column 2: Bantuan / Support */}
          <div className="footer-column">
            <h3 className="footer-heading">Bantuan & Support</h3>
            <ul className="footer-links">
              <li>
                <a href="#faq" className="footer-link">
                  <HelpCircle size={14} className="link-icon" /> FAQ
                </a>
              </li>
              <li>
                <a href="#help-center" className="footer-link">
                  <Info size={14} className="link-icon" /> Pusat Bantuan
                </a>
              </li>
              <li>
                <a href="#how-to-order" className="footer-link">
                  <BookOpen size={14} className="link-icon" /> Cara Pemesanan
                </a>
              </li>
              <li>
                <a href="#report-problem" className="footer-link">
                  <AlertCircle size={14} className="link-icon" /> Laporan Masalah
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Informasi Perusahaan / Legal */}
          <div className="footer-column">
            <h3 className="footer-heading">Perusahaan</h3>
            <ul className="footer-links">
              <li>
                <a href="#about" className="footer-link"> Tentang Kami</a>
              </li>
              <li>
                <a href="#privacy" className="footer-link"> Kebijakan Privasi</a>
              </li>
              <li>
                <a href="#terms" className="footer-link"> Syarat & Ketentuan</a>
              </li>
              <li>
                <a href="#disclaimer" className="footer-link"> Disclaimer</a>
              </li>
              <li>
                <a href="#cookie" className="footer-link"> Kebijakan Cookie</a>
              </li>
            </ul>
          </div>

          {/* Column 4: Kontak & Sosial Media */}
          <div className="footer-column contact-column">
            <h3 className="footer-heading">Hubungi Kami</h3>
            <ul className="contact-info">
              <li>
                <Mail size={16} className="contact-icon" />
                <span className="contact-text">support@bioskopku.my.id</span>
              </li>
              <li>
                <Phone size={16} className="contact-icon" />
                <span className="contact-text">+62 812-3456-7890</span>
              </li>
              <li>
                <Phone size={16} className="contact-icon" />
                <span className="contact-text">+62 21-555-0199</span>
              </li>
              <li>
                <Clock size={16} className="contact-icon-top" />
                <div className="contact-text-multiline">
                  <strong>Jam Operasional:</strong>
                  <span>Senin–Jumat, 08.00–17.00 WIB</span>
                </div>
              </li>
            </ul>

            <div className="social-media-container">
              <h4 className="social-heading">Ikuti Kami</h4>
              <div className="social-icons">
                {/* Instagram */}
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="social-icon-btn instagram" aria-label="Instagram">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="svg-icon"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                </a>
                {/* Facebook */}
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="social-icon-btn facebook" aria-label="Facebook">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="svg-icon"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                </a>
                {/* X / Twitter */}
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="social-icon-btn twitter" aria-label="X (Twitter)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="svg-icon"><path d="M4 4l11.733 16h4.267l-11.733 -16z"></path><path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772"></path></svg>
                </a>
                {/* YouTube */}
                <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="social-icon-btn youtube" aria-label="YouTube">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="svg-icon"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"></path><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"></polygon></svg>
                </a>
                {/* TikTok */}
                <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" className="social-icon-btn tiktok" aria-label="TikTok">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="svg-icon"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"></path></svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Separator and Bottom Footer */}
      <div className="footer-bottom-wrapper">
        <div className="footer-bottom-container">
          <div className="footer-bottom-left">
            <p className="copyright-text">
              © 2026 <span>BioskopKu</span>. All rights reserved.
            </p>
          </div>
          <div className="footer-bottom-right">
            <span className="footer-extra-text">Developed with care by BioskopKu Team</span>
            <span className="footer-extra-divider">•</span>
            <span className="footer-extra-text">All content protected</span>
            <span className="footer-extra-divider">•</span>
            <span className="footer-extra-text">Made for better user experience</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
