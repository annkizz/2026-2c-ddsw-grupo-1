import React from 'react';
import PropTypes from 'prop-types';
import { Button, Chip } from '@mui/material';
import { FiArrowLeft, FiLock, FiUser } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import EncabezadoPagina from '../../components/EncabezadoPagina/EncabezadoPagina.jsx';
import AlertaError from '../../components/AlertaError/AlertaError.jsx';
import EstadoVacio from '../../components/EstadoVacio/EstadoVacio.jsx';
import { EsqueletoPerfil } from '../../components/Esqueletos/Esqueletos.jsx';
import './PerfilPublico.css';

// Vista común de perfiles públicos (colaboradora y colectivo).
const PerfilPublicoVista = ({ tipo, cargando, error, encontrado, onReintentar, titulo, datos, seccionTitulo, chips, textoSinChips, children }) => {
  const navigate = useNavigate();
  const volver = (
    <Button variant="outlined" startIcon={<FiArrowLeft aria-hidden="true" />} onClick={() => navigate(-1)}>
      Volver
    </Button>
  );

  if (cargando) {
    return (
      <div className="contenedor-pagina contenedor-pagina--formulario">
        <EsqueletoPerfil etiqueta="Cargando el perfil…" />
      </div>
    );
  }

  if (error || !encontrado) {
    const noEncontrado = !error || error?.response?.status === 404;
    return (
      <div className="contenedor-pagina contenedor-pagina--lectura">
        <EncabezadoPagina titulo={`Perfil de ${tipo.toLowerCase()}`} migas={[{ texto: 'Inicio', to: '/' }, { texto: 'Perfil' }]} />
        {noEncontrado ? (
          <EstadoVacio
            icono={FiUser}
            titulo="No encontramos este perfil"
            descripcion="Puede que el enlace haya cambiado o que el perfil ya no esté disponible."
            accion={volver}
          />
        ) : (
          <AlertaError error={error} titulo="No pudimos cargar este perfil" onReintentar={onReintentar} />
        )}
      </div>
    );
  }

  return (
    <div className="contenedor-pagina contenedor-pagina--formulario perfil-publico">
      <EncabezadoPagina titulo={titulo} antetitulo={tipo} migas={[{ texto: 'Inicio', to: '/' }, { texto: titulo }]} />
      <section className="perfil-publico__tarjeta" aria-label="Datos del perfil">
        {datos.filter(Boolean).map((dato, i) => (
          <p key={i} className={i === datos.length - 1 ? 'perfil-publico__descripcion' : 'texto-secundario'}>
            {dato}
          </p>
        ))}
        {children}
      </section>
      <section className="perfil-publico__tarjeta" aria-labelledby="perfil-publico-chips">
        <h2 id="perfil-publico-chips">{seccionTitulo}</h2>
        {chips.length ? (
          <ul className="lista-chips">
            {chips.map((chip) => (
              <li key={chip}>
                <Chip label={chip} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="texto-secundario">{textoSinChips}</p>
        )}
      </section>
      <p className="perfil-publico__privacidad texto-secundario">
        <FiLock aria-hidden="true" /> Los medios de contacto son privados y no se muestran en este perfil.
      </p>
      <div>{volver}</div>
    </div>
  );
};

PerfilPublicoVista.propTypes = {
  tipo: PropTypes.string.isRequired,
  cargando: PropTypes.bool,
  error: PropTypes.any,
  encontrado: PropTypes.bool,
  onReintentar: PropTypes.func,
  titulo: PropTypes.node,
  datos: PropTypes.arrayOf(PropTypes.node),
  seccionTitulo: PropTypes.node,
  chips: PropTypes.arrayOf(PropTypes.string),
  textoSinChips: PropTypes.node,
  children: PropTypes.node,
};


export default PerfilPublicoVista;
