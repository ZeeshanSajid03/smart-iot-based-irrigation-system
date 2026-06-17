const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const { startSmartIrrigation } = require("./smartIrrigation");
require('dotenv').config();

const app = express();

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ limit: '5mb', extended: true }));


const corsOptions = {
    origin: [
        'http://localhost:5173',          // local dev
        'https://your-app.vercel.app',    // Vercel (update after deploy)
        /\.vercel\.app$/                  // any Vercel preview URL
    ],
    credentials: true,
};
app.use(cors(corsOptions));

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendAlertEmail = async (userEmail, subject, message) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: userEmail,
            subject: `Smart Irrigation Alert: ${subject}`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                    <h2 style="color: #d97706;">⚠️ System Alert</h2>
                    <p style="font-size: 16px;">${message}</p>
                    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
                    <p style="font-size: 12px; color: #888;">This is an automated alert from your Smart Irrigation IoT Dashboard.</p>
                </div>
            `
        };
        await transporter.sendMail(mailOptions);
        console.log(`Alert email sent successfully to ${userEmail}`);
    } catch (error) {
        console.error("Failed to send alert email:", error);
    }
};

// --- SCHEMAS ---

const UserSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    photoUrl: String,
    phone: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: "user" },
    otp: String,
    otpExpires: { type: Date, index: { expires: 0 } },
    isVerified: { type: Boolean, default: false },
    resetOtp: String,
    resetOtpExpires: Date,
    alerts: {
        lowMoisture: { type: Boolean, default: true },
        sensorFailure: { type: Boolean, default: true },
        lowBattery: { type: Boolean, default: false },
        irrigationCompletion: { type: Boolean, default: false }
    },
    pumpStatus: { type: Boolean, default: false },
    smartMode: { type: Boolean, default: true },
    irrigationStartedAt: { type: Date, default: null },
    pumpRuntimeTodaySeconds: { type: Number, default: 0 },
    lastRuntimeDate: { type: Date, default: null },
    soilCritical: { type: Number, default: 20 },
    soilWarning: { type: Number, default: 35 },
    tempHigh: { type: Number, default: 38 },
    humidityHigh: { type: Number, default: 85 },
    pumpFlowRate: { type: Number, default: 15 },
    pumpRuntimeHistory: [{
        date: { type: String },  // "YYYY-MM-DD"
        seconds: { type: Number, default: 0 }
    }],
});
const UserModel = mongoose.model("users", UserSchema);

const FieldSchema = new mongoose.Schema({
    userEmail: { type: String, required: true },
    fieldName: { type: String, required: true },
    cropType: { type: String, default: "Not Specified" },
    areaSize: { type: String, default: "" },
    seedlingStage: { type: String, default: "" },
    soilType: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now }
});
const FieldModel = mongoose.model("fields", FieldSchema);

const NotificationSchema = new mongoose.Schema({
    userEmail: { type: String, required: true },
    header: { type: String, required: true },
    message: { type: String, required: true },
    image: { type: String, default: null },
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});
const NotificationModel = mongoose.model("notifications", NotificationSchema);

const IrrigationEventSchema = new mongoose.Schema({
    userEmail: { type: String, required: true },
    date: String,
    time: String,
    fieldName: String,
    duration: String,
    status: String
});
const IrrigationEventModel = mongoose.model("irrigation_events", IrrigationEventSchema);

const SensorDeviceSchema = new mongoose.Schema({
    userEmail: { type: String, required: true },
    sensorId: { type: String, required: true },
    type: { type: String, required: true },
    fieldName: { type: String, required: true },
    status: { type: String, default: "ACTIVE" },
    lastReading: { type: String, default: "N/A" },
    createdAt: { type: Date, default: Date.now }
});
const SensorDeviceModel = mongoose.model("sensor_devices", SensorDeviceSchema);

// --- MAIN DB CONNECTION (Cluster A - website data) ---
mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 400000
})
    .then(() => console.log("Main DB connected (Cluster A)"))
    .catch(err => console.log("Main DB connection error:", err));


// --- IOT DB CONNECTION (Cluster B - sensor data) ---
// This is a separate connection object, completely independent from mongoose default
const iotDB = mongoose.createConnection(process.env.MONGO_URI_IOT, {
    serverSelectionTimeoutMS: 400000
});

iotDB.on("connected", () => {
    console.log("IoT DB connected (Cluster B)");
    startSmartIrrigation(iotDB);
});
iotDB.on("error", (err) => console.log("IoT DB connection error:", err));


// --- ROUTES ---

// Pass iotDB into sensorRoutes so it uses the right connection
const sensorRoutes = require("./routes/sensorRoutes")(iotDB);
app.use("/api/sensor-data", sensorRoutes);

// ESP32 posts raw data here (same /data path as before, no firmware change needed)
const espDataRoutes = require("./routes/dataRoutes")(iotDB);
app.use("/data", espDataRoutes);


// ==========================================
//    ALL YOUR EXISTING ROUTES BELOW
//    (copied exactly, nothing changed)
// ==========================================

const pendingChanges = {};

app.post('/signup', async (req, res) => {
    let newUser = null;
    try {
        const { firstName, lastName, username, email, password, phone } = req.body;
        const existingUser = await UserModel.findOne({ email });
        if (existingUser) return res.json({ status: "error", message: "Email already exists" });

        const hashedPassword = await bcrypt.hash(password, 10);
        const code = Math.floor(1000 + Math.random() * 9000).toString();

        newUser = await UserModel.create({
            firstName, lastName, username, email, password: hashedPassword, phone: phone,
            otp: code, otpExpires: Date.now() + 1200000, isVerified: false
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Verify your Account - Smart Irrigation',
            text: `Welcome! Your verification code is: ${code}`
        };

        await transporter.sendMail(mailOptions);
        return res.json({ status: "pending", message: "Verification email sent", email: email });

    } catch (err) {
        if (newUser && newUser._id) await UserModel.findByIdAndDelete(newUser._id);
        if (err.code === 11000 && err.keyPattern && err.keyPattern.username) return res.json({ status: "error", message: "Username is already taken. Please choose another." });
        if (err.code === 11000 && err.keyPattern && err.keyPattern.phone) return res.json({ status: "error", message: "Phone Number is already registered." });
        res.json({ status: "error", message: "Could not register. The email address may be invalid." });
    }
});

app.post('/verify-email', async (req, res) => {
    const { email, otp } = req.body;
    try {
        const user = await UserModel.findOne({ email });
        if (!user) return res.json({ status: "error", message: "User not found or code expired." });
        if (user.isVerified) return res.json({ status: "success", message: "User is already verified" });

        if (user.otp === otp && user.otpExpires > Date.now()) {
            user.isVerified = true;
            user.otp = null;
            user.otpExpires = null;
            await user.save();
            res.json({ status: "success", message: "Email Verified Successfully!" });
        } else {
            res.json({ status: "error", message: "Invalid or Expired Code" });
        }
    } catch (err) {
        res.json({ status: "error", message: err.message });
    }
});

app.post('/resend-otp', async (req, res) => {
    const { email } = req.body;
    try {
        const user = await UserModel.findOne({ email });
        if (!user) return res.json({ status: "expired", message: "Session expired. Please sign up again." });
        if (user.isVerified) return res.json({ status: "success", message: "User is already verified." });

        const newCode = Math.floor(1000 + Math.random() * 9000).toString();
        user.otp = newCode;
        user.otpExpires = Date.now() + 1200000;
        await user.save();

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Resend Verification Code',
            text: `Your new verification code is: ${newCode}`
        };

        await transporter.sendMail(mailOptions);
        return res.json({ status: "success", message: "New code sent!" });
    } catch (err) {
        res.json({ status: "error", message: err.message });
    }
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await UserModel.findOne({ email: email });
        if (user) {
            if (!user.isVerified) return res.json({ status: "error", message: "Please verify your email first!" });
            const isMatch = await bcrypt.compare(password, user.password);
            if (isMatch) {
                res.json({ status: "success", user: user });
            } else {
                res.json({ status: "error", message: "Incorrect password" });
            }
        } else {
            res.json({ status: "error", message: "No user found with this email" });
        }
    } catch (err) {
        res.json({ status: "error", message: err.message });
    }
});

app.post('/request-sensitive-change', async (req, res) => {
    const { email, fieldName, newValue, password } = req.body;
    try {
        const user = await UserModel.findOne({ email });
        if (!user) return res.json({ status: "error", message: "User not found" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.json({ status: "error", message: "Incorrect Password" });

        if (fieldName === 'email') {
            const existing = await UserModel.findOne({ email: newValue });
            if (existing) return res.json({ status: "error", message: "This email is already in use." });
        }

        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        pendingChanges[email] = {
            type: fieldName,
            newData: fieldName === 'password' ? await bcrypt.hash(newValue, 10) : newValue,
            otp: otp,
            expires: Date.now() + 120000
        };

        let targetEmail = fieldName === 'email' ? newValue : user.email;

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: targetEmail,
            subject: "Security Verification Code",
            text: `SECURITY ALERT: You requested to change your ${fieldName}.\nYour verification code is: ${otp}.\nIf this wasn't you, change your password immediately.`
        };

        await transporter.sendMail(mailOptions);
        res.json({ status: "otp_sent", message: `Security code sent to ${targetEmail}` });
    } catch (err) {
        res.json({ status: "error", message: err.message });
    }
});

