import React, { useState, useEffect, useCallback } from 'react';
import { useSelectionStore } from '../../store/useStore';
import { MOCK_SYMBOLS } from '../../mock/symbols';
import { CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

const MAX_GUESSES = 6;
const WORD_LENGTH = 5;

const symbolsForWordle = MOCK_SYMBOLS
    .map(s => s.ticker)
    .filter(t => t.length === WORD_LENGTH);

export const WordleGame: React.FC = () => {
    const [targetWord, setTargetWord] = useState('');
    const [guesses, setGuesses] = useState<string[]>([]);
    const [currentGuess, setCurrentGuess] = useState('');
    const [gameOver, setGameOver] = useState(false);
    const [win, setWin] = useState(false);

    const initGame = useCallback(() => {
        const symbol = symbolsForWordle[Math.floor(Math.random() * symbolsForWordle.length)].toUpperCase();
        setTargetWord(symbol);
        setGuesses([]);
        setCurrentGuess('');
        setGameOver(false);
        setWin(false);
    }, []);

    useEffect(() => {
        initGame();
    }, [initGame]);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (gameOver || win) return;

        if (e.key === 'Enter') {
            if (currentGuess.length === WORD_LENGTH) {
                const newGuesses = [...guesses, currentGuess.toUpperCase()];
                setGuesses(newGuesses);
                setCurrentGuess('');
                
                if (currentGuess.toUpperCase() === targetWord) {
                    setWin(true);
                    setGameOver(true);
                } else if (newGuesses.length === MAX_GUESSES) {
                    setGameOver(true);
                }
            }
        } else if (e.key === 'Backspace') {
            setCurrentGuess(prev => prev.slice(0, -1));
        } else if (e.key.length === 1 && /^[a-zA-Z0-9]$/.test(e.key)) {
            if (currentGuess.length < WORD_LENGTH) {
                setCurrentGuess(prev => prev + e.key.toUpperCase());
            }
        }
    }, [currentGuess, guesses, targetWord, gameOver, win]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    const getLetterColor = (letter: string, index: number, guess: string) => {
        if (targetWord[index] === letter) return 'bg-accent-green text-white border-accent-green';
        if (targetWord.includes(letter)) return 'bg-accent-blue text-white border-accent-blue';
        return 'bg-bg-elevated text-text-muted border-border/50';
    };

    return (
        <div className="flex flex-col h-full bg-bg-primary items-center justify-center p-4 select-none">
            <div className="mb-6 text-center">
                <h2 className="text-xl font-black text-text-primary uppercase tracking-[0.2em] mb-1 italic">Symbolle</h2>
                <p className="text-[10px] text-text-muted font-black uppercase tracking-widest">Guess the 5-Letter Ticker</p>
            </div>

            <div className="grid grid-rows-6 gap-2 mb-8 animate-in fade-in duration-500">
                {[...Array(MAX_GUESSES)].map((_, i) => {
                    const guess = guesses[i] || (i === guesses.length ? currentGuess : '');
                    const isSubmitted = i < guesses.length;

                    return (
                        <div key={i} className="flex gap-2">
                            {[...Array(WORD_LENGTH)].map((_, j) => {
                                const letter = guess[j] || '';
                                return (
                                    <div 
                                        key={j} 
                                        className={`w-10 h-10 border-2 rounded-lg flex items-center justify-center text-sm font-black transition-all duration-300 ${
                                            isSubmitted 
                                                ? getLetterColor(letter, j, guess)
                                                : letter ? 'border-accent-teal text-text-primary scale-105' : 'border-border/30 text-text-muted'
                                        }`}
                                    >
                                        {letter}
                                    </div>
                                );
                            })}
                        </div>
                    );
                })}
            </div>

            {gameOver && (
                <div className="flex flex-col items-center space-y-4 animate-in y-in duration-300">
                    {win ? (
                        <div className="flex items-center space-x-2 text-accent-green">
                            <CheckCircle size={14} />
                            <span className="text-[10px] font-black uppercase tracking-widest italic font-mono">Profit locked! Target: {targetWord}</span>
                        </div>
                    ) : (
                        <div className="flex items-center space-x-2 text-accent-red">
                            <AlertCircle size={14} />
                            <span className="text-[10px] font-black uppercase tracking-widest italic font-mono">Expired worthless! Ticker: {targetWord}</span>
                        </div>
                    )}
                    <button onClick={initGame} className="flex items-center space-x-2 bg-text-primary text-bg-primary px-4 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all">
                        <RefreshCw size={14} />
                        <span>Place New Bet</span>
                    </button>
                </div>
            )}
            
            <p className="mt-6 text-[9px] text-text-muted font-black uppercase tracking-[0.3em] font-mono"> NSE Tickers Only | {targetWord.length > 0 ? 'MOCK_FEED_ACTIVE' : 'INITIALIZING...'}</p>
        </div>
    );
};
