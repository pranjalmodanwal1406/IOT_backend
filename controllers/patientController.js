const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const Role = require("../models/roleModel");
const Patient = require("../models/patientModel");
const Admin = require("../models/adminModel");
const User = require("../models/userModel");
const createError = require("../middleware/error");
const createSuccess = require("../middleware/success");
const bcrypt = require("bcrypt");
const validator = require('validator');
const MeasureData = require("../models/measuredataModel"); 

// new code
const useraddingPatient = async (req, res, next) => {
  try {
      const { lastname, firstname, DOB, SSN, userId } = req.body;
      
      // Validation
      if (!lastname || !firstname || !DOB || !SSN || !userId) {
          return next(createError(400, "All fields (lastname, firstname, DOB, SSN, userId) are required"));
      }
      
      // Check if the SSN already exists for the same user
      const existingPatient = await Patient.findOne({ SSN });
      if (existingPatient) {
          return res.status(400).json({
              message: "Patient with this SSN already exists",
              success: false,
              status: 400
          });
      }

      const addPatient = new Patient({
        lastname,
        firstname,
        DOB,
        SSN,
        userId
      });

      await addPatient.save(); // Ensure to await save to properly handle async operation

      return res.status(200).json({
          message: "Patient added successfully",
          success: true,
          status: 200
      });

  } catch (error) {
      console.error("Error in registration:", error);
      return next(createError("Something went wrong", false, 500));
  }
};


const updatePatient = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { lastname, firstname, DOB, userId } = req.body;

    // Validation
    if (!id) {
      return next(createError(400, "Patient ID is required"));
    }
    if (!lastname || !firstname || !DOB || !userId) {
      return next(createError(400, "All fields (lastname, firstname, DOB, userId) are required"));
    }

    // Find the patient by ID
    const patient = await Patient.findById(id);

    if (!patient) {
      return res.status(404).json({
        message: "Patient not found",
        success: false,
        status: 404
      });
    }

    // Check if the SSN already exists for another patient (optional)


    // Update patient details
    patient.lastname = lastname;
    patient.firstname = firstname;
    patient.DOB = DOB;
    patient.userId = userId;

    await patient.save(); // Save the updated patient details

    return res.status(200).json({
      message: "Patient updated successfully",
      success: true,
      status: 200,
      data: patient 
    });

  } catch (error) {
    console.error("Error updating patient:", error);
    return next(createError(500, "Something went wrong"));
  }
};
 

// get 
const getPatients = async (req, res, next) => {
  try {
    const { userId } = req.params;

    // Validation
    if (!userId) {
      return next(createError(400, "userId is required"));
    }

    // Fetch patients for the specific user
    const patients = await Patient.find({ userId });

    if (!patients.length) {
      return res.status(200).json({
        message: "No patients found for this user",
        success: false,
        status: 200,
        data: []
      });
    }

    // // For each patient, fetch the associated measure data
    // const patientsWithMeasureData = await Promise.all(
    //   patients.map(async (patient) => {
    //     const measureData = await MeasureData.find({ userId: patient.userId });
    //     return {
    //       ...patient.toObject(), // Convert Mongoose document to plain JS object
    //       measureData // Attach the measureData to each patient
    //     };
    //   })
    // );

    return res.status(200).json({
      message: "Patients and their measure data retrieved successfully",
      success: true,
      status: 200,
      data: patients
    });

  } catch (error) {
    console.error("Error fetching patients and their measure data:", error);
    return next(createError(500, "Something went wrong"));
  }
};


// getPatientDetail 
const getPatientDetail = async (req, res, next) => {
  try {
    const { id } = req.params;

    console.log("patientId", id);

    // Validation
    if (!id) {
      return next(createError(400, "patientId is required"));
    }

    // Fetch patient by ID
    const patient = await Patient.findById(id);

    if (!patient) {
      return res.status(200).json({
        message: "No patient detail found for this user",
        success: false,
        status: 200,
        data: []
      });
    }

    // Fetch the associated measure data for the patient
    const measureData = await MeasureData.find({ userId: patient.userId });

    const patientWithMeasureData = {
      ...patient.toObject(), // Convert Mongoose document to plain JS object
      measureData // Attach the measureData to the patient
    };

    console.log(patientWithMeasureData);

    return res.status(200).json({
      message: "Patient and their measure data retrieved successfully",
      success: true,
      status: 200,
      data: patientWithMeasureData
    });

  } catch (error) {
    console.error("Error fetching patient and their measure data:", error);
    return next(createError(500, "Something went wrong"));
  }
};


//to Create patient
const registerPatient = async (req, res, next) => {
    try {
      const { email, password, name } = req.body;
  
      if (!validator.isEmail(email)) {
        return next(createError(400, false, "Invalid email format"));
      }
      if (password.length < 8) {
        return next(createError(400, "Password must be at least 8 characters long"));
      }
      if (name.length <= 1 || name.length >= 25) {
        return next(createError(400, "Name must be between 2 to 25 characters long"));
      }
  
      const existingPatient = await Patient.findOne({ email });
      if (existingPatient) {
        return res.status(500).json({
          message: "Patient already exists",
          success: false,
          status: 400
        });
      }
  
      const role = await Role.findOne({ role: "Patient" });
      const hashedPassword = await bcrypt.hash(password, 8);
      const newPatient = new Patient({
        name,
        email,
        password: hashedPassword,
        roles: [role],
      });
  
      await newPatient.save();
      return res.status(200).json("Patient Registered Successfully", true, 200);
    } catch (error) {
      console.error("Error in registration:", error);
      return next(createError("Something went wrong", false, 500));
    }
  };


