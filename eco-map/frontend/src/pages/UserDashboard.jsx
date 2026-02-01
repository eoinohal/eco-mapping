import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, User as UserIcon, Map as MapIcon, Trophy, History, ChevronRight } from 'lucide-react';

// --- Components ---
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Button } from '../components/ui/Button';
import ProjectCard from '../components/ProjectCard'; 

const UserDashboard = () => {
  const [myProjects, setMyProjects] = useState([]);
  const [allProjects, setAllProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const { user, logout } = useAuth(); 
  const token = localStorage.getItem('token'); 

  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        
        const myProjRes = await axios.get('http://localhost:8000/users/me/projects', config);
        setMyProjects(myProjRes.data || []);

        const allProjRes = await axios.get('http://localhost:8000/projects/', config);
        setAllProjects(allProjRes.data || []);

      } catch (error) {
        console.error("Failed to load dashboard data", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) loadData();
  }, [user, token]);

  const handleStartProject = (projectId) => {
    navigate(`/task/${projectId}`);
  };

  // --- DERIVED STATE ---
  const myActiveProjects = myProjects.filter(p => p.is_active);
  const myHistoryProjects = myProjects.filter(p => !p.is_active);

  return (
    <div className="min-h-screen bg-white text-slate-950 font-sans selection:bg-slate-200">
      <Navbar />

      <main className="container mx-auto max-w-5xl px-6 py-12 space-y-16">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-8 border-b border-slate-200 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
               Home
            </h1>
            <p className="text-slate-500 mt-2 text-sm leading-relaxed">
              Welcome back! Track your contributions and find new missions.
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full text-sm font-medium text-slate-700">
              <UserIcon className="w-4 h-4" />
              <span>{user?.username}</span>
            </div>
            <Button 
              variant="ghost" 
              onClick={logout}
              className="text-slate-500 hover:text-red-600 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </Button>
          </div>
        </div>

        {/* --- SECTION 1: MY ACTIVE MISSIONS --- */}
        <section className="space-y-6">
           <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
            My Active Missions
            <span className="text-xs font-normal text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
              {myActiveProjects.length} Active
            </span>
          </h2>

          <div className="flex gap-6 overflow-x-auto pb-6 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent -mx-6 px-6">
            {myActiveProjects.length > 0 ? (
              myActiveProjects.map((proj) => (
                <div key={proj.id} className="min-w-[300px] md:min-w-[350px] snap-center relative group">
                  {/* Badge for contributions */}
                  <div className="absolute top-3 right-3 z-10 bg-white/90 backdrop-blur px-2 py-1 rounded text-xs font-bold shadow-sm border border-slate-200 text-emerald-600">
                    {proj.user_contribution_count} contribs
                  </div>
                  <ProjectCard 
                    project={proj} 
                    actionLabel="Continue Mapping"
                    onAction={handleStartProject}
                  />
                </div>
              ))
            ) : (
              <div className="w-full text-center py-12 text-slate-400 text-sm">
                <p className="text-slate-500 text-sm">You haven't contributed to any active missions yet.</p>
              </div>
            )}
          </div>
        </section>

        {/* --- SECTION 2: AVAILABLE MISSIONS --- */}
        <section className="space-y-6">
           <div className="flex items-center justify-between">
             <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
              Available Missions
              <span className="text-xs font-normal text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                {allProjects.length} Total
              </span>
            </h2>
            <div className="text-xs text-slate-400 flex items-center gap-1">
              Scroll <ChevronRight className="w-3 h-3" />
            </div>
           </div>

          {/* Carousel Container */}
          <div className="flex gap-6 overflow-x-auto pb-6 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent -mx-6 px-6">
            {allProjects.length > 0 ? (
              allProjects.map((proj) => (
                <div key={proj.id} className="min-w-[300px] md:min-w-[350px] snap-center">
                  <ProjectCard 
                    project={proj} 
                    actionLabel="Start Mapping"
                    onAction={handleStartProject}
                  />
                </div>
              ))
            ) : (
              <div className="w-full text-center py-12 text-slate-400 text-sm">
                No missions available.
              </div>
            )}
          </div>
        </section>

        {/* --- SECTION 3: HISTORY & STANDINGS --- */}
        <section className="space-y-6">
           <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
            History & Standings
            <span className="text-xs font-normal text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
              {myHistoryProjects.length} Completed
            </span>
          </h2>

          <div className="max-w-2xl bg-slate-50 border border-slate-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2 font-bold text-slate-800">
                <Trophy className="text-yellow-500 w-5 h-5"/> 
                Mission Performance
              </div>
            </div>

            <div className="space-y-3">
              {myHistoryProjects.length > 0 ? (
                myHistoryProjects.map((proj, i) => (
                  <div key={proj.id} className="flex items-center justify-between bg-white p-3 rounded border border-slate-100 shadow-sm hover:border-slate-300 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-xs font-bold text-slate-500">
                        <History className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="block text-sm font-medium text-slate-900">{proj.name}</span>
                        <span className="block text-xs text-slate-500">Ended: {new Date(proj.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <span className="block text-sm font-mono text-emerald-600 font-bold">
                        {proj.user_contribution_count * 10} pts
                      </span>
                      <span className="block text-[10px] text-slate-400 uppercase tracking-wider">
                        Pending Consensus
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-400 text-sm">
                  Scoring system not implemented yet.
                </div>
              )}
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
};

export default UserDashboard;