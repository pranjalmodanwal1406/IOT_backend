require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');

// Import routes
const roleRoute = require('./routes/roleRoute');
const authRoute = require('./routes/authRoute');
const userRoute = require('./routes/userRoute');
const patientRoute = require('./routes/patientRoute');
const measureRoutes = require('./routes/measureRoute');
const {createPDF} = require('./functions/generatepdf')

// Environment variables
const PORT = process.env.PORT || 9006;
const MONGO_URL = process.env.MONGO_URL;
const FRONTEND = process.env.FRONTEND;

const app = express();

const corsOptions = {
    origin: '*', // Allow requests from localhost:3000
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    optionsSuccessStatus: 204
  };
  
  app.use(cors(corsOptions));

// Use cors middleware with options
// app.use(cors({
//     origin: 'http://localhost:3000', // Allow requests from frontend origin
//     credentials: true // Allow credentials (cookies, authorization headers, etc.)
//   }));

// Middleware
app.use(bodyParser.json());
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(bodyParser.json());

app.post('/generate-pdf', async (req, res) => {
  try {
    const { clientId, clientName } = req.body;

    // Validate request body
    if (!clientId || !clientName) {
      return res.status(400).send('Client ID and Client Name are required');
    }

    // Create PDF with the provided client data
    const pdfData = await createPDF({ clientId, clientName });

    // Set headers and send the generated PDF as a response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', pdfData.pdfBuffer.length);

    // Send the generated PDF file
    res.send(pdfData.pdfBuffer);
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).send('Failed to generate PDF');
  }
});


// Routes
app.use('/api/role', roleRoute);
app.use('/api/auth', authRoute);
app.use('/api/user', userRoute);
app.use('/api/patient', patientRoute);
app.use('/api/measures', measureRoutes);

// Response handler middleware
app.use((obj, req, res, next) => {
    const statusCode = obj.status || 500;
    const message = obj.message || "Something went wrong!";
    return res.status(statusCode).json({
        success: [200, 201, 204].includes(obj.status),
        status: statusCode,
        message: message,
        data: obj.data
    });
});

// Database connection
mongoose.set("strictQuery", false);
mongoose.connect(MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log('connected to MongoDB');
        app.listen(PORT, () => {
            console.log(`Node API app is running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.log('Error connecting to MongoDB:', error);
    });

module.exports = app;
