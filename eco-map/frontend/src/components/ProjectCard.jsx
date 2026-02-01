import React, { useMemo } from 'react';
import { Map, Calendar, Layers, ArrowUpRight, ArrowRight } from 'lucide-react';
import { MapContainer, TileLayer, Polygon, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const LAYER_LABELS = {
  MODIS_Terra_CorrectedReflectance_TrueColor: 'satellite camera',
  VIIRS_SNPP_CorrectedReflectance_TrueColor: 'satellite camera',
};

const ProjectCard = ({ project, actionLabel, onAction, secondaryAction }) => {
  const polygonPoints = useMemo(() => {
    const coords = project?.geometry?.coordinates?.[0];
    if (!coords || coords.length < 3) return null;

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    coords.forEach(([lng, lat]) => {
      if (lng < minX) minX = lng;
      if (lng > maxX) maxX = lng;
      if (lat < minY) minY = lat;
      if (lat > maxY) maxY = lat;
    });

    const width = maxX - minX || 1;
    const height = maxY - minY || 1;
    const padding = 6;
    const viewSize = 100;
    const scaleX = (viewSize - padding * 2) / width;
    const scaleY = (viewSize - padding * 2) / height;
    const scale = Math.min(scaleX, scaleY);

    return coords.map(([lng, lat]) => {
      const x = (lng - minX) * scale + padding;
      const y = (maxY - lat) * scale + padding;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    }).join(' ');
  }, [project]);

  const polygonLatLng = useMemo(() => {
    const coords = project?.geometry?.coordinates?.[0];
    if (!coords || coords.length < 3) return null;
    return coords.map(([lng, lat]) => [lat, lng]);
  }, [project]);

  const FitBounds = ({ polygon }) => {
    const map = useMap();
    if (!polygon?.length) return null;
    map.fitBounds(polygon, { padding: [12, 12] });
    return null;
  };

  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md hover:border-slate-300">
      
      {/* 1. Header / Thumbnail Area */}
      <div className="aspect-video w-full bg-slate-50 relative overflow-hidden border-b border-slate-100">
        {polygonLatLng ? (
          <MapContainer
            className="absolute inset-0 h-full w-full"
            center={polygonLatLng[0]}
            zoom={6}
            zoomControl={false}
            attributionControl={false}
            dragging={false}
            doubleClickZoom={false}
            scrollWheelZoom={false}
            boxZoom={false}
            keyboard={false}
            touchZoom={false}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Polygon positions={polygonLatLng} pathOptions={{ color: '#0f172a', weight: 2, fillOpacity: 0.15 }} />
            <FitBounds polygon={polygonLatLng} />
          </MapContainer>
        ) : (
          <>
            {/* Placeholder Pattern - simulates a map grid */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]"></div>
            
            <div className="flex h-full items-center justify-center">
              <Map className="text-slate-300 stroke-1" size={48} />
            </div>
          </>
        )}

      </div>

      {/* 2. Content Body */}
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-4">
          <h3 className="text-lg font-bold tracking-tight text-slate-900 mb-2">
            {project.name}
          </h3>
          <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">
            {project.description || "No description provided for this mapping mission."}
          </p>
        </div>

        {/* Metadata Tags */}
        <div className="mt-auto flex flex-wrap gap-2 mb-6">
          <div className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600">
            <Layers size={12} className="mr-1.5 text-slate-400" />
            {LAYER_LABELS[project.nasa_layer_id] || 'satellite camera'}
          </div>
          <div className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600">
            <Calendar size={12} className="mr-1.5 text-slate-400" />
            {new Date(project.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
        </div>

        {/* 3. Action Footer */}
        <div className="grid grid-cols-[1fr_auto] gap-3 pt-4 border-t border-slate-100">
          <button 
            onClick={() => onAction(project.id)}
            className="inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:pointer-events-none disabled:opacity-50"
          >
            {actionLabel} <ArrowRight className="ml-2 h-4 w-4" />
          </button>
          
          {secondaryAction && (
             <button 
             onClick={() => secondaryAction(project)}
             className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 shadow-sm hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950"
             title="View Details"
           >
             <ArrowUpRight className="h-4 w-4" />
           </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;