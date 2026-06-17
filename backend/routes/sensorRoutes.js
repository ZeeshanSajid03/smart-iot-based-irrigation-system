const express = require("express");
const mongoose = require("mongoose");

module.exports = function (iotDB) {
    const router = express.Router();

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

    // Prevent model re-registration error on hot reload
    const SensorReadingModel = iotDB.models["sensor_readings"]
        || iotDB.model("sensor_readings", SensorReadingSchema);

    // ESP32 posts here with userEmail in the body
    router.post("/", async (req, res) => {
        try {
            const newData = new SensorReadingModel(req.body);
            await newData.save();
            res.status(201).json({ status: "success", message: "Data saved successfully" });
        } catch (error) {
            console.error("Error saving sensor reading:", error);
            res.status(500).json({ error: "Server error" });
        }
    });

    // GET /api/sensor-data/admin-stats — readings per day for last 7 days (admin chart)
    router.get("/admin-stats", async (req, res) => {
        try {
            const days = [];
            for (let i = 6; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const dateStr = d.toISOString().split('T')[0];
                const start = new Date(dateStr + 'T00:00:00.000Z');
                const end = new Date(dateStr + 'T23:59:59.999Z');
                const count = await SensorReadingModel.countDocuments({ createdAt: { $gte: start, $lte: end } });
                days.push({ day: d.toLocaleDateString('en-US', { weekday: 'short' }), readings: count });
            }
            res.json({ status: 'success', data: days });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // DELETE /api/sensor-data/clear?email=x
    router.delete("/clear", async (req, res) => {
        const { email } = req.query;
        if (!email) return res.status(400).json({ error: "Provide ?email= in query" });
        try {
            const result = await SensorReadingModel.deleteMany({ userEmail: email });
            res.json({ status: "success", message: `Deleted ${result.deletedCount} readings.` });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });



    // Dashboard fetches latest readings by user email
    router.get("/:email", async (req, res) => {
        try {
            const data = await SensorReadingModel
                .find({ userEmail: req.params.email })
                .sort({ createdAt: -1 })
                .limit(2000);
            res.json({ status: "success", data: data });
        } catch (error) {
            res.status(500).json({ error: "Failed to fetch data" });
        }
    });


    router.post("/seed", async (req, res) => {
        const { email } = req.query;
        if (!email) return res.status(400).json({ error: "Provide ?email=yourEmail in query string" });
        try {
            const fake = new SensorReadingModel({
                userEmail: email,
                temperature: parseFloat((22 + Math.random() * 10).toFixed(1)),
                humidity: parseFloat((45 + Math.random() * 30).toFixed(1)),
                soil1: Math.floor(Math.random() * 100) + 1,
                soil2: Math.floor(Math.random() * 100) + 1,
                soilsensor: Math.random() > 0.5,
                pump: Math.random() > 0.7,
            });
            await fake.save();
            res.json({ status: "success", message: "Fake reading inserted", data: fake });
        } catch (error) {
            console.error("Seed error:", error);
            res.status(500).json({ error: "Seed failed" });
        }
    });

    return router;
};

