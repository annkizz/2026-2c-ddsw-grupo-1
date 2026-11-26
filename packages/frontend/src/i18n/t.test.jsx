import React, { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import es from '../assets/es.json';
import pt from '../assets/pt.json';
import gr from '../assets/gr.json';
import { cambiarIdioma, t, useIdioma } from './t';
import { formatearFecha } from '../utils/fechas';
import { crearTema } from '../theme/crearTema';
import { tokensBase } from '../designTokens';

afterEach(() => {
  cambiarIdioma('es');
  localStorage.clear();
});

it('conserva las claves y los parámetros del catálogo español', () => {
  const comprobar = (original, traducido) => {
    expect(Object.keys(traducido).sort()).toEqual(Object.keys(original).sort());
    Object.keys(original).forEach((clave) => {
      if (typeof original[clave] === 'string') {
        expect(typeof traducido[clave]).toBe('string');
        expect(traducido[clave].trim()).not.toBe('');
        expect((traducido[clave].match(/\{[^{}]+\}/g) || []).sort())
          .toEqual((original[clave].match(/\{[^{}]+\}/g) || []).sort());
      } else {
        comprobar(original[clave], traducido[clave]);
      }
    });
  };
  comprobar(es, pt);
  comprobar(es, gr);
});

it('actualiza las traducciones y fechas sin perder el estado de la pantalla', () => {
  const Pantalla = () => {
    const [texto, setTexto] = useState('');
    return (
      <>
        <p>{t('navegacion.miPerfil')}</p>
        <p>{formatearFecha('2026-03-15')}</p>
        <input aria-label="texto" value={texto} onChange={(evento) => setTexto(evento.target.value)} />
        <button onClick={() => cambiarIdioma('pt')}>Português</button>
      </>
    );
  };
  const Aplicacion = () => {
    useIdioma();
    return <Pantalla />;
  };
  render(<Aplicacion />);
  fireEvent.change(screen.getByRole('textbox', { name: 'texto' }), { target: { value: 'ejemplo' } });
  fireEvent.click(screen.getByRole('button', { name: 'Português' }));
  expect(screen.getByText('Meu perfil')).toBeInTheDocument();
  expect(screen.getByText('15 de março de 2026')).toBeInTheDocument();
  expect(screen.getByRole('textbox', { name: 'texto' })).toHaveValue('ejemplo');
});

it('recupera el idioma guardado al iniciar', () => {
  localStorage.setItem('idioma', 'pt');
  jest.isolateModules(() => {
    expect(require('./t').obtenerIdioma()).toBe('pt');
  });
});

it('permite traducir los textos predeterminados de Material UI', () => {
  const tema = crearTema(tokensBase, (clave) => t(clave, {}, 'pt'));
  expect(tema.components.MuiAutocomplete.defaultProps.noOptionsText).toBe(pt.componentesMui.sinOpciones);
  expect(tema.components.MuiAlert.defaultProps.closeText).toBe(pt.componentesMui.cerrar);
});

it('mantiene legible el resumen de búsqueda en portugués', () => {
  cambiarIdioma('pt');
  const resumen = t('buscadorProyectos.unResultado', { cantidad: 1 })
    + t('buscadorProyectos.coincidenciasHabilidades', { cantidad: 1 });
  expect(resumen).toContain('. 1 correspondem');
});
