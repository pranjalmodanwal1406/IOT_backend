// routes/measureRoutes.js
const express = require('express');
const router = express.Router();
const measureController = require('../controllers/measurecontroller');

router.post('/measurements/:userId', measureController.addMeasurementData);
router.get('/', measureController.getAllMeasures);
// router.post('/', measureController.createMeasure);
// router.post('/add', measureController.addMeasure);
router.get('/:id', measureController.getMeasureById);
router.patch('/:id', measureController.updateMeasure);
router.delete('/:id', measureController.deleteMeasure);

module.exports = router;