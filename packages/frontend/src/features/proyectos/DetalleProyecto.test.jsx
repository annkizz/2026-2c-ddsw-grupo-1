import '@testing-library/jest-dom';
import React from 'react';
import { fireEvent, render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useAuth } from '../../hooks/useAuth.jsx';
import { useLinkedin } from '../../hooks/useLinkedin.js';
import {
  crearLogro,
  crearPostulacion,
  obtenerColaboraciones,
  obtenerColaboracionesParaGestion,
  obtenerLogros,
  obtenerPostulaciones,
  obtenerPerfiles,
  obtenerProyectoPorId,
  publicarLogroEnLinkedin,
  resolverPostulacion,
} from '../../service/proyectosService';
import {
  obtenerColaboradoraPorId,
  obtenerMiPerfilColaboradora,
  obtenerMisColaboraciones,
} from '../../service/colaboradorasService';
import DetalleProyecto from './DetalleProyecto';

jest.mock('../../hooks/useAuth.jsx', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../components/Markdown.jsx', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('../../hooks/useLinkedin.js', () => ({
  useLinkedin: jest.fn(),
}));

jest.mock('react-router-dom', () => {
  const PropTypes = jest.requireActual('prop-types');
  const Link = ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>;
  Link.propTypes = { children: PropTypes.node, to: PropTypes.string };
  return {
    Link,
    useNavigate: () => jest.fn(),
    useLocation: () => ({ state: null }),
    useParams: () => ({ id: 'proyecto-1' }),
  };
});

jest.mock('../../service/proyectosService', () => ({
  crearLogro: jest.fn(),
  crearPostulacion: jest.fn(),
  obtenerColaboraciones: jest.fn(),
  obtenerColaboracionesParaGestion: jest.fn(),
  darDeBajaColaboracion: jest.fn(),
  obtenerLogros: jest.fn(),
  obtenerPostulaciones: jest.fn(),
  obtenerPerfiles: jest.fn(),
  obtenerProyectoPorId: jest.fn(),
  publicarLogroEnLinkedin: jest.fn(),
  resolverPostulacion: jest.fn(),
}));

jest.mock('../../service/colaboradorasService', () => ({
  obtenerMisColaboraciones: jest.fn(),
  obtenerMiPerfilColaboradora: jest.fn(),
  obtenerColaboradoraPorId: jest.fn(),
}));

// La pantalla está dividida en pestañas: cada prueba abre la que necesita.
const irAPestana = async (nombre) =>
  userEvent.click(await screen.findByRole('tab', { name: new RegExp(`^${nombre}`) }));