app.post('/verify-sensitive-change', async (req, res) => {
    const { email, otp } = req.body;
    const pending = pendingChanges[email];

    if (!pending || pending.otp !== otp || Date.now() > pending.expires) {
        return res.json({ status: "error", message: "Invalid or expired code." });
    }

    try {
        const user = await UserModel.findOne({ email });
        if (pending.type === 'email') user.email = pending.newData;
        if (pending.type === 'password') user.password = pending.newData;
        await user.save();
        delete pendingChanges[email];

        res.json({ status: "success", message: "Update successful!", user: user });
    } catch (err) {
        res.json({ status: "error", message: err.message });
    }
});

app.post('/update-profile', async (req, res) => {
    const { email, fieldName, newValue } = req.body;
    try {
        if (fieldName === 'email' || fieldName === 'password') {
            return res.json({ status: "error", message: "Please use the secure change flow for this field." });
        }
        const user = await UserModel.findOne({ email: email });
        if (!user) return res.json({ status: "error", message: "User not found" });

        user[fieldName] = newValue;
        await user.save();
        res.json({ status: "success", user: user });
    } catch (err) {
        if (err.code === 11000) return res.json({ status: "error", message: `This ${fieldName} is already taken by another user.` });
        res.json({ status: "error", message: err.message });
    }
});

