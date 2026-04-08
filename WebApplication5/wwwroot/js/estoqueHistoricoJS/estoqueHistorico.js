// ===== ESTOQUEHISTORICO.JS — integrado com backend FlexGestor =====

let movimentacoes = [];
let filtrado = [];

async function apiGet(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`GET ${url} → ${res.status}`);
    return res.json();
}

async function carregarHistorico() {
    try {
        movimentacoes = await apiGet("/Estoque/ListarMovimentacoes");
        filtrado = [...movimentacoes];
        renderizarHistorico();
    } catch (err) {
        const tbody = document.getElementById("tbody-historico");
        if (tbody) tbody.innerHTML = `<tr><td colspan="7" class="empty-state">Erro ao carregar movimentações.</td></tr>`;
        console.error(err);
    }
}

function renderizarHistorico() {
    const tbody = document.getElementById("tbody-historico");
    if (!tbody) return;

    if (filtrado.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="empty-state">Nenhuma movimentação encontrada</td></tr>`;
        return;
    }

    tbody.innerHTML = filtrado.map(m => {
        const tipoNorm = (m.TipoMovimentacao ?? m.tipoMovimentacao ?? "").toUpperCase();
        const isEntrada = tipoNorm === "ENTRADA";
        const tipoClasse = isEntrada ? "mov-entrada" : "mov-saida";
        const qtdClasse = isEntrada ? "qtd-entrada" : "qtd-saida";
        const sinal = isEntrada ? "+" : "-";
        const tipoLabel = tipoNorm === "AJUSTE" ? "Ajuste" : (isEntrada ? "Entrada" : "Saída");
        const nomeProd = m.nomeProduto ?? m.NomeProduto ?? "—";
        const motivo = m.Motivo ?? m.motivo ?? "—";

        return `
        <tr>
            <td>${formatarData(m.DthMovimentacao ?? m.dthMovimentacao)}</td>
            <td>${nomeProd}</td>
            <td><span class="badge-mov ${tipoClasse}">${tipoLabel}</span></td>
            <td class="${qtdClasse}">${sinal}${m.Quantidade ?? m.quantidade}</td>
            <td>—</td>
            <td>${m.nomeUsuario ?? m.NomeUsuario ?? "—"}</td>
            <td title="${motivo}">${motivo}</td>
        </tr>`;
    }).join("");
}

function formatarData(data) {
    if (!data) return "—";
    return new Date(data).toLocaleDateString("pt-BR");
}

function filtrarHistorico() {
    const termo = (document.getElementById("input-busca")?.value ?? "").toLowerCase().trim();
    const tipo = document.getElementById("filtro-tipo")?.value || "todos";
    const dataInicio = document.getElementById("data-inicio")?.value;
    const dataFim = document.getElementById("data-fim")?.value;

    filtrado = movimentacoes.filter(m => {
        const tipoNorm = (m.TipoMovimentacao ?? m.tipoMovimentacao ?? "").toUpperCase();
        const nomeProd = (m.nomeProduto ?? m.NomeProduto ?? "").toLowerCase();

        // filtro por nome do produto
        if (termo && !nomeProd.includes(termo)) return false;

        // filtro por tipo
        if (tipo === "entrada" && tipoNorm !== "ENTRADA") return false;
        if (tipo === "saida" && tipoNorm !== "SAIDA") return false;

        // filtro por data início
        if (dataInicio) {
            const inicio = new Date(dataInicio + "T00:00:00");
            const dataMov = new Date(m.DthMovimentacao ?? m.dthMovimentacao);
            if (dataMov < inicio) return false;
        }

        // filtro por data fim
        if (dataFim) {
            const fim = new Date(dataFim + "T23:59:59");
            const dataMov = new Date(m.DthMovimentacao ?? m.dthMovimentacao);
            if (dataMov > fim) return false;
        }

        return true;
    });

    renderizarHistorico();
} 

document.addEventListener("DOMContentLoaded", () => {
    carregarHistorico();
}); 