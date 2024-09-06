const User = require('../models/userModel'); 
const Admin = require('../models/adminModel');
const Role = require('../models/roleModel');
const createError = require('../middleware/error');
const createSuccess = require('../middleware/success');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const validator = require('validator');

// Create user
const register = async (req, res, next) => {
  try {
    const { email, password, confirmPassword, name } = req.body;

    if (!validator.isEmail(email)) {
      return next(createError(400, "Invalid email format"));
    }
    if (password.length < 8) {
      return next(createError(400, "Password must be at least 8 characters long"));
    }
    if (password !== confirmPassword) {
      return next(createError(400, "Passwords do not match"));
    }
    if (name.length < 2 || name.length > 25) {
      return next(createError(400, "Name must be between 2 to 25 characters long"));
    }

    // Check if the user already exists
    const existingUser = await User.findOne({ email: email });
    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
        success: false,
        status: 400
      });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10); // Increase salt rounds for security

    // Create a new user
    const newUser = new User({
      name: name,
      email: email,
      password: hashedPassword,
      role: "user",
    });

    // Save the new user to the database
    await newUser.save();

    return res.status(200).json({ message: "User Registered Successfully", success: true, status: 200 });
  } catch (error) {
    console.error("Error in registration:", error);
    return next(createError(500, "Something went wrong"));
  }
};

// Login
const login = async (req, res, next) => {
  try {
    let user = await User.findOne({ email: req.body.email });

    console.log("user",user);
    if (!user) {
      return next(createError(404, "User Not Found", false));
    }
    

    const isPassword = await bcrypt.compare(req.body.password, user.password);
    if (!isPassword) {
      return next(createError(400, "Password is Incorrect", false));
    }

    const token = jwt.sign(
      { id: user._id, isAdmin: user.isAdmin, roles: user.roles },
      process.env.JWT_SECRET,
      { expiresIn: '1h' } 
    );

    res.cookie("access_token", token, { httpOnly: true })
      .status(200)
      .json({
        token,
        status: 200,
        sucess: 'true',
        message: "Login Success",
        data: user
      });

  } catch (error) {
    return next(createError("Something went wrong", 500,  false));
  }
};


// Register Admin
const registerAdmin = async (req, res, next) => {
  try {
    if (!validator.isEmail(req.body.email)) { // Email validation
      return next(createError(400, "Invalid email format", false));
    }

    const newUser = new Patient({
      name: req.body.name,
      mobileNumber: req.body.mobileNumber,
      email: req.body.email,
      password: req.body.password,
      isAdmin: true,
    });
    await newUser.save();
    return next(createSuccess(200, "Admin Registered Successfully", true));
  } catch (error) {
    return next(createError(500, "Something went wrong", false));
  }
};



// admin Login
const loginAdmin = async (req, res, next) => {
  try {
    let admin = await Admin.findOne({ email: req.body.email, isAdmin: true });
    if (!admin) {
      console.log("Admin not found with email:", req.body.email);
      return next(createError(404, "Admin Not Found", false));
    }

    const isPasswordCorrect = await bcrypt.compare(req.body.password, admin.password);
    if (!isPasswordCorrect) {
      console.log("Incorrect password for admin with email:", req.body.email);
      return next(createError(404, "Password is Incorrect", false));
    }

    const token = jwt.sign(
      { id: admin._id, isAdmin: admin.isAdmin, roles: admin.roles },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.cookie("access_token", token, { httpOnly: true })
      .status(200)
      .json({
        token,
        status: 200,
        sucess: "false",
        message: "Login Success",
        data: admin
      });

  } catch (error) {
    console.error("Error during admin login:", error);
    return next(createError(500, "Something went wrong"));
  }
}


//sendresetmail
const sendEmail = async (req, res) => {
  const email = req.body.email;
  try {
    if (!validator.isEmail(email)) {
      return res.status(400).json({ message: "Invalid email format", status: 400, success: false });
    }

    let user = await User.findOne({ email });
    let admin = null;
    let userType = "user";

    if (!user) {
      admin = await Admin.findOne({ email });
      userType = "admin";
    }

    if (!user && !admin) {
      return res.status(400).json({ message: "Invalid email" , status: 400, success: false});
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    
    if (userType === "user") {
      user.otp = otp;
      user.otpExpiration = Date.now() + 15 * 60 * 1000;
      await user.save();
    } else {
      admin.otp = otp;
      admin.otpExpiration = Date.now() + 15 * 60 * 1000;
      await admin.save();
    }

    const ResetPasswordLink = `http://15.168.76.25:3000/reset-password?token=${otp}`;

    const mailTransporter = nodemailer.createTransport({
      service: "GMAIL",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailDetails = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset OTP",
      html: `<p>Your OTP for password reset is: <strong>${otp}</strong></p><p>This OTP is valid for 15 minutes.</p>
      <p><a href="${ResetPasswordLink}" style="padding: 10px 20px; background-color: #007bff; color: #fff; text-decoration: none; border-radius: 5px;">Reset Password</a></p>`
    };

    await mailTransporter.sendMail(mailDetails);
    res.status(200).json({ message: "OTP sent to your email" , status: 200, success: true });
  } catch (error) {
    console.error("Error sending OTP email:", error);
    res.status(500).json({ message: "Internal Server Error", status: 500, success: false});
  }
};


//verify OTP
const verifyOTP = async (req, res) => {
  const { otp } = req.body;
  try {
    let user = await User.findOne({ otp, otpExpiration: { $gt: Date.now() } });
    let admin = null;
    let userType = "user";

    if (!user) {
      admin = await Admin.findOne({ otp, otpExpiration: { $gt: Date.now() } });
      userType = "admin";
    }

    if (!user && !admin) {
      return res.status(400).json({ message: "Invalid or expired OTP", status: 400, success: false});
    }

    if (userType === "user") {
      user.otp = undefined;
      user.otpExpiration = undefined;
      await user.save();
    } else {
      admin.otp = undefined;
      admin.otpExpiration = undefined;
      await admin.save();
    }

    const token = jwt.sign({ email: user ? user.email : admin.email }, process.env.JWT_SECRET, { expiresIn: '15m' });
    res.status(200).json({ message: "OTP verified successfully", status: 200, success: true, token });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({ message: "Internal Server Error", status: 400, success: false });
  }
};


// Reset Password
const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const userEmail = decodedToken.email;
    let user = await User.findOne({ email: userEmail });
    let admin = null;
    let userType = "user";

    if (!user) {
      admin = await Admin.findOne({ email: userEmail });
      userType = "admin";
    }

    if (!user && !admin) {
      return res.status(400).json({ message: "Invalid token", status: 400, success: false});
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    if (userType === "user") {
      user.password = hashedPassword;
      await user.save();
    } else {
      admin.password = hashedPassword;
      await admin.save();
    }

    res.status(200).json({ message: "Password reset successful" , status: 200, success: true});
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", status: 500, success: false});
  }
};






module.exports = { register, login, registerAdmin, loginAdmin,  sendEmail, resetPassword, verifyOTP};
