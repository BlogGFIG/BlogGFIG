import React, { useEffect, useState } from 'react';
  import axios from 'axios';
  import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Select, MenuItem, FormControl, InputLabel, Paper, Box, TableSortLabel } from '@mui/material';
  import { showSucessToast } from '../../../shared/components/toasters/SucessToaster';
  import { showErrorToast } from '../../../shared/components/toasters/ErrorToaster';
  import { jwtDecode } from "jwt-decode";
  import { useNavigate } from 'react-router-dom';

  const UserList = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState(null);
    const [searchReproved, setSearchReproved] = useState("");
    const [search, setSearch] = useState("");
    const [orderByActive, setOrderByActive] = useState('name');
    const [orderActive, setOrderActive] = useState('asc');
    const [orderByReproved, setOrderByReproved] = useState('name');
    const [orderReproved, setOrderReproved] = useState('asc');
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

    // Função para pegar o email do token
    const getEmailFromToken = () => {
      const token = localStorage.getItem('token');
      if (!token) return null;
      try {
        const decoded = jwtDecode(token);
        return decoded.email || null;
      } catch {
        return null;
      }
    };

    const handleToggleUserStatus = (userId, userStatus) => {
      const requesterEmail = getEmailFromToken();
      if (!requesterEmail) {
        alert('E-mail do usuário não encontrado no token.');
        return;
      }

      // Busca o usuário atual
      const user = users.find(u => u.id === userId);

      let aprovado = null;

      if (user.user_type === "reproved") {
        // Reativa e muda o tipo para "user"
        const confirmed = window.confirm("Tem certeza que deseja reativar esse usuário?");
        if (!confirmed) return;

        const token = localStorage.getItem('token');
        const payload = {
          id: userId,
          role: "user",
          requester_email: requesterEmail
        };

        axios.put("http://localhost:8000/admin/approveOrRejectUser", {
          id: userId,
          role: "user"
        }, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
          .then(() => {
            showSucessToast("Usuário ativado com sucesso!");
            // Atualize a lista de usuários aqui
            const token = localStorage.getItem('token');
            axios.get("http://localhost:8000/admin/users", {
              headers: {
                Authorization: `Bearer ${token}`
              }
            })
              .then(response => setUsers(response.data))
              .catch(() => showErrorToast("Erro ao buscar usuários."));
          })
          .catch(error => {
            showErrorToast("Erro ao ativar usuário");
          });
        return;
      }

      // Confirmação antes de marcar como reprovado
      if (user.user_type !== "reproved") {
        const confirmed = window.confirm("Tem certeza que deseja desativar esse usuário?");
        if (!confirmed) return;
        aprovado = false; // Inativa o usuário
      }

      // Sempre envia para o backend para inativar/reprovar
      const payload = {
        id: userId,
        aprovado: aprovado,
        requester_email: requesterEmail
      };

      const token = localStorage.getItem('token');

      axios.put("http://localhost:8000/admin/ativarOuInativar", payload, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
        .then(() => {
          setUsers(users.map(u =>
            u.id === userId
              ? { ...u, user_type: "reproved" }
              : u
          ));
          showSucessToast("Usuário desativado com sucesso!");
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

    // Funções de ordenação separadas
    const handleRequestSortActive = (property) => {
      const isAsc = orderByActive === property && orderActive === 'asc';
      setOrderActive(isAsc ? 'desc' : 'asc');
      setOrderByActive(property);
    };
    const handleRequestSortReproved = (property) => {
      const isAsc = orderByReproved === property && orderReproved === 'asc';
      setOrderReproved(isAsc ? 'desc' : 'asc');
      setOrderByReproved(property);
    };

    // Função de ordenação genérica
    function sortArray(array, orderBy, order) {
      return [...array].sort((a, b) => {
        if (!a[orderBy] || !b[orderBy]) return 0;
        if (order === 'asc') {
          return a[orderBy].toString().localeCompare(b[orderBy].toString(), 'pt-BR', { sensitivity: 'base' });
        }
        return b[orderBy].toString().localeCompare(a[orderBy].toString(), 'pt-BR', { sensitivity: 'base' });
      });
    }

    if (loading) return <div>Carregando...</div>;

    // Não filtra por status, pois não existe esse campo
    // const sortedUsers = users;
    // Filtra para mostrar apenas usuários cujo user_type é diferente de 'pending' e 'reproved'
    const sortedUsers = users.filter(user => user.user_type !== 'pending' && user.user_type !== 'reproved');

    // Filtra apenas usuários reprovados
    const reprovedUsers = users.filter(user => user.user_type === 'reproved');

    // Filtra os reprovados conforme o texto digitado
    const filteredReprovedUsers = reprovedUsers.filter(user =>
      user.name?.toLowerCase().includes(searchReproved.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchReproved.toLowerCase())
    );

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

    // Filtro para a primeira tabela (usuários não reprovados e não pendentes)
    const filteredSortedUsers = sortedUsers.filter(user =>
      user.name?.toLowerCase().includes(search.toLowerCase()) ||
      user.email?.toLowerCase().includes(search.toLowerCase())
    );

    // Ordena as listas filtradas
    const sortedFilteredUsers = sortArray(filteredSortedUsers, orderByActive, orderActive);
    const sortedFilteredReproved = sortArray(filteredReprovedUsers, orderByReproved, orderReproved);

    return (
      <Box sx={{ padding: 3, maxWidth: '1200px', display: 'flex', flexDirection: 'column', gap: 2, margin: '0 auto', alignItems: 'center' }}>
        <Paper elevation={3} sx={{ borderRadius: 4, p: 2, width: 1200 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <span style={{ fontWeight: 'bold', fontSize: 20 }}>Tabela de Usuários</span>
            <input
              type="text"
              placeholder="Pesquisar usuário..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                padding: '8px',
                borderRadius: '8px',
                border: '1px solid #ccc',
                width: '300px',
                background: 'white'
              }}
            />
          </Box>
          <TableContainer sx={{ width: 1200, maxHeight: 800 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#F4F6F8' }}>
                    <TableSortLabel
                      active={orderByActive === 'name'}
                      direction={orderByActive === 'name' ? orderActive : 'asc'}
                      onClick={() => handleRequestSortActive('name')}
                    >
                      Nome do Usuário
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#F4F6F8' }}>
                    <TableSortLabel
                      active={orderByActive === 'email'}
                      direction={orderByActive === 'email' ? orderActive : 'asc'}
                      onClick={() => handleRequestSortActive('email')}
                    >
                      Endereço de E-mail
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#F4F6F8' }}>
                    <TableSortLabel
                      active={orderByActive === 'user_type'}
                      direction={orderByActive === 'user_type' ? orderActive : 'asc'}
                      onClick={() => handleRequestSortActive('user_type')}
                    >
                      Tipo de Usuário
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#F4F6F8' }}>
                    Ação
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedFilteredUsers.map(user => (
                  <TableRow key={user.id} sx={{ '&:hover': { backgroundColor: '#f5f5f5' }, transition: '0.2s' }}>
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
                        variant="outlined"
                        sx={{
                          color: '#B71D18',
                          borderColor: '#B71D18',
                          textTransform: 'none',
                          '&:hover': {
                            backgroundColor: '#B71D18',
                            color: '#fff',
                            borderColor: '#B71D18',
                          },
                        }}
                        onClick={() => handleToggleUserStatus(user.id, user.status)}
                        disabled={user.user_type === "master" && user.email === loggedUserEmail}
                      >
                        Inativar
                      </Button>
                      <Button
                        variant="contained"
                        sx={{
                          ml: 1,
                          backgroundColor: '#1D252E',
                          color: '#fff',
                          textTransform: 'none',
                          border: '1.5px solid transparent', // Sempre reserva espaço para a borda
                          '&:hover': {
                            backgroundColor: '#fff',
                            color: '#1D252E',
                            border: '1.5px solid #1D252E', // Só muda a cor no hover
                          },
                        }}
                        onClick={() => handleSaveUserRole(user.id, user.user_type)}
                        disabled={user.user_type === "master" && user.email === loggedUserEmail}
                      >
                        Salvar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {sortedFilteredUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      Nenhum usuário encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Tabela de usuários reprovados */}
        <Paper elevation={3} sx={{ borderRadius: 4, p: 2, width: 1200 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <span style={{ fontWeight: 'bold', fontSize: 20 }}>Tabela de Usuários Reprovados</span>
            <input
              type="text"
              placeholder="Pesquisar usuário reprovado..."
              value={searchReproved}
              onChange={e => setSearchReproved(e.target.value)}
              style={{
                padding: '8px',
                borderRadius: '8px',
                border: '1px solid #ccc',
                width: '300px',
                background: 'white'
              }}
            />
          </Box>
          <TableContainer sx={{ width: 1200, maxHeight: 800 }}>
            <Table stickyHeader>
              <TableHead sx={{ fontWeight: 'bold', backgroundColor: '#F4F6F8' }}>
                <TableRow sx={{ fontWeight: 'bold', backgroundColor: '#F4F6F8' }}>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#F4F6F8' }}>
                    <TableSortLabel
                      active={orderByReproved === 'name'}
                      direction={orderByReproved === 'name' ? orderReproved : 'asc'}
                      onClick={() => handleRequestSortReproved('name')}
                    >
                      Nome do Usuário
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#F4F6F8' }}>
                    <TableSortLabel
                      active={orderByReproved === 'email'}
                      direction={orderByReproved === 'email' ? orderReproved : 'asc'}
                      onClick={() => handleRequestSortReproved('email')}
                    >
                      Endereço de E-mail
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#F4F6F8' }}>
                    <TableSortLabel
                      active={orderByReproved === 'user_type'}
                      direction={orderByReproved === 'user_type' ? orderReproved : 'asc'}
                      onClick={() => handleRequestSortReproved('user_type')}
                    >
                      Tipo de Usuário
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#F4F6F8' }}>Ação</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedFilteredReproved.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      Nenhum usuário reprovado.
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedFilteredReproved.map(user => (
                    <TableRow key={user.id} sx={{ '&:hover': { backgroundColor: '#f5f5f5' }, transition: '0.2s' }}>
                      <TableCell sx={{ wordBreak: 'break-word' }}>{user.name}</TableCell>
                      <TableCell sx={{ wordBreak: 'break-word' }}>{user.email}</TableCell>
                      <TableCell>{user.user_type}</TableCell>
                      <TableCell>
                        <Button
                          variant="outlined"
                          sx={{
                            color: '#339064',
                            borderColor: '#339064',
                            textTransform: 'none',
                            '&:hover': {
                              backgroundColor: '#339064',
                              color: '#fff',
                              borderColor: '#339064',
                            },
                          }}
                          onClick={() => handleToggleUserStatus(user.id, user.status)}
                        >
                          Ativar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
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
