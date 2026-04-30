// ===== PRODUTO.JS — FlexGestor =====

let lista = [];
let listaFiltrada = [];
let filtroTexto = "";
let filtroStatus = "todos";
let categorias = [];
let modoEdicao = null;

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
    return res.json().catch(() => null);
}

function flexToast(msg, tipo = "sucesso") {
    const cores   = { sucesso: "#15803d", erro: "#dc2626", aviso: "#d97706" };
    const icones  = { sucesso: "bi-check-circle-fill", erro: "bi-x-circle-fill", aviso: "bi-exclamation-triangle-fill" };
    const t = document.createElement("div");
    t.style.cssText = `position:fixed;top:2rem;right:2rem;background:${cores[tipo]};color:#fff;
        padding:1.2rem 1.8rem;border-radius:.8rem;font-size:1.4rem;font-family:'Segoe UI',sans-serif;
        display:flex;align-items:center;gap:.8rem;box-shadow:0 .6rem 2rem rgba(0,0,0,.2);
        z-index:9999;opacity:0;transform:translateY(-1rem);transition:all .3s ease;max-width:36rem;`;
    t.innerHTML = `<i class="bi ${icones[tipo]}"></i><span>${msg}</span>`;
    document.body.appendChild(t);
    requestAnimationFrame(() => { t.style.opacity = "1"; t.style.transform = "translateY(0)"; });
    setTimeout(() => { t.style.opacity = "0"; t.style.transform = "translateY(-1rem)"; setTimeout(() => t.remove(), 350); }, 3200);
}

// ──────────────────────────────────────────
// CARREGAR
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
// FILTROS
// ──────────────────────────────────────────
function setFiltroStatus(valor) {
    filtroStatus = valor;
    document.querySelectorAll(".btn-status-filtro").forEach(b =>
        b.classList.remove("ativo-sel", "ativo-on", "ativo-off"));
    const mapa = { todos: "ativo-sel", ativo: "ativo-on", inativo: "ativo-off" };
    document.getElementById(`btn-filtro-${valor}`)?.classList.add(mapa[valor]);
    aplicarFiltros();
}

function filtrarTabela() {
    filtroTexto = document.getElementById("input-termo-busca")?.value?.trim() ?? "";
    aplicarFiltros();
}

function aplicarFiltros() {
    const termo = filtroTexto.toLowerCase();
    listaFiltrada = lista.filter(p => {
        const ativo = p.fAtivo === true || p.fAtivo === 1;
        if (filtroStatus === "ativo"   && !ativo) return false;
        if (filtroStatus === "inativo" &&  ativo) return false;
        if (termo && !(p.nome ?? p.Nome ?? "").toLowerCase().includes(termo)) return false;
        return true;
    });
    renderizarTabela();
}

// ──────────────────────────────────────────
// TABELA
// ──────────────────────────────────────────
function fmtMoeda(v) {
    return v != null ? `R$ ${Number(v).toFixed(2).replace(".", ",")}` : "—";
}

function renderizarTabela() {
    const tbody = document.querySelector("#tabela-estoque tbody");
    if (!tbody) return;

    if (!listaFiltrada.length) {
        tbody.innerHTML = `<tr><td colspan="8" class="empty-state">Nenhum produto encontrado.</td></tr>`;
        atualizarPaginacaoInfo(0);
        return;
    }

    tbody.innerHTML = listaFiltrada.map(p => {
        const ativo  = p.fAtivo === true || p.fAtivo === 1;
        const nome   = p.nome ?? p.Nome ?? "—";
        const sku    = p.sku ?? p.SKU ?? p.skuProduto ?? "—";
        const cat    = p.nomeCategoria ?? "—";
        const custo  = fmtMoeda(p.precoCusto ?? p.PrecoCusto);
        const venda  = fmtMoeda(p.precoVenda ?? p.PrecoVenda);
        const unid   = p.unidade ?? p.Unidade ?? "—";

        return `<tr>
            <td class="area-acoes">
                <button class="btn-acao btn-editar" title="Editar"
                    onclick="abrirModalEdicao(${p.idProduto ?? p.IdProduto})">
                    <i class="bi bi-pencil-fill"></i>
                </button>
                <button class="btn-acao btn-inativar" title="${ativo ? "Inativar" : "Reativar"}"
                    onclick="alterarStatus(${p.idProduto ?? p.IdProduto})">
                    <i class="bi bi-${ativo ? "dash-circle-fill" : "check-circle-fill"}"></i>
                </button>
            </td>
            <td><span class="status-pill status-${ativo ? "ativo" : "inativo"}">${ativo ? "Ativo" : "Inativo"}</span></td>
            <td>${nome}</td>
            <td>${sku}</td>
            <td>${cat}</td>
            <td>${custo}</td>
            <td>${venda}</td>
            <td>${unid}</td>
        </tr>`;
    }).join("");

    atualizarPaginacaoInfo(listaFiltrada.length);
}

function atualizarPaginacaoInfo(total) {
    const el = document.querySelector(".paginacao-info");
    if (el) el.textContent = `${total} produto${total !== 1 ? "s" : ""}`;
}

