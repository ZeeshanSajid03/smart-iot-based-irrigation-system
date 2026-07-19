# from flask import Flask, request, jsonify
# from flask_cors import CORS
# import pandas as pd
# import joblib
# import os

# app = Flask(__name__)
# CORS(app)

# MODEL_PATH = os.path.join(os.path.dirname(__file__), "irrigation_rf_model.pkl")
# model = joblib.load(MODEL_PATH)
# FEATURE_NAMES = model.feature_names_in_.tolist()

# print(f"Model loaded successfully. Expects {len(FEATURE_NAMES)} features.")
# print("Feature columns:", FEATURE_NAMES)


# @app.route("/", methods=["GET"])
# def health():
#     return jsonify({
#         "status": "ok",
#         "message": "AI Irrigation Service is running"
#     })


# @app.route("/features", methods=["GET"])
# def features():
#     """Debug route — confirms exact feature columns model expects."""
#     return jsonify({
#         "feature_names": FEATURE_NAMES,
#         "count": len(FEATURE_NAMES)
#     })


# @app.route("/predict", methods=["POST"])
# def predict():
#     """
#     Expects JSON:
#     {
#         "crop_id":        "Wheat",
#         "soil_type":      "Sandy Soil",
#         "seedling_stage": "Germination",
#         "MOI":            450,
#         "temp":           28.5,
#         "humidity":       60.2
#     }
#     Returns:
#     {
#         "prediction":  1,
#         "confidence":  0.87,
#         "message":     "Irrigate"
#     }
#     """
#     try:
#         body = request.get_json()
#         if not body:
#             return jsonify({"error": "No JSON body received"}), 400

#         # Validate required fields
#         required = ["crop_id", "soil_type", "seedling_stage", "MOI", "temp", "humidity"]
#         missing = [f for f in required if f not in body]
#         if missing:
#             return jsonify({"error": f"Missing fields: {missing}"}), 400

#         # Build one-row DataFrame with exact column names used during training
#         raw = pd.DataFrame([{
#             "crop ID":        str(body["crop_id"]),
#             "soil_type":      str(body["soil_type"]),
#             "Seedling Stage": str(body["seedling_stage"]),
#             "MOI":            float(body["MOI"]),
#             "temp":           float(body["temp"]),
#             "humidity":       float(body["humidity"]),
#         }])

#         # Apply get_dummies — same transformation as training
#         encoded = pd.get_dummies(
#             raw,
#             columns=["crop ID", "soil_type", "Seedling Stage"]
#         )

#         # Align to exact training columns
#         # Any dummy column not present in this row gets filled with 0
#         encoded = encoded.reindex(columns=FEATURE_NAMES, fill_value=0)

#         # Predict
#         prediction = int(model.predict(encoded)[0])
#         probabilities = model.predict_proba(encoded)[0]
#         confidence = round(float(max(probabilities)), 4)

#         print(
#             f"[Predict] crop={body['crop_id']} soil={body['soil_type']} "
#             f"stage={body['seedling_stage']} MOI={body['MOI']} "
#             f"temp={body['temp']} humidity={body['humidity']} "
#             f"→ prediction={prediction} confidence={confidence}"
#         )

#         return jsonify({
#             "prediction": prediction,
#             "confidence": confidence,
#             "message": "Irrigate" if prediction == 1 else "No irrigation needed"
#         })

#     except ValueError as e:
#         return jsonify({"error": f"Invalid numeric value: {str(e)}"}), 400
#     except Exception as e:
#         print(f"Prediction error: {e}")
#         return jsonify({"error": str(e)}), 500


# if __name__ == "__main__":
#     port = int(os.environ.get("PORT", 5001))
#     app.run(host="0.0.0.0", port=port, debug=False)

from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import joblib
import os

app = Flask(__name__)
CORS(app)

MODEL_PATH = os.path.join(os.path.dirname(__file__), "irrigation_rf_model.pkl")
model = joblib.load(MODEL_PATH)
FEATURE_NAMES = model.feature_names_in_.tolist()

print(f"Model loaded. Expects {len(FEATURE_NAMES)} features.")


@app.route("/", methods=["GET"])
def health():
    return jsonify({"status": "ok", "message": "AI Irrigation Service is running"})


@app.route("/features", methods=["GET"])
def features():
    return jsonify({"feature_names": FEATURE_NAMES, "count": len(FEATURE_NAMES)})


@app.route("/predict", methods=["POST"])
def predict():
    try:
        body = request.get_json()
        if not body:
            return jsonify({"error": "No JSON body received"}), 400

        required = ["crop_id", "soil_type", "seedling_stage", "MOI", "temp", "humidity"]
        missing = [f for f in required if f not in body]
        if missing:
            return jsonify({"error": f"Missing fields: {missing}"}), 400

        raw = pd.DataFrame([{
            "crop ID":        str(body["crop_id"]),
            "soil_type":      str(body["soil_type"]),
            "Seedling Stage": str(body["seedling_stage"]),
            "MOI":            float(body["MOI"]),
            "temp":           float(body["temp"]),
            "humidity":       float(body["humidity"]),
        }])

        encoded = pd.get_dummies(raw, columns=["crop ID", "soil_type", "Seedling Stage"])
        encoded = encoded.reindex(columns=FEATURE_NAMES, fill_value=0)

        prediction   = int(model.predict(encoded)[0])
        probabilities = model.predict_proba(encoded)[0]
        confidence   = round(float(max(probabilities)), 4)

        print(f"[Predict] crop={body['crop_id']} soil={body['soil_type']} "
              f"stage={body['seedling_stage']} MOI={body['MOI']} "
              f"temp={body['temp']} humidity={body['humidity']} "
              f"→ prediction={prediction} confidence={confidence}")

        return jsonify({
            "prediction": prediction,
            "confidence": confidence,
            "message":    "Irrigate" if prediction == 1 else "No irrigation needed"
        })

    except ValueError as e:
        return jsonify({"error": f"Invalid numeric value: {str(e)}"}), 400
    except Exception as e:
        print(f"Prediction error: {e}")
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    app.run(host="0.0.0.0", port=port, debug=False)