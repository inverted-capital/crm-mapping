export interface GeoJSONFeature {
  type: string;
  geometry: {
    type: string;
    coordinates: number[][][];
  };
  properties?: Record<string, any>;
}

export interface PolygonData {
  id: string;
  name: string;
  color?: string;
  frequencyInDays?: number;
  frequencyOffset?: number;
  geoJSON: GeoJSONFeature;
}

export interface PolygonInfo {
  id: string;
  name: string;
  area: number;
  coordinates: number[][][];
  color?: string;
  frequencyInDays?: number;
  frequencyOffset?: number;
}