import React from 'react';
import PropTypes from 'prop-types';
import '@testing-library/jest-dom';
import { render, fireEvent, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ThemeProvider } from '@mui/material';
import { Button } from '@mui/material';
import { crearTema } from '../theme/crearTema';
import { tokensBase } from '../designTokens';
import EncabezadoPagina from './EncabezadoPagina/EncabezadoPagina.jsx';
import AlertaError from './AlertaError/AlertaError.jsx';
import EstadoVacio from './EstadoVacio/EstadoVacio.jsx';
import ResumenErrores from './ResumenErrores/ResumenErrores.jsx';
import PasosRegistro from './PasosRegistro/PasosRegistro.jsx';
import CustomSelect from './CustomSelect/CustomSelect';
import CardProyecto from './CardProyecto/CardProyecto.jsx';
import CardColaboradora from './CardColaboradora/CardColaboradora.jsx';
import ChipEstado from './ChipEstado/ChipEstado.jsx';
import Footer from './footer/Footer.jsx';
import { EsqueletoGrilla, EsqueletoPagina } from './Esqueletos/Esqueletos.jsx';
import PaginaNoEncontrada from '../features/errores/PaginaNoEncontrada.jsx';

// CardColaboradora usa useAuth, que importa @logto/react (ESM que Jest 27 no transforma).
// Igual que en CardColaboradora.test.jsx, se reemplaza por un mock.
jest.mock('../hooks/useAuth.jsx', () => ({
  useAuth: () => ({ getAccessToken: jest.fn() }),
  useAuthOpcional: () => null
}));

// Igual que el resto de los tests del proyecto: Jest 27 no resuelve los subpaths de react-router 7.
jest.mock('react-router-dom', () => {
  const React = require('react');
  const PropTypesMock = require('prop-types');
  const Link = ({ to, children, ...props }) => React.createElement('a', { href: to, ...props }, children);
  Link.propTypes = { to: PropTypesMock.string, children: PropTypesMock.node };
  return { Link, useNavigate: () => jest.fn() };
});

const MemoryRouter = ({ children }) => <>{children}</>;
MemoryRouter.propTypes = { children: PropTypes.node };

expect.extend(toHaveNoViolations);

// jsdom no calcula estilos reales: el contraste y el daltonismo se validan en designTokens.test.js.
const opcionesAxe = { rules: { 'color-contrast': { enabled: false }, region: { enabled: false } } };

const renderizar = (ui) =>
  render(
    <MemoryRouter>
      <ThemeProvider theme={crearTema(tokensBase)}>
        <main>{ui}</main>
      </ThemeProvider>
    </MemoryRouter>
  );

const sinViolaciones = async (container) => expect(await axe(container, opcionesAxe)).toHaveNoViolations();

describe('Accesibilidad de componentes compartidos (jest-axe)', () => {
  it('EncabezadoPagina con migas, subtítulo y acción', async () => {
    const { container } = renderizar(
      <EncabezadoPagina
        titulo="Mis proyectos"
        subtitulo="Administrá los proyectos de tu colectivo"
        antetitulo="Espacio de tu colectivo"
        migas={[{ texto: 'Inicio', to: '/' }, { texto: 'Mis proyectos' }]}
        accion={<Button variant="contained">Crear proyecto</Button>}
      />
    );
    expect(screen.getByRole('heading', { level: 1, name: 'Mis proyectos' })).toBeInTheDocument();
    expect(screen.getByText('Mis proyectos', { selector: '[aria-current="page"]' })).toBeInTheDocument();
    await sinViolaciones(container);
  });

  it('AlertaError ofrece Reintentar y no muestra el texto del backend', async () => {
    const onReintentar = jest.fn();
    const { container } = renderizar(
      <AlertaError
        error={{ response: { status: 500, data: { error: 'detalle interno' } } }}
        titulo="No pudimos cargar los proyectos"
        onReintentar={onReintentar}
      />
    );
    expect(screen.getByRole('alert')).toHaveTextContent('El servidor tuvo un problema');
    expect(screen.queryByText(/detalle interno/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(onReintentar).toHaveBeenCalledTimes(1);
    await sinViolaciones(container);
  });

  it('EstadoVacio con acción', async () => {
    const { container } = renderizar(
      <EstadoVacio titulo="Todavía no tenés proyectos" descripcion="Creá el primero." accion={<Button>Crear proyecto</Button>} />
    );
    await sinViolaciones(container);
  });

  it('ResumenErrores enlaza a cada campo y recibe el foco', async () => {
    const { container } = renderizar(
      <>
        <ResumenErrores errores={[{ campoId: 'campo-titulo', mensaje: 'Ingresá un título' }]} intento={1} />
        <label htmlFor="campo-titulo">Título</label>
        <input id="campo-titulo" />
      </>
    );
    expect(screen.getByRole('alert')).toHaveFocus();
    fireEvent.click(screen.getByRole('link', { name: 'Ingresá un título' }));
    expect(document.getElementById('campo-titulo')).toHaveFocus();
    await sinViolaciones(container);
  });

  it('PasosRegistro y ChipEstado', async () => {
    const { container } = renderizar(
      <>
        <PasosRegistro pasos={['Tus datos', 'Habilidades', 'Contacto']} actual={2} />
        <ChipEstado estado="ACTIVO" />
        <ChipEstado estado="FINALIZADO" />
      </>
    );
    expect(screen.getByText('Paso 2 de 3:', { exact: false })).toBeInTheDocument();
    await sinViolaciones(container);
  });

  it('CustomSelect con ayuda, error y opciones abiertas', async () => {
    const { container } = renderizar(
      <CustomSelect
        id="habilidades"
        etiqueta="Habilidades"
        opciones={['React', 'Node.js']}
        seleccion={['React']}
        multiple
        onSeleccionar={() => {}}
        ayuda="Elegí al menos una"
        error="Elegí al menos una habilidad disponible."
      />
    );
    const combo = screen.getByRole('combobox', { name: 'Habilidades' });
    expect(combo).toHaveAttribute('aria-invalid', 'true');
    expect(combo.getAttribute('aria-describedby')).toContain('habilidades-error');
    fireEvent.focus(combo);
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    await sinViolaciones(container);
  });

  it('Cards de proyecto y colaboradora en una grilla', async () => {
    const { container } = renderizar(
      <ul className="tarjetas">
        <CardProyecto
          proyecto={{ id: 'p1', titulo: 'Huerta comunitaria', descripcion: 'App para la huerta', estado: 'ACTIVO', etiquetas: ['SALUD'] }}
          nombreColectivo="La Semilla"
        />
        <CardColaboradora colaboradora={{ id: 'b1', nombreFantasia: 'Luna Código', usuarioGitHub: 'luna', tieneCoincidencia: true }} />
      </ul>
    );
    await sinViolaciones(container);
  });

  it('Footer, esqueletos y página 404', async () => {
    const { container } = renderizar(
      <>
        <EsqueletoGrilla cantidad={2} />
        <EsqueletoPagina mensaje="Cargando…" />
        <PaginaNoEncontrada />
      </>
    );
    await sinViolaciones(container);
    const pie = render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    );
    expect(await axe(pie.container, opcionesAxe)).toHaveNoViolations();
  });
});
