import React, { useId, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Button, TextField } from '@mui/material';
import { FiBold, FiEye, FiEyeOff, FiItalic, FiLink, FiList } from 'react-icons/fi';
import Markdown, { MarkdownEnLinea } from '../Markdown/Markdown.jsx';
import { t } from '../../i18n/t';
import './CampoMarkdown.css';

// Campo de texto que admite Markdown (requerimiento 38). Se usa igual que un TextField de MUI
// (mismas props, onChange recibe un evento con target.value) y suma:
//  - botones para dar formato sin saber la sintaxis (negrita, cursiva, lista, enlace),
//  - vista previa con el mismo componente que se usa para mostrar la descripción,
//  - una ayuda desplegable con los formatos disponibles.
const CampoMarkdown = ({ enLinea = false, nivelTituloVistaPrevia = 3, ...propsCampo }) => {
  const idBase = useId();
  const idVistaPrevia = `${propsCampo.id ?? idBase}-vista-previa`;
  const campo = useRef(null);
  const [vistaPrevia, setVistaPrevia] = useState(false);
  const valor = propsCampo.value ?? '';
  const maximo = propsCampo.slotProps?.htmlInput?.maxLength;
  const deshabilitado = Boolean(propsCampo.disabled);

  const emitir = (nuevoValor, seleccionDesde, seleccionHasta) => {
    if (maximo && nuevoValor.length > maximo) return;
    const objetivo = { value: nuevoValor, name: propsCampo.name, id: propsCampo.id };
    propsCampo.onChange?.({ target: objetivo, currentTarget: objetivo });
    // Después de insertar, el foco vuelve al texto con la parte relevante seleccionada.
    window.requestAnimationFrame(() => {
      const elemento = campo.current;
      if (!elemento) return;
      elemento.focus();
      elemento.setSelectionRange?.(seleccionDesde, seleccionHasta);
    });
  };

  const seleccion = () => {
    const elemento = campo.current;
    const desde = elemento?.selectionStart ?? valor.length;
    const hasta = elemento?.selectionEnd ?? valor.length;
    return { desde, hasta, elegido: valor.slice(desde, hasta) };
  };

  const envolver = (marca, ejemplo) => {
    const { desde, hasta, elegido } = seleccion();
    const contenido = elegido || ejemplo;
    const nuevo = `${valor.slice(0, desde)}${marca}${contenido}${marca}${valor.slice(hasta)}`;
    emitir(nuevo, desde + marca.length, desde + marca.length + contenido.length);
  };

  const enlace = () => {
    const { desde, hasta, elegido } = seleccion();
    const texto = elegido || t('markdown.ejemploEnlace');
    const url = 'https://';
    const nuevo = `${valor.slice(0, desde)}[${texto}](${url})${valor.slice(hasta)}`;
    const inicioUrl = desde + texto.length + 3;
    emitir(nuevo, inicioUrl, inicioUrl + url.length);
  };

  const lista = () => {
    const { desde, hasta } = seleccion();
    const inicioLinea = valor.lastIndexOf('\n', desde - 1) + 1;
    const bloque = valor.slice(inicioLinea, hasta) || t('markdown.ejemploItem');
    const conViñetas = bloque
      .split('\n')
      .map((linea) => (/^\s*[-*+]\s/.test(linea) ? linea : `- ${linea}`))
      .join('\n');
    const separador = inicioLinea > 0 && valor[inicioLinea - 1] !== '\n' ? '\n' : '';
    const nuevo = `${valor.slice(0, inicioLinea)}${separador}${conViñetas}${valor.slice(Math.max(hasta, inicioLinea))}`;
    emitir(nuevo, inicioLinea + separador.length, inicioLinea + separador.length + conViñetas.length);
  };

  const botones = [
    { etiqueta: t('markdown.negrita'), icono: FiBold, accion: () => envolver('**', t('markdown.ejemploNegrita')) },
    { etiqueta: t('markdown.cursiva'), icono: FiItalic, accion: () => envolver('*', t('markdown.ejemploCursiva')) },
    ...(enLinea ? [] : [{ etiqueta: t('markdown.lista'), icono: FiList, accion: lista }]),
    { etiqueta: t('markdown.enlace'), icono: FiLink, accion: enlace },
  ];

  return (
    <div className="campo-markdown">
      <TextField {...propsCampo} inputRef={campo} />

      <div className="campo-markdown__barra" role="toolbar" aria-label={t('markdown.barra', { campo: propsCampo.label ?? '' })}>
        {botones.map(({ etiqueta, icono: Icono, accion }) => (
          <Button
            key={etiqueta}
            size="small"
            variant="text"
            type="button"
            onClick={accion}
            disabled={deshabilitado}
            startIcon={<Icono aria-hidden="true" />}
          >
            {etiqueta}
          </Button>
        ))}
        <span className="campo-markdown__separador" aria-hidden="true" />
        <Button
          size="small"
          variant={vistaPrevia ? 'contained' : 'outlined'}
          type="button"
          aria-expanded={vistaPrevia}
          aria-controls={idVistaPrevia}
          onClick={() => setVistaPrevia((abierta) => !abierta)}
          startIcon={vistaPrevia ? <FiEyeOff aria-hidden="true" /> : <FiEye aria-hidden="true" />}
        >
          {vistaPrevia ? t('markdown.ocultarVistaPrevia') : t('markdown.verVistaPrevia')}
        </Button>
      </div>

      <details className="campo-markdown__ayuda">
        <summary>{t('markdown.admite')}</summary>
        <ul>
          <li><code>**negrita**</code> → <strong>negrita</strong></li>
          <li><code>*cursiva*</code> → <em>cursiva</em></li>
          <li><code>[texto](https://…)</code> → {t('markdown.ayudaEnlace')}</li>
          {!enLinea && (
            <>
              <li><code>- ítem</code> {t('markdown.ayudaLista')}</li>
              <li><code>1. ítem</code> {t('markdown.ayudaNumerada')}</li>
              <li><code>## Título</code> {t('markdown.ayudaTitulo')}</li>
              <li><code>&gt; cita</code> {t('markdown.ayudaCita')}</li>
            </>
          )}
          <li><code>`código`</code> → <code>código</code></li>
        </ul>
      </details>

      {vistaPrevia && (
        <section id={idVistaPrevia} className="campo-markdown__vista-previa" aria-label={t('markdown.vistaPrevia')}>
          <p className="campo-markdown__vista-previa-titulo" aria-hidden="true">{t('markdown.vistaPrevia')}</p>
          {valor.trim() ? (
            enLinea ? (
              <p><MarkdownEnLinea texto={valor} /></p>
            ) : (
              <Markdown texto={valor} nivelTitulo={nivelTituloVistaPrevia} />
            )
          ) : (
            <p className="texto-secundario">{t('markdown.vistaPreviaVacia')}</p>
          )}
        </section>
      )}
    </div>
  );
};

CampoMarkdown.propTypes = {
  // Solo formato en línea (para textos de una línea, como el nombre de un perfil).
  enLinea: PropTypes.bool,
  nivelTituloVistaPrevia: PropTypes.number,
  id: PropTypes.string,
  name: PropTypes.string,
  label: PropTypes.node,
  value: PropTypes.string,
  onChange: PropTypes.func,
  disabled: PropTypes.bool,
  slotProps: PropTypes.object,
};

export default CampoMarkdown;
