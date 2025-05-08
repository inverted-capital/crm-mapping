import React, { useRef, useEffect, useState } from 'react';
import { MapContainer as LeafletMapContainer, TileLayer, FeatureGroup, GeoJSON } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import { LatLngExpression } from 'leaflet';
import { PolygonData } from '../types/mapTypes';
import { convertToGeoJSON, updateGeoJSONStyle } from '../utils/geoUtils';

interface MapComponentProps {
  polygons: PolygonData[];
  selectedPolygon: string | null;
  onPolygonCreated: (polygon: PolygonData) => void;
  onPolygonDeleted: (id: string) => void;
  onPolygonSelected: (id: string) => void;
}

export const MapComponent: React.FC<MapComponentProps> = ({
  polygons,
  selectedPolygon,
  onPolygonCreated,
  onPolygonDeleted,
  onPolygonSelected
}) => {
  const hamiltonCoordinates: LatLngExpression = [-37.7870, 175.2793];
  const featureGroupRef = useRef<any>(null);
  const [map, setMap] = useState<L.Map | null>(null);

  // Handle polygon creation from the draw control
  const handleCreated = (e: any) => {
    const layer = e.layer;
    const geoJSON = convertToGeoJSON(layer);
    onPolygonCreated({ geoJSON });
  };

  const handleDeleted = (e: any) => {
    const layers = e.layers;
    layers.eachLayer((layer: any) => {
      // Find the polygon ID from the layer
      const polygonId = layer.options.polygonId;
      if (polygonId) {
        onPolygonDeleted(polygonId);
      }
    });
  };

  useEffect(() => {
    if (map) {
      map.invalidateSize();
    }
  }, [map]);

  return (
    <LeafletMapContainer 
      center={hamiltonCoordinates} 
      zoom={13} 
      style={{ height: '100%', width: '100%' }}
      whenReady={(mapInstance) => setMap(mapInstance.target)}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {/* Drawing tools control */}
      <FeatureGroup ref={featureGroupRef}>
        <EditControl
          position="topright"
          onCreated={handleCreated}
          onDeleted={handleDeleted}
          draw={{
            rectangle: false,
            circle: false,
            circlemarker: false,
            marker: false,
            polyline: false,
          }}
        />
      </FeatureGroup>

      {/* Render stored polygons */}
      {polygons.map((polygon) => (
        <GeoJSON
          key={polygon.id}
          data={polygon.geoJSON}
          pathOptions={{
            color: polygon.color || '#3388ff',
            weight: selectedPolygon === polygon.id ? 4 : 2,
            opacity: selectedPolygon === polygon.id ? 1 : 0.8,
            fillOpacity: selectedPolygon === polygon.id ? 0.4 : 0.2,
          }}
          eventHandlers={{
            click: () => onPolygonSelected(polygon.id),
          }}
          onEachFeature={(feature, layer) => {
            // Store polygon ID in the layer options for reference
            (layer as any).options.polygonId = polygon.id;
          }}
        />
      ))}
    </LeafletMapContainer>
  );
};