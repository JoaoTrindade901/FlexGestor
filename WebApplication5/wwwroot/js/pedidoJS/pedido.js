// ===== PEDIDO.JS — com pagamento integrado ao caixa =====

const ITENS_POR_PAGINA = 10;
let paginaAtual = 1;
let todosPedidos = [];
let pedidosFiltrados = [];
let clientesCache = [];
let produtosCache = [];
let formasPagamentoCache = [];
let categoriaFinanceiraCache = [];
let filtroStatusPedido = "todos";
let filtroClienteStr = "";
let itensPedidoAtual = [];
let pagamentosPedidoAtual = [];
let _buscaClientePrefixo = null;
let _buscaProdutoIdx = null;
let _buscaProdutoPrefixo = null;
let _pedidoEmEdicao = null;
let _pedidoPagamentoAtual = null; // pedido sendo pago

// IDs alinhados com tabela StatusPedido do banco:
// 1=PENDENTE 2=CONFIRMADO 3=SEPARANDO 4=ENVIADO 5=CONCLUÍDO 6=CANCELADO
const STATUS_MAP = {
    1: { nome: "Pendente", classe: "pendente" },
    2: { nome: "Confirmado", classe: "confirmado" },
    3: { nome: "Separando", classe: "separando" },
    4: { nome: "Enviado", classe: "enviado" },
    5: { nome: "Concluído", classe: "concluido" },
    6: { nome: "Cancelado", classe: "cancelado" },
};

const STATUS_NOME_PARA_ID = {
    "PENDENTE": 1,
    "CONFIRMADO": 2,
    "SEPARANDO": 3,
    "ENVIADO": 4,
    "ENTREGUE": 5,
    "CONCLUÍDO": 5,
    "CONCLUIDO": 5,
    "CANCELADO": 6,
};

function resolverStatusId(pedido) {
    if (pedido.statusPedidoId && pedido.statusPedidoId > 0) return pedido.statusPedidoId;
    if (pedido.statusPedido_id && pedido.statusPedido_id > 0) return pedido.statusPedido_id;
    if (pedido.status) return STATUS_NOME_PARA_ID[pedido.status.toUpperCase()] ?? 0;
    return 0;
}

const FILTRO_STATUS_IDS = {
    todos: [1, 2, 3, 4, 5, 6],
    pendente: [1],
    confirmado: [2],
    separando: [3],
    enviado: [4],
    concluido: [5],
    cancelado: [6],
};

const FORMAS_PAGAMENTO = [
    { id: 1, nome: "Dinheiro" },
    { id: 2, nome: "Cartão de Crédito" },
    { id: 3, nome: "Cartão de Débito" },
    { id: 4, nome: "PIX" },
    { id: 5, nome: "Boleto" },
    { id: 6, nome: "Transferência" },
];

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
        let msg = txt;
        try { msg = JSON.parse(txt).mensagem ?? txt; } catch { }
        throw new Error(msg || `POST ${url} → ${res.status}`);
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
        t.style.opacity = "0"; t.style.transform = "translateY(-1rem)";
        setTimeout(() => t.remove(), 350);
    }, 3500);
}

// ──────────────────────────────────────────
// CARREGAR DADOS
// ──────────────────────────────────────────
async function carregarPedidos() {
    try {
        const raw = await apiGet("/Pedido/Listar");
        todosPedidos = raw.map(p => ({ ...p, statusPedidoId: resolverStatusId(p) }));
        aplicarFiltros();
    } catch (err) {
        flexToast("Erro ao carregar pedidos: " + err.message, "erro");
    }
}

async function carregarClientes() {
    try { clientesCache = await apiGet("/Cliente/Listar"); }
    catch (err) { console.warn("Clientes:", err.message); }
}

async function carregarProdutos() {
    try { produtosCache = await apiGet("/Produto/Listar"); }
    catch (err) { console.warn("Produtos:", err.message); }
}

async function carregarFormasPagamento() {
    try { formasPagamentoCache = await apiGet("/Caixa/FormasPagamento"); }
    catch { formasPagamentoCache = FORMAS_PAGAMENTO; }
}

async function carregarCategorias() {
    try { categoriaFinanceiraCache = await apiGet("/Caixa/Categorias"); }
    catch { categoriaFinanceiraCache = []; }
}

// ──────────────────────────────────────────
// FILTROS E TABELA
// ──────────────────────────────────────────
function aplicarFiltros() {
    const idsPermitidos = FILTRO_STATUS_IDS[filtroStatusPedido] ?? FILTRO_STATUS_IDS.todos;
    pedidosFiltrados = todosPedidos.filter(p => {
        if (!idsPermitidos.includes(p.statusPedidoId)) return false;
        if (filtroClienteStr) {
            const q = filtroClienteStr.toLowerCase();
            if (!p.nomeCliente?.toLowerCase().includes(q) &&
                !String(p.numeroPedido).includes(q)) return false;
        }
        return true;
    });
    paginaAtual = 1;
    renderizarTabela();
}

function filtrarCliente() {
    filtroClienteStr = document.getElementById("input-busca-cliente").value.trim();
    aplicarFiltros();
}

