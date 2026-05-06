// Define a quantidade de itens exibidos por página na listagem de lançamentos
const ITENS_POR_PAGINA = 15;

// Controla a página atual da paginação
let paginaAtual = 1;

// Controla qual aba está ativa na interface (lancamentos, contas ou historico)
let abaAtiva = "lancamentos";

// Armazena o estado atual do caixa (null = fechado)
let caixaAtual = null;

// Lista de lançamentos do caixa atual
let lancamentos = [];

// Histórico de caixas anteriores
let historicoList = [];

// Lista de formas de pagamento disponíveis
let formasPagamento = [];

// Lista de categorias financeiras
let categorias = [];

// Lista de contas a receber
let contasReceber = [];

// Cache de clientes para evitar múltiplas requisições
let clientesCache = [];

// Cache de produtos
let produtosCache = [];

// Cache de categorias de produto
let categoriasProdutoCache = [];

// Tipo de lançamento atualmente selecionado no modal
let tipoLancamentoAtual = "VENDA";

// Categoria selecionada no modal de lançamento
let _categoriaSelecionada = null;

// Itens da venda rápida
let _vendaRapidaItens = [];

// Cliente selecionado na venda rápida
let _clienteSelecionadoVenda = null;

// Índice do produto sendo editado na venda rápida
let _vrProdutoIdx = null;

// Conta a receber atualmente sendo manipulada
let _contaReceberAtual = null;

// Função helper para requisições GET, já validando erro HTTP
async function apiGet(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`GET ${url} → ${res.status}`);
    return res.json();
}

// Função helper para requisições POST com JSON
async function apiPost(url, body) {
    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });

    // Se erro, tenta extrair mensagem do backend
    if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(t || `POST ${url} → ${res.status}`);
    }

    // Algumas APIs podem não retornar JSON
    return res.json().catch(() => null);
}

// Formata valor monetário no padrão brasileiro
function fmtMoeda(v) {
    return `R$ ${Number(v || 0)
        .toFixed(2)
        .replace(".", ",")
        .replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
}

// Formata data e hora considerando timezone local
function fmtDataHora(s) {
    if (!s) return "—";

    // Remove Z (UTC) para evitar conversão incorreta
    const local = s.endsWith("Z") ? s.slice(0, -1) : s;

    return new Date(local).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

// Formata apenas data
function fmtData(s) {
    if (!s) return "—";
    return new Date(s).toLocaleDateString("pt-BR");
}

// Sistema de toast visual para feedback ao usuário
function flexToast(msg, tipo = "sucesso") {

    // Define cores por tipo
    const cores = {
        sucesso: "#15803d",
        erro: "#dc2626",
        aviso: "#d97706"
    };

    // Define ícones por tipo
    const icones = {
        sucesso: "bi-check-circle-fill",
        erro: "bi-x-circle-fill",
        aviso: "bi-exclamation-triangle-fill"
    };

    // Cria elemento do toast
    const t = document.createElement("div");

    // Estilização inline para facilitar reaproveitamento
    t.style.cssText = `
        position:fixed;
        top:2rem;
        right:2rem;
        background:${cores[tipo]};
        color:#fff;
        padding:1.2rem 1.8rem;
        border-radius:.8rem;
        font-size:1.4rem;
        font-family:'Segoe UI',sans-serif;
        display:flex;
        align-items:center;
        gap:.8rem;
        box-shadow:0 .6rem 2rem rgba(0,0,0,.2);
        z-index:9999;
        opacity:0;
        transform:translateY(-1rem);
        transition:all .3s ease;
        max-width:36rem;
    `;

    // Conteúdo interno do toast
    t.innerHTML = `<i class="bi ${icones[tipo]}"></i><span>${msg}</span>`;

    document.body.appendChild(t);

    // Anima entrada
    requestAnimationFrame(() => {
        t.style.opacity = "1";
        t.style.transform = "translateY(0)";
    });

    // Remove automaticamente após tempo
    setTimeout(() => {
        t.style.opacity = "0";
        t.style.transform = "translateY(-1rem)";
        setTimeout(() => t.remove(), 350);
    }, 3200);
}

// Verifica se lançamento é entrada com base na categoria
function isEntrada(l) {
    return Number(l.tipoCategoria) === 1;
}

// Soma todas entradas do caixa
function calcularEntradas() {
    return lancamentos
        .filter(l => isEntrada(l))
        .reduce((a, l) => a + Number(l.valor), 0);
}

// Soma todas saídas do caixa
function calcularSaidas() {
    return lancamentos
        .filter(l => !isEntrada(l))
        .reduce((a, l) => a + Number(l.valor), 0);
}

// Calcula saldo final do caixa
function calcularSaldo() {
    if (!caixaAtual) return 0;

    return Number(caixaAtual.saldoInicial)
        + calcularEntradas()
        - calcularSaidas();
}

// Função principal que inicializa a tela
async function inicializar() {
    try {

        // Busca status do caixa
        const statusData = await apiGet("/Caixa/Status");
        caixaAtual = statusData.caixa;

        // Prepara chamadas paralelas
        const promises = [
            apiGet("/Caixa/Historico"),
            apiGet("/Caixa/FormasPagamento"),
            apiGet("/Caixa/Categorias"),
            apiGet("/Caixa/ContasReceber").catch(() => [])
        ];

        // Se caixa aberto, busca também lançamentos e breakdown
        if (caixaAtual) {
            promises.push(apiGet("/Caixa/Lancamentos").catch(() => []));
            promises.push(apiGet("/Caixa/Breakdown").catch(() => []));
        }

        // Executa tudo em paralelo
        const results = await Promise.all(promises);

        // Distribui resultados
        historicoList = results[0];
        formasPagamento = results[1];
        categorias = results[2];
        contasReceber = results[3];
        lancamentos = caixaAtual ? (results[4] || []) : [];

        // Atualiza UI principal
        atualizarPainel();

        // Se veio breakdown pronto, usa ele
        if (caixaAtual && results[5]?.length) {
            renderizarBreakdownData(results[5]);
        } else {
            atualizarBreakdown();
        }

    } catch (err) {
        console.error("Erro ao inicializar:", err);
        flexToast("Erro ao carregar dados do caixa.", "erro");
    }
}