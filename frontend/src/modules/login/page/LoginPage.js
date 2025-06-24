import React, { useState } from 'react';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import AuthForm from '../components/authForm/AuthForm';
import Banner from '../../../shared/components/banners/Banner';

const LoginPage = () => {
    const [isSignUp, setIsSignUp] = useState(false);
    const [isResetPassword, setIsResetPassword] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [resetMessage, setResetMessage] = useState('');
    const [resetError, setResetError] = useState('');
    const [showCodeForm, setShowCodeForm] = useState(false);
    const [resetCode, setResetCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    return (
        <Grid
            container
            sx={{
                height: '100vh',
                width: '100%',
                overflow: 'hidden',
                padding: '50px',
            }}
        >
            <Grid item xs={3} sx={{
                backgroundColor: 'white',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'start',
                justifyContent: 'center',
                gap: '20px',
                pt: 0,
                pb: 0,
                pl: 0,
                pr: '50px',
            }}>
                {/* Título */}
                <Typography variant="h6" fontWeight="bold">
                    {isResetPassword
                        ? 'Redefinir senha'
                        : isSignUp
                            ? 'Crie sua conta'
                            : 'Entre na sua conta'}
                </Typography>

                {/* Texto de troca de modo */}
                {!isResetPassword && (
                    <Typography variant="body2">
                        {isSignUp ? 'Já possui uma conta? ' : 'Não possui uma conta? '}
                        <span
                            onClick={() => setIsSignUp(!isSignUp)}
                            style={{ color: '#1C252E', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                            {isSignUp ? 'Entrar' : 'Cadastre-se'}
                        </span>
                    </Typography>
                )}

                {/* Alerta visível apenas no modo login */}
                {!isSignUp && !isResetPassword && (
                    <Box sx={{ width: '100%' }}>
                        <Alert
                            icon={<InfoOutlinedIcon sx={{ color: '#000' }} />}
                            severity="info"
                            sx={{
                                backgroundColor: '#FFF1D6',
                                color: '#000',
                                fontSize: '0.9rem',
                                py: 1,
                                px: 2
                            }}
                        >
                            Sua conta deve estar <b>aprovada</b> pelo admin para logar.
                        </Alert>

                    </Box>
                )}

                {/* Formulário de reset de senha */}
                {isResetPassword ? (
                    <Box sx={{ width: '100%', padding: '0', margin: '0' }}>
                        {!showCodeForm ? (
                            <form
                                onSubmit={async (e) => {
                                    e.preventDefault();
                                    setResetMessage('');
                                    setResetError('');
                                    try {
                                        const res = await fetch('https://backend-gfig.onrender.com/resetPassword', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ email: resetEmail }),
                                        });
                                        if (res.ok) {
                                            setResetMessage('Código enviado! Verifique seu e-mail.');
                                            setShowCodeForm(true);
                                        } else {
                                            const text = await res.text();
                                            setResetError(text || 'Erro ao enviar código.');
                                        }
                                    } catch {
                                        setResetError('Erro ao conectar ao servidor.');
                                    }
                                }}
                            >
                                <Typography variant="body2" sx={{ mb: 1 }}>
                                    Informe seu e-mail para receber o código de redefinição de senha.
                                </Typography>
                                <input
                                    type="email"
                                    required
                                    value={resetEmail}
                                    onChange={e => setResetEmail(e.target.value)}
                                    placeholder="Seu e-mail"
                                    style={{
                                        width: '100%',
                                        padding: '8px',
                                        marginBottom: '10px',
                                        borderRadius: '4px',
                                        border: '1px solid #ccc'
                                    }}
                                />
                                <button
                                    type="submit"
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        background: '#1C252E',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '4px',
                                        fontWeight: 'bold',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Enviar código de redefinição
                                </button>
                                {resetMessage && (
                                    <Alert severity="success" sx={{ mt: 2 }}>{resetMessage}</Alert>
                                )}
                                {resetError && (
                                    <Alert severity="error" sx={{ mt: 2 }}>{resetError}</Alert>
                                )}
                            </form>
                        ) : (
                            <form
                                onSubmit={async (e) => {
                                    e.preventDefault();
                                    setResetMessage('');
                                    setResetError('');
                                    if (newPassword !== confirmPassword) {
                                        setResetError('As senhas não coincidem.');
                                        return;
                                    }
                                    try {
                                        const res = await fetch('https://backend-gfig.onrender.com/updatePassword', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                                email: resetEmail,
                                                code: resetCode.trim(),
                                                newPassword: newPassword,
                                            }),
                                        });
                                        if (res.ok) {
                                            setResetMessage('Senha redefinida com sucesso!');
                                            setTimeout(() => {
                                                setIsResetPassword(false);
                                                setResetEmail('');
                                                setResetMessage('');
                                                setResetError('');
                                                setShowCodeForm(false);
                                                setResetCode('');
                                                setNewPassword('');
                                                setConfirmPassword('');
                                            }, 500); // Aguarda 500 milissegundos antes de voltar para o login
                                        } else {
                                            const text = await res.text();
                                            setResetError(text || 'Erro ao redefinir senha.');
                                        }
                                    } catch {
                                        setResetError('Erro ao conectar ao servidor.');
                                    }
                                }}
                            >
                                <Typography variant="body2" sx={{ mb: 1 }}>
                                    Digite o código recebido por e-mail e sua nova senha.
                                </Typography>
                                <input
                                    type="text"
                                    required
                                    value={resetCode}
                                    onChange={e => setResetCode(e.target.value)}
                                    placeholder="Código recebido"
                                    style={{
                                        width: '100%',
                                        padding: '8px',
                                        marginBottom: '10px',
                                        borderRadius: '4px',
                                        border: '1px solid #ccc'
                                    }}
                                />
                                <input
                                    type="password"
                                    required
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    placeholder="Nova senha"
                                    style={{
                                        width: '100%',
                                        padding: '8px',
                                        marginBottom: '10px',
                                        borderRadius: '4px',
                                        border: '1px solid #ccc'
                                    }}
                                />
                                <input
                                    type="password"
                                    required
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    placeholder="Confirmar nova senha"
                                    style={{
                                        width: '100%',
                                        padding: '8px',
                                        marginBottom: '10px',
                                        borderRadius: '4px',
                                        border: '1px solid #ccc'
                                    }}
                                />
                                <button
                                    type="submit"
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        background: '#1C252E',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '4px',
                                        fontWeight: 'bold',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Redefinir senha
                                </button>
                                {resetMessage && (
                                    <Alert severity="success" sx={{ mt: 2 }}>{resetMessage}</Alert>
                                )}
                                {resetError && (
                                    <Alert severity="error" sx={{ mt: 2 }}>{resetError}</Alert>
                                )}
                            </form>
                        )}
                        <Typography variant="body2" sx={{ mt: 2 }}>
                            <span
                                onClick={() => {
                                    setIsResetPassword(false);
                                    setResetEmail('');
                                    setResetMessage('');
                                    setResetError('');
                                    setShowCodeForm(false);
                                    setResetCode('');
                                    setNewPassword('');
                                    setConfirmPassword('');
                                }}
                                style={{ color: '#1C252E', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                                Voltar para o login
                            </span>
                        </Typography>
                    </Box>
                ) : (
                    <Box sx={{ width: '100%', padding: '0', margin: '0' }}>
                        <AuthForm isSignUp={isSignUp} setIsSignUp={setIsSignUp} />

                        {!isSignUp && !isResetPassword && (
                            <Typography variant="body2" sx={{ mt: 2 }}>
                                <span
                                    onClick={() => setIsResetPassword(true)}
                                    style={{ color: '#1C252E', cursor: 'pointer', fontWeight: 'bold' }}
                                >
                                    Esqueceu sua senha?
                                </span>
                            </Typography>
                        )}
                    </Box>
                )}
            </Grid>

            <Grid
                item
                xs={9}
                sx={{
                    height: '100%',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                <Banner />
            </Grid>
        </Grid >
    );
};

export default LoginPage;
