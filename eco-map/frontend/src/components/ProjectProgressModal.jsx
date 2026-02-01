import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { X } from 'lucide-react';
import { MapContainer, TileLayer, Polygon, CircleMarker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from './ui/Button';

const FitBounds = ({ polygon }) => {
  const map = useMap();
  useEffect(() => {
    if (!polygon?.length) return;
    map.fitBounds(polygon, { padding: [40, 40] });
  }, [map, polygon]);
  return null;
};

const ProjectProgressModal = ({ projectId, projectName, onClose, isOpen = true }) => {
  const [polygon, setPolygon] = useState(null);
  const [annotations, setAnnotations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    const fetch = async () => {
      try {
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };

        // Fetch project boundary geometry
        const projRes = await axios.get(`http://localhost:8000/projects/${projectId}`, config);
        const coords = projRes.data?.geometry?.coordinates?.[0];
        if (coords) {
          setPolygon(coords.map(([lng, lat]) => [lat, lng]));
        }

        // Fetch all annotations for this project
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
  }, [projectId, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{projectName}</h2>
            <p className="text-sm text-slate-500">Project Progress Map</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-grow overflow-hidden flex flex-col">
          {loading ? (
            <div className="flex items-center justify-center h-full text-slate-500">
              Loading project data...
            </div>
          ) : polygon ? (
            <div className="flex-grow">
              <MapContainer
                center={polygon[0]}
                zoom={6}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Polygon
                  positions={polygon}
                  pathOptions={{ color: '#210f2a', weight: 3, fillOpacity: 0.1 }}
                />
                {annotations.map((ann) => {
                  const coords = ann.geometry?.coordinates;
                  if (!coords) return null;
                  const scale = parseInt(ann.label_type?.split(':')[1] || 10, 10);
                  return (
                    <CircleMarker
                      key={ann.id}
                      center={[coords[1], coords[0]]}
                      radius={Math.max(3, scale / 10)}
                      pathOptions={{ color: '#38bdf8', fillOpacity: 0.6 }}
                    />
                  );
                })}
                <FitBounds polygon={polygon} />
              </MapContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-500">
              No project geometry available
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 flex items-center justify-between">
          <div className="text-sm text-slate-600">
            <strong>{annotations.length}</strong> annotations found
          </div>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
};

export default ProjectProgressModal;
