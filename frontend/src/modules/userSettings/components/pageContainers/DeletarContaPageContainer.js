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
      await axios.delete("http://localhost:8000/anyUser/deleteUser", {
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
    <Box
      component="form"
      onSubmit={handleSubmit(onSubmit)}
      sx={{
        width: '100%',
        maxWidth: 400,
        mx: "auto",
        mt: 4,
        backgroundColor: "#fff",
        borderRadius: 4,
        boxShadow: "0 2px 16px 0 rgba(145, 158, 171, 0.10)",
        p: 4,
        display: "flex",
        flexDirection: "column",
        gap: 2.5,
        alignItems: "center",
      }}
    >
      <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'error.main', mb: 2 }}>
        Deletar Conta
      </Typography>
      <TextField
        label="Digite sua senha para confirmar"
        type="password"
        {...register("senha", { required: true })}
        required
        fullWidth
      />
      <SubmitButton text={'Deletar conta'} sx={{ width: "100%" }} />
      {mensagem && (
        <Typography
          sx={{ mt: 1, fontWeight: 'bold' }}
          color={mensagem.includes("sucesso") ? "primary" : "error"}
        >
          {mensagem}
        </Typography>
      )}
    </Box>
  );
}

export default DeletarContaPageContainer;
