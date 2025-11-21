export interface Point {
  x: number;
  y: number;
}

export interface AirfoilData {
  name: string;
  points: Point[]; // Original normalized points (0-1)
  originalThickness: number; // Max thickness of the normalized shape
}

export interface RenderSettings {
  chord: number;
  thicknessPercent: number; // e.g., 12 for 12%
  color: string;
}
