import { construirPayloadPerfil } from './PerfilesProyecto';

jest.mock('../../hooks/useAuth.jsx', () => ({
  useAuth: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  Link: () => null,
  useParams: () => ({ id: 'proyecto-1' }),
}));

describe('construirPayloadPerfil', () => {
  const formValido = {
    descripcion: 'Desarrollador Web Junior',
    habilidadesRequeridas: ['Python', 'Accesibilidad web'],
    habilidadesOpcionales: ['Diseño UX/UI'],
    tipoCompromiso: 'MENSUALES',
    horas: '4',
    tipoColaboracion: 'GRATUITA',
    limiteColaboraciones: '1',
    tipoAceptacion: 'MANUAL',
  };

  it('incluye la aceptación manual y convierte el cupo a número', () => {
    expect(construirPayloadPerfil(formValido)).toEqual({
      descripcion: 'Desarrollador Web Junior',
      habilidadesRequeridas: ['Python', 'Accesibilidad web'],
      habilidadesOpcionales: ['Diseño UX/UI'],
      compromiso: {
        tipoCompromiso: 'MENSUALES',
        horas: 4,
        tipoColaboracion: 'GRATUITA',
      },
      tipoAceptacion: 'MANUAL',
      limiteColaboraciones: 1,
    });
  });

  it('omite el límite cuando se deja vacío', () => {
    const payload = construirPayloadPerfil({
      ...formValido,
      limiteColaboraciones: '',
    });

    expect(payload).not.toHaveProperty('limiteColaboraciones');
    expect(payload.tipoAceptacion).toBe('MANUAL');
  });
});
