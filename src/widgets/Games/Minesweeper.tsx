import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Bomb, Flag, RefreshCw, Shield } from 'lucide-react';
import { Button, COLOR, SPACE, Text, TYPE } from '../../ds';

const GRID_SIZE = 9;
const MINE_COUNT = 10;

interface Cell {
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  neighborCount: number;
}

const createEmptyGrid = (): Cell[][] =>
  Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => ({
      isMine: false,
      isRevealed: false,
      isFlagged: false,
      neighborCount: 0,
    }))
  );

const cloneGrid = (grid: Cell[][]) => grid.map((row) => row.map((cell) => ({ ...cell })));

const populateMines = (safeX: number, safeY: number) => {
  const grid = createEmptyGrid();
  let placed = 0;

  while (placed < MINE_COUNT) {
    const x = Math.floor(Math.random() * GRID_SIZE);
    const y = Math.floor(Math.random() * GRID_SIZE);
    if ((x === safeX && y === safeY) || grid[x][y].isMine) continue;
    grid[x][y].isMine = true;
    placed += 1;
  }

  for (let x = 0; x < GRID_SIZE; x += 1) {
    for (let y = 0; y < GRID_SIZE; y += 1) {
      if (grid[x][y].isMine) continue;
      let count = 0;
      for (let dx = -1; dx <= 1; dx += 1) {
        for (let dy = -1; dy <= 1; dy += 1) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE && grid[nx][ny].isMine) {
            count += 1;
          }
        }
      }
      grid[x][y].neighborCount = count;
    }
  }

  return grid;
};

