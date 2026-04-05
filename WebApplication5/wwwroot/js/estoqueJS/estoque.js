// ===== ESTOQUE.JS — integrado com backend FlexGestor =====

let lista = [];
let listaFiltrada = [];
let filtroTexto = "";
let filtroStatus = "todos";
let etapaProduto = 1;
let categorias = [];

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
// CARREGAR ESTOQUE
// ──────────────────────────────────────────
async function carregarEstoque() {
    try {
        lista = await apiGet("/Estoque/Listar");
        aplicarFiltros();
    } catch (err) {
        mostrarErro("Erro ao carregar estoque: " + err.message);
    }
}

async function carregarCategorias() {
    try {
        categorias = await apiGet("/CategoriaProduto/Listar");
        const sel = document.getElementById("prod-categoria");
        if (!sel) return;
        sel.innerHTML = `<option value="">Selecione...</option>`;
        categorias.filter(c => c.fAtivo).forEach(c => {
            const opt = document.createElement("option");
            opt.value = c.idCategoria;
            opt.textContent = c.nome;
            sel.appendChild(opt);
        });
    } catch (err) {
        console.warn("Categorias indisponíveis:", err.message);
    }
}

// ──────────────────────────────────────────
// STATUS / FILTROS
// ──────────────────────────────────────────
function classificarStatus(item) {
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

function setFiltroStatus(valor) {
    filtroStatus = valor;
    document.querySelectorAll(".btn-status-filtro").forEach(b =>
        b.classList.remove("sel-todos", "sel-critico", "sel-normal"));
    document.getElementById(`btn-filtro-${valor}`)?.classList.add(`sel-${valor}`);
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
// WIZARD NOVO PRODUTO
// ──────────────────────────────────────────
async function abrirModal() {
    etapaProduto = 1;
    document.getElementById("formEstoque").reset();
    esconderErro();
    atualizarEtapas();
    await carregarCategorias();
    document.getElementById("modalEstoque").classList.add("open");
}

function fecharModal(id = "modalEstoque") {
    document.getElementById(id)?.classList.remove("open");
}

function atualizarEtapas() {
    document.querySelectorAll(".etapa").forEach(e => e.classList.remove("ativa"));
    document.getElementById(`etapa-${etapaProduto}`)?.classList.add("ativa");

    document.querySelectorAll(".step").forEach((step, i) => {
        step.classList.toggle("active", i < etapaProduto);
    });

    const btnProximo = document.getElementById("btn-proximo");
    const btnSalvar = document.getElementById("btnSalvar");
    const btnVoltar = document.getElementById("btn-voltar");

    if (btnProximo) btnProximo.style.display = etapaProduto === 3 ? "none" : "inline-flex";
    if (btnSalvar) btnSalvar.style.display = etapaProduto === 3 ? "inline-flex" : "none";
    if (btnVoltar) btnVoltar.style.display = etapaProduto === 1 ? "none" : "inline-flex";
}

function proximaEtapa() {
    if (!validarEtapaAtual()) return;
    if (etapaProduto < 3) { etapaProduto++; atualizarEtapas(); }
}

function voltarEtapa() {
    if (etapaProduto > 1) { etapaProduto--; atualizarEtapas(); }
}

function validarEtapaAtual() {
    esconderErro();
    if (etapaProduto === 1) {
        const nome = document.getElementById("nome")?.value.trim();
        const cod = document.getElementById("codBarras")?.value.trim();
        if (!nome || !cod) {
            mostrarErro("Preencha o Nome e o Código de Barras.");
            return false;
        }
    }
    if (etapaProduto === 2) {
        const qtd = document.getElementById("qtd")?.value;
        const min = document.getElementById("min")?.value;
        if (!qtd || !min) {
            mostrarErro("Preencha a Quantidade Atual e o Estoque Mínimo.");
            return false;
        }
    }
    return true;
}

// ──────────────────────────────────────────
// SALVAR PRODUTO (submit do wizard)
// ──────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {

    document.getElementById("formEstoque")?.addEventListener("submit", async function (e) {
        e.preventDefault();
        if (!validarEtapaAtual()) return;

        const btnSalvar = document.getElementById("btnSalvar");
        const textoOriginal = btnSalvar.innerHTML;
        btnSalvar.disabled = true;
        btnSalvar.innerHTML = '<i class="bi bi-hourglass-split"></i> Salvando...';

        try {
            const nomeProduto = document.getElementById("nome").value.trim();
            const qtdInicial = Number(document.getElementById("qtd")?.value) || 0;
            const estoqueMin = Number(document.getElementById("min")?.value) || 0;

            // 1. Cria o produto
            await apiPost("/Produto/Criar", {
                Nome: nomeProduto,
                Descricao: document.getElementById("descricao")?.value.trim() || null,
                SKU: document.getElementById("codProduto")?.value.trim() || null,
                CodigoBarras: document.getElementById("codBarras").value.trim(),
                PrecoCusto: Number(document.getElementById("precoCusto")?.value) || 0,
                PrecoVenda: Number(document.getElementById("precoVenda")?.value) || 0,
                IdCategoria: document.getElementById("prod-categoria")?.value
                    ? Number(document.getElementById("prod-categoria").value)
                    : null,
                Unidade: document.getElementById("unidade")?.value.trim() || null,
                FAtivo: true
            });

            // 2. Recarrega estoque e acha o produto recém criado pelo nome
            const estoqueAtual = await apiGet("/Estoque/Listar");
            const itemNovo = estoqueAtual.find(i => i.nomeProduto === nomeProduto);

            if (itemNovo) {
                // 3. Movimenta entrada inicial se qtd > 0
                if (qtdInicial > 0) {
                    await apiPost("/Estoque/Movimentar", {
                        IdProduto: itemNovo.idProduto,
                        TipoMovimentacao: "ENTRADA",
                        Quantidade: qtdInicial,
                        Motivo: "Cadastro inicial de produto"
                    });
                }
                // 4. Define estoque mínimo
                if (estoqueMin > 0) {
                    await apiPost("/Estoque/AtualizarMinimo", {
                        IdProduto: itemNovo.idProduto,
                        EstoqueMinimo: estoqueMin
                    });
                }
            }

            fecharModal();
            await carregarEstoque();

        } catch (err) {
            mostrarErro("Erro ao salvar produto: " + err.message);
        } finally {
            btnSalvar.disabled = false;
            btnSalvar.innerHTML = textoOriginal;
        }
    });

});

