import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Trophy, RefreshCw, Zap } from 'lucide-react';
import { useWatchlistStore } from '../../store/useStore';
import { useUpstoxStore } from '../../store/useUpstoxStore';
import { getTickerFromInstrumentKey } from '../../utils/liveSymbols';

const GRID_SIZE = 20;
const INITIAL_SPEED = 150;

export const SnakeGame: React.FC = () => {
    const { instrumentKeys } = useWatchlistStore();
    const { prices } = useUpstoxStore();
    const [snake, setSnake] = useState([{ x: 10, y: 10 }]);
    const [food, setFood] = useState({ x: 5, y: 5, symbol: '---' });
    const [direction, setDirection] = useState({ x: 0, y: -1 });
    const [gameOver, setGameOver] = useState(false);
    const [score, setScore] = useState(0);
    const [speed, setSpeed] = useState(INITIAL_SPEED);
    const gameContainerRef = useRef<HTMLDivElement>(null);

    const generateFood = useCallback(() => {
        const x = Math.floor(Math.random() * GRID_SIZE);
        const y = Math.floor(Math.random() * GRID_SIZE);
        const tickers = instrumentKeys.length > 0
            ? instrumentKeys.map(getTickerFromInstrumentKey)
            : Object.keys(prices).map(getTickerFromInstrumentKey);
        const symbol = tickers.length > 0
            ? tickers[Math.floor(Math.random() * tickers.length)]
            : '---';
        setFood({ x, y, symbol });
    }, [instrumentKeys, prices]);

    const moveSnake = useCallback(() => {
        if (gameOver) return;

        const newSnake = [...snake];
        const head = { x: newSnake[0].x + direction.x, y: newSnake[0].y + direction.y };

        // Wall collision
        if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
            setGameOver(true);
            return;
        }

        // Self collision
        if (newSnake.some(s => s.x === head.x && s.y === head.y)) {
            setGameOver(true);
            return;
        }

        newSnake.unshift(head);

        // Food collision
        if (head.x === food.x && head.y === food.y) {
            setScore(s => s + 1);
            if ((score + 1) % 5 === 0) setSpeed(prev => Math.max(50, prev - 10));
            generateFood();
        } else {
            newSnake.pop();
        }

        setSnake(newSnake);
    }, [snake, direction, food, gameOver, score, generateFood]);

    useEffect(() => {
        const interval = setInterval(moveSnake, speed);
        return () => clearInterval(interval);
    }, [moveSnake, speed]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            switch (e.key) {
                case 'ArrowUp': if (direction.y === 0) setDirection({ x: 0, y: -1 }); break;
                case 'ArrowDown': if (direction.y === 0) setDirection({ x: 0, y: 1 }); break;
                case 'ArrowLeft': if (direction.x === 0) setDirection({ x: -1, y: 0 }); break;
                case 'ArrowRight': if (direction.x === 0) setDirection({ x: 1, y: 0 }); break;
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [direction]);

    const resetGame = () => {
        setSnake([{ x: 10, y: 10 }]);
        setDirection({ x: 0, y: -1 });
        setGameOver(false);
        setScore(0);
        setSpeed(INITIAL_SPEED);
        generateFood();
    };

    return (
        <div className="flex flex-col h-full bg-bg-primary items-center justify-center p-4 select-none outline-none" tabIndex={0} ref={gameContainerRef}>
            <div className="mb-4 flex items-center justify-between w-full max-w-[300px]">
                <div className="flex items-center space-x-2">
                    <Trophy size={16} className="text-accent-teal" />
                    <span className="text-sm font-black text-text-primary uppercase tracking-widest">{score}</span>
                </div>
                <div className="flex items-center space-x-2 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">
                    <Zap size={14} className="text-accent-green" />
                    <span>Speed: {speed}ms</span>
                </div>
            </div>

            <div 
                className="relative bg-bg-secondary border-2 border-border/50 rounded-xl overflow-hidden shadow-2xl"
                style={{ width: GRID_SIZE * 15, height: GRID_SIZE * 15 }}
            >
                {snake.map((p, i) => (
                    <div 
                        key={i} 
                        className={`absolute rounded-sm transition-all duration-100 ${i === 0 ? 'bg-accent-teal' : 'bg-accent-teal/60'}`}
                        style={{ left: p.x * 15, top: p.y * 15, width: 14, height: 14 }}
                    />
                ))}
                <div 
                    className="absolute bg-accent-red rounded-sm flex items-center justify-center text-[7px] font-black text-white p-0.5 leading-none shadow-lg shadow-accent-red/40"
                    style={{ left: food.x * 15, top: food.y * 15, width: 14, height: 14 }}
                >
                    {food.symbol.slice(0, 3)}
                </div>

                {gameOver && (
                    <div className="absolute inset-0 bg-bg-primary/80 backdrop-blur-sm flex flex-col items-center justify-center space-y-4 animate-in fade-in zoom-in duration-300">
                        <h2 className="text-xl font-black text-accent-red uppercase tracking-[0.3em]">Margin Call</h2>
                        <p className="text-[10px] text-text-muted font-black uppercase tracking-widest italic">Game Over</p>
                        <button onClick={resetGame} className="flex items-center space-x-2 bg-text-primary text-bg-primary px-4 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all">
                            <RefreshCw size={14} />
                            <span>Restart</span>
                        </button>
                    </div>
                )}
            </div>
            
            <p className="mt-4 text-[9px] text-text-muted font-black uppercase tracking-[0.3em]">Use Arrow Keys to Avoid the Crash</p>
        </div>
    );
};
