const express = require('express');
const router = express.Router();
const {
  getAllFilms,
  getFilmById,
  getAllPeople,
  getAllLocations,
  getAllVehicles,
  getAllSpecies,
} = require('../controllers/ghibliController');

router.get('/films', getAllFilms);
router.get('/films/:id', getFilmById);
router.get('/people', getAllPeople);
router.get('/locations', getAllLocations);
router.get('/vehicles', getAllVehicles);
router.get('/species', getAllSpecies);

module.exports = router;
