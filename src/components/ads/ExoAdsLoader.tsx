'use client'; 

import React, { useEffect, FC } from 'react';

interface ExoClickAdProps {
  zoneId: string;
  className: string;
  style?: React.CSSProperties; 
}

const ExoClickAd: FC<ExoClickAdProps> = ({ zoneId, className, style }) => {
  
  useEffect(() => {
    if (typeof window !== 'undefined' && window.AdProvider) {
      try {
        window.AdProvider.push({ "serve": {} });
        console.log(`ExoClick Ad served for zone: ${zoneId}`);
      } catch (error) {
        console.error('Error serving ExoClick ad unit:', error);
      }
    } else {
      console.warn('ExoClick AdProvider is not yet ready. Waiting for script load...');
    }
  }, [zoneId]); 

  return (
    <div className="exoclick-ad-wrapper absolute top-30 sm:top-40" style={{ textAlign: 'center', ...style }}>
      <ins 
        className={className} 
        data-zoneid={zoneId}
        style={{ display: 'inline-block' }}
      />
    </div>
  );
};

export default ExoClickAd;