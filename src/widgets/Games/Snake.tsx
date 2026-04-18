import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, RefreshCw, Trophy, Zap } from 'lucide-react';
import { Button, COLOR, SPACE, Text, TYPE } from '../../ds';
import { useWatchlistStore } from '../../store/useStore';
import { useUpstoxStore } from '../../store/useUpstoxStore';
import { getTickerFromInstrumentKey } from '../../utils/liveSymbols';

const GRID_SIZE = 20;
const MIN_CELL_SIZE = 14;
const MAX_CELL_SIZE = 22;
const INITIAL_SPEED = 150;

type Point = { x: number; y: number };
type Direction = Point;

const INITIAL_SNAKE: Point[] = [{ x: 10, y: 10 }];
const INITIAL_DIRECTION: Direction = { x: 0, y: -1 };

const isOppositeDirection = (next: Direction, current: Direction) =>
  next.x === -current.x && next.y === -current.y;

export const SnakeGame: React.FC = () => {
  const { watchlists, activeWatchlistId } = useWatchlistStore();
  const { prices } = useUpstoxStore();
  const instrumentKeys = watchlists.find((w) => w.id === activeWatchlistId)?.keys || [];

  const symbolPool = useMemo(() => {
    const fromWatchlist = instrumentKeys.map(getTickerFromInstrumentKey).filter(Boolean);
    const fromFeed = Object.keys(prices).map(getTickerFromInstrumentKey).filter(Boolean);
    return Array.from(new Set([...fromWatchlist, ...fromFeed])).slice(0, 300);
  }, [instrumentKeys, prices]);

  const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE);
  const [food, setFood] = useState<{ x: number; y: number; symbol: string }>({ x: 5, y: 5, symbol: 'TICK' });
  const [direction, setDirection] = useState<Direction>(INITIAL_DIRECTION);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [speed, setSpeed] = useState(INITIAL_SPEED);
  const [isStarted, setIsStarted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [boardCellSize, setBoardCellSize] = useState(18);

  const directionRef = useRef(direction);
  const snakeRef = useRef(snake);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const updateBoardSize = () => {
      const { width, height } = node.getBoundingClientRect();
      const horizontalPadding = 32;
      const reservedHeight = 210;
      const maxBoardWidth = Math.max(0, width - horizontalPadding);
      const maxBoardHeight = Math.max(0, height - reservedHeight);
      const boardPixels = Math.min(maxBoardWidth, maxBoardHeight, GRID_SIZE * MAX_CELL_SIZE);
      const nextCellSize = Math.max(MIN_CELL_SIZE, Math.floor(boardPixels / GRID_SIZE));
      setBoardCellSize(nextCellSize);
    };

    updateBoardSize();

    const observer = new ResizeObserver(updateBoardSize);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    directionRef.current = direction;
  }, [direction]);

  useEffect(() => {
    snakeRef.current = snake;
  }, [snake]);

  const generateFood = useCallback((activeSnake: Point[]) => {
    const occupied = new Set(activeSnake.map((part) => `${part.x}:${part.y}`));
    const available: Point[] = [];

    for (let x = 0; x < GRID_SIZE; x += 1) {
      for (let y = 0; y < GRID_SIZE; y += 1) {
        if (!occupied.has(`${x}:${y}`)) {
          available.push({ x, y });
        }
      }
    }

    if (available.length === 0) return;

    const nextPoint = available[Math.floor(Math.random() * available.length)];
    const symbol = symbolPool.length > 0
      ? symbolPool[Math.floor(Math.random() * symbolPool.length)].slice(0, 4)
      : 'TICK';

    setFood({ ...nextPoint, symbol });
  }, [symbolPool]);

  const resetGame = useCallback(() => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    directionRef.current = INITIAL_DIRECTION;
    snakeRef.current = INITIAL_SNAKE;
    setGameOver(false);
    setScore(0);
    setSpeed(INITIAL_SPEED);
    setIsStarted(false);
    generateFood(INITIAL_SNAKE);
  }, [generateFood]);

  useEffect(() => {
    generateFood(INITIAL_SNAKE);
  }, [generateFood]);

  const queueDirection = useCallback((nextDirection: Direction) => {
    if (gameOver) return;
    if (isOppositeDirection(nextDirection, directionRef.current)) return;
    directionRef.current = nextDirection;
    setDirection(nextDirection);
    setIsStarted(true);
  }, [gameOver]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        queueDirection({ x: 0, y: -1 });
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        queueDirection({ x: 0, y: 1 });
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        queueDirection({ x: -1, y: 0 });
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        queueDirection({ x: 1, y: 0 });
      } else if ((e.key === 'Enter' || e.key === ' ') && gameOver) {
        e.preventDefault();
        resetGame();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameOver, queueDirection, resetGame]);

  useEffect(() => {
    if (!isStarted || gameOver) return;

    const interval = window.setInterval(() => {
      const currentSnake = snakeRef.current;
      const currentDirection = directionRef.current;
      const head = currentSnake[0];
      const nextHead = { x: head.x + currentDirection.x, y: head.y + currentDirection.y };

      if (
        nextHead.x < 0 ||
        nextHead.x >= GRID_SIZE ||
        nextHead.y < 0 ||
        nextHead.y >= GRID_SIZE ||
        currentSnake.some((part) => part.x === nextHead.x && part.y === nextHead.y)
      ) {
        setGameOver(true);
        setIsStarted(false);
        return;
      }

      const nextSnake = [nextHead, ...currentSnake];

      if (nextHead.x === food.x && nextHead.y === food.y) {
        setSnake(nextSnake);
        setScore((prev) => {
          const nextScore = prev + 1;
          if (nextScore % 5 === 0) {
            setSpeed((prevSpeed) => Math.max(70, prevSpeed - 10));
          }
          return nextScore;
        });
        generateFood(nextSnake);
      } else {
        nextSnake.pop();
        setSnake(nextSnake);
      }
    }, speed);

    return () => window.clearInterval(interval);
  }, [food.x, food.y, gameOver, generateFood, isStarted, speed]);

  const boardPixelSize = boardCellSize * GRID_SIZE;

  return (
    <div
      ref={containerRef}
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
          maxWidth: `${Math.max(boardPixelSize, 320)}px`,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: SPACE[2],
        }}
      >
        <InfoMetric label="Score" value={String(score)} icon={<Trophy size={12} color={COLOR.semantic.warning} />} />
        <InfoMetric label="Speed" value={`${speed}ms`} icon={<Zap size={12} color={COLOR.semantic.info} />} />
        <InfoMetric label="Food" value={food.symbol} />
      </div>

      <div
        style={{
          position: 'relative',
          width: `${boardPixelSize}px`,
          height: `${boardPixelSize}px`,
          border: `1px solid ${COLOR.bg.border}`,
          background:
            'linear-gradient(180deg, rgba(255,122,26,0.04) 0%, rgba(255,122,26,0) 24%), #050505',
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.02)',
        }}
      >
        {Array.from({ length: GRID_SIZE - 1 }).map((_, idx) => (
          <React.Fragment key={idx}>
            <div
              style={{
                position: 'absolute',
                left: `${(idx + 1) * boardCellSize}px`,
                top: 0,
                bottom: 0,
                width: '1px',
                background: 'rgba(255,255,255,0.03)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: `${(idx + 1) * boardCellSize}px`,
                left: 0,
                right: 0,
                height: '1px',
                background: 'rgba(255,255,255,0.03)',
              }}
            />
          </React.Fragment>
        ))}

        {snake.map((part, index) => (
          <div
            key={`${part.x}-${part.y}-${index}`}
            style={{
              position: 'absolute',
              left: `${part.x * boardCellSize + 1}px`,
              top: `${part.y * boardCellSize + 1}px`,
              width: `${boardCellSize - 2}px`,
              height: `${boardCellSize - 2}px`,
              background: index === 0 ? COLOR.semantic.info : 'rgba(255,122,26,0.5)',
              boxShadow: index === 0 ? `0 0 12px rgba(255,122,26,0.45)` : 'none',
            }}
          />
        ))}

        <div
          style={{
            position: 'absolute',
            left: `${food.x * boardCellSize + 1}px`,
            top: `${food.y * boardCellSize + 1}px`,
            width: `${boardCellSize - 2}px`,
            height: `${boardCellSize - 2}px`,
            background: COLOR.semantic.up,
            color: COLOR.text.inverse,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: TYPE.family.mono,
            fontSize: boardCellSize <= 15 ? '0.38rem' : '0.46rem',
            fontWeight: 600,
            letterSpacing: TYPE.letterSpacing.tight,
            overflow: 'hidden',
          }}
        >
          {food.symbol}
        </div>

        {!isStarted && !gameOver && (
          <OverlayMessage
            title="Ready"
            subtitle="Use arrow keys or the controls below to start."
          />
        )}

        {gameOver && (
          <OverlayMessage
            title="Crashed"
            subtitle={`Final score: ${score}`}
            action={
              <Button variant="accent" size="sm" onClick={resetGame}>
                <RefreshCw size={12} style={{ marginRight: SPACE[2] }} />
                Restart
              </Button>
            }
          />
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 2.5rem)', gap: SPACE[2] }}>
        <span />
        <ControlButton label="Up" onClick={() => queueDirection({ x: 0, y: -1 })} icon={<ArrowUp size={14} />} />
        <span />
        <ControlButton label="Left" onClick={() => queueDirection({ x: -1, y: 0 })} icon={<ArrowLeft size={14} />} />
        <ControlButton label="Down" onClick={() => queueDirection({ x: 0, y: 1 })} icon={<ArrowDown size={14} />} />
        <ControlButton label="Right" onClick={() => queueDirection({ x: 1, y: 0 })} icon={<ArrowRight size={14} />} />
      </div>

      <Text size="xs" color="muted" weight="bold" style={{ letterSpacing: TYPE.letterSpacing.wide, textAlign: 'center' }}>
        Avoid the walls, don&apos;t cross your own trail, and eat symbols to speed up.
      </Text>
    </div>
  );
};

