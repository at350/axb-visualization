import React, { useState, useEffect } from 'react';
import { ArrowRight, Minus, Info, RefreshCw } from 'lucide-react';

const LinearSystemVisualizer = () => {
  // Matrix A = [[1, 0.5], [0.5, 0.25]]
  // This maps all inputs onto the line y = 0.5x
  // The null space is the line x + 0.5y = 0  => y = -2x
  
  // State for the target b (scalar magnitude along the output line)
  const [bScalar, setBScalar] = useState(3);
  
  // State for the two solutions x1 and x2 (scalars along the null space direction)
  const [lambda1, setLambda1] = useState(1);
  const [lambda2, setLambda2] = useState(-2);

  // Coordinate system constants
  const VIEWBOX_SIZE = 20;
  const SCALE = 40; // pixels per unit
  const ORIGIN = VIEWBOX_SIZE / 2; // Center in units

  // Helper to transform math coords to SVG coords
  const toSvg = (x, y) => {
    return {
      x: (ORIGIN + x) * SCALE,
      y: (ORIGIN - y) * SCALE
    };
  };

  // Matrix multiplication helper
  const transform = (x, y) => {
    // A = [[1, 0.5], [0.5, 0.25]]
    return {
      x: 1 * x + 0.5 * y,
      y: 0.5 * x + 0.25 * y
    };
  };

  // Calculate vectors based on state
  // Particular solution (simplest vector that hits b)
  // If Ax = b, and b vector is k*[1, 0.5], a simple x is [k, 0]
  // Check: [1, 0.5] * [k, 0]^T = [k, 0.5k]. Correct.
  const xp = { x: bScalar, y: 0 };
  
  // Null space basis vector n = [-0.5, 1] (since 1(-0.5) + 0.5(1) = 0)
  const nullBasis = { x: -0.5, y: 1 };

  // Calculate specific solutions x1 and x2
  // x = xp + lambda * n
  const x1 = {
    x: xp.x + lambda1 * nullBasis.x,
    y: xp.y + lambda1 * nullBasis.y
  };

  const x2 = {
    x: xp.x + lambda2 * nullBasis.x,
    y: xp.y + lambda2 * nullBasis.y
  };

  // Calculate difference vector v = x1 - x2
  const diff = {
    x: x1.x - x2.x,
    y: x1.y - x2.y
  };

  // Transform everything to output space
  const bVec = transform(xp.x, xp.y); // The target b
  const bFromX1 = transform(x1.x, x1.y);
  const bFromX2 = transform(x2.x, x2.y);
  const mappedDiff = transform(diff.x, diff.y); // Should be 0,0

  // --- SVG Drawing Components ---

  const Grid = () => (
    <g stroke="#e5e7eb" strokeWidth="1">
      {/* Vertical lines */}
      {Array.from({ length: VIEWBOX_SIZE + 1 }).map((_, i) => {
        const x = i * SCALE;
        return <line key={`v${i}`} x1={x} y1={0} x2={x} y2={VIEWBOX_SIZE * SCALE} />;
      })}
      {/* Horizontal lines */}
      {Array.from({ length: VIEWBOX_SIZE + 1 }).map((_, i) => {
        const y = i * SCALE;
        return <line key={`h${i}`} x1={0} y1={y} x2={VIEWBOX_SIZE * SCALE} y2={y} />;
      })}
      {/* Axes */}
      <line x1={ORIGIN * SCALE} y1={0} x2={ORIGIN * SCALE} y2={VIEWBOX_SIZE * SCALE} stroke="#9ca3af" strokeWidth="2" />
      <line x1={0} y1={ORIGIN * SCALE} x2={VIEWBOX_SIZE * SCALE} y2={ORIGIN * SCALE} stroke="#9ca3af" strokeWidth="2" />
    </g>
  );

  const Arrow = ({ start, end, color, label, width = 3 }) => {
    const s = toSvg(start.x, start.y);
    const e = toSvg(end.x, end.y);
    // angle for arrowhead
    const angle = Math.atan2(e.y - s.y, e.x - s.x);
    const headLen = 10;
    
    return (
      <g>
        <line x1={s.x} y1={s.y} x2={e.x} y2={e.y} stroke={color} strokeWidth={width} markerEnd={`url(#head-${color})`} />
        {/* Custom arrow head drawing to ensure color matching */}
        <path d={`M ${e.x} ${e.y} L ${e.x - headLen * Math.cos(angle - Math.PI / 6)} ${e.y - headLen * Math.sin(angle - Math.PI / 6)} L ${e.x - headLen * Math.cos(angle + Math.PI / 6)} ${e.y - headLen * Math.sin(angle + Math.PI / 6)} Z`} fill={color} />
        {label && (
          <text x={e.x + 10} y={e.y - 10} fill={color} fontSize="14" fontWeight="bold">{label}</text>
        )}
      </g>
    );
  };

  return (
    <div className="flex flex-col p-4 max-w-6xl mx-auto bg-gray-50 min-h-screen font-sans text-gray-800">
      
      {/* Header */}
      <header className="mb-6 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h1 className="text-2xl font-bold text-indigo-900 mb-2">Visualizing "If Ax=b has solutions, so does Ax=0"</h1>
        <p className="text-gray-600">
          This interactive tool demonstrates that the difference between any two solutions to <span className="font-mono bg-gray-100 px-1 rounded">Ax=b</span> is always a solution to <span className="font-mono bg-gray-100 px-1 rounded">Ax=0</span>.
        </p>
      </header>

      {/* Main Visualization Area */}
      <div className="flex flex-col lg:flex-row gap-6 mb-8">
        
        {/* Left Panel: Input Space */}
        <div className="flex-1 bg-white p-4 rounded-xl shadow-sm border border-gray-200 relative">
          <div className="absolute top-4 left-4 bg-white/90 p-2 rounded border border-gray-200 shadow-sm z-10">
            <h3 className="font-bold text-lg text-gray-800">Input Space (Domain)</h3>
            <div className="text-sm text-gray-500">Where vectors x lives</div>
          </div>
          
          <svg width="100%" viewBox={`0 0 ${VIEWBOX_SIZE * SCALE} ${VIEWBOX_SIZE * SCALE}`} className="w-full aspect-square bg-white rounded border border-gray-100">
            <Grid />
            
            {/* Null Space Line (x + 0.5y = 0 => y = -2x) */}
            {/* Drawn very long to span view */}
            <line 
              x1={toSvg(-5, 10).x} y1={toSvg(-5, 10).y} 
              x2={toSvg(5, -10).x} y2={toSvg(5, -10).y} 
              stroke="#9ca3af" strokeWidth="2" strokeDasharray="5,5" 
            />
            <text x={toSvg(-4, 8).x} y={toSvg(-4, 8).y} fill="#6b7280" fontSize="12" transform="rotate(-63)">Null Space (Ax=0)</text>

            {/* Solution Line (Ax=b) - Parallel to Null Space */}
            <line 
              x1={toSvg(xp.x - 5 * nullBasis.x, xp.y - 5 * nullBasis.y).x} 
              y1={toSvg(xp.x - 5 * nullBasis.x, xp.y - 5 * nullBasis.y).y} 
              x2={toSvg(xp.x + 5 * nullBasis.x, xp.y + 5 * nullBasis.y).x} 
              y2={toSvg(xp.x + 5 * nullBasis.x, xp.y + 5 * nullBasis.y).y} 
              stroke="#3b82f6" strokeWidth="2" opacity="0.3"
            />
             <text x={toSvg(xp.x - 4 * nullBasis.x, xp.y - 4 * nullBasis.y).x} y={toSvg(xp.x - 4 * nullBasis.x, xp.y - 4 * nullBasis.y).y} fill="#3b82f6" fontSize="12" fontWeight="bold">Solution Set (Ax=b)</text>

            {/* Vectors x1 and x2 */}
            <Arrow start={{x:0, y:0}} end={x1} color="#2563eb" label="x1" />
            <Arrow start={{x:0, y:0}} end={x2} color="#059669" label="x2" />

            {/* The Difference Vector (Ghosted between tips) */}
            <line 
              x1={toSvg(x2.x, x2.y).x} y1={toSvg(x2.x, x2.y).y}
              x2={toSvg(x1.x, x1.y).x} y2={toSvg(x1.x, x1.y).y}
              stroke="#ef4444" strokeWidth="2" strokeDasharray="4,2"
            />
            
            {/* The Difference Vector (At Origin) */}
            <Arrow start={{x:0, y:0}} end={diff} color="#ef4444" label="x1 - x2" width={4} />

          </svg>
        </div>

        {/* Middle Panel: Controls & Math */}
        <div className="lg:w-64 flex flex-col gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex-1">
            <h3 className="font-bold text-gray-700 mb-4 border-b pb-2">Controls</h3>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-600 mb-2">Target b (Position)</label>
              <input 
                type="range" min="-4" max="4" step="0.1" 
                value={bScalar} onChange={(e) => setBScalar(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="text-xs text-gray-400 mt-1 text-right">Moves the blue line</div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-blue-600 mb-2">Solution x1</label>
              <input 
                type="range" min="-4" max="4" step="0.1" 
                value={lambda1} onChange={(e) => setLambda1(parseFloat(e.target.value))}
                className="w-full h-2 bg-blue-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-green-600 mb-2">Solution x2</label>
              <input 
                type="range" min="-4" max="4" step="0.1" 
                value={lambda2} onChange={(e) => setLambda2(parseFloat(e.target.value))}
                className="w-full h-2 bg-green-100 rounded-lg appearance-none cursor-pointer accent-green-600"
              />
            </div>

            <div className="mt-4 bg-indigo-50 p-3 rounded text-xs text-indigo-800 border border-indigo-100">
              <p className="font-bold mb-1">Observe:</p>
              <p>As you move <strong>x1</strong> and <strong>x2</strong> along the solution line, the red vector <strong>(x1 - x2)</strong> changes size, but it <em>never leaves the dashed Null Space line</em>.</p>
            </div>
          </div>
        </div>

        {/* Right Panel: Output Space */}
        <div className="flex-1 bg-white p-4 rounded-xl shadow-sm border border-gray-200 relative">
          <div className="absolute top-4 left-4 bg-white/90 p-2 rounded border border-gray-200 shadow-sm z-10">
            <h3 className="font-bold text-lg text-gray-800">Output Space (Codomain)</h3>
            <div className="text-sm text-gray-500">Where vectors map to (Ax)</div>
          </div>

          <svg width="100%" viewBox={`0 0 ${VIEWBOX_SIZE * SCALE} ${VIEWBOX_SIZE * SCALE}`} className="w-full aspect-square bg-white rounded border border-gray-100">
            <Grid />
            
            {/* The Range / Column Space (Line y = 0.5x) */}
            <line 
              x1={toSvg(-10, -5).x} y1={toSvg(-10, -5).y} 
              x2={toSvg(10, 5).x} y2={toSvg(10, 5).y} 
              stroke="#cbd5e1" strokeWidth="4" 
            />
             <text x={toSvg(6, 3.5).x} y={toSvg(6, 3.5).y} fill="#94a3b8" fontSize="12">Column Space</text>

            {/* Target b */}
            <circle cx={toSvg(bVec.x, bVec.y).x} cy={toSvg(bVec.x, bVec.y).y} r="6" fill="#7c3aed" />
            <text x={toSvg(bVec.x, bVec.y).x + 10} y={toSvg(bVec.x, bVec.y).y - 10} fill="#7c3aed" fontWeight="bold">b = Ax1 = Ax2</text>

            {/* Result of difference vector */}
            <circle cx={toSvg(mappedDiff.x, mappedDiff.y).x} cy={toSvg(mappedDiff.x, mappedDiff.y).y} r="5" fill="#ef4444" />
            <text x={toSvg(0,0).x + 10} y={toSvg(0,0).y + 20} fill="#ef4444" fontSize="12" fontWeight="bold">A(x1-x2) = 0</text>

            {/* Annotations */}
            <g transform={`translate(${toSvg(-8, 8).x}, ${toSvg(-8, 8).y})`}>
               <text y="0" fontSize="12" fill="#4b5563">Matrix A squashes everything</text>
               <text y="15" fontSize="12" fill="#4b5563">onto the gray line.</text>
               <text y="40" fontSize="12" fill="#2563eb">x1 maps to b</text>
               <text y="55" fontSize="12" fill="#059669">x2 maps to b</text>
               <text y="70" fontSize="12" fill="#ef4444" fontWeight="bold">x1 - x2 maps to 0</text>
            </g>
          </svg>
        </div>

      </div>

      {/* Explanation Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h4 className="font-bold text-blue-600 mb-2 flex items-center gap-2">
            <ArrowRight size={16} /> 1. Particular Solution
          </h4>
          <p className="text-sm text-gray-600">
            We have a system $Ax=b$. Since there are multiple solutions, they form a line (the blue line in the left graph). Let's call two points on this line $x_1$ and $x_2$.
          </p>
          <div className="mt-2 p-2 bg-gray-50 rounded text-center font-mono text-xs">
            Ax₁ = b <br/> Ax₂ = b
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h4 className="font-bold text-red-500 mb-2 flex items-center gap-2">
            <Minus size={16} /> 2. The Difference
          </h4>
          <p className="text-sm text-gray-600">
            What happens if we subtract them? By the linearity of matrix multiplication:
          </p>
          <div className="mt-2 p-2 bg-gray-50 rounded text-center font-mono text-xs">
            A(x₁ - x₂) = Ax₁ - Ax₂ <br/>
            = b - b <br/>
            = 0
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h4 className="font-bold text-gray-700 mb-2 flex items-center gap-2">
            <RefreshCw size={16} /> 3. Homogeneous Solution
          </h4>
          <p className="text-sm text-gray-600">
            The result 0 means that the vector $(x_1 - x_2)$ is a solution to the system $Ax=0$. This is why the red arrow always lies on the dashed Null Space line.
          </p>
        </div>
      </div>

    </div>
  );
};

export default LinearSystemVisualizer;