// ===== ESTOQUE.JS — FlexGestor =====

let lista = [];
let listaFiltrada = [];
let filtroTexto = "";
let filtroStatus = "todos";
let fornecedores = [];
let produtosBase = [];
let fornecedorSelecionado = null;
let produtoSelecionado = null;
let etapaInserir = 1;
const TOTAL_ETAPAS = 4;

// Estado do modal configuração
let cfgEtapa = 1;
const CFG_TOTAL_ETAPAS = 2;
let cfgFornecedorSelecionado = null;

// ──────────────────────────────────────────
// HELPERS
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
        const t = await res.text().catch(() => "");
        throw new Error(t || `POST ${url} → ${res.status}`);
    }
    return res;
}

function flexToast(msg, tipo = "sucesso") {
    const cores = { sucesso: "#15803d", erro: "#dc2626", aviso: "#d97706" };
    const icones = { sucesso: "bi-check-circle-fill", erro: "bi-x-circle-fill", aviso: "bi-exclamation-triangle-fill" };
    const t = document.createElement("div");
    t.style.cssText = `position:fixed;top:2rem;right:2rem;background:${cores[tipo]};color:#fff;
        padding:1.2rem 1.8rem;border-radius:.8rem;font-size:1.4rem;font-family:'Segoe UI',sans-serif;
        display:flex;align-items:center;gap:.8rem;box-shadow:0 .6rem 2rem rgba(0,0,0,.2);
        z-index:9999;opacity:0;transform:translateY(-1rem);transition:all .3s ease;max-width:36rem;`;
    t.innerHTML = `<i class="bi ${icones[tipo]}"></i><span>${msg}</span>`;
    document.body.appendChild(t);
    requestAnimationFrame(() => { t.style.opacity = "1"; t.style.transform = "translateY(0)"; });
    setTimeout(() => {
        t.style.opacity = "0"; t.style.transform = "translateY(-1rem)";
        setTimeout(() => t.remove(), 350);
    }, 3200);
}

function formatarData(data) {
    if (!data) return "—";
    return new Date(data).toLocaleDateString("pt-BR");
}

// ──────────────────────────────────────────
// CARREGAR
// ──────────────────────────────────────────
async function carregarEstoque() {
    try {
        lista = await apiGet("/Estoque/Listar");
        aplicarFiltros();
    } catch (err) {
        flexToast("Erro ao carregar estoque: " + err.message, "erro");
    }
}

async function carregarProdutosBase() {
    try {
        const todos = await apiGet("/Produto/Listar");
        produtosBase = todos.filter(p => p.fAtivo === true || p.fAtivo === 1);
    } catch { produtosBase = []; }
}

async function carregarFornecedores() {
    try {
        fornecedores = await apiGet("/Fornecedor/Listar");
    } catch { fornecedores = []; }
}

// ──────────────────────────────────────────
// STATUS
// ──────────────────────────────────────────
function classificarStatus(item) {
    const qtd = item.quantidade ?? 0;
    const min = item.estoqueMinimo ?? 0;
    const max = item.estoqueMax ?? 0;
    if (qtd <= min) return "critico";
    if (max > 0 && qtd > max) return "excesso";
    return "normal";
}

// ──────────────────────────────────────────
// FILTROS
// ──────────────────────────────────────────
function setFiltroStatus(valor) {
    filtroStatus = valor;
    document.querySelectorAll(".btn-status-filtro").forEach(b =>
        b.classList.remove("sel-todos", "sel-critico", "sel-normal", "sel-excesso"));
    document.getElementById(`btn-filtro-${valor}`)?.classList.add(`sel-${valor}`);
    aplicarFiltros();
}

function filtrarTabela() {
    filtroTexto = document.getElementById("input-termo-busca")?.value ?? "";
    aplicarFiltros();
}

