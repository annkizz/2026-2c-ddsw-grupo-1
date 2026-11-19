import React, { createContext, useCallback, useContext, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { tokensDelModo } from '../designTokens.js';
import { t } from '../i18n/t';

import PropTypes from 'prop-types';
export const CLAVE_MODO_COLOR = 'modo-color';
export const MODOS = { normal: 'normal', daltonico: 'daltonico' };

// La lectura es síncrona y corre antes del primer render (inicializador de useState),
// así la app nunca pinta primero con la paleta equivocada.
export const leerModoGuardado = () => {
  try {
    return window.localStorage.getItem(CLAVE_MODO_COLOR) === MODOS.daltonico ? MODOS.daltonico : MODOS.normal;
  } catch {
    return MODOS.normal;
  }
};

const guardarModo = (modo) => {
  try {
    window.localStorage.setItem(CLAVE_MODO_COLOR, modo);
  } catch {
    // Sin almacenamiento disponible (modo privado o bloqueado): el modo vale solo para esta visita.
  }
};

const aplicarAtributo = (modo) => {
  if (typeof document === 'undefined') return;
  if (modo === MODOS.daltonico) {
    document.documentElement.setAttribute('data-modo-color', MODOS.daltonico);
  } else {
    document.documentElement.removeAttribute('data-modo-color');
  }
};

// Valor por defecto para componentes que se renderizan sin provider (por ejemplo en tests aislados).
const valorSinProvider = {
  modo: MODOS.normal,
  esDaltonico: false,
  tokens: tokensDelModo(MODOS.normal),
  alternarModo: () => {},
  setModo: () => {}
};

const ModoColorContext = createContext(valorSinProvider);

export const ModoColorProvider = ({ children }) => {
  const [modo, setModoEstado] = useState(leerModoGuardado);
  const [anuncio, setAnuncio] = useState('');
  const primeraVez = useRef(true);

  useLayoutEffect(() => {
    aplicarAtributo(modo);
    if (primeraVez.current) {
      primeraVez.current = false;
      return;
    }
    guardarModo(modo);
    setAnuncio(t(modo === MODOS.daltonico ? 'modoColor.anuncioActivado' : 'modoColor.anuncioDesactivado'));
  }, [modo]);

  const setModo = useCallback((nuevo) => setModoEstado(nuevo === MODOS.daltonico ? MODOS.daltonico : MODOS.normal), []);
  const alternarModo = useCallback(
    () => setModoEstado((actual) => (actual === MODOS.daltonico ? MODOS.normal : MODOS.daltonico)),
    []
  );

  const valor = useMemo(
    () => ({ modo, esDaltonico: modo === MODOS.daltonico, tokens: tokensDelModo(modo), alternarModo, setModo }),
    [modo, alternarModo, setModo]
  );

  return (
    <ModoColorContext.Provider value={valor}>
      {children}
      <div className="visualmente-oculto" aria-live="polite" role="status" data-testid="anuncio-modo-color">
        {anuncio}
      </div>
    </ModoColorContext.Provider>
  );
};

export const useModoColor = () => useContext(ModoColorContext);

ModoColorProvider.propTypes = { children: PropTypes.node };
