import React, { useEffect, useState } from 'react';
import { MapComponent } from './MapComponent';
import { PolygonPanel } from './PolygonPanel';
import { PolygonData, PolygonInfo } from '../types/mapTypes';
import { calculateArea } from '../utils/geoUtils';

export const MapContainer: React.FC = () => {
  const [polygons, setPolygons] = useState<PolygonData[]>([]);
  const [selectedPolygon, setSelectedPolygon] = useState<string | null>(null);
  
  const handlePolygonCreated = (polygon: PolygonData) => {
    setPolygons(prev => [...prev, {
      ...polygon,
      id: `polygon-${Date.now()}`,
      name: `Polygon ${prev.length + 1}`,
      color: generateRandomColor(),
    }]);
  };

  const generateRandomColor = (): string => {
    const colors = [
      '#2E7D32', // Forest Green
      '#1976D2', // Blue
      '#7B1FA2', // Purple
      '#C2185B', // Pink
      '#F57C00', // Orange
      '#00796B', // Teal
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const handlePolygonSelected = (id: string) => {
    setSelectedPolygon(id === selectedPolygon ? null : id);
  };

  const handlePolygonDeleted = (id: string) => {
    setPolygons(polygons.filter(p => p.id !== id));
    if (selectedPolygon === id) {
      setSelectedPolygon(null);
    }
  };

  const handleNameChange = (id: string, name: string) => {
    setPolygons(polygons.map(p => 
      p.id === id ? { ...p, name } : p
    ));
  };

  const selectedPolygonInfo: PolygonInfo | null = selectedPolygon 
    ? polygons.find(p => p.id === selectedPolygon)
      ? {
          id: selectedPolygon,
          name: polygons.find(p => p.id === selectedPolygon)!.name,
          area: calculateArea(polygons.find(p => p.id === selectedPolygon)!.geoJSON),
          coordinates: polygons.find(p => p.id === selectedPolygon)!.geoJSON.geometry.coordinates
        }
      : null
    : null;

  // Load polygons from localStorage on initial render
  useEffect(() => {
    const savedPolygons = localStorage.getItem('hamiltonMapPolygons');
    if (savedPolygons) {
      try {
        setPolygons(JSON.parse(savedPolygons));
      } catch (error) {
        console.error('Failed to load saved polygons:', error);
      }
    }
  }, []);

  // Save polygons to localStorage when they change
  useEffect(() => {
    localStorage.setItem('hamiltonMapPolygons', JSON.stringify(polygons));
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
          selectedPolygon={selectedPolygonInfo}
          onPolygonSelected={handlePolygonSelected}
          onPolygonDeleted={handlePolygonDeleted}
          onNameChange={handleNameChange}
        />
      </div>
    </div>
  );
};