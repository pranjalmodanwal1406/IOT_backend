const express = require("express");
const patient = require('../models/patientModel');

const { 
    getAllPatients,
    getPatient,
    deletePatient,
    updatePatient,
    editPatient,
    registerPatient,
    forgetPassword,
    resetPasswordPatient,
    useraddingPatient,
    getPatients,
 } = require('../controllers/patientController')


const { verifyAdmin, verifyUser, verifyToken } = require('../middleware/verifyToken');
const { resetPassword } = require("../controllers/authController");

const router = express.Router();


router.get('/getPatients/:userId', getPatients);
router.post('/useraddingPatient', useraddingPatient);
router.post('/registerPatient', registerPatient);
router.get('/:id', 
    // verifyPatient, 
    getPatient);
router.get('/', verifyAdmin, getAllPatients);
router.put('/:id', verifyAdmin, updatePatient);
router.delete('/:id', verifyAdmin, deletePatient);
router.post('/forgetpassword', forgetPassword);
router.post('/reset-password/:token', resetPasswordPatient);
router.put('/edit/:id',verifyToken, editPatient);


module.exports = router;