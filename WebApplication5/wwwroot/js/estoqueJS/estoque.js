// Lista principal com todos os itens de estoque vindos do backend
let lista = [];

// Lista derivada usada para exibição após aplicação de filtros
let listaFiltrada = [];

// Texto digitado pelo usuário para busca
let filtroTexto = "";

// Filtro de status (todos | critico | normal | excesso)
let filtroStatus = "todos";

// Lista de fornecedores carregados do backend
let fornecedores = [];

// Lista base de produtos ativos que podem ser inseridos no estoque
let produtosBase = [];

// Guarda o fornecedor selecionado nos fluxos (wizard/configuração)
let fornecedorSelecionado = null;

// Guarda o produto selecionado no fluxo de inserção
let produtoSelecionado = null;

// Controla em qual etapa o usuário está no wizard de inserção
let etapaInserir = 1;

// Total de etapas do wizard de inserção
const TOTAL_ETAPAS = 4;

// Controle da etapa atual do modal de configuração de estoque
let cfgEtapa = 1;

// Total de etapas do modal de configuração (2 etapas)
const CFG_TOTAL_ETAPAS = 2;

// Fornecedor selecionado especificamente no modal de configuração
let cfgFornecedorSelecionado = null;


// Função genérica para requisições GET
// Faz chamada HTTP e retorna JSON ou lança erro com status
async function apiGet(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`GET ${url} → ${res.status}`);
    return res.json();
}


// Função genérica para requisições POST
// Envia body como JSON e trata erro retornando mensagem do backend quando possível
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


// Componente visual de feedback (toast)
// Cria dinamicamente um elemento na tela com cor e ícone baseado no tipo
function flexToast(msg, tipo = "sucesso") {
    const cores = {
        sucesso: "#15803d",
        erro: "#dc2626",
        aviso: "#d97706"
    };

    const icones = {
        sucesso: "bi-check-circle-fill",
        erro: "bi-x-circle-fill",
        aviso: "bi-exclamation-triangle-fill"
    };

    const t = document.createElement("div");

    // Estilo inline aplicado diretamente no elemento criado
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

    // Conteúdo interno com ícone + mensagem
    t.innerHTML = `<i class="bi ${icones[tipo]}"></i><span>${msg}</span>`;

    document.body.appendChild(t);

    // Animação de entrada
    requestAnimationFrame(() => {
        t.style.opacity = "1";
        t.style.transform = "translateY(0)";
    });

    // Remove automaticamente após 3.2s
    setTimeout(() => {
        t.style.opacity = "0";
        t.style.transform = "translateY(-1rem)";
        setTimeout(() => t.remove(), 350);
    }, 3200);
}


// Formata datas para padrão brasileiro
// Caso não exista data, retorna placeholder
function formatarData(data) {
    if (!data) return "—";
    return new Date(data).toLocaleDateString("pt-BR");
}


// Carrega os dados de estoque do backend
// Após carregar, aplica os filtros automaticamente
async function carregarEstoque() {
    try {
        lista = await apiGet("/Estoque/Listar");
        aplicarFiltros();
    } catch (err) {
        flexToast("Erro ao carregar estoque: " + err.message, "erro");
    }
}


// Carrega apenas produtos ativos (usados no wizard de inserção)
async function carregarProdutosBase() {
    try {
        const todos = await apiGet("/Produto/Listar");

        // Mantém apenas produtos ativos (true ou 1)
        produtosBase = todos.filter(p => p.fAtivo === true || p.fAtivo === 1);
    } catch {
        produtosBase = [];
    }
}


// Carrega lista de fornecedores
async function carregarFornecedores() {
    try {
        fornecedores = await apiGet("/Fornecedor/Listar");
    } catch {
        fornecedores = [];
    }
}


// Determina o status do item com base na quantidade atual e limites
function classificarStatus(item) {
    const qtd = item.quantidade ?? 0;
    const min = item.estoqueMinimo ?? 0;
    const max = item.estoqueMax ?? 0;

    // Abaixo ou igual ao mínimo → crítico
    if (qtd <= min) return "critico";

    // Acima do máximo (quando definido) → excesso
    if (max > 0 && qtd > max) return "excesso";

    // Caso contrário → normal
    return "normal";
}


// Define o filtro de status selecionado na UI
function setFiltroStatus(valor) {
    filtroStatus = valor;

    // Remove classes visuais de todos os botões
    document.querySelectorAll(".btn-status-filtro").forEach(b =>
        b.classList.remove("sel-todos", "sel-critico", "sel-normal", "sel-excesso")
    );

    // Aplica classe ao botão selecionado
    document.getElementById(`btn-filtro-${valor}`)?.classList.add(`sel-${valor}`);

    aplicarFiltros();
}


// Atualiza o texto de busca e reaplica filtros
function filtrarTabela() {
    filtroTexto = document.getElementById("input-termo-busca")?.value ?? "";
    aplicarFiltros();
}


// Aplica filtros de status + texto sobre a lista original
function aplicarFiltros() {
    const termo = filtroTexto.toLowerCase();

    listaFiltrada = lista.filter(item => {
        const status = classificarStatus(item);

        // Filtra por status se não for "todos"
        if (filtroStatus !== "todos" && status !== filtroStatus) return false;

        // Filtra por nome do produto
        if (termo && !(item.nomeProduto ?? "").toLowerCase().includes(termo)) return false;

        return true;
    });

    renderizarTabela();
}


// Renderiza a tabela HTML com os itens filtrados
function renderizarTabela() {
    const tbody = document.querySelector("#tabela-estoque tbody");

    if (!tbody) return;

    // Caso não tenha dados, mostra estado vazio
    if (!listaFiltrada.length) {
        tbody.innerHTML = `<tr><td colspan="9" class="empty-state">Nenhum item encontrado.</td></tr>`;
        return;
    }

    // Monta HTML linha a linha
    tbody.innerHTML = listaFiltrada.map(item => {
        const status = classificarStatus(item);

        const labelSt = {
            critico: "Crítico",
            normal: "Normal",
            excesso: "Excesso"
        }[status];

        const classSt = `status-${status}`;

        const qtd = item.quantidade ?? 0;

        // Classe visual da quantidade baseada no status
        const qtdClass =
            status === "critico" ? "qtde-critica" :
                status === "excesso" ? "qtde-excesso" :
                    "qtde-normal";

        // Sanitiza strings para evitar quebra de HTML
        const nome = (item.nomeProduto ?? "").replace(/'/g, "&#39;");
        const local = (item.local ?? "").replace(/'/g, "&#39;");

        const min = item.estoqueMinimo ?? 0;
        const max = item.estoqueMax ?? 0;

        return `
        <tr>
            <td class="area-acoes">
                <button class="btn-acao btn-editar"
                    onclick="abrirModalMovimentacao(${item.idProduto}, '${nome}')">
                    <i class="bi bi-arrow-left-right"></i>
                </button>

                <button class="btn-acao"
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