import os
import pandas as pd


# caminho raiz do projeto
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# caminho dos arquivos de dados csvs
DATA_DIR = os.path.join(BASE_DIR, "Data")


class DataLoader:
        # faz a leitura dos arquivos e transforma em dataframe
    def carregar(self) -> pd.DataFrame:
        
        pipeline  = pd.read_csv(os.path.join(DATA_DIR, "sales_pipeline.csv"))
        accounts  = pd.read_csv(os.path.join(DATA_DIR, "accounts.csv"))
        products  = pd.read_csv(os.path.join(DATA_DIR, "products.csv"))
        teams     = pd.read_csv(os.path.join(DATA_DIR, "sales_teams.csv"))
        
        # left join entre pipeline e accounts pela coluna account
        # "SELECT * FROM pipeline LEFT JOIN accounts ON pipeline.account = accounts.account"
        df = pipeline.merge(accounts,  on="account",      how="left")
        df = df.merge(products,        on="product",       how="left")
        df = df.merge(teams,           on="sales_agent",   how="left")

        return df