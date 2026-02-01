import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { MapContainer, TileLayer, Polygon, Circle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Button } from '../components/ui/Button';

const MAX_SCALE = 50;

const FitBounds = ({ polygon }) => {
  const map = useMap();
  useEffect(() => {
    if (!polygon?.length) return;
    map.fitBounds(polygon, { padding: [40, 40] });
  }, [map, polygon]);
  return null;
};

const ProjectProgressPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [subdivisions, setSubdivisions] = useState([]);
  const [annotations, setAnnotations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };

        // Fetch project data
        const projRes = await axios.get(`http://localhost:8000/projects/${projectId}`, config);
        setProject(projRes.data);

        // Fetch all subdivisions (grid)
        const subdivRes = await axios.get(
          `http://localhost:8000/projects/${projectId}/subdivisions`,
          config
        );
        setSubdivisions(subdivRes.data);

        // Fetch all annotations
        const annotRes = await axios.get(
          `http://localhost:8000/projects/${projectId}/annotations`,
          config
        );
        setAnnotations(annotRes.data || []);
      } catch (error) {
        console.error('Error fetching project progress:', error);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [projectId]);

  const polygonCoords = project?.geometry?.coordinates?.[0]?.map(([lng, lat]) => [lat, lng]);
  const subdivisionPolygons = subdivisions.map((sub) => {
    if (!sub.geometry) return null;
    const coords = sub.geometry?.coordinates?.[0]?.map(([lng, lat]) => [lat, lng]);
    return { id: sub.id, coords, completionCount: sub.completion_count };
  }).filter(Boolean);

  const avgSubtaskSize = subdivisions
    .map((sub) => sub.geometry?.coordinates?.[0])
    .filter(Boolean)
    .map((coords) => {
      const lats = coords.map((c) => c[1]);
      const lngs = coords.map((c) => c[0]);
      const width = Math.max(...lngs) - Math.min(...lngs);
      const height = Math.max(...lats) - Math.min(...lats);
      const avgLat = (Math.max(...lats) + Math.min(...lats)) / 2;
      const widthMeters = width * 111000 * Math.cos(avgLat * Math.PI / 180);
      const heightMeters = height * 111000;
      return Math.min(widthMeters, heightMeters);
    })
    .reduce((sum, size, _, arr) => sum + size / arr.length, 0);

  const scaleMultiplier = avgSubtaskSize > 0 ? avgSubtaskSize / (MAX_SCALE * 5) : 1;

  // Calculate stats
  const totalAnnotations = annotations.length;
  const uniqueUsers = new Set(annotations.map(a => a.user_id)).size;
  const completedGridSquares = subdivisions.filter(s => s.completion_count > 0).length;
  const totalGridSquares = subdivisions.length;
  const avgCompletions = subdivisions.length > 0 
    ? (subdivisions.reduce((sum, s) => sum + s.completion_count, 0) / subdivisions.length).toFixed(1)
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-slate-900">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <p className="text-slate-500">Loading project progress...</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Navbar />

      <main className="container mx-auto max-w-6xl px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">{project?.name}</h1>
            <p className="text-sm text-slate-500">Project Progress & Annotation Review</p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate('/admin')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Admin
          </Button>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-6 lg:flex-row">
          
          {/* Map */}
          <div className="flex-1 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="h-[70vh] relative z-0">
              {polygonCoords ? (
                <MapContainer
                  center={polygonCoords[0]}
                  zoom={6}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" attribution="Esri" />

                  {/* Project Boundary */}
                  <Polygon
                    positions={polygonCoords}
                    pathOptions={{ color: '#82b0ce', weight: 3, fillOpacity: 0 }}
                  />

                  {/* Annotations */}
                  {annotations.map((ann) => {
                    const coords = ann.geometry?.coordinates;
                    if (!coords) return null;
                    const scale = parseInt(ann.label_type?.split(':')[1] || 10, 10);
                    if (!Number.isFinite(scale) || scale <= 0) return null;
                    return (
                      <Circle
                        key={ann.id}
                        center={[coords[1], coords[0]]}
                        radius={scale * scaleMultiplier}
                        pathOptions={{ color: '#38bdf8', fillOpacity: 0.6, weight: 1 }}
                      />
                    );
                  })}

                  <FitBounds polygon={polygonCoords} />
                </MapContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-500">
                  No project geometry available
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Stats */}
          <aside className="w-full lg:w-80 bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Overview</h2>
            <div className="space-y-4">
              <div>
                <p className="text-base font-medium text-slate-900">Total Annotations</p>
                <p className="text-base text-slate-500">{totalAnnotations}</p>
              </div>
              <div>
                <p className="text-base font-medium text-slate-900">Contributors</p>
                <p className="text-base text-slate-500">{uniqueUsers}</p>
              </div>
              <div>
                <p className="text-base font-medium text-slate-900">Grid Squares Completed</p>
                <p className="text-base text-slate-500">
                  {completedGridSquares}/{totalGridSquares}
                </p>
              </div>
              <div>
                <p className="text-base font-medium text-slate-900">Coverage</p>
                <p className="text-base text-slate-500">
                  {totalGridSquares > 0 ? Math.round((completedGridSquares / totalGridSquares) * 100) : 0}%
                </p>
              </div>
            </div>
          </aside>

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProjectProgressPage;
