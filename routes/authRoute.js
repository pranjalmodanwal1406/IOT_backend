const express = require('express');
const { register, login, registerAdmin, loginAdmin , sendEmail, resetPassword, verifyOTP } = require('../controllers/authController')
 
//as User
const router = express.Router();

// for signup 
router.post('/register', register);

// router.post('/signup', signup);
router.post('/login', login);

//register admin
router.post('/register-admin', registerAdmin);

// admin login
router.post('/loginAdmin', loginAdmin ) 

//send reset emai
router.post('/send-email',sendEmail)

//verify otp
router.post("/verifyOTP", verifyOTP);

//Reset Password
router.post("/resetPassword", resetPassword);





module.exports = router;