// src/App.jsx (AFTER)
import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './components/Navbar'; // 1. Import the Navbar

function App() {
  return (
    <div className="app-container">
      {/* 2. Replace the old header with the Navbar component */}
      <Navbar />

      <main>
        <Outlet />
      </main>

      <footer>
        <p>&copy; 2025 SafeZone</p>
      </footer>
    </div>
  );
}

export default App;
