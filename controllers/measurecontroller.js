const User = require('../models/userModel');
const MeasureData = require('../models/measuredataModel');

exports.getAllMeasures = async (req, res) => {
  try {
    const measures = await MeasureData.find();
    res.json(measures);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Data append karne ke liye
exports.addMeasurementData = async (req, res) => {
  const { userId } = req.params;
  const { date, data } = req.body;

  try {
    let measure = await MeasureData.findOne({ userId, date });

    if (measure) {
      // Agar record milta hai, to data append karo
      measure.data.push(...data);
    } else {
      // Agar record nahi milta, to naye data ke sath record create karo
      measure = new MeasureData({ userId, date, data });
    }

    await measure.save();
    res.status(200).json({ message: 'Data appended successfully', measure });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error });
  }
};

exports.getMeasureById = async (req, res) => {
  try {
    const measure = await MeasureData.findById(req.params.id);
    if (!measure) return res.status(404).json({ message: 'Measure not found' });
    res.json(measure);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateMeasure = async (req, res) => {
  try {
    const measure = await MeasureData.findById(req.params.id);
    if (!measure) return res.status(404).json({ message: 'Measure not found' });

    measure.date = req.body.date ?? measure.date;
    measure.data = req.body.data ?? measure.data;

    const updatedMeasure = await measure.save();
    res.json(updatedMeasure);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};


exports.deleteMeasure = async (req, res) => {
  try {
    const measure = await MeasureData.findById(req.params.id);
    if (!measure) return res.status(404).json({ message: 'Measure not found' });

    await measure.remove();
    res.json({ message: 'Measure deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};