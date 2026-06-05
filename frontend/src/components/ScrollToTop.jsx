import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  // Disable browser's automatic scroll restoration to prevent jumpy scroll behaviors on DOM updates
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      // 1. Reset main window scroll for all standard browsers
      window.scrollTo(0, 0);
      
      // 2. Explicitly force document element and body scroll scrolltop resets
      if (document.documentElement) {
        document.documentElement.scrollTop = 0;
        document.documentElement.scrollLeft = 0;
      }
      if (document.body) {
        document.body.scrollTop = 0;
        document.body.scrollLeft = 0;
      }

      // 3. Reset scroll position for Admin panel workspace container (if present)
      const adminWorkspace = document.querySelector('.admin-workspace');
      if (adminWorkspace) {
        adminWorkspace.scrollTop = 0;
        adminWorkspace.scrollLeft = 0;
      }
    };

    // Run scroll reset immediately on route change
    handleScroll();

    // Use requestAnimationFrame to reset scroll on the next browser repaint
    const rafId = requestAnimationFrame(handleScroll);

    // Run with progressive delays to override asynchronous React renders and lazy-loaded API contents
    const timer1 = setTimeout(handleScroll, 50);
    const timer2 = setTimeout(handleScroll, 150);
    const timer3 = setTimeout(handleScroll, 300);
    const timer4 = setTimeout(handleScroll, 500); // Fail-safe for slow mobile devices/networks

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [pathname]);

  return null;
};

export default ScrollToTop;
