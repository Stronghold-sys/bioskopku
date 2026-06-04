import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

const ConfirmationModal = ({ 
  isOpen, 
  type = 'info', 
  title, 
  message, 
  onConfirm, 
  onCancel, 
  confirmText = 'OK', 
  cancelText = 'Batal' 
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle size={36} />;
      case 'error':
        return <AlertCircle size={36} />;
      case 'info':
      default:
        return <Info size={36} />;
    }
  };

  return (
    <AnimatePresence>
      <div className="confirm-overlay">
        <motion.div 
          className="confirm-modal"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        >
          <div className="glow-effect" />
          
          {onCancel && (
            <button 
              className="absolute-close" 
              onClick={onCancel}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              <X size={20} />
            </button>
          )}

          <div className={`confirm-icon-wrapper ${type}`}>
            {getIcon()}
          </div>

          <h3 style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
            {title}
          </h3>
          
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '2rem' }}>
            {message}
          </p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            {onCancel && (
              <button className="btn btn-secondary" onClick={onCancel} style={{ flex: 1 }}>
                {cancelText}
              </button>
            )}
            <button 
              className="btn btn-primary" 
              onClick={onConfirm} 
              style={{ flex: 1, background: type === 'error' ? 'var(--status-error)' : 'linear-gradient(135deg, #ffc107, #ffaa00)', color: type === 'error' ? 'white' : '#05070f', boxShadow: type === 'error' ? '0 4px 15px rgba(255, 23, 68, 0.3)' : '0 4px 15px rgba(255, 170, 0, 0.3)' }}
            >
              {confirmText}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ConfirmationModal;
