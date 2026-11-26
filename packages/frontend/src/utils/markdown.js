// Soporte de Markdown para las descripciones (requerimiento 38 del TP).
//
// Convierte el texto en un árbol de nodos que después se dibuja con componentes de React
// (components/Markdown). Nunca se genera HTML a partir del texto: React escapa todo, así que
// cualquier <script> u otro HTML escrito por una persona se ve como texto (sin riesgo de XSS).
// Los enlaces solo se aceptan con http, https o mailto.
//
// Subconjunto soportado (el de uso habitual en GitHub):
//   Bloques: párrafos (un Enter = salto de línea), títulos #…######, listas con - * + y numeradas
//            (con sublistas por sangría), citas >, bloques de código ``` y separadores ---.
//   En línea: **negrita**, *cursiva* / _cursiva_, ~~tachado~~, `código`, [texto](https://…),
//            <https://…>, direcciones http(s) sueltas y \ para escapar un símbolo.

const PROFUNDIDAD_MAXIMA = 8;

const RE_CERCO = /^ {0,3}(`{3,}|~{3,})\s*([^`\s]*)\s*$/;
const RE_TITULO = /^ {0,3}(#{1,6})(?:\s+(.*?))?\s*#*\s*$/;
const RE_SEPARADOR = /^ {0,3}([-*_])(?:\s*\1){2,}\s*$/;
const RE_CITA = /^ {0,3}>\s?/;
const RE_ITEM = /^(\s*)([-*+]|\d{1,9}[.)])(?:\s+(.*)|\s*)$/;
const RE_URL_SUELTA = /^https?:\/\/[^\s<>]*[^\s<>.,:;"')\]!?]/i;
const PUNTUACION_ESCAPABLE = "\\`*_{}[]()#+-.!~>|<";

const sangria = (linea) => linea.match(/^\s*/)[0].length;
const enBlanco = (linea) => linea.trim() === "";
const esItem = (linea) => RE_ITEM.test(linea) && !RE_SEPARADOR.test(linea);

const iniciaBloque = (linea) =>
  RE_CERCO.test(linea) ||
  RE_TITULO.test(linea) ||
  RE_SEPARADOR.test(linea) ||
  RE_CITA.test(linea) ||
  esItem(linea);

// Solo se permiten esquemas seguros. Devuelve la URL normalizada o null.
export const urlSegura = (url) => {
  const limpia = (url ?? "").trim();
  if (/^(https?:\/\/|mailto:)/i.test(limpia) && !/[\s<>"]/.test(limpia))
    return limpia;
  return null;
};

// ---------- En línea ----------

const nodoTexto = (valor) => ({ tipo: "texto", valor });

const agregarTexto = (nodos, valor) => {
  if (!valor) return;
  const ultimo = nodos[nodos.length - 1];
  if (ultimo?.tipo === "texto") ultimo.valor += valor;
  else nodos.push(nodoTexto(valor));
};

const esAlfanumerico = (caracter) => /[\p{L}\p{N}]/u.test(caracter ?? "");

// Busca el cierre de un delimitador (**, *, __, _, ~~) que no esté pegado a un espacio.
const buscarCierre = (texto, delimitador, desde) => {
  let indice = texto.indexOf(delimitador, desde);
  while (indice !== -1) {
    const anterior = texto[indice - 1];
    const siguiente = texto[indice + delimitador.length];
    const pegadoAEspacio = /\s/.test(anterior ?? " ");
    // Un * simple no puede cerrar dentro de un ** (y lo mismo con _).
    const parteDeDoble =
      delimitador.length === 1 &&
      (siguiente === delimitador || anterior === delimitador);
    const intrapalabra = delimitador[0] === "_" && esAlfanumerico(siguiente);
    if (!pegadoAEspacio && !parteDeDoble && !intrapalabra && indice > desde)
      return indice;
    indice = texto.indexOf(delimitador, indice + 1);
  }
  return -1;
};

export const parsearEnLinea = (texto, profundidad = 0) => {
  const nodos = [];
  if (!texto) return nodos;
  if (profundidad > PROFUNDIDAD_MAXIMA) {
    agregarTexto(nodos, texto);
    return nodos;
  }
  let i = 0;
  while (i < texto.length) {
    const resto = texto.slice(i);
    const caracter = texto[i];

    // \* \_ … : el símbolo se muestra tal cual
    if (
      caracter === "\\" &&
      PUNTUACION_ESCAPABLE.includes(texto[i + 1] ?? "")
    ) {
      agregarTexto(nodos, texto[i + 1]);
      i += 2;
      continue;
    }

    // `código`
    if (caracter === "`") {
      const tirada = resto.match(/^`+/)[0];
      const cierre = texto.indexOf(tirada, i + tirada.length);
      if (cierre !== -1) {
        nodos.push({
          tipo: "codigo",
          valor: texto.slice(i + tirada.length, cierre).trim(),
        });
        i = cierre + tirada.length;
        continue;
      }
      agregarTexto(nodos, tirada);
      i += tirada.length;
      continue;
    }

    // [texto](url)
    if (caracter === "[") {
      const enlace = resto.match(
        /^\[([^\]]+)\]\(\s*([^\s)]+)(?:\s+"[^"]*")?\s*\)/,
      );
      if (enlace) {
        const url = urlSegura(enlace[2]);
        if (url)
          nodos.push({
            tipo: "enlace",
            url,
            hijos: parsearEnLinea(enlace[1], profundidad + 1),
          });
        else agregarTexto(nodos, enlace[1]); // esquema no permitido (javascript:, data:…): solo el texto
        i += enlace[0].length;
        continue;
      }
    }

    // <https://…>
    if (caracter === "<") {
      const automatico = resto.match(/^<((?:https?:\/\/|mailto:)[^\s<>]+)>/i);
      if (automatico) {
        const url = urlSegura(automatico[1]);
        nodos.push({
          tipo: "enlace",
          url,
          hijos: [nodoTexto(automatico[1].replace(/^mailto:/i, ""))],
        });
        i += automatico[0].length;
        continue;
      }
    }

    // https://… suelto (no pegado a una palabra)
    if (
      (caracter === "h" || caracter === "H") &&
      !esAlfanumerico(texto[i - 1])
    ) {
      const suelta = resto.match(RE_URL_SUELTA);
      if (suelta) {
        nodos.push({
          tipo: "enlace",
          url: suelta[0],
          hijos: [nodoTexto(suelta[0])],
        });
        i += suelta[0].length;
        continue;
      }
    }

    // **negrita** / __negrita__ / ~~tachado~~
    const doble = ["**", "__", "~~"].find((delimitador) =>
      resto.startsWith(delimitador),
    );
    if (
      doble &&
      texto[i + 2] &&
      !/\s/.test(texto[i + 2]) &&
      !(doble === "__" && esAlfanumerico(texto[i - 1]))
    ) {
      const cierre = buscarCierre(texto, doble, i + 2);
      if (cierre !== -1) {
        nodos.push({
          tipo: doble === "~~" ? "tachado" : "negrita",
          hijos: parsearEnLinea(texto.slice(i + 2, cierre), profundidad + 1),
        });
        i = cierre + 2;
        continue;
      }
    }

    // *cursiva* / _cursiva_
    if (
      (caracter === "*" || caracter === "_") &&
      texto[i + 1] &&
      !/\s/.test(texto[i + 1]) &&
      texto[i + 1] !== caracter &&
      !(caracter === "_" && esAlfanumerico(texto[i - 1]))
    ) {
      const cierre = buscarCierre(texto, caracter, i + 1);
      if (cierre !== -1) {
        nodos.push({
          tipo: "cursiva",
          hijos: parsearEnLinea(texto.slice(i + 1, cierre), profundidad + 1),
        });
        i = cierre + 1;
        continue;
      }
    }

    agregarTexto(nodos, caracter);
    i += 1;
  }
  return nodos;
};

// Párrafo: cada salto de línea simple se respeta (como en GitHub).
const parsearParrafo = (lineas) => {
  const hijos = [];
  lineas.forEach((linea, indice) => {
    if (indice > 0) hijos.push({ tipo: "salto" });
    hijos.push(...parsearEnLinea(linea.trim()));
  });
  return { tipo: "parrafo", hijos };
};

// ---------- Bloques ----------

const parsearLista = (lineas, inicio, profundidad) => {
  const primera = RE_ITEM.exec(lineas[inicio]);
  const sangriaBase = primera[1].length;
  const ordenada = /\d/.test(primera[2]);
  const items = [];
  let i = inicio;

  while (i < lineas.length) {
    const marca = esItem(lineas[i]) ? RE_ITEM.exec(lineas[i]) : null;
    if (
      !marca ||
      marca[1].length !== sangriaBase ||
      /\d/.test(marca[2]) !== ordenada
    )
      break;

    const anchoMarca = marca[1].length + marca[2].length + 1;
    const contenido = [marca[3] ?? ""];
    i += 1;

    while (i < lineas.length) {
      const linea = lineas[i];
      if (enBlanco(linea)) {
        let j = i + 1;
        while (j < lineas.length && enBlanco(lineas[j])) j += 1;
        if (j < lineas.length && sangria(lineas[j]) > sangriaBase) {
          contenido.push("");
          i += 1;
          continue;
        }
        break;
      }
      if (sangria(linea) > sangriaBase) {
        contenido.push(linea.slice(Math.min(sangria(linea), anchoMarca)));
        i += 1;
        continue;
      }
      if (iniciaBloque(linea)) break;
      contenido.push(linea.trim()); // continuación "perezosa" del mismo ítem
      i += 1;
    }

    items.push({
      bloques: parsearBloques(contenido.join("\n"), profundidad + 1),
    });

    // Líneas en blanco entre ítems de la misma lista
    let j = i;
    while (j < lineas.length && enBlanco(lineas[j])) j += 1;
    if (
      j > i &&
      j < lineas.length &&
      esItem(lineas[j]) &&
      RE_ITEM.exec(lineas[j])[1].length === sangriaBase
    )
      i = j;
  }

  return {
    bloque: {
      tipo: "lista",
      ordenada,
      inicio: ordenada ? Number.parseInt(primera[2], 10) : 1,
      items,
    },
    siguiente: i,
  };
};

export const parsearBloques = (texto, profundidad = 0) => {
  const lineas = String(texto ?? "")
    .replace(/\r\n?/g, "\n")
    .replace(/\t/g, "    ")
    .split("\n");
  const bloques = [];
  if (profundidad > PROFUNDIDAD_MAXIMA) {
    return [parsearParrafo(lineas.filter((linea) => !enBlanco(linea)))];
  }

  let i = 0;
  let parrafo = [];
  const cerrarParrafo = () => {
    if (parrafo.length) bloques.push(parsearParrafo(parrafo));
    parrafo = [];
  };

  while (i < lineas.length) {
    const linea = lineas[i];

    if (enBlanco(linea)) {
      cerrarParrafo();
      i += 1;
      continue;
    }

    const cerco = RE_CERCO.exec(linea);
    if (cerco) {
      cerrarParrafo();
      const codigo = [];
      i += 1;
      while (
        i < lineas.length &&
        !new RegExp(`^ {0,3}${cerco[1][0]}{${cerco[1].length},}\\s*$`).test(
          lineas[i],
        )
      ) {
        codigo.push(lineas[i]);
        i += 1;
      }
      i += 1; // salta el cierre (o el final del texto)
      bloques.push({
        tipo: "bloqueCodigo",
        valor: codigo.join("\n"),
        lenguaje: cerco[2] || null,
      });
      continue;
    }

    const titulo = RE_TITULO.exec(linea);
    if (titulo) {
      cerrarParrafo();
      bloques.push({
        tipo: "titulo",
        nivel: titulo[1].length,
        hijos: parsearEnLinea(titulo[2] ?? ""),
      });
      i += 1;
      continue;
    }

    if (RE_SEPARADOR.test(linea)) {
      cerrarParrafo();
      bloques.push({ tipo: "separador" });
      i += 1;
      continue;
    }

    if (RE_CITA.test(linea)) {
      cerrarParrafo();
      const cita = [];
      while (
        i < lineas.length &&
        !enBlanco(lineas[i]) &&
        (RE_CITA.test(lineas[i]) || cita.length)
      ) {
        if (!RE_CITA.test(lineas[i]) && iniciaBloque(lineas[i])) break;
        cita.push(lineas[i].replace(RE_CITA, ""));
        i += 1;
      }
      bloques.push({
        tipo: "cita",
        bloques: parsearBloques(cita.join("\n"), profundidad + 1),
      });
      continue;
    }

    if (esItem(linea)) {
      cerrarParrafo();
      const { bloque, siguiente } = parsearLista(lineas, i, profundidad);
      bloques.push(bloque);
      i = siguiente;
      continue;
    }

    parrafo.push(linea);
    i += 1;
  }
  cerrarParrafo();
  return bloques;
};

// ---------- Texto plano (tarjetas, listados, lectores de pantalla) ----------

const textoDeEnLinea = (nodos) =>
  nodos
    .map((nodo) => {
      if (nodo.tipo === "texto" || nodo.tipo === "codigo") return nodo.valor;
      if (nodo.tipo === "salto") return " ";
      return textoDeEnLinea(nodo.hijos ?? []);
    })
    .join("");

const textoDeBloques = (bloques) =>
  bloques
    .map((bloque) => {
      switch (bloque.tipo) {
        case "parrafo":
        case "titulo":
          return textoDeEnLinea(bloque.hijos);
        case "cita":
          return textoDeBloques(bloque.bloques);
        case "lista":
          return bloque.items
            .map((item) => textoDeBloques(item.bloques))
            .join(" · ");
        case "bloqueCodigo":
          return bloque.valor;
        default:
          return "";
      }
    })
    .filter(Boolean)
    .join(" ");

// Quita las marcas: "**Hola** _mundo_" -> "Hola mundo". Para vistas resumidas donde no va formato.
export const markdownATextoPlano = (texto) =>
  textoDeBloques(parsearBloques(texto)).replace(/\s+/g, " ").trim();

export const markdownEnLineaATextoPlano = (texto) =>
  textoDeEnLinea(parsearEnLinea(texto ?? "")).trim();
