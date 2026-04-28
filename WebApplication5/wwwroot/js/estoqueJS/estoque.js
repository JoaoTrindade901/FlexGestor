// ===== ESTOQUE.JS — integrado com backend FlexGestor =====

let lista = [];
let listaFiltrada = [];
let filtroTexto = "";
let filtroStatus = "todos";
let etapaProduto = 1;
const TOTAL_ETAPAS = 4;
let categorias = [];
let fornecedores = [];

// Modo edição: null = novo produto, objeto = produto sendo editado
let modoEdicao = null;

// Fornecedor selecionado no passo 3
let fornecedorSelecionado = null;

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

async function carregarFornecedores() {
    try {
        fornecedores = await apiGet("/Fornecedor/Listar");
    } catch (err) {
        console.warn("Fornecedores indisponíveis:", err.message);
        fornecedores = [];
    }
}

// Busca dados completos do produto para preencher a wizard de edição
async function buscarProdutoPorId(idProduto) {
    try {
        const todos = await apiGet("/Produto/Listar");
        return todos.find(p => p.idProduto === idProduto) ?? null;
    } catch {
        return null;
    }
}

// ──────────────────────────────────────────
// STATUS / FILTROS
// ──────────────────────────────────────────
function classificarStatus(item) {
    return item.estoqueCritico ? "critico" : "normal";
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
                <button class="btn-acao btn-editar" title="Editar produto"
                    onclick="abrirModalEdicao(${item.idProduto})">
                    <i class="bi bi-pencil-fill"></i>
                </button>
                <button class="btn-acao btn-editar" title="Movimentar estoque"
                    onclick="abrirModalMovimentacao(${item.idProduto}, '${item.nomeProduto.replace(/'/g, "&#39;")}')">
                    <i class="bi bi-arrow-left-right"></i>
                </button>
                <button class="btn-acao btn-editar" title="Editar estoque mínimo"
                    onclick="abrirModalMinimo(${item.idProduto}, ${item.estoqueMinimo})">
                    <i class="bi bi-bar-chart-fill"></i>
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
// WIZARD — MODAL (NOVO OU EDIÇÃO)
// ──────────────────────────────────────────
async function abrirModal() {
    modoEdicao = null;
    etapaProduto = 1;
    fornecedorSelecionado = null;

    // Atualiza título e label do botão salvar
    const header = document.querySelector("#modalEstoque .modal-header h3");
    if (header) header.innerHTML = `<i class="bi bi-plus-circle-fill"></i> Novo Produto`;
    const btnSalvar = document.getElementById("btnSalvar");
    if (btnSalvar) btnSalvar.innerHTML = `<i class="bi bi-check-lg"></i> Confirmar e Salvar`;

    document.getElementById("formEstoque").reset();
    esconderErro();
    limparSelecaoFornecedor();
    await Promise.all([carregarCategorias(), carregarFornecedores()]);
    renderizarListaFornecedores("");
    atualizarEtapas();
    document.getElementById("modalEstoque").classList.add("open");
}

async function abrirModalEdicao(idProduto) {
    // Busca o item do estoque para pegar nome/categoria
    const itemEstoque = lista.find(i => i.idProduto === idProduto);
    if (!itemEstoque) return;

    modoEdicao = { idProduto };
    etapaProduto = 1;
    fornecedorSelecionado = null;

    document.getElementById("formEstoque").reset();
    esconderErro();
    limparSelecaoFornecedor();

    await Promise.all([carregarCategorias(), carregarFornecedores()]);

    // Atualiza título
    const header = document.querySelector("#modalEstoque .modal-header h3");
    if (header) header.innerHTML = `<i class="bi bi-pencil-fill"></i> Editar Produto`;
    const btnSalvar = document.getElementById("btnSalvar");
    if (btnSalvar) btnSalvar.innerHTML = `<i class="bi bi-check-lg"></i> Salvar Alterações`;

    // Tenta buscar dados completos do produto
    const produto = await buscarProdutoPorId(idProduto);

    if (produto) {
        // Preenche etapa 1
        document.getElementById("nome").value = produto.nome ?? itemEstoque.nomeProduto ?? "";
        document.getElementById("descricao").value = produto.descricao ?? "";
        document.getElementById("codBarras").value = produto.codigoBarras ?? "";
        document.getElementById("codProduto").value = produto.sku ?? itemEstoque.skuProduto ?? "";
        document.getElementById("precoCusto").value = produto.precoCusto ?? "";
        document.getElementById("precoVenda").value = produto.precoVenda ?? "";
        document.getElementById("unidade").value = produto.unidade ?? "";

        // Categoria
        if (produto.idCategoria) {
            const sel = document.getElementById("prod-categoria");
            if (sel) sel.value = produto.idCategoria;
        }

        // Preenche etapa 2 com dados do estoque
        document.getElementById("qtd").value = itemEstoque.quantidade ?? 0;
        document.getElementById("min").value = itemEstoque.estoqueMinimo ?? 0;
        document.getElementById("max").value = itemEstoque.estoqueMax ?? "";
        document.getElementById("local").value = itemEstoque.local ?? "";
    } else {
        // Fallback: preenche o que tem no item do estoque
        document.getElementById("nome").value = itemEstoque.nomeProduto ?? "";
        document.getElementById("codProduto").value = itemEstoque.skuProduto ?? "";
        document.getElementById("qtd").value = itemEstoque.quantidade ?? 0;
        document.getElementById("min").value = itemEstoque.estoqueMinimo ?? 0;
    }

    renderizarListaFornecedores("");
    atualizarEtapas();
    document.getElementById("modalEstoque").classList.add("open");
}

function fecharModal(id = "modalEstoque") {
    document.getElementById(id)?.classList.remove("open");
    modoEdicao = null;
}

function atualizarEtapas() {
    for (let i = 1; i <= TOTAL_ETAPAS; i++) {
        const el = document.getElementById(`etapa-${i}`);
        if (el) el.classList.toggle("ativa", i === etapaProduto);
    }

    document.querySelectorAll(".step").forEach((step, i) => {
        step.classList.toggle("active", i < etapaProduto);
    });

    const btnProximo = document.getElementById("btn-proximo");
    const btnSalvar = document.getElementById("btnSalvar");
    const btnVoltar = document.getElementById("btn-voltar");

    if (btnProximo) btnProximo.style.display = etapaProduto === TOTAL_ETAPAS ? "none" : "inline-flex";
    if (btnSalvar) btnSalvar.style.display = etapaProduto === TOTAL_ETAPAS ? "inline-flex" : "none";
    if (btnVoltar) btnVoltar.style.display = etapaProduto === 1 ? "none" : "inline-flex";

    if (etapaProduto === TOTAL_ETAPAS) atualizarResumo();
}

function proximaEtapa() {
    if (!validarEtapaAtual()) return;
    if (etapaProduto < TOTAL_ETAPAS) {
        etapaProduto++;
        atualizarEtapas();
    }
}

function voltarEtapa() {
    if (etapaProduto > 1) {
        etapaProduto--;
        atualizarEtapas();
    }
}

// ──────────────────────────────────────────
// VALIDAÇÃO POR ETAPA
// ──────────────────────────────────────────
function validarEtapaAtual() {
    esconderErro();

    if (etapaProduto === 1) {
        const nome = document.getElementById("nome");
        const cod = document.getElementById("codBarras");
        const cat = document.getElementById("prod-categoria");
        let ok = true;

        if (!nome?.value?.trim()) { marcarErroSimples(nome, "Nome é obrigatório."); ok = false; }
        // Na edição, código de barras pode não ser obrigatório se já existe
        if (!modoEdicao && !cod?.value?.trim()) { marcarErroSimples(cod, "Código de Barras é obrigatório."); ok = false; }
        if (!cat?.value) { marcarErroSimples(cat, "Selecione uma categoria."); ok = false; }

        if (!ok) flexToast("Preencha os campos obrigatórios antes de continuar.", "aviso");
        return ok;
    }

    if (etapaProduto === 2) {
        // Na edição, campos de estoque não são obrigatórios (vai só atualizar se alterar)
        return true;
    }

    return true;
}

function marcarErroSimples(el, msg) {
    if (!el) return;
    el.style.borderColor = "#dc2626";
    el.style.boxShadow = "0 0 0 0.3rem rgba(220,38,38,0.12)";
    const wrapper = el.closest(".form-group") ?? el.parentElement;
    let span = wrapper?.querySelector(".val-msg");
    if (!span) {
        span = document.createElement("span");
        span.className = "val-msg";
        span.style.cssText = "display:block;font-size:1.1rem;color:#dc2626;margin-top:0.3rem;";
        wrapper?.appendChild(span);
    }
    span.textContent = msg;
    el.addEventListener("input", () => {
        el.style.borderColor = "";
        el.style.boxShadow = "";
        span.remove();
    }, { once: true });
}

// ──────────────────────────────────────────
// PASSO 3 — FORNECEDOR
// ──────────────────────────────────────────
function renderizarListaFornecedores(termo) {
    const container = document.getElementById("lista-fornecedores");
    if (!container) return;

    const ativos = fornecedores.filter(f =>
        f.fAtivo !== false &&
        (!termo || f.nomeFantasia?.toLowerCase().includes(termo.toLowerCase()) ||
            f.cnpj?.includes(termo))
    );

    if (ativos.length === 0) {
        container.innerHTML = `
            <div class="forn-vazio">
                <i class="bi bi-building-x"></i>
                <span>${fornecedores.length === 0
                ? 'Nenhum fornecedor cadastrado. Cadastre em Cadastros → Fornecedores.'
                : 'Nenhum fornecedor encontrado para esse termo.'}</span>
            </div>`;
        return;
    }

    container.innerHTML = ativos.map(f => {
        const selecionado = fornecedorSelecionado?.idFornecedor === f.idFornecedor;
        return `
        <div class="forn-item ${selecionado ? 'selecionado' : ''}"
             onclick="selecionarFornecedor(${f.idFornecedor})">
            <div class="forn-check">
                <i class="bi bi-${selecionado ? 'check-circle-fill' : 'circle'}"></i>
            </div>
            <div class="forn-info">
                <span class="forn-nome">${f.nomeFantasia || f.razaoSocial}</span>
                <span class="forn-cnpj">CNPJ: ${f.cnpj || "—"}</span>
            </div>
        </div>`;
    }).join("");
}

function selecionarFornecedor(id) {
    const f = fornecedores.find(x => x.idFornecedor === id);
    if (!f) return;

    if (fornecedorSelecionado?.idFornecedor === id) {
        limparSelecaoFornecedor();
    } else {
        fornecedorSelecionado = {
            idFornecedor: f.idFornecedor,
            nomeFantasia: f.nomeFantasia || f.razaoSocial
        };
        document.getElementById("painel-preco-compra").style.display = "block";
    }

    const termo = document.getElementById("busca-fornecedor")?.value ?? "";
    renderizarListaFornecedores(termo);
}

function limparSelecaoFornecedor() {
    fornecedorSelecionado = null;
    const painel = document.getElementById("painel-preco-compra");
    if (painel) painel.style.display = "none";
    const input = document.getElementById("preco-compra");
    if (input) input.value = "";
}

// ──────────────────────────────────────────
// PASSO 4 — RESUMO
// ──────────────────────────────────────────
function atualizarResumo() {
    const set = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val ?? "—";
    };

    set("resumo-nome", document.getElementById("nome")?.value || "—");
    set("resumo-cod", document.getElementById("codBarras")?.value || (modoEdicao ? "(sem alteração)" : "—"));
    set("resumo-qtd", document.getElementById("qtd")?.value || "0");
    set("resumo-min", document.getElementById("min")?.value || "0");

    const catSel = document.getElementById("prod-categoria");
    set("resumo-categoria", catSel?.options[catSel.selectedIndex]?.text || "—");

    const pv = document.getElementById("precoVenda")?.value;
    set("resumo-preco-venda", pv ? `R$ ${Number(pv).toFixed(2).replace(".", ",")}` : "—");

    const blocoForn = document.getElementById("resumo-bloco-fornecedor");
    if (fornecedorSelecionado) {
        const pc = document.getElementById("preco-compra")?.value;
        set("resumo-fornecedor", fornecedorSelecionado.nomeFantasia);
        set("resumo-preco-compra", pc ? `R$ ${Number(pc).toFixed(2).replace(".", ",")}` : "—");
        if (blocoForn) blocoForn.style.display = "";
    } else {
        if (blocoForn) blocoForn.style.display = "none";
    }
}

