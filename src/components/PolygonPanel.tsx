import React, { useState, useRef, useEffect } from 'react';
import { Trash2, Edit2, Download, Check, X, Info, RefreshCw } from 'lucide-react';
import { PolygonData, PolygonInfo } from '../types/mapTypes';

interface PolygonPanelProps {
  polygons: PolygonData[];
  selectedPolygon: PolygonInfo | null;
  onPolygonSelected: (id: string) => void;
  onPolygonDeleted: (id: string) => void;
  onNameChange: (id: string, name: string) => void;
  onResetToOriginal: () => void;
  newlyCreatedPolygon: string | null;
}

export const PolygonPanel: React.FC<PolygonPanelProps> = ({
  polygons,
  selectedPolygon,
  onPolygonSelected,
  onPolygonDeleted,
  onNameChange,
  onResetToOriginal,
  newlyCreatedPolygon
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState<string>('');
  const polygonRefs = useRef<{[key: string]: HTMLLIElement | null}>({});
  const editInputRef = useRef<HTMLInputElement | null>(null);

  const handleEditClick = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // First select the polygon if it's not already selected
    if (!selectedPolygon || selectedPolygon.id !== id) {
      onPolygonSelected(id);
    }
    
    // Then enable editing
    setEditingId(id);
    setEditName(name);
  };

  const handleSave = () => {
    if (editingId && editName.trim()) {
      onNameChange(editingId, editName.trim());
      setEditingId(null);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
  };

  const handleDeletePolygon = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onPolygonDeleted(id);
  };

  const handleDownloadAllGeoJSON = () => {
    if (polygons.length === 0) return;
    
    // Format to match sectors.ts structure with a list array
    const sectorFormat = {
      list: polygons.map(p => ({
        name: p.name,
        color: p.color || "green",
        geometry: p.geoJSON
      }))
    };
    
    const dataStr = JSON.stringify(sectorFormat, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hamilton_polygons.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Scroll selected polygon into view when it changes
  useEffect(() => {
    if (selectedPolygon && polygonRefs.current[selectedPolygon.id]) {
      polygonRefs.current[selectedPolygon.id]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }
  }, [selectedPolygon]);

  // Auto-enter edit mode for newly created polygons
  useEffect(() => {
    if (newlyCreatedPolygon && selectedPolygon && newlyCreatedPolygon === selectedPolygon.id) {
      const polygon = polygons.find(p => p.id === newlyCreatedPolygon);
      if (polygon) {
        setEditingId(polygon.id);
        setEditName(polygon.name);
      }
    }
  }, [newlyCreatedPolygon, selectedPolygon, polygons]);

  // Handle click outside of the edit input to cancel editing
  useEffect(() => {
    if (!editingId) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (editInputRef.current && !editInputRef.current.contains(event.target as Node)) {
        handleCancel();
      }
    };

    // Add the event listener
    document.addEventListener('mousedown', handleClickOutside);
    
    // Clean up
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [editingId]);

  // Cancel editing when selected polygon changes
  useEffect(() => {
    if (editingId && selectedPolygon && editingId !== selectedPolygon.id) {
      handleCancel();
    }
  }, [selectedPolygon, editingId]);

  // Handle key press for the edit input
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave();
    }
  };

  return (
    <div className="p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Polygons</h2>
        <button 
          onClick={onResetToOriginal}
          className="flex items-center space-x-1 px-2 py-1 text-sm bg-amber-100 text-amber-800 rounded hover:bg-amber-200 transition-colors"
          title="Reset to original sectors"
        >
          <RefreshCw className="h-4 w-4 mr-1" />
          Reset
        </button>
      </div>
      
      {polygons.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-grow text-center p-6 text-slate-500">
          <Info className="h-12 w-12 mb-2 text-blue-500" />
          <p className="mb-2">No polygons created yet</p>
          <p className="text-sm">Use the drawing tools in the top-right corner of the map to create polygons</p>
        </div>
      ) : (
        <div className="mb-4 flex-grow overflow-y-auto">
          <ul className="space-y-2">
            {polygons.map((polygon) => (
              <li 
                key={polygon.id}
                ref={el => polygonRefs.current[polygon.id] = el}
                className={`
                  p-3 rounded-lg border transition-all duration-200 cursor-pointer
                  ${selectedPolygon?.id === polygon.id 
                    ? 'bg-slate-100 border-slate-300 shadow-sm' 
                    : 'bg-white border-slate-200 hover:bg-slate-50'}
                `}
                onClick={() => onPolygonSelected(polygon.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: polygon.color }}
                    />
                    
                    {editingId === polygon.id ? (
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="border border-slate-300 rounded px-2 py-1 text-sm"
                        onClick={(e) => e.stopPropagation()}
                        onFocus={(e) => e.currentTarget.select()}
                        ref={editInputRef}
                        autoFocus
                      />
                    ) : (
                      <span className="font-medium">{polygon.name}</span>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    {editingId === polygon.id ? (
                      <>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleSave(); }}
                          className="p-1 text-green-600 hover:text-green-800 transition-colors"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleCancel(); }}
                          className="p-1 text-red-600 hover:text-red-800 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button 
                          onClick={(e) => handleEditClick(polygon.id, polygon.name, e)}
                          className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={(e) => handleDeletePolygon(polygon.id, e)}
                          className="p-1 text-red-600 hover:text-red-800 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {selectedPolygon && (
        <div className="border-t border-slate-200 pt-4 mt-2">
          <h3 className="font-semibold mb-2">Selected Polygon: {selectedPolygon.name}</h3>
          <div className="mb-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">Area:</span>
              <span>{selectedPolygon.area} km²</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Points:</span>
              <span>{selectedPolygon.coordinates[0].length}</span>
            </div>
          </div>
        </div>
      )}
      
      {polygons.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-200">
          <button 
            onClick={handleDownloadAllGeoJSON}
            className="flex items-center justify-center w-full py-2 px-4 bg-green-700 text-white rounded hover:bg-green-800 transition-colors"
          >
            <Download className="h-4 w-4 mr-2" />
            Download All Polygons
          </button>
        </div>
      )}
    </div>
  );
};