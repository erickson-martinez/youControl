import React, { useState, useEffect, useCallback } from 'react';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const GRID_WIDTH = 9;
const GRID_HEIGHT = 9;

interface Position {
  x: number;
  y: number;
}

interface LetterItem {
  id: string;
  pos: Position;
  letter: string;
  isTarget: boolean;
}

// Generate a random maze using Recursive Backtracking
const generateRandomMaze = (width: number, height: number) => {
  const maze = Array(height).fill(0).map(() => Array(width).fill(1));
  
  const carve = (x: number, y: number) => {
    maze[y][x] = 0;
    const dirs = [[0, -2], [0, 2], [-2, 0], [2, 0]].sort(() => Math.random() - 0.5);
    for (const [dx, dy] of dirs) {
      const nx = x + dx, ny = y + dy;
      if (nx > 0 && nx < width - 1 && ny > 0 && ny < height - 1 && maze[ny][nx] === 1) {
        maze[y + dy / 2][x + dx / 2] = 0;
        carve(nx, ny);
      }
    }
  };
  
  carve(1, 1);
  return maze;
};

const speakText = (text: string) => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    window.speechSynthesis.speak(utterance);
  }
};

const JogoDaVidaPage: React.FC = () => {
  const [maze, setMaze] = useState<number[][]>([]);
  const [pacmanPos, setPacmanPos] = useState<Position>({ x: 1, y: 1 });
  const [letters, setLetters] = useState<LetterItem[]>([]);
  const [score, setScore] = useState(0);
  const [targetIndex, setTargetIndex] = useState(0);
  const [message, setMessage] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState<{
    letter: string;
    options: string[];
  } | null>(null);

  const loadLevel = useCallback((idx: number) => {
    if (idx >= LETTERS.length) {
      setMessage('Parabéns! Você completou o alfabeto!');
      speakText('Parabéns! Você completou o alfabeto!');
      setLetters([]);
      return;
    }

    const newMaze = generateRandomMaze(GRID_WIDTH, GRID_HEIGHT);
    setMaze(newMaze);
    setPacmanPos({ x: 1, y: 1 });
    
    // BFS to find paths and distances from (1,1)
    const queue: Position[] = [{ x: 1, y: 1 }];
    const parent = new Map<string, string>();
    const visited = new Set<string>();
    visited.add(`1,1`);

    const pathCells: Position[] = [];

    while (queue.length > 0) {
      const curr = queue.shift()!;
      pathCells.push(curr);

      const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
      for (const [dx, dy] of dirs) {
        const nx = curr.x + dx;
        const ny = curr.y + dy;
        if (nx > 0 && nx < GRID_WIDTH - 1 && ny > 0 && ny < GRID_HEIGHT - 1 && newMaze[ny][nx] === 0) {
          const key = `${nx},${ny}`;
          if (!visited.has(key)) {
            visited.add(key);
            parent.set(key, `${curr.x},${curr.y}`);
            queue.push({ x: nx, y: ny });
          }
        }
      }
    }

    const possibleTargets = pathCells.filter(p => p.x !== 1 || p.y !== 1);
    // Prefer targets that are further away
    const targetCandidates = possibleTargets.slice(Math.floor(possibleTargets.length / 2));
    const targetSpot = targetCandidates[Math.floor(Math.random() * targetCandidates.length)] || possibleTargets[0];

    // Reconstruct path to target
    const targetPath = new Set<string>();
    let currKey: string | undefined = `${targetSpot.x},${targetSpot.y}`;
    while (currKey) {
      targetPath.add(currKey);
      currKey = parent.get(currKey);
    }

    // Find valid wrong spots (not on the path to target)
    const validWrongSpots = possibleTargets.filter(p => !targetPath.has(`${p.x},${p.y}`));

    const wrongSpot = validWrongSpots.length > 0 
      ? validWrongSpots[Math.floor(Math.random() * validWrongSpots.length)]
      : possibleTargets.find(p => p.x !== targetSpot.x && p.y !== targetSpot.y) || {x: 1, y: 2};
    
    const targetLetter = LETTERS[idx];
    const wrongLetter = LETTERS.filter(l => l !== targetLetter).sort(() => Math.random() - 0.5)[0];
    
    setLetters([
      { id: `target-${idx}`, pos: targetSpot, letter: targetLetter, isTarget: true },
      { id: `wrong-${idx}`, pos: wrongSpot, letter: wrongLetter, isTarget: false },
    ]);

    setMessage(`Encontre a letra ${targetLetter}`);
    speakText(`Encontre a letra ${targetLetter}`);
  }, []);

  const initGame = useCallback(() => {
    setScore(0);
    setTargetIndex(0);
    setCurrentQuestion(null);
    loadLevel(0);
  }, [loadLevel]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const movePacman = useCallback((dx: number, dy: number) => {
    if (targetIndex >= LETTERS.length || currentQuestion) return;

    setPacmanPos(prev => {
      const newX = prev.x + dx;
      const newY = prev.y + dy;
      
      if (newX >= 0 && newX < GRID_WIDTH && newY >= 0 && newY < GRID_HEIGHT) {
        if (maze[newY][newX] === 0) {
          return { x: newX, y: newY };
        }
      }
      return prev;
    });
  }, [maze, targetIndex, currentQuestion]);

  useEffect(() => {
    if (targetIndex >= LETTERS.length || letters.length === 0 || currentQuestion) return;

    const currentLetter = letters.find(l => l.pos.x === pacmanPos.x && l.pos.y === pacmanPos.y);
    if (currentLetter) {
      if (currentLetter.isTarget) {
        speakText(`Muito bem! Você achou a letra ${currentLetter.letter}. Repita comigo bem alto: ${currentLetter.letter}! Agora, qual dessas é a letra ${currentLetter.letter}?`);
        
        const wrongOptions = LETTERS.filter(l => l !== currentLetter.letter).sort(() => Math.random() - 0.5).slice(0, 2);
        const options = [currentLetter.letter, ...wrongOptions].sort(() => Math.random() - 0.5);
        
        setCurrentQuestion({
          letter: currentLetter.letter,
          options
        });
        
        setLetters([]); // Hide letters while answering
      } else {
        setMessage(`Ops! Essa é a letra ${currentLetter.letter}. Encontre a letra ${LETTERS[targetIndex]}`);
        speakText(`Ops! Essa é a letra ${currentLetter.letter}. Encontre a letra ${LETTERS[targetIndex]}`);
        setLetters(prev => prev.filter(l => l.id !== currentLetter.id));
        setScore(s => Math.max(0, s - 2)); // Deduct 2 points
      }
    }
  }, [pacmanPos, letters, targetIndex, currentQuestion]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
      }
      switch (e.key) {
        case 'ArrowUp': movePacman(0, -1); break;
        case 'ArrowDown': movePacman(0, 1); break;
        case 'ArrowLeft': movePacman(-1, 0); break;
        case 'ArrowRight': movePacman(1, 0); break;
      }
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [movePacman]);

  const handleAnswer = (selectedLetter: string) => {
    if (currentQuestion && selectedLetter === currentQuestion.letter) {
      speakText('Parabéns! Você acertou!');
      setScore(s => s + 10);
      setCurrentQuestion(null);
      
      const nextIndex = targetIndex + 1;
      setTargetIndex(nextIndex);
      loadLevel(nextIndex);
    } else {
      speakText('Ops, tente novamente!');
      setScore(s => Math.max(0, s - 2)); // Deduct 2 points for a wrong answer
    }
  };

  if (maze.length === 0) return null;

  return (
    <div className="p-4 max-w-3xl mx-auto flex flex-col items-center pb-24">
      <h1 className="text-3xl font-bold text-white mb-4">Labirinto do Alfabeto</h1>
      
      <div className="bg-gray-800 p-4 rounded-xl shadow-lg mb-6 w-full flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex flex-col">
          <span className="text-xl text-yellow-400 font-bold">Pontos: {score}</span>
          <span className="text-lg text-blue-300 font-bold">Próxima Letra: {LETTERS[targetIndex] || '-'}</span>
        </div>
        <div className="text-center sm:text-right flex flex-col items-center sm:items-end">
          <div className="flex items-center gap-3">
            <p className="text-white font-medium text-xl">{message}</p>
            {targetIndex < LETTERS.length && (
              <button
                onClick={() => speakText(`Encontre a letra ${LETTERS[targetIndex]}`)}
                className="bg-blue-500 hover:bg-blue-400 text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg transform active:scale-95 transition-all text-2xl"
                title="Ouvir novamente"
              >
                🔊
              </button>
            )}
          </div>
          {targetIndex >= LETTERS.length && (
            <button onClick={initGame} className="mt-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-bold">
              Jogar Novamente
            </button>
          )}
        </div>
      </div>

      {/* Game Grid */}
      <div 
        className="bg-gray-900 border-4 border-blue-500 rounded-lg p-2 relative"
        style={{ 
          width: '100%',
          maxWidth: '400px',
          aspectRatio: '1 / 1',
          display: 'grid',
          gridTemplateColumns: `repeat(${GRID_WIDTH}, 1fr)`,
          gridTemplateRows: `repeat(${GRID_HEIGHT}, 1fr)`,
          gap: '0px'
        }}
      >
        {/* Render Maze */}
        {maze.map((row, y) => 
          row.map((cell, x) => (
            <div 
              key={`${x}-${y}`} 
              className={cell === 1 ? 'bg-blue-800' : 'bg-gray-900'}
              style={{
                border: cell === 1 ? '1px solid #1e3a8a' : 'none',
                borderRadius: cell === 1 ? '4px' : '0'
              }}
            />
          ))
        )}

        {/* Render Letters */}
        {letters.map(item => (
          <div
            key={item.id}
            className="absolute flex items-center justify-center font-bold"
            style={{
              width: `${100 / GRID_WIDTH}%`,
              height: `${100 / GRID_HEIGHT}%`,
              left: `${(item.pos.x / GRID_WIDTH) * 100}%`,
              top: `${(item.pos.y / GRID_HEIGHT) * 100}%`,
              color: item.isTarget ? '#ffff00' : '#ff9999',
              textShadow: '2px 2px 4px black',
              fontSize: 'min(2.5rem, 7vw)',
              zIndex: 10
            }}
          >
            {item.letter}
          </div>
        ))}

        {/* Render Pacman */}
        <div
          className="absolute flex items-center justify-center transition-all duration-200"
          style={{
            width: `${100 / GRID_WIDTH}%`,
            height: `${100 / GRID_HEIGHT}%`,
            left: `${(pacmanPos.x / GRID_WIDTH) * 100}%`,
            top: `${(pacmanPos.y / GRID_HEIGHT) * 100}%`,
            zIndex: 20
          }}
        >
          <div 
            className="bg-yellow-400 rounded-full w-3/4 h-3/4"
            style={{
              boxShadow: '0 0 15px #ffff00'
            }}
          />
        </div>
      </div>

      {/* Controles Direcionais */}
      <div className="mt-8 grid grid-cols-3 gap-2 w-64">
        <div />
        <button 
          onClick={() => movePacman(0, -1)} 
          className="bg-blue-600 hover:bg-blue-500 active:bg-blue-400 p-6 rounded-xl text-white text-3xl flex justify-center shadow-lg transform active:scale-95 transition-all"
        >
          ↑
        </button>
        <div />
        <button 
          onClick={() => movePacman(-1, 0)} 
          className="bg-blue-600 hover:bg-blue-500 active:bg-blue-400 p-6 rounded-xl text-white text-3xl flex justify-center shadow-lg transform active:scale-95 transition-all"
        >
          ←
        </button>
        <button 
          onClick={() => movePacman(0, 1)} 
          className="bg-blue-600 hover:bg-blue-500 active:bg-blue-400 p-6 rounded-xl text-white text-3xl flex justify-center shadow-lg transform active:scale-95 transition-all"
        >
          ↓
        </button>
        <button 
          onClick={() => movePacman(1, 0)} 
          className="bg-blue-600 hover:bg-blue-500 active:bg-blue-400 p-6 rounded-xl text-white text-3xl flex justify-center shadow-lg transform active:scale-95 transition-all"
        >
          →
        </button>
      </div>

      {/* Question Modal */}
      {currentQuestion && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center transform transition-all scale-100">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Você achou a letra {currentQuestion.letter}!</h2>
            <p className="text-xl text-blue-600 font-bold mb-8 animate-pulse">Repita bem alto: {currentQuestion.letter}!</p>
            
            <h3 className="text-2xl font-bold text-gray-700 mb-6">Agora, clique na letra {currentQuestion.letter}:</h3>
            
            <div className="grid grid-cols-1 gap-4">
              {currentQuestion.options.map(opt => (
                <button
                  key={opt}
                  onClick={() => handleAnswer(opt)}
                  className="bg-blue-500 hover:bg-blue-400 text-white text-5xl font-bold py-8 rounded-2xl shadow-lg transition-transform active:scale-95"
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JogoDaVidaPage;
