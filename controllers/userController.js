const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const Role = require("../models/roleModel");
const Admin = require("../models/adminModel");
const User = require("../models/userModel");
const createError = require("../middleware/error");
const createSuccess = require("../middleware/success");
const bcrypt = require("bcrypt");
const validator = require('validator');


//to Create 
const register = async (req, res, next) => {
  try {
    if (!validator.isEmail(req.body.email)) { 
      return next(createError(400, "Invalid email format"));
    }
    if (req.body.password.length < 8) { 
      return next(createError(400, "Password must be of 3 to 8 characters long"));
    }
    if (req.body.name.length <= 1 || req.body.name.length >= 25) { 
      return next(createError(400, "Name must be between 2 to 25"));
    }

    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser)
      return res.status(500).json({
        message: "User already exists",
        success: false,
        status:500
      });
    const role = await Role.find({ role: "User" });
    const hashedPassword = await bcrypt.hash(req.body.password, 8);
    const newUser = new User({
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword,
      roles: role,
    });
    await newUser.save();
    return res.status(200).json("User Registered Successfully");
  } catch (error) {
    return next(createError(500, "Something went wrong"));
  }
};


//get Users
const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find();
    return next(createSuccess(200, "All Users", users));
  } catch (error) {
    return next(createError(500, "Internal Server Error!"));
  }
};


// getting User by id
const getUser = async (req, res) => {
  try {
      const userId = req.params.id;

      // Find the user by ID and select specific fields
      const user = await User.findById(userId);
  
      if (!user) {
          return res.status(404).json({ message: 'User not found', status: 404, success: true, data: user });
      }

      return res.status(200).json({  message: "User By ID", status: 200, success: true, data: user });
  } catch (error) {
      res.status(500).json({ message: error.message, status:200, success: false  });
  }
};


//update user
const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, password } = req.body;

    if (email && !validator.isEmail(email)) {
      return next(createError(400, 'Invalid email format'));
    }
    if (password && password.length < 8) {
      return next(createError(400, 'Password must be at least 8 characters long'));
    }
    if (name && (name.length <= 1 || name.length >= 25)) {
      return next(createError(400, 'Name must be between 2 to 25 characters long'));
    }

    // Check if a user with the same email already exists
    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: id } });
      if (existingUser) {
        return next(createError(409, false, 'Email already in use by another user'));
      }
    }



    // Find the user by ID
    const user = await User.findById(id);
    if (!user) {
      return next(createError(404, 'User Not Found'));
    }

    // Flag to track if any updates were made
    let isUpdated = false;

    // Update the fields that are provided in the request body
    if (name && user.name !== name) {
      user.name = name;
      isUpdated = true;
    }
    if (email && user.email !== email) {
      user.email = email;
      isUpdated = true;
    }
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 8);
      if (user.password !== hashedPassword) {
        user.password = hashedPassword;
        isUpdated = true;
      }
    }

    // Check if any updates were made
    if (!isUpdated) {
      return next(createError(400, 'No updates were made'));
    }

    // Save the updated user
    const updatedUser = await user.save();

    // Exclude the password field from the response
    const userResponse = updatedUser.toObject();
    delete userResponse.password;

    return next(createSuccess(200, 'User Details Updated', userResponse));
  } catch (error) {
    // console.error('Error updating user details:', error);
    return next(createError(500, 'Internal Server Error'));
  }
};


// Function to edit User details
const editProfile = async (req, res, next) => {
  try {
    const { name, password, newPassword } = req.body;
    const userId = req.user.id; // Get the authenticated user ID from the request

    // Fetch the user from the database
    const user = await User.findById(userId);

    if (!user) {
      return next(createError(404, "User not found"));
    }

    // Update name if provided
    if (name) {
      if (name.length < 2 || name.length > 25) {
        return next(createError(400, "Name must be between 2 to 25 characters long"));
      }
      user.name = name;
    }

    // Handle password change
    if (password && newPassword) {
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return next(createError(400, "Old password is incorrect"));
      }

      if (newPassword.length < 8) {
        return next(createError(400, "New password must be at least 8 characters long"));
      }

      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedNewPassword;
    }

    // Save the updated user to the database
    await user.save();

    return res.status(200).json({
      message: "Profile updated successfully",
      success: true,
      status: 200,
      user: {
        name: user.name,
        email: user.email // Email remains unchanged
      }
    });
  } catch (error) {
    console.error("Error in profile update:", error);
    return next(createError(500, "Something went wrong"));
  }
};


