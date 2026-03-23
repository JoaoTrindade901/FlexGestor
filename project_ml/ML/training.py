from sklearn.ensemble import GradientBoostingClassifier
from sklearn.model_selection import train_test_split

class Trainer:
    def __init__(self):
        self.model = GradientBoostingClassifier(
            n_estimators=200,
            learning_rate=0.05,
            max_depth=10,
            random_state=42
        )
        self.X_train = None
        self.X_test  = None
        self.y_train = None
        self.y_test  = None

    def treinar(self, X, y):
        self.X_train, self.X_test, self.y_train, self.y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        self.model.fit(self.X_train, self.y_train)
        return self.model


    xgbost