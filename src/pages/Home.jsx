import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiRefreshCw, FiMoon, FiSun, FiArrowLeft, FiInfo, FiAward, FiGithub, 
         FiArrowUp, FiArrowDown, FiArrowRight } from 'react-icons/fi';

// Custom hook for using localStorage with a fallback value
const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });
  
  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(error);
    }
  };
  
  return [storedValue, setValue];
};

const Home = () => {
  // Move darkMode state to the top since other functions depend on it
  const [darkMode, setDarkMode] = useLocalStorage('2048-dark-mode', true);
  
  // Now we can safely define panelStyle
  const panelStyle = darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800';
  
  // Game state
  const [board, setBoard] = useState(Array(4).fill().map(() => Array(4).fill(0)));
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useLocalStorage('2048-best-score', 0);
  const [currentLevel, setCurrentLevel] = useLocalStorage('2048-current-level', 1);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [keepPlaying, setKeepPlaying] = useState(false);
  const [history, setHistory] = useState([]);
  const [showInfo, setShowInfo] = useState(false);
  const [achievements, setAchievements] = useLocalStorage('2048-achievements', []);
  const [showAchievements, setShowAchievements] = useState(false);
  
  // Animation related states
  const [mergedCells, setMergedCells] = useState([]);
  const [newTile, setNewTile] = useState(null);

  // Level settings - explicitly setting levels 1-4
  const getLevelTarget = (level) => {
    const targets = {
      1: 2048,
      2: 4096,
      3: 8192,
      4: 16384
    };
    return targets[level] || Math.pow(2, 14 + (level - 4)); // For levels beyond 4
  };
  
  const getInitialTilesCount = (level) => Math.min(2 + Math.floor(level / 2), 6); // Starts with 2, increases up to 6
  
  // Get current level target
  const currentLevelTarget = getLevelTarget(currentLevel);

  // Color mapping for tiles based on their values
  const getTileColor = (value) => {
    const colors = {
      0: darkMode ? 'bg-gray-800' : 'bg-gray-200',
      2: darkMode ? 'bg-gray-700 text-gray-100' : 'bg-yellow-100 text-gray-800',
      4: darkMode ? 'bg-gray-600 text-gray-100' : 'bg-yellow-200 text-gray-800',
      8: darkMode ? 'bg-amber-800 text-white' : 'bg-orange-300 text-white',
      16: darkMode ? 'bg-amber-700 text-white' : 'bg-orange-400 text-white',
      32: darkMode ? 'bg-orange-800 text-white' : 'bg-orange-500 text-white',
      64: darkMode ? 'bg-orange-700 text-white' : 'bg-orange-600 text-white',
      128: darkMode ? 'bg-yellow-600 text-white' : 'bg-yellow-400 text-white',
      256: darkMode ? 'bg-yellow-500 text-white' : 'bg-yellow-500 text-white',
      512: darkMode ? 'bg-yellow-400 text-white' : 'bg-yellow-600 text-white',
      1024: darkMode ? 'bg-yellow-300 text-gray-800' : 'bg-yellow-700 text-white',
      2048: darkMode ? 'bg-yellow-200 text-gray-800' : 'bg-yellow-800 text-white',
      4096: darkMode ? 'bg-green-500 text-white' : 'bg-green-600 text-white',
      8192: darkMode ? 'bg-blue-500 text-white' : 'bg-blue-600 text-white',
      16384: darkMode ? 'bg-indigo-500 text-white' : 'bg-indigo-600 text-white',
      32768: darkMode ? 'bg-purple-500 text-white' : 'bg-purple-600 text-white',
      65536: darkMode ? 'bg-pink-500 text-white' : 'bg-pink-600 text-white',
    };
    
    // For values higher than predefined colors
    if (!colors[value]) {
      return darkMode ? 'bg-purple-600 text-white' : 'bg-purple-400 text-white';
    }
    
    return colors[value];
  };

  // Font size adjusts for bigger numbers
  const getTileFontSize = (value) => {
    if (value < 100) return 'text-3xl sm:text-4xl';
    if (value < 1000) return 'text-2xl sm:text-3xl';
    if (value < 10000) return 'text-xl sm:text-2xl';
    return 'text-lg sm:text-xl';
  };

  // Achievement system
  const checkAchievements = (boardState, newScore) => {
    const allTiles = boardState.flat().filter(value => value > 0);
    const highestTile = Math.max(...allTiles);
    const newAchievements = [...achievements];
    
    // Check for tile-based achievements
    const tileAchievements = [
      { id: '2048', value: 2048, title: 'First Milestone', description: 'Reached the 2048 tile' },
      { id: '4096', value: 4096, title: 'Double Trouble', description: 'Reached the 4096 tile' },
      { id: '8192', value: 8192, title: 'Power Player', description: 'Reached the 8192 tile' },
      { id: '16384', value: 16384, title: 'Master Strategist', description: 'Reached the 16384 tile' }
    ];
    
    tileAchievements.forEach(achievement => {
      if (highestTile >= achievement.value && !achievements.some(a => a.id === achievement.id)) {
        newAchievements.push(achievement);
      }
    });
    
    // Check for score-based achievements
    const scoreAchievements = [
      { id: 'score10k', value: 10000, title: 'Point Collector', description: 'Scored 10,000 points' },
      { id: 'score25k', value: 25000, title: 'Score Master', description: 'Scored 25,000 points' },
      { id: 'score50k', value: 50000, title: 'High Roller', description: 'Scored 50,000 points' }
    ];
    
    scoreAchievements.forEach(achievement => {
      if (newScore >= achievement.value && !achievements.some(a => a.id === achievement.id)) {
        newAchievements.push(achievement);
      }
    });
    
    // Check for level-based achievements
    const levelAchievements = [
      { id: 'level2', value: 2, title: 'Moving Up', description: 'Reached Level 2' },
      { id: 'level3', value: 3, title: 'Getting Serious', description: 'Reached Level 3' },
      { id: 'level4', value: 4, title: 'Expert Player', description: 'Reached Level 4' }
    ];
    
    levelAchievements.forEach(achievement => {
      if (currentLevel >= achievement.value && !achievements.some(a => a.id === achievement.id)) {
        newAchievements.push(achievement);
      }
    });
    
    if (newAchievements.length > achievements.length) {
      setAchievements(newAchievements);
      return newAchievements[newAchievements.length - 1];
    }
    
    return null;
  };

  // Clear all scores and progress
  const clearAllScores = () => {
    setBestScore(0);
    setCurrentLevel(1);
    setAchievements([]);
    initializeGame();
  };

  // Clear just the current score
  const clearCurrentScore = () => {
    setScore(0);
    initializeGame();
  };

  // Initialize game
  const initializeGame = useCallback(() => {
    const newBoard = Array(4).fill().map(() => Array(4).fill(0));
    const initialTiles = getInitialTilesCount(currentLevel);
    
    // Add initial tiles
    for (let i = 0; i < initialTiles; i++) {
      addRandomTile(newBoard);
    }
    
    setBoard(newBoard);
    setScore(0);
    setGameOver(false);
    setWon(false);
    setKeepPlaying(false);
    setHistory([]);
    setMergedCells([]);
    setNewTile(null);
  }, [currentLevel]);

  // Add a random tile (2 or 4) to an empty cell
  const addRandomTile = (boardState) => {
    const emptyCells = [];
    
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        if (boardState[i][j] === 0) {
          emptyCells.push({ row: i, col: j });
        }
      }
    }
    
    if (emptyCells.length > 0) {
      const { row, col } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      // Higher chance for 4 tiles in higher levels
      const chance4 = 0.1 + (currentLevel * 0.03); // Increases with level, capped at 40%
      boardState[row][col] = Math.random() < (1 - Math.min(chance4, 0.4)) ? 2 : 4;
      setNewTile({ row, col, value: boardState[row][col] });
      return { row, col, value: boardState[row][col] };
    }
    
    return null;
  };

  // Check if the game is over
  const checkGameOver = (boardState) => {
    // Check if there's any empty cell
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        if (boardState[i][j] === 0) return false;
      }
    }
    
    // Check if any adjacent cells have the same value (can be merged)
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        const current = boardState[i][j];
        
        // Check right
        if (j < 3 && boardState[i][j + 1] === current) return false;
        
        // Check down
        if (i < 3 && boardState[i + 1][j] === current) return false;
      }
    }
    
    return true;
  };

  // Check if the player won (reached the current level target)
  const checkWin = (boardState) => {
    if (won && keepPlaying) return false;
    
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        if (boardState[i][j] >= currentLevelTarget) return true;
      }
    }
    
    return false;
  };

  // Clone the board
  const cloneBoard = (boardState) => {
    return boardState.map(row => [...row]);
  };

  // Save the current game state to history for undo
  const saveToHistory = (boardState, currentScore) => {
    setHistory(prev => [...prev, { board: cloneBoard(boardState), score: currentScore }]);
  };

  // Undo the last move
  const undoMove = () => {
    if (history.length === 0) return;
    
    const lastState = history[history.length - 1];
    setBoard(lastState.board);
    setScore(lastState.score);
    setHistory(prev => prev.slice(0, -1));
    setGameOver(false);
    setMergedCells([]);
    setNewTile(null);
  };

  // Move to next level
  const advanceToNextLevel = () => {
    setCurrentLevel(prev => prev + 1);
    setKeepPlaying(false);
    initializeGame();
  };

  // Handle movement with animation tracking
  const move = (direction) => {
    if (gameOver && !keepPlaying) return;
    
    // Save current state before move
    saveToHistory(board, score);
    
    const newBoard = cloneBoard(board);
    let moved = false;
    let newMergedCells = [];
    let newScore = score;
    
    // Handle different directions
    if (direction === 'up') {
      for (let j = 0; j < 4; j++) {
        let merged = Array(4).fill(false);
        
        for (let i = 1; i < 4; i++) {
          if (newBoard[i][j] !== 0) {
            let row = i;
            
            while (row > 0 && 
                  (newBoard[row - 1][j] === 0 || 
                   (newBoard[row - 1][j] === newBoard[row][j] && !merged[row - 1]))) {
              
              if (newBoard[row - 1][j] === 0) {
                // Move to empty cell
                newBoard[row - 1][j] = newBoard[row][j];
                newBoard[row][j] = 0;
                row--;
                moved = true;
              } else if (newBoard[row - 1][j] === newBoard[row][j]) {
                // Merge with same value
                newBoard[row - 1][j] *= 2;
                newScore += newBoard[row - 1][j];
                newBoard[row][j] = 0;
                merged[row - 1] = true;
                newMergedCells.push({ row: row - 1, col: j });
                moved = true;
                break;
              }
            }
          }
        }
      }
    } else if (direction === 'down') {
      for (let j = 0; j < 4; j++) {
        let merged = Array(4).fill(false);
        
        for (let i = 2; i >= 0; i--) {
          if (newBoard[i][j] !== 0) {
            let row = i;
            
            while (row < 3 && 
                  (newBoard[row + 1][j] === 0 || 
                   (newBoard[row + 1][j] === newBoard[row][j] && !merged[row + 1]))) {
              
              if (newBoard[row + 1][j] === 0) {
                newBoard[row + 1][j] = newBoard[row][j];
                newBoard[row][j] = 0;
                row++;
                moved = true;
              } else if (newBoard[row + 1][j] === newBoard[row][j]) {
                newBoard[row + 1][j] *= 2;
                newScore += newBoard[row + 1][j];
                newBoard[row][j] = 0;
                merged[row + 1] = true;
                newMergedCells.push({ row: row + 1, col: j });
                moved = true;
                break;
              }
            }
          }
        }
      }
    } else if (direction === 'left') {
      for (let i = 0; i < 4; i++) {
        let merged = Array(4).fill(false);
        
        for (let j = 1; j < 4; j++) {
          if (newBoard[i][j] !== 0) {
            let col = j;
            
            while (col > 0 && 
                  (newBoard[i][col - 1] === 0 || 
                   (newBoard[i][col - 1] === newBoard[i][col] && !merged[col - 1]))) {
              
              if (newBoard[i][col - 1] === 0) {
                newBoard[i][col - 1] = newBoard[i][col];
                newBoard[i][col] = 0;
                col--;
                moved = true;
              } else if (newBoard[i][col - 1] === newBoard[i][col]) {
                newBoard[i][col - 1] *= 2;
                newScore += newBoard[i][col - 1];
                newBoard[i][col] = 0;
                merged[col - 1] = true;
                newMergedCells.push({ row: i, col: col - 1 });
                moved = true;
                break;
              }
            }
          }
        }
      }
    } else if (direction === 'right') {
      for (let i = 0; i < 4; i++) {
        let merged = Array(4).fill(false);
        
        for (let j = 2; j >= 0; j--) {
          if (newBoard[i][j] !== 0) {
            let col = j;
            
            while (col < 3 && 
                  (newBoard[i][col + 1] === 0 || 
                   (newBoard[i][col + 1] === newBoard[i][col] && !merged[col + 1]))) {
              
              if (newBoard[i][col + 1] === 0) {
                newBoard[i][col + 1] = newBoard[i][col];
                newBoard[i][col] = 0;
                col++;
                moved = true;
              } else if (newBoard[i][col + 1] === newBoard[i][col]) {
                newBoard[i][col + 1] *= 2;
                newScore += newBoard[i][col + 1];
                newBoard[i][col] = 0;
                merged[col + 1] = true;
                newMergedCells.push({ row: i, col: col + 1 });
                moved = true;
                break;
              }
            }
          }
        }
      }
    }
    
    if (moved) {
      setBoard(newBoard);
      setScore(newScore);
      setMergedCells(newMergedCells);
      
      // Update best score if needed
      if (newScore > bestScore) {
        setBestScore(newScore);
      }
      
      // Check for achievements
      const newAchievement = checkAchievements(newBoard, newScore);
      
      // Add a new random tile with a slight delay for better animation
      setTimeout(() => {
        addRandomTile(newBoard);
        
        // Check if player won
        if (checkWin(newBoard)) {
          setWon(true);
        }
        
        // Check if game is over
        if (checkGameOver(newBoard)) {
          setGameOver(true);
        }
      }, 150);
    } else {
      // Remove the saved state if no move was made
      setHistory(prev => prev.slice(0, -1));
    }
  };

  // Handle keyboard events
  const handleKeyDown = useCallback((e) => {
    if (showInfo) return; // Don't process game moves if info modal is open
    
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        move('up');
        break;
      case 'ArrowDown':
        e.preventDefault();
        move('down');
        break;
      case 'ArrowLeft':
        e.preventDefault();
        move('left');
        break;
      case 'ArrowRight':
        e.preventDefault();
        move('right');
        break;
      default:
        break;
    }
  }, [board, score, gameOver, won, keepPlaying, history, showInfo]);

  // Handle touch events for mobile
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const handleTouchStart = (e) => {
    e.preventDefault(); // Prevent default touch behavior
    setTouchEnd(null);
    setTouchStart({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    });
  };

  const handleTouchMove = (e) => {
    e.preventDefault(); // Prevent default touch behavior
    setTouchEnd({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    });
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd || showInfo) return;
    
    const xDiff = touchStart.x - touchEnd.x;
    const yDiff = touchStart.y - touchEnd.y;
    
    // Determine the direction with the larger difference
    if (Math.abs(xDiff) > Math.abs(yDiff)) {
      xDiff > 0 ? move('left') : move('right');
    } else {
      yDiff > 0 ? move('up') : move('down');
    }
    
    // Reset touch points
    setTouchStart(null);
    setTouchEnd(null);
  };

  // Initialize the game on component mount or when level changes
  useEffect(() => {
    initializeGame();
  }, [initializeGame, currentLevel]);

  // Set up keyboard event listeners
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // Custom hook for media queries
  const useMediaQuery = (query) => {
    const [matches, setMatches] = useState(false);
  
    useEffect(() => {
      const media = window.matchMedia(query);
      if (media.matches !== matches) {
        setMatches(media.matches);
      }
      
      const listener = () => setMatches(media.matches);
      window.addEventListener('resize', listener);
      
      return () => window.removeEventListener('resize', listener);
    }, [matches, query]);
  
    return matches;
  };
  
  const isMobile = useMediaQuery('(max-width: 640px)');

  return (
    <div 
      className={`min-h-screen w-full flex flex-col items-center justify-between transition-colors duration-300 overflow-hidden ${
        darkMode 
          ? 'bg-gradient-to-b from-gray-900 to-gray-800 text-white' 
          : 'bg-gradient-to-b from-blue-50 to-gray-100 text-gray-800'
      }`}
    >
      {/* Add viewport meta tag with touch-action manipulation */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, touch-action=manipulation" />
      
      {/* Main content container */}
      <div className="w-full max-w-md px-4 py-4 sm:py-8 overflow-hidden">
        <div className="flex flex-wrap justify-between items-center mb-6">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-4" // Add space between title and buttons
          >
            <div className="flex items-center"> {/* Title and level container */}
              <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-500 to-orange-600">
                2048
              </h1>
              <span className="ml-2 text-sm bg-gradient-to-r from-amber-600 to-red-600 text-white px-2 py-1 rounded-full">
                LVL {currentLevel}
              </span>
            </div>
          </motion.div>
          
          <div className="flex flex-wrap gap-2 mt-2 sm:mt-0"> {/* Added flex-wrap and adjusted margins */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`p-2 rounded-full ${
                darkMode 
                  ? 'bg-gray-800 hover:bg-gray-700 shadow-inner' 
                  : 'bg-white hover:bg-gray-100 shadow'
              }`}
              onClick={() => setDarkMode(!darkMode)}
              aria-label="Toggle dark mode"
            >
              {darkMode ? <FiSun size={20} /> : <FiMoon size={20} />}
            </motion.button>
            
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`p-2 rounded-full ${
                darkMode 
                  ? 'bg-gray-800 hover:bg-gray-700 shadow-inner' 
                  : 'bg-white hover:bg-gray-100 shadow'
              }`}
              onClick={initializeGame}
              aria-label="New game"
            >
              <FiRefreshCw size={20} />
            </motion.button>
            
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`p-2 rounded-full ${
                darkMode 
                  ? 'bg-gray-800 hover:bg-gray-700 shadow-inner' 
                  : 'bg-white hover:bg-gray-100 shadow'
              }`}
              onClick={() => {
                setShowInfo(true);
                setShowAchievements(false);
              }}
              aria-label="Show info"
            >
              <FiInfo size={20} />
            </motion.button>
            
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`p-2 rounded-full ${
                darkMode 
                  ? 'bg-gray-800 hover:bg-gray-700 shadow-inner' 
                  : 'bg-white hover:bg-gray-100 shadow'
              }`}
              onClick={() => {
                setShowAchievements(true);
                setShowInfo(false);
              }}
              aria-label="Show achievements"
            >
              <FiAward size={20} />
            </motion.button>
            
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`p-2 rounded-full ${
                history.length > 0 
                  ? darkMode 
                    ? 'bg-gray-800 hover:bg-gray-700 shadow-inner' 
                    : 'bg-white hover:bg-gray-100 shadow'
                  : darkMode 
                    ? 'bg-gray-800 opacity-50 cursor-not-allowed shadow-inner' 
                    : 'bg-white opacity-50 cursor-not-allowed shadow'
              }`}
              onClick={undoMove}
              disabled={history.length === 0}
              aria-label="Undo move"
            >
              <FiArrowLeft size={20} />
            </motion.button>
          </div>
        </div>
        
        <div className="flex justify-between mb-6">
          <motion.div 
            className={`p-3 rounded-lg ${
              darkMode 
                ? 'bg-gray-800 bg-opacity-80 shadow-lg' 
                : 'bg-white bg-opacity-90 shadow-lg'
            }`}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="text-sm uppercase font-semibold opacity-70">Score</div>
            <div className="text-2xl font-bold">{score.toLocaleString()}</div>
          </motion.div>
          
          <motion.div 
            className={`p-3 rounded-lg ${
              darkMode 
                ? 'bg-gray-800 bg-opacity-80 shadow-lg' 
                : 'bg-white bg-opacity-90 shadow-lg'
            }`}
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            <div className="text-sm uppercase font-semibold opacity-70 text-center">Target</div>
            <div className="text-2xl font-bold text-center text-amber-500">{currentLevelTarget.toLocaleString()}</div>
          </motion.div>
          
          <motion.div 
            className={`p-3 rounded-lg ${
              darkMode 
                ? 'bg-gray-800 bg-opacity-80 shadow-lg' 
                : 'bg-white bg-opacity-90 shadow-lg'
            }`}
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="text-sm uppercase font-semibold opacity-70">Best</div>
            <div className="text-2xl font-bold">{bestScore.toLocaleString()}</div>
          </motion.div>
        </div>
        
        <motion.div 
          className={`relative w-full aspect-square p-2 sm:p-3 rounded-lg mb-4 sm:mb-6 touch-none ${
            darkMode 
              ? 'bg-gray-800 bg-opacity-80 shadow-lg' 
              : 'bg-white bg-opacity-90 shadow-lg'
          }`}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="relative w-full h-full grid grid-cols-4 grid-rows-4 gap-2">
            {/* Background cells */}
            {board.flat().map((_, index) => (
              <div
                key={`bg-${index}`}
                className={`rounded-md ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}
              />
            ))}
            
            {/* Actual tiles */}
            <AnimatePresence>
              {board.map((row, i) =>
                row.map((cell, j) => {
                  if (cell === 0) return null;
                  
                  const isMerged = mergedCells.some(
                    item => item.row === i && item.col === j
                  );
                  
                  return (
                    <motion.div
                      key={`tile-${i}-${j}`}
                      className={`absolute ${getTileColor(cell)} ${getTileFontSize(cell)} 
                        flex items-center justify-center rounded-lg font-bold shadow-lg`}
                      style={{
                        left: `calc(${j * 25}% + 15px)`,
                        top: `calc(${i * 25}% + 15px)`,
                        width: 'calc(25% - 30px)',
                        height: 'calc(25% - 30px)'
                      }}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                    >
                      {cell}
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Enhanced Game Status Messages */}
        <AnimatePresence>
          {(gameOver || won) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mt-6 p-4 rounded-xl text-center ${panelStyle}`}
            >
              {won ? (
                <>
                  <h3 className="text-xl font-bold mb-2 text-green-400">Level Complete!</h3>
                  <button
                    onClick={advanceToNextLevel}
                    className={`px-6 py-2 rounded-full ${
                      darkMode 
                        ? 'bg-green-600 hover:bg-green-700' 
                        : 'bg-green-500 hover:bg-green-600 text-white'
                    }`}
                  >
                    Advance to Level {currentLevel + 1}
                  </button>
                </>
              ) : (
                <>
                  <h3 className="text-xl font-bold mb-2 text-red-400">Game Over!</h3>
                  <button
                    onClick={initializeGame}
                    className={`px-6 py-2 rounded-full ${
                      darkMode 
                        ? 'bg-red-600 hover:bg-red-700' 
                        : 'bg-red-500 hover:bg-red-600 text-white'
                    }`}
                  >
                    Try Again
                  </button>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Move footer here, right after the game status messages */}
        <div className="flex flex-col items-center mt-4 gap-2">
          <span className={`text-base sm:text-lg font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Made by Naveed
          </span>
          <a
            href="https://github.com/naveed-gung/"
            target="_blank"
            rel="noopener noreferrer"
            className={`p-2 rounded-full transition-colors duration-200 ${
              darkMode 
                ? 'hover:bg-gray-700' 
                : 'hover:bg-gray-200'
            }`}
          >
            <FiGithub size={20} />
          </a>
        </div>
      </div>

      {/* Enhanced Modals */}
      <AnimatePresence>
        {showInfo && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowInfo(false)}
          >
            <motion.div 
              className={`${panelStyle} rounded-2xl p-6 max-w-md w-full`}
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">How to Play</h2>
                <button 
                  onClick={() => setShowInfo(false)}
                  className="p-2 hover:opacity-70"
                >
                  ×
                </button>
              </div>
              <div className="space-y-4">
                <p>Use your arrow keys to move the tiles. When two tiles with the same number touch, they merge into one!</p>
                <div className="space-y-2">
                  <h3 className="font-bold">Controls:</h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Arrow Keys: Move tiles</li>
                    <li>Undo Button: Reverse last move</li>
                    <li>R: Restart game</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h3 className="font-bold">Tips:</h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Try to keep your highest number in a corner</li>
                    <li>Don't spread out your big numbers</li>
                    <li>Plan ahead!</li>
                  </ul>
                </div>
                <p className="text-sm opacity-70">Current Level Target: {currentLevelTarget}</p>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showAchievements && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAchievements(false)}
          >
            <motion.div 
              className={`${panelStyle} rounded-2xl p-6 max-w-md w-full`}
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Achievements</h2>
                <button 
                  onClick={() => setShowAchievements(false)}
                  className="p-2 hover:opacity-70"
                >
                  ×
                </button>
              </div>
              <div className="space-y-4">
                {achievements.length === 0 ? (
                  <p className="text-center py-4 opacity-70">No achievements yet. Keep playing!</p>
                ) : (
                  <div className="grid gap-3">
                    {achievements.map(achievement => (
                      <motion.div
                        key={achievement.id}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        className={`p-3 rounded-lg ${
                          darkMode ? 'bg-gray-700' : 'bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${
                            darkMode ? 'bg-gray-600' : 'bg-white'
                          }`}>
                            <FiAward className="text-amber-500" size={24} />
                          </div>
                          <div>
                            <h3 className="font-bold">{achievement.title}</h3>
                            <p className="text-sm opacity-70">{achievement.description}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
                <div className="mt-4 pt-4 border-t border-gray-700 space-y-2">
                  <button
                    onClick={clearCurrentScore}
                    className={`w-full p-2 rounded-lg ${
                      darkMode 
                        ? 'bg-yellow-600 hover:bg-yellow-700' 
                        : 'bg-yellow-500 hover:bg-yellow-600'
                    } text-white transition-colors`}
                  >
                    Clear Current Score
                  </button>
                  <button
                    onClick={clearAllScores}
                    className={`w-full p-2 rounded-lg ${
                      darkMode 
                        ? 'bg-red-600 hover:bg-red-700' 
                        : 'bg-red-500 hover:bg-red-600'
                    } text-white transition-colors`}
                  >
                    Reset All Progress
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Home;