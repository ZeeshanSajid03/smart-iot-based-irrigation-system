#include <WiFi.h>
#include <HTTPClient.h>
#include <Arduino.h>
#include <ArduinoJson.h>

// ── CONFIGURATION — edit these before flashing ────────────────────────────────

const char* WIFI_SSID         = "";
const char* WIFI_PASSWORD     = "";
const char* DEVICE_USER_EMAIL = "";

// LOCAL  → "http://192.168.x.x:3001"        (find your PC IP with ipconfig)
// DEPLOY → "https://your-app.railway.app"
const char* BASE_URL = "";

// ── SERIAL2 PINS ──────────────────────────────────────────────────────────────
// Arduino SoftwareSerial TX (pin 4) → ESP32 GPIO 16 (RX2)
// Arduino SoftwareSerial RX (pin 3) ← ESP32 GPIO 17 (TX2)
#define RXD2 16
#define TXD2 17

// ── TIMING ────────────────────────────────────────────────────────────────────
unsigned long lastPumpPollTime    = 0;
const unsigned long PUMP_POLL_MS  = 5000;  // Poll pump command every 5 seconds

// ── STATE ─────────────────────────────────────────────────────────────────────
int  lastKnownPumpState  = -1;  // -1 = unknown, 0 = OFF, 1 = ON
int  lastKnownSmartMode  = -1;  // -1 = unknown, 0 = manual, 1 = smart

// ── HELPERS ───────────────────────────────────────────────────────────────────
bool connectWiFi() {
    if (WiFi.status() == WL_CONNECTED) return true;

    Serial.print("Connecting to Wi-Fi");
    WiFi.disconnect();
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

    int tries = 0;
    while (WiFi.status() != WL_CONNECTED && tries < 30) {
        delay(500);
        Serial.print(".");
        tries++;
    }
    Serial.println();

    if (WiFi.status() == WL_CONNECTED) {
        Serial.print("✅ Wi-Fi connected. IP: ");
        Serial.println(WiFi.localIP());
        return true;
    }

    Serial.println("❌ Wi-Fi failed");
    return false;
}

// ── SETUP ─────────────────────────────────────────────────────────────────────
void setup() {
    Serial.begin(115200);
    delay(500);
    Serial2.begin(9600, SERIAL_8N1, RXD2, TXD2);

    Serial.println("\n==============================");
    Serial.println("  Smart Irrigation ESP32");
    Serial.println("==============================");

    connectWiFi();

    // Tell Arduino to start in website-controlled mode
    Serial2.println("MODE:WEB");

    Serial.println("==============================\n");
}

// ── POLL PUMP COMMAND FROM SERVER ─────────────────────────────────────────────
// Calls GET /api/device/pump-command?email=xxx
// Server returns: { "pump": 1|0, "smartMode": 1|0 }
// Sends PUMP:1 or PUMP:0 to Arduino only when state actually changes
void pollPumpCommand() {
    if (!connectWiFi()) return;

    HTTPClient http;

    String url = String(BASE_URL) + "/api/device/pump-command?email=" + DEVICE_USER_EMAIL;
    http.begin(url);
    http.setTimeout(20000);

    int code = http.GET();

    if (code == 200) {
        String body = http.getString();
        Serial.print("🔄 Pump command response: ");
        Serial.println(body);

        // Parse JSON response
        StaticJsonDocument<128> doc;
        DeserializationError err = deserializeJson(doc, body);

        if (!err) {
            int pump      = doc["pump"]      | 0;
            int smartMode = doc["smartMode"] | 0;

            // ── Send MODE command if smartMode changed ────────────────────────
            if (smartMode != lastKnownSmartMode) {
                lastKnownSmartMode = smartMode;
                if (smartMode == 1) {
                    Serial2.println("MODE:WEB");
                    Serial.println("→ Arduino: MODE:WEB (Smart Mode ON)");
                } else {
                    // In manual mode, website toggle still controls via pump command
                    // so keep MODE:WEB — website is still authoritative
                    Serial2.println("MODE:WEB");
                    Serial.println("→ Arduino: MODE:WEB (Manual Mode — website controls)");
                }
            }

            // ── Send PUMP command only if state changed ───────────────────────
            // This avoids hammering the relay with the same command every 5s
            if (pump != lastKnownPumpState) {
                lastKnownPumpState = pump;
                if (pump == 1) {
                    Serial2.println("PUMP:1");
                    Serial.println("→ Arduino: PUMP:1 (Pump ON)");
                } else {
                    Serial2.println("PUMP:0");
                    Serial.println("→ Arduino: PUMP:0 (Pump OFF)");
                }
            } else {
                Serial.println("→ Pump state unchanged, no command sent");
            }
        } else {
            Serial.print("❌ JSON parse error: ");
            Serial.println(err.c_str());
        }
    } else {
        Serial.print("❌ Pump poll failed — HTTP ");
        Serial.println(code);

        // Server unreachable — switch Arduino to local moisture-based control
        // as a failsafe so the farm doesn't go unwatered
        if (lastKnownSmartMode != -2) {  // -2 = already sent failsafe
            Serial2.println("MODE:LOCAL");
            Serial.println("→ Arduino: MODE:LOCAL (server unreachable, local fallback)");
            lastKnownSmartMode = -2;
        }
    }

    http.end();
}

// ── POST SENSOR DATA TO SERVER ────────────────────────────────────────────────
void postSensorData(String jsonFromArduino) {
    if (!connectWiFi()) {
        Serial.println("⚠️  No Wi-Fi — sensor data not sent this cycle");
        return;
    }

    // Inject userEmail into the JSON
    // Arduino sends:  {"temperature":28.5, ...}
    // We produce:     {"userEmail":"x@x.com","temperature":28.5, ...}
    String jsonToSend = "{\"userEmail\":\"";
    jsonToSend += DEVICE_USER_EMAIL;
    jsonToSend += "\",";
    jsonToSend += jsonFromArduino.substring(1); // strip leading "{"

    HTTPClient http;
    String url = String(BASE_URL) + "/api/sensor-data";
    http.begin(url);
    http.addHeader("Content-Type", "application/json");
    http.setTimeout(10000);

    int code = http.POST(jsonToSend);

    if (code > 0) {
        Serial.print("✅ Sensor data posted — HTTP ");
        Serial.println(code);
    } else {
        Serial.print("❌ Sensor post failed — ");
        Serial.println(http.errorToString(code));
    }

    http.end();
}

// ── LOOP ──────────────────────────────────────────────────────────────────────
void loop() {

    // ── 1. POLL PUMP COMMAND FROM SERVER (every 5 seconds) ───────────────────
    if (millis() - lastPumpPollTime >= PUMP_POLL_MS) {
        lastPumpPollTime = millis();
        pollPumpCommand();
    }

    // ── 2. READ SENSOR DATA FROM ARDUINO (non-blocking) ──────────────────────
    if (Serial2.available()) {
        String jsonFromArduino = Serial2.readStringUntil('\n');
        jsonFromArduino.trim();

        if (jsonFromArduino.length() > 5 && jsonFromArduino.startsWith("{")) {
            Serial.println("📥 Sensor data from Arduino:");
            Serial.println(jsonFromArduino);
            postSensorData(jsonFromArduino);
        }
    }

    // Small yield to prevent watchdog resets
    delay(10);
}