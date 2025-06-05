import React, { useState } from "react";
import { useForm } from "react-hook-form";
import SubmitButton from '../../../../shared/components/buttons/SubmitButton';
import { Box, TextField, Typography } from '@mui/material';
import axios from "axios";


function DeletarContaPageContainer() {
  const { handleSubmit, register, reset } = useForm();
  const [mensagem, setMensagem] = useState("");

  const onSubmit = async (data) => {
    setMensagem("");
    if (!window.confirm("Tem certeza que deseja deletar sua conta? Esta ação é irreversível.")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.delete("https://backend-gfig.onrender.com/anyUser/deleteUser", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: {
          password: data.senha,
        },
      });
      setMensagem("Conta deletada com sucesso!");
      // Opcional: deslogar usuário e redirecionar
      localStorage.removeItem("token");
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    } catch (error) {
      setMensagem("Erro ao deletar conta. Verifique sua senha.");
    }
    reset();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: 400, mx: "auto", mt: 4 }}>
        <Typography variant="h6" color="error">Deletar Conta</Typography>
        <TextField
          label="Digite sua senha para confirmar"
          type="password"
          {...register("senha", { required: true })}
          required
        />
        <SubmitButton text={'Deletar conta'} />
        {mensagem && (
          <Typography color={mensagem.includes("sucesso") ? "primary" : "error"}>
            {mensagem}
          </Typography>
        )}
      </Box>
    </form>
  );
}

export default DeletarContaPageContainer;
