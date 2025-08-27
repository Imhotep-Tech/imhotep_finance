import React from 'react';

const NetWorthCard = ({ networth, favoriteCurrency, loading }) => (
  <div className="rounded-2xl p-8 text-white shadow-lg"
    style={{
      background: 'linear-gradient(135deg, #51adac 0%, #428a89 100%)',
    }}>
    <div className="text-center">
      <h2 className="text-lg font-medium text-white/90 mb-2">Total Net Worth</h2>
      <p className="text-5xl font-bold mb-2">{loading ? '...' : networth}</p>
      <p className="text-xl text-white/90">{favoriteCurrency}</p>
    </div>
  </div>
);

export default NetWorthCard;
