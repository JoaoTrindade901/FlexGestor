// ===== ESTOQUEHISTORICO.JS — FlexGestor =====

let movimentacoes = [];
let filtrado = [];
let filtroTipo = "todos";
let paginaAtual = 1;
const ITENS_POR_PAGINA = 15;

async function apiGet(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`GET ${url} → ${res.status}`);
    return res.json();
}

async function carregarHistorico() {
    try {
        movimentacoes = await apiGet("/Estoque/ListarMovimentacoes");
        filtrado = [...movimentacoes];
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

    if (!filtrado.length) {
        tbody.innerHTML = `<tr><td colspan="7" class="empty-state">Nenhuma movimentação encontrada.</td></tr>`;
        atualizarInfo(0);
        return;
    }

    const total = filtrado.length;
    const totalPags = Math.ceil(total / ITENS_POR_PAGINA);
    const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
    const pagina = filtrado.slice(inicio, inicio + ITENS_POR_PAGINA);

    // Paginação
    const ini = total === 0 ? 0 : inicio + 1;
    const fim = Math.min(paginaAtual * ITENS_POR_PAGINA, total);
    atualizarInfo(total, ini, fim);

    const ctrl = document.querySelector(".paginacao-controles");
    if (ctrl) {
        ctrl.innerHTML = "";
        const prev = document.createElement("button");
        prev.className = "btn-pagina"; prev.textContent = "‹"; prev.disabled = paginaAtual === 1;
        prev.onclick = () => { paginaAtual--; renderizarHistorico(); };
        ctrl.appendChild(prev);
        for (let i = 1; i <= totalPags; i++) {
            const btn = document.createElement("button");
            btn.className = `btn-pagina${i === paginaAtual ? " ativo" : ""}`;
            btn.textContent = i;
            btn.onclick = () => { paginaAtual = i; renderizarHistorico(); };
            ctrl.appendChild(btn);
        }
        const next = document.createElement("button");
        next.className = "btn-pagina"; next.textContent = "›"; next.disabled = paginaAtual >= totalPags;
        next.onclick = () => { paginaAtual++; renderizarHistorico(); };
        ctrl.appendChild(next);
    }

    tbody.innerHTML = pagina.map(m => {
        const tipoNorm = (m.TipoMovimentacao ?? m.tipoMovimentacao ?? "").toUpperCase();
        const isEntrada = tipoNorm === "ENTRADA";
        const isAjuste = tipoNorm === "AJUSTE";
        const tipoClasse = isAjuste ? "mov-ajuste" : (isEntrada ? "mov-entrada" : "mov-saida");
        const qtdClasse = isAjuste ? "qtd-ajuste" : (isEntrada ? "qtd-entrada" : "qtd-saida");
        const sinal = isEntrada ? "+" : (isAjuste ? "±" : "-");
        const tipoLabel = isAjuste ? "Ajuste" : (isEntrada ? "Entrada" : "Saída");
        const qtd = m.Quantidade ?? m.quantidade ?? 0;
        const nomeProd = m.NomeProduto ?? m.nomeProduto ?? "—";
        const motivo = m.Motivo ?? m.motivo ?? "—";
        const usuario = m.nomeUsuario ?? m.NomeUsuario ?? "—";

        return `<tr>
            <td>${formatarData(m.DthMovimentacao ?? m.dthMovimentacao)}</td>
            <td>${nomeProd}</td>
            <td><span class="badge-mov ${tipoClasse}">${tipoLabel}</span></td>
            <td class="${qtdClasse}">${sinal}${qtd}</td>
            <td>—</td>
            <td>${usuario}</td>
            <td title="${motivo}">${motivo}</td>
        </tr>`;
    }).join("");


}

function atualizarInfo(total, ini, fim) {
    const el = document.querySelector(".paginacao-info");
    if (el) el.textContent = total === 0 ? "Nenhum registro" : `Mostrando ${ini}–${fim} de ${total}`;
}

function formatarData(data) {
    if (!data) return "—";
    const local = data.endsWith("Z") ? data.slice(0, -1) : data;
    return new Date(local).toLocaleString("pt-BR", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit"
    });
}

function setFiltroTipo(valor) {
    filtroTipo = valor;
    document.querySelectorAll(".btn-status-filtro").forEach(b =>
        b.classList.remove("sel-todos", "sel-entrada", "sel-saida", "sel-ajuste"));
    const mapa = { todos: "sel-todos", entrada: "sel-entrada", saida: "sel-saida", ajuste: "sel-ajuste" };
    document.getElementById(`btn-filtro-${valor}`)?.classList.add(mapa[valor] ?? "sel-todos");
    filtrarHistorico();
}

function filtrarHistorico() {
    const termo = (document.getElementById("input-busca")?.value ?? "").toLowerCase().trim();
    const dataInicio = document.getElementById("data-inicio")?.value;
    const dataFim = document.getElementById("data-fim")?.value;

    paginaAtual = 1;
    filtrado = movimentacoes.filter(m => {
        const tipoNorm = (m.TipoMovimentacao ?? m.tipoMovimentacao ?? "").toUpperCase();
        const nomeProd = (m.NomeProduto ?? m.nomeProduto ?? "").toLowerCase();

        if (termo && !nomeProd.includes(termo)) return false;
        if (filtroTipo === "entrada" && tipoNorm !== "ENTRADA") return false;
        if (filtroTipo === "saida" && tipoNorm !== "SAIDA") return false;
        if (filtroTipo === "ajuste" && tipoNorm !== "AJUSTE") return false;

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