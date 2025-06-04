import React from "react";
import { useForm } from "react-hook-form";
import TextInput from '../../../../shared/components/inputs/TextInput';
import SubmitButton from '../../../../shared/components/buttons/SubmitButton';
import { Box } from '@mui/system';
import { authService } from '../../../../services/AuthService';
import { showErrorToast } from "../../../../shared/components/toasters/ErrorToaster";
import { showSucessToast } from "../../../../shared/components/toasters/SucessToaster";
import { jwtDecode} from "jwt-decode";

function SenhaPageContainer() {
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
        try {
            const userEmail = getEmailFromToken();

            if (!userEmail) {
                showErrorToast("Usuário não encontrado no token");
                return;
            }

            const response = await authService.post("senhaPage", { 
                email: userEmail, 
                password: data.senhaAtual, 
                newPassword: data.novaSenha 
            });

            if (response.status === 200) {
                showSucessToast("Senha salva com sucesso!");
            } else if (response.status === 401) {
                showErrorToast("Senha atual incorreta");
            } else if (response.status === 404) {
                showErrorToast("Usuário não encontrado");
            } else if (response.status === 500) {
                showErrorToast("Erro ao atualizar senha, tente novamente mais tarde");
            } else {
                showErrorToast("Erro desconhecido");
            }
        } catch (error) {
            console.error("Erro ao salvar senha", error);
            showErrorToast("Erro ao salvar senha");
        }
    }
    

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <Box>
                    <TextInput
                        id={'senhaAtual'}
                        label={'Senha atual'}
                        type="password"
                        register={register}
                    />
                </Box>

                <Box>
                    <TextInput
                        id={'novaSenha'}
                        label={'Nova senha'}
                        type="password"
                        register={register}
                    />
                </Box>

                <Box>
                    <TextInput
                        id={'confirmarNovaSenha'}
                        label={'Confirmar nova senha'}
                        type="password"
                        register={register}
                    />
                </Box>
                <Box>
                    <SubmitButton text={'Salvar'} />
                </Box>
            </Box>
        </form>
    );
}

export default SenhaPageContainer;
