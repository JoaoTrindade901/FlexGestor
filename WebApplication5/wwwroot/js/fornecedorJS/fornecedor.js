// ===== FORNECEDOR.JS — integrado com backend FlexGestor =====

// Lista principal de fornecedores carregados da API
let fornecedores = [];

// Lista filtrada usada para renderizar na tabela
let filtrado = [];

// Armazena o fornecedor que está sendo editado no momento
let fornecedorEdicao = null;

// Armazena o fornecedor selecionado para ação (ativar/inativar)
let fornecedorAcao = null;

// Define o filtro de status atual (todos, ativo, inativo)
let filtroStatus = "todos";

// Função genérica para requisições GET
async function apiGet(url) {
    const res = await fetch(url); // faz requisição
    if (!res.ok) throw new Error(`GET ${url} → ${res.status}`); // trata erro HTTP
    return res.json(); // retorna resposta em JSON
}

// Função genérica para requisições POST
async function apiPost(url, body) {
    const res = await fetch(url, {
        method: "POST", // método POST
        headers: { "Content-Type": "application/json" }, // define JSON
        body: JSON.stringify(body) // envia payload
    });
    if (!res.ok) {
        const txt = await res.text().catch(() => ""); // tenta pegar erro do backend
        throw new Error(txt || `POST ${url} → ${res.status}`); // lança erro
    }
    return res;
}

// Carrega fornecedores do backend
async function carregarFornecedores() {
    try {
        fornecedores = await apiGet("/Fornecedor/Listar"); // busca lista
        aplicarFiltros(); // aplica filtros após carregar
    } catch (err) {
        alert("Erro ao carregar fornecedores: " + err.message); // alerta erro
    }
}

// Dispara filtragem manual (ex: digitação)
function filtrar() {
    aplicarFiltros();
}

// Aplica todos os filtros (status + busca)
function aplicarFiltros() {
    const termo = document.getElementById("input-busca")?.value.toLowerCase() || ""; // pega texto digitado

    filtrado = fornecedores.filter(f => {
        if (filtroStatus === "ativo" && !f.fAtivo) return false; // filtra ativos
        if (filtroStatus === "inativo" && f.fAtivo) return false; // filtra inativos

        // filtra por nome fantasia ou CNPJ
        if (termo && !f.nomeFantasia?.toLowerCase().includes(termo) &&
            !f.cnpj?.includes(termo)) return false;

        return true; // mantém no resultado
    });

    renderizarTabela(); // atualiza UI
}

// Define filtro de status e atualiza visual dos botões
function setFiltroStatus(valor) {
    filtroStatus = valor; // define filtro atual

    // remove classes visuais anteriores
    document.querySelectorAll(".btn-status-filtro").forEach(b =>
        b.classList.remove("sel-todos", "sel-ativo", "sel-inativo"));

    // adiciona classe no botão selecionado
    document.getElementById(`btn-filtro-${valor}`).classList.add(`sel-${valor}`);

    aplicarFiltros(); // reaplica filtros
}

