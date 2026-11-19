import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://127.0.0.1:3001'
});

// El backend pide "Authorization: Bearer <token>" en todo lo que modifica datos
export const conToken = (token) => ({
  headers: { Authorization: `Bearer ${token}` }
});

// El backend responde { error, codigo, timestamp }
export const mensajeDeError = (error) =>
  error.response?.data?.error ?? 'No pudimos conectarnos con el servidor';

export const codigoDeError = (error) => error.response?.data?.codigo

export default api;