function aplicarFiltros() {
    const termo = filtroTexto.toLowerCase();
    listaFiltrada = lista.filter(item => {
        const status = classificarStatus(item);
        if (filtroStatus !== "todos" && status !== filtroStatus) return false;
        if (termo && !(item.nomeProduto ?? "").toLowerCase().includes(termo)) return false;
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

    if (!listaFiltrada.length) {
        tbody.innerHTML = `<tr><td colspan="9" class="empty-state">Nenhum item encontrado.</td></tr>`;
        return;
    }

    tbody.innerHTML = listaFiltrada.map(item => {
        const status = classificarStatus(item);
        const labelSt = { critico: "Crítico", normal: "Normal", excesso: "Excesso" }[status];
        const classSt = `status-${status}`;
        const qtd = item.quantidade ?? 0;
        const qtdClass = status === "critico" ? "qtde-critica" : status === "excesso" ? "qtde-excesso" : "qtde-normal";
        const nome = (item.nomeProduto ?? "").replace(/'/g, "&#39;");
        const min = item.estoqueMinimo ?? 0;
        const max = item.estoqueMax ?? 0;
        const local = (item.local ?? "").replace(/'/g, "&#39;");

        return `<tr>
            <td class="area-acoes">
                <button class="btn-acao btn-editar" title="Movimentar estoque"
                    onclick="abrirModalMovimentacao(${item.idProduto}, '${nome}')">
                    <i class="bi bi-arrow-left-right"></i>
                </button>
                <button class="btn-acao" style="color:#6b7280" title="Configurar estoque"
                    onclick="abrirModalConfiguracao(${item.idProduto}, '${nome}', ${min}, ${max}, '${local}')">
                    <i class="bi bi-bar-chart-fill"></i>
                </button>
            </td>
            <td><span class="status-pill ${classSt}">${labelSt}</span></td>
            <td title="${item.nomeProduto}">${item.nomeProduto}</td>
            <td><strong class="${qtdClass}">${qtd}</strong></td>
            <td>${min}</td>
            <td>${max > 0 ? max : "—"}</td>
            <td>${item.skuProduto || "—"}</td>
            <td>${item.nomeCategoria || "—"}</td>
            <td>${formatarData(item.dthUltimaAtualizacao)}</td>
        </tr>`;
    }).join("");
}

// ──────────────────────────────────────────
// MODAL CONFIGURAÇÃO — WIZARD 2 ETAPAS
// ──────────────────────────────────────────
async function abrirModalConfiguracao(idProduto, nomeProduto, min, max, local) {
    cfgEtapa = 1;
    cfgFornecedorSelecionado = null;

    document.getElementById("cfg-idProduto").value = idProduto;
    document.getElementById("cfg-produto-nome").textContent = nomeProduto;
    document.getElementById("cfg-min").value = min;
    document.getElementById("cfg-max").value = max > 0 ? max : "";
    document.getElementById("cfg-local").value = local || "";
    document.getElementById("cfg-painel-preco").style.display = "none";
    document.getElementById("cfg-preco-compra").value = "";

    await carregarFornecedores();
    renderizarListaCfgFornecedores("");
    cfgAtualizarEtapas();
    document.getElementById("modal-configuracao").classList.add("open");
}

function fecharModalConfiguracao() {
    document.getElementById("modal-configuracao").classList.remove("open");
    cfgFornecedorSelecionado = null;
}

function cfgAtualizarEtapas() {
    for (let i = 1; i <= CFG_TOTAL_ETAPAS; i++)
        document.getElementById(`cfg-etapa-${i}`)?.classList.toggle("ativa", i === cfgEtapa);

    document.querySelectorAll("#modal-configuracao .step").forEach((s, i) =>
        s.classList.toggle("active", i < cfgEtapa));

    const btnVolt = document.getElementById("cfg-btn-voltar");
    const btnProx = document.getElementById("cfg-btn-proximo");
    const btnSalv = document.getElementById("cfg-btn-salvar");

    if (btnVolt) btnVolt.style.display = cfgEtapa === 1 ? "none" : "inline-flex";
    if (btnProx) btnProx.style.display = cfgEtapa === CFG_TOTAL_ETAPAS ? "none" : "inline-flex";
    if (btnSalv) btnSalv.style.display = cfgEtapa === CFG_TOTAL_ETAPAS ? "inline-flex" : "none";
}

function cfgProximaEtapa() {
    if (cfgEtapa < CFG_TOTAL_ETAPAS) { cfgEtapa++; cfgAtualizarEtapas(); }
}

function cfgVoltarEtapa() {
    if (cfgEtapa > 1) { cfgEtapa--; cfgAtualizarEtapas(); }
}

function renderizarListaCfgFornecedores(termo) {
    const container = document.getElementById("cfg-lista-fornecedores");
    if (!container) return;
    const ativos = fornecedores.filter(f =>
        f.fAtivo !== false &&
        (!termo ||
            (f.nomeFantasia ?? "").toLowerCase().includes(termo.toLowerCase()) ||
            (f.cnpj ?? "").includes(termo))
    );
    if (!ativos.length) {
        container.innerHTML = `<div class="wizard-vazio"><i class="bi bi-building-x"></i>
            <span>${fornecedores.length === 0 ? "Nenhum fornecedor cadastrado." : "Nenhum fornecedor encontrado."}</span></div>`;
        return;
    }
    container.innerHTML = ativos.map(f => {
        const sel = cfgFornecedorSelecionado?.idFornecedor === f.idFornecedor;
        return `<div class="wizard-item ${sel ? "selecionado" : ""}" onclick="cfgSelecionarFornecedor(${f.idFornecedor})">
            <div class="wizard-item-check"><i class="bi bi-${sel ? "check-circle-fill" : "circle"}"></i></div>
            <div class="wizard-item-info">
                <div class="wizard-item-nome">${f.nomeFantasia || f.razaoSocial}</div>
                <div class="wizard-item-sub">CNPJ: ${f.cnpj || "—"}</div>
            </div>
        </div>`;
    }).join("");
}

function cfgSelecionarFornecedor(id) {
    const f = fornecedores.find(x => x.idFornecedor === id);
    if (!f) return;
    if (cfgFornecedorSelecionado?.idFornecedor === id) {
        cfgFornecedorSelecionado = null;
        document.getElementById("cfg-painel-preco").style.display = "none";
        document.getElementById("cfg-preco-compra").value = "";
    } else {
        cfgFornecedorSelecionado = { idFornecedor: f.idFornecedor, nomeFantasia: f.nomeFantasia || f.razaoSocial };
        document.getElementById("cfg-painel-preco").style.display = "block";
    }
    renderizarListaCfgFornecedores(document.getElementById("cfg-busca-fornecedor")?.value ?? "");
}

async function salvarConfiguracao() {
    const idProduto = Number(document.getElementById("cfg-idProduto").value);
    const estoqueMin = Number(document.getElementById("cfg-min").value) || 0;
    const estoqueMax = Number(document.getElementById("cfg-max").value) || 0;
    const local = document.getElementById("cfg-local").value.trim() || null;

    const btn = document.getElementById("cfg-btn-salvar");
    btn.disabled = true;
    try {
        await apiPost("/Estoque/AtualizarConfiguracao", {
            IdProduto: idProduto,
            EstoqueMinimo: estoqueMin,
            EstoqueMaximo: estoqueMax,
            Local: local
        });

        if (cfgFornecedorSelecionado) {
            const precoCompra = Number(document.getElementById("cfg-preco-compra")?.value || 0);
            await apiPost("/Estoque/AssociarFornecedor", {
                IdFornecedor: cfgFornecedorSelecionado.idFornecedor,
                IdProduto: idProduto,
                PrecoCompra: precoCompra
            });
        }

        fecharModalConfiguracao();
        await carregarEstoque();
        flexToast("Configuração salva com sucesso!", "sucesso");
    } catch (err) {
        flexToast("Erro ao salvar: " + err.message, "erro");
    } finally {
        btn.disabled = false;
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
    const tipo = document.getElementById("mov-tipo").value;
    const qtd = Number(document.getElementById("mov-quantidade").value);
    const motivo = document.getElementById("mov-motivo").value.trim() || null;
    if (!qtd || qtd <= 0) { flexToast("Informe uma quantidade maior que zero.", "aviso"); return; }
    try {
        await apiPost("/Estoque/Movimentar", { IdProduto: idProduto, TipoMovimentacao: tipo, Quantidade: qtd, Motivo: motivo });
        fecharModalMovimentacao();
        await carregarEstoque();
        flexToast("Movimentação registrada!", "sucesso");
    } catch (err) {
        flexToast("Erro: " + err.message, "erro");
    }
}

// ──────────────────────────────────────────
// WIZARD: INSERIR NO ESTOQUE
// ──────────────────────────────────────────
async function abrirModalInserir() {
    etapaInserir = 1;
    produtoSelecionado = null;
    fornecedorSelecionado = null;
    document.getElementById("formInserir")?.reset();
    document.getElementById("mensagemErro") && (document.getElementById("mensagemErro").style.display = "none");
    document.getElementById("ins-painel-preco") && (document.getElementById("ins-painel-preco").style.display = "none");
    await Promise.all([carregarProdutosBase(), carregarFornecedores()]);
    renderizarListaProdutos("");
    renderizarListaFornecedores("");
    atualizarEtapas();
    document.getElementById("modal-inserir")?.classList.add("open");
}

function fecharModalInserir() {
    document.getElementById("modal-inserir")?.classList.remove("open");
    produtoSelecionado = null;
    fornecedorSelecionado = null;
}

function atualizarEtapas() {
    for (let i = 1; i <= TOTAL_ETAPAS; i++)
        document.getElementById(`ins-etapa-${i}`)?.classList.toggle("ativa", i === etapaInserir);
    document.querySelectorAll("#modal-inserir .step").forEach((s, i) =>
        s.classList.toggle("active", i < etapaInserir));
    const btnProx = document.getElementById("ins-btn-proximo");
    const btnSalv = document.getElementById("ins-btn-salvar");
    const btnVolt = document.getElementById("ins-btn-voltar");
    if (btnProx) btnProx.style.display = etapaInserir === TOTAL_ETAPAS ? "none" : "inline-flex";
    if (btnSalv) btnSalv.style.display = etapaInserir === TOTAL_ETAPAS ? "inline-flex" : "none";
    if (btnVolt) btnVolt.style.display = etapaInserir === 1 ? "none" : "inline-flex";
    if (etapaInserir === TOTAL_ETAPAS) atualizarResumo();
}

function proximaEtapa() {
    if (!validarEtapa()) return;
    if (etapaInserir < TOTAL_ETAPAS) { etapaInserir++; atualizarEtapas(); }
}

function voltarEtapa() {
    if (etapaInserir > 1) { etapaInserir--; atualizarEtapas(); }
}

function validarEtapa() {
    if (etapaInserir === 1 && !produtoSelecionado) {
        flexToast("Selecione um produto para continuar.", "aviso"); return false;
    }
    if (etapaInserir === 2) {
        const qtd = Number(document.getElementById("ins-qtd")?.value);
        if (!qtd || qtd <= 0) { flexToast("Informe a quantidade inicial.", "aviso"); return false; }
    }
    return true;
}

function renderizarListaProdutos(termo) {
    const container = document.getElementById("ins-lista-produtos");
    if (!container) return;
    const filtrados = produtosBase.filter(p =>
        !termo ||
        (p.nome ?? "").toLowerCase().includes(termo.toLowerCase()) ||
        (p.sku ?? "").toLowerCase().includes(termo.toLowerCase())
    );
    if (!filtrados.length) {
        container.innerHTML = `<div class="wizard-vazio"><i class="bi bi-box-seam"></i><span>Nenhum produto encontrado.</span></div>`;
        return;
    }
    container.innerHTML = filtrados.map(p => {
        const sel = produtoSelecionado?.idProduto === p.idProduto;
        return `<div class="wizard-item ${sel ? "selecionado" : ""}" onclick="selecionarProduto(${p.idProduto})">
            <div class="wizard-item-check"><i class="bi bi-${sel ? "check-circle-fill" : "circle"}"></i></div>
            <div class="wizard-item-info">
                <div class="wizard-item-nome">${p.nome}</div>
                <div class="wizard-item-sub">${p.sku ? "SKU: " + p.sku : ""}${p.nomeCategoria ? " · " + p.nomeCategoria : ""}</div>
            </div>
            <span class="wizard-item-valor">R$ ${Number(p.precoVenda ?? 0).toFixed(2).replace(".", ",")}</span>
        </div>`;
    }).join("");
}

function selecionarProduto(id) {
    produtoSelecionado = produtosBase.find(p => p.idProduto === id) ?? null;
    renderizarListaProdutos(document.getElementById("ins-busca-produto")?.value ?? "");
}

function renderizarListaFornecedores(termo) {
    const container = document.getElementById("ins-lista-fornecedores");
    if (!container) return;
    const ativos = fornecedores.filter(f =>
        f.fAtivo !== false &&
        (!termo ||
            (f.nomeFantasia ?? "").toLowerCase().includes(termo.toLowerCase()) ||
            (f.cnpj ?? "").includes(termo))
    );
    if (!ativos.length) {
        container.innerHTML = `<div class="wizard-vazio"><i class="bi bi-building-x"></i>
            <span>${fornecedores.length === 0 ? "Nenhum fornecedor cadastrado." : "Nenhum fornecedor encontrado."}</span></div>`;
        return;
    }
    container.innerHTML = ativos.map(f => {
        const sel = fornecedorSelecionado?.idFornecedor === f.idFornecedor;
        return `<div class="wizard-item ${sel ? "selecionado" : ""}" onclick="selecionarFornecedor(${f.idFornecedor})">
            <div class="wizard-item-check"><i class="bi bi-${sel ? "check-circle-fill" : "circle"}"></i></div>
            <div class="wizard-item-info">
                <div class="wizard-item-nome">${f.nomeFantasia || f.razaoSocial}</div>
                <div class="wizard-item-sub">CNPJ: ${f.cnpj || "—"}</div>
            </div>
        </div>`;
    }).join("");
}

function selecionarFornecedor(id) {
    const f = fornecedores.find(x => x.idFornecedor === id);
    if (!f) return;
    if (fornecedorSelecionado?.idFornecedor === id) {
        fornecedorSelecionado = null;
        document.getElementById("ins-painel-preco").style.display = "none";
        document.getElementById("ins-preco-compra").value = "";
    } else {
        fornecedorSelecionado = { idFornecedor: f.idFornecedor, nomeFantasia: f.nomeFantasia || f.razaoSocial };
        document.getElementById("ins-painel-preco").style.display = "block";
    }
    renderizarListaFornecedores(document.getElementById("ins-busca-fornecedor")?.value ?? "");
}

function atualizarResumo() {
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val ?? "—"; };
    set("ins-resumo-produto", produtoSelecionado?.nome ?? "—");
    set("ins-resumo-sku", produtoSelecionado?.sku ?? "—");
    set("ins-resumo-qtd", document.getElementById("ins-qtd")?.value || "0");
    set("ins-resumo-min", document.getElementById("ins-min")?.value || "0");
    set("ins-resumo-max", document.getElementById("ins-max")?.value || "—");
    set("ins-resumo-local", document.getElementById("ins-local")?.value || "—");
    const blocoForn = document.getElementById("ins-resumo-bloco-forn");
    if (fornecedorSelecionado) {
        set("ins-resumo-fornecedor", fornecedorSelecionado.nomeFantasia);
        const pc = document.getElementById("ins-preco-compra")?.value;
        set("ins-resumo-preco-compra", pc ? `R$ ${Number(pc).toFixed(2).replace(".", ",")}` : "—");
        if (blocoForn) blocoForn.style.display = "";
    } else {
        if (blocoForn) blocoForn.style.display = "none";
    }
}

async function salvarInserirEstoque() {
    const btn = document.getElementById("ins-btn-salvar");
    const original = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="bi bi-hourglass-split"></i> Salvando...';
    const qtd = Number(document.getElementById("ins-qtd")?.value || 0);
    const min = Number(document.getElementById("ins-min")?.value || 0);
    const max = Number(document.getElementById("ins-max")?.value || 0);
    const local = document.getElementById("ins-local")?.value.trim() || null;
    try {
        if (qtd > 0) {
            await apiPost("/Estoque/Movimentar", {
                IdProduto: produtoSelecionado.idProduto,
                TipoMovimentacao: "ENTRADA",
                Quantidade: qtd,
                Motivo: "Inserção inicial no estoque"
            });
        }
        if (min > 0 || max > 0 || local) {
            await apiPost("/Estoque/AtualizarConfiguracao", {
                IdProduto: produtoSelecionado.idProduto,
                EstoqueMinimo: min,
                EstoqueMaximo: max,
                Local: local
            });
        }
        if (fornecedorSelecionado) {
            const precoCompra = Number(document.getElementById("ins-preco-compra")?.value || 0);
            await apiPost("/Estoque/AssociarFornecedor", {
                IdFornecedor: fornecedorSelecionado.idFornecedor,
                IdProduto: produtoSelecionado.idProduto,
                PrecoCompra: precoCompra
            });
        }
        fecharModalInserir();
        await carregarEstoque();
        flexToast("Produto inserido no estoque com sucesso!", "sucesso");
    } catch (err) {
        flexToast("Erro ao inserir: " + err.message, "erro");
    } finally {
        btn.disabled = false;
        btn.innerHTML = original;
    }
}

// ──────────────────────────────────────────
// EVENTOS
// ──────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("ins-btn-proximo")?.addEventListener("click", proximaEtapa);
    document.getElementById("ins-btn-voltar")?.addEventListener("click", voltarEtapa);
    document.getElementById("ins-btn-salvar")?.addEventListener("click", e => { e.preventDefault(); salvarInserirEstoque(); });
    document.getElementById("ins-busca-produto")?.addEventListener("input", function () { renderizarListaProdutos(this.value); });
    document.getElementById("ins-busca-fornecedor")?.addEventListener("input", function () { renderizarListaFornecedores(this.value); });
    document.getElementById("cfg-busca-fornecedor")?.addEventListener("input", function () { renderizarListaCfgFornecedores(this.value); });

    ["modal-inserir", "modal-movimentacao", "modal-configuracao"].forEach(id => {
        document.getElementById(id)?.addEventListener("click", function (e) {
            if (e.target !== this) return;
            if (id === "modal-inserir") fecharModalInserir();
            else if (id === "modal-movimentacao") fecharModalMovimentacao();
            else fecharModalConfiguracao();
        });
    });

    document.getElementById("btn-filtro-todos")?.classList.add("sel-todos");
    carregarEstoque();
});