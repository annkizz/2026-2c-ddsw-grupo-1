import { Container, Typography } from '@mui/material';

const Notificaciones = () => {
  // TODO: GET /notificaciones
  return (
    <Container component="section" maxWidth="md" sx={{ px: 2 }}>
      <Typography component="h1" variant="h2" sx={{ mb: 3 }}>
        Notificaciones
      </Typography>
    </Container>
  );
};

export default Notificaciones;
