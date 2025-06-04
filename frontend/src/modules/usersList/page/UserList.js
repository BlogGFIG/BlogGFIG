import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Select, MenuItem, FormControl, InputLabel, Paper, Box } from '@mui/material';
import { showSucessToast } from '../../../shared/components/toasters/SucessToaster';
import { showErrorToast } from '../../../shared/components/toasters/ErrorToaster';
import { jwtDecode } from "jwt-decode";
import { useNavigate } from 'react-router-dom';

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Extrai a role do token
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUserRole(decoded.role);
        console.log("Role do usuário:", decoded.role);
      } catch (e) {
        setUserRole(null);
        console.error("Token inválido:", e);
      }
    } else {
      setUserRole(null);
    }
  }, []);

  useEffect(() => {
    if (userRole === "admin" || userRole === "master") {
      const token = localStorage.getItem('token');
      axios.get("http://localhost:8000/admin/users", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
        .then(response => {
          console.log("Dados recebidos do backend:", response.data);
          setUsers(response.data);
          setLoading(false);
        })
        .catch(error => {
          console.error("Erro ao buscar usuários:", error);
          setLoading(false);
        });
    }
  }, [userRole]);

  // Bloqueia acesso se não for admin ou master
  if (userRole !== "admin" && userRole !== "master") {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <h2>Acesso negado</h2>
        <p>Você não tem permissão para acessar esta página.</p>
        <Button variant="contained" onClick={() => navigate('/')}>Voltar para Home</Button>
      </Box>
    );
  }

  const handleToggleUserStatus = (userId, currentStatus) => {
    const requesterEmail = Cookies.get('email');
    if (!requesterEmail) {
      alert('E-mail do usuário não encontrado nos cookies.');
      return;
    }

    const newStatus = currentStatus === "ativo" ? "inativo" : "ativo";

    const payload = {
      id: userId,
      requester_email: requesterEmail,
    };

    const token = localStorage.getItem('token');

    axios.put("http://localhost:8000/admin/ativarOuInativar", payload, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(() => {
        setUsers(users.map(user =>
          user.id === userId ? { ...user, status: newStatus } : user
        ));
      })
      .catch(error => {
        console.error("Erro ao atualizar o status do usuário:", error);
        showErrorToast("Erro ao atualizar o status do usuário");
      });
  };

  const handleUserTypeChange = (userId, newUserType) => {
    setUsers(users.map(user =>
      user.id === userId ? { ...user, user_type: newUserType } : user
    ));
  };

  const handleSaveUserRole = (userId, newRole) => {
    // Pega o token do localStorage
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Token não encontrado.');
      return;
    }

    // Decodifica o token para pegar o email
    let requesterEmail;
    try {
      const decoded = jwtDecode(token);
      requesterEmail = decoded.email;
    } catch (e) {
      alert('Token inválido.');
      return;
    }

    if (!requesterEmail) {
      alert('E-mail do usuário não encontrado no token.');
      return;
    }

    const payload = {
      id: userId,
      role: newRole,
      requester_email: requesterEmail
    };

    axios.put("http://localhost:8000/master/updateUserRole", payload, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(() => {
        // Exibe o toast de sucesso
        showSucessToast("Nível de usuário atualizado com sucesso!");

        // Recarregar os dados após salvar
        axios.get("http://localhost:8000/admin/users", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
          .then(response => {
            setUsers(response.data); // Atualiza o estado com os dados mais recentes
          })
          .catch(error => {
            console.error("Erro ao buscar usuários:", error);
            showErrorToast("Erro ao buscar usuários.");
          });
      })
      .catch(error => {
        console.error("Erro ao atualizar a role do usuário:", error);
        showErrorToast("Erro ao atualizar a role do usuário");
      });
  };

  if (loading) return <div>Carregando...</div>;

  // Não filtra por status, pois não existe esse campo
  // const sortedUsers = users;
  // Filtra para mostrar apenas usuários cujo user_type é diferente de 'pending'
  const sortedUsers = users.filter(user => user.user_type !== 'pending' && user.user_type !== 'reproved');

  // Pega o email do usuário logado a partir do token
  let loggedUserEmail = "";
  const token = localStorage.getItem('token');
  if (token) {
    try {
      const decoded = jwtDecode(token);
      loggedUserEmail = decoded.email;
    } catch (e) {
      loggedUserEmail = "";
    }
  }

  return (
    <Box sx={{ width: '98%', overflowX: 'auto', padding: 2 }}>
      <Paper sx={{ width: '100%', overflow: 'auto', boxShadow: 3 }}>
        <TableContainer>
          <Table stickyHeader sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#3f51b5' }}>
                <TableCell sx={{ fontWeight: 'bold', color: 'black' }}>Nome do Usuário</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'black' }}>Endereço de E-mail</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'black' }}>Tipo de Usuário</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'black' }}>Ação</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedUsers.map(user => (
                <TableRow key={user.id} sx={{ '&:hover': { backgroundColor: '#f5f5f5' } }}>
                  <TableCell sx={{ wordBreak: 'break-word' }}>{user.name}</TableCell>
                  <TableCell sx={{ wordBreak: 'break-word' }}>{user.email}</TableCell>
                  <TableCell>
                    <FormControl fullWidth>
                      <InputLabel>Nível</InputLabel>
                      <Select
                        value={user.user_type || ""}
                        onChange={(e) => handleUserTypeChange(user.id, e.target.value)}
                        sx={{ backgroundColor: '#fff' }}
                        disabled={
                          user.user_type === "master" &&
                          user.email === loggedUserEmail
                        }
                      >
                        <MenuItem value="admin">Admin</MenuItem>
                        <MenuItem value="master">Master</MenuItem>
                        <MenuItem value="user">User</MenuItem>
                      </Select>
                    </FormControl>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      variant="contained"
                      color="primary"
                      onClick={() => handleSaveUserRole(user.id, user.user_type)}
                      sx={{ marginLeft: 1 }}
                      disabled={
                        user.user_type === "master" &&
                        user.email === loggedUserEmail
                      }
                    >
                      Salvar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      <style>
        {`body { overflow-x: hidden; }`}
      </style>
    </Box>
  );
};

export default UserList;
