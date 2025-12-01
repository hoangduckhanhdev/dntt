// src/api/curriculumApi.js
import axios from "axios";

const BASE = "http://localhost:5000/api/courses";

export const getCourse = (id) => axios.get(`${BASE}/${id}`);
export const updateCurriculum = (id, payload) =>
  axios.put(`${BASE}/${id}/curriculum`, payload);
