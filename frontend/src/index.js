import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import reportWebVitals from './reportWebVitals';
import Routers from './routers/Routers';
import AppBar from './shared/components/appBar/AppBar';
import { Box } from '@mui/material';
import { BrowserRouter, useLocation } from 'react-router-dom';

const AppWrapper = () => {
  const location = useLocation();

  // Verifica se está na rota /login
  const isLoginPage = location.pathname === '/login';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', position: 'relative', marginTop: '64px' }}>
      {!isLoginPage && <AppBar />}
      <Routers />
    </Box>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AppWrapper />
    </BrowserRouter>
  </React.StrictMode>
);

reportWebVitals();
