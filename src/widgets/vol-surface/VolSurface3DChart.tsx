import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { Canvas, useFrame, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Html, Text, Grid, Center, Plane, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { SurfacePoint } from './useVolSurfaceData';
import { COLOR, TYPE, BORDER } from '../../ds/tokens';

interface VolSurface3DChartProps {
  data: SurfacePoint[];
  hv?: { hv30: number; hv60: number };
  showHV?: boolean;
  optionSide: 'CE' | 'PE' | 'BOTH';
  isWireframe: boolean;
  isSmooth: boolean;
}

const heightScale = 0.5;
const width = 100;
const depth = 100;

const SurfaceMesh: React.FC<{ 
  points: SurfacePoint[], 
  side: 'CE' | 'PE' | 'BOTH', 
  wireframe: boolean, 
  smooth: boolean,
  onPointerMove: (e: any) => void,
  onPointerOut: () => void
}> = ({ points, side, wireframe, smooth, onPointerMove, onPointerOut }) => {
  
  const { geometry } = useMemo(() => {
    const list = points.filter(p => {
        if (side === 'BOTH') return p.iv > 0;
        return p.type === side && p.iv > 0;
    });

    if (list.length < 5) return { geometry: null };

    const minS = Math.min(...list.map(p => p.strike));
    const maxS = Math.max(...list.map(p => p.strike));
    const rangeS = maxS - minS || 1;

    const minT = Math.min(...list.map(p => p.tte));
    const maxT = Math.max(...list.map(p => p.tte));
    const rangeT = maxT - minT || 1;

    // Adjust resolution based on smooth mode
    const RESOLUTION = smooth ? 32 : Math.min(20, Math.floor(Math.sqrt(list.length)));
    
    const geo = new THREE.BufferGeometry();
    const vertices: number[] = [];
    const colors: number[] = [];
    const indices: number[] = [];

    for (let j = 0; j <= RESOLUTION; j++) {
        for (let i = 0; i <= RESOLUTION; i++) {
            const strikeNorm = i / RESOLUTION;
            const tteNorm = j / RESOLUTION;
            const s = minS + strikeNorm * rangeS;
            const t = minT + tteNorm * rangeT;

            let iv = 0;
            if (smooth) {
                let weightSum = 0;
                let ivSum = 0;
                list.forEach(p => {
                    const distS = (p.strike - s) / rangeS;
                    const distT = (p.tte - t) / rangeT;
                    const d2 = distS * distS + distT * distT + 0.0001;
                    const w = 1 / Math.pow(d2, 1.5);
                    ivSum += p.iv * w;
                    weightSum += w;
                });
                iv = ivSum / weightSum;
            } else {
                // Nearest neighbor for "Raw" look
                let nearest = list[0];
                let minDist = Infinity;
                list.forEach(p => {
                    const d = Math.abs(p.strike - s) / rangeS + Math.abs(p.tte - t) / rangeT;
                    if (d < minDist) { minDist = d; nearest = p; }
                });
                iv = nearest.iv;
            }

            const x = strikeNorm * width - width / 2;
            const y = tteNorm * depth - depth / 2;
            const z = iv * heightScale;
            vertices.push(x, z, y);

            const color = new THREE.Color();
            if (iv < 20) color.setHSL(0.5, 0.8, 0.5); // Cyan (Low)
            else if (iv < 40) color.setHSL(0.35, 0.8, 0.5); // Green (Mid)
            else color.setHSL(0.65, 0.8, 0.5); // Deep Blue (High)
            colors.push(color.r, color.g, color.b);
        }
    }

    const rowPoints = RESOLUTION + 1;
    for (let j = 0; j < RESOLUTION; j++) {
        for (let i = 0; i < RESOLUTION; i++) {
            const a = j * rowPoints + i;
            const b = j * rowPoints + (i + 1);
            const c = (j + 1) * rowPoints + i;
            const d = (j + 1) * rowPoints + (i + 1);
            indices.push(a, c, b);
            indices.push(b, c, d);
        }
    }

    geo.setIndex(indices);
    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    return { geometry: geo };
  }, [points, side, smooth]);

  if (!geometry) return null;

  return (
    <mesh 
        geometry={geometry} 
        onPointerMove={onPointerMove}
        onPointerOut={onPointerOut}
    >
      <meshStandardMaterial 
        vertexColors 
        side={THREE.DoubleSide} 
        roughness={0.4} 
        metalness={0.1} 
        wireframe={wireframe}
      />
    </mesh>
  );
};

const AxisTicks: React.FC<{ points: SurfacePoint[] }> = ({ points }) => {
    return useMemo(() => {
        if (points.length === 0) return null;
        const minS = Math.min(...points.map(p => p.strike));
        const maxS = Math.max(...points.map(p => p.strike));
        const rangeS = maxS - minS || 1;

        const strikes = [0, 0.25, 0.5, 0.75, 1].map(v => ({
            val: Math.round(minS + v * rangeS),
            pos: v * width - width / 2
        }));

        const expiries = Array.from(new Set(points.map(p => p.expiry))).map(e => {
            const p = points.find(x => x.expiry === e)!;
            const tMin = Math.min(...points.map(x => x.tte));
            const tMax = Math.max(...points.map(x => x.tte));
            return {
                label: `${Math.round(p.tte * 365)}D`,
                pos: ((p.tte - tMin) / (tMax - tMin || 1)) * depth - depth / 2
            };
        }).sort((a,b) => a.pos - b.pos).filter((_, i, self) => i % Math.max(1, Math.floor(self.length / 5)) === 0);

        return (
            <group position={[0, -0.5, 0]}>
                {/* Strike Ticks (X-axis) */}
                {strikes.map((s, i) => (
                    <Billboard key={`s-${i}`} position={[s.pos, -6, 60]}>
                        <Text fontSize={3} color="#666">{s.val}</Text>
                    </Billboard>
                ))}
                
                {/* Time Ticks (Z-axis) */}
                {expiries.map((e, i) => (
                    <Billboard key={`e-${i}`} position={[-60, -6, e.pos]}>
                        <Text fontSize={3} color="#666">{e.label}</Text>
                    </Billboard>
                ))}

                {[20, 40, 60, 80].map(iv => (
                    <group key={iv} position={[0, iv * heightScale, 0]}>
                        <Text position={[-58, 0, -58]} fontSize={2.5} color="#555" fillOpacity={0.6}>{iv}%</Text>
                        <Plane args={[115, 115]} rotation={[-Math.PI / 2, 0, 0]}>
                            <meshBasicMaterial color="#222" transparent opacity={0.03} side={THREE.DoubleSide} />
                        </Plane>
                    </group>
                ))}
            </group>
        );
    }, [points]);
};

export const VolSurface3DChart: React.FC<VolSurface3DChartProps> = ({ 
  data, 
  hv, 
  showHV,
  optionSide,
  isWireframe,
  isSmooth
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<any>(null);
  const orbitRef = useRef<any>(null);

  const handlePointerMove = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const { point } = e;
    // Find closest original data point
    let closest = data[0];
    let minDist = Infinity;
    data.forEach(p => {
        // Map normalized coordinates to points
        const minS = Math.min(...data.map(x => x.strike));
        const maxS = Math.max(...data.map(x => x.strike));
        const minT = Math.min(...data.map(x => x.tte));
        const maxT = Math.max(...data.map(x => x.tte));
        
        const x = ((p.strike - minS) / (maxS - minS || 1)) * width - width / 2;
        const y = ((p.tte - minT) / (maxT - minT || 1)) * depth - depth / 2;
        const z = p.iv * heightScale;
        
        const d = Math.sqrt((x - point.x)**2 + (z - point.y)**2 + (y - point.z)**2);
        if (d < minDist) { minDist = d; closest = p; }
    });

    if (minDist < 10) {
        setHoveredPoint({ ...closest, pos: point });
    } else {
        setHoveredPoint(null);
    }
  }, [data]);

  useEffect(() => {
    const handleReset = () => {
        if (orbitRef.current) orbitRef.current.reset();
    };
    window.addEventListener('RESET_VOL_CAMERA', handleReset);
    return () => window.removeEventListener('RESET_VOL_CAMERA', handleReset);
  }, []);

  return (
    <div style={{ width: '100%', height: '100%', background: '#000' }}>
      <Canvas shadows dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[120, 100, 120]} fov={45} />
        <OrbitControls ref={orbitRef} enableDamping dampingFactor={0.05} />
        
        <ambientLight intensity={0.6} />
        <pointLight position={[100, 150, 100]} intensity={2} />
        <directionalLight position={[-100, 100, -100]} intensity={1} color="#88aaff" />
        <hemisphereLight intensity={0.4} groundColor="#112233" />

        <Center top>
          <SurfaceMesh 
            points={data} 
            side={optionSide} 
            wireframe={isWireframe} 
            smooth={isSmooth}
            onPointerMove={handlePointerMove}
            onPointerOut={() => setHoveredPoint(null)}
          />
          
          {hoveredPoint && (
              <group position={[hoveredPoint.pos.x, hoveredPoint.pos.y, hoveredPoint.pos.z]}>
                  <mesh>
                      <sphereGeometry args={[1, 16, 16]} />
                      <meshBasicMaterial color="#fff" />
                  </mesh>
                  <Html distanceFactor={10} position={[0, 4, 0]}>
                      <div style={{ 
                          background: 'rgba(0,0,0,0.9)', 
                          color: '#fff', 
                          padding: '8px 12px', 
                          border: `1px solid ${COLOR.semantic.info}`, 
                          borderRadius: '4px',
                          fontSize: '11px',
                          whiteSpace: 'nowrap',
                          pointerEvents: 'none',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                      }}>
                          <div style={{ fontWeight: 'bold', color: COLOR.semantic.info, marginBottom: '4px' }}>{hoveredPoint.type} SURFACE</div>
                          <div>STRIKE: <span style={{ color: '#fff' }}>{hoveredPoint.strike.toLocaleString()}</span></div>
                          <div>EXPIRY: <span style={{ color: '#fff' }}>{hoveredPoint.expiry}</span></div>
                          <div style={{ marginTop: '4px', borderTop: '1px solid #333', paddingTop: '4px' }}>
                            IV%: <span style={{ color: COLOR.semantic.up, fontWeight: 'bold' }}>{hoveredPoint.iv.toFixed(2)}%</span>
                          </div>
                      </div>
                  </Html>
              </group>
          )}

          <AxisTicks points={data} />

          {showHV && hv && (
              <>
                  <HVPlane value={hv.hv30} color={COLOR.semantic.info} label="HV-30" />
                  <HVPlane value={hv.hv60} color={COLOR.semantic.up} label="HV-60" />
              </>
          )}
          
          <Billboard position={[0, -25, 80]}>
             <Text fontSize={5} color="#aaa" fontWeight="bold">STRIKE PRICE (S)</Text>
          </Billboard>
          <Billboard position={[-85, -25, 0]}>
             <Text fontSize={5} color="#aaa" fontWeight="bold">TIME TO MATURITY (T)</Text>
          </Billboard>

          <Grid position={[0, -0.5, 0]} args={[120, 120]} sectionSize={20} sectionColor="#333" cellColor="#111" infiniteGrid={false} />
          <BoxHelper size={120} />
        </Center>
      </Canvas>
    </div>
  );
};

const HVPlane: React.FC<{ value: number; color: string; label: string }> = ({ value, color, label }) => {
    const height = value * heightScale;
    return (
        <group position={[0, height, 0]}>
            <Plane args={[115, 115]} rotation={[-Math.PI / 2, 0, 0]}>
                <meshBasicMaterial color={color} transparent opacity={0.08} side={THREE.DoubleSide} />
            </Plane>
            <Billboard position={[60, 0, 0]}>
                <Text fontSize={3} color={color} fontWeight="bold">
                    {label}: {value.toFixed(1)}%
                </Text>
            </Billboard>
        </group>
    );
};

const BoxHelper: React.FC<{ size: number }> = ({ size }) => {
    const box = useMemo(() => new THREE.BoxGeometry(size, size, size), [size]);
    return (
        <group position={[0, size/2 - 0.5, 0]}>
            <lineSegments>
                <edgesGeometry attach="geometry" args={[box]} />
                <lineBasicMaterial attach="material" color="#222" transparent opacity={0.2} />
            </lineSegments>
        </group>
    );
};
