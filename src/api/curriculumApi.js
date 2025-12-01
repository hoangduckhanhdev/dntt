// src/api/curriculumApi.js
import axios from "axios";
import { API_URL } from "./config";
// API_URL = `${API_BASE}/api`
// → Local:  http://localhost:5000/api
// → Render: https://hkcode.onrender.com/api

// Base chung cho course
const BASE = `${API_URL}/courses`;

export const getCourse = (id) => axios.get(`${BASE}/${id}`);

export const updateCurriculum = (id, payload) =>
  axios.put(`${BASE}/${id}/curriculum`, payload);
