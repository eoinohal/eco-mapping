import React from 'react';

export const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  const base = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2";
  const variants = {
    primary: "bg-slate-900 text-slate-50 shadow hover:bg-slate-900/90",
    outline: "border border-slate-200 bg-white shadow-sm hover:bg-slate-100 hover:text-slate-900",
    ghost: "hover:bg-slate-100 hover:text-slate-900"
  };
  return <button className={`${base} ${variants[variant]} ${className}`} {...props}>{children}</button>;
};