import os
import joblib

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(BASE_DIR, "Models")

class ModelRepository:
    def __init__(self):
        os.makedirs(MODELS_DIR, exist_ok=True)

    def salvar(self, model, scaler, features, encoders):
        joblib.dump(model,    os.path.join(MODELS_DIR, "modelo.pkl"))
        joblib.dump(scaler,   os.path.join(MODELS_DIR, "scaler.pkl"))
        joblib.dump(features, os.path.join(MODELS_DIR, "features.pkl"))
        joblib.dump(encoders, os.path.join(MODELS_DIR, "encoders.pkl"))
        print("Modelo salvo em:", MODELS_DIR)

    def carregar(self):
        model    = joblib.load(os.path.join(MODELS_DIR, "modelo.pkl"))
        scaler   = joblib.load(os.path.join(MODELS_DIR, "scaler.pkl"))
        features = joblib.load(os.path.join(MODELS_DIR, "features.pkl"))
        encoders = joblib.load(os.path.join(MODELS_DIR, "encoders.pkl"))
        return model, scaler, features, encoders