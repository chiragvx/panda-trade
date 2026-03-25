import React, { useState, useEffect, useRef } from 'react';
// @ts-ignore
import easterAsset from '../../assets/easter-egg/easteregg1.mp4';

export const DVDEasterEgg: React.FC = () => {
    const assetRef = useRef<any>(null);
    const [pos, setPos] = useState({ x: 200, y: 200 }); 
    const [vel, setVel] = useState({ dx: 1.5, dy: 1.5 });
    const width = 288;
    const [height, setHeight] = useState(162); 

    const isGif = typeof easterAsset === 'string' && easterAsset.endsWith('.gif');

    useEffect(() => {
        let animationFrame: number;
        let lastTime = performance.now();
        
        const update = (time: number) => {
            const dt = (time - lastTime) / 10;
            lastTime = time;

            setPos((prev) => {
                let nextX = prev.x + vel.dx * dt;
                let nextY = prev.y + vel.dy * dt;
                let nextDx = vel.dx;
                let nextDy = vel.dy;

                if (nextX <= 0) { nextDx = Math.abs(vel.dx); nextX = 0; }
                else if (nextX + width >= window.innerWidth) { nextDx = -Math.abs(vel.dx); nextX = window.innerWidth - width; }

                if (nextY <= 0) { nextDy = Math.abs(vel.dy); nextY = 0; }
                else if (nextY + height >= window.innerHeight) { nextDy = -Math.abs(vel.dy); nextY = window.innerHeight - height; }

                if (nextDx !== vel.dx || nextDy !== vel.dy) setVel({ dx: nextDx, dy: nextDy });
                return { x: nextX, y: nextY };
            });

            animationFrame = requestAnimationFrame(update);
        };

        animationFrame = requestAnimationFrame(update);
        return () => cancelAnimationFrame(animationFrame);
    }, [vel, height]);

    const handleLoad = (e: any) => {
        const target = e.currentTarget;
        const h = target.videoHeight || target.naturalHeight;
        const w = target.videoWidth || target.naturalWidth;
        setHeight(width * (h / w));
        if (target.play) target.play().catch(() => {});
    };

    return (
        <div style={{
            position: 'fixed',
            left: pos.x,
            top: pos.y,
            width: `${width}px`,
            zIndex: 9999999,
            pointerEvents: 'none',
            boxShadow: '0 0 80px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.05)',
            background: '#000',
            borderRadius: '2px',
            overflow: 'hidden'
        }}>
            {isGif ? (
                <img 
                    src={easterAsset} 
                    alt="easter egg"
                    onLoad={handleLoad}
                    style={{ width: '100%', height: 'auto', display: 'block' }}
                />
            ) : (
                <video
                    ref={assetRef}
                    src={easterAsset}
                    autoPlay
                    muted
                    loop
                    playsInline
                    style={{ width: '100%', height: 'auto', display: 'block' }}
                    onLoadedMetadata={handleLoad}
                />
            )}
        </div>
    );
};