const InfoMetric: React.FC<{ label: string; value: string; icon?: React.ReactNode }> = ({ label, value, icon }) => (
  <div
    style={{
      minHeight: '3rem',
      border: `1px solid ${COLOR.bg.border}`,
      background: COLOR.bg.surface,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      gap: SPACE[1],
      padding: `${SPACE[2]} ${SPACE[3]}`,
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: SPACE[1] }}>
      {icon}
      <Text size="xs" color="muted" weight="bold">{label}</Text>
    </div>
    <Text size="sm" color="primary" weight="bold">{value}</Text>
  </div>
);

const ControlButton: React.FC<{ label: string; icon: React.ReactNode; onClick: () => void }> = ({ label, icon, onClick }) => (
  <button
    type="button"
    aria-label={label}
    onClick={onClick}
    style={{
      width: '2.5rem',
      height: '2.5rem',
      border: `1px solid ${COLOR.bg.border}`,
      background: COLOR.bg.surface,
      color: COLOR.text.secondary,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
    }}
  >
    {icon}
  </button>
);

const OverlayMessage: React.FC<{ title: string; subtitle: string; action?: React.ReactNode }> = ({ title, subtitle, action }) => (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      background: 'rgba(5,5,5,0.88)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: SPACE[3],
      textAlign: 'center',
      padding: SPACE[4],
    }}
  >
    <Text size="lg" color="primary" weight="bold">{title}</Text>
    <Text size="xs" color="muted" weight="bold">{subtitle}</Text>
    {action}
  </div>
);
