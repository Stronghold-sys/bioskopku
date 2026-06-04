import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Film } from 'lucide-react';

const SplashScreen = ({ onFinish }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onFinish, 600); // Allow fadeout animation to complete
    }, 2200);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: '#05070f',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white'
          }}
        >
          {/* Accent lighting effect */}
          <div 
            style={{
              position: 'absolute',
              width: '400px',
              height: '400px',
              background: 'radial-gradient(circle, rgba(255, 170, 0, 0.1) 0%, rgba(0,0,0,0) 70%)',
              pointerEvents: 'none'
            }}
          />

          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1, ease: 'easeOut' }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', zIndex: 10 }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
              style={{
                color: '#ffaa00',
                padding: '1rem',
                borderRadius: '50%',
                background: 'rgba(255, 170, 0, 0.05)',
                border: '1px solid rgba(255, 170, 0, 0.15)',
                boxShadow: '0 0 30px rgba(255, 170, 0, 0.2)'
              }}
            >
              <Film size={48} />
            </motion.div>
            
            <h1 style={{ 
              fontFamily: "'Outfit', sans-serif", 
              fontWeight: 800, 
              fontSize: '3rem', 
              letterSpacing: '6px',
              background: 'linear-gradient(135deg, #ffffff 0%, #ffaa00 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 4px 12px rgba(0,0,0,0.5)',
              marginTop: '1rem'
            }}>
              BIOSKOPKU
            </h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.8 }}
              style={{ 
                fontFamily: "'Space Grotesk', sans-serif", 
                fontSize: '0.85rem', 
                letterSpacing: '8px', 
                color: '#64748b',
                textTransform: 'uppercase',
                marginTop: '0.25rem'
              }}
            >
              Cinematic Experience
            </motion.p>
          </motion.div>

          {/* Loading progress bar */}
          <div style={{ position: 'absolute', bottom: '8%', width: '200px', height: '2px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '1px', overflow: 'hidden' }}>
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 2, ease: 'easeInOut' }}
              style={{ height: '100%', backgroundColor: '#ffaa00', boxShadow: '0 0 10px #ffaa00' }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SplashScreen;
