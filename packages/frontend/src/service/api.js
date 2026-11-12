import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL
});

// El backend pide "Authorization: Bearer <token>" en todo lo que modifica datos
export const conToken = (token) => ({
  headers: { Authorization: `Bearer ${token}` }
});

// El backend responde { error, codigo, timestamp }
export const mensajeDeError = (error) =>
  error.response?.data?.error ?? 'No pudimos conectarnos con el servidor';

export default api;
