import React from 'react';
import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useAuth } from '../../hooks/useAuth.jsx';
import { useListado } from '../../hooks/useListado';
import {
  actualizarColaboradora,
  obtenerMiPerfilColaboradora,
} from '../../service/colaboradorasService';
import {
  actualizarColectivo,
  obtenerMiPerfilColectivo,
} from '../../service/colectivosService';
import MiPerfil from './MiPerfil';

jest.mock('../../hooks/useAuth.jsx', () => ({ useAuth: jest.fn() }));
jest.mock('../../hooks/useListado', () => ({ useListado: jest.fn() }));
jest.mock('react-router-dom', () => ({
  Link: ({ to, children, ...props }) =>
    require('react').createElement('a', { href: to, ...props }, children),
}));
jest.mock('../../service/colaboradorasService', () => ({
  actualizarColaboradora: jest.fn(),
  obtenerMiPerfilColaboradora: jest.fn(),
  TIPOS_CONTACTO: [
    { valor: 'EMAIL', texto: 'Email' },
    { valor: 'WHATSAPP', texto: 'WhatsApp' },
    { valor: 'SMS', texto: 'SMS' },
  ],
}));
jest.mock('../../service/colectivosService', () => ({
  actualizarColectivo: jest.fn(),
  obtenerMiPerfilColectivo: jest.fn(),
  TIPOS_COLECTIVO: [{ valor: 'ONG', texto: 'ONG' }],
}));

const perfilValido = {
  nombreFantasia: 'Cande Dev',
  habilidades: ['Desarrollo'],
  mediosDeContacto: [],
};

const renderPerfil = () => render(<MiPerfil />);

