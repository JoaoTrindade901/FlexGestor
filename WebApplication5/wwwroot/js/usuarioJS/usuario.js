// ===== USUARIO.JS — integrado com backend =====

const USUARIOS_POR_PAGINA = 10;
let paginaAtual       = 1;
let usuariosFiltrados = [];
let todoUsuarios      = [];          // cache vindo do servidor
let usuarioEmEdicao   = null;
let usuarioParaAlterarStatus = null;
let filtroStatus = "todos";          // "todos" | "ativo" | "inativo"
let filtroTexto  = "";
let filtroTipo   = "nome";

// ──────────────────────────────────────────
// CSRF TOKEN (necessário para [ValidateAntiForgeryToken])
// ──────────────────────────────────────────
function getCsrfToken() {
    return document.querySelector('input[name="__RequestVerificationToken"]')?.value ?? "";
}

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
        headers: {
            "Content-Type": "application/json",
            "RequestVerificationToken": getCsrfToken()
        },
        body: JSON.stringify(body)
    });
    if (!res.ok) {
        const texto = await res.text().catch(() => "");
        throw new Error(texto || `POST ${url} → ${res.status}`);
    }
    return res;
}

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

// ──────────────────────────────────────────
// CARREGAR DADOS DO BACKEND
// ──────────────────────────────────────────
async function carregarUsuarios() {
    try {
        const data = await apiGet("/Usuario/Listar");
        // O backend retorna IEnumerable<UsuarioModel>
        // Normalizamos para o mesmo shape que o JS já espera
        todoUsuarios = data.map(u => ({
            idUsuario: u.idUsuario,
            login: u.login,
            nome: u.nome,
            cpf: u.cpf ?? "",
            email: u.email ?? "",
            telefone: u.telefone   ?? "",
            cargo_id: u.cargo_id,
            dthCriacao: u.dthCriacao,
            fAtivo: u.fAtivo
        }));
        aplicarFiltros();
    } catch (err) {
        mostrarErro("Não foi possível carregar os usuários: " + err.message);
    }
}

async function carregarCargos(selectId) {
    try {
        const cargos = await apiGet("/Usuario/ListarCargos");
        const sel = document.getElementById(selectId);
        sel.innerHTML = "";
        cargos.forEach(c => {
            const opt = document.createElement("option");
            // A CargoRepository deve retornar algo com id e nome — ajuste se necessário
            opt.value = c.idCargo;
            opt.textContent = c.nome ?? c.Nome;
            sel.appendChild(opt);
        });
    } catch (err) {
        mostrarErro("Não foi possível carregar os cargos.");
    }
}

