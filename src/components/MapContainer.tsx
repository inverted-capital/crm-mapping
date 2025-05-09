import React, { useEffect, useState } from "react";
import { MapComponent } from "./MapComponent";
import { PolygonPanel } from "./PolygonPanel";
import { PolygonData, PolygonInfo } from "../types/mapTypes";
import { calculateArea } from "../utils/geoUtils";
import sectors from "../../sectors.ts";

const sectorPolygons: PolygonData[] = sectors.list.map((
  s: any,
  idx: number,
) => ({
  id: `sector-${idx}`,
  name: s.name,
  color: s.color,
  frequencyInDays: s.frequencyInDays || 0,
  frequencyOffset: s.frequencyOffset || 0,
  geoJSON: s.geometry,
}));

export const MapContainer: React.FC = () => {
  const [polygons, setPolygons] = useState<PolygonData[]>(() => {
    const saved = localStorage.getItem("hamiltonMapPolygons");
    if (saved) {
      try {
        const parsedData = JSON.parse(saved);
        if (Array.isArray(parsedData) && parsedData.length > 0) {
          return parsedData;
        }
      } catch {
        /* ignored */
      }
    }
    return sectorPolygons;
  });

  const [selectedPolygon, setSelectedPolygon] = useState<string | null>(null);
  const [newlyCreatedPolygon, setNewlyCreatedPolygon] = useState<string | null>(null);

  const handlePolygonCreated = (polygonData: Partial<PolygonData> & { geoJSON: any }) => {
    // Check if this is an update to an existing polygon
    if (polygonData.id) {
      // Update existing polygon
      setPolygons(prevPolygons => 
        prevPolygons.map(p => 
          p.id === polygonData.id 
            ? { ...p, geoJSON: polygonData.geoJSON } 
            : p
        )
      );
      return; // Important: return early to avoid creating duplicate polygons
    }
    
    // Create new polygon with a unique ID
    const newPolygonId = `polygon-${Date.now()}`;
    const newPolygon = {
      ...polygonData,
      id: newPolygonId,
      name: `Polygon ${polygons.length + 1}`,
      color: randomColor(),
      frequencyInDays: 7, // Default values
      frequencyOffset: 0,
    } as PolygonData;
    
    // First add the new polygon
    setPolygons(prev => [...prev, newPolygon]);
    
    // Then set it as selected (after it exists in state)
    // We need to use a callback to ensure this happens after the polygon is added
    setTimeout(() => {
      setSelectedPolygon(newPolygonId);
      setNewlyCreatedPolygon(newPolygonId);
    }, 0);
  };

  const randomColor = (): string => {
    const colors = [
      "red",
      "orange",
      "yellow",
      "cyan",
      "purple",
      "violet",
      "pink",
      "green",
      "black"
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const handlePolygonSelected = (id: string) => {
    setSelectedPolygon(id === selectedPolygon ? null : id);
    // Reset newly created flag when selection changes
    if (id !== newlyCreatedPolygon) {
      setNewlyCreatedPolygon(null);
    }
  };

  const handlePolygonDeleted = (id: string) => {
    setPolygons(polygons.filter((p) => p.id !== id));
    if (selectedPolygon === id) setSelectedPolygon(null);
    if (newlyCreatedPolygon === id) setNewlyCreatedPolygon(null);
  };

  const handleNameChange = (id: string, name: string) => {
    setPolygons(polygons.map((p) => (p.id === id ? { ...p, name } : p)));
    // Reset newly created flag after name is changed
    if (newlyCreatedPolygon === id) {
      setNewlyCreatedPolygon(null);
    }
  };

  const handleColorChange = (id: string, color: string) => {
    setPolygons(polygons.map((p) => (p.id === id ? { ...p, color } : p)));
  };

  const handleFrequencyChange = (id: string, field: 'frequencyInDays' | 'frequencyOffset', value: number) => {
    setPolygons(polygons.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };

  const handleResetToOriginal = () => {
    if (window.confirm("Are you sure you want to reset the map to the original state? All your changes will be lost.")) {
      localStorage.removeItem("hamiltonMapPolygons");
      setPolygons(sectorPolygons);
      setSelectedPolygon(null);
      setNewlyCreatedPolygon(null);
    }
  };

  const selectedInfo: PolygonInfo | null = selectedPolygon
    ? (() => {
      const p = polygons.find((x) => x.id === selectedPolygon);
      if (!p) return null;
      return {
        id: p.id,
        name: p.name,
        area: calculateArea(p.geoJSON),
        coordinates: p.geoJSON.geometry.coordinates,
        color: p.color,
        frequencyInDays: p.frequencyInDays,
        frequencyOffset: p.frequencyOffset,
      };
    })()
    : null;

  useEffect(() => {
    localStorage.setItem("hamiltonMapPolygons", JSON.stringify(polygons));
  }, [polygons]);

  return (
    <div className="flex flex-col md:flex-row flex-grow h-[calc(100vh-4rem)] overflow-hidden">
      <div className="w-full md:w-3/4 h-[70vh] md:h-full">
        <MapComponent
          polygons={polygons}
          onPolygonCreated={handlePolygonCreated}
          onPolygonDeleted={handlePolygonDeleted}
          selectedPolygon={selectedPolygon}
          onPolygonSelected={handlePolygonSelected}
        />
      </div>
      <div className="w-full md:w-1/4 bg-white border-l border-slate-200 overflow-y-auto">
        <PolygonPanel
          polygons={polygons}
          selectedPolygon={selectedInfo}
          onPolygonSelected={handlePolygonSelected}
          onPolygonDeleted={handlePolygonDeleted}
          onNameChange={handleNameChange}
          onColorChange={handleColorChange}
          onFrequencyChange={handleFrequencyChange}
          onResetToOriginal={handleResetToOriginal}
          newlyCreatedPolygon={newlyCreatedPolygon}
        />
      </div>
    </div>
  );
};