describe('MiPerfil', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue({
      sesion: { rol: 'COLABORADOR', idColaborador: 'colaborador-1' },
      getAccessToken: jest.fn().mockResolvedValue('token'),
      obtenerEmailCuenta: jest.fn().mockResolvedValue('cande@example.org'),
      cambiarContrasena: jest.fn(),
    });
    useListado.mockReturnValue({
      datos: [{ titulo: 'Desarrollo' }],
      cargando: false,
      error: null,
      recargar: jest.fn(),
    });
    obtenerMiPerfilColaboradora.mockResolvedValue(perfilValido);
    actualizarColaboradora.mockResolvedValue({});
  });

  it('mantiene reconocible la sección activa en la navegación', async () => {
    renderPerfil();

    expect(await screen.findByRole('button', { name: 'Cuenta' }))
      .toHaveAttribute('aria-current', 'location');
    // Solo se muestra la sección activa: el formulario ya no es una única página larga.
    expect(screen.queryByRole('textbox', { name: 'Nombre de fantasía (obligatorio)' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Perfil' }));

    expect(screen.getByRole('button', { name: 'Perfil' }))
      .toHaveAttribute('aria-current', 'location');
    expect(screen.getByRole('button', { name: 'Cuenta' }))
      .not.toHaveAttribute('aria-current');
    expect(screen.getByRole('textbox', { name: 'Nombre de fantasía (obligatorio)' })).toBeInTheDocument();
  });

  it('también segmenta el perfil del colectivo con navegación lateral', async () => {
    useAuth.mockReturnValue({
      sesion: { rol: 'COLECTIVO', idColectivo: 'colectivo-1' },
      getAccessToken: jest.fn().mockResolvedValue('token'),
      obtenerEmailCuenta: jest.fn().mockResolvedValue('colectivo@example.org'),
      cambiarContrasena: jest.fn(),
    });
    useListado.mockReturnValue({ datos: [], cargando: false, error: null, recargar: jest.fn() });
    obtenerMiPerfilColectivo.mockResolvedValue({
      nombre: 'Colectivo Ejemplo',
      descripcion: 'Descripción',
      tipoDeColectivo: 'ONG',
      etiquetas: [],
      mediosDeContacto: [],
    });

    renderPerfil();

    expect(await screen.findByRole('heading', { name: 'Tu perfil de colectivo' }))
      .toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Secciones de mi perfil' }))
      .toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Áreas de trabajo' })).toBeInTheDocument();
  });

  it('muestra errores resumidos y junto a cada campo inválido', async () => {
    obtenerMiPerfilColaboradora.mockResolvedValue({
      nombreFantasia: '',
      habilidades: [],
      mediosDeContacto: [{ tipoDeContacto: 'WHATSAPP', contacto: '123' }],
    });
    useAuth.mockReturnValue({
      sesion: { rol: 'COLABORADOR', idColaborador: 'colaborador-1' },
      getAccessToken: jest.fn().mockResolvedValue('token'),
      obtenerEmailCuenta: jest.fn().mockResolvedValue('cande@example.org'),
      cambiarContrasena: jest.fn(),
    });

    renderPerfil();

    fireEvent.click(await screen.findByRole('button', { name: 'Guardar cambios' }));

    expect(await screen.findByText('Revisá 3 campos')).toBeInTheDocument();
    // Se abre la sección del primer error; el resto queda enlazado en el resumen y marcado en la navegación.
    expect(screen.getByText('El nombre de fantasía es obligatorio.')).toBeInTheDocument();
    expect(screen.getByText(/Elegí al menos una habilidad\./)).toBeInTheDocument();
    expect(screen.getAllByText(/Ingresá un número válido/)).not.toHaveLength(0);
    expect(screen.getByRole('button', { name: /Habilidades 1 campo para revisar/ })).toBeInTheDocument();
    expect(actualizarColaboradora).not.toHaveBeenCalled();
  });

  it('valida los campos obligatorios del perfil de colectivo', async () => {
    useAuth.mockReturnValue({
      sesion: { rol: 'COLECTIVO', idColectivo: 'colectivo-1' },
      getAccessToken: jest.fn().mockResolvedValue('token'),
      obtenerEmailCuenta: jest.fn().mockResolvedValue('colectivo@example.org'),
      cambiarContrasena: jest.fn(),
    });
    useListado.mockReturnValue({ datos: [], cargando: false, error: null, recargar: jest.fn() });
    obtenerMiPerfilColectivo.mockResolvedValue({
      nombre: '',
      descripcion: '',
      tipoDeColectivo: '',
      etiquetas: [],
      mediosDeContacto: [],
    });

    renderPerfil();

    fireEvent.click(await screen.findByRole('button', { name: 'Guardar cambios' }));

    expect(await screen.findByText('Revisá 3 campos')).toBeInTheDocument();
    expect(screen.getByText('El nombre del colectivo es obligatorio.')).toBeInTheDocument();
    expect(screen.getByText('Elegí el tipo de colectivo.')).toBeInTheDocument();
    expect(screen.getByText('La descripción es obligatoria.')).toBeInTheDocument();
    expect(actualizarColectivo).not.toHaveBeenCalled();
  });

  it('confirma antes de descartar cambios sin guardar', async () => {
    renderPerfil();

    fireEvent.click(await screen.findByRole('button', { name: 'Perfil' }));
    const nombre = await screen.findByRole('textbox', { name: 'Nombre de fantasía (obligatorio)' });
    fireEvent.change(nombre, { target: { value: 'Nombre sin guardar' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(await screen.findByText('¿Descartar los cambios?')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Seguir editando' }));
    expect(nombre).toHaveValue('Nombre sin guardar');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Descartar cambios' }));
    await waitFor(() => expect(nombre).toHaveValue('Cande Dev'));
  });

  it('muestra el estado de guardado y la confirmación para una colaboradora', async () => {
    renderPerfil();

    fireEvent.click(await screen.findByRole('button', { name: 'Guardar cambios' }));

    expect(await screen.findByText('Guardando…')).toBeInTheDocument();
    const mensaje = await screen.findByRole('status');
    expect(mensaje).toHaveTextContent('Los cambios ya fueron aplicados.');
    expect(mensaje.querySelector('svg')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Guardar cambios' })).toBeEnabled();
    expect(actualizarColaboradora).toHaveBeenCalledWith(
      'token',
      'colaborador-1',
      expect.objectContaining({ nombreFantasia: 'Cande Dev', habilidades: ['Desarrollo'] }),
    );
  });

  it('muestra el estado de guardado y la confirmación para un colectivo', async () => {
    useAuth.mockReturnValue({
      sesion: { rol: 'COLECTIVO', idColectivo: 'colectivo-1' },
      getAccessToken: jest.fn().mockResolvedValue('token'),
      obtenerEmailCuenta: jest.fn().mockResolvedValue('colectivo@example.org'),
      cambiarContrasena: jest.fn(),
    });
    useListado.mockReturnValue({ datos: [], cargando: false, error: null, recargar: jest.fn() });
    obtenerMiPerfilColectivo.mockResolvedValue({
      nombre: 'Colectivo Ejemplo',
      descripcion: 'Descripción',
      tipoDeColectivo: 'ONG',
      etiquetas: [],
      mediosDeContacto: [],
    });
    actualizarColectivo.mockResolvedValue({});

    renderPerfil();

    fireEvent.click(await screen.findByRole('button', { name: 'Guardar cambios' }));

    expect(await screen.findByText('Guardando…')).toBeInTheDocument();
    const mensaje = await screen.findByRole('status');
    expect(mensaje).toHaveTextContent('Los cambios ya fueron aplicados.');
    expect(mensaje.querySelector('svg')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Guardar cambios' })).toBeEnabled();
    expect(actualizarColectivo).toHaveBeenCalled();
  });

  it('muestra el error del servidor si no se pudieron guardar los cambios', async () => {
    actualizarColaboradora.mockRejectedValue({
      response: { data: { error: 'Error de servidor' } },
    });

    renderPerfil();

    fireEvent.click(await screen.findByRole('button', { name: 'Guardar cambios' }));

    expect(
      await screen.findByText('No pudimos guardar los cambios: Error de servidor'),
    ).toBeInTheDocument();
  });
});