export const Minesweeper: React.FC = () => {
  const [grid, setGrid] = useState<Cell[][]>(createEmptyGrid);
  const [gameOver, setGameOver] = useState(false);
  const [win, setWin] = useState(false);
  const [isFlagMode, setIsFlagMode] = useState(false);
  const [isBoardReady, setIsBoardReady] = useState(false);

  const flagsRemaining = useMemo(
    () => MINE_COUNT - grid.flat().filter((cell) => cell.isFlagged).length,
    [grid]
  );

  const resetGame = useCallback(() => {
    setGrid(createEmptyGrid());
    setGameOver(false);
    setWin(false);
    setIsFlagMode(false);
    setIsBoardReady(false);
  }, []);

  useEffect(() => {
    resetGame();
  }, [resetGame]);

  const checkWin = useCallback((nextGrid: Cell[][]) => {
    const hiddenNonMines = nextGrid.flat().filter((cell) => !cell.isMine && !cell.isRevealed).length;
    if (hiddenNonMines === 0) {
      setWin(true);
      setGameOver(true);
    }
  }, []);

  const revealFrom = useCallback((baseGrid: Cell[][], startX: number, startY: number) => {
    const nextGrid = cloneGrid(baseGrid);
    const queue: Array<[number, number]> = [[startX, startY]];

    while (queue.length > 0) {
      const [x, y] = queue.shift()!;
      if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) continue;

      const cell = nextGrid[x][y];
      if (cell.isRevealed || cell.isFlagged) continue;
      cell.isRevealed = true;

      if (cell.neighborCount === 0 && !cell.isMine) {
        for (let dx = -1; dx <= 1; dx += 1) {
          for (let dy = -1; dy <= 1; dy += 1) {
            if (dx !== 0 || dy !== 0) {
              queue.push([x + dx, y + dy]);
            }
          }
        }
      }
    }

    return nextGrid;
  }, []);

  const revealCell = useCallback((x: number, y: number) => {
    if (gameOver || win) return;

    let workingGrid = grid;
    if (!isBoardReady) {
      workingGrid = populateMines(x, y);
      setIsBoardReady(true);
    }

    const target = workingGrid[x][y];
    if (target.isRevealed || target.isFlagged) return;

    if (target.isMine) {
      const revealed = cloneGrid(workingGrid).map((row) => row.map((cell) => ({
        ...cell,
        isRevealed: cell.isRevealed || cell.isMine,
      })));
      setGrid(revealed);
      setGameOver(true);
      return;
    }

    const revealed = revealFrom(workingGrid, x, y);
    setGrid(revealed);
    checkWin(revealed);
  }, [checkWin, gameOver, grid, isBoardReady, revealFrom, win]);

  const toggleFlag = useCallback((x: number, y: number) => {
    if (gameOver || win) return;
    const nextGrid = cloneGrid(grid);
    const cell = nextGrid[x][y];
    if (cell.isRevealed) return;
    if (!cell.isFlagged && flagsRemaining <= 0) return;
    cell.isFlagged = !cell.isFlagged;
    setGrid(nextGrid);
  }, [flagsRemaining, gameOver, grid, win]);

  const handleCellClick = (x: number, y: number) => {
    if (isFlagMode) toggleFlag(x, y);
    else revealCell(x, y);
  };

  const handleContextMenu = (e: React.MouseEvent, x: number, y: number) => {
    e.preventDefault();
    toggleFlag(x, y);
  };

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACE[4],
        padding: SPACE[4],
        background: COLOR.bg.base,
        userSelect: 'none',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '21rem',
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          gap: SPACE[2],
          padding: `${SPACE[2]} ${SPACE[3]}`,
          border: `1px solid ${COLOR.bg.border}`,
          background: COLOR.bg.surface,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: SPACE[2] }}>
          <Flag size={12} color={COLOR.semantic.down} />
          <Text size="sm" color="primary" weight="bold">{String(flagsRemaining)}</Text>
        </div>

        <Button variant={isFlagMode ? 'accent' : 'ghost'} size="xs" onClick={() => setIsFlagMode((prev) => !prev)}>
          <Shield size={12} style={{ marginRight: SPACE[2] }} />
          {isFlagMode ? 'Flag mode' : 'Reveal mode'}
        </Button>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="ghost" size="xs" onClick={resetGame}>
            <RefreshCw size={12} />
          </Button>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${GRID_SIZE}, 1.9rem)`,
          gap: '2px',
          padding: SPACE[2],
          border: `1px solid ${COLOR.bg.border}`,
          background: COLOR.bg.surface,
        }}
      >
        {grid.map((row, x) =>
          row.map((cell, y) => {
            const revealedStyle: React.CSSProperties = cell.isMine
              ? { background: COLOR.semantic.down, color: COLOR.text.inverse, border: `1px solid ${COLOR.semantic.down}` }
              : { background: COLOR.bg.base, color: COLOR.text.secondary, border: `1px solid ${COLOR.bg.border}` };

            return (
              <button
                key={`${x}-${y}`}
                type="button"
                onClick={() => handleCellClick(x, y)}
                onContextMenu={(e) => handleContextMenu(e, x, y)}
                style={{
                  width: '1.9rem',
                  height: '1.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: TYPE.family.mono,
                  fontSize: TYPE.size.xs,
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0,
                  ...(cell.isRevealed ? revealedStyle : {
                    background: COLOR.bg.elevated,
                    color: COLOR.text.muted,
                    border: `1px solid ${COLOR.bg.border}`,
                  }),
                }}
              >
                {cell.isRevealed ? (
                  cell.isMine ? <Bomb size={12} strokeWidth={1.8} /> : cell.neighborCount > 0 ? cell.neighborCount : ''
                ) : cell.isFlagged ? (
                  <Flag size={11} color={COLOR.semantic.down} strokeWidth={1.8} />
                ) : (
                  ''
                )}
              </button>
            );
          })
        )}
      </div>

      {gameOver && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: SPACE[2], textAlign: 'center' }}>
          <Text size="md" color={win ? 'up' : 'down'} weight="bold">
            {win ? 'Board cleared' : 'Mine triggered'}
          </Text>
          <Text size="xs" color="muted" weight="bold">
            {win ? 'Every safe cell is open.' : 'Reset and try a cleaner route.'}
          </Text>
        </div>
      )}

      <Text size="xs" color="muted" weight="bold" style={{ textAlign: 'center', letterSpacing: TYPE.letterSpacing.wide }}>
        Click to reveal. Right click or switch modes to place flags.
      </Text>
    </div>
  );
};
