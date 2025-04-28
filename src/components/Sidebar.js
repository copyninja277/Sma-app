import React from 'react';
import { Link } from 'react-router-dom';
import { FaBars, FaTimes } from 'react-icons/fa';
import './Sidebar.css';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  return (
    <>
      {/* Toggle Button */}
      <button
        className={`sidebar-toggle-btn ${isOpen ? 'right' : 'left'}`}
        onClick={toggleSidebar}
      >
        {isOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
      </button>

      {/* Sidebar Content */}
      <div className={`sidebar ${isOpen ? '' : 'hidden'}`}>
        <h3></h3>
        <ul>
          <li><Link to="/">Home</Link></li>
          <li><Link to="/data-extraction">Data Extraction</Link></li>
          <li><Link to="/scraped-results">Data CSV</Link></li>
          <li><Link to="/data-analysis">Data Analysis</Link></li>
          <li><Link to="/data-visualization">Data Visualization</Link></li>
        </ul>
      </div>
    </>
  );
};

export default Sidebar;
