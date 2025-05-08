import * as turf from '@turf/area';

// Convert Leaflet layer to GeoJSON
export const convertToGeoJSON = (layer: any): any => {
  const geoJSON = layer.toGeoJSON();
  return geoJSON;
};

// Update the style of a GeoJSON layer
export const updateGeoJSONStyle = (geoJSON: any, style: any): any => {
  return {
    ...geoJSON,
    properties: {
      ...geoJSON.properties,
      style
    }
  };
};

// Calculate area in square kilometers
export const calculateArea = (geoJSON: any): number => {
  try {
    const area = turf.default(geoJSON);
    return Number((area / 1000000).toFixed(2)); // Convert to km² and round to 2 decimal places
  } catch (error) {
    console.error('Error calculating area:', error);
    return 0;
  }
};

// Format coordinates for display
export const formatCoordinates = (coordinates: number[]): string => {
  if (!coordinates || coordinates.length < 2) return '';
  return `${coordinates[1].toFixed(4)}, ${coordinates[0].toFixed(4)}`;
};