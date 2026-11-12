import axios from "axios";

const apiClient = axios.create({
  baseURL: (
    process.env.REACT_APP_API_URL || "http://localhost:3000"
  ).replace(/\/$/, ""),
  headers: { "Content-Type": "application/json" },
});

export async function obtenerProyectos(signal) {
  const response = await apiClient.get("/proyectos", { signal });
  return response.data;
}

export async function obtenerColectivos(signal) {
  const response = await apiClient.get("/colectivos", { signal });
  return response.data;
}

export async function crearProyecto(project) {
  const response = await apiClient.post("/proyectos", project);
  return response.data;
}

export async function cerrarProyecto(projectId) {
  const response = await apiClient.patch(
    `/proyectos/${encodeURIComponent(projectId)}/cierre`,
  );
  return response.data;
}