// ──────────────────────────────────────────
// MODAL MOVIMENTAÇÃO
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

async function salvarMovimentacao() {
    const idProduto = Number(document.getElementById("mov-idProduto").value);
    const tipoMovimentacao = document.getElementById("mov-tipo").value;
    const quantidade = Number(document.getElementById("mov-quantidade").value);
    const motivo = document.getElementById("mov-motivo").value.trim() || null;

    if (!quantidade || quantidade <= 0) { alert("Informe uma quantidade válida."); return; }

    try {
        await apiPost("/Estoque/Movimentar", {
            IdProduto: idProduto, TipoMovimentacao: tipoMovimentacao,
            Quantidade: quantidade, Motivo: motivo
        });
        fecharModalMovimentacao();
        await carregarEstoque();
    } catch (err) {
        alert("Erro ao movimentar: " + err.message);
    }
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

async function salvarMinimo() {
    const idProduto = Number(document.getElementById("min-idProduto").value);
    const estoqueMinimo = Number(document.getElementById("min-valor").value);

    if (isNaN(estoqueMinimo) || estoqueMinimo < 0) { alert("Informe um valor válido."); return; }

    try {
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
["modalEstoque", "modal-movimentacao", "modal-minimo", "modal-confirmar"].forEach(id => {
    document.getElementById(id)?.addEventListener("click", function (e) {
        if (e.target === this) fecharModal(id);
    });
});

// ──────────────────────────────────────────
// INIT
// ──────────────────────────────────────────
document.getElementById("btn-filtro-todos")?.classList.add("sel-todos");
carregarEstoque();