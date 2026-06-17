const express = require("express");
const mongoose = require("mongoose");

module.exports = function (iotDB) {
    const router = express.Router();

    const SensorDataSchema = new mongoose.Schema({
        temperature: Number,
        humidity: Number,
        soil1: Number,
        soil2: Number,
        soilsensor: Boolean,
        pump: Boolean,
        createdAt: { type: Date, default: Date.now }
    });

    const SensorDataModel = iotDB.models["SensorData"]
        || iotDB.model("SensorData", SensorDataSchema);

    // ESP32 posts raw data here — POST /data
    router.post("/", async (req, res) => {
        try {
            const newData = new SensorDataModel(req.body);
            await newData.save();
            console.log("ESP32 raw data saved:", req.body);
            res.status(201).json({ message: "Data saved successfully" });
        } catch (error) {
            console.error("Error saving ESP32 data:", error);
            res.status(500).json({ error: "Server error" });
        }
    });

    // GET all raw readings — GET /data
    router.get("/", async (req, res) => {
        try {
            const data = await SensorDataModel.find().sort({ createdAt: -1 }).limit(100);
            res.json(data);
        } catch (error) {
            res.status(500).json({ error: "Failed to fetch data" });
        }
    });

    return router;
};