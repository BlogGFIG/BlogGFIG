import React from 'react';
import { Box } from '@mui/system';
import TextInput from '../../../../shared/components/inputs/TextInput';
import PasswordInput from '../../../../shared/components/inputs/PasswordInput';
import SubmitButton from '../../../../shared/components/buttons/SubmitButton';
import { useForm } from "react-hook-form";
import { authService } from '../../../../services/AuthService';
import { showSucessToast } from '../../../../shared/components/toasters/SucessToaster';
import { showErrorToast } from '../../../../shared/components/toasters/ErrorToaster';
import { useNavigate } from 'react-router-dom';

const AuthForm = ({ isSignUp, setIsSignUp }) => {
  const { register, handleSubmit } = useForm();

  const navigate = useNavigate();

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
          // Salva o token no localStorage
          if (response.data && response.data.token) {
            localStorage.setItem('token', response.data.token);
          }

          // Exemplo de como recuperar o token depois:
          const token = localStorage.getItem('token');
          console.log("Token JWT salvo no localStorage:", token);

          navigate("/"); // Redireciona para a página inicial
          return;
        }
      }

      showErrorToast("Erro ao autenticar.");
    } catch (error) {
      console.error("Erro na autenticação:", error);

      if (!error.response) {
        showErrorToast("Erro de rede. Tente novamente.");
        return;
      }

      const { status } = error.response;

      if (status === 409) {
        showErrorToast("Este e-mail já está cadastrado.");
      } else if (status === 401) {
        showErrorToast("Usuário ou senha incorretos.");
      } else if (status === 403) {
        showErrorToast("Usuário inativo ou não aprovado.");
      } else {
        showErrorToast("Erro ao autenticar.");
      }
    }
  };

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

        <SubmitButton text={isSignUp ? 'Cadastrar' : 'Login'} />
      </Box>
    </form>

  );
};

export default AuthForm;