// ──────────────────────────────────────────
// SALVAR — NOVO OU EDIÇÃO
// ──────────────────────────────────────────
async function salvarNovoProduto() {
    if (modoEdicao) {
        await salvarEdicaoProduto();
    } else {
        await salvarCriacaoProduto();
    }
}

async function salvarCriacaoProduto() {
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

        if (qtdInicial > 0) {
            await apiPost("/Estoque/Movimentar", {
                IdProduto: idProduto,
                TipoMovimentacao: "ENTRADA",
                Quantidade: qtdInicial,
                Motivo: "Estoque inicial"
            });
        }

        if (estoqueMin > 0) {
            await apiPost("/Estoque/AtualizarMinimo", {
                IdProduto: idProduto,
                EstoqueMinimo: estoqueMin
            });
        }

        if (fornecedorSelecionado) {
            const precoCompra = Number(document.getElementById("preco-compra")?.value || 0);
            await apiPost("/Estoque/AssociarFornecedor", {
                IdFornecedor: fornecedorSelecionado.idFornecedor,
                IdProduto: idProduto,
                PrecoCompra: precoCompra
            });
        }

        fecharModal();
        await carregarEstoque();
        flexToast("Produto cadastrado com sucesso!", "sucesso");

    } catch (err) {
        mostrarErro("Erro ao cadastrar produto: " + err.message);
    } finally {
        btnSalvar.disabled = false;
        btnSalvar.innerHTML = textoOriginal;
    }
}

