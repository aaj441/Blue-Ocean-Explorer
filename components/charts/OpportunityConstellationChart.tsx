import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { Network, Circle, ZoomIn, ZoomOut, RotateCcw, Info } from "lucide-react";

type Opportunity = {
  id: number;
  title: string;
  status: string;
  score: number;
};

type Connection = {
  sourceOpportunityId: number;
  targetOpportunityId: number;
  connectionType: string;
  strength: number;
  reasoning?: string;
};

type Props = {
  opportunities: Opportunity[];
  connections: Connection[];
  showControls?: boolean;
  showLegend?: boolean;
  interactive?: boolean;
};

const STATUS_COLORS: Record<string, string> = {
  identified: "#3B82F6",
  analyzing: "#EAB308",
  approved: "#10B981",
  rejected: "#EF4444",
};

const CONNECTION_COLORS: Record<string, string> = {
  similar_market: "#8B5CF6",
  complementary: "#10B981",
  competitive: "#EF4444",
  cross_pollination: "#F59E0B",
};

const STATUS_LABELS: Record<string, string> = {
  identified: "Identified",
  analyzing: "Analyzing", 
  approved: "Approved",
  rejected: "Rejected",
};

const CONNECTION_LABELS: Record<string, string> = {
  similar_market: "Similar Market",
  complementary: "Complementary",
  competitive: "Competitive",
  cross_pollination: "Cross-Pollination",
};

