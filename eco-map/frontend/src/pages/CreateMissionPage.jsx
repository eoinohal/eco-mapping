import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Upload, Map as MapIcon, FileText, CheckCircle, AlertCircle, ArrowLeft, Grid3X3, ArrowRight } from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Button } from '../components/ui/Button';
import { createSquareFromPoint } from '../utils/geoUtils'; 

// Map Imports
import { MapContainer, TileLayer, Polygon, Rectangle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import L from 'leaflet';
import 'leaflet-draw'; 

// Leaflet Icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// --- Parse WKT to Bounds ---
const getBoundsFromWKT = (wkt) => {
  if (!wkt) return null;
  const matches = wkt.match(/-?\d+\.\d+\s-?\d+\.\d+/g);
  if (!matches) return null;

  let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;

  matches.forEach(pair => {
    const [lng, lat] = pair.split(' ').map(Number);
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
  });

  return { minLat, maxLat, minLng, maxLng };
};

// --- Draw Controller ---
const DrawController = ({ onShapeCreated, onShapeDeleted }) => {
  const map = useMap();
  const featureGroupRef = useRef(new L.FeatureGroup());

  useEffect(() => {
    map.addLayer(featureGroupRef.current);
    const drawControl = new L.Control.Draw({
      edit: { featureGroup: featureGroupRef.current, remove: true, edit: false },
      draw: {
        rectangle: false, circle: false, circlemarker: false, marker: false, polyline: false,
        polygon: {
          allowIntersection: false, showArea: true,
          shapeOptions: { color: '#aa0e0e', weight: 3, fillOpacity: 0.2 }
        }
      }
    });
    map.addControl(drawControl);

    const handleCreated = (e) => {
      featureGroupRef.current.clearLayers();
      featureGroupRef.current.addLayer(e.layer);
      
      const latlngs = e.layer.getLatLngs()[0];
      const coordsString = latlngs.map(ll => `${ll.lng} ${ll.lat}`).join(', ');
      const first = latlngs[0];
      const wkt = `POLYGON((${coordsString}, ${first.lng} ${first.lat}))`;
      onShapeCreated(wkt);
    };

    const handleDeleted = () => onShapeDeleted();

    map.on(L.Draw.Event.CREATED, handleCreated);
    map.on(L.Draw.Event.DELETED, handleDeleted);

    return () => {
      map.removeControl(drawControl);
      map.off(L.Draw.Event.CREATED, handleCreated);
      map.off(L.Draw.Event.DELETED, handleDeleted);
      map.removeLayer(featureGroupRef.current);
    };
  }, [map, onShapeCreated, onShapeDeleted]);

  return null;
};

// --- Point in Polygon (Ray Casting) ---
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

const GridPreviewLayer = ({ wkt, rows, cols }) => {
  const map = useMap();
  
  // Parse Polygon for visual boundary and intersection math
  const polygonPositions = useMemo(() => {
    if (!wkt) return null;
    const matches = wkt.match(/-?\d+\.\d+\s-?\d+\.\d+/g);
    return matches ? matches.map(p => {
      const [lng, lat] = p.split(' ').map(Number);
      return [lat, lng]; 
    }) : null;
  }, [wkt]);

  // Fit map to bounds
  useEffect(() => {
    if (wkt) {
      const b = getBoundsFromWKT(wkt);
      if (b) map.fitBounds([[b.minLat, b.minLng], [b.maxLat, b.maxLng]], { padding: [50, 50] });
    }
  }, [wkt, map]);

  // Calculate & Filter Grid Cells
  const filteredCells = useMemo(() => {
    const bounds = getBoundsFromWKT(wkt);
    if (!bounds || !polygonPositions) return [];

    const { minLat, maxLat, minLng, maxLng } = bounds;
    const stepX = (maxLng - minLng) / cols;
    const stepY = (maxLat - minLat) / rows;

    const gridCells = [];
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const cMinLng = minLng + (i * stepX);
        const cMinLat = minLat + (j * stepY);
        const cMaxLng = minLng + ((i + 1) * stepX);
        const cMaxLat = minLat + ((j + 1) * stepY);
        const center = [cMinLat + (stepY / 2), cMinLng + (stepX / 2)];

        // Intersection logic
        if (isPointInPoly(center, polygonPositions)) {
          gridCells.push([[cMinLat, cMinLng], [cMaxLat, cMaxLng]]);
        }
      }
    }
    return gridCells;
  }, [wkt, rows, cols, polygonPositions]);

  return (
    <>
      {polygonPositions && (
        <Polygon positions={polygonPositions} pathOptions={{ color: '#cb1a1a', fillOpacity: 0.1, weight: 3 }} />
      )}
      
      {filteredCells.map((bounds, idx) => (
        <Rectangle 
          key={idx} 
          bounds={bounds} 
          pathOptions={{ color: '#3b82f6', weight: 1, fillOpacity: 0.1, dashArray: '4' }} 
        />
      ))}
    </>
  );
};

