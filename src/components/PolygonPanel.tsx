import React, { useState } from 'react';
import { Trash2, Edit2, Download, Check, X, Info } from 'lucide-react';
import { PolygonData, PolygonInfo } from '../types/mapTypes';

interface PolygonPanelProps {
  polygons: PolygonData[];
  selectedPolygon: PolygonInfo | null;
  onPolygonSelected: (id: string) => void;
  onPolygonDeleted: (id: string) => void;
  onNameChange: (id: string, name: string) => void;
}

export const PolygonPanel: React.FC<PolygonPanelProps> = ({
  polygons,
  selectedPolygon,
  onPolygonSelected,
  onPolygonDeleted,
  onNameChange
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState<string>('');

  const handleEditClick = (id: string, name: string) => {
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
    if (window.confirm('Are you sure you want to delete this polygon?')) {
      onPolygonDeleted(id);
    }
  };

  const handleDownloadGeoJSON = () => {
    if (!selectedPolygon) return;
    
    const selectedPolygonData = polygons.find(p => p.id === selectedPolygon.id);
    if (!selectedPolygonData) return;
    
    const dataStr = JSON.stringify(selectedPolygonData.geoJSON, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedPolygonData.name.replace(/\s+/g, '_')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadAllGeoJSON = () => {
    if (polygons.length === 0) return;
    
    const featureCollection = {
      type: "FeatureCollection",
      features: polygons.map(p => ({
        ...p.geoJSON,
        properties: {
          ...p.geoJSON.properties,
          id: p.id,
          name: p.name,
          color: p.color
        }
      }))
    };
    
    const dataStr = JSON.stringify(featureCollection, null, 2);
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

  return (
    <div className="p-4 h-full flex flex-col">
      <h2 className="text-xl font-semibold mb-4">Polygons</h2>
      
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
                        className="border border-slate-300 rounded px-2 py-1 text-sm"
                        onClick={(e) => e.stopPropagation()}
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
                          onClick={(e) => { e.stopPropagation(); handleEditClick(polygon.id, polygon.name); }}
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
          <button 
            onClick={handleDownloadGeoJSON}
            className="flex items-center justify-center w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            <Download className="h-4 w-4 mr-2" />
            Download GeoJSON
          </button>
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