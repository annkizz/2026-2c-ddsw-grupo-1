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
import Markdown from '../../components/Markdown/Markdown.jsx';

// Vista común de perfiles públicos (colaboradora y colectivo).
const PerfilPublicoVista = ({ tipo, esColectivo, cargando, error, encontrado, onReintentar, titulo, datos, seccionTitulo, chips, textoSinChips, children }) => {
  const navigate = useNavigate();
  const volver = (
    <Button variant="outlined" startIcon={<FiArrowLeft aria-hidden="true" />} onClick={() => navigate(-1)}>
      {t('comun.volver')}
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
        <EncabezadoPagina titulo={t('perfilPublico.tituloPerfilDe', { tipo: tipo.toLowerCase() })} migas={[{ texto: t('navegacion.inicio'), to: '/' }, { texto: t('perfilPublico.perfil') }]} />
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
            <h2>{t(esColectivo ? 'perfilPublico.sobreColectivo' : 'perfilPublico.sobrePersona')}</h2>
            {principal ? <Markdown texto={principal} className="perfil-publico__descripcion" /> : <p className="texto-secundario">{t('perfilPublico.sinDescripcion')}</p>}
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
            <FiLock aria-hidden="true" /> {t('perfilPublico.contactoPrivado')}
          </p>
        </aside>
      </div>
    </div>
  );
};

PerfilPublicoVista.propTypes = {
  tipo: PropTypes.string.isRequired,
  esColectivo: PropTypes.bool,
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
