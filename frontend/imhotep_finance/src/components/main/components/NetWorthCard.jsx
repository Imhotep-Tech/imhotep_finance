import React, { useState } from 'react';

const getFontSize = (networth, mode) => {
  const length = String(networth).replace(/[^0-9]/g, '').length;
  if (mode === 'navbar') return 'text-2xl'; // always small in navbar
  if (length > 15) return 'text-base sm:text-lg';
  if (length > 12) return 'text-lg sm:text-xl';
  if (length > 9) return 'text-xl sm:text-2xl';
  if (length > 6) return 'text-2xl sm:text-3xl';
  return 'text-4xl sm:text-5xl';
};

const NetWorthCard = ({ networth, favoriteCurrency, loading, mode = 'dashboard' }) => {
  const [showFull, setShowFull] = useState(false);

  // Format networth to 2 decimal places, fallback to '0.00'
  const formattedNetworth = loading
    ? '...'
    : Number(networth || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const fontSizeClass = getFontSize(formattedNetworth, mode);

  // For navbar: show first 6 digits, then ellipsis, tooltip on hover
  let displayNetworth = formattedNetworth;
  let tooltip = null;
  if (mode === 'navbar' && !loading) {
    const digitsOnly = formattedNetworth.replace(/[^0-9.]/g, '');
    if (digitsOnly.length > 6) {
      displayNetworth = digitsOnly.slice(0, 6) + '...';
      tooltip = formattedNetworth;
    }
  }

  return (
    <div
      className="rounded-2xl p-8 text-white shadow-lg flex items-center justify-center transition-all duration-200 hover:shadow-2xl hover:scale-[1.02]"
      style={{
        background: 'linear-gradient(135deg, #51adac 0%, #428a89 100%)',
        minHeight: '180px',
        cursor: 'pointer'
      }}
    >
      <div className="w-full flex flex-col items-center justify-center text-center">
        <h2 className="text-lg font-medium text-white/90 mb-2">Total Net Worth</h2>
        {mode === 'navbar' && tooltip ? (
          <div
            className={`font-bold mb-2 ${fontSizeClass} whitespace-nowrap flex items-center justify-center relative`}
            style={{ maxWidth: '100%', cursor: 'pointer' }}
            onMouseEnter={() => setShowFull(true)}
            onMouseLeave={() => setShowFull(false)}
          >
            {displayNetworth}
            <span className="text-xl align-middle ml-1">{favoriteCurrency}</span>
            {showFull && (
              <div className="absolute left-1/2 top-full z-50 -translate-x-1/2 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded shadow-lg whitespace-nowrap">
                {formattedNetworth} <span className="text-base">{favoriteCurrency}</span>
              </div>
            )}
          </div>
        ) : (
          <div className={`font-bold mb-2 ${fontSizeClass} whitespace-nowrap flex items-center justify-center`} style={{ maxWidth: '100%' }}>
            {formattedNetworth} <span className="text-xl align-middle ml-1">{favoriteCurrency}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default NetWorthCard;
