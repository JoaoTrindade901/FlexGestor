// ===== ESTOQUEHISTORICO.JS — integrado com backend FlexGestor =====

// ──────────────────────────────────────────
// ESTADO GLOBAL
// ──────────────────────────────────────────
let movimentacoes = [];
let filtrado = [];

// ──────────────────────────────────────────
// FETCH HELPER
// ──────────────────────────────────────────
async function apiGet(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`GET ${url} → ${res.status}`);
    return res.json();
}

// ──────────────────────────────────────────
// CARREGAR DO BACKEND
// ──────────────────────────────────────────
async function carregarHistorico(idProduto = null) {
    try {
        // GET /Estoque/ListarMovimentacoes?idProduto=X
        // Se não passar idProduto, carrega todas (backend filtra por empresa via sessão)
        const url = idProduto
            ? `/Estoque/ListarMovimentacoes?idProduto=${idProduto}`
            : `/Estoque/ListarMovimentacoes?idProduto=0`;

        movimentacoes = await apiGet(url);
        filtrado = [...movimentacoes];
        renderizarHistorico();
    } catch (err) {
        const tbody = document.getElementById("tbody-historico");
        if (tbody) tbody.innerHTML = `<tr><td colspan="7" class="empty-state">Erro ao carregar movimentações.</td></tr>`;
        console.error(err);
    }
}

// ──────────────────────────────────────────
// RENDER
// ──────────────────────────────────────────
function renderizarHistorico() {
    const tbody = document.getElementById("tbody-historico");
    if (!tbody) return;

    if (filtrado.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="empty-state">Nenhuma movimentação encontrada</td></tr>`;
        return;
    }

    tbody.innerHTML = filtrado.map(m => {
        // TipoMovimentacao vem como "ENTRADA" | "SAIDA" | "AJUSTE" do backend
        const tipoNorm = (m.TipoMovimentacao ?? m.tipoMovimentacao ?? "").toUpperCase();
        const isEntrada = tipoNorm === "ENTRADA";
        const tipoClasse = isEntrada ? "mov-entrada" : "mov-saida";
        const qtdClasse = isEntrada ? "qtd-entrada" : "qtd-saida";
        const sinal = isEntrada ? "+" : "-";
        const tipoLabel = tipoNorm === "AJUSTE" ? "Ajuste" : (isEntrada ? "Entrada" : "Saída");

        return `
        <tr>
            <td>${formatarData(m.DthMovimentacao ?? m.dthMovimentacao)}</td>
            <td>${m.nomeProduto ?? m.NomeProduto ?? "—"}</td>
            <td>
                <span class="badge-mov ${tipoClasse}">${tipoLabel}</span>
            </td>
            <td class="${qtdClasse}">
                ${sinal}${m.Quantidade ?? m.quantidade}
            </td>
            <td>—</td>
            <td>${m.nomeUsuario ?? m.NomeUsuario ?? "—"}</td>
            <td title="${m.Motivo ?? m.motivo ?? ""}">
                ${m.Motivo ?? m.motivo ?? "—"}
            </td>
        </tr>`;
    }).join("");
}

// ──────────────────────────────────────────
// FORMATAÇÃO
// ──────────────────────────────────────────
function formatarData(data) {
    if (!data) return "—";
    return new Date(data).toLocaleDateString("pt-BR");
}

// ──────────────────────────────────────────
// FILTROS (aplicados localmente sobre os dados carregados)
// ──────────────────────────────────────────
function filtrarHistorico() {
    const termo = document.getElementById("input-busca")?.value.toLowerCase() || "";
    const tipo = document.getElementById("filtro-tipo")?.value || "todos";
    const dataInicio = document.getElementById("data-inicio")?.value;
    const dataFim = document.getElementById("data-fim")?.value;

    filtrado = movimentacoes.filter(m => {
        const tipoNorm = (m.TipoMovimentacao ?? m.tipoMovimentacao ?? "").toUpperCase();

        // Tipo
        if (tipo === "entrada" && tipoNorm !== "ENTRADA") return false;
        if (tipo === "saida" && tipoNorm !== "SAIDA") return false;

        // Data início
        if (dataInicio) {
            const inicio = new Date(dataInicio + "T00:00:00");
            const dataMov = new Date(m.DthMovimentacao ?? m.dthMovimentacao);
            if (dataMov < inicio) return false;
        }

        // Data fim
        if (dataFim) {
            const fim = new Date(dataFim + "T23:59:59");
            const dataMov = new Date(m.DthMovimentacao ?? m.dthMovimentacao);
            if (dataMov > fim) return false;
        }

        return true;
    });

    renderizarHistorico();
}

function limparFiltros() {
    document.getElementById("input-busca").value = "";
    document.getElementById("filtro-tipo").value = "todos";
    document.getElementById("data-inicio").value = "";
    document.getElementById("data-fim").value = "";
    filtrado = [...movimentacoes];
    renderizarHistorico();
}

// ──────────────────────────────────────────
// INIT
// ──────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
    carregarHistorico();
});