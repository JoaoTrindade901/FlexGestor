// ===== PRODUTO.JS — FlexGestor (com dados fiscais) =====

const ITENS_POR_PAGINA = 15;
let lista = [];
let listaFiltrada = [];
let filtroTexto = "";
let filtroStatus = "todos";
let categorias = [];
let modoEdicao = null;
let produtoFiscalAtual = null;
let paginaAtual = 1;

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
        const txt = await res.text().catch(() => "");
        throw new Error(txt || `POST ${url} → ${res.status}`);
    }
    return res.json().catch(() => null);
}

// ──────────────────────────────────────────
// TOAST
// ──────────────────────────────────────────
function flexToast(msg, tipo = "sucesso") {
    const cores = { sucesso: "#15803d", erro: "#dc2626", aviso: "#d97706" };
    const icones = { sucesso: "bi-check-circle-fill", erro: "bi-x-circle-fill", aviso: "bi-exclamation-triangle-fill" };
    const t = document.createElement("div");
    t.style.cssText =
        `position:fixed;top:2rem;right:2rem;background:${cores[tipo]};color:#fff;
        padding:1.2rem 1.8rem;border-radius:.8rem;font-size:1.4rem;font-family:'Segoe UI',sans-serif;
        display:flex;align-items:center;gap:.8rem;box-shadow:0 .6rem 2rem rgba(0,0,0,.2);
        z-index:9999;opacity:0;transform:translateY(-1rem);transition:all .3s ease;max-width:40rem;`;
    t.innerHTML = `<i class="bi ${icones[tipo]}"></i><span>${msg}</span>`;
    document.body.appendChild(t);
    requestAnimationFrame(() => { t.style.opacity = "1"; t.style.transform = "translateY(0)"; });
    setTimeout(() => {
        t.style.opacity = "0"; t.style.transform = "translateY(-1rem)";
        setTimeout(() => t.remove(), 350);
    }, 3500);
}

// ──────────────────────────────────────────
// CARREGAR DADOS
// ──────────────────────────────────────────
async function carregarProdutos() {
    try {
        lista = await apiGet("/Produto/Listar");
        aplicarFiltros();
    } catch (err) {
        flexToast("Erro ao carregar produtos: " + err.message, "erro");
    }
}

async function carregarCategorias() {
    try {
        categorias = await apiGet("/CategoriaProduto/Listar");
        const sels = document.querySelectorAll(".sel-categoria");
        sels.forEach(sel => {
            sel.innerHTML = `<option value="">Selecione...</option>`;
            categorias.filter(c => c.fAtivo).forEach(c => {
                const opt = document.createElement("option");
                opt.value = c.idCategoria;
                opt.textContent = c.nome;
                sel.appendChild(opt);
            });
        });
    } catch (err) {
        console.warn("Categorias:", err.message);
    }
}

// ──────────────────────────────────────────
// FILTROS
// ──────────────────────────────────────────
function setFiltroStatus(valor) {
    filtroStatus = valor;
    document.querySelectorAll(".btn-status-filtro")
        .forEach(b => b.classList.remove("ativo-sel", "ativo-on", "ativo-off"));
    const mapa = { todos: "ativo-sel", ativo: "ativo-on", inativo: "ativo-off" };
    document.getElementById(`btn-filtro-${valor}`)?.classList.add(mapa[valor]);
    aplicarFiltros();
}

function filtrarTabela() {
    filtroTexto = document.getElementById("input-termo-busca")?.value?.trim() ?? "";
    paginaAtual = 1;
    aplicarFiltros();
}

function aplicarFiltros() {
    const termo = filtroTexto.toLowerCase();
    listaFiltrada = lista.filter(p => {
        const ativo = p.fAtivo === true || p.fAtivo === 1;
        if (filtroStatus === "ativo" && !ativo) return false;
        if (filtroStatus === "inativo" && ativo) return false;
        if (termo && !(p.nome ?? "").toLowerCase().includes(termo)) return false;
        return true;
    });
    paginaAtual = 1;
    renderizarTabela();
}

// ──────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────
function fmtMoeda(v) {
    return v != null ? `R$ ${Number(v).toFixed(2).replace(".", ",")}` : "—";
}

function temDadosFiscais(p) {
    return !!(p.ncm && p.cfop);
}

function lerCampo(id) {
    const el = document.getElementById(id);
    return el ? (el.value.trim() || null) : null;
}

