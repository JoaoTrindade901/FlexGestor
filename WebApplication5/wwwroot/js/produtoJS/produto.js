// ===== PRODUTO.JS — FlexGestor (com dados fiscais) =====

// Define a quantidade máxima de itens exibidos por página.
// Isso ajuda a controlar performance e futura paginação da tabela.
const ITENS_POR_PAGINA = 15;

// Lista principal de produtos carregada da API. É o “estado bruto”.
let lista = [];

// Lista filtrada que realmente será exibida na tabela após aplicar busca e status.
let listaFiltrada = [];

// Armazena o texto digitado no campo de busca para filtrar produtos pelo nome.
let filtroTexto = "";

// Controla o filtro de status selecionado: todos, ativo ou inativo.
let filtroStatus = "todos";

// Armazena categorias vindas do backend para popular selects de produto.
let categorias = [];

// Controla o modo do modal de produto: null = criação, número = edição de um produto existente.
let modoEdicao = null;

// Guarda o ID do produto que está sendo editado no modal fiscal.
let produtoFiscalAtual = null;


// Função base para requisições GET.
// Centraliza chamadas ao backend e garante tratamento de erro consistente.
async function apiGet(url) {
    const res = await fetch(url);

    // Se a resposta não for OK (200-299), interrompe e retorna erro padronizado.
    if (!res.ok) throw new Error(`GET ${url} → ${res.status}`);

    // Converte resposta para JSON antes de retornar.
    return res.json();
}


// Função base para requisições POST.
// Usada para enviar dados ao backend em formato JSON.
async function apiPost(url, body) {
    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });

    // Se o backend retornar erro, tenta capturar mensagem detalhada.
    if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || `POST ${url} → ${res.status}`);
    }

    // Tenta converter resposta em JSON, se não houver retorno, devolve null.
    return res.json().catch(() => null);
}


// Função responsável por exibir mensagens temporárias na tela (toast).
function flexToast(msg, tipo = "sucesso") {

    // Define cores associadas a cada tipo de mensagem.
    const cores = {
        sucesso: "#15803d",
        erro: "#dc2626",
        aviso: "#d97706"
    };

    // Define ícones Bootstrap para cada tipo de feedback.
    const icones = {
        sucesso: "bi-check-circle-fill",
        erro: "bi-x-circle-fill",
        aviso: "bi-exclamation-triangle-fill"
    };

    // Cria elemento HTML do toast dinamicamente.
    const t = document.createElement("div");

    // Aplica estilo visual fixo no canto superior direito da tela.
    t.style.cssText =
        `position:fixed;top:2rem;right:2rem;background:${cores[tipo]};color:#fff;
        padding:1.2rem 1.8rem;border-radius:.8rem;font-size:1.4rem;font-family:'Segoe UI',sans-serif;
        display:flex;align-items:center;gap:.8rem;box-shadow:0 .6rem 2rem rgba(0,0,0,.2);
        z-index:9999;opacity:0;transform:translateY(-1rem);transition:all .3s ease;max-width:40rem;`;

    // Monta conteúdo visual com ícone + mensagem.
    t.innerHTML = `<i class="bi ${icones[tipo]}"></i><span>${msg}</span>`;

    // Insere o toast no DOM.
    document.body.appendChild(t);

    // Força animação de entrada (fade + subida suave).
    requestAnimationFrame(() => {
        t.style.opacity = "1";
        t.style.transform = "translateY(0)";
    });

    // Remove automaticamente após alguns segundos com animação de saída.
    setTimeout(() => {
        t.style.opacity = "0";
        t.style.transform = "translateY(-1rem)";
        setTimeout(() => t.remove(), 350);
    }, 3500);
}


// Função que busca produtos no backend e atualiza o estado principal da tela.
async function carregarProdutos() {
    try {
        lista = await apiGet("/Produto/Listar");

        // Após carregar, sempre recalcula filtros para manter consistência da tabela.
        aplicarFiltros();
    } catch (err) {
        flexToast("Erro ao carregar produtos: " + err.message, "erro");
    }
}


