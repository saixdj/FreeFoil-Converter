import React, { useState, useEffect, useMemo } from 'react';
import { Upload, Download, FileText, Settings, Info, Activity, Grid, Cpu, Database } from 'lucide-react';
import AirfoilViewer from './components/AirfoilViewer';
import { parseDatFile, transformPoints, generateCSV, generateDXF, downloadFile } from './utils/airfoilUtils';
import { AirfoilData, Point } from './types';

const App: React.FC = () => {
  const [airfoilData, setAirfoilData] = useState<AirfoilData | null>(null);
  const [chord, setChord] = useState<number>(100); // Default 100 units
  const [thicknessPercent, setThicknessPercent] = useState<number>(12); // Default 12%
  const [plotColor, setPlotColor] = useState<string>('#38bdf8'); // Initial sky-400
  const [fileName, setFileName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Derived state: Transformed points
  const transformedPoints: Point[] = useMemo(() => {
    if (!airfoilData) return [];
    return transformPoints(airfoilData, chord, thicknessPercent);
  }, [airfoilData, chord, thicknessPercent]);

  // Effect: Change color on inputs change
  useEffect(() => {
    if (!airfoilData) return;
    // Generate a pleasant technical color based on values to simulate "different color every time"
    // Using HSL for vibrant changes, keeping saturation high for "laser" look
    const hue = (chord * 3 + thicknessPercent * 13 + 180) % 360;
    setPlotColor(`hsl(${hue}, 85%, 60%)`);
  }, [chord, thicknessPercent, airfoilData]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = parseDatFile(content, file.name);
        setAirfoilData(data);
        setThicknessPercent(Math.round(data.originalThickness * 100));
      } catch (err) {
        setError((err as Error).message);
        setAirfoilData(null);
      }
    };
    reader.readAsText(file);
  };

  const handleExport = (format: 'csv' | 'dxf' | 'dwg') => {
    if (!transformedPoints.length) return;

    const baseName = fileName.replace('.dat', '') || 'airfoil';
    const suffix = `_C${chord}_T${thicknessPercent}`;
    
    if (format === 'csv') {
      const content = generateCSV(transformedPoints);
      downloadFile(content, `${baseName}${suffix}.csv`, 'text/csv');
    } else if (format === 'dxf') {
      const content = generateDXF(transformedPoints);
      downloadFile(content, `${baseName}${suffix}.dxf`, 'application/dxf');
    } else if (format === 'dwg') {
      const content = generateDXF(transformedPoints);
      downloadFile(content, `${baseName}${suffix}.dwg`, 'application/acad'); 
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-cyan-500/30">
      {/* Technical Header */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-[1400px] mx-auto h-14 flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-cyan-900/30 border border-cyan-500/50 flex items-center justify-center rounded-sm">
                 <Activity className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold font-mono tracking-tight text-slate-100 uppercase">
                  FreeFoil <span className="text-cyan-400">Converter</span>
                </h1>
                <p className="text-[10px] font-mono text-slate-500 tracking-widest -mt-1">VER 2.0.1 // ENG-MODE</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-6 font-mono text-xs text-slate-400">
             <div className="hidden md:flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                <span>SYSTEM READY</span>
             </div>
             <a 
               href="https://m-selig.ae.illinois.edu/ads/coord_database.html" 
               target="_blank" 
               rel="noreferrer"
               className="hover:text-cyan-400 transition-colors flex items-center gap-1 uppercase border-l border-slate-700 pl-4"
             >
               <Database size={12} /> UIUC DB ACCESS
             </a>
          </div>
        </div>
        {/* Decorative scanning line under header */}
        <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent opacity-50"></div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-[1400px] mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Panel: Controls */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          
          {/* Section Header */}
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-600/70 mb-1">
            <span className="bg-slate-800 px-1">SEC-01</span>
            <span className="flex-1 h-[1px] bg-slate-800"></span>
            <span>INPUT DATA</span>
          </div>

          {/* Upload Section */}
          <div className="tech-border bg-slate-900/80 p-6 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 p-1">
              <div className="w-16 h-16 bg-slate-800/20 rotate-45 translate-x-8 -translate-y-8"></div>
            </div>

            <h2 className="text-sm font-bold font-mono text-slate-300 mb-4 flex items-center gap-2 uppercase tracking-wider">
              <FileText size={16} className="text-cyan-500" />
              Airfoil Data Source
            </h2>
            
            <label className="flex flex-col items-center justify-center w-full h-28 border border-slate-700 border-dashed hover:bg-slate-800/50 hover:border-cyan-500/50 transition-all cursor-pointer bg-slate-900/50">
              <div className="flex flex-col items-center justify-center">
                <Upload className="w-6 h-6 mb-2 text-slate-500" />
                <p className="text-xs font-mono text-slate-400 uppercase">
                  <span className="text-cyan-400">Load .DAT File</span>
                </p>
              </div>
              <input type="file" className="hidden" accept=".dat,.txt" onChange={handleFileUpload} />
            </label>

            {fileName && (
              <div className="mt-3 p-2 bg-slate-950 border-l-2 border-cyan-500 flex items-center justify-between">
                <div className="flex flex-col">
                   <span className="text-[10px] text-slate-500 uppercase font-mono">Loaded File</span>
                   <span className="text-xs font-mono text-cyan-300 truncate max-w-[200px]">{fileName}</span>
                </div>
                <span className="text-[10px] bg-emerald-900/30 text-emerald-400 px-2 py-1 border border-emerald-900">OK</span>
              </div>
            )}
            
            {error && (
              <div className="mt-3 p-2 bg-red-950/30 border-l-2 border-red-500 text-red-400 text-xs font-mono">
                ERROR: {error}
              </div>
            )}
          </div>

          {/* Section Header */}
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-600/70 mt-4 mb-1">
            <span className="bg-slate-800 px-1">SEC-02</span>
            <span className="flex-1 h-[1px] bg-slate-800"></span>
            <span>PARAMETERS</span>
          </div>

          {/* Parameters Section */}
          <div className={`tech-border bg-slate-900/80 p-6 shadow-lg transition-all duration-300 ${!airfoilData ? 'opacity-60 pointer-events-none grayscale' : ''}`}>
            <h2 className="text-sm font-bold font-mono text-slate-300 mb-6 flex items-center gap-2 uppercase tracking-wider">
              <Settings size={16} className="text-cyan-500" />
              Geometry Config
            </h2>

            <div className="space-y-6">
              {/* Chord Slider */}
              <div>
                <div className="flex justify-between mb-1 items-end">
                  <label className="text-xs font-mono text-slate-400 uppercase">Chord (mm)</label>
                  <span className="text-lg font-mono text-cyan-300 bg-slate-950 px-2 py-0.5 border border-slate-800">{chord}</span>
                </div>
                <input 
                  type="range" 
                  min="10" 
                  max="1000" 
                  step="1"
                  value={chord} 
                  onChange={(e) => setChord(Number(e.target.value))}
                  className="w-full h-1 bg-slate-700 appearance-none cursor-pointer hover:bg-slate-600"
                />
                <div className="w-full flex justify-between text-[10px] font-mono text-slate-600 mt-1">
                   <span>10</span>
                   <span>|</span>
                   <span>|</span>
                   <span>|</span>
                   <span>1000</span>
                </div>
              </div>

              {/* Thickness Slider */}
              <div>
                 <div className="flex justify-between mb-1 items-end">
                  <label className="text-xs font-mono text-slate-400 uppercase">Thickness (%)</label>
                  <span className="text-lg font-mono text-cyan-300 bg-slate-950 px-2 py-0.5 border border-slate-800">{thicknessPercent}%</span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="50" 
                  step="0.1"
                  value={thicknessPercent} 
                  onChange={(e) => setThicknessPercent(Number(e.target.value))}
                  className="w-full h-1 bg-slate-700 appearance-none cursor-pointer hover:bg-slate-600"
                />
                <div className="w-full flex justify-between text-[10px] font-mono text-slate-600 mt-1">
                   <span>1%</span>
                   <span>|</span>
                   <span>|</span>
                   <span>|</span>
                   <span>50%</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 pt-2">
                 <div className="p-2 bg-slate-950 border border-slate-800">
                    <p className="text-[10px] text-slate-500 font-mono uppercase">Original T/C</p>
                    <p className="text-sm text-slate-300 font-mono">{airfoilData ? (airfoilData.originalThickness * 100).toFixed(2) : '--'}%</p>
                 </div>
                 <div className="p-2 bg-slate-950 border border-slate-800">
                    <p className="text-[10px] text-slate-500 font-mono uppercase">Vertices</p>
                    <p className="text-sm text-slate-300 font-mono">{transformedPoints.length}</p>
                 </div>
              </div>

            </div>
          </div>

           {/* Section Header */}
           <div className="flex items-center gap-2 text-xs font-mono text-cyan-600/70 mt-4 mb-1">
            <span className="bg-slate-800 px-1">SEC-03</span>
            <span className="flex-1 h-[1px] bg-slate-800"></span>
            <span>OUTPUT</span>
          </div>

          {/* Export Section */}
          <div className={`tech-border bg-slate-900/80 p-6 shadow-lg transition-all duration-300 ${!airfoilData ? 'opacity-60 pointer-events-none' : ''}`}>
             <h2 className="text-sm font-bold font-mono text-slate-300 mb-4 flex items-center gap-2 uppercase tracking-wider">
              <Download size={16} className="text-cyan-500" />
              Generate File
            </h2>
            <div className="grid grid-cols-3 gap-2">
              <button 
                onClick={() => handleExport('csv')}
                className="group flex flex-col items-center justify-center p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-cyan-500/50 transition-all"
              >
                <span className="font-bold font-mono text-slate-200 group-hover:text-cyan-400">.CSV</span>
                <span className="text-[9px] text-slate-500 uppercase mt-1">Point Data</span>
              </button>
              <button 
                onClick={() => handleExport('dxf')}
                className="group flex flex-col items-center justify-center p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-cyan-500/50 transition-all"
              >
                <span className="font-bold font-mono text-slate-200 group-hover:text-cyan-400">.DXF</span>
                <span className="text-[9px] text-slate-500 uppercase mt-1">Generic CAD</span>
              </button>
              <button 
                onClick={() => handleExport('dwg')}
                className="group flex flex-col items-center justify-center p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-cyan-500/50 transition-all"
              >
                <span className="font-bold font-mono text-slate-200 group-hover:text-cyan-400">.DWG</span>
                <span className="text-[9px] text-slate-500 uppercase mt-1">AutoCAD</span>
              </button>
            </div>
          </div>

        </div>

        {/* Right Panel: Visualization */}
        <div className="lg:col-span-8 flex flex-col h-[600px] lg:h-auto">
          {/* Section Header */}
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-600/70 mb-1">
            <span className="bg-slate-800 px-1">VIEWPORT-01</span>
            <span className="flex-1 h-[1px] bg-slate-800"></span>
            <span>REALTIME RENDER</span>
          </div>

          <div className="flex-1 tech-border bg-slate-900/90 shadow-2xl p-1 flex flex-col relative overflow-hidden">
            {/* CAD overlay elements */}
            <div className="absolute top-4 left-4 text-[10px] font-mono text-cyan-700 z-10 pointer-events-none">
              CAM: ORTHOGRAPHIC<br/>
              SCALE: 1:1<br/>
              GRID: 10mm
            </div>

            <div className="absolute top-4 right-4 flex items-center gap-3 z-10">
               <div className="flex items-center gap-2 bg-slate-950/50 px-2 py-1 rounded border border-slate-800/50">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: plotColor }}></div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase">Active Layer</span>
               </div>
            </div>
            
            <div className="flex-1 w-full bg-[#080c14] relative border border-slate-800/50">
               {/* Grid texture overlay */}
               <div className="absolute inset-0 pointer-events-none opacity-20" 
                    style={{ 
                      backgroundImage: 'linear-gradient(#1e293b 1px, transparent 1px), linear-gradient(90deg, #1e293b 1px, transparent 1px)', 
                      backgroundSize: '20px 20px' 
                    }}>
               </div>
               <AirfoilViewer 
                  points={transformedPoints} 
                  color={plotColor} 
                  chord={chord}
               />
            </div>

            {/* Status Footer */}
            <div className="h-10 bg-slate-950 border-t border-slate-800 flex items-center px-4 justify-between">
               <div className="flex gap-6 font-mono text-[10px] text-slate-500">
                  <div className="flex gap-1">
                    <span>X:</span> <span className="text-cyan-600">{chord.toFixed(2)}</span>
                  </div>
                  <div className="flex gap-1">
                    <span>Y:</span> <span className="text-cyan-600">{(thicknessPercent/100 * chord).toFixed(2)}</span>
                  </div>
               </div>
               <div className="flex items-center gap-2">
                  <Cpu size={12} className="text-slate-600" />
                  <span className="text-[10px] font-mono text-slate-600">RENDERING</span>
               </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;