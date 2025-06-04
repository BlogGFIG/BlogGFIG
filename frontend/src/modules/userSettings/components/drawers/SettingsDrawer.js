import * as React from 'react';
import { AppProvider } from '@toolpad/core/AppProvider';
import { DashboardLayout } from '@toolpad/core/DashboardLayout';
import { PageContainer } from '@toolpad/core/PageContainer';
import PasswordIcon from '@mui/icons-material/Password';
import DeleteIcon from '@mui/icons-material/Delete';
import AlteracaoDeSenhaPageContainer from '../pageContainers/AlteracaoDeSenhaPageContainer';

const NAVIGATION = [
  {
    kind: 'header',
    title: 'Usuário',
  },
  {
    segment: 'senha',
    title: 'Alteração de senha',
    icon: <PasswordIcon />,
  },
  {
    segment: 'deletarConta',
    title: 'Deletar Conta',
    icon: <DeleteIcon />,
  },
];

function useDemoRouter(initialPath) {
  const [pathname, setPathname] = React.useState(initialPath);

  const router = React.useMemo(
    () => ({
      pathname,
      navigate: (path) => setPathname(path),
    }),
    [pathname]
  );

  return router;
}

export default function SettingsDrawer(props) {
  const router = useDemoRouter('/senha');

  let CurrentComponent;
  const pathSegments = router.pathname.split('/');
  const lastSegment = pathSegments[pathSegments.length - 1];

  switch (lastSegment) {
    case 'senha':
      CurrentComponent = AlteracaoDeSenhaPageContainer;
      break;
    case 'deletarConta':
      CurrentComponent = () => <div>Componente de deletar conta</div>;
      break;
    default:
      CurrentComponent = () => <div>Selecione uma opção.</div>;
  }

  return (
    <AppProvider navigation={NAVIGATION} router={router}>
      <DashboardLayout>
        <PageContainer>
          <CurrentComponent />
        </PageContainer>
      </DashboardLayout>
    </AppProvider>
  );
}
