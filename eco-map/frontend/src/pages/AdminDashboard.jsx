import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PlusCircle, LayoutDashboard, LogOut } from 'lucide-react';

// --- Components ---
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Button } from '../components/ui/Button';
import ProjectCard from '../components/ProjectCard'; 

const AdminDashboard = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await axios.get('http://localhost:8000/projects/');
      setProjects(res.data);
    } catch (error) {
      console.error("Error fetching projects", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewProgress = (project) => {
    navigate(`/admin/projects/${project.id}/progress`);
  };

  return (
    <div className="min-h-screen bg-white text-slate-950 font-sans selection:bg-slate-200">
      
      <Navbar />

      <main className="container mx-auto max-w-5xl px-6 py-12">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 pb-8 border-b border-slate-200 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <LayoutDashboard className="w-8 h-8" /> Mission Maker Console
            </h1>
            <p className="text-slate-500 mt-2 text-sm leading-relaxed">
              Create and manage missions. 
            </p>
          </div>
          
          <Button 
            variant="ghost" 
            onClick={logout}
            className="text-slate-500 hover:text-red-600 hover:bg-red-50"
          >
            <LogOut className="w-4 h-4 mr-2" /> Logout
          </Button>
        </div>

        {/* Actions Bar */}
        <div className="mb-12">
          <Button onClick={() => navigate('/admin/create-mission')}>
            <PlusCircle className="w-4 h-4 mr-2" />
            Create New Mission
          </Button>
        </div>

        {/* Projects Grid */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
            Active Projects 
            <span className="text-xs font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
              {projects.length}
            </span>
          </h2>
          {projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((proj) => (
                <ProjectCard 
                  key={proj.id} 
                  project={proj} 
                  actionLabel="View Project Progress"
                  onAction={() => handleViewProgress(proj)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-slate-50 rounded-lg border border-slate-100 border-dashed">
              <p className="text-slate-500 text-sm">No active projects found.</p>
            </div>
          )}
        </div>

      </main>

      <Footer />
    </div>
  );
};

export default AdminDashboard;