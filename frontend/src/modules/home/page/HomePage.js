import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Modal,
  Button,
  Stack
} from '@mui/material';
import { useForm } from 'react-hook-form';
import PostForm from '../components/PostForm';
import Feed from '../../feed/page/Feed';
import axios from 'axios';
import AddIcon from '@mui/icons-material/Add';

const HomePage = () => {
  const { register, handleSubmit, setValue } = useForm();
  const [userRole, setUserRole] = useState('');
  const [open, setOpen] = useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const getEmailFromCookies = () => {
          return document.cookie.replace(/(?:(?:^|.*;\s*)email\s*=\s*([^;]*).*$)|^.*$/, "$1");
        };

        const email = getEmailFromCookies();
        if (!email) {
          console.warn("E-mail não encontrado nos cookies.");
          return;
        }

        const response = await axios.get('http://localhost:8000/get-user-type', {
          params: { email: email },
        });

        const role = response.data.replace('Tipo de usuário: ', '').trim();
        console.log('Tipo de usuário:', role);
        setUserRole(role);
      } catch (error) {
        console.error('Erro ao obter o papel do usuário', error);
      }
    };

    fetchUserRole();
  }, []);

  const onSubmit = (data) => {
    console.log(data);
    handleClose(); // fecha o modal após o envio
  };

  return (
    <Container maxWidth="md" sx={{ paddingTop: 4 }}>
      {/* Botão flutuante para abrir o modal */}
      {userRole === 'master' && (
        <Box sx={{ marginBottom: 4, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleOpen}
            sx={{
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

        </Box>
      )}

      {/* Modal com o formulário */}
      <Modal open={open} onClose={handleClose}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: { xs: '90%', sm: 500 },
            bgcolor: 'background.paper',
            borderRadius: '20px',  // alterado para 20px
            boxShadow: 24,
            p: 4,
          }}
        >

          <PostForm
            register={register}
            handleSubmit={handleSubmit(onSubmit)}
            setValue={setValue}
          />
        </Box>
      </Modal>


      {/* Feed abaixo */}
      <Feed />
    </Container>
  );
};

export default HomePage;
