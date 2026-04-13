import React, { useMemo, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Grid, Center, GizmoHelper, GizmoViewport } from '@react-three/drei';
import * as THREE from 'three';
import { SurfacePoint } from './useVolSurfaceData';
import { COLOR, TYPE } from '../../ds/tokens';

interface VolSurface3DChartProps {
  data: SurfacePoint[];
  hv?: { hv30: number; hv60: number };
  showHV?: boolean;
  optionSide: 'CE' | 'PE' | 'BOTH';
  isWireframe: boolean;
  isSmooth: boolean;
}

const RESOLUTION = 24; // Lower resolution for stability
const SCALE = 0.4;

const Surface: React.FC<{ data: SurfacePoint[], side: string, wireframe: boolean }> = ({ data, side, wireframe }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  const points = useMemo(() => {
    return data.filter(p => (side === 'BOTH' || p.type === side) && p.iv > 0);
  }, [data, side]);

  const { geometry, stats } = useMemo(() => {
    if (points.length < 4) return { geometry: null, stats: null };

    const minX = Math.min(...points.map(p => p.strike));
    const maxX = Math.max(...points.map(p => p.strike));
    const minZ = Math.min(...points.map(p => p.tte));
    const maxZ = Math.max(...points.map(p => p.tte));
    const rx = maxX - minX || 1;
    const rz = maxZ - minZ || 1;

    const geo = new THREE.PlaneGeometry(100, 100, RESOLUTION - 1, RESOLUTION - 1);
    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);

    for (let i = 0; i < pos.count; i++) {
      const px = (pos.getX(i) + 50) / 100; // 0 to 1
      const pz = (pos.getY(i) + 50) / 100; // 0 to 1 (Plane is on XY by default, we'll rotate)

      const strike = minX + px * rx;
      const tte = minZ + pz * rz;

      // Simple Inverse Distance Weighting (IDW)
      let wSum = 0;
      let vSum = 0;
      points.forEach(p => {
        const dx = (p.strike - strike) / rx;
        const dz = (p.tte - tte) / rz;
        const d2 = dx * dx + dz * dz + 0.001;
        const w = 1 / d2;
        vSum += p.iv * w;
        wSum += w;
      });

      const iv = vSum / wSum;
      pos.setZ(i, iv * SCALE); // Displace Z

      // Color mapping
      const color = new THREE.Color();
      // Cold to Hot (Blue -> Cyan -> green -> Yellow -> Red)
      const h = (1 - Math.min(1, iv / 100)) * 0.7; // 0.7 (Blue) to 0 (Red)
      color.setHSL(h, 0.8, 0.5);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    return { geometry: geo, stats: { minX, maxX, minZ, maxZ } };
  }, [points]);

  if (!geometry) return null;

  return (
    <group rotation={[-Math.PI / 2, 0, 0]}>
      <mesh ref={meshRef} geometry={geometry}>
        <meshPhongMaterial 
           vertexColors 
           side={THREE.DoubleSide} 
           wireframe={wireframe} 
           flatShading={!wireframe}
           shininess={30}
           transparent
           opacity={0.9}
        />
      </mesh>
    </group>
  );
};

export const VolSurface3DChart: React.FC<VolSurface3DChartProps> = ({ data, optionSide, isWireframe }) => {
  return (
    <div style={{ width: '100%', height: '100%', background: COLOR.bg.base, position: 'relative' }}>
      <Canvas shadows dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[120, 120, 120]} fov={40} />
        <OrbitControls makeDefault enableDamping dampingFactor={0.1} />
        
        <ambientLight intensity={0.4} />
        <pointLight position={[100, 100, 100]} intensity={1} castShadow />
        <pointLight position={[-100, 50, -100]} intensity={0.5} color="#4477ff" />

        <Center top>
          <Surface data={data} side={optionSide} wireframe={isWireframe} />
        </Center>

        <Grid
          infiniteGrid
          fadeDistance={300}
          fadeStrength={5}
          cellSize={10}
          sectionSize={50}
          sectionThickness={1}
          sectionColor={COLOR.bg.border}
          cellColor={COLOR.bg.elevated}
        />

        <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
          <GizmoViewport axisColors={['#ff3b57', '#00d084', '#0070f3']} labelColor="white" />
        </GizmoHelper>
      </Canvas>

      <div style={{ position: 'absolute', top: '12px', left: '12px', pointerEvents: 'none' }}>
         <div style={{ fontSize: TYPE.size.xs, color: COLOR.text.muted, fontFamily: TYPE.family.mono, letterSpacing: TYPE.letterSpacing.caps, fontWeight: TYPE.weight.black, lineHeight: '1.6' }}>
            Y: IMPLIED_VOLATILITY (%) <br/>
            X: STRIKE_PRICE <br/>
            Z: TIME_TO_EXPIRY (YRS)
         </div>
      </div>
    </div>
  );
};
