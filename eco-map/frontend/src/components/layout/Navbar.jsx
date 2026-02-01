import React from 'react';
import { Github } from 'lucide-react';
import { Button } from '../ui/Button';

export const Navbar = () => {
  return (
    <nav className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="container mx-auto max-w-5xl flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-2 font-bold tracking-tighter text-xl">
          eco-mapping
        </div>
        <div className="flex items-center gap-4 text-sm font-medium">
          <span className="hidden sm:inline text-slate-500">HackEarth: eco-eoin</span>
          <Button variant="outline" onClick={() => window.open('https://github.com/eoinohal/eco-mapping', '_blank')}>
            <Github className="w-4 h-4 mr-2" /> GitHub
          </Button>
        </div>
      </div>
    </nav>
  );
};