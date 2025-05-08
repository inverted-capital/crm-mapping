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
  geoJSON: s.geometry,
}));

export const MapContainer: React.FC = () => {
  const [polygons, setPolygons] = useState<PolygonData[]>(() => {
    const saved = localStorage.getItem("hamiltonMapPolygons");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        /* ignored */
      }
    }
    return sectorPolygons;
  });

  const [selectedPolygon, setSelectedPolygon] = useState<string | null>(null);

  const handlePolygonCreated = (polygon: Omit<PolygonData, "id" | "name">) => {
    setPolygons((prev) => [
      ...prev,
      {
        ...polygon,
        id: `polygon-${Date.now()}`,
        name: `Polygon ${prev.length + 1}`,
        color: randomColor(),
      },
    ]);
  };

  const randomColor = (): string => {
    const colors = [
      "#2E7D32",
      "#1976D2",
      "#7B1FA2",
      "#C2185B",
      "#F57C00",
      "#00796B",
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const handlePolygonSelected = (id: string) => {
    setSelectedPolygon(id === selectedPolygon ? null : id);
  };

  const handlePolygonDeleted = (id: string) => {
    setPolygons(polygons.filter((p) => p.id !== id));
    if (selectedPolygon === id) setSelectedPolygon(null);
  };

  const handleNameChange = (id: string, name: string) => {
    setPolygons(polygons.map((p) => (p.id === id ? { ...p, name } : p)));
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
          onPolygonCreated={handlePolygonCreated as any}
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
        />
      </div>
    </div>
  );
};
