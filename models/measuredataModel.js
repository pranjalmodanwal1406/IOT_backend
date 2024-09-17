
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MeasureSchema = new Schema({
userId: { type: String, required: true },
  date: { type: Number, required: true },
  totalVolume: { type: String, required: true },
  totalMeasureTime: { type: String, required: true }, 
  maxFlowSpeed: { type: String, required: true }, 
  flowTime: { type: String, required: true }, 
  averageFlowSpeed: { type: String, required: true }, 
  timeOfMaxSpeed: { type: String, required: true },
  data: [
    {
      volume: { type: String, required: true },
      time: { type: String, required: true },
      flow: { type: String, required: true },
    }
  ]
});

module.exports = mongoose.model('MeasureData', MeasureSchema);