// Carrega categorias para uso no formulário de produto.
// Isso permite associar produto a uma categoria.
async function carregarCategorias() {
    try {
        categorias = await apiGet("/CategoriaProduto/Listar");

        const sel = document.getElementById("prod-categoria");
        if (!sel) return;

        // Limpa opções antigas e adiciona opção padrão.
        sel.innerHTML = `<option value="">Selecione...</option>`;

        // Adiciona apenas categorias ativas ao select.
        categorias
            .filter(c => c.fAtivo)
            .forEach(c => {
                const opt = document.createElement("option");
                opt.value = c.idCategoria;
                opt.textContent = c.nome;
                sel.appendChild(opt);
            });

    } catch (err) {
        console.warn("Categorias:", err.message);
    }
}


// Define o filtro de status da tabela (todos, ativo, inativo).
function setFiltroStatus(valor) {
    filtroStatus = valor;

    // Remove classes visuais de todos os botões de filtro.
    document.querySelectorAll(".btn-status-filtro")
        .forEach(b => b.classList.remove("ativo-sel", "ativo-on", "ativo-off"));

    // Mapeia status para classe visual correspondente.
    const mapa = {
        todos: "ativo-sel",
        ativo: "ativo-on",
        inativo: "ativo-off"
    };

    // Aplica classe no botão selecionado.
    document.getElementById(`btn-filtro-${valor}`)?.classList.add(mapa[valor]);

    // Reaplica filtros na lista.
    aplicarFiltros();
}


// Atualiza o texto de busca e reaplica filtros.
function filtrarTabela() {
    filtroTexto = document.getElementById("input-termo-busca")?.value?.trim() ?? "";
    aplicarFiltros();
}


// Aplica filtros combinando texto e status na lista de produtos.
function aplicarFiltros() {
    const termo = filtroTexto.toLowerCase();

    listaFiltrada = lista.filter(p => {
        const ativo = p.fAtivo === true || p.fAtivo === 1;

        // filtro por status
        if (filtroStatus === "ativo" && !ativo) return false;
        if (filtroStatus === "inativo" && ativo) return false;

        // filtro por nome
        if (termo && !(p.nome ?? "").toLowerCase().includes(termo)) return false;

        return true;
    });

    // após filtrar, renderiza tabela novamente
    renderizarTabela();
}


// Formata valores numéricos para moeda brasileira.
function fmtMoeda(v) {
    return v != null ? `R$ ${Number(v).toFixed(2).replace(".", ",")}` : "—";
}


// Verifica se produto já possui configuração fiscal mínima.
function temDadosFiscais(p) {
    return !!(p.ncm && p.cfop);
}


// Renderiza tabela HTML com base na lista filtrada.
function renderizarTabela() {
    const tbody = document.querySelector("#tabela-produtos tbody");
    if (!tbody) return;

    // Caso não existam produtos na lista filtrada.
    if (!listaFiltrada.length) {
        tbody.innerHTML = `<tr><td colspan="8" class="empty-state">Nenhum produto encontrado.</td></tr>`;
        atualizarPaginacao(0);
        return;
    }

    // Monta HTML de cada linha da tabela.
    tbody.innerHTML = listaFiltrada.map(p => {
        const ativo = p.fAtivo === true || p.fAtivo === 1;
        const temFisc = temDadosFiscais(p);
        const idProd = p.idProduto ?? p.IdProduto;

        return `<tr>
            <td class="area-acoes">
                <!-- botão editar produto -->
                <button class="btn-acao btn-editar" onclick="abrirModalEdicao(${idProd})">
                    <i class="bi bi-pencil-fill"></i>
                </button>

                <!-- botão dados fiscais -->
                <button class="btn-acao btn-fiscal" onclick="abrirModalFiscal(${idProd})">
                    <i class="bi bi-file-earmark-text-fill"></i>
                </button>

                <!-- botão ativar/inativar -->
                <button class="btn-acao ${ativo ? "btn-inativar" : "btn-reativar"}"
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
                ${temFisc
                ? `<span>Configurado</span>`
                : `<span>Pendente</span>`}
            </td>
        </tr>`;
    }).join("");

    atualizarPaginacao(listaFiltrada.length);
}