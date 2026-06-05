import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      // 1. Reset main window scroll
      window.scrollTo(0, 0);
      if (document.documentElement) document.documentElement.scrollTop = 0;
      if (document.body) document.body.scrollTop = 0;

      // 2. Reset scroll position for Admin panel workspace container (which has overflowY: auto)
      const adminWorkspace = document.querySelector('.admin-workspace');
      if (adminWorkspace) {
        adminWorkspace.scrollTop = 0;
      }
    };

    // Run scroll reset immediately on route change
    handleScroll();

    // Run with a short delay to override any browser scroll restoration or asynchronous React render cycles
    const timer = setTimeout(handleScroll, 50);
    const timerLong = setTimeout(handleScroll, 150);

    return () => {
      clearTimeout(timer);
      clearTimeout(timerLong);
    };
  }, [pathname]);

  return null;
};

export default ScrollToTop;
