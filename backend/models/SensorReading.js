const mongoose = require("mongoose");

const SensorReadingSchema = new mongoose.Schema({
    userEmail: { type: String, required: true },
    temperature: Number,
    humidity: Number,
    soil1: Number,
    soil2: Number,
    soilsensor: Boolean,
    pump: Boolean,
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("sensor_readings", SensorReadingSchema);