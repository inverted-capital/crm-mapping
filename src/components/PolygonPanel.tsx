import React, { useEffect, useRef, useState } from "react";
import { Check, Download, Info, Pencil, RefreshCw, Trash2 } from "lucide-react";
import { PolygonData, PolygonInfo } from "../types/mapTypes";

interface PolygonPanelProps {
  polygons: PolygonData[];
  selectedPolygon: PolygonInfo | null;
  onPolygonSelected: (id: string) => void;
  onPolygonDeleted: (id: string) => void;
  onNameChange: (id: string, name: string) => void;
  onColorChange: (id: string, color: string) => void;
  onFrequencyChange: (
    id: string,
    field: "frequencyInDays" | "frequencyOffset",
    value: number,
  ) => void;
  onResetToOriginal: () => void;
}

export const PolygonPanel: React.FC<PolygonPanelProps> = ({
  polygons,
  selectedPolygon,
  onPolygonSelected,
  onPolygonDeleted,
  onNameChange,
  onColorChange,
  onFrequencyChange,
  onResetToOriginal,
}) => {
  const [editName, setEditName] = useState<string>("");
  const polygonRefs = useRef<{ [key: string]: HTMLLIElement | null }>({});
  const editInputRef = useRef<HTMLInputElement | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const availableColors = [
    "red",
    "orange",
    "yellow",
    "cyan",
    "purple",
    "violet",
    "pink",
    "green",
    "black",
  ];

  const handleDeletePolygon = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this polygon?")) {
      onPolygonDeleted(id);
    }
  };

  const handleDownloadAllGeoJSON = () => {
    if (polygons.length === 0) return;

    // Format to match sectors.ts structure with a list array
    const sectorFormat = {
      list: polygons.map((p) => ({
        name: p.name,
        color: p.color || "green",
        frequencyInDays: p.frequencyInDays || 0,
        frequencyOffset: p.frequencyOffset || 0,
        geometry: p.geoJSON,
      })),
    };

    const dataStr = JSON.stringify(sectorFormat, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "hamilton_polygons.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Scroll selected polygon into view when it changes
  useEffect(() => {
    if (selectedPolygon && polygonRefs.current[selectedPolygon.id]) {
      polygonRefs.current[selectedPolygon.id]?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [selectedPolygon]);

  // Update edit name when selected polygon changes
  useEffect(() => {
    if (selectedPolygon) {
      setEditName(selectedPolygon.name);
    }
  }, [selectedPolygon]);

  // Handle key press for the edit input
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSaveName();
    }
  };

  const handleSaveName = () => {
    if (selectedPolygon && editName.trim()) {
      onNameChange(selectedPolygon.id, editName.trim());
      setIsEditing(false);
    }
  };

  const startEditing = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedPolygon) {
      setIsEditing(true);
      setEditName(selectedPolygon.name);
      // Focus will happen via useEffect when ref is attached
    }
  };

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [isEditing]);

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

      {polygons.length === 0
        ? (
          <div className="flex flex-col items-center justify-center flex-grow text-center p-6 text-slate-500">
            <Info className="h-12 w-12 mb-2 text-blue-500" />
            <p className="mb-2">No polygons created yet</p>
            <p className="text-sm">
              Use the drawing tools in the top-right corner of the map to create
              polygons
            </p>
          </div>
        )
        : (
          <div className="mb-4 flex-grow overflow-y-auto">
            <ul className="space-y-2">
              {polygons.map((polygon) => (
                <li
                  key={polygon.id}
                  ref={(el) => {
                    if (el) {
                      polygonRefs.current[polygon.id] = el;
                    }
                  }}
                  className={`
                  p-3 rounded-lg border transition-all duration-200 cursor-pointer
                  ${
                    selectedPolygon?.id === polygon.id
                      ? "bg-slate-100 border-slate-300 shadow-sm"
                      : "bg-white border-slate-200 hover:bg-slate-50"
                  }
                `}
                  onClick={() => onPolygonSelected(polygon.id)}
                >
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: polygon.color }}
                    />
                    <span className="font-medium">{polygon.name}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

      {selectedPolygon && (
        <div className="border-t border-slate-200 pt-4 mt-2 mb-4">
          <div className="bg-slate-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Edit Polygon</h3>
              <button
                onClick={(e) => handleDeletePolygon(selectedPolygon.id, e)}
                className="flex items-center space-x-1 px-2 py-1 text-sm bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors"
                title="Delete polygon"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </button>
            </div>

            {/* Name field */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Name
              </label>
              <div className="flex">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isEditing) {
                      setIsEditing(true);
                    }
                  }}
                  readOnly={!isEditing}
                  ref={editInputRef}
                />
                {isEditing
                  ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSaveName();
                      }}
                      className="ml-2 p-2 bg-green-100 text-green-800 rounded hover:bg-green-200 transition-colors"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  )
                  : (
                    <button
                      onClick={startEditing}
                      className="ml-2 p-2 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  )}
              </div>
            </div>

            {/* Color selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Color
              </label>
              <div className="grid grid-cols-3 gap-2">
                {availableColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => onColorChange(selectedPolygon.id, color)}
                    className={`
                      p-2 rounded-lg border transition-colors flex items-center justify-center
                      ${
                      selectedPolygon.color === color
                        ? "border-2 border-blue-500 shadow-sm"
                        : "border-slate-200 hover:bg-slate-50"
                    }
                    `}
                    style={{
                      backgroundColor: color === "white" ? "white" : undefined,
                    }}
                  >
                    <div
                      className="w-full h-5 rounded"
                      style={{ backgroundColor: color }}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Frequency in Days */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Frequency in Days
              </label>
              <input
                type="number"
                min="0"
                value={selectedPolygon.frequencyInDays || 0}
                onChange={(e) =>
                  onFrequencyChange(
                    selectedPolygon.id,
                    "frequencyInDays",
                    Math.max(0, parseInt(e.target.value) || 0),
                  )}
                className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
              />
            </div>

            {/* Frequency Offset */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Frequency Offset
              </label>
              <input
                type="number"
                min="0"
                value={selectedPolygon.frequencyOffset || 0}
                onChange={(e) =>
                  onFrequencyChange(
                    selectedPolygon.id,
                    "frequencyOffset",
                    Math.max(0, parseInt(e.target.value) || 0),
                  )}
                className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
              />
            </div>

            {/* Summary information */}
            <div className="mt-4 pt-3 border-t border-slate-200">
              <div className="text-sm text-slate-500">
                <div className="flex justify-between mb-1">
                  <span>Area:</span>
                  <span>{selectedPolygon.area} km²</span>
                </div>
                <div className="flex justify-between">
                  <span>Points:</span>
                  <span>{selectedPolygon.coordinates[0].length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {polygons.length > 0 && (
        <div className="mt-auto pt-4 border-t border-slate-200">
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
