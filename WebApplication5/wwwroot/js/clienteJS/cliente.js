// ===== CLIENTE.JS — alinhado com backend FlexGestor =====

const CLIENTES_POR_PAGINA = 10;
let paginaAtual = 1;
let clientesFiltrados = [];
let todosClientes = [];
let clienteEmEdicao = null;
let clienteParaDeletar = null;
let filtroStatus = "todos";
let filtroTexto = "";
let filtroTipo = "nome";

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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });
    if (!res.ok) {
        const texto = await res.text().catch(() => "");
        throw new Error(texto || `POST ${url} → ${res.status}`);
    }
    return res;
}

function mostrarErro(msg) {
    alert("⚠ " + msg);
}

// ──────────────────────────────────────────
// CARREGAR E FILTRAR
// ──────────────────────────────────────────
async function carregarClientes() {
    try {
        // GET /Cliente/Listar → IEnumerable<ClienteListaGridDto>
        const data = await apiGet("/Cliente/Listar");
        todosClientes = data.map(c => ({ ...c, fAtivo: c.fAtivo == 1 }));
        aplicarFiltros();
    } catch (err) {
        mostrarErro("Não foi possível carregar os clientes: " + err.message);
    }
}

function aplicarFiltros() {
    clientesFiltrados = todosClientes.filter(c => {
        const ativo = Boolean(c.fAtivo);
        if (filtroStatus === "ativo" && !ativo) return false;
        if (filtroStatus === "inativo" && ativo) return false;

        if (filtroTexto) {
            const campo = filtroTipo === "nome"
                ? (c.nome ?? "").toLowerCase()
                : (c.cpfCNPJ ?? "").replace(/\D/g, "");
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
// RENDERIZAÇÃO DA TABELA
// ──────────────────────────────────────────
function renderizarTabela() {
    const tbody = document.querySelector("#tabela-clientes tbody");
    const inicio = (paginaAtual - 1) * CLIENTES_POR_PAGINA;
    const pagina = clientesFiltrados.slice(inicio, inicio + CLIENTES_POR_PAGINA);

    if (pagina.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="empty-state">Nenhum cliente encontrado.</td></tr>`;
    } else {
        tbody.innerHTML = pagina.map(c => {
            const tipo = c.razaoSocial ? "PJ" : "PF";
            const saldo = c.saldoDevedor != null
                ? `R$ ${Number(c.saldoDevedor).toFixed(2).replace(".", ",")}`
                : "—";
            return `
            <tr>
                <td class="area-acoes">
                    <button class="btn-acao btn-editar" title="Editar" onclick="abrirModalEdicao(${c.idCliente})">
                        <i class="bi bi-pencil-fill"></i>
                    </button>
                    <button class="btn-acao btn-inativar" title="Deletar" onclick="confirmarDeletar(${c.idCliente})">
                        <i class="bi bi-trash3-fill"></i>
                    </button>
                </td>
                <td><span class="status-pill status-${c.fAtivo ? 'ativo' : 'inativo'}">${c.fAtivo ? 'Ativo' : 'Inativo'}</span></td>
                <td>${tipo}</td>
                <td>${c.nome ?? "—"}</td>
                <td>${c.cpfCNPJ || "—"}</td>
                <td>${c.email || "—"}</td>
                <td>${c.telefone || "—"}</td>
                <td>${saldo}</td>
            </tr>`;
        }).join("");
    }
    renderizarPaginacao();
}

function renderizarPaginacao() {
    const total = clientesFiltrados.length;
    const totalPaginas = Math.ceil(total / CLIENTES_POR_PAGINA);
    const inicio = total === 0 ? 0 : (paginaAtual - 1) * CLIENTES_POR_PAGINA + 1;
    const fim = Math.min(paginaAtual * CLIENTES_POR_PAGINA, total);

    document.querySelector(".paginacao-info").textContent =
        total === 0 ? "Nenhum registro" : `Mostrando ${inicio}–${fim} de ${total} clientes`;

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

// ──────────────────────────────────────────
// HELPERS: TIPO PF / PJ
// ──────────────────────────────────────────
function configurarTipoSelector(prefixo) {
    document.querySelectorAll(`.tipo-btn[data-prefixo="${prefixo}"]`).forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(`.tipo-btn[data-prefixo="${prefixo}"]`)
                .forEach(b => b.classList.remove("tipo-btn-ativo"));
            btn.classList.add("tipo-btn-ativo");
            alternarCamposPorTipo(prefixo, btn.dataset.tipo);
        });
    });
}

function alternarCamposPorTipo(prefixo, tipo) {
    const camposPF = [`${prefixo}-grupo-genero`, `${prefixo}-grupo-nascimento`, `${prefixo}-grupo-estadocivil`];
    const camposPJ = [`${prefixo}-grupo-razaosocial`];

    camposPF.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = tipo === "PF" ? "" : "none";
    });
    camposPJ.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = tipo === "PJ" ? "" : "none";
    });

    // Ajusta labels e placeholders
    const labelNome = document.getElementById(`${prefixo}-label-nome`);
    const labelDoc = document.getElementById(`${prefixo}-label-doc`);
    const inputDoc = document.getElementById(`${prefixo}-doc`);

    if (labelNome) labelNome.innerHTML = tipo === "PF"
        ? 'Nome Completo <span class="obrigatorio">*</span>'
        : 'Nome Fantasia <span class="obrigatorio">*</span>';

    if (labelDoc) labelDoc.innerHTML = tipo === "PF"
        ? 'CPF <span class="obrigatorio">*</span>'
        : 'CNPJ <span class="obrigatorio">*</span>';

    if (inputDoc) inputDoc.placeholder = tipo === "PF" ? "000.000.000-00" : "00.000.000/0000-00";
}

function getTipoAtivo(prefixo) {
    const btn = document.querySelector(`.tipo-btn[data-prefixo="${prefixo}"].tipo-btn-ativo`);
    return btn?.dataset.tipo ?? "PF";
}

// ──────────────────────────────────────────
// HELPERS: LER / POPULAR CAMPOS
// ──────────────────────────────────────────
function lerCampo(id) {
    const el = document.getElementById(id);
    return el ? (el.value.trim() || null) : null;
}

function lerCampoNum(id) {
    const v = lerCampo(id);
    return v !== null ? Number(v) : null;
}

function setCampo(id, valor) {
    const el = document.getElementById(id);
    if (el) el.value = valor ?? "";
}

// Monta o DTO no formato que o backend espera: { Cliente: {...}, Endereco: {...} }
function montarPayloadNovo() {
    const tipo = getTipoAtivo("novo");
    return {
        Cliente: {
            nome: lerCampo("novo-nome"),
            nomeFantasia: tipo === "PJ" ? lerCampo("novo-nome") : null,
            razaoSocial: tipo === "PJ" ? lerCampo("novo-razaosocial") : null,
            cpfCNPJ: (lerCampo("novo-doc") ?? "").replace(/\D/g, ""),
            email: lerCampo("novo-email"),
            telefone: lerCampo("novo-telefone"),
            tipoCliente_id: lerCampoNum("novo-tipocliente") ?? 1,
            observacao: lerCampo("novo-observacao"),
            genero: tipo === "PF" ? lerCampo("novo-genero") : null,
            dthNascimento: tipo === "PF" ? lerCampo("novo-nascimento") : null,
            saldoDevedor: lerCampoNum("novo-saldo") ?? 0
        },
        Endereco: {
            tipoEndereco: 1,
            logradouro: lerCampo("novo-logradouro") ?? "",
            numero: lerCampo("novo-numero") ?? "",
            complemento: lerCampo("novo-complemento"),
            bairro: lerCampo("novo-bairro") ?? "",
            cidade: lerCampo("novo-cidade") ?? "",
            estado: lerCampo("novo-estado") ?? "",
            pais: "Brasil",
            cep: (lerCampo("novo-cep") ?? "").replace(/\D/g, ""),
            fAtivo: 1
        }
    };
}

function montarPayloadEdicao() {
    const tipo = getTipoAtivo("edit");
    return {
        Cliente: {
            idCliente: clienteEmEdicao.idCliente,
            nome: lerCampo("edit-nome"),
            nomeFantasia: tipo === "PJ" ? lerCampo("edit-nome") : null,
            razaoSocial: tipo === "PJ" ? lerCampo("edit-razaosocial") : null,
            cpfCNPJ: (lerCampo("edit-doc") ?? "").replace(/\D/g, ""),
            email: lerCampo("edit-email"),
            telefone: lerCampo("edit-telefone"),
            tipoCliente_id: lerCampoNum("edit-tipocliente") ?? 1,
            observacao: lerCampo("edit-observacao"),
            genero: tipo === "PF" ? lerCampo("edit-genero") : null,
            dthNascimento: tipo === "PF" ? lerCampo("edit-nascimento") : null,
            enderecoId: clienteEmEdicao.enderecoId,
            saldoDevedor: lerCampo("edit-saldo") 
        },
        Endereco: {
            idEndereco: clienteEmEdicao.enderecoId,
            tipoEndereco: clienteEmEdicao.tipoEndereco ?? 1,
            logradouro: lerCampo("edit-logradouro") ?? "",
            numero: lerCampo("edit-numero") ?? "",
            complemento: lerCampo("edit-complemento"),
            bairro: lerCampo("edit-bairro") ?? "",
            cidade: lerCampo("edit-cidade") ?? "",
            estado: lerCampo("edit-estado") ?? "",
            pais: "Brasil",
            cep: (lerCampo("edit-cep") ?? "").replace(/\D/g, "")
        }
    };
}

// ──────────────────────────────────────────
// MODAL NOVO CLIENTE
// ──────────────────────────────────────────
function abrirModal() {
    document.getElementById("form-cliente").reset();
    // Garante PF ativo ao abrir
    document.querySelectorAll('.tipo-btn[data-prefixo="novo"]').forEach(b => b.classList.remove("tipo-btn-ativo"));
    document.querySelector('.tipo-btn[data-prefixo="novo"][data-tipo="PF"]').classList.add("tipo-btn-ativo");
    alternarCamposPorTipo("novo", "PF");
    document.getElementById("modal-novo-cliente").classList.add("open");
}

function fecharModal() {
    document.getElementById("modal-novo-cliente").classList.remove("open");
}

document.getElementById("form-cliente").addEventListener("submit", async function (e) {
    e.preventDefault();
    const btnTexto = this.querySelector(".btn-texto");
    const btnLoading = this.querySelector(".btn-loading");
    const btnSubmit = this.querySelector('[type="submit"]');

    btnSubmit.disabled = true;
    btnTexto.style.display = "none";
    btnLoading.style.display = "";

    try {
        const payload = montarPayloadNovo();
        await apiPost("/Cliente/Criar", payload);
        fecharModal();
        await carregarClientes();
    } catch (err) {
        mostrarErro("Erro ao criar cliente: " + err.message);
    } finally {
        btnSubmit.disabled = false;
        btnTexto.style.display = "";
        btnLoading.style.display = "none";
    }
});

// ──────────────────────────────────────────
// MODAL EDIÇÃO
// ──────────────────────────────────────────
function abrirModalEdicao(id) {
    clienteEmEdicao = todosClientes.find(c => c.idCliente === id);
    if (!clienteEmEdicao) return;

    const tipo = clienteEmEdicao.razaoSocial ? "PJ" : "PF";

    // Seta tipo ativo
    document.querySelectorAll('.tipo-btn[data-prefixo="edit"]').forEach(b => b.classList.remove("tipo-btn-ativo"));
    document.querySelector(`.tipo-btn[data-prefixo="edit"][data-tipo="${tipo}"]`).classList.add("tipo-btn-ativo");
    alternarCamposPorTipo("edit", tipo);

    const c = clienteEmEdicao;
    setCampo("edit-nome", c.nome);
    setCampo("edit-doc", c.cpfCNPJ);
    setCampo("edit-email", c.email);
    setCampo("edit-telefone", c.telefone);
    setCampo("edit-tipocliente", c.tipoCliente_id);
    setCampo("edit-observacao", c.observacao);
    setCampo("edit-genero", c.genero);
    setCampo("edit-razaosocial", c.razaoSocial);
    setCampo("edit-saldo", c.saldoDevedor);

    if (c.dthNascimento) {
        setCampo("edit-nascimento", c.dthNascimento.substring(0, 10));
    }
    if (c.dthCadastro) {
        setCampo("edit-cadastro", new Date(c.dthCadastro).toLocaleDateString("pt-BR"));
    }

    // Endereço — vem do JOIN no ClienteListaGridDto
    setCampo("edit-logradouro", c.logradouro);
    setCampo("edit-numero", c.numero);
    setCampo("edit-complemento", c.complemento);
    setCampo("edit-bairro", c.bairro);
    setCampo("edit-cidade", c.cidade);
    setCampo("edit-estado", c.estado);
    setCampo("edit-cep", c.cep);

    document.getElementById("modal-edicao").classList.add("open");
}

function fecharModalEdicao() {
    document.getElementById("modal-edicao").classList.remove("open");
    clienteEmEdicao = null;
}

document.getElementById("form-edicao").addEventListener("submit", async function (e) {
    e.preventDefault();
    if (!clienteEmEdicao) return;

    const btnTexto = this.querySelector(".btn-texto");
    const btnLoading = this.querySelector(".btn-loading");
    const btnSubmit = this.querySelector('[type="submit"]');

    btnSubmit.disabled = true;
    btnTexto.style.display = "none";
    btnLoading.style.display = "";

    try {
        const payload = montarPayloadEdicao();
        await apiPost("/Cliente/Editar", payload);
        fecharModalEdicao();
        await carregarClientes();
    } catch (err) {
        mostrarErro("Erro ao salvar cliente: " + err.message);
    } finally {
        btnSubmit.disabled = false;
        btnTexto.style.display = "";
        btnLoading.style.display = "none";
    }
});

// ──────────────────────────────────────────
// MODAL CONFIRMAÇÃO DELETAR
// ──────────────────────────────────────────
function confirmarDeletar(id) {
    clienteParaDeletar = todosClientes.find(c => c.idCliente === id);
    if (!clienteParaDeletar) return;

    document.getElementById("confirm-mensagem").innerHTML =
        `Deseja <strong>deletar</strong> o cliente <strong>"${clienteParaDeletar.nome}"</strong>? Esta ação não pode ser desfeita.`;

    const btnSim = document.getElementById("confirm-btn-sim");
    btnSim.textContent = "Sim, deletar";
    btnSim.className = "btn-perigo";

    document.getElementById("modal-confirmar").classList.add("open");
}

function fecharModalConfirmar() {
    document.getElementById("modal-confirmar").classList.remove("open");
    clienteParaDeletar = null;
}

document.getElementById("confirm-btn-sim").addEventListener("click", async function () {
    if (!clienteParaDeletar) return;
    this.disabled = true;

    try {
        await apiPost("/Cliente/Deletar", clienteParaDeletar.idCliente);
        fecharModalConfirmar();
        await carregarClientes();
    } catch (err) {
        mostrarErro("Erro ao deletar cliente: " + err.message);
    } finally {
        this.disabled = false;
    }
});

// ──────────────────────────────────────────
// FECHAR CLICANDO FORA DO MODAL
// ──────────────────────────────────────────
["modal-novo-cliente", "modal-edicao", "modal-confirmar"].forEach(id => {
    document.getElementById(id).addEventListener("click", function (e) {
        if (e.target !== this) return;
        if (id === "modal-novo-cliente") fecharModal();
        else if (id === "modal-edicao") fecharModalEdicao();
        else fecharModalConfirmar();
    });
});

// ──────────────────────────────────────────
// BOTÕES DO HTML (ids com data-*)
// ──────────────────────────────────────────
document.getElementById("btn-abrir-modal")?.addEventListener("click", abrirModal);
document.getElementById("btn-fechar-novo")?.addEventListener("click", fecharModal);
document.getElementById("btn-cancelar-novo")?.addEventListener("click", fecharModal);
document.getElementById("btn-fechar-edicao")?.addEventListener("click", fecharModalEdicao);
document.getElementById("btn-cancelar-edicao")?.addEventListener("click", fecharModalEdicao);
document.getElementById("btn-fechar-confirmar")?.addEventListener("click", fecharModalConfirmar);
document.getElementById("btn-confirmar-nao")?.addEventListener("click", fecharModalConfirmar);

document.getElementById("select-tipo-filtro")?.addEventListener("change", filtrarTabela);
document.getElementById("input-termo-busca")?.addEventListener("input", filtrarTabela);


// ──────────────────────────────────────────
// INIT
// ──────────────────────────────────────────
configurarTipoSelector("novo");
configurarTipoSelector("edit");
document.getElementById("btn-filtro-todos").classList.add("ativo-sel");
carregarClientes();