import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  TextField,
  Avatar,
  TableSortLabel,
} from '@mui/material';

import SearchIcon from '@mui/icons-material/Search';
import InputAdornment from '@mui/material/InputAdornment';


const UserActiveList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [orderBy, setOrderBy] = useState('name');
  const [order, setOrder] = useState('asc');
  const navigate = useNavigate();

  useEffect(() => {
    // Verifica o tipo de usuário pelo token
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    try {
      const decoded = jwtDecode(token);
      console.log('Token decodificado:', decoded); // Veja todos os campos do token
      const userType = decoded.role; // <-- ALTERADO para 'role'
      console.log('User type extraído do token:', userType);
      if (userType !== 'admin' && userType !== 'master') {
        navigate('/');
        return;
      }
    } catch (e) {
      navigate('/login');
      return;
    }

    axios.get("https://backend-gfig.onrender.com/admin/users", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(response => {
        const pendingUsers = response.data.filter(user => user.user_type === 'pending');
        setUsers(pendingUsers);
        setLoading(false);
      })
      .catch(error => {
        console.error("Erro ao buscar usuários:", error);
        setLoading(false);
      });
  }, [navigate]);

  const handleUserApproval = (userId, decision) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Token não encontrado. Faça login novamente.');
      navigate('/login');
      return;
    }

    const newUserType = decision === 'approve' ? 'user' : 'reproved';

    const payload = {
      id: userId,
      role: newUserType
    };

    axios.put("https://backend-gfig.onrender.com/admin/approveOrRejectUser", payload, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(() => setUsers(users.filter(user => user.id !== userId)))
      .catch(error => {
        console.error("Erro ao atualizar tipo de usuário:", error);
        alert("Erro ao atualizar tipo de usuário.");
      });
  };

  const handleSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const sortedUsers = [...users].sort((a, b) => {
    const aVal = a[orderBy].toLowerCase();
    const bVal = b[orderBy].toLowerCase();
    if (aVal < bVal) return order === 'asc' ? -1 : 1;
    if (aVal > bVal) return order === 'asc' ? 1 : -1;
    return 0;
  });

  const filteredUsers = sortedUsers.filter(user =>
    user.name.toLowerCase().includes(search.toLowerCase()) ||
    user.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div>Carregando...</div>;

  return (
    <Box sx={{ padding: 3, maxWidth: '1200px', display: 'flex', flexDirection: 'column', gap: 2, margin: '0 auto', alignItems: 'center' }}>
      <Paper elevation={3} sx={{ borderRadius: 4, p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Tabela de Usuários Pendentes
          </Typography>

          <TextField
            variant="outlined"
            placeholder="Pesquisar"
            size="small"
            onChange={(e) => setSearch(e.target.value)}
            sx={{ width: 250, borderRadius: '12px', backgroundColor: 'white' }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
              sx: { borderRadius: '12px' }
            }}
          />


        </Box>

        <TableContainer sx={{ width: 1200, maxHeight: 800 }}>
          <Table stickyHeader>
            <TableHead sx={{ backgroundColor: '#F4F6F8' }}>
              <TableRow sx={{ backgroundColor: '#F4F6F8' }}>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#F4F6F8' }}>
                  <TableSortLabel
                    active={orderBy === 'name'}
                    direction={orderBy === 'name' ? order : 'asc'}
                    onClick={() => handleSort('name')}
                  >
                    Usuário
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#F4F6F8' }}>
                  <TableSortLabel
                    active={orderBy === 'email'}
                    direction={orderBy === 'email' ? order : 'asc'}
                    onClick={() => handleSort('email')}
                  >
                    E-mail
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#F4F6F8' }}>
                  Ação
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers.map(user => (
                <TableRow
                  key={user.id}
                  sx={{
                    '&:hover': { backgroundColor: '#f5f5f5' },
                    transition: '0.2s',
                  }}
                >
                  <TableCell sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar sx={{ width: 40, height: 40 }} />
                    <Box>
                      <Typography fontWeight="bold">{user.name}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{user.email}</Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="contained"
                        size="small"
                        sx={{ backgroundColor: '#34d399', color: '#fff', textTransform: 'none' }}
                        onClick={() => handleUserApproval(user.id, 'approve')}
                      >
                        Aprovar
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        color="error"
                        sx={{ textTransform: 'none' }}
                        onClick={() => handleUserApproval(user.id, 'reject')}
                      >
                        Reprovar
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}

              {filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} align="center">
                    Nenhum usuário encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default UserActiveList;
