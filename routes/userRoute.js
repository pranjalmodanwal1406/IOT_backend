const express = require("express");
const User = require('../models/userModel');

const { getAllUsers,
    getUser,
    deleteUser,
    updateUser,
    register,
    forgetPassword,
    resetPasswordUser,
    logoutMethod,
    contactUs,
    deactivateAccount,
    editProfile,
 } = require('../controllers/userController')


const { verifyAdmin, verifyUser, verifyToken } = require('../middleware/verifyToken');
const { resetPassword } = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post('/register', register);
router.get('/:id', getUser);
router.get('/',getAllUsers);
router.put('/:id', authMiddleware, updateUser);
router.delete('/:id', deleteUser);
router.post('/forgetpassword', forgetPassword);
router.post('/reset-password/:token', resetPasswordUser);
// router.put('/edit/:id',verifyToken, edit);
router.post('/logout', logoutMethod);
router.post('/contactUs', contactUs );
router.post('/deactivateAccount', deactivateAccount);

router.put('/edit-profile/:id', verifyToken, editProfile);


module.exports = router;