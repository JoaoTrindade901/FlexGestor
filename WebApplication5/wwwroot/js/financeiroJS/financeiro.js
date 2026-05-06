// ===== FINANCEIRO.JS — FlexGestor =====

// Arrays principais que armazenam os dados vindos da API para contas a receber
let contasReceber = []; // lista completa
let contasReceberFiltradas = []; // lista após aplicar filtros
let filtroReceber = "todos"; // filtro por status (todos, aberto, vencido, pago)
let filtroReceberTexto = ""; // texto digitado na busca
let pagReceberAtual = 1; // página atual da tabela
const PAG_RECEBER = 15; // quantidade de registros por página

// Arrays principais para contas a pagar (mesma lógica do receber)
let contasPagar = [];
let contasPagarFiltradas = [];
let filtroPagar = "todos";
let filtroPagarTexto = "";
let pagPagarAtual = 1;
const PAG_PAGAR = 15;

// Dados auxiliares carregados da API
let formasPagamento = []; // formas de pagamento disponíveis
let categorias = []; // categorias financeiras
let clientes = []; // clientes cadastrados
let fornecedores = []; // fornecedores cadastrados

// Filtros de período (data de vencimento)
let filtroVencimentoInicioR = null;
let filtroVencimentoFimR = null;
let filtroVencimentoInicioP = null;
let filtroVencimentoFimP = null;

// Configuração de ordenação das tabelas
let ordemReceber = { campo: 'dthVencimento', asc: true };
let ordemPagar = { campo: 'dthVencimento', asc: true };

// Função genérica para GET na API
async function apiGet(url) {
    const res = await fetch(url); // faz requisição
    if (!res.ok) throw new Error(`GET ${url} → ${res.status}`); // trata erro HTTP
    return res.json(); // retorna JSON
}

// Função genérica para POST na API
async function apiPost(url, body) {
    const res = await fetch(url, {
        method: "POST", // método HTTP
        headers: { "Content-Type": "application/json" }, // define JSON
        body: JSON.stringify(body) // envia dados
    });
    if (!res.ok) {
        const t = await res.text().catch(() => ""); // tenta pegar mensagem do backend
        throw new Error(t || `POST ${url} → ${res.status}`); // lança erro
    }
    return res;
}

// Função de toast para exibir mensagens ao usuário
function flexToast(msg, tipo = "sucesso") {
    const cores = { sucesso: "#15803d", erro: "#dc2626", aviso: "#d97706" }; // cores por tipo
    const icones = { sucesso: "bi-check-circle-fill", erro: "bi-x-circle-fill", aviso: "bi-exclamation-triangle-fill" }; // ícones
    const t = document.createElement("div"); // cria elemento
    t.style.cssText = `position:fixed;top:2rem;right:2rem;background:${cores[tipo]};color:#fff;
        padding:1.2rem 1.8rem;border-radius:.8rem;font-size:1.4rem;font-family:'Segoe UI',sans-serif;
        display:flex;align-items:center;gap:.8rem;box-shadow:0 .6rem 2rem rgba(0,0,0,.2);
        z-index:9999;opacity:0;transform:translateY(-1rem);transition:all .3s ease;max-width:36rem;`; // estilo
    t.innerHTML = `<i class="bi ${icones[tipo]}"></i><span>${msg}</span>`; // conteúdo
    document.body.appendChild(t); // adiciona na tela
    requestAnimationFrame(() => { t.style.opacity = "1"; t.style.transform = "translateY(0)"; }); // anima entrada
    setTimeout(() => { t.style.opacity = "0"; t.style.transform = "translateY(-1rem)"; setTimeout(() => t.remove(), 350); }, 3200); // remove após tempo
}

