import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Avatar, TextField,
  Button, Menu, MenuItem, IconButton, Snackbar, Dialog,
  DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PushPinIcon from '@mui/icons-material/PushPin';
import { authService } from '../../../services/AuthService';
import { showSucessToast } from '../../../shared/components/toasters/SucessToaster';
import { showErrorToast } from '../../../shared/components/toasters/ErrorToaster';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';


const Feed = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [comments, setComments] = useState({});
  const [newComments, setNewComments] = useState({});
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editCommentDialogOpen, setEditCommentDialogOpen] = useState(false);
  const [editCommentContent, setEditCommentContent] = useState('');
  const [selectedCommentId, setSelectedCommentId] = useState(null);
  const [showAllComments, setShowAllComments] = useState(false);


  const handleEditComment = (comment, post) => {
    console.log("Editando comentário:", comment);
    setSelectedPost(post); // garante que selectedPost está atualizado
    setSelectedCommentId(comment.id);
    setEditCommentContent(comment.content);
    setEditCommentDialogOpen(true);
  };


  const handleSaveEditComment = async () => {
    console.log("Salvando edição do comentário...");

    if (!selectedPost || !selectedPost.ID) {
      console.error("Post não encontrado:", selectedPost);
      showErrorToast("Post não encontrado.");
      return;
    }

    try {
      const currentUserEmail = getEmailFromCookies();
      console.log("E-mail do usuário:", currentUserEmail);

      console.log("Enviando requisição PUT para editar comentário:", {
        commentId: selectedCommentId,
        content: editCommentContent,
        userEmail: currentUserEmail,
      });

      await authService.put('edit-comment', {
        commentId: selectedCommentId,
        content: editCommentContent,
        userEmail: currentUserEmail,
      });

      console.log("Comentário atualizado na API. Atualizando localmente...");

      setComments((prevComments) => {
        const updatedComments = { ...prevComments };
        const postComments = updatedComments[selectedPost.ID];
        console.log("Comentários antes da edição:", postComments);

        const updatedPostComments = postComments.map((comment) =>
          comment.id === selectedCommentId ? { ...comment, content: editCommentContent } : comment
        );

        console.log("Comentários depois da edição:", updatedPostComments);

        updatedComments[selectedPost.ID] = updatedPostComments;
        return updatedComments;
      });

      setEditCommentDialogOpen(false);
      showSucessToast("Comentário atualizado com sucesso!");
    } catch (error) {
      console.error("Erro ao editar comentário:", error);
      showErrorToast("Erro ao editar o comentário.");
    }
  };


  const handleDeleteComment = async (commentId, post) => {
    console.log("Tentando excluir comentário:", commentId);
    console.log("Post relacionado:", post);

    try {
      const email = getEmailFromCookies();
      console.log("E-mail do usuário:", email);
      if (!email) {
        console.warn("Nenhum e-mail encontrado nos cookies.");
        return;
      }

      console.log("Enviando requisição DELETE para excluir comentário...");

      await authService.delete('delete-comment', {
        data: {
          commentId: commentId,
          userEmail: email,
        }
      });

      console.log("Comentário excluído na API. Atualizando localmente...");

      setComments((prevComments) => {
        const updatedComments = { ...prevComments };
        const postComments = updatedComments[post.ID] || [];
        console.log("Comentários antes da exclusão:", postComments);

        const filteredComments = postComments.filter((comment) => comment.id !== commentId);
        console.log("Comentários depois da exclusão:", filteredComments);

        updatedComments[post.ID] = filteredComments;
        return updatedComments;
      });

      showSucessToast("Comentário excluído com sucesso!");
    } catch (error) {
      console.error("Erro ao excluir comentário:", error);
      showErrorToast("Erro ao excluir o comentário.");
    }
  };

  const getEmailFromCookies = () => {
    return document.cookie.replace(/(?:(?:^|.*;\s*)email\s*=\s*([^;]*).*$)|^.*$/, "$1");
  };

  const fetchPosts = async (isMountedRef) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authService.get("posts");

      // Adicione o console.log aqui para ver a resposta inteira:
      console.log('fetchPosts response:', response);

      if (response.data && isMountedRef.current) {
        setPosts(response.data);

        for (const post of response.data) {
          await fetchComments(post.ID, isMountedRef);
        }
      } else if (isMountedRef.current) {
        setError("Nenhuma postagem encontrada.");
      }
    } catch (error) {
      if (isMountedRef.current) {
        setError("Erro ao buscar postagens.");
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };


  const fetchComments = async (postId, isMountedRef) => {
    try {
      const response = await authService.get(`list-comments/${postId}`);
      if (isMountedRef.current) {
        setComments((prev) => ({
          ...prev,
          [postId]: response.data,
        }));
      }
    } catch (error) {
      console.error("Erro ao buscar comentários:", error);
    }
  };

  const handleCommentSubmit = async (postId) => {
    const newComment = newComments[postId];
    if (!newComment) return;

    const email = getEmailFromCookies();
    if (!email) return;

    try {
      await authService.post('create-comment', { postId, content: newComment, userEmail: email });
      setNewComments((prev) => ({ ...prev, [postId]: "" }));
      await fetchComments(postId, { current: true }); // Força fetch sem desmontagem
    } catch (error) {
      console.error("Erro ao criar comentário:", error);
    }
  };

  const handleClickMenu = (event, post) => {
    setAnchorEl(event.currentTarget);
    setSelectedPost(post); // <-- salva o post selecionado!
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setSelectedPost(null);
  };

  const handleToggleFixPost = async () => {
    if (!selectedPost) return;

    const email = getEmailFromCookies();
    if (!email) return;

    try {
      const endpoint = selectedPost.Pinned ? '/unpin-post' : '/pin-post';
      await authService.put(endpoint, {
        postId: selectedPost.ID,
        email: email,
      });

      setSnackbarMessage(
        selectedPost.Pinned ? 'Postagem desfixada com sucesso!' : 'Postagem fixada com sucesso!'
      );
      setSnackbarOpen(true);
      await fetchPosts({ current: true });
    } catch (error) {
      setSnackbarMessage('Erro ao alterar fixação da postagem.');
      setSnackbarOpen(true);
    } finally {
      handleCloseMenu();
    }
  };

  const handleEditPost = () => {
    if (!selectedPost || !selectedPost.ID) {
      console.log("ID da postagem inválido ou não encontrado!", selectedPost);
      return;
    }

    setEditTitle(selectedPost.Title);
    setEditContent(selectedPost.Content);
    setEditDialogOpen(true);
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
    formData.append("email", selectedPost.UserEmail); // precisa ter vindo no objeto selectedPost

    try {
      await authService.put("edit-post", formData);

      // Atualiza a lista de posts localmente
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
      showErrorToast("Erro ao editar a postagem.");
    }
  };

  const handleDeletePost = async () => {
    if (!selectedPost) return;

    const email = getEmailFromCookies();
    if (!email) return;

    try {
      const url = `delete-post?post_id=${selectedPost.ID}&email=${email}`;
      await authService.delete(url);
      showSucessToast("Postagem deletada com sucesso!");
      await fetchPosts({ current: true });
    } catch (error) {
      showErrorToast("Erro ao deletar postagem.");
    } finally {
      handleCloseMenu();
    }
  };


  useEffect(() => {
    if (editDialogOpen) {
      console.log('Modal de edição aberto. selectedPost:', selectedPost);
    }
  }, [editDialogOpen]);

  useEffect(() => {
    const isMountedRef = { current: true };
    fetchPosts(isMountedRef);

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (selectedPost) {
      setEditTitle(selectedPost.Title);
      setEditContent(selectedPost.Content);
    }
  }, [selectedPost]);

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', padding: '20px', width: '100%' }}>
      <Box sx={{ width: '100%' }}>
        {loading ? (
          <div>Carregando postagens...</div>
        ) : error ? (
          <div>{error}</div>
        ) : posts.length > 0 ? (
          posts.map((post) => (
            <Card
              key={post.ID}
              sx={{
                marginBottom: '20px',
                borderRadius: '15px',
                boxShadow: '2px 2px 20px 1px rgba(0, 0, 0, 0.1)',
                backgroundColor: 'white', // ou a cor que preferir
                width: '100%',
                height: 'max-content',
                pt: '20px',
                pb: '20px'
              }}
            >

              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                  <Avatar sx={{ marginRight: '12px' }} />

                  {/* Box vertical para nome e email */}
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 'bold', color: '#1D252E' }}
                    >
                      {post.user_name || 'Nome não disponível'}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="textSecondary"
                    >
                      {post.UserEmail || 'E-mail não disponível'}
                    </Typography>
                  </Box>

                  <Box sx={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
                    {post.Pinned && <PushPinIcon fontSize="small" color="primary" sx={{ marginRight: '8px' }} />}
                    <IconButton onClick={(e) => handleClickMenu(e, post)}>
                      <MoreVertIcon />
                    </IconButton>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', marginBottom: '16px' }}>
                  <Typography sx={{ fontWeight: 'bold' }}>
                    {post.Title}
                  </Typography>
                  <Typography color="textSecondary">
                    {post.Content}
                  </Typography>
                </Box>

                {post.Image && (
                  <Box sx={{ height: '400px', overflow: 'hidden', borderRadius: '8px' }}>
                    <img
                      src={`data:image/png;base64,${post.Image}`}
                      alt="Imagem do post"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </Box>
                )}
                <Box sx={{ marginTop: '16px', display: 'flex', flexDirection: 'column' }}>
                  {comments[post.ID]?.length > 0 ? (
                    <>
                      <Box
                        sx={{
                          maxHeight: showAllComments ? 'none' : '180px',
                          overflowY: 'auto',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '16px',
                          pr: 1,
                        }}
                      >
                        {comments[post.ID]
                          .slice(0, showAllComments ? comments[post.ID].length : 2)
                          .map((comment) => (
                            <Box
                              key={comment.id}
                              sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                                gap: '16px',
                              }}
                            >
                              {/* Lado esquerdo: avatar + conteúdo do comentário */}
                              <Box sx={{ display: 'flex', flex: 1, gap: '12px' }}>
                                <Avatar sx={{ width: 40, height: 40 }}>
                                  {comment.userName?.[0]?.toUpperCase() || 'A'}
                                </Avatar>

                                <Box>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Typography variant="subtitle2" fontWeight="bold">
                                      {comment.userName || 'Anônimo'}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                                      {comment.date || '01/01/2023'}
                                    </Typography>
                                  </Box>

                                  <Typography variant="body2" sx={{ marginTop: '4px' }}>
                                    {comment.content}
                                  </Typography>
                                </Box>
                              </Box>


                              {/* Lado direito: botões */}
                              <Box sx={{ display: 'flex', gap: '8px' }}>
                                <Button
                                  variant="text"
                                  onClick={() => handleEditComment(comment, post)}
                                  sx={{
                                    minWidth: '40px',
                                    '&:hover': {
                                      backgroundColor: '#e0e0e0',
                                    },
                                  }}
                                >
                                  <EditIcon sx={{ color: '#ADB6C0', scale: '0.8' }} />
                                </Button>

                                <Button
                                  variant="text"
                                  onClick={() => handleDeleteComment(comment.id, post)}
                                  sx={{
                                    minWidth: '40px',
                                    '&:hover': {
                                      backgroundColor: '#e0e0e0',
                                    },
                                  }}
                                >
                                  <DeleteIcon sx={{ color: '#ADB6C0', scale: '0.8' }} />
                                </Button>

                              </Box>
                            </Box>
                          ))}
                      </Box>

                      {/* Botão para visualizar todos */}
                      {!showAllComments && comments[post.ID].length > 2 && (
                        <Button
                          variant="text"
                          onClick={() => setShowAllComments((prev) => !prev)}
                          sx={{
                            marginTop: '8px',
                            textTransform: 'none',
                            color: '#1D252E',
                            // fontWeight: 'bold',
                            '&:hover': {
                              backgroundColor: '#F4F6F8', // cinza claro no hover
                            },
                          }}
                        >
                          {showAllComments ? 'Visualizar menos' : 'Visualizar todos os comentários'}
                        </Button>

                      )}
                    </>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Não há comentários ainda.
                    </Typography>
                  )}

                  {/* Campo de novo comentário */}
                  <Box sx={{ display: 'flex', gap: 2, marginTop: '16px' }}>
                    <TextField
                      label="Escreva um comentário..."
                      fullWidth
                      variant="outlined"
                      value={newComments[post.ID] || ''}
                      onChange={(e) =>
                        setNewComments((prev) => ({ ...prev, [post.ID]: e.target.value }))
                      }
                      sx={{
                        color: '#D9D9D9',
                        '& .MuiInputLabel-root': {
                          top: '50%',
                          transform: 'translate(14px, -50%) scale(1)',
                          color: '#D9D9D9',                // cor do label normal
                          transition: 'color 0.3s',
                        },
                        '& .MuiOutlinedInput-root': {
                          padding: '4px',
                          fontSize: '0.9rem',
                          color: '#D9D9D9',                // cor do texto normal
                          '& fieldset': {
                            color: '#1D252E',
                            borderColor: '#D9D9D9',
                          },
                          '&:hover fieldset': {
                            borderColor: '#B0B0B0',
                            color: '#1D252E',

                          },
                          '&.Mui-focused': {
                            color: '#1D252E',              // cor do texto quando focado
                            '& fieldset': {
                              borderColor: '#1D252E',
                              borderWidth: 2,
                              color: '#1D252E',
                            },
                          },
                        },
                        '& .MuiOutlinedInput-input': {
                          padding: '6px 8px',
                        },
                        '& .MuiInputLabel-shrink': {
                          transform: 'translate(14px, -30px) scale(0.75)',
                          color: '#1D252E',                // cor do label quando shrink (ativo)
                        },
                      }}


                    />

                    <Button
                      variant="outlined"
                      onClick={() => handleCommentSubmit(post.ID)}
                      sx={{
                        minWidth: '120px',
                        color: '#1D252E',
                        borderColor: '#1D252E',
                        borderRadius: '12px', // <- Correto aqui
                        '&:hover': {
                          borderColor: '#1D252E',
                          backgroundColor: '#f5f5f5',
                          color: '#1D252E'
                        }
                      }}
                    >
                      Comentar
                    </Button>

                  </Box>

                </Box>



              </CardContent>
            </Card>
          ))
        ) : (
          <div>Não há postagens disponíveis.</div>
        )}
        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleCloseMenu}>
          <MenuItem onClick={handleToggleFixPost}>
            {selectedPost?.Pinned ? 'Desfixar postagem' : 'Fixar postagem'}
          </MenuItem>
          <MenuItem onClick={handleEditPost}>
            Editar postagem
          </MenuItem>
          <MenuItem onClick={handleDeletePost}>
            Deletar postagem
          </MenuItem>
        </Menu>

        <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
          <DialogTitle>Editar Postagem</DialogTitle>
          <DialogContent>
            <TextField
              margin="dense"
              label="Título"
              fullWidth
              variant="outlined"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
            />
            <TextField
              margin="dense"
              label="Conteúdo"
              fullWidth
              multiline
              minRows={4}
              variant="outlined"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              sx={{ marginTop: 2 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialogOpen(false)} color="secondary">
              Cancelar
            </Button>
            <Button onClick={handleSaveEditPost}>Salvar</Button>

          </DialogActions>
        </Dialog>
        <Dialog open={editCommentDialogOpen} onClose={() => setEditCommentDialogOpen(false)}>
          <DialogTitle>Editar Comentário</DialogTitle>
          <DialogContent>
            <TextField
              margin="dense"
              label="Comentário"
              fullWidth
              variant="outlined"
              value={editCommentContent}
              onChange={(e) => setEditCommentContent(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditCommentDialogOpen(false)} color="secondary">
              Cancelar
            </Button>
            <Button onClick={handleSaveEditComment}>Salvar</Button>
          </DialogActions>
        </Dialog>


        <Snackbar
          open={snackbarOpen}
          autoHideDuration={3000}
          onClose={() => setSnackbarOpen(false)}
          message={snackbarMessage}
        />
      </Box>
    </Box>
  );
};

export default Feed;
