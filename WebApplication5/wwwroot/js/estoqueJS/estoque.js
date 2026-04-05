// ===== ESTOQUE.JS — integrado com backend FlexGestor =====

// ──────────────────────────────────────────
// ESTADO GLOBAL
// ──────────────────────────────────────────
let lista = [];
let listaFiltrada = [];
let itemParaAcao = null;
let filtroTexto = "";
let filtroStatus = "todos";
let etapaAtual = 1;

// ──────────────────────────────────────────
// FETCH HELPERS
// ──────────────────────────────────────────
async function apiGet(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`GET ${url} → ${res.status}`);
    return res.json();
}

async function apiPost(url, body) {
    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });
    if (!res.ok) {
        const texto = await res.text().catch(() => "");
        throw new Error(texto || `POST ${url} → ${res.status}`);
    }
    return res;
}

function mostrarErro(msg) {
    const el = document.getElementById("mensagemErro");
    if (!el) return;
    el.textContent = msg;
    el.style.display = "block";
}

function esconderErro() {
    const el = document.getElementById("mensagemErro");
    if (el) el.style.display = "none";
}

// ──────────────────────────────────────────
// CARREGAR DADOS
// ──────────────────────────────────────────
async function carregarEstoque() {
    try {
        // GET /Estoque/Listar → IEnumerable<EstoqueListaGridDto>
        lista = await apiGet("/Estoque/Listar");
        aplicarFiltros();
    } catch (err) {
        mostrarErro("Erro ao carregar estoque: " + err.message);
    }
}

// ──────────────────────────────────────────
// CLASSIFICAÇÃO DE STATUS
// ──────────────────────────────────────────
function classificarStatus(item) {
    // EstoqueListaGridDto tem: quantidade, estoqueMinimo, estoqueCritico
    if (item.estoqueCritico) return "critico";
    return "normal";
}

function labelStatus(status) {
    return { normal: "Normal", critico: "Crítico" }[status] ?? status;
}

function formatarData(data) {
    if (!data) return "—";
    return new Date(data).toLocaleDateString("pt-BR");
}

// ──────────────────────────────────────────
// FILTROS
// ──────────────────────────────────────────
function setFiltroStatus(valor) {
    filtroStatus = valor;
    document.querySelectorAll(".btn-status-filtro").forEach(b =>
        b.classList.remove("sel-todos", "sel-critico", "sel-normal"));
    const mapa = { todos: "sel-todos", critico: "sel-critico", normal: "sel-normal" };
    document.getElementById(`btn-filtro-${valor}`)?.classList.add(mapa[valor]);
    aplicarFiltros();
}

function filtrarTabela() {
    filtroTexto = document.getElementById("input-termo-busca").value;
    aplicarFiltros();
}

function aplicarFiltros() {
    const termo = filtroTexto.toLowerCase();
    listaFiltrada = lista.filter(item => {
        const status = classificarStatus(item);
        if (filtroStatus === "critico" && status !== "critico") return false;
        if (filtroStatus === "normal" && status !== "normal") return false;
        if (termo && !item.nomeProduto.toLowerCase().includes(termo)) return false;
        return true;
    });
    renderizarTabela();
}

