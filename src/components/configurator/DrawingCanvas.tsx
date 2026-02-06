import { useCallback, useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export interface Point {
  x: number;
  y: number;
}

export interface ROIPolygon {
  id: string;
  points: Point[];
  closed: boolean;
}

export interface CountingLine {
  id: string;
  start: Point;
  end: Point;
  name: string;
  inDirection: "left" | "right";
}

export interface Zone {
  id: string;
  points: Point[];
  closed: boolean;
  name: string;
}

export type DrawingTool = "select" | "roi" | "line" | "zone";

interface DrawingCanvasProps {
  width?: number;
  height?: number;
  backgroundImage?: string;
  tool: DrawingTool;
  rois: ROIPolygon[];
  lines: CountingLine[];
  zones: Zone[];
  onRoisChange: (rois: ROIPolygon[]) => void;
  onLinesChange: (lines: CountingLine[]) => void;
  onZonesChange: (zones: Zone[]) => void;
  selectedId?: string;
  onSelectElement: (id: string | null, type: "roi" | "line" | "zone" | null) => void;
}

export function DrawingCanvas({
  width = 1920,
  height = 1080,
  backgroundImage,
  tool,
  rois,
  lines,
  zones,
  onRoisChange,
  onLinesChange,
  onZonesChange,
  selectedId,
  onSelectElement,
}: DrawingCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [currentPolygon, setCurrentPolygon] = useState<Point[]>([]);
  const [currentLine, setCurrentLine] = useState<{ start: Point; end?: Point } | null>(null);
  const [dragging, setDragging] = useState<{
    type: "roi" | "line" | "zone";
    id: string;
    pointIndex?: number;
    offset: Point;
  } | null>(null);
  const [mousePos, setMousePos] = useState<Point | null>(null);

  const getMousePosition = useCallback((e: React.MouseEvent<SVGSVGElement>): Point => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    
    const rect = svg.getBoundingClientRect();
    const scaleX = width / rect.width;
    const scaleY = height / rect.height;
    
    return {
      x: Math.round((e.clientX - rect.left) * scaleX),
      y: Math.round((e.clientY - rect.top) * scaleY),
    };
  }, [width, height]);

  const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const handleClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (dragging) return;
    
    const pos = getMousePosition(e);

    if (tool === "roi" || tool === "zone") {
      setCurrentPolygon((prev) => [...prev, pos]);
    } else if (tool === "line") {
      if (!currentLine) {
        setCurrentLine({ start: pos });
      } else if (!currentLine.end) {
        const newLine: CountingLine = {
          id: generateId(),
          start: currentLine.start,
          end: pos,
          name: `Line ${lines.length + 1}`,
          inDirection: "right",
        };
        onLinesChange([...lines, newLine]);
        setCurrentLine(null);
      }
    } else if (tool === "select") {
      onSelectElement(null, null);
    }
  }, [tool, currentLine, lines, onLinesChange, getMousePosition, dragging, onSelectElement]);

  const handleDoubleClick = useCallback(() => {
    if ((tool === "roi" || tool === "zone") && currentPolygon.length >= 3) {
      if (tool === "roi") {
        const newRoi: ROIPolygon = {
          id: generateId(),
          points: currentPolygon,
          closed: true,
        };
        onRoisChange([...rois, newRoi]);
      } else {
        const newZone: Zone = {
          id: generateId(),
          points: currentPolygon,
          closed: true,
          name: `Zone ${zones.length + 1}`,
        };
        onZonesChange([...zones, newZone]);
      }
      setCurrentPolygon([]);
    }
  }, [tool, currentPolygon, rois, zones, onRoisChange, onZonesChange]);

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const pos = getMousePosition(e);
    setMousePos(pos);

    if (dragging) {
      if (dragging.type === "roi") {
        const roi = rois.find(r => r.id === dragging.id);
        if (roi && dragging.pointIndex !== undefined) {
          const newPoints = [...roi.points];
          newPoints[dragging.pointIndex] = pos;
          onRoisChange(rois.map(r => r.id === dragging.id ? { ...r, points: newPoints } : r));
        }
      } else if (dragging.type === "zone") {
        const zone = zones.find(z => z.id === dragging.id);
        if (zone && dragging.pointIndex !== undefined) {
          const newPoints = [...zone.points];
          newPoints[dragging.pointIndex] = pos;
          onZonesChange(zones.map(z => z.id === dragging.id ? { ...z, points: newPoints } : z));
        }
      } else if (dragging.type === "line") {
        const line = lines.find(l => l.id === dragging.id);
        if (line) {
          if (dragging.pointIndex === 0) {
            onLinesChange(lines.map(l => l.id === dragging.id ? { ...l, start: pos } : l));
          } else if (dragging.pointIndex === 1) {
            onLinesChange(lines.map(l => l.id === dragging.id ? { ...l, end: pos } : l));
          }
        }
      }
    }
  }, [getMousePosition, dragging, rois, zones, lines, onRoisChange, onZonesChange, onLinesChange]);

  const handleMouseUp = useCallback(() => {
    setDragging(null);
  }, []);

  const handlePointMouseDown = useCallback((
    e: React.MouseEvent,
    type: "roi" | "line" | "zone",
    id: string,
    pointIndex: number
  ) => {
    e.stopPropagation();
    const pos = getMousePosition(e as React.MouseEvent<SVGSVGElement>);
    setDragging({ type, id, pointIndex, offset: pos });
    onSelectElement(id, type);
  }, [getMousePosition, onSelectElement]);

  const handleElementClick = useCallback((
    e: React.MouseEvent,
    type: "roi" | "line" | "zone",
    id: string
  ) => {
    e.stopPropagation();
    onSelectElement(id, type);
  }, [onSelectElement]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") {
      setCurrentPolygon([]);
      setCurrentLine(null);
    } else if (e.key === "Delete" || e.key === "Backspace") {
      if (selectedId) {
        onRoisChange(rois.filter(r => r.id !== selectedId));
        onLinesChange(lines.filter(l => l.id !== selectedId));
        onZonesChange(zones.filter(z => z.id !== selectedId));
        onSelectElement(null, null);
      }
    }
  }, [selectedId, rois, lines, zones, onRoisChange, onLinesChange, onZonesChange, onSelectElement]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const pointsToSvgPath = (points: Point[], closed: boolean): string => {
    if (points.length === 0) return "";
    const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
    return closed ? `${path} Z` : path;
  };

  const getLineArrowPoints = (start: Point, end: Point, inDirection: "left" | "right"): string => {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const angle = Math.atan2(dy, dx);
    const perpAngle = angle + (inDirection === "right" ? Math.PI / 2 : -Math.PI / 2);
    
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;
    const arrowLen = 30;
    
    const tipX = midX + Math.cos(perpAngle) * arrowLen;
    const tipY = midY + Math.sin(perpAngle) * arrowLen;
    
    const baseOffset = 12;
    const base1X = midX + Math.cos(angle) * baseOffset;
    const base1Y = midY + Math.sin(angle) * baseOffset;
    const base2X = midX - Math.cos(angle) * baseOffset;
    const base2Y = midY - Math.sin(angle) * baseOffset;
    
    return `${base1X},${base1Y} ${tipX},${tipY} ${base2X},${base2Y}`;
  };

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${width} ${height}`}
      className="absolute inset-0 h-full w-full cursor-crosshair"
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* ROI Polygons */}
      {rois.map((roi) => (
        <g key={roi.id}>
          <path
            d={pointsToSvgPath(roi.points, roi.closed)}
            fill="hsla(217, 91%, 60%, 0.1)"
            stroke="hsl(217, 91%, 60%)"
            strokeWidth="2"
            strokeDasharray={roi.closed ? "8,4" : "4,4"}
            className={cn(
              "cursor-pointer transition-all",
              selectedId === roi.id && "stroke-[3]"
            )}
            onClick={(e) => handleElementClick(e, "roi", roi.id)}
          />
          {/* Vertex handles */}
          {roi.points.map((point, idx) => (
            <circle
              key={idx}
              cx={point.x}
              cy={point.y}
              r={selectedId === roi.id ? 8 : 6}
              fill="hsl(217, 91%, 60%)"
              stroke="white"
              strokeWidth="2"
              className="cursor-move"
              onMouseDown={(e) => handlePointMouseDown(e, "roi", roi.id, idx)}
            />
          ))}
        </g>
      ))}

      {/* Counting Lines */}
      {lines.map((line) => (
        <g key={line.id}>
          <line
            x1={line.start.x}
            y1={line.start.y}
            x2={line.end.x}
            y2={line.end.y}
            stroke="hsl(142, 71%, 45%)"
            strokeWidth={selectedId === line.id ? 4 : 3}
            className="cursor-pointer"
            onClick={(e) => handleElementClick(e, "line", line.id)}
          />
          {/* Direction arrow */}
          <polygon
            points={getLineArrowPoints(line.start, line.end, line.inDirection)}
            fill="hsl(142, 71%, 45%)"
          />
          {/* IN/OUT labels */}
          <text
            x={(line.start.x + line.end.x) / 2}
            y={(line.start.y + line.end.y) / 2 - 20}
            fill="hsl(142, 71%, 45%)"
            fontSize="14"
            fontWeight="bold"
            textAnchor="middle"
          >
            {line.name}
          </text>
          {/* Endpoint handles */}
          <circle
            cx={line.start.x}
            cy={line.start.y}
            r={selectedId === line.id ? 10 : 8}
            fill="hsl(142, 71%, 45%)"
            stroke="white"
            strokeWidth="2"
            className="cursor-move"
            onMouseDown={(e) => handlePointMouseDown(e, "line", line.id, 0)}
          />
          <circle
            cx={line.end.x}
            cy={line.end.y}
            r={selectedId === line.id ? 10 : 8}
            fill="hsl(142, 71%, 45%)"
            stroke="white"
            strokeWidth="2"
            className="cursor-move"
            onMouseDown={(e) => handlePointMouseDown(e, "line", line.id, 1)}
          />
        </g>
      ))}

      {/* Zones */}
      {zones.map((zone) => (
        <g key={zone.id}>
          <path
            d={pointsToSvgPath(zone.points, zone.closed)}
            fill="hsla(38, 92%, 50%, 0.15)"
            stroke="hsl(38, 92%, 50%)"
            strokeWidth={selectedId === zone.id ? 3 : 2}
            className="cursor-pointer"
            onClick={(e) => handleElementClick(e, "zone", zone.id)}
          />
          {zone.closed && (
            <text
              x={zone.points.reduce((sum, p) => sum + p.x, 0) / zone.points.length}
              y={zone.points.reduce((sum, p) => sum + p.y, 0) / zone.points.length}
              fill="hsl(38, 92%, 50%)"
              fontSize="16"
              fontWeight="bold"
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {zone.name}
            </text>
          )}
          {/* Vertex handles */}
          {zone.points.map((point, idx) => (
            <circle
              key={idx}
              cx={point.x}
              cy={point.y}
              r={selectedId === zone.id ? 8 : 6}
              fill="hsl(38, 92%, 50%)"
              stroke="white"
              strokeWidth="2"
              className="cursor-move"
              onMouseDown={(e) => handlePointMouseDown(e, "zone", zone.id, idx)}
            />
          ))}
        </g>
      ))}

      {/* Current drawing polygon */}
      {currentPolygon.length > 0 && (
        <g>
          <path
            d={pointsToSvgPath(currentPolygon, false)}
            fill="none"
            stroke={tool === "roi" ? "hsl(217, 91%, 60%)" : "hsl(38, 92%, 50%)"}
            strokeWidth="2"
            strokeDasharray="4,4"
          />
          {mousePos && (
            <line
              x1={currentPolygon[currentPolygon.length - 1].x}
              y1={currentPolygon[currentPolygon.length - 1].y}
              x2={mousePos.x}
              y2={mousePos.y}
              stroke={tool === "roi" ? "hsl(217, 91%, 60%)" : "hsl(38, 92%, 50%)"}
              strokeWidth="2"
              strokeDasharray="4,4"
              opacity={0.5}
            />
          )}
          {currentPolygon.map((point, idx) => (
            <circle
              key={idx}
              cx={point.x}
              cy={point.y}
              r={6}
              fill={tool === "roi" ? "hsl(217, 91%, 60%)" : "hsl(38, 92%, 50%)"}
              stroke="white"
              strokeWidth="2"
            />
          ))}
        </g>
      )}

      {/* Current drawing line */}
      {currentLine && mousePos && (
        <g>
          <line
            x1={currentLine.start.x}
            y1={currentLine.start.y}
            x2={mousePos.x}
            y2={mousePos.y}
            stroke="hsl(142, 71%, 45%)"
            strokeWidth="3"
            strokeDasharray="4,4"
            opacity={0.7}
          />
          <circle
            cx={currentLine.start.x}
            cy={currentLine.start.y}
            r={8}
            fill="hsl(142, 71%, 45%)"
            stroke="white"
            strokeWidth="2"
          />
        </g>
      )}

      {/* Crosshair at mouse position */}
      {mousePos && tool !== "select" && (
        <g opacity={0.5} pointerEvents="none">
          <line x1={mousePos.x - 15} y1={mousePos.y} x2={mousePos.x + 15} y2={mousePos.y} stroke="white" strokeWidth="1" />
          <line x1={mousePos.x} y1={mousePos.y - 15} x2={mousePos.x} y2={mousePos.y + 15} stroke="white" strokeWidth="1" />
        </g>
      )}
    </svg>
  );
}
