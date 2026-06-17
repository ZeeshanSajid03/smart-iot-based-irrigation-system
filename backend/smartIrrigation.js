const axios = require("axios");
const mongoose = require("mongoose");

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:5001";
const SMART_INTERVAL_MS = 30000;

let iotDB = null;

const runSmartIrrigation = async () => {
    try {
        const User          = mongoose.model("users");
        const Field         = mongoose.model("fields");
        const SensorReading = iotDB.model("sensor_readings");

        const smartUsers = await User.find({ smartMode: true, isVerified: true });
        if (smartUsers.length === 0) return;

        for (const user of smartUsers) {
            try {
                await processUser(user, Field, SensorReading);
            } catch (err) {
                console.error(`[Smart] Error processing ${user.email}:`, err.message);
            }
        }
    } catch (err) {
        console.error("[Smart] Loop error:", err.message);
    }
};

const processUser = async (user, Field, SensorReading) => {
    // 1. Latest sensor reading for this user
    const reading = await SensorReading
        .findOne({ userEmail: user.email })
        .sort({ createdAt: -1 });

    if (!reading) {
        console.log(`[Smart] No sensor data for ${user.email} — skipping`);
        return;
    }

    // 2. User's first field (crop/soil/seedling info)
    const field = await Field.findOne({ userEmail: user.email });
    if (!field) {
        console.log(`[Smart] No field configured for ${user.email} — skipping`);
        return;
    }

    // 3. MOI = average of both soil sensors
    const moi = parseFloat(
        ((Number(reading.soil1) + Number(reading.soil2)) / 2).toFixed(1)
    );

    const payload = {
        crop_id:        field.cropType      || "Wheat",
        soil_type:      field.soilType      || "Loam Soil",
        seedling_stage: field.seedlingStage || "Germination",
        MOI:            moi,
        temp:           reading.temperature,
        humidity:       reading.humidity,
    };

    // 4. Call Python microservice
    let aiResponse;
    try {
        const res = await axios.post(
            `${AI_SERVICE_URL}/predict`,
            payload,
            { timeout: 10000 }
        );
        aiResponse = res.data;
    } catch (err) {
        console.error(`[Smart] AI service unreachable for ${user.email}:`, err.message);
        return;
    }

    const { prediction, confidence, message } = aiResponse;

    console.log(
        `[Smart] ${user.email} | ` +
        `${field.cropType} / ${field.soilType} / ${field.seedlingStage} | ` +
        `MOI: ${moi} Temp: ${reading.temperature} Humidity: ${reading.humidity} | ` +
        `→ ${message} (${(confidence * 100).toFixed(0)}% confidence)`
    );

    // 5. Update pump only if state changed
    const shouldPump = prediction === 1;
    if (user.pumpStatus !== shouldPump) {
        const updateData = { pumpStatus: shouldPump };

        if (shouldPump) {
            // ── Pump turning ON ───────────────────────────────────────────
            updateData.irrigationStartedAt = new Date();

        } else {
            // ── Pump turning OFF ──────────────────────────────────────────
            // IMPORTANT: calculate duration BEFORE clearing irrigationStartedAt

            const startedAt    = user.irrigationStartedAt;
            let durationText   = 'N/A';
            let sessionSeconds = 0;

            if (startedAt) {
                const now      = new Date();
                sessionSeconds = Math.floor(
                    (now.getTime() - new Date(startedAt).getTime()) / 1000
                );
                const mins     = Math.round(sessionSeconds / 60);
                durationText   = mins < 1 ? '< 1 min' : `${mins} min`;

                const today    = now.toISOString().split('T')[0];
                const lastDate = user.lastRuntimeDate
                    ? new Date(user.lastRuntimeDate).toISOString().split('T')[0]
                    : null;

                // Accumulate pumpRuntimeTodaySeconds (resets if new day)
                const existing = lastDate === today ? (user.pumpRuntimeTodaySeconds || 0) : 0;
                updateData.pumpRuntimeTodaySeconds = existing + sessionSeconds;
                updateData.lastRuntimeDate         = now;

                // ── Write to pumpRuntimeHistory so chart shows past days ──
                // This is what makes the water usage chart remember previous days
                const existingHistory = user.pumpRuntimeHistory || [];
                const historyEntry    = existingHistory.find(h => h.date === today);

                if (historyEntry) {
                    // Day already has an entry — add to it
                    historyEntry.seconds          += sessionSeconds;
                    updateData.pumpRuntimeHistory  = existingHistory;
                } else {
                    // New day — append, keep max 30 days to avoid unbounded growth
                    updateData.pumpRuntimeHistory = [
                        ...existingHistory.slice(-29),
                        { date: today, seconds: sessionSeconds }
                    ];
                }
            }

            updateData.irrigationStartedAt = null;

            // Save completed irrigation event to the fields page table
            try {
                const IrrigationEvent = mongoose.model("irrigation_events");
                const now             = new Date();
                await IrrigationEvent.create({
                    userEmail: user.email,
                    date:      now.toISOString().split('T')[0],
                    time:      now.toLocaleTimeString('en-US', {
                                   hour:   '2-digit',
                                   minute: '2-digit'
                               }),
                    fieldName: field.fieldName || 'Field',
                    duration:  durationText,
                    status:    'Completed'
                });
                console.log(`[Smart] Irrigation event saved — ${durationText}`);
            } catch (err) {
                console.error('[Smart] Failed to save irrigation event:', err.message);
            }
        }

        await mongoose.model("users").findByIdAndUpdate(user._id, updateData);
        console.log(`[Smart] Pump ${user.email} → ${shouldPump ? "ON 💧" : "OFF"}`);
    }
};

const startSmartIrrigation = (iotDBConnection) => {
    iotDB = iotDBConnection;
    console.log(
        `[Smart] Irrigation loop started — runs every ${SMART_INTERVAL_MS / 1000}s`
    );
    runSmartIrrigation();
    setInterval(runSmartIrrigation, SMART_INTERVAL_MS);
};

module.exports = { startSmartIrrigation };