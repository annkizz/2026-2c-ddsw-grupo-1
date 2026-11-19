import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Alert, Button, Card, Chip, CircularProgress } from '@mui/material';
import { obtenerColaboradoraPorId } from '../../service/colaboradorasService';
import { mensajeDeError } from '../../service/api';
import '../perfil/PerfilPublico.css';

const PerfilColaboradora = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [colaboradora, setColaboradora] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let vigente = true;
    obtenerColaboradoraPorId(id)
      .then((perfil) => {
        if (vigente) setColaboradora(perfil);
      })
      .catch((fallo) => {
        if (vigente) setError(mensajeDeError(fallo));
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });

    return () => {
      vigente = false;
    };
  }, [id]);

  if (cargando) {
    return <div className="perfil-publico-cargando" role="status"><CircularProgress /></div>;
  }

  if (error || !colaboradora) {
    return (
      <main className="perfil-publico">
        <Alert severity="error">{error || 'No encontramos este perfil.'}</Alert>
        <Button variant="text" onClick={() => navigate(-1)}>Volver</Button>
      </main>
    );
  }

  const nombre = [colaboradora.nombre, colaboradora.apellido].filter(Boolean).join(' ');

  return (
    <main className="perfil-publico">
      <Button className="perfil-publico-volver" variant="text" onClick={() => navigate(-1)}>Volver</Button>
      <Card className="perfil-publico-cabecera" variant="outlined">
        <p className="perfil-publico-tipo">PERSONA COLABORADORA</p>
        <h1>{colaboradora.nombreFantasia || nombre || 'Perfil de colaboradora'}</h1>
        {nombre && colaboradora.nombreFantasia && <p>{nombre}</p>}
        {colaboradora.pronombres?.length > 0 && (
          <p className="perfil-publico-pronombres">{colaboradora.pronombres.join(' · ')}</p>
        )}
        {colaboradora.presentacion && <p>{colaboradora.presentacion}</p>}
        {colaboradora.usuarioGitHub && <p>GitHub o GitLab: {colaboradora.usuarioGitHub}</p>}
      </Card>

      <Card className="perfil-publico-seccion" variant="outlined">
        <h2>Habilidades</h2>
        {colaboradora.habilidades?.length ? (
          <div className="perfil-publico-etiquetas">
            {colaboradora.habilidades.map((habilidad) => (
              <Chip key={habilidad} label={habilidad} />
            ))}
          </div>
        ) : (
          <p>Aún no agregó habilidades.</p>
        )}
      </Card>
      <p className="perfil-publico-privacidad">
        Los medios de contacto son privados y no se muestran en este perfil.
      </p>
    </main>
  );
};

export default PerfilColaboradora;
