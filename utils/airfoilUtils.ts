import { Point, AirfoilData } from '../types';

/**
 * Parses a standard airfoil .dat file (Selig format).
 * Handles headers and various coordinate formats.
 */
export const parseDatFile = (content: string, fileName: string): AirfoilData => {
  const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  const points: Point[] = [];
  let name = fileName.replace('.dat', '');

  // Regex to match lines that contain exactly two numbers
  // This helps skip headers or metadata lines
  const coordinateRegex = /^\s*([+-]?\d*\.?\d+(?:[eE][+-]?\d+)?)\s+([+-]?\d*\.?\d+(?:[eE][+-]?\d+)?)\s*$/;

  let headerFound = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(coordinateRegex);

    if (match) {
      points.push({
        x: parseFloat(match[1]),
        y: parseFloat(match[2]),
      });
    } else if (i === 0 && !headerFound) {
      // Assume first line is name if it doesn't match coordinates
      name = line;
      headerFound = true;
    }
  }

  if (points.length < 3) {
    throw new Error("Invalid .dat file: Not enough coordinate points found.");
  }

  // Normalize points (ensure X runs 0 to 1 roughly)
  // We assume standard airfoil format where leading edge is near (0,0) and trailing near (1,0)
  // Some files might be scaled differently, but we keep the raw normalized shape relative to itself.
  // Calculate original thickness
  const maxY = Math.max(...points.map(p => p.y));
  const minY = Math.min(...points.map(p => p.y));
  const originalThickness = maxY - minY;

  // If the file is not normalized (e.g. chord is 100 in file), we strictly don't normalize it here 
  // to preserve intent unless it's way off. 
  // However, for this tool to work with "Chord Input", we MUST normalize the input to 0-1.
  const minX = Math.min(...points.map(p => p.x));
  const maxX = Math.max(...points.map(p => p.x));
  const rawChord = maxX - minX;

  const normalizedPoints = points.map(p => ({
    x: (p.x - minX) / rawChord,
    y: p.y / rawChord
  }));

  const normalizedThickness = originalThickness / rawChord;

  return {
    name,
    points: normalizedPoints,
    originalThickness: normalizedThickness
  };
};

/**
 * Transforms normalized points based on user Chord and Thickness inputs.
 */
export const transformPoints = (
  data: AirfoilData, 
  targetChord: number, 
  targetThicknessPercent: number
): Point[] => {
  const currentMaxThickness = data.originalThickness;
  const targetMaxThicknessRatio = targetThicknessPercent / 100;
  
  // Scale factor for Y to achieve target thickness
  // Avoid division by zero
  const yScale = currentMaxThickness > 0 
    ? targetMaxThicknessRatio / currentMaxThickness 
    : 1;

  return data.points.map(p => ({
    x: p.x * targetChord,
    y: p.y * yScale * targetChord 
  }));
};

/**
 * Generates CSV content.
 */
export const generateCSV = (points: Point[]): string => {
  let output = "X,Y,Z\n";
  points.forEach(p => {
    output += `${p.x.toFixed(6)},${p.y.toFixed(6)},0.000000\n`;
  });
  return output;
};

/**
 * Generates a minimal DXF content compatible with most CAD software.
 * Uses simple LINE entities or POLYLINE.
 */
export const generateDXF = (points: Point[]): string => {
  // DXF Header
  let dxf = "0\nSECTION\n2\nENTITIES\n";

  // Using POLYLINE (3D Polyline to be safe, or just 2D)
  dxf += "0\nPOLYLINE\n8\n0\n66\n1\n";
  
  // Vertices
  points.forEach(p => {
    dxf += "0\nVERTEX\n8\n0\n";
    dxf += `10\n${p.x.toFixed(6)}\n`;
    dxf += `20\n${p.y.toFixed(6)}\n`;
    dxf += "30\n0.0\n"; // Z
  });

  // Close the loop if the first and last points are close enough, or just end it.
  // Airfoil files often wrap around. 
  
  dxf += "0\nSEQEND\n";
  dxf += "0\nENDSEC\n";
  dxf += "0\nEOF\n";

  return dxf;
};

export const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
