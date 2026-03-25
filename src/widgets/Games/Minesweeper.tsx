import React, { useState, useEffect, useCallback } from 'react';
import { Flag, RefreshCw, Trophy, Bomb } from 'lucide-react';

const GRID_SIZE = 9;
const MINE_COUNT = 10;

interface Cell {
    isMine: boolean;
    isRevealed: boolean;
    isFlagged: boolean;
    neighborCount: number;
}

export const Minesweeper: React.FC = () => {
    const [grid, setGrid] = useState<Cell[][]>([]);
    const [gameOver, setGameOver] = useState(false);
    const [win, setWin] = useState(false);
    const [flags, setFlags] = useState(MINE_COUNT);

    const initGrid = useCallback(() => {
        let newGrid: Cell[][] = Array(GRID_SIZE).fill(null).map(() => 
            Array(GRID_SIZE).fill(null).map(() => ({
                isMine: false,
                isRevealed: false,
                isFlagged: false,
                neighborCount: 0
            }))
        );

        // Place mines
        let minesPlaced = 0;
        while (minesPlaced < MINE_COUNT) {
            const x = Math.floor(Math.random() * GRID_SIZE);
            const y = Math.floor(Math.random() * GRID_SIZE);
            if (!newGrid[x][y].isMine) {
                newGrid[x][y].isMine = true;
                minesPlaced++;
            }
        }

        // Calculate neighbor counts
        for (let x = 0; x < GRID_SIZE; x++) {
            for (let y = 0; y < GRID_SIZE; y++) {
                if (newGrid[x][y].isMine) continue;
                let count = 0;
                for (let dx = -1; dx <= 1; dx++) {
                    for (let dy = -1; dy <= 1; dy++) {
                        const nx = x + dx;
                        const ny = y + dy;
                        if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE && newGrid[nx][ny].isMine) {
                            count++;
                        }
                    }
                }
                newGrid[x][y].neighborCount = count;
            }
        }

        setGrid(newGrid);
        setGameOver(false);
        setWin(false);
        setFlags(MINE_COUNT);
    }, []);

    useEffect(() => {
        initGrid();
    }, [initGrid]);

    const revealCell = (x: number, y: number) => {
        if (gameOver || win || grid[x][y].isRevealed || grid[x][y].isFlagged) return;

        const newGrid = [...grid.map(row => [...row])];
        
        if (newGrid[x][y].isMine) {
            newGrid[x][y].isRevealed = true;
            setGrid(newGrid);
            setGameOver(true);
            return;
        }

        const revealRecursive = (rx: number, ry: number) => {
            if (rx < 0 || rx >= GRID_SIZE || ry < 0 || ry >= GRID_SIZE || newGrid[rx][ry].isRevealed || newGrid[rx][ry].isFlagged) return;
            newGrid[rx][ry].isRevealed = true;
            if (newGrid[rx][ry].neighborCount === 0) {
                for (let dx = -1; dx <= 1; dx++) {
                    for (let dy = -1; dy <= 1; dy++) {
                        revealRecursive(rx + dx, ry + dy);
                    }
                }
            }
        };

        revealRecursive(x, y);
        setGrid(newGrid);

        // Check for win
        const unrevealedCount = newGrid.flat().filter(c => !c.isRevealed).length;
        if (unrevealedCount === MINE_COUNT) setWin(true);
    };

    const toggleFlag = (e: React.MouseEvent, x: number, y: number) => {
        e.preventDefault();
        if (gameOver || win || grid[x][y].isRevealed) return;
        
        const newGrid = [...grid.map(row => [...row])];
        newGrid[x][y].isFlagged = !newGrid[x][y].isFlagged;
        setGrid(newGrid);
        setFlags(f => newGrid[x][y].isFlagged ? f - 1 : f + 1);
    };

    return (
        <div className="flex flex-col h-full bg-bg-primary items-center justify-center p-4 select-none">
            <div className="mb-4 flex items-center justify-between w-full max-w-[320px] bg-bg-secondary p-4 rounded-xl border border-border/50">
                <div className="flex items-center space-x-2">
                    <Flag size={14} className="text-accent-red" />
                    <span className="text-xs font-black text-text-primary uppercase">{flags}</span>
                </div>
                <button onClick={initGrid} className="text-text-muted hover:text-text-primary transition-colors">
                    <RefreshCw size={16} className={win ? 'animate-spin' : ''} />
                </button>
                <div className="flex items-center space-x-2">
                    <Trophy size={14} className="text-accent-teal" />
                    <span className="text-xs font-black text-text-primary uppercase">Best: 0</span>
                </div>
            </div>

            <div className="grid grid-cols-9 gap-1 bg-bg-secondary p-2 rounded-xl border border-border/50 shadow-2xl">
                {grid.map((row, x) => row.map((cell, y) => (
                    <div 
                        key={`${x}-${y}`}
                        onClick={() => revealCell(x, y)}
                        onContextMenu={(e) => toggleFlag(e, x, y)}
                        className={`w-7 h-7 rounded flex items-center justify-center text-[10px] font-black cursor-pointer transition-all duration-150 ${
                            cell.isRevealed 
                                ? (cell.isMine ? 'bg-accent-red text-white' : 'bg-bg-primary text-text-muted')
                                : 'bg-bg-elevated hover:bg-bg-primary border border-white/5 active:scale-90'
                        }`}
                    >
                        {cell.isRevealed 
                            ? (cell.isMine ? <Bomb size={12} /> : (cell.neighborCount > 0 ? cell.neighborCount : ''))
                            : (cell.isFlagged ? <Flag size={10} className="text-accent-red" /> : '')
                        }
                    </div>
                )))}
            </div>

            {(gameOver || win) && (
                <div className="mt-4 animate-in slide-in-from-top-4 duration-300">
                    {gameOver && <h3 className="text-xs font-black text-accent-red uppercase tracking-[0.2em] italic">Risk Event Triggered!</h3>}
                    {win && <h3 className="text-xs font-black text-accent-green uppercase tracking-[0.2em] italic">Liquidity Found!</h3>}
                </div>
            )}
            
            <p className="mt-4 text-[9px] text-text-muted font-black uppercase tracking-[0.3em]">Right Click to Add Risk Management (Flag)</p>
        </div>
    );
};