// Formata valor monetário em padrão brasileiro
function fmt(v) {
    return "R$ " + Number(v ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Formata data para pt-BR
function fmtData(d) {
    if (!d) return "—"; // fallback
    return new Date(d).toLocaleDateString("pt-BR");
}

// Define classe visual do status
function getPillClass(status) {
    if (status === "PAGO") return "pill-pago";
    if (status === "VENCIDO") return "pill-vencido";
    return "pill-aberto";
}

// Define texto do status
function getPillLabel(status) {
    if (status === "PAGO") return "Pago";
    if (status === "VENCIDO") return "Vencido";
    return "Aberto";
}

// Carrega todos os dados do backend
async function carregarTudo() {
    console.log("[carregarTudo] iniciando...");
    try {
        // executa todas as requisições em paralelo
        [contasReceber, contasPagar, formasPagamento, categorias, clientes, fornecedores] = await Promise.all([
            apiGet("/Financeiro/ListarContasReceber"),
            apiGet("/Financeiro/ListarContasPagar"),
            apiGet("/Caixa/FormasPagamento"),
            apiGet("/Caixa/Categorias"),
            apiGet("/Cliente/Listar"),
            apiGet("/Fornecedor/Listar")
        ]);

        console.log("[carregarTudo] contasReceber:", contasReceber.length);

        atualizarKPIs(); // atualiza indicadores
        aplicarFiltroReceber(); // aplica filtros
        aplicarFiltroPagar();
        popularSelects(); // popula dropdowns
        popularSelectsEdicao();

        console.log("[carregarTudo] concluído");
    } catch (err) {
        console.error("[carregarTudo] ERRO:", err.message);
        flexToast("Erro ao carregar dados: " + err.message, "erro");
    }
}

// Atualiza os indicadores financeiros da tela
function atualizarKPIs() {
    const abertas = contasReceber.filter(c => c.statusAtual !== "PAGO"); // contas abertas
    const vencidasR = contasReceber.filter(c => c.statusAtual === "VENCIDO"); // vencidas receber
    const abertoP = contasPagar.filter(c => c.statusAtual !== "PAGO"); // contas abertas pagar
    const vencidasP = contasPagar.filter(c => c.statusAtual === "VENCIDO"); // vencidas pagar

    // calcula totais
    const totalReceber = abertas.reduce((s, c) => s + Math.max(0, c.valorTotal - c.valorPago), 0);
    const totalVencidoR = vencidasR.reduce((s, c) => s + Math.max(0, c.valorTotal - c.valorPago), 0);
    const totalPagar = abertoP.reduce((s, c) => s + Math.max(0, c.valorTotal - c.valorPago), 0);
    const totalVencidoP = vencidasP.reduce((s, c) => s + Math.max(0, c.valorTotal - c.valorPago), 0);

    // atualiza UI
    document.getElementById("kpi-a-receber").textContent = fmt(totalReceber);
    document.getElementById("kpi-vencido-receber").textContent = fmt(totalVencidoR);
    document.getElementById("kpi-a-pagar").textContent = fmt(totalPagar);
    document.getElementById("kpi-vencido-pagar").textContent = fmt(totalVencidoP);
}

// Ordena array com base no campo e direção
function ordenar(arr, ordem) {
    return [...arr].sort((a, b) => {
        let va = a[ordem.campo], vb = b[ordem.campo]; // valores comparados

        if (typeof va === 'string') { // normaliza string
            va = va.toLowerCase();
            vb = (vb ?? '').toLowerCase();
        }

        if (va === null || va === undefined) return 1;
        if (vb === null || vb === undefined) return -1;

        return ordem.asc ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
    });
}

// Inicialização da tela
document.addEventListener("DOMContentLoaded", () => {
    // adiciona eventos para fechar modais ao clicar fora
    [
        ["modal-nova-receber", fecharModalNovaReceber],
        ["modal-receber-pagamento", fecharModalReceberPagamento],
        ["modal-venc-receber", fecharModalVencReceber],
        ["modal-editar-receber", fecharModalEditarReceber],
        ["modal-excluir-receber", fecharModalExcluirReceber],
        ["modal-nova-pagar", fecharModalNovaPagar],
        ["modal-pagar-conta", fecharModalPagarConta],
        ["modal-venc-pagar", fecharModalVencPagar],
        ["modal-editar-pagar", fecharModalEditarPagar],
        ["modal-excluir-pagar", fecharModalExcluirPagar],
        ["modal-historico", fecharHistorico],
    ].forEach(([id, fn]) => {
        document.getElementById(id)?.addEventListener("click", function (e) {
            if (e.target === this) fn(); // fecha se clicar no fundo
        });
    });

    // ativa filtros padrão
    document.getElementById("fr-todos")?.classList.add("sel-todos");
    document.getElementById("fp-todos")?.classList.add("sel-todos");

    carregarTudo(); // inicia carregamento
});