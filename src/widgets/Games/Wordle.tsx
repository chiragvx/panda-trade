import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle, Delete, RefreshCw } from 'lucide-react';
import { Button, COLOR, SPACE, Text, TYPE } from '../../ds';
import { useWatchlistStore } from '../../store/useStore';
import { useUpstoxStore } from '../../store/useUpstoxStore';
import { getTickerFromInstrumentKey } from '../../utils/liveSymbols';

const MAX_GUESSES = 6;
const WORD_LENGTH = 5;

const FALLBACK_WORDS = ['DELTA', 'ALPHA', 'TREND', 'BULLS', 'BEARS', 'RALLY', 'VALUE'];
const KEYBOARD_ROWS = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];

type LetterState = 'correct' | 'present' | 'absent';

const normalizeWord = (value: string) => value.toUpperCase().replace(/[^A-Z]/g, '');

export const WordleGame: React.FC = () => {
  const { watchlists, activeWatchlistId } = useWatchlistStore();
  const { prices } = useUpstoxStore();
  const instrumentKeys = watchlists.find((w) => w.id === activeWatchlistId)?.keys || [];

  const validWords = useMemo(() => {
    const fromWatchlist = instrumentKeys.map(getTickerFromInstrumentKey);
    const fromFeed = Object.keys(prices).map(getTickerFromInstrumentKey);

    const allWords = [...fromWatchlist, ...fromFeed]
      .map(normalizeWord)
      .filter((word) => word.length === WORD_LENGTH);

    const deduped = Array.from(new Set(allWords));
    return deduped.length > 0 ? deduped : FALLBACK_WORDS;
  }, [instrumentKeys, prices]);

  const [targetWord, setTargetWord] = useState('');
  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [gameOver, setGameOver] = useState(false);
  const [win, setWin] = useState(false);
  const [message, setMessage] = useState('Type a five-letter symbol and press Enter.');

  const initGame = useCallback(() => {
    const symbol = validWords[Math.floor(Math.random() * validWords.length)] || FALLBACK_WORDS[0];
    setTargetWord(symbol);
    setGuesses([]);
    setCurrentGuess('');
    setGameOver(false);
    setWin(false);
    setMessage('Type a five-letter symbol and press Enter.');
  }, [validWords]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const evaluateGuess = useCallback((guess: string): LetterState[] => {
    const result: LetterState[] = Array(WORD_LENGTH).fill('absent');
    const remaining = targetWord.split('');

    for (let i = 0; i < WORD_LENGTH; i += 1) {
      if (guess[i] === targetWord[i]) {
        result[i] = 'correct';
        remaining[i] = '';
      }
    }

    for (let i = 0; i < WORD_LENGTH; i += 1) {
      if (result[i] !== 'absent') continue;
      const idx = remaining.indexOf(guess[i]);
      if (idx >= 0) {
        result[i] = 'present';
        remaining[idx] = '';
      }
    }

    return result;
  }, [targetWord]);

  const submitGuess = useCallback(() => {
    if (gameOver || targetWord.length !== WORD_LENGTH) return;
    if (currentGuess.length !== WORD_LENGTH) {
      setMessage('Enter all five letters first.');
      return;
    }

    const normalized = normalizeWord(currentGuess);
    if (!validWords.includes(normalized)) {
      setMessage('That symbol is not in the current list.');
      return;
    }

    const nextGuesses = [...guesses, normalized];
    setGuesses(nextGuesses);
    setCurrentGuess('');

    if (normalized === targetWord) {
      setWin(true);
      setGameOver(true);
      setMessage(`Locked in: ${targetWord}`);
    } else if (nextGuesses.length >= MAX_GUESSES) {
      setGameOver(true);
      setMessage(`Out of tries. Target was ${targetWord}.`);
    } else {
      setMessage(`${MAX_GUESSES - nextGuesses.length} guesses left.`);
    }
  }, [currentGuess, gameOver, guesses, targetWord, validWords]);

  const pushLetter = useCallback((letter: string) => {
    if (gameOver) return;
    setCurrentGuess((prev) => (prev.length < WORD_LENGTH ? `${prev}${letter}` : prev));
  }, [gameOver]);

  const popLetter = useCallback(() => {
    if (gameOver) return;
    setCurrentGuess((prev) => prev.slice(0, -1));
  }, [gameOver]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameOver && e.key === 'Enter') {
        e.preventDefault();
        initGame();
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        submitGuess();
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        popLetter();
      } else if (/^[a-zA-Z]$/.test(e.key)) {
        e.preventDefault();
        pushLetter(e.key.toUpperCase());
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameOver, initGame, popLetter, pushLetter, submitGuess]);

  const keyboardState = useMemo(() => {
    const state = new Map<string, LetterState>();
    guesses.forEach((guess) => {
      evaluateGuess(guess).forEach((result, index) => {
        const letter = guess[index];
        const existing = state.get(letter);
        if (existing === 'correct') return;
        if (existing === 'present' && result === 'absent') return;
        state.set(letter, result);
      });
    });
    return state;
  }, [evaluateGuess, guesses]);

  const tileStyle = (status?: LetterState, active?: boolean): React.CSSProperties => {
    if (status === 'correct') {
      return { background: COLOR.semantic.up, border: `1px solid ${COLOR.semantic.up}`, color: COLOR.text.inverse };
    }
    if (status === 'present') {
      return { background: COLOR.semantic.warning, border: `1px solid ${COLOR.semantic.warning}`, color: COLOR.text.inverse };
    }
    if (status === 'absent') {
      return { background: COLOR.bg.elevated, border: `1px solid ${COLOR.bg.border}`, color: COLOR.text.muted };
    }
    if (active) {
      return { background: COLOR.bg.base, border: `1px solid ${COLOR.semantic.info}`, color: COLOR.text.primary };
    }
    return { background: COLOR.bg.surface, border: `1px solid ${COLOR.bg.border}`, color: COLOR.text.secondary };
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
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: SPACE[2], textAlign: 'center' }}>
        <Text size="lg" color="primary" weight="bold">Symbolle</Text>
        <Text size="xs" color="muted" weight="bold">Guess the hidden five-letter symbol.</Text>
      </div>

      <div style={{ display: 'grid', gap: SPACE[2] }}>
        {Array.from({ length: MAX_GUESSES }).map((_, rowIndex) => {
          const guess = guesses[rowIndex] || (rowIndex === guesses.length ? currentGuess : '');
          const isSubmitted = rowIndex < guesses.length;
          const evaluation = isSubmitted ? evaluateGuess(guess) : [];

          return (
            <div key={rowIndex} style={{ display: 'grid', gridTemplateColumns: `repeat(${WORD_LENGTH}, 2.5rem)`, gap: SPACE[2] }}>
              {Array.from({ length: WORD_LENGTH }).map((__, colIndex) => {
                const letter = guess[colIndex] || '';
                return (
                  <div
                    key={colIndex}
                    style={{
                      width: '2.5rem',
                      height: '2.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: TYPE.family.mono,
                      fontSize: TYPE.size.md,
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      ...tileStyle(evaluation[colIndex], !!letter && !isSubmitted),
                    }}
                  >
                    {letter}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: SPACE[2], minHeight: '3rem', textAlign: 'center' }}>
        {gameOver ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: SPACE[2], color: win ? COLOR.semantic.up : COLOR.semantic.down }}>
            {win ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
            <Text size="xs" color={win ? 'up' : 'down'} weight="bold">{message}</Text>
          </div>
        ) : (
          <Text size="xs" color="muted" weight="bold">{message}</Text>
        )}

        {gameOver && (
          <Button variant="accent" size="sm" onClick={initGame}>
            <RefreshCw size={12} style={{ marginRight: SPACE[2] }} />
            Play again
          </Button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE[2], alignItems: 'center' }}>
        {KEYBOARD_ROWS.map((row, rowIndex) => (
          <div key={row} style={{ display: 'flex', gap: SPACE[1], justifyContent: 'center' }}>
            {rowIndex === 2 && (
              <KeyButton label="Enter" wide onClick={submitGuess} />
            )}
            {row.split('').map((letter) => (
              <KeyButton
                key={letter}
                label={letter}
                onClick={() => pushLetter(letter)}
                state={keyboardState.get(letter)}
              />
            ))}
            {rowIndex === 2 && (
              <KeyButton label="Back" wide onClick={popLetter} icon={<Delete size={12} />} />
            )}
          </div>
        ))}
      </div>

      <Text size="xs" color="muted" weight="bold" style={{ textAlign: 'center', letterSpacing: TYPE.letterSpacing.wide }}>
        Word pool: {validWords.length} live symbols{validWords === FALLBACK_WORDS ? ' + fallback set' : ''}
      </Text>
    </div>
  );
};

const KeyButton: React.FC<{
  label: string;
  onClick: () => void;
  state?: LetterState;
  wide?: boolean;
  icon?: React.ReactNode;
}> = ({ label, onClick, state, wide, icon }) => {
  let background: string = COLOR.bg.surface;
  let borderColor: string = COLOR.bg.border;
  let color: string = COLOR.text.primary;

  if (state === 'correct') {
    background = COLOR.semantic.up;
    borderColor = COLOR.semantic.up;
    color = COLOR.text.inverse;
  } else if (state === 'present') {
    background = COLOR.semantic.warning;
    borderColor = COLOR.semantic.warning;
    color = COLOR.text.inverse;
  } else if (state === 'absent') {
    background = COLOR.bg.elevated;
    borderColor = COLOR.bg.border;
    color = COLOR.text.muted;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        minWidth: wide ? '3.5rem' : '2rem',
        height: '2rem',
        padding: wide ? `0 ${SPACE[2]}` : 0,
        border: `1px solid ${borderColor}`,
        background,
        color,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACE[1],
        cursor: 'pointer',
        fontFamily: TYPE.family.mono,
        fontSize: TYPE.size.xs,
        fontWeight: 600,
      }}
    >
      {icon}
      {label}
    </button>
  );
};
