from sklearn.metrics import (
    accuracy_score, precision_score, recall_score,
    f1_score, confusion_matrix, roc_auc_score
)

class Evaluator:
    def avaliar(self, model, X_test, y_test):
        y_pred = model.predict(X_test)
        y_prob = model.predict_proba(X_test)[:, 1]

        metricas = {
            "acuracia":  round(accuracy_score(y_test, y_pred), 4),
            "precisao":  round(precision_score(y_test, y_pred), 4),
            "recall":    round(recall_score(y_test, y_pred), 4),
            "f1":        round(f1_score(y_test, y_pred), 4),
            "roc_auc":   round(roc_auc_score(y_test, y_prob), 4),
        }

        matriz = confusion_matrix(y_test, y_pred)

        return metricas, matriz