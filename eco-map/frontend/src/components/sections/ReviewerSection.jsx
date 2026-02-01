import React from 'react';
import { Trophy } from 'lucide-react';
import { Button } from '../ui/Button';

export const ReviewerSection = ({onSignUpClick}) => {
  return (
    <section className="grid md:grid-cols-2 gap-12 items-center">
      <div className="space-y-6">
        <h2 className="text-3xl font-bold tracking-tight">Become a Reviewer</h2>
        <p className="text-slate-600 leading-relaxed">
          Contribute to helping environmental issues by completing missions. 
          Gain points with good submissions to place high in mission leaderboards!
        </p>
        <Button variant="outline" onClick={onSignUpClick} className="h-12 px-8 rounded-full border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white">
          Create Account
        </Button>
      </div>
      
      {/* Visual: Leaderboard Card */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 shadow-sm rotate-2 hover:rotate-0 transition-transform duration-500">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 font-bold"><Trophy className="text-yellow-500 w-5 h-5"/> Mission Leaders</div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between bg-white p-3 rounded border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-xs font-bold">{i}</div>
                <span className="text-sm font-medium">User{i*1}</span>
              </div>
              <span className="text-sm font-mono text-emerald-600">{2500 - (i * 163)} pts</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};