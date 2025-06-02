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
                    {isSignUp ? 'Crie sua conta' : 'Entre na sua conta'}
                </Typography>

                {/* Texto de troca de modo */}
                <Typography variant="body2">
                    {isSignUp ? 'Já possui uma conta? ' : 'Não possui uma conta? '}
                    <span
                        onClick={() => setIsSignUp(!isSignUp)}
                        style={{ color: '#1C252E', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                        {isSignUp ? 'entrar' : 'cadastre-se'}
                    </span>
                </Typography>

                {/* Alerta visível apenas no modo login */}
                {!isSignUp && (
                    <Box sx={{ width: '100%' }}>
                        <Alert
                            icon={<InfoOutlinedIcon sx={{ color: '#000' }} />} // ícone preto
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

                <Box sx={{ width: '100%', padding: '0', margin: '0' }}>
                    <AuthForm isSignUp={isSignUp} setIsSignUp={setIsSignUp} />
                </Box>
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
