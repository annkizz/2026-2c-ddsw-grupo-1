import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { parsearBloques, parsearEnLinea } from '../../utils/markdown';
import { t } from '../../i18n/t';
import './Markdown.css';

// Dibuja el árbol de utils/markdown.js con elementos de React (sin dangerouslySetInnerHTML).

const renderEnLinea = (nodos, prefijo = 'n') =>
  nodos.map((nodo, indice) => {
    const clave = `${prefijo}-${indice}`;
    switch (nodo.tipo) {
      case 'texto':
        return <React.Fragment key={clave}>{nodo.valor}</React.Fragment>;
      case 'salto':
        return <br key={clave} />;
      case 'negrita':
        return <strong key={clave}>{renderEnLinea(nodo.hijos, clave)}</strong>;
      case 'cursiva':
        return <em key={clave}>{renderEnLinea(nodo.hijos, clave)}</em>;
      case 'tachado':
        return <del key={clave}>{renderEnLinea(nodo.hijos, clave)}</del>;
      case 'codigo':
        return <code key={clave}>{nodo.valor}</code>;
      case 'enlace': {
        const externo = /^https?:/i.test(nodo.url);
        return (
          <a
            key={clave}
            href={nodo.url}
            {...(externo ? { target: '_blank', rel: 'noopener noreferrer nofollow' } : {})}
          >
            {renderEnLinea(nodo.hijos, clave)}
            {externo && <span className="visualmente-oculto"> {t('markdown.nuevaPestana')}</span>}
          </a>
        );
      }
      default:
        return null;
    }
  });

// Los títulos del texto se "corren" para no romper la jerarquía de la página:
// un # dentro de una descripción nunca es un <h1>.
const nivelTitulo = (nivel, nivelBase) => `h${Math.min(6, nivelBase + nivel - 1)}`;

const renderBloques = (bloques, nivelBase, prefijo = 'b') =>
  bloques.map((bloque, indice) => {
    const clave = `${prefijo}-${indice}`;
    switch (bloque.tipo) {
      case 'parrafo':
        return <p key={clave}>{renderEnLinea(bloque.hijos, clave)}</p>;
      case 'titulo': {
        const Etiqueta = nivelTitulo(bloque.nivel, nivelBase);
        return (
          <Etiqueta key={clave} className={`markdown__titulo markdown__titulo--${bloque.nivel}`}>
            {renderEnLinea(bloque.hijos, clave)}
          </Etiqueta>
        );
      }
      case 'lista': {
        const Lista = bloque.ordenada ? 'ol' : 'ul';
        return (
          <Lista key={clave} start={bloque.ordenada && bloque.inicio !== 1 ? bloque.inicio : undefined}>
            {bloque.items.map((item, indiceItem) => {
              const claveItem = `${clave}-${indiceItem}`;
              // Ítem simple (una sola línea de texto): sin <p> adentro, para que la lista quede compacta.
              const simple = item.bloques.length === 1 && item.bloques[0].tipo === 'parrafo';
              return (
                <li key={claveItem}>
                  {simple
                    ? renderEnLinea(item.bloques[0].hijos, claveItem)
                    : renderBloques(item.bloques, nivelBase, claveItem)}
                </li>
              );
            })}
          </Lista>
        );
      }
      case 'cita':
        return <blockquote key={clave}>{renderBloques(bloque.bloques, nivelBase, clave)}</blockquote>;
      case 'bloqueCodigo':
        return (
          <pre key={clave} tabIndex={0} aria-label={t('markdown.bloqueCodigo')}>
            <code>{bloque.valor}</code>
          </pre>
        );
      case 'separador':
        return <hr key={clave} />;
      default:
        return null;
    }
  });

const Markdown = ({ texto, nivelTitulo: nivelBase = 3, className = '' }) => {
  const bloques = useMemo(() => parsearBloques(texto), [texto]);
  if (!texto || !String(texto).trim()) return null;
  return <div className={`markdown ${className}`.trim()}>{renderBloques(bloques, nivelBase)}</div>;
};

Markdown.propTypes = {
  texto: PropTypes.string,
  // Nivel de <h…> que corresponde a un "#" del texto (por defecto h3).
  nivelTitulo: PropTypes.number,
  className: PropTypes.string,
};

// Para textos de una sola línea (por ejemplo, el nombre de un perfil buscado): solo formato en línea.
export const MarkdownEnLinea = ({ texto }) => {
  const nodos = useMemo(() => parsearEnLinea(String(texto ?? '').replace(/\s*\n\s*/g, ' ')), [texto]);
  return <>{renderEnLinea(nodos)}</>;
};

MarkdownEnLinea.propTypes = {
  texto: PropTypes.string,
};

export default Markdown;
