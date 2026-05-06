// ===== CATEGORIPRODUTO.JS — integrado com backend =====

// Array principal com todas as categorias vindas do backend
let categorias = [];

// Array derivado usado para exibir os dados filtrados na tela
let filtrado = [];

// Guarda a categoria atualmente em edição (null quando for criação)
let categoriaEdicao = null;

// Guarda a categoria selecionada para ação de ativar/inativar
let categoriaAcao = null;

// Define o filtro atual de status (todos | ativo | inativo)
let filtroStatus = "todos";


// Função helper para requisições GET
// Faz o fetch da URL e lança erro caso não seja sucesso
async function apiGet(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`GET ${url} → ${res.status}`);
    return res.json(); // retorna o JSON da resposta
}

// Função helper para requisições POST
// Envia o body como JSON para o backend
async function apiPost(url, body) {
    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });

    // Se der erro, tenta extrair a mensagem do backend
    if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(t || `POST ${url} → ${res.status}`);
    }

    // Retorna a resposta (não parseia JSON aqui)
    return res;
}


// Carrega todas as categorias do backend
// Após carregar, aplica o filtro para exibir na tela
async function carregarCategorias() {
    try {
        categorias = await apiGet("/CategoriaProduto/Listar");
        aplicarFiltro(); // atualiza a lista exibida
    } catch (err) {
        alert("Erro ao carregar categorias: " + err.message);
    }
}


