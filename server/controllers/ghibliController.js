const axios = require('axios');

const GHIBLI_BASE = 'https://ghibliapi.vercel.app';

const getAllFilms = async (req, res) => {
  try {
    const { data } = await axios.get(`${GHIBLI_BASE}/films`);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getFilmById = async (req, res) => {
  try {
    const { id } = req.params;
    const { data } = await axios.get(`${GHIBLI_BASE}/films/${id}`);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAllPeople = async (req, res) => {
  try {
    const { data } = await axios.get(`${GHIBLI_BASE}/people`);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAllLocations = async (req, res) => {
  try {
    const { data } = await axios.get(`${GHIBLI_BASE}/locations`);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAllVehicles = async (req, res) => {
  try {
    const { data } = await axios.get(`${GHIBLI_BASE}/vehicles`);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAllSpecies = async (req, res) => {
  try {
    const { data } = await axios.get(`${GHIBLI_BASE}/species`);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllFilms,
  getFilmById,
  getAllPeople,
  getAllLocations,
  getAllVehicles,
  getAllSpecies,
};
