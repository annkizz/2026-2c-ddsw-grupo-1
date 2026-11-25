import { construirPayloadPerfil, validarLimiteColaboraciones } from './PerfilesProyecto';

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

  it('envía un límite requerido para llenar vacantes', () => {
    const payload = construirPayloadPerfil({
      ...formValido,
      tipoAceptacion: 'LLENAR_VACANTES',
      limiteColaboraciones: '3',
    });

    expect(payload.tipoAceptacion).toBe('LLENAR_VACANTES');
    expect(payload.limiteColaboraciones).toBe(3);
  });

  it('omite el límite para el modo sin límite', () => {
    const payload = construirPayloadPerfil({
      ...formValido,
      tipoAceptacion: 'SIN_LIMITE',
    });

    expect(payload.tipoAceptacion).toBe('SIN_LIMITE');
    expect(payload).not.toHaveProperty('limiteColaboraciones');
  });
});

describe('validarLimiteColaboraciones', () => {
  it('exige un límite entero positivo para llenar vacantes', () => {
    expect(validarLimiteColaboraciones({
      tipoAceptacion: 'LLENAR_VACANTES',
      limiteColaboraciones: '',
    })).toBe('Indicá un límite de colaboraciones de al menos 1 para usar esta opción.');
    expect(validarLimiteColaboraciones({
      tipoAceptacion: 'LLENAR_VACANTES',
      limiteColaboraciones: '1.5',
    })).toBe('Ingresá un número entero de al menos 1');
    expect(validarLimiteColaboraciones({
      tipoAceptacion: 'LLENAR_VACANTES',
      limiteColaboraciones: '0',
    })).toBe('Ingresá un número entero de al menos 1');
    expect(validarLimiteColaboraciones({
      tipoAceptacion: 'LLENAR_VACANTES',
      limiteColaboraciones: '1',
    })).toBe('');
  });

  it('permite límite opcional en modo manual y no lo valida sin límite', () => {
    expect(validarLimiteColaboraciones({
      tipoAceptacion: 'MANUAL',
      limiteColaboraciones: '',
    })).toBe('');
    expect(validarLimiteColaboraciones({
      tipoAceptacion: 'SIN_LIMITE',
      limiteColaboraciones: 'inválido',
    })).toBe('');
  });
});
