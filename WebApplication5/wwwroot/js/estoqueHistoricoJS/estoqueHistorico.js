// ===== ESTOQUEHISTORICO.JS — integrado com backend FlexGestor =====

let movimentacoes = [];
let filtrado = [];
let filtroTipo = "todos";

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
        // Inicializa filtro de status visual
        setFiltroTipo("todos");
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
        const isAjuste = tipoNorm === "AJUSTE";

        // Classe e label do badge
        let tipoClasse, tipoLabel;
        if (isAjuste) {
            tipoClasse = "mov-ajuste";
            tipoLabel = "Ajuste";
        } else if (isEntrada) {
            tipoClasse = "mov-entrada";
            tipoLabel = "Entrada";
        } else {
            tipoClasse = "mov-saida";
            tipoLabel = "Saída";
        }

        // Quantidade: Ajuste sem sinal, Entrada com +, Saída com -
        let qtdClasse, qtdLabel;
        const qtd = m.Quantidade ?? m.quantidade;
        if (isAjuste) {
            qtdClasse = "qtd-ajuste";
            qtdLabel = String(qtd);          // sem sinal
        } else if (isEntrada) {
            qtdClasse = "qtd-entrada";
            qtdLabel = `+${qtd}`;
        } else {
            qtdClasse = "qtd-saida";
            qtdLabel = `-${qtd}`;
        }

        const nomeProd = m.nomeProduto ?? m.NomeProduto ?? "—";
        const motivo = m.Motivo ?? m.motivo ?? "—";

        return `
        <tr>
            <td>${formatarData(m.DthMovimentacao ?? m.dthMovimentacao)}</td>
            <td>${nomeProd}</td>
            <td><span class="badge-mov ${tipoClasse}">${tipoLabel}</span></td>
            <td class="${qtdClasse}">${qtdLabel}</td>
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

// ──────────────────────────────────────────
// FILTRO DE STATUS (TIPO) — botões no topo
// ──────────────────────────────────────────
function setFiltroTipo(valor) {
    filtroTipo = valor;

    // Atualiza visual dos botões de status
    document.querySelectorAll(".btn-status-filtro").forEach(b =>
        b.classList.remove("sel-todos", "sel-entrada", "sel-saida", "sel-ajuste"));

    const mapa = {
        todos: "sel-todos",
        entrada: "sel-entrada",
        saida: "sel-saida",
        ajuste: "sel-ajuste"
    };
    document.getElementById(`btn-filtro-${valor}`)?.classList.add(mapa[valor] ?? "sel-todos");

    filtrarHistorico();
}

function filtrarHistorico() {
    const termo = (document.getElementById("input-busca")?.value ?? "").toLowerCase().trim();
    const tipoSel = document.getElementById("filtro-tipo")?.value || "todos";
    const dataInicio = document.getElementById("data-inicio")?.value;
    const dataFim = document.getElementById("data-fim")?.value;

    // O filtro de tipo pode vir tanto do select quanto do botão — usa o mais restritivo
    const tipoFinal = filtroTipo !== "todos" ? filtroTipo : tipoSel;

    filtrado = movimentacoes.filter(m => {
        const tipoNorm = (m.TipoMovimentacao ?? m.tipoMovimentacao ?? "").toUpperCase();
        const nomeProd = (m.nomeProduto ?? m.NomeProduto ?? "").toLowerCase();

        if (termo && !nomeProd.includes(termo)) return false;

        if (tipoFinal === "entrada" && tipoNorm !== "ENTRADA") return false;
        if (tipoFinal === "saida" && tipoNorm !== "SAIDA") return false;
        if (tipoFinal === "ajuste" && tipoNorm !== "AJUSTE") return false;

        if (dataInicio) {
            const inicio = new Date(dataInicio + "T00:00:00");
            const dataMov = new Date(m.DthMovimentacao ?? m.dthMovimentacao);
            if (dataMov < inicio) return false;
        }

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