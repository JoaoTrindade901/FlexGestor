// ===== PRODUTO.JS — FlexGestor (com dados fiscais) =====

const ITENS_POR_PAGINA = 15;
let lista = [];
let listaFiltrada = [];
let filtroTexto = "";
let filtroStatus = "todos";
let categorias = [];
let modoEdicao = null;        // null = novo, id = edição
let produtoFiscalAtual = null;    // id do produto no modal fiscal

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

function flexToast(msg, tipo = "sucesso") {
    const cores = { sucesso: "#15803d", erro: "#dc2626", aviso: "#d97706" };
    const icones = { sucesso: "bi-check-circle-fill", erro: "bi-x-circle-fill", aviso: "bi-exclamation-triangle-fill" };
    const t = document.createElement("div");
    t.style.cssText = `position:fixed;top:2rem;right:2rem;background:${cores[tipo]};color:#fff;
        padding:1.2rem 1.8rem;border-radius:.8rem;font-size:1.4rem;font-family:'Segoe UI',sans-serif;
        display:flex;align-items:center;gap:.8rem;box-shadow:0 .6rem 2rem rgba(0,0,0,.2);
        z-index:9999;opacity:0;transform:translateY(-1rem);transition:all .3s ease;max-width:40rem;`;
    t.innerHTML = `<i class="bi ${icones[tipo]}"></i><span>${msg}</span>`;
    document.body.appendChild(t);
    requestAnimationFrame(() => { t.style.opacity = "1"; t.style.transform = "translateY(0)"; });
    setTimeout(() => {
        t.style.opacity = "0";
        t.style.transform = "translateY(-1rem)";
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
        console.warn("Categorias:", err.message);
    }
}

// ──────────────────────────────────────────
// FILTROS E TABELA
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
    renderizarTabela();
}

function fmtMoeda(v) {
    return v != null ? `R$ ${Number(v).toFixed(2).replace(".", ",")}` : "—";
}

function temDadosFiscais(p) {
    // Produto tem dados fiscais mínimos se tiver NCM e CFOP preenchidos
    return !!(p.ncm && p.cfop);
}

function renderizarTabela() {
    const tbody = document.querySelector("#tabela-produtos tbody");
    if (!tbody) return;

    if (!listaFiltrada.length) {
        tbody.innerHTML = `<tr><td colspan="8" class="empty-state">Nenhum produto encontrado.</td></tr>`;
        atualizarPaginacao(0);
        return;
    }

    tbody.innerHTML = listaFiltrada.map(p => {
        const ativo = p.fAtivo === true || p.fAtivo === 1;
        const temFisc = temDadosFiscais(p);
        const idProd = p.idProduto ?? p.IdProduto;

        return `<tr>
            <td class="area-acoes">
                <!-- Editar dados comerciais -->
                <button class="btn-acao btn-editar" title="Editar produto"
                    onclick="abrirModalEdicao(${idProd})">
                    <i class="bi bi-pencil-fill"></i>
                </button>
                <!-- Dados fiscais -->
                <button class="btn-acao btn-fiscal" title="Dados fiscais para NF-e"
                    onclick="abrirModalFiscal(${idProd})">
                    <i class="bi bi-file-earmark-text-fill"></i>
                </button>
                <!-- Inativar / Reativar -->
                <button class="btn-acao ${ativo ? "btn-inativar" : "btn-reativar"}"
                    title="${ativo ? "Inativar" : "Reativar"}"
                    onclick="alterarStatus(${idProd})">
                    <i class="bi bi-${ativo ? "dash-circle-fill" : "check-circle-fill"}"></i>
                </button>
            </td>
            <td><span class="status-pill status-${ativo ? "ativo" : "inativo"}">${ativo ? "Ativo" : "Inativo"}</span></td>
            <td title="${p.nome ?? ""}">${p.nome ?? "—"}</td>
            <td>${p.sku ?? p.skuProduto ?? "—"}</td>
            <td>${p.nomeCategoria ?? "—"}</td>
            <td>${fmtMoeda(p.precoCusto ?? p.PrecoCusto)}</td>
            <td>${fmtMoeda(p.precoVenda ?? p.PrecoVenda)}</td>
            <td>
                ${temFisc
                ? `<span class="badge-fiscal badge-fiscal-sim"><i class="bi bi-check-circle-fill"></i> Configurado</span>`
                : `<span class="badge-fiscal badge-fiscal-ok"><i class="bi bi-exclamation-circle-fill"></i> Pendente</span>`}
            </td>
        </tr>`;
    }).join("");

    atualizarPaginacao(listaFiltrada.length);
}

