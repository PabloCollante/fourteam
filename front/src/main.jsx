import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import './style.css';

try {
  const guardado = localStorage.getItem('fourteam-tema');
  document.documentElement.dataset.theme = ['light', 'dark'].includes(guardado) ? guardado : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
} catch { document.documentElement.dataset.theme = 'light'; }

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
