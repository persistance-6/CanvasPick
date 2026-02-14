import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// Pages
// import Gallery from './pages/Gallery';
// import ArtworkDetail from './pages/ArtworkDetail';
// import Mint from './pages/Mint';
// import MyAssets from './pages/MyAssets';

export default function App() {
  return (
    <Router>
      <Routes>
        {/* <Route path="/" element={<Gallery />} />
        <Route path="/artwork/:id" element={<ArtworkDetail />} />
        <Route path="/mint" element={<Mint />} />
        <Route path="/my-assets" element={<MyAssets />} /> */}
      </Routes>
    </Router>
  );
}