export function OpportunityConstellationChart({ 
  opportunities, 
  connections, 
  showControls = true,
  showLegend = true,
  interactive = true
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);
  const [selectedConnectionType, setSelectedConnectionType] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedNode, setSelectedNode] = useState<number | null>(null);

  // Force-directed layout simulation
  const nodes = useMemo(() => {
    if (opportunities.length === 0) return [];
    
    // Initialize nodes in a circle
    const initialNodes = opportunities.map((opp, i) => ({
      ...opp,
      x: 400 + Math.cos(i * 2 * Math.PI / opportunities.length) * 150,
      y: 200 + Math.sin(i * 2 * Math.PI / opportunities.length) * 150,
      vx: 0,
      vy: 0,
    }));

    // Simple force simulation
    const iterations = 100;
    const dt = 0.1;
    const k = 50; // Spring constant
    const c = 0.1; // Damping

    for (let iter = 0; iter < iterations; iter++) {
      // Reset forces
      initialNodes.forEach(node => {
        node.vx = 0;
        node.vy = 0;
      });

      // Apply spring forces from connections
      connections.forEach(conn => {
        const source = initialNodes.find(n => n.id === conn.sourceOpportunityId);
        const target = initialNodes.find(n => n.id === conn.targetOpportunityId);
        
        if (source && target) {
          const dx = target.x - source.x;
          const dy = target.y - source.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const force = k * (distance - 100) * conn.strength;
          
          if (distance > 0) {
            const fx = (dx / distance) * force;
            const fy = (dy / distance) * force;
            
            source.vx += fx;
            source.vy += fy;
            target.vx -= fx;
            target.vy -= fy;
          }
        }
      });

      // Apply repulsion forces between all nodes
      for (let i = 0; i < initialNodes.length; i++) {
        for (let j = i + 1; j < initialNodes.length; j++) {
          const node1 = initialNodes[i];
          const node2 = initialNodes[j];
          const dx = node2.x - node1.x;
          const dy = node2.y - node1.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance > 0 && distance < 200) {
            const force = k * 0.1 / (distance * distance);
            const fx = (dx / distance) * force;
            const fy = (dy / distance) * force;
            
            node1.vx -= fx;
            node1.vy -= fy;
            node2.vx += fx;
            node2.vy += fy;
          }
        }
      }

      // Update positions
      initialNodes.forEach(node => {
        node.vx *= c; // Apply damping
        node.vy *= c;
        node.x += node.vx * dt;
        node.y += node.vy * dt;
        
        // Keep nodes within bounds
        node.x = Math.max(50, Math.min(750, node.x));
        node.y = Math.max(50, Math.min(350, node.y));
      });
    }

    return initialNodes;
  }, [opportunities, connections]);

  const filteredConnections = useMemo(() => {
    return selectedConnectionType
      ? connections.filter(c => c.connectionType === selectedConnectionType)
      : connections;
  }, [connections, selectedConnectionType]);

  const drawCanvas = useCallback(() => {
    if (!canvasRef.current || opportunities.length === 0) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Apply zoom and pan
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);
    
    // Draw connections
    filteredConnections.forEach(conn => {
      const source = nodes.find(n => n.id === conn.sourceOpportunityId);
      const target = nodes.find(n => n.id === conn.targetOpportunityId);
      
      if (source && target) {
        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);
        ctx.strokeStyle = CONNECTION_COLORS[conn.connectionType] || '#9CA3AF';
        ctx.lineWidth = Math.max(1, conn.strength * 3);
        ctx.globalAlpha = 0.6;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    });
    
    // Draw nodes
    nodes.forEach(node => {
      const radius = Math.max(8, 5 + (node.score / 100) * 20);
      const isHovered = hoveredNode === node.id;
      const isSelected = selectedNode === node.id;
      
      // Node shadow
      ctx.beginPath();
      ctx.arc(node.x + 2, node.y + 2, radius, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fill();
      
      // Node
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = STATUS_COLORS[node.status] || '#6B7280';
      ctx.fill();
      
      // Node border
      if (isHovered || isSelected) {
        ctx.strokeStyle = isSelected ? '#1F2937' : '#374151';
        ctx.lineWidth = isSelected ? 3 : 2;
        ctx.stroke();
      }
      
      // Node label
      if (isHovered || isSelected) {
        ctx.fillStyle = '#1F2937';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(node.title, node.x, node.y - radius - 8);
      }
    });
    
    ctx.restore();
  }, [nodes, filteredConnections, hoveredNode, selectedNode, zoom, pan]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!interactive) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - pan.x) / zoom;
    const y = (e.clientY - rect.top - pan.y) / zoom;
    
    // Find hovered node
    const hovered = nodes.find(node => {
      const radius = Math.max(8, 5 + (node.score / 100) * 20);
      const dx = x - node.x;
      const dy = y - node.y;
      return Math.sqrt(dx * dx + dy * dy) <= radius;
    });
    
    setHoveredNode(hovered?.id || null);
  }, [nodes, zoom, pan, interactive]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!interactive) return;
    
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  }, [pan, interactive]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoveredNode(null);
    setIsDragging(false);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    if (!interactive) return;
    
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.max(0.5, Math.min(3, prev * delta)));
  }, [interactive]);

  const resetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setSelectedNode(null);
  }, []);

  if (opportunities.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 text-gray-400">
        <div className="text-center">
          <Network className="w-12 h-12 mx-auto mb-2" />
          <p className="text-sm">No opportunities to visualize</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-700">
          Opportunity Constellation
        </h4>
        <div className="flex items-center gap-3">
          {showControls && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setZoom(prev => Math.max(0.5, prev * 0.9))}
                className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                title="Zoom out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={() => setZoom(prev => Math.min(3, prev * 1.1))}
                className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                title="Zoom in"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={resetView}
                className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                title="Reset view"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          )}
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-600">Connection type:</label>
            <select
              value={selectedConnectionType || ''}
              onChange={(e) => setSelectedConnectionType(e.target.value || null)}
              className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All</option>
              {Object.entries(CONNECTION_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      <div className="relative border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
        <canvas
          ref={canvasRef}
          width={800}
          height={400}
          className="w-full cursor-move"
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onWheel={handleWheel}
          onClick={(e) => {
            if (hoveredNode) {
              setSelectedNode(selectedNode === hoveredNode ? null : hoveredNode);
            }
          }}
        />
        {interactive && (
          <div className="absolute top-2 left-2 text-xs text-gray-500 bg-white/80 px-2 py-1 rounded">
            Zoom: {(zoom * 100).toFixed(0)}% • Click nodes to select
          </div>
        )}
      </div>
      
      {showLegend && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Circle className="w-3 h-3" />
              <p className="text-xs font-semibold text-gray-700">Node Size</p>
            </div>
            <p className="text-xs text-gray-600">Represents opportunity score</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-0.5 bg-gray-400"></div>
              <p className="text-xs font-semibold text-gray-700">Edge Width</p>
            </div>
            <p className="text-xs text-gray-600">Represents connection strength</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex gap-1">
                {Object.entries(STATUS_COLORS).slice(0, 2).map(([status, color]) => (
                  <div key={status} className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
                ))}
              </div>
              <p className="text-xs font-semibold text-gray-700">Status</p>
            </div>
            <p className="text-xs text-gray-600">Color indicates opportunity status</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-3 h-3" />
              <p className="text-xs font-semibold text-gray-700">Interactions</p>
            </div>
            <p className="text-xs text-gray-600">Hover for details, click to select</p>
          </div>
        </div>
      )}
    </div>
  );
}
