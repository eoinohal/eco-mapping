import React from 'react';

export const Badge = ({ children }) => (
  <span className="inline-flex items-center rounded-full border border-slate-200 px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 text-slate-950">
    {children}
  </span>
);