import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Point } from '../types';

interface AirfoilViewerProps {
  points: Point[];
  color: string;
  chord: number;
}

const AirfoilViewer: React.FC<AirfoilViewerProps> = ({ points, color, chord }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Handle Resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };
    
    window.addEventListener('resize', updateSize);
    updateSize();
    
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Render D3
  useEffect(() => {
    if (!svgRef.current || points.length === 0 || dimensions.width === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous

    const margin = { top: 40, right: 40, bottom: 40, left: 50 };
    const width = dimensions.width - margin.left - margin.right;
    const height = dimensions.height - margin.top - margin.bottom;

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Scales
    const xExtent = d3.extent(points, p => p.x) as [number, number];
    const yExtent = d3.extent(points, p => p.y) as [number, number];

    const dataWidth = xExtent[1] - xExtent[0];
    const dataHeight = yExtent[1] - yExtent[0];
    
    // Padding logic
    const xPad = dataWidth * 0.1;
    // Ensure reasonable height if airfoil is very thin
    const minHeight = dataWidth * 0.3; 
    const effectiveHeight = Math.max(dataHeight, minHeight);
    const yPad = effectiveHeight * 0.5;

    const xDomain = [xExtent[0] - xPad, xExtent[1] + xPad];
    const yDomain = [yExtent[0] - yPad, yExtent[1] + yPad];

    const xScale = d3.scaleLinear()
      .domain(xDomain)
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain(yDomain)
      .range([height, 0]);

    // Technical Gridlines
    const xAxis = d3.axisBottom(xScale)
      .ticks(10)
      .tickSize(-height)
      .tickPadding(10);
      
    const yAxis = d3.axisLeft(yScale)
      .ticks(5)
      .tickSize(-width)
      .tickPadding(10);

    // Draw Grid
    const xGrid = g.append("g")
      .attr("class", "grid-x")
      .attr("transform", `translate(0,${height})`)
      .call(xAxis);
      
    xGrid.selectAll("line")
      .attr("stroke", "#1e293b")
      .attr("stroke-dasharray", "2,2");
    xGrid.selectAll("path").attr("stroke", "none");
    xGrid.selectAll("text").attr("fill", "#64748b").attr("font-family", "monospace").attr("font-size", "10px");

    const yGrid = g.append("g")
      .attr("class", "grid-y")
      .call(yAxis);
      
    yGrid.selectAll("line")
      .attr("stroke", "#1e293b")
      .attr("stroke-dasharray", "2,2");
    yGrid.selectAll("path").attr("stroke", "none");
    yGrid.selectAll("text").attr("fill", "#64748b").attr("font-family", "monospace").attr("font-size", "10px");

    // Zero Lines / Crosshair (Origin)
    g.append("line")
      .attr("x1", xScale(0))
      .attr("y1", 0)
      .attr("x2", xScale(0))
      .attr("y2", height)
      .attr("stroke", "#475569")
      .attr("stroke-width", 1);

    g.append("line")
      .attr("x1", 0)
      .attr("y1", yScale(0))
      .attr("x2", width)
      .attr("y2", yScale(0))
      .attr("stroke", "#475569")
      .attr("stroke-width", 1);

    // Chord Line (Dashed line from LE to TE)
    // Assuming standard airfoil normalized logic (LE at 0,0 -> TE at Chord,0)
    // In transformed points, this is roughly minX to maxX at y=0
    g.append("line")
      .attr("x1", xScale(xExtent[0]))
      .attr("y1", yScale(0))
      .attr("x2", xScale(xExtent[1]))
      .attr("y2", yScale(0))
      .attr("stroke", "#94a3b8")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "5,5");

    // Airfoil Path Generator
    const line = d3.line<Point>()
      .x(d => xScale(d.x))
      .y(d => yScale(d.y))
      .curve(d3.curveLinear);

    // Draw the airfoil shape
    g.append("path")
      .datum(points)
      .attr("fill", color)
      .attr("fill-opacity", 0.15)
      .attr("stroke", color)
      .attr("stroke-width", 2)
      .attr("vector-effect", "non-scaling-stroke") // Keeps line crisp
      .attr("d", line);
      
    // Draw vertices if sparse
    if (points.length < 80) {
      g.selectAll(".dot")
        .data(points)
        .enter().append("circle")
        .attr("cx", d => xScale(d.x))
        .attr("cy", d => yScale(d.y))
        .attr("r", 2)
        .attr("fill", "#fff")
        .attr("stroke", color);
    }

    // Labels
    svg.append("text")
      .attr("text-anchor", "end")
      .attr("x", width + margin.left)
      .attr("y", height + margin.top + 35)
      .attr("fill", "#94a3b8")
      .attr("class", "font-mono text-[10px] uppercase tracking-wider")
      .text(`Chord Axis [0 - ${chord.toFixed(0)}mm]`);

    svg.append("text")
      .attr("text-anchor", "end")
      .attr("transform", "rotate(-90)")
      .attr("y", 15)
      .attr("x", -margin.top)
      .attr("fill", "#94a3b8")
      .attr("class", "font-mono text-[10px] uppercase tracking-wider")
      .text("Thickness Axis");

  }, [points, dimensions, color, chord]);

  return (
    <div ref={containerRef} className="w-full h-full overflow-hidden relative">
      <svg ref={svgRef} className="w-full h-full block" />
      {points.length === 0 && (
         <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 pointer-events-none">
           <div className="w-12 h-12 border-2 border-slate-700 border-dashed rounded flex items-center justify-center mb-2 opacity-50">
             <span className="text-2xl">+</span>
           </div>
           <span className="font-mono text-xs uppercase tracking-widest">No Data Stream</span>
         </div>
      )}
    </div>
  );
};

export default AirfoilViewer;