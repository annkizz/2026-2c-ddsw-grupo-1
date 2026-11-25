import fs from 'fs';
import path from 'path';
import { tokensBase } from './designTokens';

// Verificación automática de la paleta para daltonismo (WCAG 1.4.1, 1.4.3 y 1.4.11).
//
// 1. Contraste: texto normal >= 4.5:1, componentes de interfaz >= 3:1 (WCAG 2.x, nivel AA).
// 2. Daltonismo: se simula cómo ve cada color una persona con protanopía, deuteranopía y
//    tritanopía (matrices de Machado, Oliveira y Fernandes, 2009, severidad máxima) y se mide la
//    diferencia percibida con ΔE en CIELab, la misma medida que usan Sajek, Korotenko y Kyrychok
//    (2025), "Research on the Accessibility of Different Colour Schemes for Web Resources for
//    People with Colour Blindness", J. Imaging 11(8):268.
// 3. "No solo color": los botones de acciones peligrosas llevan ícono. Para deuteranopía el rojo
//    de error y el naranja de las acciones principales casi no se distinguen (ΔE ≈ 8), así que el
//    ícono es lo que los separa visualmente, además del texto.

const color = (nombre) => tokensBase[`--color-${nombre}`];

const aLineal = (canal) => {
  const c = canal / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};

const rgbLineal = (hex) => [1, 3, 5].map((i) => aLineal(Number.parseInt(hex.slice(i, i + 2), 16)));

const luminancia = (hex) => {
  const [r, g, b] = rgbLineal(hex);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const contraste = (a, b) => {
  const [claro, oscuro] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (claro + 0.05) / (oscuro + 0.05);
};

const MATRICES = {
  normal: [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1]
  ],
  protanopia: [
    [0.152286, 1.052583, -0.204868],
    [0.114503, 0.786281, 0.099216],
    [-0.003882, -0.048116, 1.051998]
  ],
  deuteranopia: [
    [0.367322, 0.860646, -0.227968],
    [0.280085, 0.672501, 0.047413],
    [-0.01182, 0.04294, 0.968881]
  ],
  tritanopia: [
    [1.255528, -0.076749, -0.178779],
    [-0.078411, 0.930809, 0.147602],
    [0.004733, 0.691367, 0.3039]
  ]
};

const simular = (hex, matriz) => {
  const rgb = rgbLineal(hex);
  return matriz.map((fila) => Math.min(1, Math.max(0, fila.reduce((suma, k, j) => suma + k * rgb[j], 0))));
};

const aLab = ([r, g, b]) => {
  const x = (0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047;
  const y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const z = (0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883;
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))];
};

const deltaE = (a, b, matriz) => {
  const labA = aLab(simular(a, matriz));
  const labB = aLab(simular(b, matriz));
  return Math.hypot(...labA.map((v, i) => v - labB[i]));
};

describe('Contraste de la paleta (WCAG 2.x, nivel AA)', () => {
  // [texto, fondo]: texto normal, mínimo 4.5:1 (1.4.3)
  const texto = [
    ['text', 'surface'],
    ['text', 'background'],
    ['muted', 'surface'],
    ['muted', 'background'],
    ['muted', 'surface-alt'],
    ['on-brand', 'brand'],
    ['on-brand-muted', 'brand'],
    ['on-brand-muted', 'brand-2'],
    ['on-primary', 'primary'],
    ['on-primary', 'primary-hover'],
    ['primary', 'surface'],
    ['primary', 'background'],
    ['primary', 'primary-tint'],
    ['text', 'primary-tint-strong'],
    ['on-secondary', 'secondary'],
    ['on-secondary', 'secondary-hover'],
    ['secondary', 'surface'],
    ['secondary', 'background'],
    ['secondary', 'secondary-tint'],
    ['text', 'secondary-tint-strong'],
    ['on-accent', 'accent'],
    ['success', 'surface'],
    ['success', 'success-tint'],
    ['on-success', 'success'],
    ['error', 'surface'],
    ['error', 'error-tint'],
    ['on-error', 'error'],
    ['warning', 'surface'],
    ['warning', 'warning-tint'],
    ['on-warning', 'warning'],
    ['info', 'info-tint']
    // Los números del mapa no van acá: llevan un halo blanco (.mapa__numero), así que se leen
    // como texto oscuro sobre blanco en cualquier nivel de relleno.
  ];

  it.each(texto)('texto %s sobre %s llega a 4.5:1', (frente, fondo) => {
    expect(contraste(color(frente), color(fondo))).toBeGreaterThanOrEqual(4.5);
  });

  // [componente, fondo]: bordes de campos, foco, indicadores, barra de progreso; mínimo 3:1 (1.4.11)
  const componentes = [
    ['border', 'surface'],
    ['border', 'background'],
    ['focus', 'surface'],
    ['focus', 'background'],
    ['focus-on-dark', 'brand'],
    ['accent', 'brand'],
    ['accent', 'brand-2'],
    ['secondary', 'surface'],
    ['primary', 'primary-tint-strong'],
    ['map-stroke', 'surface']
  ];

  it.each(componentes)('componente %s sobre %s llega a 3:1', (frente, fondo) => {
    expect(contraste(color(frente), color(fondo))).toBeGreaterThanOrEqual(3);
  });
});