// --- MAIN PAGE ---
const CreateMissionPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('EXPLORE'); 
  
  // Form Data
  const [formData, setFormData] = useState({
    name: '', description: '', nasa_layer_id: 'MODIS_Terra_CorrectedReflectance_TrueColor',
    date_target: new Date().toISOString().split('T')[0], boundary_geom: '', 
  });

  // New Grid State
  const [gridConfig, setGridConfig] = useState({ rows: 5, cols: 5 });

  const [csvTasks, setCsvTasks] = useState([]);
  const [mapError, setMapError] = useState('');

  // Handlers
  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  
  const handleShapeCreated = useCallback((wkt) => {
    setFormData(prev => ({ ...prev, boundary_geom: wkt }));
    setMapError('');
  }, []);

  const handleShapeDeleted = useCallback(() => {
    setFormData(prev => ({ ...prev, boundary_geom: '' }));
  }, []);

  const handleNextStep = () => {
    if (step === 3) {
      if (!formData.boundary_geom) {
        setMapError("Please define a region first.");
        return;
      }
      if (mode === 'EXPLORE') {
        setStep(4);
        return;
      }
    }
    setStep(prev => prev + 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      // Create Project
      const projectRes = await axios.post('http://localhost:8000/projects/', {
        ...formData,
        date_target: new Date(formData.date_target).toISOString(),
      }, config);
      
      const projectId = projectRes.data.id;

      // Generate Subdivisions
      if (mode === 'EXPLORE') {
        // Send the slider values from Step 4
        await axios.post(`http://localhost:8000/projects/${projectId}/generate-grid`, {
          rows: gridConfig.rows, 
          cols: gridConfig.cols
        }, config);
      } else if (mode === 'VALIDATE') {
        await axios.post(`http://localhost:8000/projects/${projectId}/tasks/batch`, {
          tasks: csvTasks
        }, config);
      }

      navigate('/admin');
    } catch (error) {
      console.error(error);
      alert("Failed to create mission.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <Navbar />
      <main className="container mx-auto max-w-6xl px-6 py-8">
        
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/admin')}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Cancel
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Launch New Mission</h1>
        </div>

        {/* Wizard Container */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[80vh]">
          
          <div className="h-1 w-full bg-slate-100 flex-shrink-0">
            <div 
              className="h-full bg-blue-600 transition-all duration-500 ease-in-out" 
              style={{ width: `${(step / (mode === 'EXPLORE' ? 4 : 3)) * 100}%` }}
            />
          </div>

          <div className="flex-grow flex flex-col p-8 overflow-y-auto">
            
            {/* DETAILS */}
            {step === 1 && (
              <div className="max-w-2xl mx-auto w-full space-y-6 animate-in fade-in slide-in-from-bottom-2">
                <div className="space-y-4">
                   <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Mission Name</label>
                      <input name="name" className="w-full border border-slate-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Amazon Sector 7 Alpha" onChange={handleInputChange} autoFocus />
                   </div>
                   <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Briefing / Description</label>
                      <textarea name="description" className="w-full border border-slate-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" rows="3" placeholder="Describe the goal..." onChange={handleInputChange} />
                   </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                   <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Satellite Layer</label>
                      <select name="nasa_layer_id" className="w-full border border-slate-300 p-3 rounded-lg bg-white" onChange={handleInputChange}>
                        <option value="MODIS_Terra_CorrectedReflectance_TrueColor">MODIS Terra (Standard)</option>
                        <option value="VIIRS_SNPP_CorrectedReflectance_TrueColor">VIIRS SNPP (High Res)</option>
                      </select>
                   </div>
                   <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Target Date</label>
                      <input type="date" name="date_target" className="w-full border border-slate-300 p-3 rounded-lg" value={formData.date_target} onChange={handleInputChange} />
                   </div>
                </div>
                <div className="flex justify-end pt-6">
                  <Button onClick={() => setStep(2)}>Next: Strategy &rarr;</Button>
                </div>
              </div>
            )}

            {/* MODE */}
            {step === 2 && (
              <div className="max-w-3xl mx-auto w-full space-y-8 animate-in fade-in slide-in-from-right-4">
                <div className="text-center">
                  <h2 className="text-xl font-bold mb-2">Select Mission Strategy</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <button onClick={() => setMode('EXPLORE')} className={`p-8 border-2 rounded-xl text-left transition-all ${mode === 'EXPLORE' ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-slate-200 hover:border-blue-300'}`}>
                    <div className="bg-blue-100 w-14 h-14 rounded-full flex items-center justify-center mb-6"><MapIcon className="w-7 h-7 text-blue-600" /></div>
                    <div className="font-bold text-lg text-slate-800">Create Dataset</div>
                    <p className="text-sm text-slate-500 mt-2">Define project area.</p>
                  </button>
                  {/* onClick={() => setMode('VALIDATE')} to add back */}
                  <button className={`p-8 border-2 rounded-xl text-left transition-all ${mode === 'VALIDATE' ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500' : 'border-slate-200 hover:border-emerald-300'}`}>
                     <div className="bg-emerald-100 w-14 h-14 rounded-full flex items-center justify-center mb-6"><FileText className="w-7 h-7 text-emerald-600" /></div>
                    <div className="font-bold text-lg text-slate-800">Validate Dataset</div>
                    <p className="text-sm text-slate-500 mt-2">Not yet implemented.</p>
                  </button>
                </div>
                <div className="flex justify-between pt-6 border-t border-slate-100">
                  <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
                  <Button onClick={() => setStep(3)}>Next: Region &rarr;</Button>
                </div>
              </div>
            )}

            {/* REGION DEFINITION */}
            {step === 3 && (
              <div className="h-full flex flex-col animate-in fade-in slide-in-from-right-4">
                <div className="flex justify-between items-end mb-4 flex-shrink-0">
                   <div>
                     <h2 className="text-xl font-bold">Define Region</h2>
                     <p className="text-slate-500 text-sm">
                        {mode === 'EXPLORE' ? 'Draw the bounding polygon.' : 'Upload your coordinates file.'}
                     </p>
                   </div>
                   <div className="flex gap-3">
                      <Button variant="ghost" onClick={() => setStep(2)}>Back</Button>
                      
                      {mode === 'EXPLORE' ? (
                        <Button onClick={handleNextStep}>Next: Grid Setup &rarr;</Button>
                      ) : (
                        <Button 
                          onClick={handleSubmit} 
                          disabled={loading || csvTasks.length === 0}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white w-40"
                        >
                          {loading ? 'Launching...' : 'Launch Mission'}
                        </Button>
                      )}
                   </div>
                </div>

                {/* Map (Draw Mode) */}
                {mode === 'EXPLORE' && (
                   <div className="flex-grow w-full rounded-lg overflow-hidden border border-slate-300 relative shadow-inner z-0">
                      <MapContainer center={[-8.7, -62.7]} zoom={6} style={{ height: '100%', width: '100%' }}>
                        <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" attribution="Esri" />
                        <DrawController onShapeCreated={handleShapeCreated} onShapeDeleted={handleShapeDeleted} />
                      </MapContainer>
                      {!formData.boundary_geom && (
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow-lg z-[1000] border border-blue-200">
                           <span className="text-sm font-medium text-blue-900">Use Polygon tool to draw area</span>
                        </div>
                      )}
                   </div>
                )}

                {/* Upload (Validation Mode) */}
                {mode === 'VALIDATE' && (
                   <div className="flex-grow flex flex-col items-center justify-center bg-slate-50 rounded-xl border-2 border-dashed border-slate-300">
                      <Upload className="w-16 h-16 text-slate-300 mb-4" />
                      <h4 className="text-lg font-bold text-slate-700">Upload CSV</h4>
                      <input type="file" accept=".csv" onChange={handleFileUpload} className="mt-4 block w-full max-w-xs text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:bg-emerald-600 file:text-white" />
                      {csvTasks.length > 0 && <div className="mt-4 text-emerald-600 font-bold">Loaded {csvTasks.length} points</div>}
                   </div>
                )}
                {mapError && <div className="mt-4 text-red-600 bg-red-50 p-3 rounded">{mapError}</div>}
              </div>
            )}

            {/* GRID CONFIGURATION (Explore Only) */}
            {step === 4 && mode === 'EXPLORE' && (
              <div className="h-full flex flex-row gap-6 animate-in fade-in slide-in-from-right-4">
                
                {/* Left: Map Preview */}
                <div className="flex-grow rounded-lg overflow-hidden border border-slate-300 relative shadow-inner z-0">
                  <MapContainer zoom={6} center={[-8.7, -62.7]} style={{ height: '100%', width: '100%' }}>
                     <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" attribution="Esri" />
                     <GridPreviewLayer 
                        wkt={formData.boundary_geom} 
                        rows={gridConfig.rows} 
                        cols={gridConfig.cols} 
                     />
                  </MapContainer>
                </div>

                {/* Right: Controls */}
                <div className="w-80 flex-shrink-0 flex flex-col justify-between">
                   <div className="space-y-8">
                      <div>
                        <h2 className="text-xl font-bold mb-1">Grid Configuration</h2>
                        <p className="text-slate-500 text-sm">Subdivide the area into manageable tasks.</p>
                      </div>

                      <div className="space-y-6">
                        {/* Rows Slider */}
                        <div>
                          <div className="flex justify-between mb-2">
                             <label className="text-sm font-bold text-slate-700">Rows (Latitude)</label>
                             <span className="text-sm font-mono bg-slate-100 px-2 rounded">{gridConfig.rows}</span>
                          </div>
                          <input 
                            type="range" min="1" max="30" step="1" 
                            value={gridConfig.rows}
                            onChange={(e) => setGridConfig(p => ({...p, rows: parseInt(e.target.value)}))}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                          />
                        </div>

                        {/* Cols Slider */}
                        <div>
                           <div className="flex justify-between mb-2">
                             <label className="text-sm font-bold text-slate-700">Columns (Longitude)</label>
                             <span className="text-sm font-mono bg-slate-100 px-2 rounded">{gridConfig.cols}</span>
                          </div>
                          <input 
                            type="range" min="1" max="30" step="1" 
                            value={gridConfig.cols}
                            onChange={(e) => setGridConfig(p => ({...p, cols: parseInt(e.target.value)}))}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                          />
                        </div>

                        {/* Stats Box */}
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                           <div className="flex items-center gap-3 mb-2">
                              <Grid3X3 className="w-5 h-5 text-blue-600" />
                              <span className="font-bold text-blue-900">Estimation</span>
                           </div>
                           <p className="text-sm text-blue-800">
                             Total sub missions: <b>{gridConfig.rows * gridConfig.cols}</b>
                           </p>
                        </div>
                      </div>
                   </div>

                   <div className="space-y-3 pt-6 border-t border-slate-100">
                      <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSubmit} disabled={loading}>
                        {loading ? 'Processing...' : 'Launch Mission'}
                      </Button>
                      <Button variant="ghost" className="w-full" onClick={() => setStep(3)}>Back to Drawing</Button>
                   </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CreateMissionPage;