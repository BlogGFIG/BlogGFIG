import React, { useState, useCallback } from 'react';
import { Box, TextField, Button, Typography, FormControl } from '@mui/material';
import { useForm } from 'react-hook-form';
import { postService } from '../../../services/PostService';
import { showSucessToast } from '../../../shared/components/toasters/SucessToaster';
import { showErrorToast } from '../../../shared/components/toasters/ErrorToaster';

import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';

const PostagemForm = ({ onPostCreated, onClose }) => {
  const { register, handleSubmit, reset } = useForm();
  const [image, setImage] = useState(null);

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setImage(file);
    }
  };

  const handleDrop = useCallback((event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setImage(file);
    }
  }, []);

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleClose = () => {
    reset();
    setImage(null);
    if (onClose) onClose();
  };

  const onSubmit = async (data) => {
    try {

      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('content', data.content);
      formData.append('image', image);

      const response = await postService.createPost(formData);

      if (response.status === 201) {
        showSucessToast('Postagem criada com sucesso!');
        reset();
        setImage(null);
        if (onPostCreated) {
          onPostCreated();
        }
        if (onClose) {
          onClose();
        }
        return;
      } else {
        showErrorToast('Erro ao criar postagem.');
      }
    } catch (error) {
      console.error('Erro ao criar postagem:', error);
      if (!error.response) {
        showErrorToast('Erro de rede. Tente novamente.');
        return;
      }

      const { status } = error.response;
      if (status === 400) {
        showErrorToast('Erro nos dados fornecidos.');
      } else {
        showErrorToast('Erro ao criar postagem.');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'start',
          maxWidth: '600px',
          margin: 'auto',
          backgroundColor: 'white',
          boxShadow: '0',
          p: 3,
          borderRadius: '12px',
        }}
      >
        <Typography
          sx={{ textAlign: 'center', marginBottom: 3, fontWeight: 'bold', color: '#1C252E', width: '100%' }}
        >
          Postagem
        </Typography>

        <TextField
          {...register('title')}
          label="Título"
          variant="outlined"
          fullWidth
          required
          sx={{ marginBottom: 2 }}
        />

        <TextField
          {...register('content')}
          label="Descrição"
          variant="outlined"
          multiline
          rows={4}
          fullWidth
          required
          sx={{ marginBottom: 2 }}
        />

        <FormControl sx={{ marginBottom: 2, position: 'relative', width: '100%' }}>
          <Box
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            sx={{
              border: '2px dashed #ccc',
              padding: '20px',
              borderRadius: '8px',
              textAlign: 'center',
              backgroundColor: '#fafafa',
              cursor: 'pointer',
              position: 'relative',
            }}
          >
            <Typography variant="body2">
              Arraste uma imagem aqui ou clique para selecionar
            </Typography>
            <input
              type="file"
              id="image"
              onChange={handleImageChange}
              accept="image/*"
              style={{
                opacity: 0,
                position: 'absolute',
                width: '100%',
                height: '100%',
                top: 0,
                left: 0,
                cursor: 'pointer',
              }}
            />
          </Box>
          {image && (
            <Typography variant="caption" sx={{ marginTop: 1 }}>
              Imagem selecionada: {image.name}
            </Typography>
          )}
        </FormControl>

        <Box sx={{ display: 'flex', gap: 2, marginTop: 2, width: '100%' }}>
          {/* Botão Postar */}
          <Button
            type="submit"
            variant="contained"
            startIcon={<CheckIcon sx={{ color: '#fff' }} />}
            sx={{
              backgroundColor: '#1C252E',
              color: '#fff',
              flex: 1,
              padding: '8px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              borderRadius: '12px',
              '&:hover': {
                backgroundColor: '#172027',
              },
            }}
          >
            Postar
          </Button>

          {/* Botão Cancelar */}
          <Button
            variant="outlined"
            startIcon={<CloseIcon sx={{ color: '#657381' }} />}
            onClick={handleClose}
            sx={{
              borderColor: '#657381',
              color: '#657381',
              flex: 1,
              padding: '8px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              borderRadius: '12px',
              '&:hover': {
                backgroundColor: '#f5f5f5',
                borderColor: '#657381',
              },
            }}
          >
            Cancelar
          </Button>
        </Box>
      </Box>
    </form>
  );
};

export default PostagemForm;
