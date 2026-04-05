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
            <td>${item.local || "—"}</td>
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

// 1. validarEtapaAtual() — adiciona categoria como obrigatória na etapa 1
function validarEtapaAtual() {
    esconderErro();
    if (etapaProduto === 1) {
        const nome = document.getElementById("nome");
        const cod = document.getElementById("codBarras");
        const cat = document.getElementById("prod-categoria");
        let ok = true;

        if (!validarObrigatorio(nome, "Nome")) ok = false;
        if (!validarObrigatorio(cod, "Código de Barras")) ok = false;
        if (!cat.value) {
            marcarErro(cat, "Selecione uma categoria.");
            ok = false;
        } else {
            limparErro(cat);
        }

        if (!ok) flexToast("Preencha os campos obrigatórios antes de continuar.", "aviso");
        return ok;
    }
    if (etapaProduto === 2) {
        const qtd = document.getElementById("qtd");
        const min = document.getElementById("min");
        let ok = true;
        if (!validarObrigatorio(qtd, "Quantidade inicial")) ok = false;
        if (!validarObrigatorio(min, "Estoque mínimo")) ok = false;
        if (!ok) flexToast("Preencha os campos obrigatórios antes de continuar.", "aviso");
        return ok;
    }
    return true;
}

// ──────────────────────────────────────────
// SALVAR PRODUTO (etapa 3 → botão Salvar)
// ──────────────────────────────────────────
async function salvarNovoProduto() {
    const btnSalvar = document.getElementById("btnSalvar");
    const textoOriginal = btnSalvar.innerHTML;

    const nome = document.getElementById("nome")?.value?.trim();
    const codBarras = document.getElementById("codBarras")?.value?.trim();
    const qtdInicial = Number(document.getElementById("qtd")?.value || 0);
    const estoqueMin = Number(document.getElementById("min")?.value || 0);

    if (!nome || !codBarras) {
        mostrarErro("Nome e Código de Barras são obrigatórios.");
        return;
    }

    btnSalvar.disabled = true;
    btnSalvar.innerHTML = '<i class="bi bi-hourglass-split"></i> Salvando...';

    try {
        // 1. Cria produto
        const resProduto = await apiPost("/Produto/Criar", {
            Nome: nome,
            Descricao: document.getElementById("descricao")?.value || null,
            CodigoBarras: codBarras,
            IdCategoria: Number(document.getElementById("prod-categoria")?.value) || null,
            PrecoCusto: Number(document.getElementById("precoCusto")?.value || 0),
            PrecoVenda: Number(document.getElementById("precoVenda")?.value || 0),
            Unidade: document.getElementById("unidade")?.value || null
        });

        const { idProduto } = await resProduto.json();

        // 2. Entrada inicial de estoque
        if (qtdInicial > 0) {
            await apiPost("/Estoque/Movimentar", {
                IdProduto: idProduto,
                TipoMovimentacao: "ENTRADA",
                Quantidade: qtdInicial,
                Motivo: "Estoque inicial"
            });
        }

        // 3. Atualiza estoque mínimo
        if (estoqueMin > 0) {
            await apiPost("/Estoque/AtualizarMinimo", {
                IdProduto: idProduto,
                EstoqueMinimo: estoqueMin
            });
        }

        fecharModal();
        await carregarEstoque();

    } catch (err) {
        mostrarErro("Erro ao cadastrar produto: " + err.message);
    } finally {
        btnSalvar.disabled = false;
        btnSalvar.innerHTML = textoOriginal;
    }
}

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

// 2. salvarMovimentacao() — troca o alert de quantidade inválida
async function salvarMovimentacao() {
    const idProduto = Number(document.getElementById("mov-idProduto").value);
    const tipoMovimentacao = document.getElementById("mov-tipo").value;
    const qtdEl = document.getElementById("mov-quantidade");
    const quantidade = Number(qtdEl.value);
    const motivo = document.getElementById("mov-motivo").value.trim() || null;

    if (!quantidade || quantidade <= 0) {
        marcarErro(qtdEl, "Informe uma quantidade maior que zero.");
        flexToast("Quantidade inválida.", "aviso");
        return;
    }
    limparErro(qtdEl);

    try {
        await apiPost("/Estoque/Movimentar", {
            IdProduto: idProduto,
            TipoMovimentacao: tipoMovimentacao,
            Quantidade: quantidade,
            Motivo: motivo
        });
        fecharModalMovimentacao();
        await carregarEstoque();
        flexToast("Movimentação registrada com sucesso!", "sucesso");
    } catch (err) {
        flexToast("Erro ao movimentar: " + err.message, "erro");
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

// 3. salvarMinimo() — troca o alert de valor inválido
async function salvarMinimo() {
    const idProduto = Number(document.getElementById("min-idProduto").value);
    const minEl = document.getElementById("min-valor");
    const estoqueMinimo = Number(minEl.value);

    if (isNaN(estoqueMinimo) || estoqueMinimo < 0) {
        marcarErro(minEl, "Informe um valor válido (mínimo 0).");
        flexToast("Valor inválido.", "aviso");
        return;
    }
    limparErro(minEl);

    try {
        await apiPost("/Estoque/AtualizarMinimo", {
            IdProduto: idProduto,
            EstoqueMinimo: estoqueMinimo
        });
        fecharModalMinimo();
        await carregarEstoque();
        flexToast("Estoque mínimo atualizado!", "sucesso");
    } catch (err) {
        flexToast("Erro ao atualizar mínimo: " + err.message, "erro");
    }
}
// ──────────────────────────────────────────
// EVENTOS DO WIZARD (botões do footer)
// ──────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("btn-proximo")?.addEventListener("click", proximaEtapa);
    document.getElementById("btn-voltar")?.addEventListener("click", voltarEtapa);
    document.getElementById("btnSalvar")?.addEventListener("click", function (e) {
        e.preventDefault();
        salvarNovoProduto();
    });
});

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