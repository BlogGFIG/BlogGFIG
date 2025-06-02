import * as React from 'react';
import Button from '@mui/material/Button';

const OutlinedButton = ({ text, onClick }) => {
  return (
    <Button
      variant="outlined"
      type="submit"
      onClick={onClick}
      sx={{
        color: '#ffffff', // cor do texto
        backgroundColor: '#1C252E', // cor de fundo
        fontWeight: 'bold', // deixa o texto em negrito
        border: 'none',
        '&:hover': {
          backgroundColor: '#2A3542', // efeito hover
          border: 'none'
        },
      }}
    >
      {text}
    </Button>
  );
};



export default OutlinedButton;
