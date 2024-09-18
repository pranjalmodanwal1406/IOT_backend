const User = require('../models/userModel');
const MeasureData = require('../models/measuredataModel');
const createError = require("../middleware/error");
const createSuccess = require("../middleware/success");

exports.getAllMeasures = async (req, res) => {
  try {
    const measures = await MeasureData.find();
    res.json(measures);
  } catch (err) {
    res.status(500).json({ message: err.message,               
      success: false,
      status: 400 });
  }
};

// Data append karne ke liye
exports.addMeasurementData = async (req, res) => {
  const { userId } = req.params;
  const { date, data, totalVolume, totalMeasureTime, maxFlowSpeed, flowTime, averageFlowSpeed, timeOfMaxSpeed } = req.body;

  try {
    let measure = await MeasureData.findOne({ userId, date });

    if (measure) {
      // Agar record milta hai, to data append karo
      measure.data.push(...data);
    } else {
      // Agar record nahi milta, to naye data ke sath record create karo
      measure = new MeasureData({ userId, date, data, totalVolume, totalMeasureTime, maxFlowSpeed, flowTime, averageFlowSpeed,timeOfMaxSpeed});
    }

    await measure.save();
    res.status(200).json({ message: 'Data added successfully', success: 'true', status:'200' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', success: 'false', status: '400', error });
  }
};

exports.getMeasureById = async (req, res) => {
  try {
    const measure = await MeasureData.findById(req.params.id);
    if (!measure) return res.status(404).json({ message: 'Measure not found', success: 'false', status: '400' });
    res.json(measure);
  } catch (err) {
    res.status(500).json({ message: err.message, success: 'false', status: '400' });
  }
};

exports.updateMeasure = async (req, res) => {
  try {
    const measure = await MeasureData.findById(req.params.id);
    if (!measure) return res.status(404).json({ message: 'Measure not found', success: 'false', status: '400' });

    measure.date = req.body.date ?? measure.date;
    measure.data = req.body.data ?? measure.data;

    const updatedMeasure = await measure.save();
    res.json(updatedMeasure);
  } catch (err) {
    res.status(400).json({ message: err.message, success: 'false', status: '400' });
  }
};


exports.deleteMeasure = async (req, res) => {
  try {
    const measure = await MeasureData.findById(req.params.id);
    if (!measure) return res.status(404).json({ message: 'Measure not found', success: 'false', status: '400' });

    await measure.remove();
    res.json({ message: 'Measure deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message, success: 'false', status: '400' });
  }
};

exports.getPatientFullData = async (req, res, next) => {
  try {
    const { id } = req.params;

    console.log("patientId", id);

    // Validation
    if (!id) {
      return next(createError(400, "patientId is required"));
    }

    // Fetch patient by ID
    const patient = await MeasureData.find({userId:id});

    if (!patient) {
      return res.status(200).json({
        message: "No patient detail found for this user",
        success: false,
        status: 200,
        data: []
      });
    }
    return res.status(200).json({
      message: "Patient and their measure data retrieved successfully",
      success: true,
      status: 200,
      data: patient
    });

  } catch (error) {
    console.error("Error fetching patient and their measure data:", error);
    return next(createError(500, "Something went wrong"));
  }
};