function atualizarPaginacao(total) {
    const el = document.querySelector(".paginacao-info");
    if (el) el.textContent = `${total} produto${total !== 1 ? "s" : ""}`;
}

// ──────────────────────────────────────────
// MODAL PRODUTO — DADOS COMERCIAIS
// ──────────────────────────────────────────
async function abrirModal() {
    modoEdicao = null;
    document.getElementById("formProduto")?.reset();
    const errEl = document.getElementById("mensagemErro");
    if (errEl) errEl.style.display = "none";
    document.getElementById("modal-produto-titulo").innerHTML =
        `<i class="bi bi-plus-circle-fill"></i> Novo Produto`;
    await carregarCategorias();
    document.getElementById("modal-produto")?.classList.add("open");
}

async function abrirModalEdicao(idProduto) {
    modoEdicao = idProduto;
    const errEl = document.getElementById("mensagemErro");
    if (errEl) errEl.style.display = "none";
    document.getElementById("modal-produto-titulo").innerHTML =
        `<i class="bi bi-pencil-fill"></i> Editar Produto`;

    await carregarCategorias();

    const p = lista.find(x => (x.idProduto ?? x.IdProduto) === idProduto);
    if (!p) { flexToast("Produto não encontrado.", "erro"); return; }

    document.getElementById("nome").value = p.nome ?? p.Nome ?? "";
    document.getElementById("codProduto").value = p.sku ?? p.skuProduto ?? "";
    document.getElementById("codBarras").value = p.codigoBarras ?? "";
    document.getElementById("descricao").value = p.descricao ?? "";
    document.getElementById("precoCusto").value = p.precoCusto ?? "";
    document.getElementById("precoVenda").value = p.precoVenda ?? "";
    document.getElementById("unidade").value = p.unidade ?? "";

    const idCat = p.idCategoria ?? p.IdCategoria;
    if (idCat) document.getElementById("prod-categoria").value = idCat;

    document.getElementById("modal-produto")?.classList.add("open");
}

function fecharModal() {
    document.getElementById("modal-produto")?.classList.remove("open");
    modoEdicao = null;
}

// ──────────────────────────────────────────
// SALVAR PRODUTO (dados comerciais)
// ──────────────────────────────────────────
async function salvarProduto() {
    const nome = document.getElementById("nome")?.value?.trim();
    const idCat = Number(document.getElementById("prod-categoria")?.value) || null;

    if (!nome) { flexToast("Nome é obrigatório.", "aviso"); return; }
    if (!idCat) { flexToast("Selecione uma categoria.", "aviso"); return; }

    const btn = document.getElementById("btnSalvar");
    btn.disabled = true;
    const orig = btn.innerHTML;
    btn.innerHTML = '<i class="bi bi-hourglass-split"></i> Salvando...';

    const payload = {
        Nome: nome,
        Descricao: document.getElementById("descricao")?.value || null,
        CodigoBarras: document.getElementById("codBarras")?.value?.trim() || null,
        SKU: document.getElementById("codProduto")?.value?.trim() || null,
        IdCategoria: idCat,
        PrecoCusto: Number(document.getElementById("precoCusto")?.value || 0),
        PrecoVenda: Number(document.getElementById("precoVenda")?.value || 0),
        Unidade: document.getElementById("unidade")?.value || null,
        FAtivo: true
    };

    try {
        if (modoEdicao) {
            payload.IdProduto = modoEdicao;
            await apiPost("/Produto/Editar", payload);
            flexToast("Produto atualizado com sucesso!", "sucesso");
        } else {
            await apiPost("/Produto/Criar", payload);
            flexToast("Produto cadastrado! Configure os dados fiscais se desejar emitir NF-e.", "sucesso");
        }
        fecharModal();
        await carregarProdutos();
    } catch (err) {
        flexToast("Erro ao salvar: " + err.message, "erro");
    } finally {
        btn.disabled = false;
        btn.innerHTML = orig;
    }
}

