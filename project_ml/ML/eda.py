# -*- coding: utf-8 -*-
import os
import pandas as pd
import matplotlib
matplotlib.use('Agg')  # sem interface grafica
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
import seaborn as sns
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "Data")
OUT_DIR  = os.path.join(BASE_DIR, "static", "charts")
os.makedirs(OUT_DIR, exist_ok=True)

# Tema escuro customizado pro FlexGestor
DARK_BG   = "#0d0f14"
SURFACE   = "#151820"
SURFACE2  = "#1c2030"
BORDER    = "#242840"
TEXT      = "#e8ecf4"
MUTED     = "#6b7491"
ACCENT    = "#4f8eff"
ACCENT2   = "#a78bfa"
SUCCESS   = "#34d399"
WARNING   = "#fbbf24"
DANGER    = "#f87171"

PALETTE = [ACCENT, ACCENT2, SUCCESS, WARNING, DANGER, "#60a5fa", "#f472b6", "#fb923c", "#a3e635", "#38bdf8"]

plt.rcParams.update({
    "figure.facecolor":  DARK_BG,
    "axes.facecolor":    SURFACE,
    "axes.edgecolor":    BORDER,
    "axes.labelcolor":   MUTED,
    "axes.titlecolor":   TEXT,
    "axes.titlesize":    13,
    "axes.labelsize":    11,
    "xtick.color":       MUTED,
    "ytick.color":       MUTED,
    "xtick.labelsize":   9,
    "ytick.labelsize":   9,
    "grid.color":        BORDER,
    "grid.linewidth":    0.6,
    "text.color":        TEXT,
    "legend.facecolor":  SURFACE2,
    "legend.edgecolor":  BORDER,
    "legend.labelcolor": TEXT,
    "font.family":       "sans-serif",
})

def salvar(nome):
    path = os.path.join(OUT_DIR, nome)
    plt.savefig(path, dpi=120, bbox_inches="tight", facecolor=DARK_BG)
    plt.close()
    print(f"Salvo: {path}")

