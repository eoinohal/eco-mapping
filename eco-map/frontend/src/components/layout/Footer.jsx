import React from 'react';

export const Footer = () => {
  return (
    <footer className="border-t border-slate-200 py-6 mt-12">
      <div className="container mx-auto max-w-5xl px-6 flex justify-between items-center text-xs text-slate-500">
         <span className="font-bold text-slate-900">eco-mapping</span>
         <a href="#" className="hover:underline">Contact Support</a>
      </div>
    </footer>
  );
};