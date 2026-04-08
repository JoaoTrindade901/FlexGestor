// ===== USUARIO.JS — com validações completas (TCC) =====
// Depende de: /js/shared/flexValidation.js

const USUARIOS_POR_PAGINA = 10;
let paginaAtual = 1;
let usuariosFiltrados = [];
let todoUsuarios = [];
let usuarioEmEdicao = null;
let usuarioParaAlterarStatus = null;
let filtroStatus = "todos";
let filtroTexto = "";
let filtroTipo = "nome";

function getCsrfToken() {
    return document.querySelector('input[name="__RequestVerificationToken"]')?.value ?? "";
}

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
        let mensagem = "Erro ao processar.";

        try {
            const data = await res.json();
            mensagem = data.mensagem || data.title || mensagem;
        } catch {
            const texto = await res.text();
            mensagem = texto || mensagem;
        }

        throw new Error(mensagem);
    }

    return res;
}

async function apiPostForm(url, params) {
    const form = new URLSearchParams(params);
    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded", "RequestVerificationToken": getCsrfToken() },
        body: form.toString()
    });
    if (!res.ok) throw new Error(`POST ${url} → ${res.status}`);
    return res;
}

// ──────────────────────────────────────────
// CARREGAR
// ──────────────────────────────────────────
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

