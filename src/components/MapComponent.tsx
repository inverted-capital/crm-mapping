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

// Component to handle map click events
const MapEventHandler = ({ onMapClick }: { onMapClick: () => void }) => {
  const map = useMap();

  useEffect(() => {
    // Add a click event handler to the map
    const handleMapClick = (e: L.LeafletMouseEvent) => {
      // We want to deselect only when clicking on the map itself,
      // not when clicking on a polygon or control
      const target = e.originalEvent.target as HTMLElement;
      const isMapClick = target.classList.contains("leaflet-container") ||
        target.classList.contains("leaflet-tile") ||
        target.parentElement?.classList.contains("leaflet-tile-container");

      if (isMapClick) {
        onMapClick();
      }
    };

    map.on("click", handleMapClick);

    // Clean up
    return () => {
      map.off("click", handleMapClick);
    };
  }, [map, onMapClick]);

  return null;
};

interface MapComponentProps {
  polygons: PolygonData[];
  selectedPolygon: string | null;
  onPolygonCreated: (polygon: Partial<PolygonData> & { geoJSON: any }) => void;
  onPolygonSelected: (id: string) => void;
}

export const MapComponent: React.FC<MapComponentProps> = ({
  polygons,
  selectedPolygon,
  onPolygonCreated,
  onPolygonSelected,
}) => {
  const hamiltonCoordinates: LatLngExpression = [-37.7870, 175.2793];
  const featureGroupRef = useRef<any>(null);
  const selectedLayerRef = useRef<any>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Convert color name to CSS color
  const getColorValue = (colorName: string = "green"): string => {
    return colorName;
  };

  // Add selected polygon to feature group for editing
  useEffect(() => {
    if (!featureGroupRef.current) return;

    // Clear any existing layers in the feature group
    featureGroupRef.current.clearLayers();

    // If a polygon is selected, add it to the feature group
    if (selectedPolygon) {
      const selectedPolygonData = polygons.find((p) =>
        p.id === selectedPolygon
      );
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
              color: getColorValue(selectedPolygonData.color),
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
    setIsCreating(true);

    try {
      const layer = e.layer;
      const geoJSON = convertToGeoJSON(layer);

      // This is for a new polygon only - edits are handled by handleEdited
      // and should never trigger this handler
      onPolygonCreated({ geoJSON });

      // Remove the created layer from the draw layer
      // It will be added to the edit layer when selected
      if (featureGroupRef.current) {
        featureGroupRef.current.removeLayer(layer);
      }
    } catch (error) {
      console.error("Error creating polygon:", error);
    } finally {
      setIsCreating(false);
    }
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
          ...polygons.find((p) => p.id === polygonId)!,
          geoJSON,
        };

        onPolygonCreated(updatedPolygon);
      }
    });
  };

  // Handle map click for deselection
  const handleMapClick = () => {
    if (selectedPolygon) {
      onPolygonSelected(selectedPolygon); // This will toggle off the selection
    }
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

      {/* Map click handler for deselection */}
      <MapEventHandler onMapClick={handleMapClick} />

      {/* Drawing tools control */}
      <FeatureGroup ref={featureGroupRef}>
        <EditControl
          position="topright"
          onCreated={handleCreated}
          onEdited={handleEdited}
          draw={{
            rectangle: false,
            circle: false,
            circlemarker: false,
            marker: false,
            polyline: false,
            polygon: { allowIntersection: false },
          }}
          edit={{
            remove: false, // Always hide delete button as deletion is handled in panel
            edit: !selectedPolygon
              ? false
              : { poly: { allowIntersection: false } },
          }}
        />
      </FeatureGroup>

      {/* Render stored polygons - excluding the selected one since it's in the feature group */}
      {polygons
        .filter((polygon) => polygon.id !== selectedPolygon)
        .map((polygon) => (
          <GeoJSON
            key={polygon.id}
            data={polygon.geoJSON}
            pathOptions={{
              color: getColorValue(polygon.color),
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
