import { createContext, useContext, useReducer } from 'react';

const GameContext = createContext();

const initialState = {
  board: [],
  size: 4,
  score: 0,
  history: [],
  historyIndex: -1,
  customStartNumbers: [2, 4],
  gameState: 'idle', // idle, playing, paused, gameOver
  aiMode: false
};

function gameReducer(state, action) {
  switch (action.type) {
    case 'INIT_BOARD':
      return {
        ...state,
        board: action.payload.board,
        size: action.payload.size,
        gameState: 'playing'
      };
    case 'MAKE_MOVE':
      return {
        ...state,
        board: action.payload.board,
        score: state.score + action.payload.scoreDelta,
        history: [...state.history.slice(0, state.historyIndex + 1), state.board],
        historyIndex: state.historyIndex + 1
      };
    case 'UNDO':
      if (state.historyIndex < 0) return state;
      return {
        ...state,
        board: state.history[state.historyIndex],
        historyIndex: state.historyIndex - 1
      };
    case 'REDO':
      if (state.historyIndex >= state.history.length - 1) return state;
      return {
        ...state,
        board: state.history[state.historyIndex + 1],
        historyIndex: state.historyIndex + 1
      };
    case 'CHANGE_SIZE':
      return {
        ...state,
        size: action.payload,
        board: [],
        history: [],
        historyIndex: -1,
        score: 0
      };
    case 'SET_CUSTOM_NUMBERS':
      return {
        ...state,
        customStartNumbers: action.payload
      };
    case 'TOGGLE_AI':
      return {
        ...state,
        aiMode: !state.aiMode
      };
    default:
      return state;
  }
}

export const GameProvider = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
