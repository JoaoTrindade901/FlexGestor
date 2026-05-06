// Constante que define quantos usuários serão exibidos por página na listagem
const USUARIOS_POR_PAGINA = 10;

// Controle de paginação atual da tabela
let paginaAtual = 1;

// Lista já filtrada (resultado dos filtros aplicados)
let usuariosFiltrados = [];

// Lista completa de usuários carregados da API
let todoUsuarios = [];

// Usuário atualmente sendo editado no modal de edição
let usuarioEmEdicao = null;

// Usuário selecionado para ativar/inativar
let usuarioParaAlterarStatus = null;

// Filtro de status selecionado (todos, ativo ou inativo)
let filtroStatus = "todos";

// Texto digitado no campo de busca
let filtroTexto = "";

// Tipo de filtro (por nome ou CPF)
let filtroTipo = "nome";

// Função responsável por capturar o token antifalsificação (CSRF)
// Ele é necessário para requisições seguras no backend (principalmente ASP.NET)
function getCsrfToken() {
    return document.querySelector('input[name="__RequestVerificationToken"]')?.value ?? "";
}

// Função genérica para requisições GET
// Centraliza o fetch e já trata erro de HTTP
async function apiGet(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`GET ${url} → ${res.status}`);
    return res.json();
}

// Função genérica para requisições POST enviando JSON
// Também já injeta o token CSRF no header
// E tenta extrair mensagem de erro vinda do backend
async function apiPost(url, body) {
    const res = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "RequestVerificationToken": getCsrfToken()
        },
        body: JSON.stringify(body)
    });

    if (!res.ok) {
        let mensagem = "Erro ao processar.";

        const texto = await res.text();

        try {
            const data = JSON.parse(texto);
            mensagem = data.mensagem || data.title || texto || mensagem;
        } catch {
            mensagem = texto || mensagem;
        }

        throw new Error(mensagem);
    }

    return res;
}

// POST alternativo usando form-urlencoded
// Usado em endpoints que não aceitam JSON diretamente
async function apiPostForm(url, params) {
    const form = new URLSearchParams(params);

    const res = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "RequestVerificationToken": getCsrfToken()
        },
        body: form.toString()
    });

    if (!res.ok) throw new Error(`POST ${url} → ${res.status}`);
    return res;
}

// Função principal que busca todos os usuários no backend
// Depois normaliza os dados (evita null e padroniza campos)
async function carregarUsuarios() {
    try {
        const data = await apiGet("/Usuario/Listar");

        todoUsuarios = data.map(u => ({
            idUsuario: u.idUsuario,
            login: u.login,
            nome: u.nome,
            cpf: u.cpf ?? "",
            email: u.email ?? "",
            telefone: u.telefone ?? "",
            cargo_id: u.cargo_id,
            dthCriacao: u.dthCriacao,
            fAtivo: u.fAtivo
        }));

        aplicarFiltros();
    } catch (err) {
        flexToast("Não foi possível carregar os usuários: " + err.message, "erro");
    }
}

// Carrega lista de cargos para popular selects de perfil
async function carregarCargos(selectId) {
    try {
        const cargos = await apiGet("/Usuario/ListarCargos");

        const sel = document.getElementById(selectId);
        sel.innerHTML = "";

        cargos.forEach(c => {
            const opt = document.createElement("option");
            opt.value = c.idCargo;
            opt.textContent = c.nome ?? c.Nome;
            sel.appendChild(opt);
        });

    } catch (err) {
        flexToast("Não foi possível carregar os cargos.", "aviso");
    }
}

// Aplica filtros combinando status, texto e tipo de busca
// Essa função é o "coração" da filtragem da tabela
function aplicarFiltros() {
    usuariosFiltrados = todoUsuarios.filter(u => {

        // Filtra por status ativo/inativo
        if (filtroStatus === "ativo" && !u.fAtivo) return false;
        if (filtroStatus === "inativo" && u.fAtivo) return false;

        // Se há texto de filtro, aplica busca dinâmica
        if (filtroTexto) {

            // Define qual campo será pesquisado
            const campo = filtroTipo === "nome"
                ? u.nome.toLowerCase()
                : (u.cpf ?? "").replace(/\D/g, "");

            const termo = filtroTipo === "nome"
                ? filtroTexto.toLowerCase()
                : filtroTexto.replace(/\D/g, "");

            if (!campo.includes(termo)) return false;
        }

        return true;
    });

    paginaAtual = 1;
    renderizarTabela();
}

// Captura valores da UI e dispara filtro
function filtrarTabela() {
    filtroTipo = document.getElementById("select-tipo-filtro").value;
    filtroTexto = document.getElementById("input-termo-busca").value.trim();
    aplicarFiltros();
}

