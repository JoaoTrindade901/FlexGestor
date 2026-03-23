# -*- coding: utf-8 -*-
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import pandas as pd
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from Persistence.model_repository import ModelRepository

app = Flask(__name__)
CORS(app)

repo = ModelRepository()
model, scaler, features, encoders = repo.carregar()

BASE_DIR   = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHARTS_DIR = os.path.join(BASE_DIR, "static", "charts")
sys.path.append(BASE_DIR)

from ML.eda import gerar_todos

@app.route('/predict', methods=['POST'])
def predict():
    try:
        dados = request.get_json()
        categoricas = ['product', 'sales_agent', 'manager', 'regional_office', 'series', 'sector']
        for col in categoricas:
            if col in dados and col in encoders:
                le = encoders[col]
                valor = dados[col]
                if valor in le.classes_:
                    dados[col] = int(le.transform([valor])[0])
                else:
                    dados[col] = -1
        df = pd.DataFrame([dados], columns=features)
        df = df.fillna(0)
        X = scaler.transform(df)
        predicao = int(model.predict(X)[0])
        probabilidade = round(float(model.predict_proba(X)[0][1]), 4)
        return jsonify({
            "prediction": predicao,
            "resultado": "Won" if predicao == 1 else "Lost",
            "probability": probabilidade
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "features": features})

@app.route('/charts/<filename>') 
def serve_chart(filename):
    return send_from_directory(CHARTS_DIR, filename)

@app.route('/charts/list', methods=['GET'])
def list_charts():
    files = sorted([f for f in os.listdir(CHARTS_DIR) if f.endswith('.png')])
    return jsonify(files)

@app.route('/eda/regenerar', methods=['POST'])
def regenerar_eda():
    try:
        gerar_todos()
        return jsonify({"status": "ok"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)