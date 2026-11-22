import { t } from '../../i18n/t';
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
        <EsqueletoPerfil etiqueta={t('perfilPublico.cargandoElPerfil')} />
      </div>
    );
  }

  if (error || !encontrado) {
    const noEncontrado = !error || error?.response?.status === 404;
    return (
      <div className="contenedor-pagina contenedor-pagina--lectura">
        <EncabezadoPagina titulo={t('perfilPublico.tituloPerfilDe', { tipo: tipo.toLowerCase() })} migas={[{ texto: t('navegacion.inicio'), to: '/' }, { texto: 'Perfil' }]} />
        {noEncontrado ? (
          <EstadoVacio
            icono={FiUser}
            titulo={t('perfilPublico.noEncontramosEstePerfil')}
            descripcion={t('perfilPublico.puedeQueElEnlaceHaya')}
            accion={volver}
          />
        ) : (
          <AlertaError error={error} titulo={t('perfilPublico.noPudimosCargarEstePerfil')} onReintentar={onReintentar} />
        )}
      </div>
    );
  }

  // Convención: el último dato es la descripción; los anteriores van como resumen bajo el título.
  const principal = datos[datos.length - 1];
  const secundarios = datos.slice(0, -1).filter(Boolean);
  // Ancho completo: datos y descripción a la izquierda, áreas/habilidades a la derecha.
  return (
    <div className="contenedor-pagina perfil-publico">
      <EncabezadoPagina
        titulo={titulo}
        antetitulo={tipo}
        migas={[{ texto: t('navegacion.inicio'), to: '/' }, { texto: titulo }]}
        accion={volver}
      >
        {secundarios.length > 0 && (
          <p className="perfil-publico__meta">{secundarios.join(' · ')}</p>
        )}
      </EncabezadoPagina>
      <div className="con-lateral con-lateral--derecha perfil-publico__cuerpo">
        <div className="perfil-publico__principal">
          <section className="perfil-publico__tarjeta" aria-label={t('perfilPublico.datosDelPerfil')}>
            <h2>Sobre {tipo.toLowerCase() === 'colectivo' ? 'el colectivo' : 'la persona'}</h2>
            {principal ? <p className="perfil-publico__descripcion">{principal}</p> : <p className="texto-secundario">Sin descripción.</p>}
          </section>
          {children}
        </div>
        <aside className="lateral">
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
            <FiLock aria-hidden="true" /> Los medios de contacto son privados.
          </p>
        </aside>
      </div>
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
