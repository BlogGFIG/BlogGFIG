import { Box } from "@mui/material";
import React from "react";
import { useForm } from "react-hook-form";
import TextInput from '../../../../shared/components/inputs/TextInput';
import SubmitButton from '../../../../shared/components/buttons/SubmitButton';
import { authService } from '../../../../services/AuthService';
import { showErrorToast } from "../../../../shared/components/toasters/ErrorToaster";
import { showSucessToast } from "../../../../shared/components/toasters/SucessToaster";
import { jwtDecode } from "jwt-decode";

function PerfilPageContainer() {
  const { register, handleSubmit } = useForm();

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

  const onSubmit = async (data) => {
    const email = getEmailFromToken();

    if (!email) {
      showErrorToast("Email não encontrado no token.");
      return;
    }

    const postData = {
      bio: data.biografia,
      email: email,
    };

    try {
      await authService.post("perfilPage", postData);
      showSucessToast("Informações do usuário salvas com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar informações do usuário:", error);
      showErrorToast("Erro ao salvar informações do usuário");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <Box>
          <TextInput
            id="biografia"
            label="Biografia"
            register={register}
            sx={{
              height: '125px',
              textarea: { minHeight: '100px' },
            }}
            multiline
          />
        </Box>

        <Box>
          <SubmitButton text={'Salvar'} />
        </Box>
      </Box>
    </form>
  );
}

export default PerfilPageContainer;
