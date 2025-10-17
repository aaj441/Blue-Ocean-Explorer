import { useEffect, useRef, useState } from "react";
import { Network, Circle } from "lucide-react";

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

export function OpportunityConstellationChart({ opportunities, connections }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);
  const [selectedConnectionType, setSelectedConnectionType] = useState<string | null>(null);
  
  useEffect(() => {
    if (!canvasRef.current || opportunities.length === 0) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const width = canvas.width;
    const height = canvas.height;
    
    // Simple force-directed layout simulation
    const nodes = opportunities.map((opp, i) => ({
      ...opp,
      x: width / 2 + Math.cos(i * 2 * Math.PI / opportunities.length) * 150,
      y: height / 2 + Math.sin(i * 2 * Math.PI / opportunities.length) * 150,
      vx: 0,
      vy: 0,
    }));
    
    const filteredConnections = selectedConnectionType
      ? connections.filter(c => c.connectionType === selectedConnectionType)
      : connections;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw connections
    filteredConnections.forEach(conn => {
      const source = nodes.find(n => n.id === conn.sourceOpportunityId);
      const target = nodes.find(n => n.id === conn.targetOpportunityId);
      
      if (source && target) {
        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);
        ctx.strokeStyle = CONNECTION_COLORS[conn.connectionType] || '#9CA3AF';
        ctx.lineWidth = conn.strength * 3;
        ctx.globalAlpha = 0.4;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    });
    
    // Draw nodes
    nodes.forEach(node => {
      const radius = 5 + (node.score / 100) * 15;
      const isHovered = hoveredNode === node.id;
      
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = STATUS_COLORS[node.status] || '#6B7280';
      ctx.fill();
      
      if (isHovered) {
        ctx.strokeStyle = '#1F2937';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });
  }, [opportunities, connections, hoveredNode, selectedConnectionType]);
  
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
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-600">Connection type:</label>
          <select
            value={selectedConnectionType || ''}
            onChange={(e) => setSelectedConnectionType(e.target.value || null)}
            className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All</option>
            <option value="similar_market">Similar Market</option>
            <option value="complementary">Complementary</option>
            <option value="competitive">Competitive</option>
            <option value="cross_pollination">Cross-Pollination</option>
          </select>
        </div>
      </div>
      
      <div className="relative border border-gray-200 rounded-lg overflow-hidden">
        <canvas
          ref={canvasRef}
          width={800}
          height={400}
          className="w-full bg-gray-50"
        />
      </div>
      
      <div className="grid grid-cols-2 gap-3">
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
      </div>
    </div>
  );
}
