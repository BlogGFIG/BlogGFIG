import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import reportWebVitals from './reportWebVitals';
import Routers from './routers/Routers';
import AppBar from './shared/components/appBar/AppBar';
import { Box } from '@mui/material';
import { BrowserRouter } from 'react-router-dom';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
  <BrowserRouter>
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', position: 'relative' }}>
      <AppBar />
      <Routers />
    </Box>
  </BrowserRouter>
</React.StrictMode>

);

reportWebVitals();
