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
  const { 
    register, 
    handleSubmit,
    watch,
    formState: { errors },
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
          label={'E-mail'}
          type={'email'}
          register={register}
          required={true}
          error={!!errors.email}
          helperText={errors.email?.message}
          sx={{ width: '100%' }}
          {...register("email", { 
            required: "E-mail é obrigatório",
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: "E-mail inválido"
            }
          })}
        />

        <PasswordInput
          id={'password'}
          label={'Senha'}
          type={'password'}
          register={register}
          required={true}
          error={!!errors.password}
          helperText={errors.password?.message}
          sx={{ width: '100%' }}
          {...register("password", { 
            required: "Senha é obrigatória"
            }
          )}
        />

        {isSignUp && (
          <>
            <PasswordInput
              id={'passwordConfirmation'}
              label={'Confirmar senha'}
              type={'password'}
              register={register}
              required={true}
              error={!!errors.passwordConfirmation}
              helperText={errors.passwordConfirmation?.message}
              sx={{ width: '100%' }}
              {...register("passwordConfirmation", { 
                required: "Confirmação de senha é obrigatória",
                validate: value => 
                  value === password || "As senhas não coincidem"
              })}
            />

            <TextInput
              id={'name'}
              label={'Nome'}
              type={'name'}
              register={register}
              required={true}
              error={!!errors.name}
              helperText={errors.name?.message}
              sx={{ width: '100%' }}
              {...register("name", { 
                required: "Nome é obrigatório",
                minLength: {
                  value: 2,
                  message: "Nome deve ter pelo menos 2 caracteres"
                }
              })}
            />
          </>
        )}

        <SubmitButton text={isSignUp ? 'Cadastrar' : 'Login'} />
      </Box>
    </form>
  );
};

export default AuthForm;