import React from 'react';
import { Grid3X3 } from 'lucide-react';
import { Button } from '../ui/Button';
import adminImage from '../../assets/images/admin.png';

export const MissionMakerSection = ({ onSignUpClick }) => {
  return (
    <section className="grid md:grid-cols-2 gap-12 items-center md:flex-row-reverse">
      {/* Visual: Grid Map */}
      <div className="order-2 md:order-1 bg-slate-900 rounded-lg p-1 overflow-hidden shadow-lg -rotate-1 hover:rotate-0 transition-transform duration-500">
        <img
          src={adminImage}
          alt="Mission maker admin dashboard"
          className="w-full h-full object-cover rounded-md"
        />
      </div>

      <div className="space-y-6 order-1 md:order-2">
        <h2 className="text-3xl font-bold tracking-tight">Become a Mission Maker</h2>
        <p className="text-slate-600 leading-relaxed">
          Set up mapping missions and crowdsource data labeling for environmental projects.
          Create training datasets, or validate models with human-reviewed feedback.
        </p>
        <Button
          variant="outline"
          onClick={onSignUpClick}
          className="h-12 px-8 rounded-full border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white"
        >
          Create Account
        </Button>
      </div>
    </section>
  );
};
