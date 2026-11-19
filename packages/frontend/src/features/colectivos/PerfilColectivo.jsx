import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Alert, Button, Card, Chip, CircularProgress } from '@mui/material';
import { obtenerColectivoPorId, TIPOS_COLECTIVO } from '../../service/colectivosService';
import { mensajeDeError } from '../../service/api';
import { etiquetaLegible } from '../../utils/etiquetas';
import '../perfil/PerfilPublico.css';

const PerfilColectivo = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [colectivo, setColectivo] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let vigente = true;
    obtenerColectivoPorId(id)
      .then((perfil) => {
        if (vigente) setColectivo(perfil);
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

  if (error || !colectivo) {
    return (
      <main className="perfil-publico">
        <Alert severity="error">{error || 'No encontramos este perfil.'}</Alert>
        <Button variant="text" onClick={() => navigate(-1)}>Volver</Button>
      </main>
    );
  }

  const tipo = TIPOS_COLECTIVO.find((opcion) => opcion.valor === colectivo.tipoDeColectivo);
  const ubicacion = [
    colectivo.ubicacion?.ciudad,
    colectivo.ubicacion?.provincia,
    colectivo.ubicacion?.pais,
  ].filter(Boolean).join(', ');

  return (
    <main className="perfil-publico">
      <Button className="perfil-publico-volver" variant="text" onClick={() => navigate(-1)}>Volver</Button>
      <Card className="perfil-publico-cabecera" variant="outlined">
        <p className="perfil-publico-tipo">COLECTIVO</p>
        <h1>{colectivo.nombre}</h1>
        {tipo && <p>{tipo.texto}</p>}
        {ubicacion && <p>{ubicacion}</p>}
        <p>{colectivo.descripcion}</p>
      </Card>

      <Card className="perfil-publico-seccion" variant="outlined">
        <h2>Habilidades y áreas de trabajo</h2>
        {colectivo.etiquetas?.length ? (
          <div className="perfil-publico-etiquetas">
            {colectivo.etiquetas.map((etiqueta) => (
              <Chip key={etiqueta} label={etiquetaLegible(etiqueta)} />
            ))}
          </div>
        ) : (
          <p>Aún no agregó áreas de trabajo.</p>
        )}
      </Card>
      <p className="perfil-publico-privacidad">
        Los medios de contacto son privados y no se muestran en este perfil.
      </p>
    </main>
  );
};

export default PerfilColectivo;