// ──────────────────────────────────────────
// INATIVAR / REATIVAR
// ──────────────────────────────────────────
async function alterarStatus(idProduto) {
    const p = lista.find(x => (x.idProduto ?? x.IdProduto) === idProduto);
    const ativo = p?.fAtivo === true || p?.fAtivo === 1;
    const acao = ativo ? "inativar" : "reativar";
    if (!confirm(`Deseja ${acao} o produto "${p?.nome}"?`)) return;
    try {
        await apiPost("/Produto/AlterarStatus", idProduto);
        await carregarProdutos();
        flexToast(`Produto ${acao}do com sucesso!`, "sucesso");
    } catch (err) {
        flexToast("Erro: " + err.message, "erro");
    }
}

// ──────────────────────────────────────────
// MODAL FISCAL — DADOS PARA NF-e
// ──────────────────────────────────────────
async function abrirModalFiscal(idProduto) {
    produtoFiscalAtual = idProduto;
    const p = lista.find(x => (x.idProduto ?? x.IdProduto) === idProduto);
    if (!p) return;

    // Nome do produto no subtítulo
    document.getElementById("fiscal-produto-nome").textContent =
        `Produto: ${p.nome ?? ""}`;

    // Preenche campos com dados já salvos (se houver)
    document.getElementById("fiscal-ncm").value = p.ncm ?? "";
    document.getElementById("fiscal-cfop").value = p.cfop ?? "5102";
    document.getElementById("fiscal-origem").value = p.origem != null ? String(p.origem) : "0";
    document.getElementById("fiscal-csosn").value = p.csosn ?? "102";
    document.getElementById("fiscal-cst-pis").value = p.cstPis ?? "07";
    document.getElementById("fiscal-aliq-pis").value = p.aliqPis ?? "0.65";
    document.getElementById("fiscal-cst-cofins").value = p.cstCofins ?? "07";
    document.getElementById("fiscal-aliq-cofins").value = p.aliqCofins ?? "3.00";

    atualizarStatusFiscal();
    document.getElementById("modal-fiscal")?.classList.add("open");
}

function fecharModalFiscal() {
    document.getElementById("modal-fiscal")?.classList.remove("open");
    produtoFiscalAtual = null;
}

// Atualiza os indicadores visuais dos campos obrigatórios
function atualizarStatusFiscal() {
    const ncm = document.getElementById("fiscal-ncm")?.value?.trim();
    const cfop = document.getElementById("fiscal-cfop")?.value;
    const csosn = document.getElementById("fiscal-csosn")?.value;

    atualizarIndicador("fst-ncm", ncm?.length === 8);
    atualizarIndicador("fst-cfop", !!cfop);
    atualizarIndicador("fst-csosn", !!csosn);
}

function atualizarIndicador(id, ok) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.toggle("ok", ok);
    el.classList.toggle("err", !ok);
    const ico = el.querySelector("i");
    if (ico) {
        ico.className = ok
            ? "bi bi-check-circle-fill"
            : "bi bi-exclamation-circle-fill";
    }
}

