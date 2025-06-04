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

const settings = ['Aprovar inscrição', 'Alterar níveis de permissão', 'Gerenciar postagens','Sair'];

function clearCookies() {
  document.cookie.split(";").forEach(function (c) {
    document.cookie = c
      .replace(/^ +/, "")
      .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
  });
}

function ResponsiveAppBar() {
  const [anchorElUser, setAnchorElUser] = React.useState(null);
  const [userRole, setUserRole] = React.useState('');
  const navigate = useNavigate();

  const getEmailFromCookie = () => {
    const cookie = document.cookie.split('; ').find(row => row.startsWith('email='));
    return cookie ? cookie.split('=')[1] : null;
  };

  React.useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const email = getEmailFromCookie();
        if (!email) return;

        // Exemplo de requisição autenticada
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:8000/get-user-type', {
          params: { email },
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const role = response.data.replace('Tipo de usuário: ', '').trim();
        setUserRole(role);
      } catch (error) {
        console.error('Erro ao obter o papel do usuário', error);
      }
    };

    fetchUserRole();
  }, []);

  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
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
            <AdbIcon sx={{ mr: 1, color: 'black' }} /> {/* ícone preto */}
            <Typography
              variant="h6"
              noWrap
              sx={{
                fontFamily: 'monospace',
                fontWeight: 700,
                letterSpacing: '.3rem',
                color: 'black', // texto preto
                textDecoration: 'none',
              }}
            >
              LOGO
            </Typography>
          </Box>

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
              anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
              keepMounted
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              open={Boolean(anchorElUser)}
              onClose={handleCloseUserMenu}
            >
              {settings.map((setting) => {
                const isMasterOnly = ['Aprovar inscrição', 'Alterar níveis de permissão'].includes(setting);
                if (isMasterOnly && userRole !== 'master') return null;

                return (
                  <MenuItem
                    key={setting}
                    onClick={() => {
                      handleCloseUserMenu();
                      if (setting === 'Sair') {
                        localStorage.removeItem('token');
                        clearCookies();
                        navigate('/login');
                      } else if (setting === 'Aprovar inscrição') {
                        navigate('/UserActiveList');
                      } else if (setting === 'Alterar níveis de permissão') {
                        navigate('/UserList');
                      } else if (setting === 'Gerenciar postagens') {
                        navigate('/user/posts');
                      }
                    }}
                  >
                    <Typography textAlign="center">{setting}</Typography>
                  </MenuItem>
                );
              })}
            </Menu>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}

export default ResponsiveAppBar;
