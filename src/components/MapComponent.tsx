import React, { useEffect, useRef, useState } from "react";
import {
  FeatureGroup,
  GeoJSON,
  MapContainer as LeafletMapContainer,
  TileLayer,
  useMap,
} from "react-leaflet";
import { EditControl } from "react-leaflet-draw";
import { LatLngExpression } from "leaflet";
import { PolygonData } from "../types/mapTypes";
import { convertToGeoJSON, updateGeoJSONStyle } from "../utils/geoUtils";
import L from "leaflet";

interface MapComponentProps {
  polygons: PolygonData[];
  selectedPolygon: string | null;
  onPolygonCreated: (polygon: Partial<PolygonData> & { geoJSON: any }) => void;
  onPolygonDeleted: (id: string) => void;
  onPolygonSelected: (id: string) => void;
}

export const MapComponent: React.FC<MapComponentProps> = ({
  polygons,
  selectedPolygon,
  onPolygonCreated,
  onPolygonDeleted,
  onPolygonSelected,
}) => {
  const hamiltonCoordinates: LatLngExpression = [-37.7870, 175.2793];
  const featureGroupRef = useRef<any>(null);
  const selectedLayerRef = useRef<any>(null);

  // Add selected polygon to feature group for editing
  useEffect(() => {
    if (!featureGroupRef.current) return;
    
    // Clear any existing layers in the feature group
    featureGroupRef.current.clearLayers();
    
    // If a polygon is selected, add it to the feature group
    if (selectedPolygon) {
      const selectedPolygonData = polygons.find(p => p.id === selectedPolygon);
      if (selectedPolygonData) {
        try {
          // Create a Leaflet layer from the GeoJSON
          const layer = L.geoJSON(selectedPolygonData.geoJSON);
          
          // Extract the first layer (the polygon)
          layer.eachLayer((l: any) => {
            // Store reference to this selected layer
            selectedLayerRef.current = l;
            
            // Set polygon ID on the layer for reference
            l.options.polygonId = selectedPolygonData.id;
            
            // Set the layer style
            l.setStyle({
              color: selectedPolygonData.color || "#3388ff",
              weight: 4,
              opacity: 1,
              fillOpacity: 0.4,
            });
            
            // Add to feature group for editing
            featureGroupRef.current.addLayer(l);
          });
        } catch (error) {
          console.error("Error adding selected polygon to edit group:", error);
        }
      }
    }
  }, [selectedPolygon, polygons]);

  // Handle polygon creation from the draw control
  const handleCreated = (e: any) => {
    const layer = e.layer;
    const geoJSON = convertToGeoJSON(layer);
    
    // This is for a new polygon only - edits are handled by handleEdited
    // and should never trigger this handler
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

  const handleEdited = (e: any) => {
    const layers = e.layers;
    layers.eachLayer((layer: any) => {
      // Find the polygon ID from the layer
      const polygonId = layer.options.polygonId;
      if (polygonId) {
        // Update the polygon with the new geometry
        const geoJSON = convertToGeoJSON(layer);
        const updatedPolygon = {
          ...polygons.find(p => p.id === polygonId)!,
          geoJSON
        };
        
        onPolygonCreated(updatedPolygon);
      }
    });
  };

  return (
    <LeafletMapContainer
      center={hamiltonCoordinates}
      zoom={13}
      style={{ height: "100%", width: "100%" }}
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
          onEdited={handleEdited}
          draw={{
            circle: false,
            circlemarker: false,
            marker: false,
            polyline: false,
            polygon: { allowIntersection: false }
          }}
          edit={{
            edit: Boolean(selectedPolygon), // Show edit button only when polygon is selected
            remove: false, // Always hide delete button as deletion is handled in panel
            poly: {
              allowIntersection: false,
            },
            featureGroup: featureGroupRef.current,
          }}
        />
      </FeatureGroup>

      {/* Render stored polygons - excluding the selected one since it's in the feature group */}
      {polygons
        .filter(polygon => polygon.id !== selectedPolygon)
        .map((polygon) => (
          <GeoJSON
            key={polygon.id}
            data={polygon.geoJSON}
            pathOptions={{
              color: polygon.color || "#3388ff",
              weight: 2,
              opacity: 0.8,
              fillOpacity: 0.2,
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