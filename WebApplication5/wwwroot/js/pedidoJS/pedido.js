// ===== PEDIDO.JS — com pagamento integrado ao caixa =====

const ITENS_POR_PAGINA = 10; // quantidade de pedidos exibidos por página
let paginaAtual = 1; // controla a página atual da listagem
let todosPedidos = []; // armazena todos os pedidos vindos da API
let pedidosFiltrados = []; // armazena os pedidos após aplicação de filtros
let clientesCache = []; // cache de clientes carregados da API
let produtosCache = []; // cache de produtos carregados da API
let formasPagamentoCache = []; // cache das formas de pagamento
let categoriaFinanceiraCache = []; // cache de categorias financeiras
let filtroStatusPedido = "todos"; // filtro atual por status
let filtroClienteStr = ""; // texto digitado para filtro por cliente
let itensPedidoAtual = []; // itens do pedido sendo criado/editado
let pagamentosPedidoAtual = []; // pagamentos do pedido atual
let _buscaClientePrefixo = null; // controle interno para busca de cliente
let _buscaProdutoIdx = null; // índice do item que está buscando produto
let _buscaProdutoPrefixo = null; // prefixo do contexto da busca de produto
let _pedidoEmEdicao = null; // pedido atualmente em edição
let _pedidoPagamentoAtual = null; // pedido atualmente sendo pago

// IDs alinhados com tabela StatusPedido do banco
const STATUS_MAP = {
    1: { nome: "Pendente", classe: "pendente" }, // pedido ainda não confirmado
    2: { nome: "Confirmado", classe: "confirmado" }, // pedido confirmado
    3: { nome: "Separando", classe: "separando" }, // itens sendo preparados
    4: { nome: "Enviado", classe: "enviado" }, // pedido enviado
    5: { nome: "Concluído", classe: "concluido" }, // pedido finalizado
    6: { nome: "Cancelado", classe: "cancelado" }, // pedido cancelado
};

// mapeia nomes de status (string) para seus respectivos IDs
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

// resolve o ID do status do pedido independentemente da origem do campo
function resolverStatusId(pedido) {
    if (pedido.statusPedidoId && pedido.statusPedidoId > 0) return pedido.statusPedidoId;
    if (pedido.statusPedido_id && pedido.statusPedido_id > 0) return pedido.statusPedido_id;
    if (pedido.status) return STATUS_NOME_PARA_ID[pedido.status.toUpperCase()] ?? 0;
    return 0;
}

// define quais IDs pertencem a cada filtro de status
const FILTRO_STATUS_IDS = {
    todos: [1, 2, 3, 4, 5, 6],
    pendente: [1],
    confirmado: [2],
    separando: [3],
    enviado: [4],
    concluido: [5],
    cancelado: [6],
};

// formas de pagamento padrão usadas como fallback
const FORMAS_PAGAMENTO = [
    { id: 1, nome: "Dinheiro" },
    { id: 2, nome: "Cartão de Crédito" },
    { id: 3, nome: "Cartão de Débito" },
    { id: 4, nome: "PIX" },
    { id: 5, nome: "Boleto" },
    { id: 6, nome: "Transferência" },
];

// função helper para GET
async function apiGet(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`GET ${url} → ${res.status}`);
    return res.json();
}

// função helper para POST
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

// exibe um toast na tela com mensagem e tipo (sucesso, erro ou aviso)
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

// carrega pedidos da API e aplica transformação de status
async function carregarPedidos() {
    try {
        const raw = await apiGet("/Pedido/Listar");
        todosPedidos = raw.map(p => ({ ...p, statusPedidoId: resolverStatusId(p) }));
        aplicarFiltros();
    } catch (err) {
        flexToast("Erro ao carregar pedidos: " + err.message, "erro");
    }
}

// carrega clientes e armazena em cache
async function carregarClientes() {
    try { clientesCache = await apiGet("/Cliente/Listar"); }
    catch (err) { console.warn("Clientes:", err.message); }
}

// carrega produtos e armazena em cache
async function carregarProdutos() {
    try { produtosCache = await apiGet("/Produto/Listar"); }
    catch (err) { console.warn("Produtos:", err.message); }
}

// carrega formas de pagamento ou usa fallback
async function carregarFormasPagamento() {
    try { formasPagamentoCache = await apiGet("/Caixa/FormasPagamento"); }
    catch { formasPagamentoCache = FORMAS_PAGAMENTO; }
}

// carrega categorias financeiras
async function carregarCategorias() {
    try { categoriaFinanceiraCache = await apiGet("/Caixa/Categorias"); }
    catch { categoriaFinanceiraCache = []; }
}

// aplica filtros por status e cliente
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

// atualiza filtro de cliente a partir do input
function filtrarCliente() {
    filtroClienteStr = document.getElementById("input-busca-cliente").value.trim();
    aplicarFiltros();
}

// define filtro de status e atualiza UI
function setFiltroStatus(valor) {
    filtroStatusPedido = valor;
    document.querySelectorAll(".btn-status-filtro").forEach(b =>
        b.className = b.className.replace(/\bsel-\S+/g, "").trim());
    document.getElementById(`btn-f-${valor}`)?.classList.add(`sel-${valor}`);
    aplicarFiltros();
}

// formata valor para moeda BRL
function fmtMoeda(v) {
    return `R$ ${Number(v || 0).toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
}

// formata data simples
function fmtData(s) {
    if (!s) return "—";
    return new Date(s).toLocaleDateString("pt-BR");
}

// formata data e hora
function fmtDataHora(s) {
    if (!s) return "—";
    const local = s.endsWith("Z") ? s.slice(0, -1) : s;
    return new Date(local).toLocaleString("pt-BR", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit"
    });
}

// destaca texto buscado com <mark>
function highlight(texto, busca) {
    if (!busca || !texto) return texto ?? "";
    const re = new RegExp(`(${busca.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    return texto.replace(re, "<mark>$1</mark>");
}

// inicializa estado inicial da tela
document.getElementById("btn-f-todos").classList.add("sel-todos");
carregarPedidos();