// Renderiza a tabela HTML com base no array filtrado
function renderizarTabela() {
    const tbody = document.getElementById("tbody-categoria");
    if (!tbody) return;

    // Caso não tenha dados, mostra estado vazio
    if (filtrado.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="empty-state">Nenhuma categoria encontrada.</td></tr>`;
        return;
    }

    // Monta o HTML linha a linha
    tbody.innerHTML = filtrado.map(c => `
        <tr>
            <td class="area-acoes">
                <!-- Botão de editar -->
                <button class="btn-acao btn-editar" onclick="abrirModalEdicao(${c.idCategoria})">
                    <i class="bi bi-pencil-fill"></i>
                </button>

                <!-- Botão de ativar/inativar -->
                <button class="btn-acao ${c.fAtivo ? 'btn-inativar' : 'btn-reativar'}"
                    onclick="confirmarAcao(${c.idCategoria})">
                    <i class="bi bi-${c.fAtivo ? 'trash3-fill' : 'arrow-counterclockwise'}"></i>
                </button>
            </td>

            <!-- Status -->
            <td>
                <span class="status-pill ${c.fAtivo ? 'status-normal' : 'status-critico'}">
                    ${c.fAtivo ? 'Ativo' : 'Inativo'}
                </span>
            </td>

            <!-- Nome -->
            <td>${c.nome}</td>

            <!-- Descrição -->
            <td>${c.descricao || '—'}</td>

            <!-- Categoria pai -->
            <td>${c.nomeCategoriaPai || '—'}</td>
        </tr>
    `).join("");
}


// Executa o filtro com base no termo de busca e status selecionado
function filtrar() {
    const termo = document.getElementById("input-busca")?.value.toLowerCase() || "";

    filtrado = categorias.filter(c => {

        // Filtra por status
        if (filtroStatus === "ativo" && !c.fAtivo) return false;
        if (filtroStatus === "inativo" && c.fAtivo) return false;

        // Filtra por nome (busca textual)
        if (termo && !c.nome.toLowerCase().includes(termo)) return false;

        return true;
    });

    // Atualiza a tabela após filtrar
    renderizarTabela();
}


// Reinicia o filtro (copia todas categorias e reaplica regra)
function aplicarFiltro() {
    filtrado = [...categorias];
    filtrar();
}


// Define o filtro de status e atualiza o estilo dos botões
function setFiltroStatus(valor) {
    filtroStatus = valor;

    // Remove classes de seleção de todos os botões
    document.querySelectorAll(".btn-status-filtro").forEach(b =>
        b.classList.remove("sel-todos", "sel-ativo", "sel-inativo"));

    // Adiciona classe ao botão ativo
    document.getElementById("btn-filtro-" + valor).classList.add("sel-" + valor);

    filtrar();
}


// Preenche o select de categoria pai
// Exclui a própria categoria para evitar relacionamento circular
function popularSelectPai(idExcluir = null) {
    const select = document.getElementById("categoriaPai");

    // Opção padrão
    select.innerHTML = `<option value="">Nenhuma</option>`;

    categorias
        .filter(c => c.fAtivo && c.idCategoria !== idExcluir)
        .forEach(c => {
            const opt = document.createElement("option");
            opt.value = c.idCategoria;
            opt.textContent = c.nome;
            select.appendChild(opt);
        });
}


// Abre o modal para criar nova categoria
function abrirModal() {
    categoriaEdicao = null; // modo criação

    document.getElementById("formCategoria").reset();

    // Preenche select de categorias pai
    popularSelectPai();

    document.getElementById("modalCategoria").classList.add("open");
}


// Fecha o modal de categoria
function fecharModal() {
    document.getElementById("modalCategoria").classList.remove("open");
}


// Abre o modal preenchido para edição
function abrirModalEdicao(id) {
    categoriaEdicao = categorias.find(c => c.idCategoria === id);
    if (!categoriaEdicao) return;

    // Preenche os campos do formulário
    document.getElementById("nomeCategoria").value = categoriaEdicao.nome;
    document.getElementById("descricao").value = categoriaEdicao.descricao || "";

    // Preenche select de pai excluindo a própria categoria
    popularSelectPai(categoriaEdicao.idCategoria);

    document.getElementById("categoriaPai").value = categoriaEdicao.idCategoriaPai || "";

    document.getElementById("modalCategoria").classList.add("open");
}


// Abre modal de confirmação para ativar/inativar
function confirmarAcao(id) {
    categoriaAcao = categorias.find(c => c.idCategoria === id);
    if (!categoriaAcao) return;

    const acao = categoriaAcao.fAtivo ? "inativar" : "reativar";

    // Mensagem dinâmica
    document.getElementById("confirmMensagem").innerHTML =
        `Deseja realmente <strong>${acao}</strong> a categoria <strong>"${categoriaAcao.nome}"</strong>?`;

    document.getElementById("modalConfirmar").classList.add("open");
}


// Fecha modal de confirmação
function fecharModalConfirmar() {
    document.getElementById("modalConfirmar").classList.remove("open");
    categoriaAcao = null;
}


// Executa quando o DOM estiver pronto
document.addEventListener("DOMContentLoaded", () => {

    // Submit do formulário (criar ou editar categoria)
    document.getElementById("formCategoria").addEventListener("submit", async function (e) {
        e.preventDefault();

        // Monta payload para o backend
        const payload = {
            idCategoria: categoriaEdicao?.idCategoria ?? 0,
            nome: document.getElementById("nomeCategoria").value.trim(),
            descricao: document.getElementById("descricao").value.trim() || null,
            idCategoriaPai: document.getElementById("categoriaPai").value
                ? Number(document.getElementById("categoriaPai").value)
                : null
        };

        try {
            // Decide entre criação ou edição
            if (categoriaEdicao) {
                await apiPost("/CategoriaProduto/Editar", payload);
            } else {
                await apiPost("/CategoriaProduto/Criar", payload);
            }

            fecharModal();

            // Recarrega lista após salvar
            await carregarCategorias();

        } catch (err) {
            alert("Erro ao salvar: " + err.message);
        }
    });


    // Confirma ação de ativar/inativar categoria
    document.getElementById("btnConfirmar").addEventListener("click", async function () {
        if (!categoriaAcao) return;

        try {
            await apiPost("/CategoriaProduto/AlterarStatus", categoriaAcao.idCategoria);

            fecharModalConfirmar();

            // Recarrega dados após alteração
            await carregarCategorias();

        } catch (err) {
            alert("Erro ao alterar status: " + err.message);
        }
    });


    // Listener para busca em tempo real
    document.getElementById("input-busca")?.addEventListener("input", filtrar);

    // Define estado inicial do botão de filtro
    document.getElementById("btn-filtro-todos").classList.add("sel-todos");

    // Carrega categorias ao iniciar
    carregarCategorias();
});