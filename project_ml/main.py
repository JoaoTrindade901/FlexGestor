# -*- coding: utf-8 -*-
from Domain.data_loader import DataLoader
from ML.preprocessing import Preprocessor
from ML.training import Trainer
from ML.evaluation import Evaluator
from Persistence.model_repository import ModelRepository

loader = DataLoader()
df = loader.carregar()

preprocessor = Preprocessor()
X, y, features = preprocessor.preprocessar(df)

trainer = Trainer()
model = trainer.treinar(X, y)

evaluator = Evaluator()
metricas, matriz = evaluator.avaliar(model, trainer.X_test, trainer.y_test)

print("Metricas:")
for k, v in metricas.items():
    print(f"  {k}: {v}")
print("Matriz de confusao:")
print(matriz)

# Salva o modelo
repo = ModelRepository()
repo.salvar(model, preprocessor.scaler, features, preprocessor.encoders)

input("Enter para sair...")