app.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    try {
        const user = await UserModel.findOne({ email });
        if (!user) return res.json({ status: "error", message: "User not found" });

        const code = Math.floor(1000 + Math.random() * 9000).toString();
        user.resetOtp = code;
        user.resetOtpExpires = Date.now() + 90000;
        await user.save();

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Password Reset Code',
            text: `Your password reset code is: ${code}. It expires in 90 seconds.`
        };

        await transporter.sendMail(mailOptions);
        return res.json({ status: "success", message: "Email sent" });
    } catch (err) {
        res.json({ status: "error", message: err.message });
    }
});

app.post('/verify-otp', async (req, res) => {
    const { email, otp } = req.body;
    try {
        const user = await UserModel.findOne({ email });
        if (!user) return res.json({ status: "error", message: "User not found" });

        if (user.resetOtp === otp && user.resetOtpExpires > Date.now()) {
            res.json({ status: "success", message: "Code Verified" });
        } else {
            res.json({ status: "error", message: "Invalid or Expired Code" });
        }
    } catch (err) {
        res.json({ status: "error", message: err.message });
    }
});

app.post('/reset-password', async (req, res) => {
    const { email, newPassword } = req.body;
    try {
        const user = await UserModel.findOne({ email });
        if (!user) return res.json({ status: "error", message: "User not found" });

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        user.resetOtp = null;
        user.resetOtpExpires = null;
        await user.save();

        res.json({ status: "success", message: "Password Changed Successfully" });
    } catch (err) {
        res.json({ status: "error", message: err.message });
    }
});