describe('Paleta azul + naranja con daltonismo (ΔE en CIELab, como en Sajek et al., 2025)', () => {
  const tipos = Object.keys(MATRICES);

  it.each(tipos)('azul primario y naranja complementario se distinguen con claridad (%s)', (tipo) => {
    // ΔE > 40 es una diferencia enorme: son dos colores que nadie confunde.
    expect(deltaE(color('primary'), color('secondary'), MATRICES[tipo])).toBeGreaterThan(40);
    expect(deltaE(color('primary'), color('accent'), MATRICES[tipo])).toBeGreaterThan(40);
  });

  it.each(tipos)('los niveles del mapa se distinguen entre sí (%s)', (tipo) => {
    // Escala de un solo tono: se lee por claridad, que el daltonismo casi no altera.
    const niveles = ['map-empty', 'map-1', 'map-2', 'map-3', 'map-4', 'map-5'];
    niveles.slice(1).forEach((nivel, i) => {
      expect(deltaE(color(niveles[i]), color(nivel), MATRICES[tipo])).toBeGreaterThan(10);
    });
  });

  it('documenta el par que sí se confunde: rojo de error y naranja de acción (deuteranopía)', () => {
    // Por eso las acciones peligrosas llevan ícono además del texto (ver el test siguiente)
    // y los estados de error usan ícono + mensaje, nunca solo el color.
    expect(deltaE(color('error'), color('secondary'), MATRICES.deuteranopia)).toBeLessThan(15);
  });
});

describe('No depender solo del color (WCAG 1.4.1)', () => {
  const leerJsx = (directorio) =>
    fs.readdirSync(directorio, { withFileTypes: true }).flatMap((entrada) => {
      const ruta = path.join(directorio, entrada.name);
      if (entrada.isDirectory()) return leerJsx(ruta);
      return entrada.name.endsWith('.jsx') && !entrada.name.includes('.test.') ? [ruta] : [];
    });

  // Devuelve el texto de la etiqueta de apertura <Button ...>, respetando llaves y comillas.
  const etiquetasButton = (codigo) => {
    const etiquetas = [];
    let desde = codigo.indexOf('<Button');
    while (desde !== -1) {
      let profundidad = 0;
      let i = desde + '<Button'.length;
      for (; i < codigo.length; i += 1) {
        const c = codigo[i];
        if (c === '{') profundidad += 1;
        else if (c === '}') profundidad -= 1;
        else if (c === '>' && profundidad === 0) break;
      }
      etiquetas.push(codigo.slice(desde, i + 1));
      desde = codigo.indexOf('<Button', i);
    }
    return etiquetas;
  };

  it('todo botón de acción peligrosa (color="error") tiene ícono además del texto', () => {
    const sinIcono = leerJsx(__dirname).flatMap((archivo) =>
      etiquetasButton(fs.readFileSync(archivo, 'utf8'))
        .filter((etiqueta) => /color="error"/.test(etiqueta) && !/(startIcon|endIcon)=/.test(etiqueta))
        .map(() => path.relative(__dirname, archivo))
    );
    expect(sinIcono).toEqual([]);
  });

  it('el ChipEstado asigna un ícono a cada estado', () => {
    const codigo = fs.readFileSync(path.join(__dirname, 'components/ChipEstado/ChipEstado.jsx'), 'utf8');
    const estados = codigo.match(/^\s+[A-Z]+: \{[^}]*\}/gm) ?? [];
    expect(estados.length).toBeGreaterThan(0);
    estados.forEach((estado) => expect(estado).toMatch(/Icono: Fi\w+/));
  });
});
