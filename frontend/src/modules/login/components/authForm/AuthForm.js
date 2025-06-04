import React from 'react';
import { Box, Typography } from '@mui/material'; // Adicionei Typography para mensagens
import TextInput from '../../../../shared/components/inputs/TextInput';
import PasswordInput from '../../../../shared/components/inputs/PasswordInput';
import SubmitButton from '../../../../shared/components/buttons/SubmitButton';
import { useForm } from "react-hook-form";
import { authService } from '../../../../services/AuthService';
import { showSucessToast } from '../../../../shared/components/toasters/SucessToaster';
import { showErrorToast } from '../../../../shared/components/toasters/ErrorToaster';
import { useNavigate } from 'react-router-dom';

const AuthForm = ({ isSignUp, setIsSignUp }) => {
  const { 
    register, 
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm();

  const navigate = useNavigate();
  const password = watch("password"); // Para validação de confirmação de senha

  const onSubmit = async (data) => {
    try {
      let response;

      if (isSignUp) {
        response = await authService.post("register", data);

        if (response.status === 201) {
          showSucessToast("Cadastro realizado com sucesso!");
          setIsSignUp(false);
          return;
        }
      } else {
        response = await authService.post("login", data);

        if (response.status === 200) {
          showSucessToast("Login realizado com sucesso!");
          if (response.data && response.data.token) {
            localStorage.setItem('token', response.data.token);
          }

          const token = localStorage.getItem('token');
          console.log("Token JWT salvo no localStorage:", token);

          navigate("/");
          return;
        }
      }

      showErrorToast("Erro ao autenticar.");
    } catch (error) {
      console.error("Erro na autenticação:", error);

      if (!error.response) {
        showErrorToast("Erro de rede. Verifique sua conexão e tente novamente.");
        return;
      }

      const { status } = error.response;

      if (status === 409) {
        showErrorToast("Este e-mail já está cadastrado. Faça login ou use outro e-mail.");
      } else if (status === 401) {
        showErrorToast("Credenciais inválidas. Verifique seu e-mail e senha.");
      } else if (status === 403) {
        showErrorToast("Acesso não autorizado. Sua conta pode estar inativa.");
      } else {
        showErrorToast("Ocorreu um erro inesperado. Tente novamente mais tarde.");
      }
    }
  };

  // Expressão regular para validar senha forte
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{6,}$/;

  return (
    <form sx={{padding: '0' }} onSubmit={handleSubmit(onSubmit)}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', padding: '0' }}>

        <TextInput
          id={'email'}
          type={'email'}
          label={'E-mail'}
          register={register}
          sx={{ width: '100%' }}
        />

        <PasswordInput
          id={'password'}
          type={'password'}
          label={'Senha'}
          register={register}
          sx={{ width: '100%' }}
        />

        {isSignUp && (
          <>
            <PasswordInput
              id={'passwordConfirmation'}
              type={'password'}
              label={'Confirmar senha'}
              register={register}
              sx={{ width: '100%' }}
            />

            <TextInput
              id={'name'}
              type={'name'}
              label={'Nome'}
              register={register}
              sx={{ width: '100%' }}
            />
          </>
        )}

        {/* Botão de submit com estado de loading */}
        <SubmitButton 
          text={isSignUp ? 'Cadastrar' : 'Login'} 
          disabled={isSubmitting}
          sx={{ mt: 2 }}
        />

        {/* Mensagem de rodapé */}
        <Typography variant="body2" sx={{ 
          color: 'text.secondary', 
          mt: 2,
          textAlign: 'center'
        }}>
          {isSignUp ? 'Já tem uma conta? ' : 'Ainda não tem uma conta? '}
          <span 
            onClick={() => setIsSignUp(!isSignUp)}
            style={{ 
              color: '#1976d2', 
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            {isSignUp ? 'Faça login' : 'Cadastre-se'}
          </span>
        </Typography>
      </Box>
    </form>
  );
};

export default AuthForm;