app.post('/api/update-alerts', async (req, res) => {
    try {
        const { email, alerts } = req.body;
        const updatedUser = await UserModel.findOneAndUpdate({ email: email }, { alerts: alerts }, { new: true });
        if (!updatedUser) return res.json({ status: "error", message: "User not found." });
        res.json({ status: "success", message: "Alert preferences updated successfully!", alerts: updatedUser.alerts });
    } catch (err) {
        res.json({ status: "error", message: err.message });
    }
});

// GET /api/user-settings/:email — fetch user's custom thresholds and flow rate
app.get('/api/user-settings/:email', async (req, res) => {
    try {
        const user = await UserModel.findOne({ email: req.params.email });
        if (!user) return res.json({ status: "error", message: "User not found" });
        res.json({
            status: "success",
            data: {
                alerts: user.alerts,
                smartMode: user.smartMode,
                soilCritical: user.soilCritical || 20,
                soilWarning: user.soilWarning || 35,
                tempHigh: user.tempHigh || 38,
                humidityHigh: user.humidityHigh || 85,
                pumpFlowRate: user.pumpFlowRate || 15,
            }
        });
    } catch (err) {
        res.json({ status: "error", message: err.message });
    }
});

// POST /api/user-settings — save thresholds and flow rate
app.post('/api/user-settings', async (req, res) => {
    try {
        const { email, soilCritical, soilWarning, tempHigh, humidityHigh, pumpFlowRate } = req.body;
        const user = await UserModel.findOne({ email });
        if (!user) return res.json({ status: "error", message: "User not found" });

        if (soilCritical !== undefined) user.soilCritical = soilCritical;
        if (soilWarning !== undefined) user.soilWarning = soilWarning;
        if (tempHigh !== undefined) user.tempHigh = tempHigh;
        if (humidityHigh !== undefined) user.humidityHigh = humidityHigh;
        if (pumpFlowRate !== undefined) user.pumpFlowRate = pumpFlowRate;

        await user.save();
        res.json({ status: "success", message: "Settings saved." });
    } catch (err) {
        res.json({ status: "error", message: err.message });
    }
});

app.post('/api/fields/add', async (req, res) => {
    try {
        const { userEmail, fieldName, cropType, areaSize, seedlingStage, soilType } = req.body;
        const newField = await FieldModel.create({
            userEmail, fieldName, cropType, areaSize, seedlingStage, soilType
        });
        res.json({ status: "success", field: newField });
    } catch (err) {
        res.json({ status: "error", message: err.message });
    }
});

// POST /api/fields/counts  — body: { emails: ["a@b.com", "c@d.com"] }
// Returns { "a@b.com": 3, "c@d.com": 1 }
app.post('/api/fields/counts', async (req, res) => {
    try {
        const { emails } = req.body;
        if (!emails || !Array.isArray(emails)) {
            return res.json({ status: "error", message: "Provide emails array" });
        }
        const counts = {};
        await Promise.all(emails.map(async (email) => {
            const count = await FieldModel.countDocuments({ userEmail: email });
            counts[email] = count;
        }));
        res.json({ status: "success", data: counts });
    } catch (err) {
        res.json({ status: "error", message: err.message });
    }
});