def gerar_todos():
    # Carrega dados
    pipeline = pd.read_csv(os.path.join(DATA_DIR, "sales_pipeline.csv"))
    accounts = pd.read_csv(os.path.join(DATA_DIR, "accounts.csv"))
    products = pd.read_csv(os.path.join(DATA_DIR, "products.csv"))
    teams    = pd.read_csv(os.path.join(DATA_DIR, "sales_teams.csv"))

    df = pipeline.merge(accounts, on="account", how="left")
    df = df.merge(products,  on="product",     how="left")
    df = df.merge(teams,     on="sales_agent", how="left")

    df["engage_date"] = pd.to_datetime(df["engage_date"], errors="coerce")
    df["close_date"]  = pd.to_datetime(df["close_date"],  errors="coerce")
    df["dias"]        = (df["close_date"] - df["engage_date"]).dt.days
    df["mes"]         = df["close_date"].dt.to_period("M")

    won  = df[df["deal_stage"] == "Won"].copy()
    lost = df[df["deal_stage"] == "Lost"].copy()
    fin  = df[df["deal_stage"].isin(["Won", "Lost"])].copy()
    fin["target"] = (fin["deal_stage"] == "Won").astype(int)

    # 1. HISTOGRAMA close_value (Won)
    fig, ax = plt.subplots(figsize=(10, 5))
    ax.hist(won["close_value"].dropna(), bins=30, color=ACCENT, alpha=0.85, edgecolor=DARK_BG)
    ax.axvline(won["close_value"].median(), color=WARNING, linewidth=1.5, linestyle="--", label=f"Mediana: ${won['close_value'].median():,.0f}")
    ax.axvline(won["close_value"].mean(),   color=SUCCESS,  linewidth=1.5, linestyle="--", label=f"Media: ${won['close_value'].mean():,.0f}")
    ax.set_title("Distribuicao de Valor dos Deals Ganhos")
    ax.set_xlabel("Valor (USD)")
    ax.set_ylabel("Frequencia")
    ax.legend()
    ax.grid(axis="y", alpha=0.4)
    salvar("hist_close_value.png")

    #  2. REVENUE POR SETOR (boxplot) 
    fig, ax = plt.subplots(figsize=(12, 5))
    setores = accounts.groupby("sector")["revenue"].median().sort_values(ascending=False).index.tolist()
    sns.boxplot(data=accounts, x="sector", y="revenue", order=setores,
                palette=PALETTE, ax=ax, linewidth=1.2,
                flierprops=dict(marker="o", color=MUTED, markersize=3, alpha=0.5))
    ax.set_title("Distribuicao de Revenue por Setor")
    ax.set_xlabel("Setor")
    ax.set_ylabel("Revenue (M USD)")
    ax.tick_params(axis="x", rotation=35)
    ax.grid(axis="y", alpha=0.4)
    salvar("boxplot_revenue_setor.png")

    #  3. DEALS WON POR MES (linha)
    mensal = won.groupby("mes").size().reset_index(name="count")
    mensal["mes_dt"] = mensal["mes"].dt.to_timestamp()
    fig, ax = plt.subplots(figsize=(12, 5))
    ax.fill_between(mensal["mes_dt"], mensal["count"], alpha=0.15, color=ACCENT)
    ax.plot(mensal["mes_dt"], mensal["count"], color=ACCENT, linewidth=2, marker="o", markersize=4)
    ax.set_title("Deals Won por Mes")
    ax.set_xlabel("Mes")
    ax.set_ylabel("Quantidade")
    ax.xaxis.set_major_formatter(mdates.DateFormatter("%b/%y"))
    ax.xaxis.set_major_locator(mdates.MonthLocator(interval=2))
    plt.xticks(rotation=35)
    ax.grid(alpha=0.4)
    salvar("line_deals_mensal.png")

    #  4. WIN RATE POR AGENTE (barras horizontais
    wr = fin.groupby("sales_agent").agg(won=("target","sum"), total=("target","count")).reset_index()
    wr["taxa"] = (wr["won"] / wr["total"] * 100).round(1)
    wr = wr.sort_values("taxa", ascending=True)
    cores = [SUCCESS if t >= 66 else ACCENT if t >= 63 else DANGER for t in wr["taxa"]]
    fig, ax = plt.subplots(figsize=(10, 10))
    bars = ax.barh(wr["sales_agent"], wr["taxa"], color=cores, edgecolor=DARK_BG, height=0.7)
    for bar, val in zip(bars, wr["taxa"]):
        ax.text(bar.get_width() + 0.3, bar.get_y() + bar.get_height()/2, f"{val}%", va="center", fontsize=8, color=TEXT)
    ax.axvline(wr["taxa"].mean(), color=WARNING, linewidth=1.5, linestyle="--", label=f"Media: {wr['taxa'].mean():.1f}%")
    ax.set_title("Win Rate por Agente de Vendas")
    ax.set_xlabel("Taxa de Conversao (%)")
    ax.set_xlim(50, 78)
    ax.legend()
    ax.grid(axis="x", alpha=0.4)
    salvar("bar_winrate_agente.png")

    # 5. HEATMAP DE CORRELACAO 
    from sklearn.preprocessing import LabelEncoder
    heat = fin[["product","sales_agent","regional_office","series","sales_price","revenue","employees","dias","target"]].copy()
    for col in ["product","sales_agent","regional_office","series"]:
        heat[col] = LabelEncoder().fit_transform(heat[col].astype(str))
    heat = heat.dropna()
    corr = heat.corr()
    fig, ax = plt.subplots(figsize=(10, 8))
    mask = pd.DataFrame(False, index=corr.index, columns=corr.columns)
    for i in range(len(mask)):
        for j in range(i+1, len(mask.columns)):
            mask.iloc[i, j] = True
    sns.heatmap(corr, mask=mask, annot=True, fmt=".2f", ax=ax,
                cmap=sns.diverging_palette(220, 20, as_cmap=True),
                linewidths=0.5, linecolor=BORDER,
                annot_kws={"size": 9},
                cbar_kws={"shrink": 0.8})
    ax.set_title("Heatmap de Correlacao entre Variaveis")
    ax.tick_params(axis="x", rotation=35)
    salvar("heatmap_correlacao.png")

    # 6. HISTOGRAMA TEMPO DE FECHAMENTO
    dias_won = won["dias"].dropna()
    dias_won = dias_won[(dias_won > 0) & (dias_won < 300)]
    fig, ax = plt.subplots(figsize=(10, 5))
    ax.hist(dias_won, bins=40, color=SUCCESS, alpha=0.8, edgecolor=DARK_BG)
    ax.axvline(dias_won.median(), color=WARNING, linewidth=1.5, linestyle="--", label=f"Mediana: {dias_won.median():.0f} dias")
    ax.axvline(dias_won.mean(),   color=ACCENT,  linewidth=1.5, linestyle="--", label=f"Media: {dias_won.mean():.0f} dias")
    ax.set_title("Distribuicao do Tempo de Fechamento (Won)")
    ax.set_xlabel("Dias")
    ax.set_ylabel("Frequencia")
    ax.legend()
    ax.grid(axis="y", alpha=0.4)
    salvar("hist_tempo_fechamento.png")

    #7. WIN RATE POR GERENTE (pizza) 
    wg = fin.groupby("manager").agg(won=("target","sum"), total=("target","count")).reset_index()
    wg["taxa"] = (wg["won"] / wg["total"] * 100).round(1)
    wg = wg.sort_values("taxa", ascending=False)
    fig, ax = plt.subplots(figsize=(10, 5))
    bars = ax.bar(wg["manager"], wg["taxa"], color=PALETTE[:len(wg)], edgecolor=DARK_BG)
    for bar, val in zip(bars, wg["taxa"]):
        ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.2, f"{val}%", ha="center", fontsize=9, color=TEXT)
    ax.set_title("Win Rate por Gerente")
    ax.set_xlabel("Gerente")
    ax.set_ylabel("Taxa de Conversao (%)")
    ax.set_ylim(55, 70)
    ax.grid(axis="y", alpha=0.4)
    salvar("bar_winrate_gerente.png")

    # 8. DISTRIBUICAO DEALS POR ESTAGIO 
    estagios = pipeline["deal_stage"].value_counts()
    fig, ax = plt.subplots(figsize=(8, 5))
    cores_est = [SUCCESS, DANGER, ACCENT, WARNING]
    wedges, texts, autotexts = ax.pie(
        estagios, labels=estagios.index, autopct="%1.1f%%",
        colors=cores_est, startangle=140,
        pctdistance=0.82,
        wedgeprops=dict(edgecolor=DARK_BG, linewidth=2)
    )
    for t in texts: t.set_color(TEXT)
    for t in autotexts: t.set_color(DARK_BG); t.set_fontsize(9); t.set_fontweight("bold")
    ax.set_title("Distribuicao por Estagio do Pipeline")
    salvar("pie_estagios.png")

    # 9. TICKET MEDIO POR PRODUTO
    ticket = won.groupby("product")["close_value"].agg(["mean","median","count"]).reset_index()
    ticket = ticket.sort_values("mean", ascending=True)
    fig, ax = plt.subplots(figsize=(10, 5))
    bars = ax.barh(ticket["product"], ticket["mean"], color=ACCENT2, edgecolor=DARK_BG, height=0.6, label="Media")
    ax.barh(ticket["product"], ticket["median"], color=ACCENT, edgecolor=DARK_BG, height=0.3, alpha=0.8, label="Mediana")
    for bar, val in zip(bars, ticket["mean"]):
        ax.text(bar.get_width() + 20, bar.get_y() + bar.get_height()/2, f"${val:,.0f}", va="center", fontsize=8, color=TEXT)
    ax.set_title("Ticket Medio por Produto (Won)")
    ax.set_xlabel("Valor (USD)")
    ax.legend()
    ax.grid(axis="x", alpha=0.4)
    salvar("bar_ticket_produto.png")

    print("\nTodos os graficos gerados com sucesso!")

if __name__ == "__main__":
    gerar_todos()