// Define filtro por status e atualiza UI dos botões
function setFiltroStatus(valor) {
    filtroStatus = valor;

    document.querySelectorAll(".btn-status-filtro").forEach(btn =>
        btn.classList.remove("ativo-sel", "ativo-on", "ativo-off"));

    const mapa = { todos: "ativo-sel", ativo: "ativo-on", inativo: "ativo-off" };

    document.getElementById(`btn-filtro-${valor}`).classList.add(mapa[valor]);

    aplicarFiltros();
}

// Renderiza a tabela com paginação aplicada
function renderizarTabela() {
    const tbody = document.querySelector("#tabela-usuarios tbody");

    const inicio = (paginaAtual - 1) * USUARIOS_POR_PAGINA;

    const pagina = usuariosFiltrados.slice(inicio, inicio + USUARIOS_POR_PAGINA);

    // Caso não haja dados
    if (pagina.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="empty-state">Nenhum usuário encontrado.</td></tr>`;
    } else {
        // Monta HTML da tabela
        tbody.innerHTML = pagina.map(u => `
            <tr>
                <td class="area-acoes">
                    <button class="btn-acao btn-editar" onclick="abrirModalEdicao(${u.idUsuario})">
                        <i class="bi bi-pencil-fill"></i>
                    </button>
                    <button class="btn-acao ${u.fAtivo ? 'btn-inativar' : 'btn-reativar'}"
                        onclick="confirmarAlterarStatus(${u.idUsuario})">
                        <i class="bi bi-${u.fAtivo ? 'person-dash-fill' : 'person-check-fill'}"></i>
                    </button>
                </td>
                <td><span class="status-pill status-${u.fAtivo ? 'ativo' : 'inativo'}">${u.fAtivo ? 'Ativo' : 'Inativo'}</span></td>
                <td>${u.nome}</td>
                <td>${u.cpf || "—"}</td>
                <td>${u.login}</td>
                <td>${u.email || "—"}</td>
                <td>${u.telefone || "—"}</td>
            </tr>
        `).join("");
    }

    renderizarPaginacao();
}

// Monta controle de paginação inferior
function renderizarPaginacao() {
    const total = usuariosFiltrados.length;
    const totalPaginas = Math.ceil(total / USUARIOS_POR_PAGINA);

    const inicio = total === 0 ? 0 : (paginaAtual - 1) * USUARIOS_POR_PAGINA + 1;
    const fim = Math.min(paginaAtual * USUARIOS_POR_PAGINA, total);

    document.querySelector(".paginacao-info").textContent =
        total === 0 ? "Nenhum registro" : `Mostrando ${inicio}–${fim} de ${total} usuários`;

    const controles = document.querySelector(".paginacao-controles");
    controles.innerHTML = "";

    // Botão anterior
    controles.appendChild(criarBtnPagina("‹", paginaAtual === 1,
        () => { paginaAtual--; renderizarTabela(); }));

    // Botões numerados
    for (let i = 1; i <= totalPaginas; i++) {
        const btn = criarBtnPagina(i, false, () => {
            paginaAtual = i;
            renderizarTabela();
        });

        if (i === paginaAtual) btn.classList.add("ativo");
        controles.appendChild(btn);
    }

    // Botão próximo
    controles.appendChild(criarBtnPagina("›", paginaAtual === totalPaginas,
        () => { paginaAtual++; renderizarTabela(); }));
}

// Cria botão reutilizável de paginação
function criarBtnPagina(label, disabled, onClick) {
    const btn = document.createElement("button");
    btn.className = "btn-pagina";
    btn.textContent = label;
    btn.disabled = disabled;
    btn.addEventListener("click", onClick);
    return btn;
}

// Formata CPF para exibição visual
function formatarCPF(digits) {
    const d = String(digits || "").replace(/\D/g, "").substring(0, 11);
    return d
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
        .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");
}

// Formata telefone para padrão brasileiro
function formatarTelefone(digits) {
    const d = String(digits || "").replace(/\D/g, "").substring(0, 11);

    if (d.length > 10) return d.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    if (d.length > 6) return d.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
    if (d.length > 2) return d.replace(/(\d{2})(\d{0,5})/, "($1) $2");

    return d.length > 0 ? `(${d}` : d;
}

// Controla estado de loading dos botões
function setBotaoCarregando(btnEl, carregando) {
    if (carregando) {
        btnEl.disabled = true;
        btnEl.dataset.textoOriginal = btnEl.innerHTML;
        btnEl.innerHTML = '<i class="bi bi-hourglass-split"></i> Salvando...';
    } else {
        btnEl.disabled = false;
        btnEl.innerHTML = btnEl.dataset.textoOriginal;
    }
}