app.put('/api/fields/update/:id', async (req, res) => {
    try {
        const { fieldName, cropType, areaSize, seedlingStage, soilType } = req.body;
        const updated = await FieldModel.findByIdAndUpdate(
            req.params.id,
            { fieldName, cropType, areaSize, seedlingStage, soilType },
            { new: true }
        );
        if (!updated) return res.json({ status: "error", message: "Field not found." });
        res.json({ status: "success", field: updated });
    } catch (err) {
        res.json({ status: "error", message: err.message });
    }
});

app.delete('/api/fields/delete/:id', async (req, res) => {
    try {
        const deleted = await FieldModel.findByIdAndDelete(req.params.id);
        if (!deleted) return res.json({ status: "error", message: "Field not found." });
        res.json({ status: "success", message: "Field deleted." });
    } catch (err) {
        res.json({ status: "error", message: err.message });
    }
});

app.get('/api/fields/:email', async (req, res) => {
    try {
        const fields = await FieldModel.find({ userEmail: req.params.email });
        res.json({ status: "success", data: fields });
    } catch (err) {
        res.json({ status: "error", message: err.message });
    }
});

app.get('/api/irrigation-events/:email', async (req, res) => {
    try {
        const events = await IrrigationEventModel.find({ userEmail: req.params.email }).sort({ date: -1 });
        res.json({ status: "success", data: events });
    } catch (err) {
        res.json({ status: "error", message: err.message });
    }
});

app.get('/api/sensors/:email', async (req, res) => {
    try {
        const sensors = await SensorDeviceModel.find({ userEmail: req.params.email }).sort({ createdAt: -1 });
        res.json({ status: "success", data: sensors });
    } catch (err) {
        res.json({ status: "error", message: err.message });
    }
});

app.delete('/api/sensors/delete/:id', async (req, res) => {
    try {
        const deletedSensor = await SensorDeviceModel.findByIdAndDelete(req.params.id);
        if (!deletedSensor) return res.json({ status: "error", message: "Sensor not found." });
        res.json({ status: "success", message: "Sensor removed successfully." });
    } catch (err) {
        res.json({ status: "error", message: err.message });
    }
});

app.delete('/api/delete-my-account/:email', async (req, res) => {
    try {
        const { email } = req.params;
        const deletedUser = await UserModel.findOneAndDelete({ email: email });
        if (!deletedUser) return res.json({ status: "error", message: "User not found." });

        await FieldModel.deleteMany({ userEmail: email });
        await IrrigationEventModel.deleteMany({ userEmail: email });
        await SensorDeviceModel.deleteMany({ userEmail: email });

        res.json({ status: "success", message: "Account and all associated data permanently deleted." });
    } catch (err) {
        res.json({ status: "error", message: err.message });
    }
});

app.get('/admin/users', async (req, res) => {
    try {
        const users = await UserModel.find({}, '-password');
        res.json({ status: "success", data: users });
    } catch (err) {
        res.json({ status: "error", message: err.message });
    }
});

app.delete('/admin/delete-user/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deletedUser = await UserModel.findByIdAndDelete(id);
        if (!deletedUser) return res.json({ status: "error", message: "User not found" });

        await FieldModel.deleteMany({ userEmail: deletedUser.email });
        await IrrigationEventModel.deleteMany({ userEmail: deletedUser.email });
        await SensorDeviceModel.deleteMany({ userEmail: deletedUser.email });

        res.json({ status: "success", message: "User and all associated data deleted successfully" });
    } catch (err) {
        res.json({ status: "error", message: err.message });
    }
});

app.post('/api/admin/notifications/send', async (req, res) => {
    try {
        const { target, header, message, image } = req.body;
        if (target === 'ALL') {
            const users = await UserModel.find({ role: 'user' });
            const notifications = users.map(u => ({ userEmail: u.email, header, message, image }));
            await NotificationModel.insertMany(notifications);
        } else {
            await NotificationModel.create({ userEmail: target, header, message, image });
        }
        res.json({ status: "success", message: "Notification sent successfully!" });
    } catch (err) {
        res.json({ status: "error", message: err.message });
    }
});

