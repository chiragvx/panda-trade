import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useSelectionStore } from '../../store/useStore';
import { COLOR, TYPE, BORDER } from '../../ds/tokens';
import { Globe, Crosshair, Zap, Radar, Shield, Info, Activity } from 'lucide-react';

const CESIUM_JS_URL = 'https://cesium.com/downloads/cesiumjs/releases/1.121/Build/Cesium/Cesium.js';
const CESIUM_CSS_URL = 'https://cesium.com/downloads/cesiumjs/releases/1.121/Build/Cesium/Widgets/widgets.css';

export const OSINTWidget: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const viewerRef = useRef<any>(null);
    const [libLoaded, setLibLoaded] = useState(false);
    const { selectedSymbol } = useSelectionStore();

    useEffect(() => {
        if ((window as any).Cesium) {
            setLibLoaded(true);
            return;
        }

        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = CESIUM_CSS_URL;
        document.head.appendChild(link);

        const script = document.createElement('script');
        script.src = CESIUM_JS_URL;
        script.onload = () => setLibLoaded(true);
        document.head.appendChild(script);

        return () => {
            // Usually don't remove global scripts but we can
        };
    }, []);

    useEffect(() => {
        if (!libLoaded || !containerRef.current || viewerRef.current) return;

        const Cesium = (window as any).Cesium;
        
        // Provide OSM as a default to avoid "all black" missing ION token issues
        const osmProvider = new Cesium.OpenStreetMapImageryProvider({
            url : 'https://a.tile.openstreetmap.org/'
        });

        viewerRef.current = new Cesium.Viewer(containerRef.current, {
            imageryProvider: osmProvider,
            animation: false,
            timeline: false,
            baseLayerPicker: false,
            navigationHelpButton: false,
            geocoder: false,
            homeButton: false,
            sceneModePicker: true,
            selectionIndicator: false,
            infoBox: false,
            shouldAnimate: true
        });

        viewerRef.current.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(78.9629, 20.5937, 20000000), // Central Asia/India overview
            duration: 0
        });

        // Mock OSINT Data: Freight Terminals & Global Ports
        const ports = [
            { name: "Port of Singapore", lat: 1.25, lon: 103.83, activity: 92 },
            { name: "Port of Shanghai", lat: 31.23, lon: 121.47, activity: 98 },
            { name: "Port of Rotterdam", lat: 51.92, lon: 4.47, activity: 85 },
            { name: "Port of Mumbai", lat: 18.94, lon: 72.84, activity: 76 }
        ];

        ports.forEach(p => {
            viewerRef.current.entities.add({
                position: Cesium.Cartesian3.fromDegrees(p.lon, p.lat),
                point: { pixelSize: 8, color: Cesium.Color.DARKORANGE, outlineColor: Cesium.Color.BLACK, outlineWidth: 1 },
                label: {
                    text: `${p.name}\nACTIVITY: ${p.activity}%`,
                    font: '9px "JetBrains Mono"',
                    fillColor: Cesium.Color.WHITE,
                    outlineColor: Cesium.Color.BLACK,
                    outlineWidth: 2,
                    style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                    verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                    pixelOffset: new Cesium.Cartesian2(0, -10)
                }
            });
        });

        // Add some "Live" flight paths
        for(let i=0; i<5; i++) {
            const startLon = 70 + Math.random()*20;
            const startLat = 15 + Math.random()*15;
            const endLon = 100 + Math.random()*20;
            const endLat = 25 + Math.random()*10;
            
            viewerRef.current.entities.add({
                polyline: {
                    positions: Cesium.Cartesian3.fromDegreesArrayHeights([
                        startLon, startLat, 5000,
                        endLon, endLat, 5000
                    ]),
                    width: 1,
                    material: new Cesium.PolylineDashMaterialProperty({ color: Cesium.Color.SPRINGGREEN.withAlpha(0.3) })
                }
            });
        }

        return () => {
            if (viewerRef.current) {
                viewerRef.current.destroy();
                viewerRef.current = null;
            }
        };
    }, [libLoaded]);

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#000', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ padding: '10px 16px', borderBottom: BORDER.standard, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#080808' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Globe size={14} color={COLOR.semantic.info} />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '10px', fontWeight: '900', letterSpacing: '0.15em', color: '#FFF' }}>OSINT COMMAND CENTER</span>
                        <span style={{ fontSize: '8px', color: COLOR.text.muted, fontFamily: TYPE.family.mono }}>GEOSPATIAL INTELLIGENCE & LOGISTICS</span>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Radar size={12} color={COLOR.semantic.up} className="animate-pulse" />
                        <span style={{ fontSize: '9px', color: COLOR.text.muted, fontWeight: 'bold' }}>SCAN: ACTIVE</span>
                    </div>
                </div>
            </div>

            <div style={{ flex: 1, position: 'relative' }}>
                {!libLoaded && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', background: '#000', zIndex: 10 }}>
                        <Activity className="animate-spin" color={COLOR.semantic.info} />
                        <span style={{ fontSize: '10px', color: COLOR.text.muted, fontFamily: TYPE.family.mono }}>INITIALIZING 3D CESIUM ENGINE...</span>
                    </div>
                )}
                <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

                {/* Tracking Overlay */}
                <div style={{ position: 'absolute', top: '12px', left: '12px', width: '180px', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', border: BORDER.standard, padding: '10px', pointerEvents: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                        <Shield size={12} color={COLOR.semantic.info} />
                        <span style={{ fontSize: '9px', fontWeight: 'bold', color: COLOR.text.secondary }}>DATA FEED: GLOBAL_VFS</span>
                    </div>
                    {[
                        { label: 'TRANSIT_INDEX', val: '98.2', status: 'STABLE' },
                        { label: 'PORT_CONGESTION', val: 'HIGH', status: 'VOLATILE' },
                        { label: 'OIL_FLOW_EST', val: '2.4M', status: 'UP' }
                    ].map(d => (
                        <div key={d.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ fontSize: '8px', color: COLOR.text.muted }}>{d.label}</span>
                            <span style={{ fontSize: '9px', color: '#FFF', fontWeight: 'bold', fontFamily: TYPE.family.mono }}>{d.val}</span>
                        </div>
                    ))}
                </div>

                {/* Interaction Instruction */}
                <div style={{ position: 'absolute', bottom: '12px', right: '12px', fontSize: '8px', color: COLOR.text.muted, fontFamily: TYPE.family.mono, background: 'rgba(0,0,0,0.5)', padding: '2px 6px' }}>
                    DRAG: ROTATE | CTRL+DRAG: TILT | SCROLL: ZOOM
                </div>
            </div>
        </div>
    );
};