describe('DetalleProyecto - postulaciones', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useLinkedin.mockReturnValue({ estado: null, conectar: jest.fn(), recargar: jest.fn() });
    useAuth.mockReturnValue({
      sesion: { idColaborador: 'colaborador-1', rol: 'COLABORADOR' },
      getAccessToken: jest.fn().mockResolvedValue('token'),
      isAuthenticated: true,
      cargando: false,
      iniciarSesion: jest.fn(),
    });
    obtenerProyectoPorId.mockResolvedValue({
      id: 'proyecto-1',
      idColectivo: 'colectivo-1',
      titulo: 'Proyecto solidario',
      descripcion: 'Descripción',
      estado: 'ACTIVO',
      busquedaVigente: true,
    });
    obtenerPerfiles.mockResolvedValue([
      {
        id: 'perfil-1',
        descripcion: 'Tester',
        habilidadesRequeridas: [],
        habilidadesOpcionales: [],
        compromiso: {
          tipoCompromiso: 'MENSUALES',
          horas: 4,
          tipoColaboracion: 'GRATUITA',
        },
        limiteColaboraciones: null,
      },
    ]);
    obtenerLogros.mockResolvedValue([]);
    obtenerColaboraciones.mockResolvedValue([]);
    obtenerColaboracionesParaGestion.mockResolvedValue([]);
    obtenerPostulaciones.mockResolvedValue([]);
    obtenerMisColaboraciones.mockResolvedValue([]);
    obtenerMiPerfilColaboradora.mockResolvedValue({ habilidades: [] });
    obtenerColaboradoraPorId.mockResolvedValue({ habilidades: [] });
    crearPostulacion.mockResolvedValue({ id: 'postulacion-1', estado: 'PENDIENTE' });
    resolverPostulacion.mockResolvedValue({});
  });

  it('muestra fecha y hora locales al colectivo', async () => {
    useAuth.mockReturnValue({
      sesion: { idColectivo: 'colectivo-1', rol: 'COLECTIVO' },
      getAccessToken: jest.fn().mockResolvedValue('token'), isAuthenticated: true, cargando: false,
    });
    const fecha = '2026-11-18T16:35:00.000Z';
    obtenerPostulaciones.mockResolvedValue([{
      id: 'post-1', idPerfil: 'perfil-1', estado: 'PENDIENTE', fechaPostulacion: fecha,
    }]);
    render(<DetalleProyecto />);
    await irAPestana('Postulaciones');
    const fechaHora = new Intl.DateTimeFormat('es-AR', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(fecha));
    expect(await screen.findByText(`Enviada el ${fechaHora.replace(/\s+/g, ' ')}`)).toBeInTheDocument();
  });

  it('permite publicar un logro al crearlo cuando se elige la opción', async () => {
    useAuth.mockReturnValue({
      sesion: { idColectivo: 'colectivo-1', rol: 'COLECTIVO' },
      getAccessToken: jest.fn().mockResolvedValue('token'), isAuthenticated: true, cargando: false,
    });
    useLinkedin.mockReturnValue({ estado: { conectado: true, nombre: 'Ada' }, conectar: jest.fn(), recargar: jest.fn() });
    crearLogro.mockResolvedValue({ id: 'logro-1', titulo: 'Prototipo', publicacionLinkedin: { estado: 'ENVIADO' } });
    render(<DetalleProyecto />);
    await irAPestana('Logros');
    await userEvent.type(screen.getByLabelText(/Título del logro/), 'Prototipo');
    await userEvent.type(screen.getByRole('textbox', { name: /Descripción del logro/ }), 'Ya funciona');
    await userEvent.click(screen.getByRole('checkbox', { name: 'Publicar también en mi LinkedIn' }));
    await userEvent.click(screen.getByRole('button', { name: 'Agregar logro' }));
    await waitFor(() => expect(crearLogro).toHaveBeenCalledWith(
      'token', 'proyecto-1', expect.objectContaining({ titulo: 'Prototipo', descripcion: 'Ya funciona', publicarEnLinkedin: true }),
    ));
    expect(await screen.findByText('¡Logro publicado en LinkedIn!')).toBeInTheDocument();
  });

  it('permite compartir un logro existente en LinkedIn', async () => {
    useAuth.mockReturnValue({
      sesion: { idColectivo: 'colectivo-1', rol: 'COLECTIVO' },
      getAccessToken: jest.fn().mockResolvedValue('token'), isAuthenticated: true, cargando: false,
    });
    useLinkedin.mockReturnValue({ estado: { conectado: true }, conectar: jest.fn(), recargar: jest.fn() });
    obtenerLogros.mockResolvedValue([{ id: 'logro-1', titulo: 'Prototipo', descripcion: 'Ya funciona' }]);
    publicarLogroEnLinkedin.mockResolvedValue({ id: 'logro-1', titulo: 'Prototipo', publicacionLinkedin: { estado: 'ENVIADO' } });
    render(<DetalleProyecto />);
    await irAPestana('Logros');
    await userEvent.click(await screen.findByRole('button', { name: 'Compartir en LinkedIn' }));
    await waitFor(() => expect(publicarLogroEnLinkedin).toHaveBeenCalledWith('token', 'proyecto-1', 'logro-1'));
    expect(await screen.findByText('Publicado en LinkedIn')).toBeInTheDocument();
  });

  it('advierte que el logro se guardó si no se pudo registrar la publicación', async () => {
    useAuth.mockReturnValue({
      sesion: { idColectivo: 'colectivo-1', rol: 'COLECTIVO' },
      getAccessToken: jest.fn().mockResolvedValue('token'), isAuthenticated: true, cargando: false,
    });
    useLinkedin.mockReturnValue({ estado: { conectado: true }, conectar: jest.fn(), recargar: jest.fn() });
    crearLogro.mockRejectedValue({ response: { data: { codigo: 'LINKEDIN_RESULTADO_NO_REGISTRADO' } } });
    obtenerLogros.mockResolvedValueOnce([]).mockResolvedValueOnce([{ id: 'logro-1', titulo: 'Prototipo' }]);
    render(<DetalleProyecto />);
    await irAPestana('Logros');
    await userEvent.type(screen.getByLabelText(/Título del logro/), 'Prototipo');
    await userEvent.type(screen.getByRole('textbox', { name: /Descripción del logro/ }), 'Ya funciona');
    await userEvent.click(screen.getByRole('checkbox', { name: 'Publicar también en mi LinkedIn' }));
    await userEvent.click(screen.getByRole('button', { name: 'Agregar logro' }));
    expect(await screen.findByText(/El logro se guardó, pero no se pudo guardar el resultado/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Título del logro/)).toHaveValue('');
    expect(screen.getByRole('heading', { name: 'Prototipo' })).toBeInTheDocument();
  });

  it('muestra las habilidades y el perfil público de una postulante pendiente', async () => {
    useAuth.mockReturnValue({
      sesion: { idColectivo: 'colectivo-1', rol: 'COLECTIVO' },
      getAccessToken: jest.fn().mockResolvedValue('token'),
      isAuthenticated: true, cargando: false,
    });
    obtenerPostulaciones.mockResolvedValue([{
      id: 'post-1', idPerfil: 'perfil-1', estado: 'PENDIENTE',
      perfilPublico: { nombreFantasia: 'Ada', habilidades: ['React'], presentacion: 'Desarrolladora' },
    }]);
    render(<DetalleProyecto />);
    await irAPestana('Postulaciones');
    expect((await screen.findByText('Perfil público:')).parentElement).toHaveTextContent('Ada');
    expect(screen.getByText('Habilidades:').parentElement).toHaveTextContent('React');
    expect(screen.getByText('Desarrolladora')).toBeInTheDocument();
  });

  it('envía una postulación con la preferencia de anonimato elegida', async () => {
    render(<DetalleProyecto />);
    await irAPestana('Perfiles');

    await userEvent.click(await screen.findByRole('button', { name: 'Postularme' }));
    await userEvent.click(screen.getByLabelText('Registrar mi contribución de forma anónima'));
    await userEvent.click(screen.getByRole('button', { name: 'Enviar postulación' }));

    await waitFor(() => {
      expect(crearPostulacion).toHaveBeenCalledWith(
        'token',
        'proyecto-1',
        'perfil-1',
        { esAnonima: true }
      );
    });
    expect(await screen.findByText('Tu postulación fue enviada')).toBeInTheDocument();
  });

  it('deshabilita la postulación cuando el perfil ya no tiene vacantes', async () => {
    obtenerPerfiles.mockResolvedValueOnce([
      {
        id: 'perfil-1',
        descripcion: 'Tester',
        habilidadesRequeridas: [],
        habilidadesOpcionales: [],
        compromiso: {
          tipoCompromiso: 'MENSUALES',
          horas: 4,
          tipoColaboracion: 'GRATUITA',
        },
        limiteColaboraciones: 1,
      },
    ]);
    obtenerColaboraciones.mockResolvedValueOnce([{ idPerfil: 'perfil-1' }]);

    render(<DetalleProyecto />);
    await irAPestana('Perfiles');

    expect(await screen.findByText('No quedan vacantes para este perfil')).toBeInTheDocument();
    expect(
      await screen.findByRole('button', { name: 'Postularme' }),
    ).toBeDisabled();
  });

  it('no ofrece postularse a quien ya colabora en el proyecto', async () => {
    obtenerMisColaboraciones.mockResolvedValue([
      { idProyecto: 'proyecto-1', idPerfil: 'perfil-1' },
    ]);

    render(<DetalleProyecto />);
    await irAPestana('Perfiles');

    expect(
      await screen.findByRole('button', {
        name: 'Ya colaborás en este proyecto',
      }),
    ).toBeDisabled();
    expect(
      screen.queryByRole('button', { name: 'Postularme' }),
    ).not.toBeInTheDocument();
  });

  it('permite al colectivo aceptar una postulación y revela los datos de contacto', async () => {
    const colaboradoraAceptada = {
      id: 'postulacion-1',
      idProyecto: 'proyecto-1',
      idPerfil: 'perfil-1',
      estado: 'ACEPTADA',
      colaborador: {
        id: 'colaboradora-1',
        nombre: 'Ana',
        apellido: 'Gómez',
        mediosDeContacto: [
          { tipoDeContacto: 'EMAIL', contacto: 'ana@example.com' },
        ],
      },
    };
    useAuth.mockReturnValue({
      sesion: { idColectivo: 'colectivo-1', rol: 'COLECTIVO' },
      getAccessToken: jest.fn().mockResolvedValue('token'),
      isAuthenticated: true,
      cargando: false,
    });
    obtenerPostulaciones
      .mockResolvedValueOnce([
        {
          id: 'postulacion-1',
          idProyecto: 'proyecto-1',
          idPerfil: 'perfil-1',
          estado: 'PENDIENTE',
          fechaPostulacion: '2026-11-18T00:00:00.000Z',
        },
      ])
      .mockResolvedValueOnce([colaboradoraAceptada]);
    resolverPostulacion.mockResolvedValue(colaboradoraAceptada);

    render(<DetalleProyecto />);
    await irAPestana('Postulaciones');

    expect(
      await screen.findByText(
        'Los datos de contacto se habilitan al aceptar.',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText('Ana Gómez')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Aceptar' }));

    await waitFor(() => {
      expect(resolverPostulacion).toHaveBeenCalledWith(
        'token',
        'proyecto-1',
        'postulacion-1',
        'ACEPTADA',
      );
    });
    expect(await screen.findByText(/Colaboradora aceptada: Ana Gómez/)).toBeInTheDocument();
    expect(screen.queryByText('Medios de contacto')).not.toBeInTheDocument();
    expect(screen.getByText('EMAIL: ana@example.com')).toBeInTheDocument();
  });

  it('permite al colectivo rechazar una postulación pendiente', async () => {
    useAuth.mockReturnValue({
      sesion: { idColectivo: 'colectivo-1', rol: 'COLECTIVO' },
      getAccessToken: jest.fn().mockResolvedValue('token'),
      isAuthenticated: true,
      cargando: false,
    });
    const postulacionPendiente = {
      id: 'postulacion-1',
      idProyecto: 'proyecto-1',
      idPerfil: 'perfil-1',
      estado: 'PENDIENTE',
    };
    obtenerPostulaciones
      .mockResolvedValueOnce([postulacionPendiente])
      .mockResolvedValueOnce([{ ...postulacionPendiente, estado: 'RECHAZADA' }]);
    resolverPostulacion.mockResolvedValue({
      id: 'postulacion-1',
      estado: 'RECHAZADA',
    });

    render(<DetalleProyecto />);
    await irAPestana('Postulaciones');
    fireEvent.click(await screen.findByRole('button', { name: 'Rechazar' }));

    await waitFor(() => {
      expect(resolverPostulacion).toHaveBeenCalledWith(
        'token',
        'proyecto-1',
        'postulacion-1',
        'RECHAZADA',
      );
    });
    expect((await screen.findAllByText('Rechazada')).length).toBeGreaterThan(0);
  });

  it('deshabilita la aceptación cuando el perfil ya alcanzó el cupo', async () => {
    useAuth.mockReturnValue({
      sesion: { idColectivo: 'colectivo-1', rol: 'COLECTIVO' },
      getAccessToken: jest.fn().mockResolvedValue('token'),
      isAuthenticated: true,
      cargando: false,
    });
    obtenerPerfiles.mockResolvedValueOnce([
      {
        id: 'perfil-1',
        descripcion: 'Tester',
        habilidadesRequeridas: [],
        habilidadesOpcionales: [],
        compromiso: {
          tipoCompromiso: 'MENSUALES',
          horas: 4,
          tipoColaboracion: 'GRATUITA',
        },
        limiteColaboraciones: 1,
      },
    ]);
    obtenerColaboraciones.mockResolvedValueOnce([{ idPerfil: 'perfil-1' }]);
    obtenerPostulaciones.mockResolvedValue([
      {
        id: 'postulacion-1',
        idProyecto: 'proyecto-1',
        idPerfil: 'perfil-1',
        estado: 'PENDIENTE',
      },
    ]);

    render(<DetalleProyecto />);
    await irAPestana('Postulaciones');

    expect(
      await screen.findByText(
        'No se puede aceptar: el perfil ya alcanzó su límite de colaboraciones.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Aceptar' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Rechazar' })).toBeEnabled();
  });

  it('mantiene la etiqueta de fecha flotada cuando la búsqueda está cerrada', async () => {
    useAuth.mockReturnValue({
      sesion: { idColectivo: 'colectivo-1', rol: 'COLECTIVO' },
      getAccessToken: jest.fn().mockResolvedValue('token'),
      isAuthenticated: true,
      cargando: false,
    });
    obtenerProyectoPorId.mockResolvedValueOnce({
      id: 'proyecto-1',
      idColectivo: 'colectivo-1',
      titulo: 'Proyecto solidario',
      descripcion: 'Descripción',
      estado: 'ACTIVO',
      busquedaAbierta: false,
      busquedaVigente: false,
      fechaLimiteBusqueda: null,
    });

    render(<DetalleProyecto />);

    fireEvent.click(await screen.findByRole('button', { name: 'Administrar' }));
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Configurar búsqueda' }));

    const fecha = screen.getByLabelText(
      'Fecha límite de la búsqueda (opcional)',
    );
    expect(fecha).toBeDisabled();
    expect(
      screen.getByText('Fecha límite de la búsqueda (opcional)', {
        selector: 'label',
      }),
    ).toHaveClass('MuiInputLabel-shrink');
  });

  it('a quien visita le muestra primero los perfiles para postularse', async () => {
    render(<DetalleProyecto />);

    const tabs = await screen.findAllByRole('tab');
    expect(tabs[0]).toHaveTextContent(/^Perfiles/);
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    expect(await screen.findByRole('button', { name: 'Postularme' })).toBeInTheDocument();
  });

  it('al colectivo dueño le ofrece cargar perfiles si no hay y agrupa la edición en Administrar', async () => {
    useAuth.mockReturnValue({
      sesion: { idColectivo: 'colectivo-1', rol: 'COLECTIVO' },
      getAccessToken: jest.fn().mockResolvedValue('token'),
      isAuthenticated: true,
      cargando: false,
    });
    obtenerPerfiles.mockResolvedValueOnce([]);
    render(<DetalleProyecto />);

    expect(await screen.findByRole('button', { name: 'Cargar perfiles' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Editar proyecto' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Administrar' }));
    const menu = await screen.findByRole('menu');
    expect(within(menu).getByRole('menuitem', { name: 'Editar datos del proyecto' })).toBeInTheDocument();
    expect(within(menu).getByRole('menuitem', { name: 'Configurar búsqueda' })).toBeInTheDocument();
  });

  it('le muestra a la colaboradora qué habilidades del perfil cumple y cuáles le faltan', async () => {
    obtenerPerfiles.mockResolvedValueOnce([
      {
        id: 'perfil-1',
        descripcion: 'Desarrollo web',
        habilidadesRequeridas: ['React', 'Node.js'],
        habilidadesOpcionales: ['Figma'],
        compromiso: { tipoCompromiso: 'MENSUALES', horas: 4, tipoColaboracion: 'GRATUITA' },
        limiteColaboraciones: null,
      },
    ]);
    obtenerMiPerfilColaboradora.mockResolvedValue({ habilidades: ['react', 'Figma'] });

    render(<DetalleProyecto />);
    await irAPestana('Perfiles');

    expect(
      await screen.findByText('Tenés 1 de 2 habilidades requeridas y 1 de 1 opcionales.'),
    ).toBeInTheDocument();
    const react = screen.getByText('React').closest('li');
    expect(react).toHaveTextContent('Cumple');
    expect(screen.getByText('Node.js').closest('li')).toHaveTextContent('Falta');
  });

  it('marca las postulaciones pendientes con un número en la pestaña', async () => {
    useAuth.mockReturnValue({
      sesion: { idColectivo: 'colectivo-1', rol: 'COLECTIVO' },
      getAccessToken: jest.fn().mockResolvedValue('token'),
      isAuthenticated: true,
      cargando: false,
    });
    obtenerPostulaciones.mockResolvedValue([
      { id: 'p-1', idProyecto: 'proyecto-1', idPerfil: 'perfil-1', estado: 'PENDIENTE' },
      { id: 'p-2', idProyecto: 'proyecto-1', idPerfil: 'perfil-1', estado: 'PENDIENTE' },
    ]);

    render(<DetalleProyecto />);

    expect(await screen.findByRole('tab', { name: /Postulaciones.*2 pendientes/ })).toBeInTheDocument();
  });
});
