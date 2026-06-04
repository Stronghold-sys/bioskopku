import React from 'react';

const SkeletonCard = () => {
  return (
    <div className="glass" style={{ borderRadius: '12px', overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="skeleton" style={{ width: '100%', height: '360px' }} />
      <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div className="skeleton" style={{ width: '80%', height: '24px' }} />
        <div className="skeleton" style={{ width: '40%', height: '16px' }} />
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
          <div className="skeleton" style={{ width: '50%', height: '36px' }} />
          <div className="skeleton" style={{ width: '50%', height: '36px' }} />
        </div>
      </div>
    </div>
  );
};

export default SkeletonCard;