// ──────────────────────────────────────────
// TABELA + PAGINAÇÃO
// ──────────────────────────────────────────
function renderizarTabela() {
    const tbody = document.querySelector("#tabela-produtos tbody");
    if (!tbody) return;

    const total = listaFiltrada.length;
    const totalPags = Math.ceil(total / ITENS_POR_PAGINA);
    const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
    const pagina = listaFiltrada.slice(inicio, inicio + ITENS_POR_PAGINA);

    if (!pagina.length) {
        tbody.innerHTML = `<tr><td colspan="8" class="empty-state">Nenhum produto encontrado.</td></tr>`;
        atualizarPaginacao(0);
        return;
    }

    tbody.innerHTML = pagina.map(p => {
        const ativo = p.fAtivo === true || p.fAtivo === 1;
        const temFisc = temDadosFiscais(p);
        const idProd = p.idProduto ?? p.IdProduto;

        return `<tr>
            <td class="area-acoes">
                <button class="btn-acao btn-editar"  title="Editar" onclick="abrirModalEdicao(${idProd})">
                    <i class="bi bi-pencil-fill"></i>
                </button>
                <button class="btn-acao btn-fiscal" title="Dados Fiscais" onclick="abrirModalFiscal(${idProd})">
                    <i class="bi bi-file-earmark-text-fill"></i>
                </button>
                <button class="btn-acao ${ativo ? "btn-inativar" : "btn-reativar"}"
                    title="${ativo ? "Inativar" : "Reativar"}"
                    onclick="alterarStatus(${idProd})">
                    <i class="bi bi-${ativo ? "dash-circle-fill" : "check-circle-fill"}"></i>
                </button>
            </td>
            <td><span class="status-pill status-${ativo ? "ativo" : "inativo"}">${ativo ? "Ativo" : "Inativo"}</span></td>
            <td>${p.nome ?? "—"}</td>
            <td>${p.sku ?? p.skuProduto ?? "—"}</td>
            <td>${p.nomeCategoria ?? "—"}</td>
            <td>${fmtMoeda(p.precoCusto ?? p.PrecoCusto)}</td>
            <td>${fmtMoeda(p.precoVenda ?? p.PrecoVenda)}</td>
            <td>
                <span class="status-pill ${temFisc ? "status-ativo" : "status-inativo"}">
                    ${temFisc ? "Configurado" : "Pendente"}
                </span>
            </td>
        </tr>`;
    }).join("");

    atualizarPaginacao(total);
}

function atualizarPaginacao(total) {
    const totalPags = Math.ceil(total / ITENS_POR_PAGINA);
    const ini = total === 0 ? 0 : (paginaAtual - 1) * ITENS_POR_PAGINA + 1;
    const fim = Math.min(paginaAtual * ITENS_POR_PAGINA, total);

    const infoEl = document.querySelector(".paginacao-info");
    if (infoEl) infoEl.textContent = total === 0 ? "Nenhum registro" : `Mostrando ${ini}–${fim} de ${total}`;

    const ctrl = document.querySelector(".paginacao-controles");
    if (!ctrl) return;
    ctrl.innerHTML = "";

    const prev = document.createElement("button");
    prev.className = "btn-pagina"; prev.textContent = "‹"; prev.disabled = paginaAtual === 1;
    prev.onclick = () => { paginaAtual--; renderizarTabela(); };
    ctrl.appendChild(prev);

    for (let i = 1; i <= totalPags; i++) {
        const btn = document.createElement("button");
        btn.className = `btn-pagina${i === paginaAtual ? " ativo" : ""}`;
        btn.textContent = i;
        btn.onclick = () => { paginaAtual = i; renderizarTabela(); };
        ctrl.appendChild(btn);
    }

    const next = document.createElement("button");
    next.className = "btn-pagina"; next.textContent = "›";
    next.disabled = paginaAtual >= totalPags || totalPags === 0;
    next.onclick = () => { paginaAtual++; renderizarTabela(); };
    ctrl.appendChild(next);
}

// ──────────────────────────────────────────
// MODAL PRODUTO — ABRIR / FECHAR
// ──────────────────────────────────────────

// Abre modal para CRIAR novo produto
function abrirModal() {
    modoEdicao = null;
    document.getElementById("form-produto")?.reset();
    document.querySelector("#modal-produto .modal-header h3").textContent = "Novo Produto";
    document.getElementById("modal-produto").classList.add("open");
}

// Abre modal para EDITAR produto existente
function abrirModalEdicao(id) {
    const p = lista.find(x => (x.idProduto ?? x.IdProduto) === id);
    if (!p) return;

    modoEdicao = id;
    document.querySelector("#modal-produto .modal-header h3").textContent = "Editar Produto";

    // Preenche campos do formulário
    const set = (elId, val) => {
        const el = document.getElementById(elId);
        if (el) el.value = val ?? "";
    };

    set("prod-nome", p.nome);
    set("prod-sku", p.sku ?? p.skuProduto);
    set("prod-codbarras", p.codigoBarras);
    set("prod-preco-custo", p.precoCusto ?? p.PrecoCusto);
    set("prod-preco-venda", p.precoVenda ?? p.PrecoVenda);
    set("prod-descricao", p.descricao);
    set("prod-unidade", p.unidade);
    set("prod-categoria", p.idCategoria ?? p.IdCategoria);

    document.getElementById("modal-produto").classList.add("open");
}

