import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Html, Text, Grid, Center, Plane, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { SurfacePoint } from './useVolSurfaceData';
import { COLOR, TYPE } from '../../ds/tokens';

interface VolSurface3DChartProps {
  data: SurfacePoint[];
  hv?: { hv30: number; hv60: number };
  showHV?: boolean;
}

const SurfaceMesh: React.FC<{ points: SurfacePoint[] }> = ({ points }) => {
  // 1. Group by expiry and sort by strike
  const groups = useMemo(() => {
    const list = points.filter(p => p.type === 'CE'); // Just CE for surface (Standard approach)
    if (list.length === 0) return [];
    const gr = new Map<string, SurfacePoint[]>();
    list.forEach(p => {
      const g = gr.get(p.expiry) || [];
      g.push(p);
      gr.set(p.expiry, g);
    });
    return Array.from(gr.values()).sort((a, b) => a[0].tte - b[0].tte);
  }, [points]);

  if (groups.length < 2) return null;

  const width = 100;
  const depth = 100;
  const heightScale = 0.5; // Scaler for IV height

  // Normalize strikes and TTE to [0, 100]
  const minStrike = Math.min(...points.map(p => p.strike));
  const maxStrike = Math.max(...points.map(p => p.strike));
  const strikeRange = maxStrike - minStrike;
  
  const minTTE = Math.min(...points.map(p => p.tte));
  const maxTTE = Math.max(...points.map(p => p.tte));
  const tteRange = maxTTE - minTTE;

  // Create Vertex and Index geometry
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const vertices: number[] = [];
    const colors: number[] = [];
    const indices: number[] = [];

    const numExp = groups.length;
    
    groups.forEach((expGroup, yIdx) => {
        const sorted = expGroup.sort((a, b) => a.strike - b.strike);
        sorted.forEach((p, xIdx) => {
            const x = ((p.strike - minStrike) / strikeRange) * width - width / 2;
            const y = ((p.tte - minTTE) / tteRange) * depth - depth / 2;
            const z = p.iv * heightScale;

            vertices.push(x, z, y);

            // Color gradient (Blue -> Yellow -> Red)
            const color = new THREE.Color().setHSL(0.5 - (p.iv / 100) * 0.5, 1, 0.5);
            colors.push(color.r, color.g, color.b);
        });
    });

    const numStrikes = groups[0].length;
    for (let y = 0; y < numExp - 1; y++) {
        for (let x = 0; x < numStrikes - 1; x++) {
            const a = y * numStrikes + x;
            const b = y * numStrikes + (x + 1);
            const c = (y + 1) * numStrikes + x;
            const d = (y + 1) * numStrikes + (x + 1);

            indices.push(a, c, b);
            indices.push(b, c, d);
        }
    }

    geo.setIndex(indices);
    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    return geo;
  }, [groups]);

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial vertexColors side={THREE.DoubleSide} wireframe={false} roughness={0.6} metalness={0.2} transparent opacity={0.9} />
    </mesh>
  );
};

const HVPlane: React.FC<{ value: number; color: string; label: string }> = ({ value, color, label }) => {
    const height = value * 0.5; // heightScale from above
    return (
        <group position={[0, height, 0]}>
            <Plane args={[100, 100]} rotation={[-Math.PI / 2, 0, 0]}>
                <meshBasicMaterial color={color} transparent opacity={0.15} side={THREE.DoubleSide} />
            </Plane>
            <Billboard position={[55, 0, 0]}>
                <Text fontSize={3} color={color} font={TYPE.family.mono}>
                    {label}: {value.toFixed(1)}%
                </Text>
            </Billboard>
        </group>
    );
};

export const VolSurface3DChart: React.FC<VolSurface3DChartProps> = ({ data, hv, showHV }) => {
  return (
    <div style={{ width: '100%', height: '100%', background: '#000' }}>
      <Canvas shadows dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[120, 80, 120]} fov={50} />
        <OrbitControls enablePan={true} enableDamping />
        
        <ambientLight intensity={0.5} />
        <pointLight position={[100, 100, 100]} intensity={1} />
        <spotLight position={[-100, 100, -100]} angle={0.15} penumbra={1} intensity={1} castShadow />

        <Center top>
          <SurfaceMesh points={data} />
          {showHV && hv && (
              <>
                  <HVPlane value={hv.hv30} color={COLOR.semantic.info} label="HV-30" />
                  <HVPlane value={hv.hv60} color={COLOR.semantic.up} label="HV-60" />
              </>
          )}
          
          {/* Axis Labels */}
          <Billboard position={[0, -10, 60]}>
             <Text fontSize={5} color="#666">EXPIRES (Y)</Text>
          </Billboard>
          <Billboard position={[60, -10, 0]}>
             <Text fontSize={5} color="#666">STRIKE (X)</Text>
          </Billboard>
          <Billboard position={[-60, 40, -60]}>
             <Text fontSize={6} color={COLOR.semantic.up} rotation={[0, Math.PI / 4, 0]}>IV% (Z)</Text>
          </Billboard>

          {/* Grid Helper */}
          <Grid position={[0, -0.1, 0]} args={[120, 120]} sectionSize={10} sectionColor="#111" cellColor="#050505" fadeDistance={200} infiniteGrid />
        </Center>

      </Canvas>
    </div>
  );
};
