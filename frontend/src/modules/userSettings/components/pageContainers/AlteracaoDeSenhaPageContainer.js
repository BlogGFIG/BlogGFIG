import React, { useState } from "react";
import axios from "axios";
import { Box, TextField, Button, Typography } from "@mui/material";
import { authService } from '../../../../services/AuthService';
import { showErrorToast } from '../../../../shared/components/toasters/ErrorToaster';
import { showSucessToast } from "../../../../shared/components/toasters/SucessToaster";
import { jwtDecode } from "jwt-decode"; // instale com npm install jwt-decode

function AlteracaoDeSenhaPageContainer() {
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mensagem, setMensagem] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensagem("");

    if (novaSenha !== confirmarSenha) {
      setMensagem("As senhas não coincidem.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const email = getEmailFromToken();
      await axios.put(
        "https://backend-gfig.onrender.com/anyUser/senhaPage", // Corrigido aqui
        {
          email, // adicione o email aqui!
          password: senhaAtual,
          newPassword: novaSenha,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setMensagem("Senha atualizada com sucesso!");
      setSenhaAtual("");
      setNovaSenha("");
      setConfirmarSenha("");
    } catch (error) {
      setMensagem("Erro ao atualizar senha.");
    }
  };

  function getEmailFromToken() {
    const token = localStorage.getItem("token");
    if (!token) return "";
    try {
      const decoded = jwtDecode(token);
      return decoded.email || "";
    } catch {
      return "";
    }
  }

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
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
      <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
        Alterar Senha
      </Typography>
      <TextField
        label="Senha atual"
        type="password"
        value={senhaAtual}
        onChange={(e) => setSenhaAtual(e.target.value)}
        required
        fullWidth
      />
      <TextField
        label="Nova senha"
        type="password"
        value={novaSenha}
        onChange={(e) => setNovaSenha(e.target.value)}
        required
        fullWidth
      />
      <TextField
        label="Confirmar nova senha"
        type="password"
        value={confirmarSenha}
        onChange={(e) => setConfirmarSenha(e.target.value)}
        required
        fullWidth
      />
      <Button
        type="submit"
        variant="contained"
        sx={{
          mt: 2,
          width: "100%",
          textTransform: "none",
          fontWeight: "bold",
          borderRadius: 2,
          boxShadow: "none",
          backgroundColor: "#1D252E",
          color: "#fff",
          '&:hover': {
            backgroundColor: "#fff",
            color: "#1D252E",
            border: "1.5px solid #1D252E",
          },
        }}
      >
        Atualizar Senha
      </Button>
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

export default AlteracaoDeSenhaPageContainer;
