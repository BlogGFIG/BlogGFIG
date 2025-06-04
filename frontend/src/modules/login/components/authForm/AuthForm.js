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
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '20px', 
        width: '100%', 
        padding: '0' 
      }}>
        {/* Título do formulário */}
        <Typography variant="h5" component="h2" sx={{ textAlign: 'center', mb: 2 }}>
          {isSignUp ? 'Crie sua conta' : 'Faça login'}
        </Typography>

        {/* Mensagem de instrução */}
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
          {isSignUp ? 'Preencha os campos abaixo para se registrar' : 'Informe suas credenciais para acessar'}
        </Typography>

        {/* Campo de e-mail com mensagem de erro melhorada */}
        <Box>
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
                message: "Por favor, insira um e-mail válido"
              }
            })}
          />
          {errors.email && (
            <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
              ⚠️ {errors.email.message}
            </Typography>
          )}
        </Box>

        {/* Campo de senha com mensagem de erro melhorada */}
        <Box>
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
              required: "Senha é obrigatória",
              minLength: {
                value: 6,
                message: "Mínimo de 6 caracteres"
              },
              pattern: {
                value: passwordRegex,
                message: "Deve conter letras, números e caracteres especiais"
              }
            })}
          />
          {errors.password && (
            <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
              ⚠️ {errors.password.message}
            </Typography>
          )}
          {!errors.password && isSignUp && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              🔒 Sua senha deve ter pelo menos 6 caracteres com letras, números e símbolos
            </Typography>
          )}
        </Box>

        {isSignUp && (
          <>
            {/* Campo de confirmação de senha */}
            <Box>
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
                  required: "Por favor, confirme sua senha",
                  validate: value => 
                    value === password || "As senhas não coincidem"
                })}
              />
              {errors.passwordConfirmation && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                  ⚠️ {errors.passwordConfirmation.message}
                </Typography>
              )}
            </Box>

            {/* Campo de nome */}
            <Box>
              <TextInput
                id={'name'}
                label={'Nome completo'}
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
                    message: "Nome muito curto (mínimo 2 caracteres)"
                  }
                })}
              />
              {errors.name && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                  ⚠️ {errors.name.message}
                </Typography>
              )}
            </Box>
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