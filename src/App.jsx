import { Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import "./index.css";
import Home from "./pages/Home";
import WelcomeScreen from "./components/WelcomeScreen";

function App() {
  const [showWelcome, setShowWelcome] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowWelcome(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {showWelcome ? (
        <WelcomeScreen />
      ) : (
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      )}
    </>
  );
}

export default App;