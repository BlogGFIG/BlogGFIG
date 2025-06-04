import React, { useState, useEffect, useMemo } from 'react';
import { authService } from '../../../services/AuthService';
import PostForm from '../../home/components/PostForm';
import { showSucessToast } from '../../../shared/components/toasters/SucessToaster';
import { showErrorToast } from '../../../shared/components/toasters/ErrorToaster';
import {jwtDecode} from 'jwt-decode';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Snackbar,
  Box,
  Paper,
  Typography,
  InputAdornment,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableSortLabel,
} from '@mui/material';

import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';

const UserPosts = () => {
  const [posts, setPosts] = useState([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [postFormDialogOpen, setPostFormDialogOpen] = useState(false);

  // Estado para imagem expandida
  const [expandedImageSrc, setExpandedImageSrc] = useState(null);

  const [search, setSearch] = useState('');
  const [orderBy, setOrderBy] = useState('Title');
  const [order, setOrder] = useState('asc');

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

  useEffect(() => {
    fetch("http://localhost:8000/posts")
      .then((response) => response.json())
      .then((data) => {
        setPosts(data);
        console.log("Postagens carregadas:", data);
      })
      .catch((error) => {
        console.error("Erro ao carregar postagens:", error);
      });
  }, []);

  const handleEdit = (postID) => {
    const postToEdit = posts.find((p) => p.ID === postID);
    if (!postToEdit) {
      console.log("Postagem não encontrada!");
      return;
    }

    setSelectedPost(postToEdit);
    setEditTitle(postToEdit.Title);
    setEditContent(postToEdit.Content);
    setEditDialogOpen(true);
  };

  const handleDelete = (postID) => {
    if (window.confirm("Tem certeza que deseja excluir esta postagem?")) {
      const email = getEmailFromToken();

      authService.delete(`anyUser/delete-post?post_id=${postID}&email=${email}`)
        .then((response) => {
          console.log("Postagem deletada:", response);
          setPosts(posts.filter((post) => post.ID !== postID));
          showSucessToast("Postagem deletada com sucesso!");
        })
        .catch((error) => {
          console.error("Erro ao deletar postagem:", error);
          showErrorToast("Erro ao deletar postagem.");
        });
    }
  };

  const handleSaveEditPost = async () => {
    if (!selectedPost || !selectedPost.ID) {
      console.log("ID da postagem inválido ou não encontrado!", selectedPost);
      return;
    }

    console.log('Salvando edição...');

    const formData = new FormData();
    formData.append("post_id", selectedPost.ID.toString());
    formData.append("title", editTitle);
    formData.append("content", editContent);
    // Pegue o email do token
    const email = getEmailFromToken();
    formData.append("email", email);

    try {
      await authService.put("anyUser/edit-post", formData);

      setPosts((prevPosts) =>
        prevPosts.map((p) =>
          p.ID === selectedPost.ID
            ? { ...p, Title: editTitle, Content: editContent }
            : p
        )
      );

      setEditDialogOpen(false);
      setSnackbarMessage("Postagem atualizada!");
      setSnackbarOpen(true);
      showSucessToast("Postagem atualizada com sucesso!");
    } catch (error) {
      console.error("Erro ao editar a postagem:", error);

      if (error.response) {
        const { status, data } = error.response;
        let errorMsg = '';
        if (typeof data === 'string') {
          errorMsg = data;
        } else if (typeof data === 'object' && data.error) {
          errorMsg = data.error;
        }

        if (
          status === 400 &&
          errorMsg &&
          errorMsg.toLowerCase().includes('palavras proibidas')
        ) {
          showErrorToast('O título ou conteúdo contém palavras proibidas!');
          return;
        }
      }

      showErrorToast("Erro ao editar a postagem.");
    }
  };

  const handlePostCreated = () => {
    fetch("http://localhost:8000/posts")
      .then((response) => response.json())
      .then((data) => setPosts(data));
  };

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const filteredAndSortedPosts = useMemo(() => {
    const filtered = posts.filter(
      (post) =>
        post.Title.toLowerCase().includes(search.toLowerCase()) ||
        post.Content.toLowerCase().includes(search.toLowerCase())
    );

    return filtered.sort((a, b) => {
      const aValue = a[orderBy] ? a[orderBy].toString().toLowerCase() : '';
      const bValue = b[orderBy] ? b[orderBy].toString().toLowerCase() : '';

      if (aValue < bValue) return order === 'asc' ? -1 : 1;
      if (aValue > bValue) return order === 'asc' ? 1 : -1;
      return 0;
    });
  }, [posts, search, orderBy, order]);

  return (
    <Box sx={{ padding: 3, width: '1200px', display: 'flex', flexDirection: 'column', gap: 2, margin: '0 auto', alignItems: 'center' }}>
      <Button
        variant="outlined"
        color="primary"
        onClick={() => setPostFormDialogOpen(true)}
        startIcon={<AddIcon />}
        sx={{
          mb: 2, alignSelf: 'flex-end',
          color: '#ffffff',
          backgroundColor: '#1D252E',
          borderRadius: '12px', // <- Correto aqui
          '&:hover': {
            borderColor: '#1D252E',
            backgroundColor: '#f5f5f5',
            color: '#1D252E'
          }
        }}
      >
        Post
      </Button>
      <Paper elevation={3} sx={{ borderRadius: 4, p: 2, width: '100%' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Lista de Postagens
          </Typography>

          <TextField
            variant="outlined"
            placeholder="Pesquisar"
            size="small"
            value={search}
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

        {filteredAndSortedPosts.length === 0 ? (
          <Typography>Sem postagens para mostrar.</Typography>
        ) : (
          <Table>
            <TableHead sx={{ backgroundColor: '#F4F6F8' }}>
              <TableRow>
                <TableCell>Imagem</TableCell>

                <TableCell sortDirection={orderBy === 'Title' ? order : false}>
                  <TableSortLabel
                    active={orderBy === 'Title'}
                    direction={orderBy === 'Title' ? order : 'asc'}
                    onClick={() => handleRequestSort('Title')}
                    sx={{ fontWeight: 'bold' }}
                  >
                    Título
                  </TableSortLabel>
                </TableCell>

                <TableCell sortDirection={orderBy === 'Content' ? order : false}>
                  <TableSortLabel
                    active={orderBy === 'Content'}
                    direction={orderBy === 'Content' ? order : 'asc'}
                    onClick={() => handleRequestSort('Content')}
                  >
                    Conteúdo
                  </TableSortLabel>
                </TableCell>

                <TableCell>Ações</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {filteredAndSortedPosts.map((post) => (
                <TableRow key={post.ID} hover>
                  <TableCell>
                    <img
                      src={`data:image/png;base64,${post.Image}`}
                      alt="Imagem do post"
                      style={{ width: 50, height: 50, borderRadius: 12, objectFit: 'cover', cursor: 'pointer' }}
                      onClick={() => setExpandedImageSrc(`data:image/png;base64,${post.Image}`)}
                    />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>{post.Title}</TableCell>
                  <TableCell>{post.Content}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="outlined"
                        color="success"
                        size="small"
                        onClick={() => handleEdit(post.ID)}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={() => handleDelete(post.ID)}
                      >
                        Excluir
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>

      <Dialog
        open={postFormDialogOpen}
        onClose={() => setPostFormDialogOpen(false)}
        maxWidth="sm"
        fullWidth={false}
        sx={{ '& .MuiPaper-root': { borderRadius: '12px' } }}
      >
        <DialogContent sx={{ borderRadius: '12px' }}>
          <PostForm
            onPostCreated={handlePostCreated}
            onClose={() => setPostFormDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>


      {/* Dialog para edição do post */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Editar Postagem</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Título"
            type="text"
            fullWidth
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Conteúdo"
            type="text"
            fullWidth
            multiline
            minRows={3}
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)} color="secondary">
            Cancelar
          </Button>
          <Button onClick={handleSaveEditPost} variant="contained" color="primary">
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para imagem expandida */}
      <Dialog
        open={Boolean(expandedImageSrc)}
        onClose={() => setExpandedImageSrc(null)}
        maxWidth="lg"
        PaperProps={{
          style: { backgroundColor: 'transparent', boxShadow: 'none' },
        }}
      >
        <img
          src={expandedImageSrc}
          alt="Imagem ampliada"
          style={{
            maxWidth: '90vw',
            maxHeight: '90vh',
            borderRadius: 12,
            display: 'block',
            margin: 'auto',
          }}
        />
        <Box sx={{ textAlign: 'center', mt: 1 }}>
          <Button variant="outlined" onClick={() => setExpandedImageSrc(null)}>Fechar</Button>
        </Box>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Box>
  );
};

export default UserPosts;
