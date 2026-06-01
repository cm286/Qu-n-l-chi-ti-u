import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import MonthlyReport from "./pages/MonthlyReport";
import AdminPanel from "./pages/AdminPanel";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || 'null');
    } catch {
      return null;
    }
  });
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem("isDark") === "true";
  });

  useEffect(() => {
    localStorage.setItem("isDark", isDark);
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  useEffect(() => {
    if (token) {
      try {
        setUser(JSON.parse(localStorage.getItem("user") || 'null'));
      } catch {
        setUser(null);
      }
    } else {
      setUser(null);
    }
  }, [token]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login setToken={setToken} />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={token ? <Dashboard isDark={isDark} setIsDark={setIsDark} /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/reports/monthly"
          element={token ? <MonthlyReport /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/admin"
          element={token && user?.role === 'admin' ? <AdminPanel /> : <Navigate to="/dashboard" replace />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