// ──────────────────────────────────────────
// MODAL NOVO PRODUTO (apenas etapa 1)
// ──────────────────────────────────────────
async function abrirModal() {
    modoEdicao = null;
    document.getElementById("formEstoque")?.reset();
    document.getElementById("mensagemErro") && (document.getElementById("mensagemErro").style.display = "none");
    const header = document.querySelector("#modalEstoque .modal-header h3");
    if (header) header.innerHTML = `<i class="bi bi-plus-circle-fill"></i> Novo Produto`;
    await carregarCategorias();
    document.getElementById("modalEstoque")?.classList.add("open");
}

async function abrirModalEdicao(idProduto) {
    modoEdicao = idProduto;
    document.getElementById("formEstoque")?.reset();
    document.getElementById("mensagemErro") && (document.getElementById("mensagemErro").style.display = "none");
    const header = document.querySelector("#modalEstoque .modal-header h3");
    if (header) header.innerHTML = `<i class="bi bi-pencil-fill"></i> Editar Produto`;

    await carregarCategorias();

    const produto = lista.find(p => (p.idProduto ?? p.IdProduto) === idProduto);
    if (!produto) { flexToast("Produto não encontrado.", "erro"); return; }

    document.getElementById("nome").value         = produto.nome ?? produto.Nome ?? "";
    document.getElementById("codProduto").value   = produto.sku ?? produto.SKU ?? produto.skuProduto ?? "";
    document.getElementById("codBarras").value    = produto.codigoBarras ?? produto.CodigoBarras ?? "";
    document.getElementById("descricao").value    = produto.descricao ?? produto.Descricao ?? "";
    document.getElementById("precoCusto").value   = produto.precoCusto ?? produto.PrecoCusto ?? "";
    document.getElementById("precoVenda").value   = produto.precoVenda ?? produto.PrecoVenda ?? "";
    document.getElementById("unidade").value      = produto.unidade ?? produto.Unidade ?? "";

    const idCat = produto.idCategoria ?? produto.IdCategoria;
    if (idCat) document.getElementById("prod-categoria").value = idCat;

    document.getElementById("modalEstoque")?.classList.add("open");
}

function fecharModal() {
    document.getElementById("modalEstoque")?.classList.remove("open");
    modoEdicao = null;
}

// ──────────────────────────────────────────
// SALVAR
// ──────────────────────────────────────────
async function salvarProduto() {
    const nome = document.getElementById("nome")?.value?.trim();
    if (!nome) { flexToast("Nome é obrigatório.", "aviso"); return; }

    const idCat = Number(document.getElementById("prod-categoria")?.value) || null;
    if (!idCat) { flexToast("Selecione uma categoria.", "aviso"); return; }

    const btn = document.getElementById("btnSalvar");
    btn.disabled = true;
    const original = btn.innerHTML;
    btn.innerHTML = '<i class="bi bi-hourglass-split"></i> Salvando...';

    const payload = {
        Nome:         nome,
        Descricao:    document.getElementById("descricao")?.value || null,
        CodigoBarras: document.getElementById("codBarras")?.value?.trim() || null,
        SKU:          document.getElementById("codProduto")?.value?.trim() || null,
        IdCategoria:  idCat,
        PrecoCusto:   Number(document.getElementById("precoCusto")?.value || 0),
        PrecoVenda:   Number(document.getElementById("precoVenda")?.value || 0),
        Unidade:      document.getElementById("unidade")?.value || null,
        FAtivo:       true
    };

    try {
        if (modoEdicao) {
            payload.IdProduto = modoEdicao;
            await apiPost("/Produto/Editar", payload);
            flexToast("Produto atualizado com sucesso!", "sucesso");
        } else {
            await apiPost("/Produto/Criar", payload);
            flexToast("Produto cadastrado com sucesso!", "sucesso");
        }
        fecharModal();
        await carregarProdutos();
    } catch (err) {
        flexToast("Erro ao salvar: " + err.message, "erro");
    } finally {
        btn.disabled = false;
        btn.innerHTML = original;
    }
}

async function alterarStatus(idProduto) {
    const p = lista.find(x => (x.idProduto ?? x.IdProduto) === idProduto);
    const acao = (p?.fAtivo === true || p?.fAtivo === 1) ? "inativar" : "reativar";
    if (!confirm(`Deseja ${acao} este produto?`)) return;
    try {
        await apiPost("/Produto/AlterarStatus", idProduto);
        await carregarProdutos();
        flexToast(`Produto ${acao}do com sucesso!`, "sucesso");
    } catch (err) {
        flexToast("Erro ao alterar status: " + err.message, "erro");
    }
}

// ──────────────────────────────────────────
// EVENTOS
// ──────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("btnSalvar")?.addEventListener("click", e => {
        e.preventDefault();
        salvarProduto();
    });

    document.getElementById("modalEstoque")?.addEventListener("click", function (e) {
        if (e.target === this) fecharModal();
    });

    document.getElementById("btn-filtro-todos")?.classList.add("ativo-sel");
    carregarProdutos();
});