//delete user
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return next(createError(404, "User Not Found"));
    }
    return next(createSuccess(200, "User Deleted", User));
  } catch (error) {
    return next(createError(500, "Internal Server Error"));
  }
};


// forget password
const forgetPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const ResetPasswordLink="https://en.wikipedia.org/wiki/Facebook"
    const user = await User.findOne({ email });
    if (!user) return res.status(404).send('User not found');

    const token = crypto.randomBytes(32).toString('hex');
    const resetToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
console.log(resetToken);
    user.resetToken = resetToken;
    user.resetTokenExpiration = Date.now() + 3600000; // 1 hour
    await user.save();

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      to: user.email,
      from: process.env.EMAIL_USER,
      subject: "Password Reset",
      html: `<p>valid for 15 minutes.</p>
      <p><a href="${ResetPasswordLink}" style="padding: 10px 20px; background-color: #007bff; color: #fff; text-decoration: none; border-radius: 5px;">Reset Password</a></p>`
    
    };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error('Error sending email:', err);
        return res.status(500).send('Error sending email');
      }
      res.status(200).send('Password reset email sent');
    });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).send('Server error');
  }
};


const resetPasswordUser = async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const patient = await User.findOne({
      _id: decoded.userId,
      resetToken: token,
      resetTokenExpiration: { $gt: Date.now() },
    });

    if (!user) return res.status(400).send('Invalid or expired token');

    user.password = await bcrypt.hash(newPassword, 12); 
    user.resetToken = undefined;
    user.resetTokenExpiration = undefined;
    await user.save();

    res.status(200).send('Password reset successful');
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).send('Server error');
  }
};


// Logout method
const logoutMethod = async (req, res, next) => {
  try {
    // Clear session-related data (e.g., tokens, cookies)
    res.clearCookie('access_token'); // Clear the access token cookie

    // Optionally, clear any other session-related data
    // For example, if you're using JWTs, you might want to clear the token from local storage or session storage on the client side.

    res.status(200).json({ message: 'Logout successful',status:200, sucess: 'true' });
  } catch (error) {
    next(error); // Pass any error to the error handling middleware
  }
};


//Contact us
const contactUs = async (req, res, next) => {
  try {
    const { name, email, message } = req.body;

    if (!validator.isEmail(email)) {
      return next(createError(400, 'Invalid email format'));
    }
    if (name.length <= 1 || name.length >= 25) {
      return next(createError(400, 'Name must be between 2 to 25 characters long'));
    }
    if (!message || message.trim().length === 0) {
      return next(createError(400, 'Message cannot be empty'));
    }

    const user = await User.findOne({ email });
    if (!user) {
      return next(createError(404, 'User not found'));
    }
    user.message = message;
    await user.save();

    return res.status(200).json({
      message:'Message sent successfully',
      success: true,
      status: 200,
    });
  } catch (error) {
    return next(createError('Something went wrong', 500, 'false'));
  }
};


//deactivate user account 
const deactivateAccount = async (req, res, next) => {
  try {
    const { name, email, reason } = req.body;
    if (!validator.isEmail(email)) {
      return next(createError(400, 'Invalid email format', false));
    }
    if (name.length <= 1 || name.length >= 25) {
      return next(createError(400, 'Name must be between 2 to 25 characters long', false));
    }
    if (!reason || reason.trim().length === 0) {
      return next(createError(400, 'Reason cannot be empty', false));
    }
    const user = await User.findOne({ email });

    if (!user) {
      return next(createError(404, 'User not found', false));
    }
    user.isActive = false;
    user.reason = reason; 
    user.message = "Account deactivated"; 
    await user.save();

    return res.status(200).json({
      message: 'User deactivated successfully',
      success: true,
      status: 200
    });
  } catch (error) {
    return next(createError(500, 'Something went wrong', false));
  }
};


module.exports = {
  register,
  getUser,
  getAllUsers,
  updateUser,
  editProfile,
  forgetPassword,
  deleteUser,
  resetPasswordUser,
  logoutMethod,
  contactUs,
  deactivateAccount 
 };