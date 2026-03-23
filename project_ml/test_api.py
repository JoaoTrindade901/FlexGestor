# -*- coding: utf-8 -*-
import urllib.request
import json

url = "http://localhost:5000/predict"

dados = {
    "product": "GTX Basic",
    "sales_agent": "Moses Frase",
    "manager": "Dustin Brinkmann",
    "regional_office": "Central",
    "series": "GTX",
    "sector": "technolgy",
    "sales_price": 550,
    "revenue": 1100,
    "employees": 2822,
    "dias_para_fechar": 120
}

body = json.dumps(dados).encode("utf-8")
req = urllib.request.Request(url, data=body, headers={"Content-Type": "application/json"}, method="POST")

with urllib.request.urlopen(req) as resp:
    resultado = json.loads(resp.read())
    print("Resultado:", resultado)