// authService.js

import axios from "axios";

// const API_URL = "https://backend-gfig.onrender.com";
const API_URL = "https://backend-gfig.onrender.com";

// Função auxiliar para pegar o token do localStorage
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token
    ? { Authorization: `Bearer ${token}` }
    : {};
};

export const authService = {
  post: async (endpoint, data) => {
    return axios.post(
      `${API_URL}/${endpoint}`,
      data,
      { headers: { ...getAuthHeaders() } }
    );
  },
  get: async (endpoint) => {
    return axios.get(
      `${API_URL}/${endpoint}`,
      { headers: { ...getAuthHeaders() } }
    );
  },
  put: async (endpoint, data) => {
    return axios.put(
      `${API_URL}/${endpoint}`,
      data,
      { headers: { ...getAuthHeaders() } }
    );
  },
  delete: async (endpoint, config = {}) => {
    // Garante que headers existam e adiciona o token
    const headers = { ...getAuthHeaders(), ...(config.headers || {}) };
    return axios.delete(
      `${API_URL}/${endpoint}`,
      { ...config, headers }
    );
  },
};
