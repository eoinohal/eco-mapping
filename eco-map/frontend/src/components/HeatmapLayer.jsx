import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';

// Color gradient function (0 → 1 mapped to blue → red)
const getHeatColor = (intensity) => {
  // intensity 0-1
  if (intensity < 0.25) {
    const t = intensity / 0.25;
    return `rgb(0, ${Math.round(t * 255)}, 255)`;
  } else if (intensity < 0.5) {
    const t = (intensity - 0.25) / 0.25;
    return `rgb(0, 255, ${Math.round(255 * (1 - t))})`;
  } else if (intensity < 0.75) {
    const t = (intensity - 0.5) / 0.25;
    return `rgb(${Math.round(t * 255)}, 255, 0)`;
  } else {
    const t = (intensity - 0.75) / 0.25;
    return `rgb(255, ${Math.round(255 * (1 - t))}, 0)`;
  }
};

const clamp01 = (value) => Math.min(1, Math.max(0, value));

const HeatmapLayer = ({ annotations, maxMagnitude, threshold }) => {
  const map = useMap();
  const layerRef = useRef(null);

  useEffect(() => {
    if (!map || !annotations.length || maxMagnitude <= 0) return;

    try {
      const renderHeatmap = () => {
        if (layerRef.current) {
          map.removeLayer(layerRef.current);
          layerRef.current = null;
        }

        const thresholdFloor = clamp01(threshold);

        // Build normalized point intensities (after threshold remap)
        const heatPoints = annotations
          .filter((a) => {
            if (!a.geometry?.coordinates || !a.label_type) return false;
            const magnitude = parseInt(a.label_type.split(':')[1] || 10, 10);
            return Number.isFinite(magnitude) && magnitude > 0;
          })
          .map((a) => {
            const [lng, lat] = a.geometry.coordinates;
            const magnitude = parseInt(a.label_type.split(':')[1] || 10, 10);
            const rawIntensity = clamp01(magnitude / maxMagnitude);
            const normalizedIntensity = thresholdFloor >= 1
              ? 0
              : clamp01((rawIntensity - thresholdFloor) / (1 - thresholdFloor));
            return {
              lat,
              lng,
              intensity: normalizedIntensity,
            };
          })
          .filter((p) => p.intensity > 0);

        if (!heatPoints.length) return;

        // Kernel density estimation on a pixel grid
        const mapSize = map.getSize();
        const cellSize = 10; 
        const gridWidth = Math.ceil(mapSize.x / cellSize);
        const gridHeight = Math.ceil(mapSize.y / cellSize);
        const grid = new Float32Array(gridWidth * gridHeight);

        const addToGrid = (gx, gy, value) => {
          if (gx < 0 || gy < 0 || gx >= gridWidth || gy >= gridHeight) return;
          grid[gy * gridWidth + gx] += value;
        };

        // Gaussian model
        heatPoints.forEach((point) => {
          const pixel = map.latLngToContainerPoint([point.lat, point.lng]);
          const baseRadius = 30;
          const radius = baseRadius + point.intensity * 60;
          const sigma = radius / 3;
          const sigma2 = sigma * sigma;

          const minX = Math.floor((pixel.x - radius) / cellSize);
          const maxX = Math.ceil((pixel.x + radius) / cellSize);
          const minY = Math.floor((pixel.y - radius) / cellSize);
          const maxY = Math.ceil((pixel.y + radius) / cellSize);

          for (let gx = minX; gx <= maxX; gx += 1) {
            for (let gy = minY; gy <= maxY; gy += 1) {
              const cx = gx * cellSize + cellSize / 2;
              const cy = gy * cellSize + cellSize / 2;
              const dx = cx - pixel.x;
              const dy = cy - pixel.y;
              const dist2 = dx * dx + dy * dy;
              if (dist2 > radius * radius) continue;
              const influence = Math.exp(-dist2 / (2 * sigma2)) * point.intensity;
              addToGrid(gx, gy, influence);
            }
          }
        });

        // Normalize the field 0..1
        let maxValue = 0;
        for (let i = 0; i < grid.length; i += 1) {
          if (grid[i] > maxValue) maxValue = grid[i];
        }
        if (maxValue <= 0) return;

        // Render the field into a single canvas layer
        const canvas = document.createElement('canvas');
        canvas.width = mapSize.x;
        canvas.height = mapSize.y;
        const ctx = canvas.getContext('2d');

        for (let gy = 0; gy < gridHeight; gy += 1) {
          for (let gx = 0; gx < gridWidth; gx += 1) {
            const value = grid[gy * gridWidth + gx] / maxValue;
            if (value <= 0) continue;
            const color = getHeatColor(value);
            const alpha = 0.1 + value * 0.8;
            ctx.fillStyle = color.replace('rgb', 'rgba').replace(')', `, ${alpha})`);
            ctx.fillRect(gx * cellSize, gy * cellSize, cellSize, cellSize);
          }
        }

        // Overlay the raster on the current map bounds
        const bounds = map.getBounds();
        const imageUrl = canvas.toDataURL('image/png');
        const heatmapLayer = L.imageOverlay(imageUrl, bounds, {
          interactive: false,
          className: 'heatmap-layer',
        }).addTo(map);

        layerRef.current = heatmapLayer;
      };

      // Re-render on move/zoom so the raster stays aligned
      renderHeatmap();

      map.on('moveend', renderHeatmap);
      map.on('zoomend', renderHeatmap);

      return () => {
        map.off('moveend', renderHeatmap);
        map.off('zoomend', renderHeatmap);
        if (layerRef.current) {
          try {
            map.removeLayer(layerRef.current);
          } catch (e) {
            console.warn('Error removing heatmap layer:', e);
          }
        }
        layerRef.current = null;
      };
    } catch (error) {
      console.error('Error rendering heatmap:', error);
    }
  }, [annotations, maxMagnitude, threshold, map]);

  return null;
};

export default HeatmapLayer;