// ──────────────────────────────────────────
// TABELA
// ──────────────────────────────────────────
function renderizarTabela() {
    const tbody = document.querySelector("#tabela-estoque tbody");
    if (!tbody) return;

    if (listaFiltrada.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="empty-state">Nenhum item encontrado</td></tr>`;
        return;
    }

    tbody.innerHTML = listaFiltrada.map(item => {
        const status = classificarStatus(item);
        return `
        <tr>
            <td class="area-acoes">
                <button class="btn-acao btn-editar" title="Movimentar"
                    onclick="abrirModalMovimentacao(${item.idProduto}, '${item.nomeProduto.replace(/'/g, "&#39;")}')">
                    <i class="bi bi-arrow-left-right"></i>
                </button>
                <button class="btn-acao btn-editar" title="Editar estoque mínimo"
                    onclick="abrirModalMinimo(${item.idProduto}, ${item.estoqueMinimo})">
                    <i class="bi bi-pencil-fill"></i>
                </button>
            </td>
            <td><span class="status-pill status-${status}">${labelStatus(status)}</span></td>
            <td title="${item.nomeProduto}">${item.nomeProduto}</td>
            <td>${item.quantidade}</td>
            <td>${item.estoqueMinimo}</td>
            <td>${item.skuProduto || "—"}</td>
            <td>${item.nomeCategoria || "—"}</td>
            <td>${formatarData(item.dthUltimaAtualizacao)}</td>
        </tr>`;
    }).join("");
}

// ──────────────────────────────────────────
// MODAL MOVIMENTAÇÃO (ENTRADA / SAÍDA / AJUSTE)
// ──────────────────────────────────────────
function abrirModalMovimentacao(idProduto, nomeProduto) {
    document.getElementById("mov-produto-nome").textContent = nomeProduto;
    document.getElementById("mov-idProduto").value = idProduto;
    document.getElementById("mov-tipo").value = "ENTRADA";
    document.getElementById("mov-quantidade").value = "";
    document.getElementById("mov-motivo").value = "";
    document.getElementById("modal-movimentacao").classList.add("open");
}

function fecharModalMovimentacao() {
    document.getElementById("modal-movimentacao").classList.remove("open");
}

// ──────────────────────────────────────────
// MODAL ESTOQUE MÍNIMO
// ──────────────────────────────────────────
function abrirModalMinimo(idProduto, minimoAtual) {
    document.getElementById("min-idProduto").value = idProduto;
    document.getElementById("min-valor").value = minimoAtual;
    document.getElementById("modal-minimo").classList.add("open");
}

function fecharModalMinimo() {
    document.getElementById("modal-minimo").classList.remove("open");
}

// ──────────────────────────────────────────
// SALVAR MOVIMENTAÇÃO
// ──────────────────────────────────────────
async function salvarMovimentacao() {
    const idProduto = Number(document.getElementById("mov-idProduto").value);
    const tipoMovimentacao = document.getElementById("mov-tipo").value;
    const quantidade = Number(document.getElementById("mov-quantidade").value);
    const motivo = document.getElementById("mov-motivo").value.trim() || null;

    if (!quantidade || quantidade <= 0) {
        alert("Informe uma quantidade válida.");
        return;
    }

    try {
        // POST /Estoque/Movimentar → MovimentacaoEstoqueModel
        await apiPost("/Estoque/Movimentar", {
            IdProduto: idProduto,
            TipoMovimentacao: tipoMovimentacao,
            Quantidade: quantidade,
            Motivo: motivo
        });
        fecharModalMovimentacao();
        await carregarEstoque();
    } catch (err) {
        alert("Erro ao movimentar: " + err.message);
    }
}

// ──────────────────────────────────────────
// SALVAR ESTOQUE MÍNIMO
// ──────────────────────────────────────────
async function salvarMinimo() {
    const idProduto = Number(document.getElementById("min-idProduto").value);
    const estoqueMinimo = Number(document.getElementById("min-valor").value);

    if (isNaN(estoqueMinimo) || estoqueMinimo < 0) {
        alert("Informe um valor válido.");
        return;
    }

    try {
        // POST /Estoque/AtualizarMinimo → AtualizarMinimoDto
        await apiPost("/Estoque/AtualizarMinimo", { IdProduto: idProduto, EstoqueMinimo: estoqueMinimo });
        fecharModalMinimo();
        await carregarEstoque();
    } catch (err) {
        alert("Erro ao atualizar mínimo: " + err.message);
    }
}

// ──────────────────────────────────────────
// FECHAR CLICANDO FORA
// ──────────────────────────────────────────
["modal-movimentacao", "modal-minimo"].forEach(id => {
    document.getElementById(id)?.addEventListener("click", function (e) {
        if (e.target === this) this.classList.remove("open");
    });
});

// ──────────────────────────────────────────
// INIT
// ──────────────────────────────────────────
document.getElementById("btn-filtro-todos")?.classList.add("sel-todos");
carregarEstoque();