// Get All Patients
const getAllPatients = async (req, res, next) => {
    try {
      const patients = await Patient.find();
      return next(createSuccess(200, "All Patients", patients));
    } catch (error) {
      console.error("Error fetching patients:", error);
      return next(createError(500, false,  "Internal Server Error!"));
    }
  };


//update patient
// const updatePatient = async (req, res, next) => {
//   try {
//     const { id } = req.params;
//     const { name,  password, medicalHistory } = req.body;

//     if (email && !validator.isEmail(email)) {
//       return next(createError(400, 'Invalid email format', false));
//     }
//     if (password && password.length < 8) {
//       return next(createError(400, 'Password must be at least 8 characters long', false));
//     }
//     if (name && (name.length <= 1 || name.length >= 25)) {
//       return next(createError(400, 'Name must be between 2 to 25 characters long', false));
//     }

//     // Check if a patient with the same email already exists
//     if (email) {
//       const existingPatient = await Patient.findOne({ email, _id: { $ne: id } });
//       if (existingPatient) {
//         return next(createError('Email already in use by another patient', 409, false));
//       }
//     }

//     const updatedFields = {};
//     if (name) updatedFields.name = name;
//     if (email) updatedFields.email = email;
//     if (password) updatedFields.password = await bcrypt.hash(password, 10);
//     if (medicalHistory) updatedFields.medicalHistory = medicalHistory;

//     const updatedPatient = await Patient.findByIdAndUpdate(id, updatedFields, { new: true });
//     if (!updatedPatient) {
//       return next(createError(404, 'Patient not found', false));
//     }

//     res.status(200).json({ message: 'Patient updated successfully', status:200, sucess:'true' });
//   } catch (error) {
//     next(error);
//   }
// };



// Function to edit User details
const editPatient = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, password, mobileNumber, profileImage } = req.body;
  
        const patient = await Patient.findById(id); // Changed User to Patient and findById to findById
  
        if (!patient) {
            return res.status(404).json({ message: 'Patient not found' , status: 404, success: false,}); // Changed 'User' to 'Patient'
        }
  
        // Update the fields that are provided in the request body
        if (name) patient.name = name; // Changed 'user' to 'patient'
        if (email) patient.email = email; // Changed 'user' to 'patient'
        if (password) {
            const salt = await bcrypt.genSalt(8);
            patient.password = await bcrypt.hash(password, salt);
        }
        if (mobileNumber) patient.mobileNumber = mobileNumber; 
        if (profileImage) patient.profileImage = profileImage; 
  
        // Save the updated patient
        const updatedPatient = await patient.save(); 
  
        // Exclude the password field from the response
        const patientResponse = updatedPatient.toObject(); 
        delete patientResponse.password;
  
        res.status(200).json({
            message: 'Patient updated successfully', 
            status: 200, 
            sucess: true, 
            patient: patientResponse 
        });
    } catch (error) {
        res.status(500).json({ error: error.message, status: 400, sucess: false });
    }
  };



// getting Patient by id
const getPatient = async (req, res) => {
  try {
      const patientId = req.params.id;

      // Find the patient by ID and select specific fields (example: name, email, and other patient-specific fields)
      const patient = await Patient.findById(patientId).select('name email age');

      if (!patient) {
          return res.status(404).json({ message:'Patient not found', status:400, sucess:false});
      }

      res.status(200).json(patient);
  } catch (error) {
      res.status(500).json({ message: error.message, status: 500, sucess: false});
  }
};


// Delete Patient
const deletePatient = async (req, res, next) => {
    try {
      const { id } = req.params;
      const patient = await Patient.findByIdAndDelete(id);
      if (!patient) {
        return next(createError(404, "Patient Not Found"));
      }
      return res.status(200).json({ message: "Patient Deleted" });
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


const resetPasswordPatient = async (req, res) => {
    const { token } = req.params;
    const { newPassword } = req.body;
  
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const patient = await Patient.findOne({
        _id: decoded.patientId,
        resetToken: token,
        resetTokenExpiration: { $gt: Date.now() },
      });
  
      if (!patient) return res.status(400).send('Invalid or expired token');
  
      patient.password = await bcrypt.hash(newPassword, 12); // Hash the new password
      patient.resetToken = undefined;
      patient.resetTokenExpiration = undefined;
      await patient.save();
  
      res.status(200).send('Password reset successful');
    } catch (error) {
      console.error('Server error:', error);
      res.status(500).send('Server error');
    }
  };


module.exports = {
  registerPatient,
  getPatient,
  getAllPatients,
  updatePatient,
  editPatient,
  forgetPassword,
  deletePatient,
  resetPasswordPatient,
  useraddingPatient,
  getPatients,
  getPatientDetail,
 };