import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Menu from '@mui/material/Menu';
import Container from '@mui/material/Container';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import AdbIcon from '@mui/icons-material/Adb';
import AccountCircle from '@mui/icons-material/AccountCircle';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { jwtDecode } from "jwt-decode";

const masterSettings = ['Aprovar inscrição', 'Alterar níveis de permissão', 'Gerenciar postagens', 'Configurações', 'Sair'];
const adminSettings = ['Aprovar inscrição', 'Gerenciar postagens', 'Configurações', 'Sair'];
const userSettings = ['Configurações', 'Sair'];
const unauthenticatedSettings = ['Entrar'];

function ResponsiveAppBar() {
  const [anchorElUser, setAnchorElUser] = React.useState(null);
  const [userRole, setUserRole] = React.useState('');
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [userName, setUserName] = React.useState(''); // Novo estado
  const navigate = useNavigate();

  React.useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);

    if (!token) return;

    try {
      const decoded = jwtDecode(token);
      setUserName(decoded.name || decoded.userName || ''); // Ajuste conforme o campo do seu token
      setUserRole(decoded.role || '');
    } catch (error) {
      console.error('Erro ao decodificar token', error);
    }
  }, []);

  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const getSettingsForRole = () => {
    if (userRole === 'master') return masterSettings;
    if (userRole === 'admin') return adminSettings;
    if (userRole === 'user') return userSettings;
    return [];
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setUserRole('');
    navigate('/login');
  };

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        backgroundColor: 'transparent',
        borderBottom: '1px solid black',
        backdropFilter: 'blur(10px)',
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
    >
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={{ justifyContent: 'space-between' }}>
          {/* Logo e nome */}
          <Box
            sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
            onClick={() => navigate('/')}
          >
            <Box
              component="img"
              src="data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiA/PjxzdmcgaGVpZ2h0PSI1MTIiIHZpZXdCb3g9IjAgMCA1MTIgNTEyIiB3aWR0aD0iNTEyIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjx0aXRsZS8+PHBhdGggZD0iTTQ3Ny42NCwzOC4yNmE0Ljc1LDQuNzUsMCwwLDAtMy41NS0zLjY2Yy01OC41Ny0xNC4zMi0xOTMuOSwzNi43MS0yNjcuMjIsMTEwYTMxNywzMTcsMCwwLDAtMzUuNjMsNDIuMWMtMjIuNjEtMi00NS4yMi0uMzMtNjQuNDksOC4wN0M1Mi4zOCwyMTguNywzNi41NSwyODEuMTQsMzIuMTQsMzA4YTkuNjQsOS42NCwwLDAsMCwxMC41NSwxMS4yTDEzMCwzMDkuNTdhMTk0LjEsMTk0LjEsMCwwLDAsMS4xOSwxOS43LDE5LjUzLDE5LjUzLDAsMCwwLDUuNywxMkwxNzAuNywzNzVhMTkuNTksMTkuNTksMCwwLDAsMTIsNS43LDE5My41MywxOTMuNTMsMCwwLDAsMTkuNTksMS4xOWwtOS41OCw4Ny4yYTkuNjUsOS42NSwwLDAsMCwxMS4yLDEwLjU1YzI2LjgxLTQuMyw4OS4zNi0yMC4xMywxMTMuMTUtNzQuNSw4LjQtMTkuMjcsMTAuMTItNDEuNzcsOC4xOC02NC4yN2EzMTcuNjYsMzE3LjY2LDAsMCwwLDQyLjIxLTM1LjY0QzQ0MSwyMzIuMDUsNDkxLjc0LDk5Ljc0LDQ3Ny42NCwzOC4yNlpNMjk0LjA3LDIxNy45M2E0OCw0OCwwLDEsMSw2Ny44NiwwQTQ3Ljk1LDQ3Ljk1LDAsMCwxLDI5NC4wNywyMTcuOTNaIi8+PHBhdGggZD0iTTE2OC40LDM5OS40M2MtNS40OCw1LjQ5LTE0LjI3LDcuNjMtMjQuODUsOS40Ni0yMy43Nyw0LjA1LTQ0Ljc2LTE2LjQ5LTQwLjQ5LTQwLjUyLDEuNjMtOS4xMSw2LjQ1LTIxLjg4LDkuNDUtMjQuODhhNC4zNyw0LjM3LDAsMCwwLTMuNjUtNy40NSw2MCw2MCwwLDAsMC0zNS4xMywxNy4xMkM1MC4yMiwzNzYuNjksNDgsNDY0LDQ4LDQ2NHM4Ny4zNi0yLjIyLDExMC44Ny0yNS43NUE1OS42OSw1OS42OSwwLDAsMCwxNzYsNDAzLjA5QzE3Ni4zNywzOTguOTEsMTcxLjI4LDM5Ni40MiwxNjguNCwzOTkuNDNaIi8+PC9zdmc+"
              alt="Logo"
              sx={{ width: 32, height: 32, mr: 1 }}
            />
            <Typography
              variant="h6"
              noWrap
              sx={{
                fontFamily: 'monospace',
                fontWeight: 700,
                letterSpacing: '.3rem',
                color: 'black',
                textDecoration: 'none',
              }}
            >
              GFIG
            </Typography>
          </Box>

          {/* Mensagem de boas-vindas */}
          {isAuthenticated && userName && (
            <Typography sx={{ color: 'black', mr: 2 }}>
              Olá, {userName}
            </Typography>
          )}

          {/* Ícone de usuário */}
          <Box sx={{ flexGrow: 0 }}>
            <Tooltip title="Abrir configurações">
              <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                <AccountCircle sx={{ fontSize: 32, color: 'black' }} />
              </IconButton>
            </Tooltip>
            <Menu
              sx={{ mt: '45px' }}
              anchorEl={anchorElUser}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorElUser)}
              onClose={handleCloseUserMenu}
            >
              {!isAuthenticated ? (
                <MenuItem
                  onClick={() => {
                    handleCloseUserMenu();
                    navigate('/login');
                  }}
                >
                  <Typography textAlign="center">Entrar</Typography>
                </MenuItem>
              ) : (
                getSettingsForRole().map((setting) => (
                  <MenuItem
                    key={setting}
                    onClick={() => {
                      handleCloseUserMenu();
                      if (setting === 'Sair') {
                        handleLogout();
                      } else if (setting === 'Aprovar inscrição') {
                        navigate('/UserActiveList');
                      } else if (setting === 'Alterar níveis de permissão') {
                        navigate('/UserList');
                      } else if (setting === 'Gerenciar postagens') {
                        navigate('/user/posts');
                      } else if (setting === 'Configurações') {
                        navigate('/user/settings');
                      }
                    }}
                  >
                    <Typography textAlign="center">{setting}</Typography>
                  </MenuItem>
                ))
              )}
            </Menu>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}

export default ResponsiveAppBar;