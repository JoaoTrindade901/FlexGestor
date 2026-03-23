import pandas as pd
from sklearn.preprocessing import LabelEncoder, StandardScaler

class Preprocessor:
    def __init__(self):
        self.scaler = StandardScaler()
        self.encoders = {}

    def preprocessar(self, df: pd.DataFrame):
        # 1. Filtra só deals finalizados
        df = df[df['deal_stage'].isin(['Won', 'Lost'])].copy()

        # 2. Cria target
        df['target'] = (df['deal_stage'] == 'Won').astype(int)

        # 3. Cria feature de dias ate fechar (engage_date ate close_date)
        df['engage_date'] = pd.to_datetime(df['engage_date'])
        df['close_date']  = pd.to_datetime(df['close_date'])
        df['dias_para_fechar'] = (df['close_date'] - df['engage_date']).dt.days

        # 4. Seleciona features — SEM close_value (seria trapaça)
        features = [
            'product', 'sales_agent', 'manager',
            'regional_office', 'series', 'sales_price',
            'sector', 'revenue', 'employees',
            'dias_para_fechar'
        ]

        df = df[features + ['target']].copy()

        # 5. Preenche nulos
        for col in df.select_dtypes(include='number').columns:
            df[col] = df[col].fillna(df[col].median())

        for col in df.select_dtypes(include='object').columns:
            df[col] = df[col].fillna('Desconhecido')

        # 6. Label Encoding nas categoricas
        categoricas = ['product', 'sales_agent', 'manager', 'regional_office', 'series', 'sector']
        for col in categoricas:
            le = LabelEncoder()
            df[col] = le.fit_transform(df[col])
            self.encoders[col] = le

        # 7. Separa X e y
        X = df.drop('target', axis=1)
        y = df['target']

        # 8. Normaliza
        X_scaled = self.scaler.fit_transform(X)

        return X_scaled, y, X.columns.tolist()