function setFiltroStatus(valor) {
    filtroStatusPedido = valor;
    document.querySelectorAll(".btn-status-filtro").forEach(b =>
        b.className = b.className.replace(/\bsel-\S+/g, "").trim());
    document.getElementById(`btn-f-${valor}`)?.classList.add(`sel-${valor}`);
    aplicarFiltros();
}

function fmtMoeda(v) {
    return `R$ ${Number(v || 0).toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
}
function fmtData(s) {
    if (!s) return "—";
    return new Date(s).toLocaleDateString("pt-BR");
}
function fmtDataHora(s) {
    if (!s) return "—";
    const local = s.endsWith("Z") ? s.slice(0, -1) : s;
    return new Date(local).toLocaleString("pt-BR", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit"
    });
}
function highlight(texto, busca) {
    if (!busca || !texto) return texto ?? "";
    const re = new RegExp(`(${busca.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    return texto.replace(re, "<mark>$1</mark>");
}

function renderizarTabela() {
    const tbody = document.querySelector("#tabela-pedidos tbody");
    const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
    const pagina = pedidosFiltrados.slice(inicio, inicio + ITENS_POR_PAGINA);

    if (!pagina.length) {
        tbody.innerHTML = `<tr><td colspan="8" class="empty-state">Nenhum pedido encontrado.</td></tr>`;
    } else {
        tbody.innerHTML = pagina.map(p => {
            const st = STATUS_MAP[p.statusPedidoId] ?? { nome: "Desconhecido", classe: "pendente" };
            const finalizado = p.statusPedidoId === 5 || p.statusPedidoId === 6;
            const cancelado = p.statusPedidoId === 6;
            const concluido = p.statusPedidoId === 5;

            return `<tr>
                <td class="area-acoes">
                    <!-- Ver detalhes — sempre disponível -->
                    <button class="btn-acao btn-ver" title="Detalhes"
                        onclick="abrirDetalhes(${p.idPedido})">
                        <i class="bi bi-eye-fill"></i>
                    </button>

                    <!-- Registrar pagamento — apenas status que não são finais -->
                    ${!finalizado ? `
                    <button class="btn-acao btn-pagar" title="Registrar pagamento"
                        onclick="abrirModalPagamento(${p.idPedido})">
                        <i class="bi bi-cash-coin"></i>
                    </button>` : ""}

                    <!-- Editar — apenas status não finais -->
                    ${!finalizado ? `
                    <button class="btn-acao btn-editar" title="Editar"
                        onclick="abrirEdicao(${p.idPedido})">
                        <i class="bi bi-pencil-fill"></i>
                    </button>` : ""}

                    <!-- Cancelar — apenas status não finais -->
                    ${!finalizado ? `
                    <button class="btn-acao btn-cancelar" title="Cancelar"
                        onclick="confirmarCancelamento(${p.idPedido})">
                        <i class="bi bi-x-circle-fill"></i>
                    </button>` : ""}
                </td>
                <td><strong>#${p.numeroPedido}</strong></td>
                <td><span class="status-pill status-${st.classe}">${st.nome}</span></td>
                <td title="${p.nomeCliente}">${p.nomeCliente}</td>
                <td>${fmtData(p.dthCriacao)}</td>
                <td>${p.desconto > 0 ? `<span class="desconto-valor">- ${fmtMoeda(p.desconto)}</span>` : "—"}</td>
                <td><span class="valor-total">${fmtMoeda(p.valorTotal)}</span></td>
                <td title="${p.observacao || ""}">${p.observacao || "—"}</td>
            </tr>`;
        }).join("");
    }

    const total = pedidosFiltrados.length;
    const totalPaginas = Math.ceil(total / ITENS_POR_PAGINA);
    const ini = total === 0 ? 0 : (paginaAtual - 1) * ITENS_POR_PAGINA + 1;
    const fim = Math.min(paginaAtual * ITENS_POR_PAGINA, total);
    document.querySelector(".paginacao-info").textContent =
        total === 0 ? "Nenhum registro" : `Mostrando ${ini}–${fim} de ${total} pedidos`;

    const controles = document.querySelector(".paginacao-controles");
    controles.innerHTML = "";
    controles.appendChild(criarBtn("‹", paginaAtual === 1, () => { paginaAtual--; renderizarTabela(); }));
    for (let i = 1; i <= totalPaginas; i++) {
        const btn = criarBtn(i, false, () => { paginaAtual = i; renderizarTabela(); });
        if (i === paginaAtual) btn.classList.add("ativo");
        controles.appendChild(btn);
    }
    controles.appendChild(criarBtn("›", paginaAtual >= totalPaginas || !totalPaginas,
        () => { paginaAtual++; renderizarTabela(); }));
}

function criarBtn(label, disabled, onClick) {
    const btn = document.createElement("button");
    btn.className = "btn-pagina";
    btn.textContent = label;
    btn.disabled = disabled;
    btn.addEventListener("click", onClick);
    return btn;
}

// ──────────────────────────────────────────
// MODAL PAGAMENTO DO PEDIDO
// ──────────────────────────────────────────
async function abrirModalPagamento(idPedido) {
    const p = todosPedidos.find(x => x.idPedido === idPedido);
    if (!p) return;
    _pedidoPagamentoAtual = p;

    // Carrega formas de pagamento e categorias se ainda não carregou
    if (!formasPagamentoCache.length) await carregarFormasPagamento();
    if (!categoriaFinanceiraCache.length) await carregarCategorias();

    // Busca total já pago via caixa
    let totalPago = 0;
    try {
        const res = await apiGet(`/Pedido/TotalPago?idPedido=${idPedido}`);
        totalPago = res.totalPago ?? 0;
    } catch { }

    const valorRestante = Math.max(p.valorTotal - totalPago, 0);

    // Preenche cabeçalho
    document.getElementById("pag-pedido-numero").textContent = `#${p.numeroPedido}`;
    document.getElementById("pag-pedido-cliente").textContent = p.nomeCliente;
    document.getElementById("pag-total-pedido").textContent = fmtMoeda(p.valorTotal);
    document.getElementById("pag-total-pago").textContent = fmtMoeda(totalPago);
    document.getElementById("pag-valor-restante").textContent = fmtMoeda(valorRestante);

    // Pré-preenche valor com o restante
    document.getElementById("pag-valor").value = valorRestante > 0 ? valorRestante.toFixed(2) : "";

    // Popula formas de pagamento
    const selFP = document.getElementById("pag-forma-pagamento");
    selFP.innerHTML = formasPagamentoCache.map(f =>
        `<option value="${f.idFormaPagamento}">${f.nome}</option>`).join("");

    // Popula categorias (só entradas)
    const cats = categoriaFinanceiraCache.filter(c => Number(c.tipo) === 1);
    const selCat = document.getElementById("pag-categoria");
    selCat.innerHTML = cats.length
        ? cats.map(c => `<option value="${c.idCategoriaFinanceira}">${c.nome}</option>`).join("")
        : `<option value="">Nenhuma categoria de entrada</option>`;

    document.getElementById("modal-pagamento-pedido").classList.add("open");
}

function fecharModalPagamento() {
    document.getElementById("modal-pagamento-pedido").classList.remove("open");
    _pedidoPagamentoAtual = null;
}

async function confirmarPagamento() {
    if (!_pedidoPagamentoAtual) return;

    const valor = Number(document.getElementById("pag-valor").value);
    const idFP = Number(document.getElementById("pag-forma-pagamento").value);
    const idCat = Number(document.getElementById("pag-categoria").value);
    const desc = document.getElementById("pag-descricao").value || null;

    if (!valor || valor <= 0) { flexToast("Informe um valor válido.", "aviso"); return; }
    if (!idFP) { flexToast("Selecione a forma de pagamento.", "aviso"); return; }
    if (!idCat) { flexToast("Selecione a categoria.", "aviso"); return; }

    const btn = document.getElementById("btn-confirmar-pagamento");
    btn.disabled = true;
    const orig = btn.innerHTML;
    btn.innerHTML = '<i class="bi bi-hourglass-split"></i> Processando...';

    try {
        const resultado = await apiPost("/Pedido/Pagar", {
            IdPedido: _pedidoPagamentoAtual.idPedido,
            IdFormaPagamento: idFP,
            IdCategoriaFinanceira: idCat,
            Valor: valor,
            Descricao: desc
        });

        fecharModalPagamento();
        await carregarPedidos();

        if (resultado?.concluido) {
            flexToast(`🎉 Pedido #${_pedidoPagamentoAtual?.numeroPedido ?? ""} CONCLUÍDO! Pagamento total registrado no caixa.`, "sucesso");
        } else {
            const restante = resultado?.valorRestante ?? 0;
            flexToast(`Pagamento de ${fmtMoeda(valor)} registrado. Restante: ${fmtMoeda(restante)}`, "sucesso");
        }
    } catch (err) {
        flexToast(err.message, "erro");
    } finally {
        btn.disabled = false;
        btn.innerHTML = orig;
    }
}

// ──────────────────────────────────────────
// ABAS DO MODAL
// ──────────────────────────────────────────
function mudarAba(prefixo, aba) {
    const modalId = prefixo === "novo" ? "modal-novo-pedido" : "modal-edicao";
    document.querySelectorAll(`#${modalId} .tab-btn`).forEach(b => b.classList.remove("ativo"));
    document.querySelectorAll(`#${modalId} .tab-painel`).forEach(p => p.classList.remove("ativo"));
    document.getElementById(`tab-btn-${prefixo}-${aba}`).classList.add("ativo");
    document.getElementById(`tab-${prefixo}-${aba}`).classList.add("ativo");
    if (aba === "pagamento") renderizarPagamentos(prefixo);
}

// ──────────────────────────────────────────
// PAGAMENTOS DO MODAL DE PEDIDO
// ──────────────────────────────────────────
function calcularTotalPedido(prefixo) {
    const subtotal = itensPedidoAtual.reduce((a, i) => a + (i.Qtde * i.precoUnit), 0);
    const descontoItens = itensPedidoAtual.reduce((a, i) => a + i.Desconto, 0);
    const descontoGeral = Number(document.getElementById(`${prefixo}-desconto`)?.value || 0);
    const frete = Number(document.getElementById(`${prefixo}-frete`)?.value ||
        document.getElementById("novo-frete")?.value || 0);
    return Math.max(subtotal - descontoItens - descontoGeral + frete, 0);
}

function renderizarPagamentos(prefixo) {
    const lista = document.getElementById(`${prefixo}-pagamentos-lista`);
    const resumo = document.getElementById(`${prefixo}-pagamentos-resumo`);
    if (!lista || !resumo) return;

    const totalPedido = calcularTotalPedido(prefixo);
    const totalPago = pagamentosPedidoAtual.reduce((a, p) => a + p.valor, 0);
    const restante = +(totalPedido - totalPago).toFixed(2);

    lista.innerHTML = !pagamentosPedidoAtual.length
        ? `<div class="pagamentos-empty"><i class="bi bi-credit-card"></i><span>Clique em "Adicionar Pagamento".</span></div>`
        : pagamentosPedidoAtual.map((pag, idx) => `
            <div class="pagamento-item">
                <div>
                    <label class="pagamento-label">Forma de Pagamento</label>
                    <select class="pagamento-select"
                        onchange="atualizarPagamento(${idx},'formaPagamento_id',this.value,'${prefixo}')">
                        ${FORMAS_PAGAMENTO.map(f =>
            `<option value="${f.id}" ${pag.formaPagamento_id === f.id ? "selected" : ""}>${f.nome}</option>`
        ).join("")}
                    </select>
                </div>
                <div>
                    <label class="pagamento-label">Valor</label>
                    <div class="pagamento-valor-wrap">
                        <span class="pagamento-cifrao">R$</span>
                        <input type="number" min="0" step="0.01" class="pagamento-valor-input"
                            value="${pag.valor}"
                            onchange="atualizarPagamento(${idx},'valor',this.value,'${prefixo}')">
                    </div>
                </div>
                <div class="pagamento-item-del">
                    <button type="button" class="btn-del-item"
                        onclick="removerPagamento(${idx},'${prefixo}')">
                        <i class="bi bi-trash3-fill"></i>
                    </button>
                </div>
            </div>`).join("");

    let stClass, stLabel, stIcon;
    if (Math.abs(restante) < 0.01) { stClass = "quitado"; stLabel = "Quitado"; stIcon = "bi-check-circle-fill"; }
    else if (restante < 0) { stClass = "excede"; stLabel = "Valor excedido"; stIcon = "bi-exclamation-triangle-fill"; }
    else { stClass = "pendente"; stLabel = "Valor restante"; stIcon = "bi-clock-fill"; }

    resumo.innerHTML = `
        <div class="pagamentos-resumo-grid">
            <div class="pag-resumo-item">
                <span class="pag-resumo-label">Total</span>
                <span class="pag-resumo-valor">${fmtMoeda(totalPedido)}</span>
            </div>
            <div class="pag-resumo-item">
                <span class="pag-resumo-label">Pago</span>
                <span class="pag-resumo-valor">${fmtMoeda(totalPago)}</span>
            </div>
            <div class="pag-resumo-item pag-resumo-${stClass}">
                <span class="pag-resumo-label"><i class="bi ${stIcon}"></i> ${stLabel}</span>
                <span class="pag-resumo-valor">${fmtMoeda(Math.abs(restante))}</span>
            </div>
        </div>`;
}

function adicionarPagamento(prefixo) {
    const total = calcularTotalPedido(prefixo);
    const totalPago = pagamentosPedidoAtual.reduce((a, p) => a + p.valor, 0);
    pagamentosPedidoAtual.push({
        formaPagamento_id: 4,
        valor: Math.max(+(total - totalPago).toFixed(2), 0)
    });
    renderizarPagamentos(prefixo);
}

function removerPagamento(idx, prefixo) {
    pagamentosPedidoAtual.splice(idx, 1);
    renderizarPagamentos(prefixo);
}

function atualizarPagamento(idx, campo, valor, prefixo) {
    pagamentosPedidoAtual[idx][campo] =
        (campo === "valor" || campo === "formaPagamento_id") ? Number(valor) : valor;
    renderizarPagamentos(prefixo);
}

// ──────────────────────────────────────────
// BUSCA DE CLIENTE
// ──────────────────────────────────────────
function abrirBuscaCliente(prefixo) {
    _buscaClientePrefixo = prefixo;
    document.getElementById("input-busca-cliente-modal").value = "";
    renderListaClientes(clientesCache, "");
    document.getElementById("modal-busca-cliente").classList.add("open");
    setTimeout(() => document.getElementById("input-busca-cliente-modal").focus(), 80);
}
function fecharBuscaCliente() {
    document.getElementById("modal-busca-cliente").classList.remove("open");
    _buscaClientePrefixo = null;
}
function filtrarListaClientes(q) {
    const filtrado = q
        ? clientesCache.filter(c => c.nome?.toLowerCase().includes(q.toLowerCase()) || c.cpfCNPJ?.includes(q))
        : clientesCache;
    renderListaClientes(filtrado, q);
}
function renderListaClientes(lista, q) {
    const el = document.getElementById("lista-busca-clientes");
    if (!lista.length) { el.innerHTML = `<div class="busca-vazia"><i class="bi bi-person-x"></i>Nenhum cliente encontrado</div>`; return; }
    el.innerHTML = lista.map(c => `
        <div class="busca-item" onclick="selecionarCliente(${c.idCliente})">
            <div class="busca-item-info">
                <span class="busca-item-nome">${highlight(c.nome, q)}</span>
                <span class="busca-item-sub">${highlight(c.cpfCNPJ || "", q)}</span>
            </div>
            <i class="bi bi-chevron-right" style="color:#9ca3af"></i>
        </div>`).join("");
}
function selecionarCliente(id) {
    const c = clientesCache.find(c => c.idCliente === id);
    if (!c || !_buscaClientePrefixo) return;
    document.getElementById(`${_buscaClientePrefixo}-cliente-nome`).value = c.nome;
    document.getElementById(`${_buscaClientePrefixo}-cliente-id`).value = c.idCliente;
    const elEnd = document.getElementById(`${_buscaClientePrefixo}-cliente-endereco`);
    if (elEnd) elEnd.value = c.enderecoId || 1;
    fecharBuscaCliente();
}

// ──────────────────────────────────────────
// BUSCA DE PRODUTO
// ──────────────────────────────────────────
function abrirBuscaProduto(idx, prefixo) {
    _buscaProdutoIdx = idx;
    _buscaProdutoPrefixo = prefixo;
    document.getElementById("input-busca-produto-modal").value = "";
    renderListaProdutos(produtosCache, "");
    document.getElementById("modal-busca-produto").classList.add("open");
    setTimeout(() => document.getElementById("input-busca-produto-modal").focus(), 80);
}
function fecharBuscaProduto() {
    document.getElementById("modal-busca-produto").classList.remove("open");
    if (_buscaProdutoIdx !== null) {
        const item = itensPedidoAtual[_buscaProdutoIdx];
        if (item && item.produto_id === null) {
            itensPedidoAtual.splice(_buscaProdutoIdx, 1);
            renderizarItens(_buscaProdutoPrefixo);
        }
    }
    _buscaProdutoIdx = null; _buscaProdutoPrefixo = null;
}
function filtrarListaProdutos(q) {
    const filtrado = q
        ? produtosCache.filter(p => p.nome?.toLowerCase().includes(q.toLowerCase()) || p.sku?.toLowerCase().includes(q.toLowerCase()))
        : produtosCache;
    renderListaProdutos(filtrado, q);
}
function renderListaProdutos(lista, q) {
    const el = document.getElementById("lista-busca-produtos");
    const ativos = lista.filter(p => p.fAtivo);
    if (!ativos.length) { el.innerHTML = `<div class="busca-vazia"><i class="bi bi-box-seam"></i>Nenhum produto</div>`; return; }
    el.innerHTML = ativos.map(p => `
        <div class="busca-item" onclick="selecionarProduto(${p.idProduto})">
            <div class="busca-item-info">
                <span class="busca-item-nome">${highlight(p.nome, q)}</span>
                <span class="busca-item-sub">Estoque: ${p.qtdEstoque ?? "—"}</span>
            </div>
            <span class="busca-item-preco">${fmtMoeda(p.precoVenda)}</span>
        </div>`).join("");
}
function selecionarProduto(id) {
    const p = produtosCache.find(p => p.idProduto === id);
    if (!p || _buscaProdutoIdx === null) return;
    const item = itensPedidoAtual[_buscaProdutoIdx];
    item.produto_id = p.idProduto; item.nomeProduto = p.nome;
    item.precoUnit = p.precoVenda;
    item.Subtotal = (item.Qtde * item.precoUnit) - item.Desconto;
    const prefixo = _buscaProdutoPrefixo;
    _buscaProdutoIdx = null; _buscaProdutoPrefixo = null;
    document.getElementById("modal-busca-produto").classList.remove("open");
    renderizarItens(prefixo);
}

// ──────────────────────────────────────────
// ITENS DO PEDIDO
// ──────────────────────────────────────────
function renderizarItens(prefixo) {
    const tbody = document.getElementById(`${prefixo}-itens-body`);
    if (!tbody) return;
    tbody.innerHTML = itensPedidoAtual.map((item, idx) => `
        <tr>
            <td class="col-produto">
                <div class="produto-cell">
                    <input type="text" readonly value="${item.nomeProduto || ""}"
                        placeholder="Selecionar produto..."
                        onclick="abrirBuscaProduto(${idx},'${prefixo}')">
                    <button type="button" class="btn-buscar-produto"
                        onclick="abrirBuscaProduto(${idx},'${prefixo}')">
                        <i class="bi bi-search"></i>
                    </button>
                </div>
            </td>
            <td class="col-qtde">
                <input type="number" min="1" value="${item.Qtde}"
                    onchange="atualizarItem(${idx},'Qtde',this.value,'${prefixo}')">
            </td>
            <td class="col-preco">
                <input type="number" min="0" step="0.01" value="${item.precoUnit}"
                    onchange="atualizarItem(${idx},'precoUnit',this.value,'${prefixo}')">
            </td>
            <td class="col-desc">
                <input type="number" min="0" step="0.01" value="${item.Desconto}"
                    onchange="atualizarItem(${idx},'Desconto',this.value,'${prefixo}')">
            </td>
            <td class="col-sub subtotal-label">${fmtMoeda(item.Subtotal)}</td>
            <td class="col-del">
                <button type="button" class="btn-del-item" onclick="removerItem(${idx},'${prefixo}')">
                    <i class="bi bi-trash3-fill"></i>
                </button>
            </td>
        </tr>`).join("");
    atualizarResumo(prefixo);
}

function atualizarItem(idx, campo, valor, prefixo) {
    itensPedidoAtual[idx][campo] = Number(valor);
    itensPedidoAtual[idx].Subtotal =
        (itensPedidoAtual[idx].Qtde * itensPedidoAtual[idx].precoUnit) - itensPedidoAtual[idx].Desconto;
    renderizarItens(prefixo);
}
function adicionarItem(prefixo) {
    const idx = itensPedidoAtual.length;
    itensPedidoAtual.push({ produto_id: null, nomeProduto: "", Qtde: 1, precoUnit: 0, Desconto: 0, Subtotal: 0 });
    renderizarItens(prefixo);
    abrirBuscaProduto(idx, prefixo);
}
function removerItem(idx, prefixo) {
    itensPedidoAtual.splice(idx, 1);
    renderizarItens(prefixo);
}
function atualizarResumo(prefixo) {
    const subtotal = itensPedidoAtual.reduce((a, i) => a + (i.Qtde * i.precoUnit), 0);
    const descontoItens = itensPedidoAtual.reduce((a, i) => a + i.Desconto, 0);
    const descontoGeral = Number(document.getElementById(`${prefixo}-desconto`)?.value || 0);
    const freteEl = document.getElementById(`${prefixo}-frete`) ?? document.getElementById("novo-frete");
    const frete = Number(freteEl?.value || 0);
    const total = subtotal - descontoItens - descontoGeral + frete;
    const el = id => document.getElementById(`${prefixo}-resumo-${id}`);
    if (el("subtotal")) el("subtotal").textContent = fmtMoeda(subtotal);
    if (el("desc-itens")) el("desc-itens").textContent = `- ${fmtMoeda(descontoItens)}`;
    if (el("desc-geral")) el("desc-geral").textContent = `- ${fmtMoeda(descontoGeral)}`;
    if (el("total")) el("total").textContent = fmtMoeda(Math.max(total, 0));
}

// Select de status — exclui Concluído e Cancelado (não editáveis manualmente)
function montarSelectStatus(statusAtualId) {
    return Object.entries(STATUS_MAP)
        .filter(([id]) => Number(id) !== 5 && Number(id) !== 6)
        .map(([id, s]) =>
            `<option value="${id}" ${Number(id) === statusAtualId ? "selected" : ""}>${s.nome}</option>`
        ).join("");
}

// ──────────────────────────────────────────
// MODAL NOVO PEDIDO
// ──────────────────────────────────────────
async function abrirModal() {
    document.getElementById("form-pedido").reset();
    document.getElementById("novo-cliente-nome").value = "";
    document.getElementById("novo-cliente-id").value = "";
    document.getElementById("novo-cliente-endereco").value = "";
    itensPedidoAtual = []; pagamentosPedidoAtual = [];
    mudarAba("novo", "pedido");
    renderizarItens("novo");
    renderizarPagamentos("novo");
    await Promise.all([carregarClientes(), carregarProdutos()]);
    document.getElementById("modal-novo-pedido").classList.add("open");
}
function fecharModal() { document.getElementById("modal-novo-pedido").classList.remove("open"); }

document.getElementById("form-pedido").addEventListener("submit", async function (e) {
    e.preventDefault();
    const clienteId = Number(document.getElementById("novo-cliente-id").value);
    const enderecoId = Number(document.getElementById("novo-cliente-endereco").value) || 1;
    if (!clienteId) { flexToast("Selecione um cliente.", "aviso"); return; }
    const itensValidos = itensPedidoAtual.filter(i => i.produto_id !== null);
    if (!itensValidos.length) { flexToast("Adicione pelo menos um item.", "aviso"); return; }
    const desconto = Number(document.getElementById("novo-desconto").value) || 0;
    const frete = Number(document.getElementById("novo-frete")?.value || 0);
    const btn = this.querySelector('[type="submit"]');
    btn.disabled = true;
    try {
        await apiPost("/Pedido/Criar", {
            Pedido: {
                IdCliente: clienteId, EnderecoId: enderecoId, Canal: "PROPRIO",
                NumeroExterno: null, Observacao: document.getElementById("novo-obs").value || null,
                ValorFrete: frete, Desconto: desconto, ValorTotal: 0
            },
            Itens: itensValidos.map(i => ({
                IdProduto: i.produto_id, Quantidade: i.Qtde,
                ValorUnitario: i.precoUnit, Desconto: i.Desconto, ValorTotal: i.Subtotal
            })),
            Pagamentos: pagamentosPedidoAtual.map(p => ({ FormaPagamento_id: p.formaPagamento_id, Valor: p.valor }))
        });
        fecharModal();
        await carregarPedidos();
        flexToast("Pedido criado com sucesso!", "sucesso");
    } catch (err) { flexToast("Erro: " + err.message, "erro"); }
    finally { btn.disabled = false; }
});

// ──────────────────────────────────────────
// MODAL EDIÇÃO
// ──────────────────────────────────────────
async function abrirEdicao(idPedido) {
    _pedidoEmEdicao = todosPedidos.find(x => x.idPedido === idPedido);
    if (!_pedidoEmEdicao) return;
    await Promise.all([carregarClientes(), carregarProdutos()]);
    document.getElementById("edit-numero").value = `PED-${String(_pedidoEmEdicao.numeroPedido).padStart(3, "0")}`;
    document.getElementById("edit-cliente-nome").value = _pedidoEmEdicao.nomeCliente;
    document.getElementById("edit-cliente-id").value = _pedidoEmEdicao.idCliente ?? "";
    document.getElementById("edit-desconto").value = _pedidoEmEdicao.desconto ?? 0;
    document.getElementById("edit-obs").value = _pedidoEmEdicao.observacao ?? "";
    document.getElementById("novo-frete").value = _pedidoEmEdicao.valorFrete ?? 0;
    document.getElementById("edit-status").innerHTML = montarSelectStatus(_pedidoEmEdicao.statusPedidoId);
    try {
        const itensBackend = await apiGet(`/Pedido/ListarItens?idPedido=${idPedido}`);
        itensPedidoAtual = itensBackend.map(i => ({
            produto_id: i.idProduto, nomeProduto: i.nomeProduto,
            Qtde: i.quantidade, precoUnit: i.valorUnitario,
            Desconto: i.desconto ?? 0, Subtotal: i.valorTotal
        }));
    } catch { itensPedidoAtual = []; }
    try {
        const pags = await apiGet(`/Pedido/ListarPagamentos?idPedido=${idPedido}`);
        pagamentosPedidoAtual = pags.map(p => ({ formaPagamento_id: p.formaPagamento_id, valor: p.valor }));
    } catch { pagamentosPedidoAtual = []; }
    mudarAba("edit", "pedido");
    renderizarItens("edit");
    renderizarPagamentos("edit");
    document.getElementById("modal-edicao").classList.add("open");
}
function fecharEdicao() {
    document.getElementById("modal-edicao").classList.remove("open");
    _pedidoEmEdicao = null; itensPedidoAtual = []; pagamentosPedidoAtual = [];
}

document.getElementById("form-edicao").addEventListener("submit", async function (e) {
    e.preventDefault();
    if (!_pedidoEmEdicao) return;
    const clienteId = Number(document.getElementById("edit-cliente-id").value);
    if (!clienteId) { flexToast("Selecione um cliente.", "aviso"); return; }
    const itensValidos = itensPedidoAtual.filter(i => i.produto_id !== null);
    if (!itensValidos.length) { flexToast("Adicione pelo menos um item.", "aviso"); return; }
    const statusId = Number(document.getElementById("edit-status").value);
    const desconto = Number(document.getElementById("edit-desconto").value) || 0;
    const frete = Number(document.getElementById("novo-frete")?.value || 0);
    const btn = this.querySelector('[type="submit"]');
    btn.disabled = true;
    try {
        await apiPost("/Pedido/Editar", {
            IdPedido: _pedidoEmEdicao.idPedido, StatusPedidoId: statusId,
            Desconto: desconto, ValorFrete: frete,
            Observacao: document.getElementById("edit-obs").value || null,
            Itens: itensValidos.map(i => ({
                IdProduto: i.produto_id, Quantidade: i.Qtde,
                ValorUnitario: i.precoUnit, Desconto: i.Desconto, ValorTotal: i.Subtotal
            })),
            Pagamentos: pagamentosPedidoAtual.map(p => ({ FormaPagamento_id: p.formaPagamento_id, Valor: p.valor }))
        });
        fecharEdicao(); await carregarPedidos();
        flexToast("Pedido atualizado!", "sucesso");
    } catch (err) { flexToast("Erro: " + err.message, "erro"); }
    finally { btn.disabled = false; }
});

// ──────────────────────────────────────────
// MODAL DETALHES
// ──────────────────────────────────────────
async function abrirDetalhes(idPedido) {
    const p = todosPedidos.find(x => x.idPedido === idPedido);
    if (!p) return;
    const st = STATUS_MAP[p.statusPedidoId] ?? { nome: "Desconhecido", classe: "pendente" };
    document.getElementById("det-numero").textContent = `#${p.numeroPedido}`;
    document.getElementById("det-status").innerHTML = `<span class="status-pill status-${st.classe}">${st.nome}</span>`;
    document.getElementById("det-cliente").textContent = p.nomeCliente;
    document.getElementById("det-data").textContent = fmtData(p.dthCriacao);
    document.getElementById("det-desconto").textContent = p.desconto > 0 ? fmtMoeda(p.desconto) : "—";
    document.getElementById("det-total").textContent = fmtMoeda(p.valorTotal);
    document.getElementById("det-obs").textContent = p.observacao || "—";
    try {
        const itens = await apiGet(`/Pedido/ListarItens?idPedido=${idPedido}`);
        document.getElementById("det-itens-body").innerHTML = itens.map(i => `
            <tr>
                <td>${i.nomeProduto}</td>
                <td style="text-align:center">${i.quantidade}</td>
                <td>${fmtMoeda(i.valorUnitario)}</td>
                <td>${i.desconto > 0 ? fmtMoeda(i.desconto) : "—"}</td>
                <td style="font-weight:700">${fmtMoeda(i.valorTotal)}</td>
            </tr>`).join("");
    } catch { document.getElementById("det-itens-body").innerHTML = `<tr><td colspan="5" class="empty-state">Erro.</td></tr>`; }
    try {
        const pags = await apiGet(`/Pedido/ListarPagamentos?idPedido=${idPedido}`);
        if (!pags.length) {
            document.getElementById("det-pagamentos").innerHTML =
                `<div class="pagamentos-empty"><i class="bi bi-credit-card"></i><span>Nenhum pagamento registrado.</span></div>`;
        } else {
            const totalPago = pags.reduce((a, pg) => a + pg.valor, 0);
            document.getElementById("det-pagamentos").innerHTML = `
                <table class="table-itens" style="margin-bottom:1rem">
                    <thead><tr><th>Forma de Pagamento</th><th>Valor</th><th>Data</th></tr></thead>
                    <tbody>
                        ${pags.map(pg => {
                const forma = FORMAS_PAGAMENTO.find(f => f.id === pg.formaPagamento_id)?.nome ?? `#${pg.formaPagamento_id}`;
                return `<tr><td>${forma}</td><td style="font-weight:700">${fmtMoeda(pg.valor)}</td><td>${fmtData(pg.dthPagamento)}</td></tr>`;
            }).join("")}
                        <tr style="border-top:2px solid #eaecf0">
                            <td style="font-weight:700">Total pago</td>
                            <td style="font-weight:700;color:#15803d">${fmtMoeda(totalPago)}</td>
                            <td></td>
                        </tr>
                    </tbody>
                </table>`;
        }
    } catch { document.getElementById("det-pagamentos").innerHTML = `<div class="pagamentos-empty"><span>Erro.</span></div>`; }
    try {
        const hist = await apiGet(`/Pedido/ListarHistoricoStatus?idPedido=${idPedido}`);
        document.getElementById("det-historico").innerHTML = !hist.length
            ? `<div class="empty-state">Nenhum histórico.</div>`
            : hist.map(h => {
                const stH = STATUS_MAP[h.statusPedido_id] ?? { nome: `Status ${h.statusPedido_id}`, classe: "pendente" };
                return `<div class="historico-item">
                    <div class="historico-dot"><i class="bi bi-check-lg"></i></div>
                    <div class="historico-conteudo">
                        <div class="historico-status"><span class="status-pill status-${stH.classe}">${stH.nome}</span></div>
                        <div class="historico-data">${fmtDataHora(h.dthAlteracao)} — ${h.nomeUsuario}</div>
                        ${h.observacao ? `<div class="historico-obs">${h.observacao}</div>` : ""}
                    </div>
                </div>`;
            }).join("");
    } catch { document.getElementById("det-historico").innerHTML = `<div class="empty-state">Erro.</div>`; }
    document.getElementById("modal-detalhes").classList.add("open");
}
function fecharDetalhes() { document.getElementById("modal-detalhes").classList.remove("open"); }

// ──────────────────────────────────────────
// CANCELAMENTO
// ──────────────────────────────────────────
let _pedidoParaCancelar = null;
function confirmarCancelamento(idPedido) {
    _pedidoParaCancelar = idPedido;
    const p = todosPedidos.find(x => x.idPedido === idPedido);
    document.getElementById("confirm-mensagem").innerHTML =
        `Deseja <strong>cancelar</strong> o pedido <strong>#${p?.numeroPedido}</strong>?`;
    document.getElementById("modal-confirmar").classList.add("open");
}
function fecharConfirmar() {
    document.getElementById("modal-confirmar").classList.remove("open");
    _pedidoParaCancelar = null;
}
document.getElementById("confirm-btn-sim").addEventListener("click", async function () {
    if (!_pedidoParaCancelar) return;
    this.disabled = true;
    try {
        await apiPost("/Pedido/Cancelar", _pedidoParaCancelar);
        fecharConfirmar(); await carregarPedidos();
        flexToast("Pedido cancelado.", "sucesso");
    } catch (err) { flexToast("Erro: " + err.message, "erro"); }
    finally { this.disabled = false; }
});

// ──────────────────────────────────────────
// FECHAR CLICANDO FORA
// ──────────────────────────────────────────
["modal-novo-pedido", "modal-edicao", "modal-detalhes", "modal-confirmar", "modal-pagamento-pedido"]
    .forEach(id => {
        document.getElementById(id)?.addEventListener("click", function (e) {
            if (e.target !== this) return;
            if (id === "modal-novo-pedido") fecharModal();
            else if (id === "modal-edicao") fecharEdicao();
            else if (id === "modal-detalhes") fecharDetalhes();
            else if (id === "modal-confirmar") fecharConfirmar();
            else if (id === "modal-pagamento-pedido") fecharModalPagamento();
        });
    });
["modal-busca-cliente", "modal-busca-produto"].forEach(id => {
    document.getElementById(id)?.addEventListener("click", function (e) {
        if (e.target === this) {
            if (id === "modal-busca-cliente") fecharBuscaCliente();
            else fecharBuscaProduto();
        }
    });
});

// ──────────────────────────────────────────
// INIT
// ──────────────────────────────────────────
document.getElementById("btn-f-todos").classList.add("sel-todos");
carregarPedidos();