// Renderiza a tabela de fornecedores
function renderizarTabela() {
    const tbody = document.getElementById("tbody-fornecedor");

    // caso não haja resultados
    if (filtrado.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="empty-state">Nenhum fornecedor encontrado.</td></tr>`;
        return;
    }

    // monta HTML dinamicamente
    tbody.innerHTML = filtrado.map(f => `
        <tr>
            <td class="area-acoes">
                <button class="btn-acao btn-editar" onclick="abrirModalEdicao(${f.idFornecedor})">
                    <i class="bi bi-pencil-fill"></i>
                </button>
                <button class="btn-acao ${f.fAtivo ? 'btn-inativar' : 'btn-reativar'}"
                    onclick="confirmarAcao(${f.idFornecedor})">
                    <i class="bi bi-${f.fAtivo ? 'trash3-fill' : 'arrow-counterclockwise'}"></i>
                </button>
            </td>
            <td>
                <span class="status-pill ${f.fAtivo ? 'status-normal' : 'status-critico'}">
                    ${f.fAtivo ? 'Ativo' : 'Inativo'}
                </span>
            </td>
            <td>${f.nomeFantasia}</td>
            <td>${f.razaoSocial || '—'}</td>
            <td>${f.cnpj}</td>
            <td>${f.telefone}</td>
            <td>${f.email || '—'}</td>
        </tr>`).join(""); // junta tudo em string única
}

// Abre modal para criar novo fornecedor
function abrirModal() {
    fornecedorEdicao = null; // limpa estado de edição
    document.getElementById("formFornecedor").reset(); // limpa formulário
    document.querySelector("#modalFornecedor .modal-header h3").textContent = "Novo Fornecedor"; // título
    document.getElementById("modalFornecedor").classList.add("open"); // abre modal
}

// Fecha modal principal
function fecharModal() {
    document.getElementById("modalFornecedor").classList.remove("open");
}

// Abre modal preenchido para edição
function abrirModalEdicao(id) {
    fornecedorEdicao = fornecedores.find(f => f.idFornecedor === id); // busca fornecedor

    if (!fornecedorEdicao) return; // segurança

    // altera título
    document.querySelector("#modalFornecedor .modal-header h3").textContent = "Editar Fornecedor";

    // preenche campos
    document.getElementById("nomeFantasia").value = fornecedorEdicao.nomeFantasia || "";
    document.getElementById("razaoSocial").value = fornecedorEdicao.razaoSocial || "";
    document.getElementById("cnpj").value = fornecedorEdicao.cnpj || "";
    document.getElementById("telefone").value = fornecedorEdicao.telefone || "";
    document.getElementById("email").value = fornecedorEdicao.email || "";

    document.getElementById("modalFornecedor").classList.add("open"); // abre modal
}

// Evento de submit do formulário
document.getElementById("formFornecedor").addEventListener("submit", async function (e) {
    e.preventDefault(); // impede reload da página

    const btnSalvar = this.querySelector('[type="submit"]');
    btnSalvar.disabled = true; // evita múltiplos cliques

    // monta payload para API
    const payload = {
        IdFornecedor: fornecedorEdicao?.idFornecedor || 0, // 0 para novo
        NomeFantasia: document.getElementById("nomeFantasia").value.trim(),
        RazaoSocial: document.getElementById("razaoSocial").value.trim() || null,
        CNPJ: document.getElementById("cnpj").value.replace(/\D/g, ""), // remove máscara
        Telefone: document.getElementById("telefone").value.replace(/\D/g, ""),
        Email: document.getElementById("email").value.trim() || null
    };

    try {
        if (fornecedorEdicao) {
            await apiPost("/Fornecedor/Editar", payload); // edição
        } else {
            await apiPost("/Fornecedor/Criar", payload); // criação
        }

        fecharModal(); // fecha modal
        await carregarFornecedores(); // recarrega lista
    } catch (err) {
        alert("Erro ao salvar fornecedor: " + err.message);
    } finally {
        btnSalvar.disabled = false; // reativa botão
    }
});

// Abre modal de confirmação para ativar/inativar
function confirmarAcao(id) {
    fornecedorAcao = fornecedores.find(f => f.idFornecedor === id); // busca fornecedor
    if (!fornecedorAcao) return;

    const acao = fornecedorAcao.fAtivo ? "inativar" : "reativar"; // define ação

    // monta mensagem dinâmica
    document.getElementById("confirmMensagem").innerHTML =
        `Deseja <strong>${acao}</strong> o fornecedor <strong>${fornecedorAcao.nomeFantasia}</strong>?`;

    document.getElementById("modalConfirmar").classList.add("open"); // abre modal
}

// Fecha modal de confirmação
function fecharModalConfirmar() {
    document.getElementById("modalConfirmar").classList.remove("open");
    fornecedorAcao = null; // limpa estado
}

// Confirma ação (ativar/inativar)
document.getElementById("btnConfirmar").addEventListener("click", async function () {
    if (!fornecedorAcao) return;

    this.disabled = true; // bloqueia botão

    try {
        await apiPost("/Fornecedor/AlterarStatus", fornecedorAcao.idFornecedor); // chama API
        fecharModalConfirmar(); // fecha modal
        await carregarFornecedores(); // atualiza lista
    } catch (err) {
        alert("Erro ao alterar status: " + err.message);
    } finally {
        this.disabled = false; // libera botão
    }
});

// Permite fechar modais clicando fora
["modalFornecedor", "modalConfirmar"].forEach(id => {
    document.getElementById(id)?.addEventListener("click", function (e) {
        if (e.target === this) {
            if (id === "modalFornecedor") fecharModal();
            else fecharModalConfirmar();
        }
    });
});

// Define filtro padrão como "todos"
document.getElementById("btn-filtro-todos").classList.add("sel-todos");

// Inicializa carregando fornecedores
carregarFornecedores();