function fecharModal() {
    document.getElementById("modal-produto")?.classList.remove("open");
    modoEdicao = null;
}

// ──────────────────────────────────────────
// MODAL FISCAL — ABRIR / FECHAR
// ──────────────────────────────────────────
function abrirModalFiscal(id) {
    const p = lista.find(x => (x.idProduto ?? x.IdProduto) === id);
    if (!p) return;

    produtoFiscalAtual = id;
    document.querySelector("#modal-fiscal .modal-header h3").textContent =
        `Dados Fiscais — ${p.nome}`;

    // Preenche campos fiscais se já existirem
    const set = (elId, val) => {
        const el = document.getElementById(elId);
        if (el) el.value = val ?? "";
    };

    set("fiscal-ncm", p.ncm);
    set("fiscal-cfop", p.cfop);
    set("fiscal-csosn", p.csosn ?? p.cst);
    set("fiscal-origem", p.origem ?? "0");
    set("fiscal-cest", p.cest);

    document.getElementById("modal-fiscal")?.classList.add("open");
}

function fecharModalFiscal() {
    document.getElementById("modal-fiscal")?.classList.remove("open");
    produtoFiscalAtual = null;
}

// ──────────────────────────────────────────
// ALTERAR STATUS
// ──────────────────────────────────────────
async function alterarStatus(id) {
    const p = lista.find(x => (x.idProduto ?? x.IdProduto) === id);
    if (!p) return;

    const ativo = p.fAtivo === true || p.fAtivo === 1;
    const acao = ativo ? "inativar" : "reativar";

    if (!confirm(`Deseja ${acao} o produto "${p.nome}"?`)) return;

    try {
        await apiPost("/Produto/AlterarStatus", id);
        await carregarProdutos();
        flexToast(`Produto ${acao}do com sucesso!`, "sucesso");
    } catch (err) {
        flexToast("Erro ao alterar status: " + err.message, "erro");
    }
}

// ──────────────────────────────────────────
// SUBMIT — CRIAR / EDITAR PRODUTO
// ──────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {

    // Filtro de status inicial
    document.getElementById("btn-filtro-todos")?.classList.add("ativo-sel");

    // Carrega dados iniciais
    carregarProdutos();
    carregarCategorias();

    // Submit do formulário de produto (criar ou editar)
    document.getElementById("form-produto")?.addEventListener("submit", async function (e) {
        e.preventDefault();

        const nome = lerCampo("prod-nome");
        if (!nome) { flexToast("Nome é obrigatório.", "aviso"); return; }

        const payload = {
            IdProduto: modoEdicao ?? 0,
            Nome: nome,
            SKU: lerCampo("prod-sku"),
            CodigoBarras: lerCampo("prod-codbarras"),
            PrecoCusto: Number(document.getElementById("prod-preco-custo")?.value || 0),
            PrecoVenda: Number(document.getElementById("prod-preco-venda")?.value || 0),
            Descricao: lerCampo("prod-descricao"),
            Unidade: lerCampo("prod-unidade"),
            IdCategoria: Number(document.getElementById("prod-categoria")?.value) || null,
            FAtivo: true
        };

        const btn = this.querySelector('[type="submit"]');
        btn.disabled = true;

        try {
            if (modoEdicao) {
                await apiPost("/Produto/Editar", payload);
                flexToast("Produto atualizado!", "sucesso");
            } else {
                await apiPost("/Produto/Criar", payload);
                flexToast("Produto criado!", "sucesso");
            }
            fecharModal();
            await carregarProdutos();
        } catch (err) {
            flexToast("Erro ao salvar: " + err.message, "erro");
        } finally {
            btn.disabled = false;
        }
    });

    // Submit dos dados fiscais
    document.getElementById("form-fiscal")?.addEventListener("submit", async function (e) {
        e.preventDefault();
        if (!produtoFiscalAtual) return;

        const payload = {
            IdProduto: produtoFiscalAtual,
            NCM: lerCampo("fiscal-ncm"),
            CFOP: lerCampo("fiscal-cfop"),
            CSOSN: lerCampo("fiscal-csosn"),
            Origem: lerCampo("fiscal-origem") ?? "0",
            CEST: lerCampo("fiscal-cest")
        };

        const btn = this.querySelector('[type="submit"]');
        btn.disabled = true;

        try {
            await apiPost("/Produto/SalvarFiscal", payload);
            flexToast("Dados fiscais salvos!", "sucesso");
            fecharModalFiscal();
            await carregarProdutos();
        } catch (err) {
            flexToast("Erro ao salvar fiscal: " + err.message, "erro");
        } finally {
            btn.disabled = false;
        }
    });

    // Fechar modais clicando fora
    document.getElementById("modal-produto")?.addEventListener("click", function (e) {
        if (e.target === this) fecharModal();
    });
    document.getElementById("modal-fiscal")?.addEventListener("click", function (e) {
        if (e.target === this) fecharModalFiscal();
    });
});