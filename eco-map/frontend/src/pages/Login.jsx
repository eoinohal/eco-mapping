import React, { useState, useRef } from 'react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { AuthForm } from '../components/auth/AuthForm';
import { ReviewerSection } from '../components/sections/ReviewerSection';
import { MissionMakerSection } from '../components/sections/MissionMakerSection';
import mainImage from '../assets/images/japanHunt.png';

const Login = () => {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const topSectionRef = useRef(null);
  const handleScrollToSignUp = () => {
    setIsRegisterMode(true);
    topSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white text-slate-950 font-sans selection:bg-slate-200">
      
      <Navbar />

      <main className="container mx-auto max-w-5xl px-6 py-12 space-y-24">
        
        {/* HERO & AUTH SECTION */}
        <section 
          ref={topSectionRef} 
          className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center scroll-mt-24"
        >
          {/* Visual - Left */}
          <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50 relative group">
            <img
              src={mainImage}
              alt="Eco-mapping overview"
            />
          </div>

          {/* Auth Form - Right */}
          <AuthForm 
            isRegisterMode={isRegisterMode} 
            toggleMode={() => setIsRegisterMode(!isRegisterMode)} 
          />
        </section>


        {/* FEATURE SECTIONS */}
        <ReviewerSection onSignUpClick={handleScrollToSignUp} />
        
        <MissionMakerSection onSignUpClick={handleScrollToSignUp} />


        {/* INFO GRID - fill in with info */}
        <div className="grid md:grid-cols-3 gap-8 py-12 border-t border-slate-100">
          <div className="space-y-2">
            <h3 className="font-bold text-sm"></h3>
            <p className="text-xs text-slate-500 leading-relaxed">
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-bold text-sm"></h3>
            <p className="text-xs text-slate-500 leading-relaxed">
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-bold text-sm"></h3>
            <p className="text-xs text-slate-500 leading-relaxed">
            </p>
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}

export default Login;