async function salvarEdicaoProduto() {
    const btnSalvar = document.getElementById("btnSalvar");
    const textoOriginal = btnSalvar.innerHTML;

    const idProduto = modoEdicao.idProduto;
    const nome = document.getElementById("nome")?.value?.trim();

    if (!nome) {
        mostrarErro("Nome do produto é obrigatório.");
        return;
    }

    btnSalvar.disabled = true;
    btnSalvar.innerHTML = '<i class="bi bi-hourglass-split"></i> Salvando...';

    try {
        // Editar dados do produto
        await apiPost("/Produto/Editar", {
            IdProduto: idProduto,
            Nome: nome,
            Descricao: document.getElementById("descricao")?.value || null,
            CodigoBarras: document.getElementById("codBarras")?.value?.trim() || null,
            SKU: document.getElementById("codProduto")?.value?.trim() || null,
            IdCategoria: Number(document.getElementById("prod-categoria")?.value) || null,
            PrecoCusto: Number(document.getElementById("precoCusto")?.value || 0),
            PrecoVenda: Number(document.getElementById("precoVenda")?.value || 0),
            Unidade: document.getElementById("unidade")?.value || null
        });

        // Atualiza estoque mínimo se informado
        const estoqueMin = Number(document.getElementById("min")?.value);
        if (!isNaN(estoqueMin) && estoqueMin >= 0) {
            await apiPost("/Estoque/AtualizarMinimo", {
                IdProduto: idProduto,
                EstoqueMinimo: estoqueMin
            });
        }

        // Associa fornecedor se selecionado
        if (fornecedorSelecionado) {
            const precoCompra = Number(document.getElementById("preco-compra")?.value || 0);
            await apiPost("/Estoque/AssociarFornecedor", {
                IdFornecedor: fornecedorSelecionado.idFornecedor,
                IdProduto: idProduto,
                PrecoCompra: precoCompra
            });
        }

        fecharModal();
        await carregarEstoque();
        flexToast("Produto atualizado com sucesso!", "sucesso");

    } catch (err) {
        mostrarErro("Erro ao atualizar produto: " + err.message);
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

async function salvarMovimentacao() {
    const idProduto = Number(document.getElementById("mov-idProduto").value);
    const tipoMovimentacao = document.getElementById("mov-tipo").value;
    const qtdEl = document.getElementById("mov-quantidade");
    const quantidade = Number(qtdEl.value);
    const motivo = document.getElementById("mov-motivo").value.trim() || null;

    if (!quantidade || quantidade <= 0) {
        marcarErroSimples(qtdEl, "Informe uma quantidade maior que zero.");
        flexToast("Quantidade inválida.", "aviso");
        return;
    }

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

async function salvarMinimo() {
    const idProduto = Number(document.getElementById("min-idProduto").value);
    const minEl = document.getElementById("min-valor");
    const estoqueMinimo = Number(minEl.value);

    if (isNaN(estoqueMinimo) || estoqueMinimo < 0) {
        marcarErroSimples(minEl, "Informe um valor válido (mínimo 0).");
        flexToast("Valor inválido.", "aviso");
        return;
    }

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
// EVENTOS DO WIZARD
// ──────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("btn-proximo")?.addEventListener("click", proximaEtapa);
    document.getElementById("btn-voltar")?.addEventListener("click", voltarEtapa);
    document.getElementById("btnSalvar")?.addEventListener("click", function (e) {
        e.preventDefault();
        salvarNovoProduto();
    });

    document.getElementById("busca-fornecedor")?.addEventListener("input", function () {
        renderizarListaFornecedores(this.value);
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