// ──────────────────────────────────────────
// FILTRO
// ──────────────────────────────────────────
function aplicarFiltros() {
    usuariosFiltrados = todoUsuarios.filter(u => {
        if (filtroStatus === "ativo"   && !u.fAtivo) return false;
        if (filtroStatus === "inativo" &&  u.fAtivo) return false;

        if (filtroTexto) {
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

function filtrarTabela() {
    filtroTipo  = document.getElementById("select-tipo-filtro").value;
    filtroTexto = document.getElementById("input-termo-busca").value.trim();
    aplicarFiltros();
}

function setFiltroStatus(valor) {
    filtroStatus = valor;
    document.querySelectorAll(".btn-status-filtro").forEach(btn =>
        btn.classList.remove("ativo-sel", "ativo-on", "ativo-off"));
    const mapa = { todos: "ativo-sel", ativo: "ativo-on", inativo: "ativo-off" };
    document.getElementById(`btn-filtro-${valor}`).classList.add(mapa[valor]);
    aplicarFiltros();
}

// ──────────────────────────────────────────
// RENDERIZAÇÃO DA TABELA
// ──────────────────────────────────────────
function renderizarTabela() {
    const tbody = document.querySelector("#tabela-usuarios tbody");
    const inicio = (paginaAtual - 1) * USUARIOS_POR_PAGINA;
    const pagina = usuariosFiltrados.slice(inicio, inicio + USUARIOS_POR_PAGINA);

    if (pagina.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="empty-state">Nenhum usuário encontrado.</td></tr>`;
    } else {
        tbody.innerHTML = pagina.map(u => `
            <tr>
                <td class="area-acoes">
                    <button class="btn-acao btn-editar" title="Editar" onclick="abrirModalEdicao(${u.idUsuario})">
                        <i class="bi bi-pencil-fill"></i>
                    </button>
                    <button class="btn-acao ${u.fAtivo ? 'btn-inativar' : 'btn-reativar'}"
                        title="${u.fAtivo ? 'Inativar' : 'Reativar'}"
                        onclick="confirmarAlterarStatus(${u.idUsuario})">
                        <i class="bi bi-${u.fAtivo ? 'trash3-fill' : 'arrow-counterclockwise'}"></i>
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

function renderizarPaginacao() {
    const total       = usuariosFiltrados.length;
    const totalPaginas = Math.ceil(total / USUARIOS_POR_PAGINA);
    const inicio      = total === 0 ? 0 : (paginaAtual - 1) * USUARIOS_POR_PAGINA + 1;
    const fim         = Math.min(paginaAtual * USUARIOS_POR_PAGINA, total);

    document.querySelector(".paginacao-info").textContent =
        total === 0 ? "Nenhum registro" : `Mostrando ${inicio}–${fim} de ${total} usuários`;

    const controles = document.querySelector(".paginacao-controles");
    controles.innerHTML = "";

    controles.appendChild(criarBtnPagina("‹", paginaAtual === 1,
        () => { paginaAtual--; renderizarTabela(); }));

    for (let i = 1; i <= totalPaginas; i++) {
        const btn = criarBtnPagina(i, false, () => { paginaAtual = i; renderizarTabela(); });
        if (i === paginaAtual) btn.classList.add("ativo");
        controles.appendChild(btn);
    }

    controles.appendChild(criarBtnPagina("›", paginaAtual === totalPaginas || totalPaginas === 0,
        () => { paginaAtual++; renderizarTabela(); }));
}

function criarBtnPagina(label, disabled, onClick) {
    const btn = document.createElement("button");
    btn.className  = "btn-pagina";
    btn.textContent = label;
    btn.disabled   = disabled;
    btn.addEventListener("click", onClick);
    return btn;
}

// ──────────────────────────────────────────
// FEEDBACK VISUAL
// ──────────────────────────────────────────
function mostrarErro(msg) {
    alert("⚠ " + msg);
}

function setBotaoCarregando(btnEl, carregando, textoOriginal) {
    if (carregando) {
        btnEl.disabled = true;
        btnEl.dataset.textoOriginal = btnEl.innerHTML;
        btnEl.innerHTML = '<i class="bi bi-hourglass-split"></i> Salvando...';
    } else {
        btnEl.disabled = false;
        btnEl.innerHTML = textoOriginal ?? btnEl.dataset.textoOriginal;
    }
}

// ──────────────────────────────────────────
// MODAL NOVO USUÁRIO
// ──────────────────────────────────────────
async function abrirModal() {
    document.getElementById("form-usuario").reset();
    await carregarCargos("novo-perfil");
    document.getElementById("modal-novo-usuario").classList.add("open");
}

function fecharModal() {
    document.getElementById("modal-novo-usuario").classList.remove("open");
}

document.getElementById("form-usuario").addEventListener("submit", async function (e) {
    e.preventDefault();
    const btn = this.querySelector('[type="submit"]');
    setBotaoCarregando(btn, true);

const payload = {
    Login:    document.getElementById("novo-login").value.trim(),
    Senha:    document.getElementById("novo-senha").value,
    Nome:     document.getElementById("novo-nome").value.trim(),
    CPF:      document.getElementById("novo-cpf").value.trim() || null,  // ← null se vazio
    Email:    document.getElementById("novo-email").value.trim() || null,
    Telefone: document.getElementById("novo-telefone").value.trim() || null,
    cargo_id: Number(document.getElementById("novo-perfil").value) || 0
};

    try {
        await apiPost("/Usuario/Criar", payload);
        fecharModal();
        await carregarUsuarios();       // recarrega a lista do servidor
    } catch (err) {
        mostrarErro("Erro ao criar usuário: " + err.message);
    } finally {
        setBotaoCarregando(btn, false);
    }
});

// ──────────────────────────────────────────
// MODAL EDIÇÃO
// ──────────────────────────────────────────
async function abrirModalEdicao(id) {
    usuarioEmEdicao = todoUsuarios.find(u => u.idUsuario === id);
    if (!usuarioEmEdicao) return;

    await carregarCargos("edit-perfil");

    document.getElementById("edit-login").value    = usuarioEmEdicao.login    || "";
    document.getElementById("edit-nome").value     = usuarioEmEdicao.nome     || "";
    document.getElementById("edit-email").value    = usuarioEmEdicao.email    || "";
    document.getElementById("edit-cpf").value      = usuarioEmEdicao.cpf      || "";
    document.getElementById("edit-telefone").value = usuarioEmEdicao.telefone || "";
    document.getElementById("edit-perfil").value   = usuarioEmEdicao.cargo_id;

    // Data de criação — só exibição
    const criacao = document.getElementById("edit-criacao");
    if (criacao && usuarioEmEdicao.dthCriacao) {
        criacao.value = new Date(usuarioEmEdicao.dthCriacao).toLocaleDateString("pt-BR");
    }

    document.getElementById("modal-edicao").classList.add("open");
}

function fecharModalEdicao() {
    document.getElementById("modal-edicao").classList.remove("open");
    usuarioEmEdicao = null;
}

document.getElementById("form-edicao").addEventListener("submit", async function (e) {
    e.preventDefault();
    if (!usuarioEmEdicao) return;

    const btn = this.querySelector('[type="submit"]');
    setBotaoCarregando(btn, true);

    const payload = {
    IdUsuario: usuarioEmEdicao.idUsuario,
    Login:     document.getElementById("edit-login").value.trim(),
    Nome:      document.getElementById("edit-nome").value.trim(),
    Email:     document.getElementById("edit-email").value.trim() || null,
    CPF:       document.getElementById("edit-cpf").value.trim() || null,  
    Telefone:  document.getElementById("edit-telefone").value.trim() || null,
    cargo_id:  Number(document.getElementById("edit-perfil").value) || 0,
    Senha:     document.getElementById("edit-senha")?.value || ""
};

    try {
        await apiPost("/Usuario/Editar", payload);
        fecharModalEdicao();
        await carregarUsuarios();
    } catch (err) {
        mostrarErro("Erro ao salvar usuário: " + err.message);
    } finally {
        setBotaoCarregando(btn, false);
    }
});

// ──────────────────────────────────────────
// CONFIRMAÇÃO INATIVAÇÃO / REATIVAÇÃO
// ──────────────────────────────────────────
function confirmarAlterarStatus(id) {
    usuarioParaAlterarStatus = todoUsuarios.find(u => u.idUsuario === id);
    if (!usuarioParaAlterarStatus) return;

    const inativar = usuarioParaAlterarStatus.fAtivo;
    document.getElementById("confirm-mensagem").innerHTML =
        `Deseja <strong>${inativar ? "inativar" : "reativar"}</strong> o usuário <strong>"${usuarioParaAlterarStatus.nome}"</strong>?`;

    const btnSim = document.getElementById("confirm-btn-sim");
    btnSim.textContent = inativar ? "Sim, inativar" : "Sim, reativar";
    btnSim.className   = inativar ? "btn-perigo" : "btn-primario";

    document.getElementById("modal-confirmar").classList.add("open");
}

function fecharModalConfirmar() {
    document.getElementById("modal-confirmar").classList.remove("open");
    usuarioParaAlterarStatus = null;
}

document.getElementById("confirm-btn-sim").addEventListener("click", async function () {
    if (!usuarioParaAlterarStatus) return;

    const id = usuarioParaAlterarStatus.idUsuario;
    this.disabled = true;

    try {
        // AlterarStatus recebe id via query string (não é [FromBody])
        await apiPostForm(`/Usuario/AlterarStatus?id=${id}`, {});
        fecharModalConfirmar();
        await carregarUsuarios();
    } catch (err) {
        mostrarErro("Erro ao alterar status: " + err.message);
    } finally {
        this.disabled = false;
    }
});

// ──────────────────────────────────────────
// FECHAR CLICANDO FORA DO MODAL
// ──────────────────────────────────────────
["modal-novo-usuario", "modal-edicao", "modal-confirmar"].forEach(id => {
    document.getElementById(id).addEventListener("click", function (e) {
        if (e.target !== this) return;
        if (id === "modal-novo-usuario") fecharModal();
        else if (id === "modal-edicao")  fecharModalEdicao();
        else fecharModalConfirmar();
    });
});

// ──────────────────────────────────────────
// INIT
// ──────────────────────────────────────────
document.getElementById("btn-filtro-todos").classList.add("ativo-sel");
carregarUsuarios();