// GET /api/admin/stats — aggregate numbers for admin dashboard
app.get('/api/admin/stats', async (req, res) => {
    try {
        const totalFarmers = await UserModel.countDocuments({ role: 'user', isVerified: true });
        const totalFields = await FieldModel.countDocuments();
        const smartModeOn = await UserModel.countDocuments({ role: 'user', smartMode: true });
        const pumpsActive = await UserModel.countDocuments({ role: 'user', pumpStatus: true });

        res.json({
            status: 'success',
            data: { totalFarmers, totalFields, smartModeOn, pumpsActive }
        });
    } catch (err) {
        res.json({ status: 'error', message: err.message });
    }
});

app.get('/api/notifications/:email', async (req, res) => {
    try {
        const notifications = await NotificationModel.find({ userEmail: req.params.email }).sort({ createdAt: -1 });
        res.json({ status: "success", data: notifications });
    } catch (err) {
        res.json({ status: "error", message: err.message });
    }
});

app.put('/api/notifications/read/:id', async (req, res) => {
    try {
        await NotificationModel.findByIdAndUpdate(req.params.id, { isRead: true });
        res.json({ status: "success", message: "Marked as read." });
    } catch (err) {
        res.json({ status: "error", message: err.message });
    }
});

app.get('/api/pump/status/:email', async (req, res) => {
    try {
        const user = await UserModel.findOne({ email: req.params.email });
        if (!user) return res.json({ status: "error", message: "User not found" });

        const today = new Date().toISOString().split('T')[0];
        const lastDate = user.lastRuntimeDate
            ? new Date(user.lastRuntimeDate).toISOString().split('T')[0]
            : null;
        let runtimeSeconds = user.pumpRuntimeTodaySeconds || 0;
        if (lastDate && lastDate !== today) runtimeSeconds = 0;

        res.json({
            status: "success",
            pumpStatus: user.pumpStatus,
            smartMode: user.smartMode,
            irrigationStartedAt: user.irrigationStartedAt || null,
            pumpRuntimeTodaySeconds: runtimeSeconds,
            pumpFlowRate: user.pumpFlowRate || 15,
            // Last 7 days of history for the chart
            pumpRuntimeHistory: user.pumpRuntimeHistory || [],
        });
    } catch (err) {
        res.json({ status: "error", message: err.message });
    }
});

app.post('/api/pump/control', async (req, res) => {
    try {
        const { email, action, state } = req.body;
        const user = await UserModel.findOne({ email });
        if (!user) return res.json({ status: "error", message: "User not found" });

        if (action === 'manual') {
            if (state === true) {
                user.pumpStatus = true;
                user.irrigationStartedAt = new Date();
            } else {
                if (user.irrigationStartedAt) {
                    const sessionSeconds = Math.floor(
                        (Date.now() - new Date(user.irrigationStartedAt).getTime()) / 1000
                    );
                    const today = new Date().toISOString().split('T')[0];
                    const lastDate = user.lastRuntimeDate
                        ? new Date(user.lastRuntimeDate).toISOString().split('T')[0]
                        : null;

                    if (lastDate !== today) user.pumpRuntimeTodaySeconds = 0;
                    user.pumpRuntimeTodaySeconds = (user.pumpRuntimeTodaySeconds || 0) + sessionSeconds;
                    user.lastRuntimeDate = new Date();

                    // ── Write to history array ──────────────────────────────
                    const historyEntry = (user.pumpRuntimeHistory || []).find(h => h.date === today);
                    if (historyEntry) {
                        historyEntry.seconds += sessionSeconds;
                    } else {
                        user.pumpRuntimeHistory = [
                            ...(user.pumpRuntimeHistory || []).slice(-30), // keep max 30 days
                            { date: today, seconds: sessionSeconds }
                        ];
                    }
                }
                user.pumpStatus = false;
                user.irrigationStartedAt = null;
            }
        } else if (action === 'smart') {
            user.smartMode = state;
        }

        await user.save();
        res.json({
            status: "success",
            pumpStatus: user.pumpStatus,
            smartMode: user.smartMode,
            irrigationStartedAt: user.irrigationStartedAt || null,
            pumpRuntimeTodaySeconds: user.pumpRuntimeTodaySeconds || 0,
            pumpFlowRate: user.pumpFlowRate || 15,
            pumpRuntimeHistory: user.pumpRuntimeHistory || [],
        });
    } catch (err) {
        res.json({ status: "error", message: err.message });
    }
});

