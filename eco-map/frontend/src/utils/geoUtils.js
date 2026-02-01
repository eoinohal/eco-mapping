// Helper to create a box around a center point
export const createSquareFromPoint = (lat, lon, sizeInMeters = 50) => {
  // Rough approximation: 1 degree lat ~= 111,320 meters
  const metersPerDeg = 111320;
  
  const offset = (sizeInMeters / 2) / metersPerDeg;
  
  // Adjust longitude for latitude shrinking 
  const cosLat = Math.cos(lat * (Math.PI / 180));
  const offsetLon = offset / cosLat;

  const minX = lon - offsetLon;
  const maxX = lon + offsetLon;
  const minY = lat - offset;
  const maxY = lat + offset;

  // Return WKT Polygon format: POLYGON((x1 y1, x2 y2, ...))
  return `POLYGON((${minX} ${minY}, ${maxX} ${minY}, ${maxX} ${maxY}, ${minX} ${maxY}, ${minX} ${minY}))`;
};
