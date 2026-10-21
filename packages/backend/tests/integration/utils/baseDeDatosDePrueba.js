import { webcrypto } from "node:crypto";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

globalThis.crypto ??= webcrypto;

// Base de datos para pruebas de integracion
// levanta mongo embebido real (in memory) (sindocker)
//Si existe MONGODB_URI_TEST se usa esa
//base solo de test porque se limpian conexiones

let servidor = null;

export async function conectarALaBaseDePrueba() {
  const uri =
    process.env.MONGODB_URI_TEST ?? (await levantarServidor()).getUri();
    //si seteas MONGODB_URI_TEST dedicada sino embebida
  await mongoose.connect(uri);
  await limpiarLaBase();
}

async function levantarServidor() {
  servidor = await MongoMemoryServer.create();
  return servidor;
}

export async function limpiarLaBase() {
  const colecciones = await mongoose.connection.db.collections();
  for (const coleccion of colecciones) {
    if (coleccion.collectionName.startsWith("system.")) continue;
    await coleccion.deleteMany({});
  }
}

export async function desconectarDeLaBaseDePrueba() {
  await mongoose.disconnect();
  if (servidor) {
    await servidor.stop();
    servidor = null;
  }
}
