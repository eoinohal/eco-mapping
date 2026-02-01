import React from 'react';
import { Grid3X3 } from 'lucide-react';
import { Button } from '../ui/Button';

export const MissionMakerSection = ({onSignUpClick}) => {
  return (
    <section className="grid md:grid-cols-2 gap-12 items-center md:flex-row-reverse">
      {/* Visual: Grid Map */}
      <div className="order-2 md:order-1 bg-slate-900 rounded-lg p-1 overflow-hidden shadow-lg -rotate-1 hover:rotate-0 transition-transform duration-500">
         <div className="bg-slate-800 rounded p-4 aspect-square flex items-center justify-center relative overflow-hidden">
            <Grid3X3 className="text-slate-700 w-full h-full opacity-20 absolute" />
            <div className="grid grid-cols-4 gap-1 w-full h-full opacity-50">
               {[...Array(16)].map((_, i) => (
                  <div key={i} className={`border border-slate-700/50 rounded ${i === 6 || i === 10 ? 'bg-emerald-500/20' : ''}`}></div>
               ))}
            </div>
         </div>
      </div>

      <div className="space-y-6 order-1 md:order-2">
        <h2 className="text-3xl font-bold tracking-tight">Become a Mission Maker</h2>
        <p className="text-slate-600 leading-relaxed">
          For environmental initiatives to set up mapping missions and crowdsource data labeling.
          Create training datasets, or validate models with human-reviewed feedback.
        </p>
        <Button variant="outline"onClick={onSignUpClick} className="h-12 px-8 rounded-full border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white">
          Create Account
        </Button>
      </div>
    </section>
  );
};