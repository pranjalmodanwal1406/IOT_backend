
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MeasureSchema = new Schema({
userId: { type: String, required: true },
  date: { type: Number, required: true },
  data: [
    {
      totalVolume: { type: String, required: true },
      flowTime: { type: String, required: true },
      flowSpeed: { type: String, required: true },
    }
  ]
});

module.exports = mongoose.model('MeasureData', MeasureSchema);