// ──────────────────────────────────────────
// SALVAR DADOS FISCAIS
// ──────────────────────────────────────────
async function salvarDadosFiscais() {
    const ncm = document.getElementById("fiscal-ncm")?.value?.trim();
    const cfop = document.getElementById("fiscal-cfop")?.value;
    const csosn = document.getElementById("fiscal-csosn")?.value;

    if (!ncm || ncm.length !== 8) {
        flexToast("NCM deve ter 8 dígitos.", "aviso"); return;
    }
    if (!cfop) {
        flexToast("Selecione o CFOP.", "aviso"); return;
    }
    if (!csosn) {
        flexToast("Selecione o CSOSN.", "aviso"); return;
    }

    const btn = document.getElementById("btnSalvarFiscal");
    btn.disabled = true;
    const orig = btn.innerHTML;
    btn.innerHTML = '<i class="bi bi-hourglass-split"></i> Salvando...';

    const payload = {
        IdProduto: produtoFiscalAtual,
        NCM: ncm,
        CFOP: cfop,
        Origem: Number(document.getElementById("fiscal-origem")?.value ?? 0),
        CSOSN: csosn,
        CstPIS: document.getElementById("fiscal-cst-pis")?.value ?? "07",
        AliqPIS: Number(document.getElementById("fiscal-aliq-pis")?.value ?? 0),
        CstCOFINS: document.getElementById("fiscal-cst-cofins")?.value ?? "07",
        AliqCOFINS: Number(document.getElementById("fiscal-aliq-cofins")?.value ?? 0)
    };

    try {
        await apiPost("/Produto/SalvarFiscal", payload);
        flexToast("Dados fiscais salvos! Produto pronto para NF-e.", "sucesso");
        fecharModalFiscal();
        await carregarProdutos(); // atualiza badge da tabela
    } catch (err) {
        flexToast("Erro ao salvar dados fiscais: " + err.message, "erro");
    } finally {
        btn.disabled = false;
        btn.innerHTML = orig;
    }
}

// ──────────────────────────────────────────
// MODAIS DE AJUDA
// ──────────────────────────────────────────
function abrirAjudaNCM() { document.getElementById("modal-ajuda-ncm").classList.add("open"); }
function abrirAjudaCFOP() { document.getElementById("modal-ajuda-cfop").classList.add("open"); }
function abrirAjudaCSN() { document.getElementById("modal-ajuda-csn").classList.add("open"); }

// Preenche NCM ao clicar em exemplo na ajuda
function preencherNCM(codigo) {
    document.getElementById("fiscal-ncm").value = codigo;
    document.getElementById("modal-ajuda-ncm").classList.remove("open");
    atualizarStatusFiscal();
    flexToast(`NCM ${codigo} preenchido!`, "sucesso");
}

// ──────────────────────────────────────────
// EVENTOS
// ──────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
    // Salvar produto
    document.getElementById("btnSalvar")?.addEventListener("click", e => {
        e.preventDefault();
        salvarProduto();
    });

    // Salvar dados fiscais
    document.getElementById("btnSalvarFiscal")?.addEventListener("click", e => {
        e.preventDefault();
        salvarDadosFiscais();
    });

    // Atualizar indicadores ao digitar NCM
    document.getElementById("fiscal-ncm")?.addEventListener("input", atualizarStatusFiscal);
    document.getElementById("fiscal-cfop")?.addEventListener("change", atualizarStatusFiscal);
    document.getElementById("fiscal-csosn")?.addEventListener("change", atualizarStatusFiscal);

    // Fechar modais clicando fora
    ["modal-produto", "modal-fiscal", "modal-ajuda-ncm", "modal-ajuda-cfop", "modal-ajuda-csn"]
        .forEach(id => {
            document.getElementById(id)?.addEventListener("click", function (e) {
                if (e.target === this) {
                    this.classList.remove("open");
                    if (id === "modal-produto") modoEdicao = null;
                    if (id === "modal-fiscal") produtoFiscalAtual = null;
                }
            });
        });

    // Filtro inicial
    document.getElementById("btn-filtro-todos")?.classList.add("ativo-sel");
    carregarProdutos();
});