import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const WelcomeScreen = () => {
  const navigate = useNavigate();
  const [darkMode] = useLocalStorage('2048-dark-mode', true);
  const [loading, setLoading] = useState(0);

  // Update loading progress
  useEffect(() => {
    const interval = setInterval(() => {
      setLoading(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 2; // Increment by 2 for smooth 5-second loading (50 steps)
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/home');
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center transition-colors duration-300 ${
      darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-800'
    }`}>
      <motion.div
        className="flex flex-col items-center justify-center gap-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Logo/Title */}
        <motion.div 
          className="flex items-center justify-center"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          {/* Game logo with grid effect */}
          <div className="grid grid-cols-2 grid-rows-2 gap-2 w-32 h-32">
            {[2, 4, 8, 16].map((num, index) => (
              <motion.div
                key={index}
                className={`flex items-center justify-center rounded-md font-bold text-xl sm:text-2xl
                  ${num === 2 ? 'bg-gray-700 text-gray-100' : ''}
                  ${num === 4 ? 'bg-gray-600 text-gray-100' : ''}
                  ${num === 8 ? 'bg-amber-800 text-white' : ''}
                  ${num === 16 ? 'bg-amber-700 text-white' : ''}
                `}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.2 }}
              >
                {num}
              </motion.div>
            ))}
          </div>
          <motion.h1 
            className="text-5xl font-bold ml-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            2048 ≤
          </motion.h1>
        </motion.div>

        {/* Loading bar */}
        <div className="w-64 sm:w-80">
          <div className="relative h-2 bg-gray-300 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-amber-500 to-yellow-400"
              initial={{ width: "0%" }}
              animate={{ width: `${loading}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <div className="flex justify-between mt-2 text-sm opacity-80">
            <span>Loading...</span>
            <span>{loading}%</span>
          </div>
        </div>

        {/* Tagline */}
        <motion.p
          className="text-lg font-medium opacity-80"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          Merge tiles, reach the goal!
        </motion.p>
      </motion.div>
    </div>
  );
};

// LocalStorage hook
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

export default WelcomeScreen;