// ──────────────────────────────────────────
// FILTROS
// ──────────────────────────────────────────
function aplicarFiltros() {
    usuariosFiltrados = todoUsuarios.filter(u => {
        if (filtroStatus === "ativo" && !u.fAtivo) return false;
        if (filtroStatus === "inativo" && u.fAtivo) return false;
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
    filtroTipo = document.getElementById("select-tipo-filtro").value;
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
// TABELA
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
                        <i class="bi bi-${u.fAtivo ? 'person-dash-fill' : 'person-check-fill'}"></i>
                    </button>
                </td>
                <td><span class="status-pill status-${u.fAtivo ? 'ativo' : 'inativo'}">${u.fAtivo ? 'Ativo' : 'Inativo'}</span></td>
                <td>${u.nome}</td>
                <td>${u.cpf || "—"}</td>
                <td>${u.login}</td>
                <td>${u.email || "—"}</td>
                <td>${u.telefone || "—"}</td>
            </tr>`).join("");
    }
    renderizarPaginacao();
}

function renderizarPaginacao() {
    const total = usuariosFiltrados.length;
    const totalPaginas = Math.ceil(total / USUARIOS_POR_PAGINA);
    const inicio = total === 0 ? 0 : (paginaAtual - 1) * USUARIOS_POR_PAGINA + 1;
    const fim = Math.min(paginaAtual * USUARIOS_POR_PAGINA, total);
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
    btn.className = "btn-pagina";
    btn.textContent = label;
    btn.disabled = disabled;
    btn.addEventListener("click", onClick);
    return btn;
}

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

// ──────────────────────────────────────────
// VALIDAÇÃO
// ──────────────────────────────────────────
function validarFormUsuario(prefixo) {
    let ok = true;

    const login = document.getElementById(`${prefixo}-login`);
    const nome = document.getElementById(`${prefixo}-nome`);
    const email = document.getElementById(`${prefixo}-email`);
    const cpf = document.getElementById(`${prefixo}-cpf`);
    const tel = document.getElementById(`${prefixo}-telefone`);
    const perfil = document.getElementById(`${prefixo}-perfil`);

    if (!validarObrigatorio(login, "Login")) ok = false;
    if (!validarObrigatorio(nome, "Nome")) ok = false;

    // Email é opcional mas se preenchido deve ser válido
    if (!validarCampoEmail(email, false)) ok = false;

    // CPF é opcional mas se preenchido deve ser válido
    if (cpf && !campoVazio(cpf.value)) {
        if (!validarCPF(cpf.value.replace(/\D/g, ""))) {
            marcarErro(cpf, "CPF inválido. Verifique os dígitos.");
            ok = false;
        } else {
            limparErro(cpf);
        }
    }

    // Telefone é opcional mas se preenchido deve ser válido
    if (tel && !campoVazio(tel.value)) {
        if (!validarTelefone(tel.value)) {
            marcarErro(tel, "Telefone inválido. Use (XX) XXXXX-XXXX.");
            ok = false;
        } else {
            limparErro(tel);
        }
    }

    if (perfil && campoVazio(perfil.value)) {
        marcarErro(perfil, "Selecione um perfil.");
        ok = false;
    } else if (perfil) {
        limparErro(perfil);
    }

    // Senha obrigatória apenas no cadastro novo
    if (prefixo === "novo") {
        const senha = document.getElementById("novo-senha");
        if (!validarObrigatorio(senha, "Senha")) ok = false;
        else if (senha.value.length < 6) {
            marcarErro(senha, "Senha deve ter pelo menos 6 caracteres.");
            ok = false;
        } else {
            limparErro(senha);
        }
    }

    if (!ok) flexToast("Corrija os campos destacados antes de salvar.", "aviso");
    return ok;
}

// ──────────────────────────────────────────
// MODAL NOVO
// ──────────────────────────────────────────
async function abrirModal() {
    const form = document.getElementById("form-usuario");
    form.reset();
    limparTodosErros(form);
    await carregarCargos("novo-perfil");
    document.getElementById("modal-novo-usuario").classList.add("open");
}

function fecharModal() {
    document.getElementById("modal-novo-usuario").classList.remove("open");
}

document.getElementById("form-usuario").addEventListener("submit", async function (e) {
    e.preventDefault();

    if (!validarFormUsuario("novo")) return;

    const btn = this.querySelector('[type="submit"]');
    setBotaoCarregando(btn, true);

    const cpfInput = document.getElementById("novo-cpf");

    const payload = {
        Login: document.getElementById("novo-login").value.trim(),
        Senha: document.getElementById("novo-senha").value,
        Nome: document.getElementById("novo-nome").value.trim(),
        CPF: (cpfInput.value.trim() || "").replace(/\D/g, "") || null,
        Email: document.getElementById("novo-email").value.trim() || null,
        Telefone: (document.getElementById("novo-telefone").value.trim() || "").replace(/\D/g, "") || null,
        cargo_id: Number(document.getElementById("novo-perfil").value) || 0
    };

    try {
        await apiPost("/Usuario/Criar", payload);

        fecharModal();
        await carregarUsuarios();

        flexToast("Usuário criado com sucesso!", "sucesso");

    } catch (err) {
        if (err.message.toLowerCase().includes("cpf")) {
            marcarErro(cpfInput, err.message);
        }

        flexToast(err.message, "erro");

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

    const form = document.getElementById("form-edicao");
    limparTodosErros(form);
    await carregarCargos("edit-perfil");

    document.getElementById("edit-login").value = usuarioEmEdicao.login || "";
    document.getElementById("edit-nome").value = usuarioEmEdicao.nome || "";
    document.getElementById("edit-email").value = usuarioEmEdicao.email || "";
    document.getElementById("edit-cpf").value =
        (usuarioEmEdicao.cpf || "").replace(/\D/g, "");
    document.getElementById("edit-telefone").value = usuarioEmEdicao.telefone || "";
    document.getElementById("edit-perfil").value = usuarioEmEdicao.cargo_id;
    document.getElementById("edit-senha").value = "";
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
    if (!validarFormUsuario("edit")) return;

    const btn = this.querySelector('[type="submit"]');
    setBotaoCarregando(btn, true);

    const payload = {
        IdUsuario: usuarioEmEdicao.idUsuario,
        Login: document.getElementById("edit-login").value.trim(),
        Nome: document.getElementById("edit-nome").value.trim(),
        Email: document.getElementById("edit-email").value.trim() || null,
        CPF: (document.getElementById("edit-cpf").value.trim() || "").replace(/\D/g, "") || null,
        Telefone: (document.getElementById("edit-telefone").value.trim() || "").replace(/\D/g, "") || null,
        cargo_id: Number(document.getElementById("edit-perfil").value) || 0,
        Senha: document.getElementById("edit-senha")?.value || ""
    };

    try {
        await apiPost("/Usuario/Editar", payload);
        fecharModalEdicao();
        await carregarUsuarios();
        flexToast("Usuário atualizado com sucesso!", "sucesso");
    } catch (err) {
        const cpfInput = document.getElementById("edit-cpf");

        // Se erro for de CPF duplicado → marca campo
        if (err.message && err.message.toLowerCase().includes("cpf")) {
            marcarErro(cpfInput, err.message);
        }

        flexToast(err.message || "Erro ao salvar usuário.", "erro");
    } finally {
        setBotaoCarregando(btn, false);
    }
});

// ──────────────────────────────────────────
// INATIVAR / REATIVAR (exclusão lógica)
// ──────────────────────────────────────────
function confirmarAlterarStatus(id) {
    usuarioParaAlterarStatus = todoUsuarios.find(u => u.idUsuario === id);
    if (!usuarioParaAlterarStatus) return;
    const inativar = usuarioParaAlterarStatus.fAtivo;
    const acao = inativar ? "inativar" : "reativar";

    flexConfirmar(
        `Deseja ${acao} o usuário "${usuarioParaAlterarStatus.nome}"?\n(O registro não será excluído do sistema.)`,
        async () => {
            try {
                const id = usuarioParaAlterarStatus.idUsuario;
                await apiPostForm(`/Usuario/AlterarStatus?id=${id}`, {});
                await carregarUsuarios();
                flexToast(`Usuário ${acao}do com sucesso!`, "sucesso");
            } catch (err) {
                flexToast("Erro ao alterar status: " + err.message, "erro");
            }
        },
        inativar ? "Sim, inativar" : "Sim, reativar"
    );
}

function fecharModalConfirmar() {
    document.getElementById("modal-confirmar")?.classList.remove("open");
}

// ──────────────────────────────────────────
// FECHAR FORA DO MODAL
// ──────────────────────────────────────────
["modal-novo-usuario", "modal-edicao", "modal-confirmar"].forEach(id => {
    document.getElementById(id)?.addEventListener("click", function (e) {
        if (e.target !== this) return;
        if (id === "modal-novo-usuario") fecharModal();
        else if (id === "modal-edicao") fecharModalEdicao();
        else fecharModalConfirmar();
    });
});

// ──────────────────────────────────────────
// INIT
// ──────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("btn-filtro-todos").classList.add("ativo-sel");

    // Máscaras
    const cpfNovo = document.getElementById("novo-cpf");
    const cpfEdit = document.getElementById("edit-cpf");
    if (cpfNovo) aplicarMascaraCPF(cpfNovo);
    if (cpfEdit) aplicarMascaraCPF(cpfEdit);

    const telNovo = document.getElementById("novo-telefone");
    const telEdit = document.getElementById("edit-telefone");
    if (telNovo) aplicarMascaraTelefone(telNovo);
    if (telEdit) aplicarMascaraTelefone(telEdit);

    // Limpeza de erro ao digitar
    document.querySelectorAll("input, select").forEach(el => {
        el.addEventListener("input", () => limparErro(el));
        el.addEventListener("change", () => limparErro(el));
    });

    carregarUsuarios();
});