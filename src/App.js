import React, { useState } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route
} from 'react-router-dom';

import Sidebar from './components/Sidebar';
import Header from './components/Header';

import HomePage from './pages/HomePage';
import DataExtraction from './pages/DataExtraction';
import ScrapedResults from './pages/ScrapedResults';
import DataAnalysis from './pages/DataAnalysis';
import DataVisualization from './pages/DataVisualization';

import './App.css'; // make sure to create or use this for layout CSS

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <Router>
      <Header />

      <div className="app-container">
        <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

        <div className={`main-content ${sidebarOpen ? 'with-sidebar' : 'full-width'}`}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/data-extraction" element={<DataExtraction />} />
            <Route path="/scraped-results" element={<ScrapedResults />} />
            <Route path="/data-analysis" element={<DataAnalysis />} />
            <Route path="/data-visualization" element={<DataVisualization />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
