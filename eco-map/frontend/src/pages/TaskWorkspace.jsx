import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronDown, ChevronUp, MapPin } from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Button } from '../components/ui/Button';
import { MapContainer, TileLayer, Polygon, Circle, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const MIN_SCALE = 5;
const MAX_SCALE = 50;
const MAX_ANNOTATIONS = 5;

const isPointInPoly = (point, vs) => {
  const x = point[0], y = point[1];
  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const xi = vs[i][0], yi = vs[i][1];
    const xj = vs[j][0], yj = vs[j][1];
    const intersect = ((yi > y) !== (yj > y)) &&
        (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
};

const FitBounds = ({ polygon }) => {
  const map = useMap();
  useEffect(() => {
    if (!polygon?.length) return;
    map.fitBounds(polygon, { padding: [40, 40] });
  }, [map, polygon]);
  return null;
};

const MaskLayer = ({ polygon }) => {
  if (!polygon?.length) return null;
  const world = [
    [90, -180],
    [90, 180],
    [-90, 180],
    [-90, -180],
  ];
  return (
    <Polygon
      positions={[world, polygon]}
      pathOptions={{
        stroke: false,
        fillColor: '#0f172a',
        fillOpacity: 0.45,
      }}
    />
  );
};

const ClickToAnnotate = ({ onCreate }) => {
  useMapEvents({
    click: (e) => onCreate(e.latlng),
  });
  return null;
};

const TaskWorkspace = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [progress, setProgress] = useState(null);
  const [task, setTask] = useState(null);
  const [annotations, setAnnotations] = useState([]);
  const [scale, setScale] = useState(20);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [detailsOpen, setDetailsOpen] = useState(true);

  const polygon = useMemo(() => {
    const coords = task?.geometry?.coordinates?.[0];
    if (!coords) return null;
    return coords.map(([lng, lat]) => [lat, lng]);
  }, [task]);

  // Calculate task dimensions to scale circle radius appropriately
  const taskScale = useMemo(() => {
    if (!polygon || polygon.length < 2) return 1;
    
    // Calculate rough width in degrees (longitude)
    const lngs = polygon.map(p => p[1]);
    const lats = polygon.map(p => p[0]);
    const width = Math.max(...lngs) - Math.min(...lngs);
    const height = Math.max(...lats) - Math.min(...lats);
    
    // Convert to approximate meters (at equator: 1 degree ≈ 111km)
    const avgLat = (Math.max(...lats) + Math.min(...lats)) / 2;
    const widthMeters = width * 111000 * Math.cos(avgLat * Math.PI / 180);
    const heightMeters = height * 111000;
    
    // Use the smaller dimension and scale to reasonable circle size
    const taskSize = Math.min(widthMeters, heightMeters);
    // Scale: make max slider value produce a circle about 1/5th of task size
    return taskSize / (MAX_SCALE * 5);
  }, [polygon]);

  const fetchProject = useCallback(async () => {
    const token = localStorage.getItem('token');
    const config = { headers: { Authorization: `Bearer ${token}` } };
    const res = await axios.get(`http://localhost:8000/projects/${projectId}`, config);
    setProject(res.data);
  }, [projectId]);

  const fetchProgress = useCallback(async () => {
    const token = localStorage.getItem('token');
    const config = { headers: { Authorization: `Bearer ${token}` } };
    const res = await axios.get(`http://localhost:8000/projects/${projectId}/progress`, config);
    setProgress(res.data);
  }, [projectId]);

  const fetchNextTask = useCallback(async () => {
    setError('');
    const token = localStorage.getItem('token');
    const config = { headers: { Authorization: `Bearer ${token}` } };
    try {
      const res = await axios.get(`http://localhost:8000/projects/${projectId}/tasks/next`, config);
      setTask(res.data);
      setAnnotations([]);
    } catch (err) {
      setTask(null);
      setError(err?.response?.data?.detail || 'No available tasks.');
    }
  }, [projectId]);

  useEffect(() => {
    fetchProject();
    fetchProgress();
    fetchNextTask();
  }, [fetchProject, fetchProgress, fetchNextTask]);

  const handleCreateAnnotation = (latlng) => {
    if (!polygon) return;
    const point = [latlng.lat, latlng.lng];
    if (!isPointInPoly(point, polygon)) {
      setError('Annotation must be inside the task boundary.');
      return;
    }
    if (annotations.length >= MAX_ANNOTATIONS) {
      setError(`Max ${MAX_ANNOTATIONS} circles per task.`);
      return;
    }
    setError('');
    setAnnotations(prev => [...prev, { lat: latlng.lat, lng: latlng.lng, scale }]);
  };

  const handleSubmit = async () => {
    if (!task) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      // If no annotations, submit a single point with magnitude 0 to signal "no point found"
      const submissionData = annotations.length > 0 
        ? annotations.map(a => ({
            geom: `POINT(${a.lng} ${a.lat})`,
            label_type: `circle:${a.scale}`
          }))
        : [{
            geom: `POINT(${polygon[0][1]} ${polygon[0][0]})`, // Use first point of task boundary
            label_type: `circle:0`
          }];
      
      await axios.post('http://localhost:8000/annotations/batch', {
        project_id: parseInt(projectId, 10),
        subdivision_id: task.id,
        annotations: submissionData
      }, config);
      await fetchProgress();
      await fetchNextTask();
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to submit annotation.');
    } finally {
      setLoading(false);
    }
  };

  const handleUndo = () => {
    setAnnotations(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setAnnotations([]);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Navbar />
      <main className="container mx-auto max-w-6xl px-6 py-8">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Task Workspace</h1>
            <p className="text-sm text-slate-500">Complete tasks or leave anytime.</p>
          </div>
          <Button variant="outline" onClick={() => navigate('/dashboard')}>Leave Project</Button>
        </div>
        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="flex-1 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="h-[70vh] relative z-0">
              <MapContainer center={[-8.7, -62.7]} zoom={6} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" attribution="Esri" />
                <MaskLayer polygon={polygon} />
                {polygon && (
                  <Polygon positions={polygon} pathOptions={{ color: '#82b0ce', weight: 3, fillOpacity: 0.08 }} />
                )}
                {annotations.map((a, idx) => (
                  <Circle
                    key={idx}
                    center={[a.lat, a.lng]}
                    radius={a.scale * taskScale}
                    pathOptions={{ color: '#38bdf8', fillOpacity: 0.2 }}
                  />
                ))}
                <FitBounds polygon={polygon} />
                <ClickToAnnotate onCreate={handleCreateAnnotation} />
              </MapContainer>
            </div>
            <div className="flex flex-wrap items-center gap-4 px-5 py-4 border-t border-slate-200">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <MapPin className="w-4 h-4" />
                Click inside the highlighted boundary to place a circle.
              </div>
              <div className="flex items-center gap-3 ml-auto">
                <label className="text-sm text-slate-600">Scale</label>
                <input
                  type="range"
                  min={MIN_SCALE}
                  max={MAX_SCALE}
                  value={scale}
                  onChange={(e) => setScale(parseInt(e.target.value, 10))}
                  className="w-40 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-500"
                />
                <span className="text-sm font-mono bg-slate-100 px-2 py-1 rounded">{scale}</span>
                <span className="text-sm text-slate-600">{annotations.length}/{MAX_ANNOTATIONS}</span>
                <Button variant="outline" onClick={handleUndo} disabled={!annotations.length}>Undo</Button>
                <Button variant="outline" onClick={handleClear} disabled={!annotations.length}>Clear</Button>
                <Button onClick={handleSubmit} disabled={loading || !task}>
                  {loading ? 'Submitting...' : 'Submit & Next'}
                </Button>
              </div>
            </div>
            {error && (
              <div className="px-5 pb-4 text-sm text-red-600">
                {error}
              </div>
            )}
          </div>

          <aside className="w-full lg:w-80 bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <button
              className="w-full flex items-center justify-between text-left"
              onClick={() => setDetailsOpen(p => !p)}
            >
              <div>
                <h2 className="text-lg font-semibold">Project Details</h2>
                <p className="text-xs text-slate-500">Task #{task?.id || '—'}</p>
              </div>
              {detailsOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>

            {detailsOpen && (
              <div className="mt-4 space-y-4">
                <div>
                  <p className="text-sm text-slate-500">Name</p>
                  <p className="font-semibold">{project?.name || 'Loading...'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Description</p>
                  <p className="text-sm text-slate-700">{project?.description || '—'}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                  <p className="text-sm text-slate-500 mb-2">Progress</p>
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                      <span>Your completed</span>
                      <span>{progress?.user_completed ?? 0}/{progress?.total_subtasks ?? 0}</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={progress?.total_subtasks ?? 0}
                      value={progress?.user_completed ?? 0}
                      readOnly
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-default accent-sky-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TaskWorkspace;
