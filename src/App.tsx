import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, RefreshCw, Trophy } from 'lucide-react';

const TRACKS = [
  {
    id: 1,
    title: "Neon Dreams",
    artist: "SynthBot Alpha",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    cover: "https://picsum.photos/seed/neon1/200/200?blur=2"
  },
  {
    id: 2,
    title: "Cybernetic Groove",
    artist: "Neural Network Beats",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    cover: "https://picsum.photos/seed/neon2/200/200?blur=2"
  },
  {
    id: 3,
    title: "Digital Horizon",
    artist: "Algorithm Audio",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    cover: "https://picsum.photos/seed/neon3/200/200?blur=2"
  }
];

const GRID_SIZE = 20;
const INITIAL_SNAKE = [
  { x: 10, y: 10 },
  { x: 10, y: 11 },
  { x: 10, y: 12 },
];
const INITIAL_DIRECTION = { x: 0, y: -1 };
const GAME_SPEED = 120;

const generateFood = (snake: {x: number, y: number}[]) => {
  let newFood;
  while (true) {
    newFood = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE)
    };
    // eslint-disable-next-line no-loop-func
    if (!snake.some(segment => segment.x === newFood.x && segment.y === newFood.y)) {
      break;
    }
  }
  return newFood;
};

export default function App() {
  // --- Music Player State ---
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // --- Snake Game State ---
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  const [food, setFood] = useState({ x: 5, y: 5 });
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  
  const directionRef = useRef(direction);

  // --- Music Player Logic ---
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(e => console.error("Audio play error:", e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentTrackIndex]);

  const togglePlay = () => setIsPlaying(!isPlaying);
  
  const nextTrack = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length);
    setIsPlaying(true);
  };
  
  const prevTrack = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);
    setIsPlaying(true);
  };

  const handleTrackEnded = () => {
    nextTrack();
  };

  // --- Snake Game Logic ---
  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    directionRef.current = INITIAL_DIRECTION;
    setScore(0);
    setGameOver(false);
    setFood(generateFood(INITIAL_SNAKE));
    setGameStarted(true);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default scrolling for arrow keys
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
        e.preventDefault();
      }

      if (!gameStarted && e.key === " ") {
        resetGame();
        if (!isPlaying) setIsPlaying(true);
        return;
      }

      if (gameOver && e.key === " ") {
        resetGame();
        return;
      }

      const currentDir = directionRef.current;
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (currentDir.y !== 1) setDirection({ x: 0, y: -1 });
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (currentDir.y !== -1) setDirection({ x: 0, y: 1 });
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (currentDir.x !== 1) setDirection({ x: -1, y: 0 });
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (currentDir.x !== -1) setDirection({ x: 1, y: 0 });
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameOver, gameStarted, isPlaying]);

  useEffect(() => {
    directionRef.current = direction;
  }, [direction]);

  useEffect(() => {
    if (gameOver || !gameStarted) return;

    const moveSnake = () => {
      setSnake(prevSnake => {
        const head = prevSnake[0];
        const newHead = {
          x: head.x + directionRef.current.x,
          y: head.y + directionRef.current.y
        };

        // Check wall collision
        if (
          newHead.x < 0 || 
          newHead.x >= GRID_SIZE || 
          newHead.y < 0 || 
          newHead.y >= GRID_SIZE
        ) {
          setGameOver(true);
          return prevSnake;
        }

        // Check self collision
        if (prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
          setGameOver(true);
          return prevSnake;
        }

        const newSnake = [newHead, ...prevSnake];

        // Check food collision
        if (newHead.x === food.x && newHead.y === food.y) {
          setScore(s => {
            const newScore = s + 10;
            if (newScore > highScore) setHighScore(newScore);
            return newScore;
          });
          setFood(generateFood(newSnake));
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    };

    const gameLoop = setInterval(moveSnake, GAME_SPEED);
    return () => clearInterval(gameLoop);
  }, [gameOver, gameStarted, food, highScore]);

  const currentTrack = TRACKS[currentTrackIndex];

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans selection:bg-cyan-500/30 flex flex-col md:flex-row overflow-hidden relative">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-fuchsia-500/20 rounded-full blur-[120px] pointer-events-none" />

      {/* Audio Element */}
      <audio
        ref={audioRef}
        src={currentTrack.url}
        onEnded={handleTrackEnded}
        preload="auto"
      />

      {/* Left Sidebar - Music Player */}
      <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-neutral-800/50 bg-neutral-900/50 backdrop-blur-xl p-6 flex flex-col z-10">
        <div className="mb-8">
          <h1 className="text-2xl font-black tracking-tighter bg-gradient-to-r from-cyan-400 to-fuchsia-500 bg-clip-text text-transparent uppercase">
            Neon Snake
          </h1>
          <p className="text-xs text-neutral-500 font-mono mt-1 tracking-widest uppercase">Audio Interactive</p>
        </div>

        <div className="flex-1 flex flex-col justify-center">
          {/* Album Art */}
          <div className="relative aspect-square w-full max-w-[240px] mx-auto mb-8 rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(6,182,212,0.15)] group">
            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/20 to-fuchsia-500/20 mix-blend-overlay z-10" />
            <img 
              src={currentTrack.cover} 
              alt={currentTrack.title}
              className={`w-full h-full object-cover transition-transform duration-700 ${isPlaying ? 'scale-105' : 'scale-100'}`}
              referrerPolicy="no-referrer"
            />
            {isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center z-20">
                <div className="w-16 h-16 rounded-full border border-white/20 flex items-center justify-center animate-[spin_4s_linear_infinite]">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full absolute top-0" />
                </div>
              </div>
            )}
          </div>

          {/* Track Info */}
          <div className="text-center mb-8">
            <h2 className="text-lg font-bold text-white truncate px-4">{currentTrack.title}</h2>
            <p className="text-sm text-cyan-400/80 font-mono mt-1 truncate px-4">{currentTrack.artist}</p>
          </div>

          {/* Controls */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-center gap-6">
              <button 
                onClick={prevTrack}
                className="text-neutral-400 hover:text-white transition-colors p-2"
              >
                <SkipBack size={24} />
              </button>
              
              <button 
                onClick={togglePlay}
                className="w-14 h-14 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.3)]"
              >
                {isPlaying ? <Pause size={24} className="fill-black" /> : <Play size={24} className="fill-black ml-1" />}
              </button>
              
              <button 
                onClick={nextTrack}
                className="text-neutral-400 hover:text-white transition-colors p-2"
              >
                <SkipForward size={24} />
              </button>
            </div>

            {/* Volume */}
            <div className="flex items-center gap-3 px-4">
              <button onClick={() => setIsMuted(!isMuted)} className="text-neutral-400 hover:text-white transition-colors">
                {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.01" 
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  setVolume(parseFloat(e.target.value));
                  if (isMuted) setIsMuted(false);
                }}
                className="flex-1 h-1 bg-neutral-800 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-cyan-400 [&::-webkit-slider-thumb]:rounded-full cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Snake Game */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 z-10 relative">
        
        {/* Score Header */}
        <div className="w-full max-w-2xl flex justify-between items-end mb-6">
          <div>
            <p className="text-xs text-neutral-500 font-mono uppercase tracking-widest mb-1">Current Score</p>
            <div className="text-4xl font-black text-white font-mono leading-none">{score.toString().padStart(4, '0')}</div>
          </div>
          <div className="text-right">
            <p className="text-xs text-neutral-500 font-mono uppercase tracking-widest mb-1 flex items-center justify-end gap-1">
              <Trophy size={12} className="text-fuchsia-500" /> High Score
            </p>
            <div className="text-2xl font-bold text-fuchsia-400 font-mono leading-none">{highScore.toString().padStart(4, '0')}</div>
          </div>
        </div>

        {/* Game Board Container */}
        <div className="relative w-full max-w-2xl aspect-square bg-neutral-900/80 border border-neutral-800 rounded-xl overflow-hidden shadow-2xl backdrop-blur-sm">
          
          {/* Grid Background Pattern */}
          <div 
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage: 'linear-gradient(to right, #333 1px, transparent 1px), linear-gradient(to bottom, #333 1px, transparent 1px)',
              backgroundSize: `${100 / GRID_SIZE}% ${100 / GRID_SIZE}%`
            }}
          />

          {/* Game Grid */}
          <div 
            className="absolute inset-0 grid"
            style={{
              gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
              gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`
            }}
          >
            {/* Snake */}
            {snake.map((segment, index) => {
              const isHead = index === 0;
              return (
                <div
                  key={`${segment.x}-${segment.y}-${index}`}
                  className={`${isHead ? 'bg-cyan-400 z-20' : 'bg-cyan-500/80 z-10'} rounded-sm`}
                  style={{
                    gridColumnStart: segment.x + 1,
                    gridRowStart: segment.y + 1,
                    boxShadow: isHead ? '0 0 10px rgba(34, 211, 238, 0.8)' : 'none',
                    transform: isHead ? 'scale(1.1)' : 'scale(0.9)'
                  }}
                />
              );
            })}

            {/* Food */}
            <div
              className="bg-fuchsia-500 rounded-full z-10 animate-pulse"
              style={{
                gridColumnStart: food.x + 1,
                gridRowStart: food.y + 1,
                boxShadow: '0 0 15px rgba(217, 70, 239, 0.8)',
                transform: 'scale(0.8)'
              }}
            />
          </div>

          {/* Overlays */}
          {!gameStarted && !gameOver && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-30">
              <h2 className="text-3xl font-black text-white mb-4 tracking-widest uppercase">Ready?</h2>
              <button 
                onClick={() => {
                  resetGame();
                  if (!isPlaying) setIsPlaying(true);
                }}
                className="px-8 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-full transition-colors shadow-[0_0_20px_rgba(34,211,238,0.4)] flex items-center gap-2"
              >
                <Play size={18} className="fill-black" /> Start Game
              </button>
              <p className="text-neutral-400 text-sm mt-6 font-mono">Press SPACE to start</p>
              <p className="text-neutral-500 text-xs mt-2 font-mono">Use WASD or Arrow Keys to move</p>
            </div>
          )}

          {gameOver && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center z-30">
              <h2 className="text-4xl font-black text-fuchsia-500 mb-2 uppercase tracking-widest drop-shadow-[0_0_10px_rgba(217,70,239,0.5)]">Game Over</h2>
              <p className="text-xl text-white font-mono mb-8">Final Score: {score}</p>
              <button 
                onClick={resetGame}
                className="px-8 py-3 bg-white hover:bg-neutral-200 text-black font-bold rounded-full transition-colors flex items-center gap-2"
              >
                <RefreshCw size={18} /> Play Again
              </button>
              <p className="text-neutral-400 text-sm mt-6 font-mono">Press SPACE to restart</p>
            </div>
          )}
        </div>

        {/* Mobile Controls (visible only on small screens) */}
        <div className="md:hidden grid grid-cols-3 gap-2 mt-8 w-full max-w-[200px]">
          <div />
          <button 
            className="bg-neutral-800/80 p-4 rounded-xl active:bg-neutral-700 flex items-center justify-center"
            onClick={() => { if (directionRef.current.y !== 1) setDirection({ x: 0, y: -1 }) }}
          >
            <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[12px] border-b-cyan-400" />
          </button>
          <div />
          <button 
            className="bg-neutral-800/80 p-4 rounded-xl active:bg-neutral-700 flex items-center justify-center"
            onClick={() => { if (directionRef.current.x !== 1) setDirection({ x: -1, y: 0 }) }}
          >
            <div className="w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-r-[12px] border-r-cyan-400" />
          </button>
          <button 
            className="bg-neutral-800/80 p-4 rounded-xl active:bg-neutral-700 flex items-center justify-center"
            onClick={() => { if (directionRef.current.y !== -1) setDirection({ x: 0, y: 1 }) }}
          >
            <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[12px] border-t-cyan-400" />
          </button>
          <button 
            className="bg-neutral-800/80 p-4 rounded-xl active:bg-neutral-700 flex items-center justify-center"
            onClick={() => { if (directionRef.current.x !== -1) setDirection({ x: 1, y: 0 }) }}
          >
            <div className="w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-l-[12px] border-l-cyan-400" />
          </button>
        </div>

      </div>
    </div>
  );
}
