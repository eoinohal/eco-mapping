import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, User as UserIcon, Map as MapIcon } from 'lucide-react';

// --- Components ---
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Button } from '../components/ui/Button';
import ProjectCard from '../components/ProjectCard'; 

const UserDashboard = () => {
  const [projects, setProjects] = useState([]);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await axios.get('http://localhost:8000/projects/');
      setProjects(res.data);
    } catch (error) {
      console.error("Failed to load projects", error);
    }
  };

  const handleStartProject = (projectId) => {
    // Navigate to the Map Workspace
    navigate(`/task/${projectId}`);
  };

  return (
    <div className="min-h-screen bg-white text-slate-950 font-sans selection:bg-slate-200">
      
      <Navbar />

      <main className="container mx-auto max-w-5xl px-6 py-12">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 pb-8 border-b border-slate-200 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
               Home
            </h1>
            <p className="text-slate-500 mt-2 text-sm leading-relaxed">
              Welcome back! Explore available mapping missions below.
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* User Badge */}
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

        {/* My missions */}
        <div className="space-y-6">
           <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
            My Active Missions
            <span className="text-xs font-normal text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
              {projects.length} Active
            </span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.length > 0 ? (
              projects.map((proj) => (
                <ProjectCard 
                  key={proj.id} 
                  project={proj} 
                  actionLabel="Start Mapping"
                  onAction={handleStartProject}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-20 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <p className="text-slate-500 mb-2">No active missions found.</p>
                <p className="text-xs text-slate-400">Please check back later or contact an administrator.</p>
              </div>
            )}
          </div>
        </div>


        {/* Available Missions */}
        <div className="space-y-6">
           <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
            Available Missions
            <span className="text-xs font-normal text-black-700 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-full">
              {projects.length} Active
            </span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.length > 0 ? (
              projects.map((proj) => (
                <ProjectCard 
                  key={proj.id} 
                  project={proj} 
                  actionLabel="Start Mapping"
                  onAction={handleStartProject}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-20 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <p className="text-slate-500 mb-2">No active missions found.</p>
                <p className="text-xs text-slate-400">Please check back later or contact an administrator.</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
           <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
            History
            <span className="text-xs font-normal text-black-700 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-full">
              {projects.length} Completed
            </span>
          </h2>
        </div>

      </main>

      <Footer />
    </div>
  );
};

export default UserDashboard;