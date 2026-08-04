#include <DHT.h>
#include <SoftwareSerial.h>

#define DHTPIN 2
#define DHTTYPE DHT11
#define SOIL1 A0
#define RELAY_PIN 7
#define GREEN_LED 10
#define YELLOW_LED 11
#define RED_LED 12

SoftwareSerial espSerial(3, 4);
DHT dht(DHTPIN, DHTTYPE);

#define SOIL_DRY_VALUE 1023
#define SOIL_WET_VALUE 300

bool websiteControlled = true;
bool websitePumpCommand = false;
float moistureThresholdPct = 40.0;

float tempMin = 5.0, tempMax = 50.0;
float humMin = 10.0, humMax = 99.0;

float prevPct1 = -1.0;

unsigned long lastSendTime = 0;
const unsigned long SEND_INTERVAL = 5000;

float rawToMoisturePct(int raw) {
    raw = constrain(raw, SOIL_WET_VALUE, SOIL_DRY_VALUE);
    float pct = (float)(SOIL_DRY_VALUE - raw) /
                (float)(SOIL_DRY_VALUE - SOIL_WET_VALUE) * 100.0;
    return constrain(pct, 1.0, 100.0);
}

int stableAnalogRead(int pin) {
    analogRead(pin);
    delay(10);
    long sum = 0;
    for (int i = 0; i < 5; i++) {
        sum += analogRead(pin);
        delay(5);
    }
    return (int)(sum / 5);
}

void applyPump(bool on) {
    digitalWrite(RELAY_PIN, on ? LOW : HIGH);
    Serial.println(on ? "RELAY: ON" : "RELAY: OFF");
}

void readCommands() {
    while (espSerial.available()) {
        String cmd = espSerial.readStringUntil('\n');
        cmd.trim();
        if (cmd.length() == 0) continue;

        Serial.print("[CMD] "); Serial.println(cmd);

        if (cmd == "PUMP:1") {
            websitePumpCommand = true;
            if (websiteControlled) applyPump(true);
        }
        else if (cmd == "PUMP:0") {
            websitePumpCommand = false;
            if (websiteControlled) applyPump(false);
        }
        else if (cmd == "MODE:WEB") {
            websiteControlled = true;
            applyPump(websitePumpCommand);
            Serial.println("[MODE] Website control");
        }
        else if (cmd == "MODE:LOCAL") {
            websiteControlled = false;
            Serial.println("[MODE] Local control");
        }
    }
}

void setup() {
    Serial.begin(9600);
    espSerial.begin(9600);
    dht.begin();

    pinMode(RELAY_PIN, OUTPUT);
    pinMode(GREEN_LED, OUTPUT);
    pinMode(YELLOW_LED, OUTPUT);
    pinMode(RED_LED, OUTPUT);

    applyPump(false);
    Serial.println("Arduino Ready");
}

void loop() {
    readCommands();

    if (millis() - lastSendTime >= SEND_INTERVAL) {
        lastSendTime = millis();

        int rawSoil1 = stableAnalogRead(SOIL1);
        float soilPct1 = rawToMoisturePct(rawSoil1);

        float temp = dht.readTemperature();
        float hum = dht.readHumidity();

        bool sensorErr = false;
        bool outOfRange = false;
        bool soilOk = true;

        if (isnan(temp) || isnan(hum)) {
            sensorErr = true;
            temp = 0; hum = 0;
        }

        bool v1 = (rawSoil1 >= 50 && rawSoil1 <= 1020);
        if (!v1) { soilOk = false; sensorErr = true; }

        if (prevPct1 >= 0 && abs(soilPct1 - prevPct1) > 30.0) {
            v1 = false; sensorErr = true;
        }
        prevPct1 = soilPct1;

        if (!sensorErr) {
            if (temp < tempMin || temp > tempMax ||
                hum < humMin || hum > humMax) {
                outOfRange = true;
            }
        }

        if (!websiteControlled) {
            applyPump(v1 && soilPct1 < moistureThresholdPct);
        }

        bool pumpNow = (digitalRead(RELAY_PIN) == LOW);

        if (sensorErr) { digitalWrite(RED_LED,HIGH); digitalWrite(YELLOW_LED,LOW); digitalWrite(GREEN_LED,LOW); }
        else if (outOfRange) { digitalWrite(RED_LED,LOW); digitalWrite(YELLOW_LED,HIGH); digitalWrite(GREEN_LED,LOW); }
        else { digitalWrite(RED_LED,LOW); digitalWrite(YELLOW_LED,LOW); digitalWrite(GREEN_LED,HIGH); }

        Serial.print("RAW:"); Serial.print(rawSoil1);
        Serial.print(" PCT:"); Serial.println(soilPct1);

        
        String json = "{";
        json += "\"temperature\":" + String(temp, 1) + ",";
        json += "\"humidity\":" + String(hum, 1) + ",";
        json += "\"soil1\":" + String(soilPct1, 1) + ",";
        json += "\"soilsensor\":" + String(soilOk ? "true" : "false") + ",";
        json += "\"pump\":" + String(pumpNow ? "true" : "false");
        json += "}";

        espSerial.println(json);
        Serial.println(json);

        readCommands();
    }
}