app.get('/api/user-settings/:email', async (req, res) => {
    try {
        const user = await UserModel.findOne({ email: req.params.email });
        if (!user) return res.json({ status: "error", message: "User not found" });
        res.json({
            status: "success",
            data: {
                alerts: user.alerts,
                smartMode: user.smartMode,
                soilCritical: user.soilCritical ?? 20,
                soilWarning: user.soilWarning ?? 35,
                tempHigh: user.tempHigh ?? 38,
                humidityHigh: user.humidityHigh ?? 85,
                pumpFlowRate: user.pumpFlowRate ?? 15,
            }
        });
    } catch (err) {
        res.json({ status: "error", message: err.message });
    }
});

app.post('/api/user-settings', async (req, res) => {
    try {
        const { email, soilCritical, soilWarning, tempHigh, humidityHigh, pumpFlowRate } = req.body;
        const user = await UserModel.findOne({ email });
        if (!user) return res.json({ status: "error", message: "User not found" });
        if (soilCritical !== undefined) user.soilCritical = soilCritical;
        if (soilWarning !== undefined) user.soilWarning = soilWarning;
        if (tempHigh !== undefined) user.tempHigh = tempHigh;
        if (humidityHigh !== undefined) user.humidityHigh = humidityHigh;
        if (pumpFlowRate !== undefined) user.pumpFlowRate = pumpFlowRate;
        await user.save();
        res.json({ status: "success", message: "Settings saved." });
    } catch (err) {
        res.json({ status: "error", message: err.message });
    }
});

app.get('/api/admin/stats', async (req, res) => {
    try {
        const totalFarmers = await UserModel.countDocuments({ role: 'user', isVerified: true });
        const totalFields = await FieldModel.countDocuments();
        const smartModeOn = await UserModel.countDocuments({ role: 'user', smartMode: true });
        const pumpsActive = await UserModel.countDocuments({ role: 'user', pumpStatus: true });
        res.json({ status: 'success', data: { totalFarmers, totalFields, smartModeOn, pumpsActive } });
    } catch (err) {
        res.json({ status: 'error', message: err.message });
    }
});

app.post('/api/fields/counts', async (req, res) => {
    try {
        const { emails } = req.body;
        if (!emails || !Array.isArray(emails)) return res.json({ status: "error", message: "Provide emails array" });
        const counts = {};
        await Promise.all(emails.map(async (email) => {
            counts[email] = await FieldModel.countDocuments({ userEmail: email });
        }));
        res.json({ status: "success", data: counts });
    } catch (err) {
        res.json({ status: "error", message: err.message });
    }
});

app.get('/api/device/pump-command', async (req, res) => {
    try {
        const { email } = req.query;
        if (!email) return res.status(400).json({ error: "Provide ?email= in query" });
        const user = await UserModel.findOne({ email });
        if (!user) return res.status(404).json({ error: "User not found" });
        res.json({ pump: user.pumpStatus ? 1 : 0, smartMode: user.smartMode ? 1 : 0, email: user.email });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(3001, () => {
    console.log("Server is running on port 3001");
});