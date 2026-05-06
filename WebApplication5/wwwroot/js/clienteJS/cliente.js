// ===== CLIENTE.JS — com validações completas (TCC) =====
// Depende de: /js/shared/flexValidation.js

// Define quantos clientes serão exibidos por página
const CLIENTES_POR_PAGINA = 10;

// Controla a página atual da paginação
let paginaAtual = 1;

// Lista de clientes já filtrados (base da renderização)
let clientesFiltrados = [];

// Lista completa de clientes vindos do backend
let todosClientes = [];

// Armazena o cliente que está sendo editado
let clienteEmEdicao = null;

// Armazena o cliente selecionado para inativar/reativar
let clienteParaDeletar = null;

// Filtros ativos da tela
let filtroStatus = "todos";
let filtroTexto = "";
let filtroTipo = "nome";


// Função helper para requisições GET
// Faz o fetch e retorna JSON
async function apiGet(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`GET ${url} → ${res.status}`);
    return res.json();
}

// Função helper para POST
// Envia dados para o backend como JSON
async function apiPost(url, body) {
    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });

    // Se erro, tenta extrair mensagem
    if (!res.ok) {
        const texto = await res.text().catch(() => "");
        throw new Error(texto || `POST ${url} → ${res.status}`);
    }

    return res;
}

// ──────────────────────────────────────────
// CARREGAR E FILTRAR
// ──────────────────────────────────────────
async function carregarClientes() {
    try {
        const data = await apiGet("/Cliente/Listar");

        // Converte fAtivo para boolean (caso venha 0/1)
        todosClientes = data.map(c => ({ ...c, fAtivo: c.fAtivo == 1 }));

        aplicarFiltros();
    } catch (err) {
        flexToast("Não foi possível carregar os clientes: " + err.message, "erro");
    }
}


// Aplica filtros de status e busca
function aplicarFiltros() {
    clientesFiltrados = todosClientes.filter(c => {

        const ativo = Boolean(c.fAtivo);

        // Filtro por status
        if (filtroStatus === "ativo" && !ativo) return false;
        if (filtroStatus === "inativo" && ativo) return false;

        // Filtro por texto
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

    // Sempre volta para página 1 ao filtrar
    paginaAtual = 1;

    renderizarTabela();
}


// Atualiza os filtros com base nos inputs da UI
function filtrarTabela() {
    filtroTipo = document.getElementById("select-tipo-filtro").value;
    filtroTexto = document.getElementById("input-termo-busca").value.trim();
    aplicarFiltros();
}


// Define filtro de status e atualiza visual dos botões
function setFiltroStatus(valor) {
    filtroStatus = valor;

    document.querySelectorAll(".btn-status-filtro").forEach(btn =>
        btn.classList.remove("ativo-sel", "ativo-on", "ativo-off"));

    const mapa = {
        todos: "ativo-sel",
        ativo: "ativo-on",
        inativo: "ativo-off"
    };

    document.getElementById(`btn-filtro-${valor}`).classList.add(mapa[valor]);

    aplicarFiltros();
}

// ──────────────────────────────────────────
// TABELA
// ──────────────────────────────────────────
function renderizarTabela() {
    const tbody = document.querySelector("#tabela-clientes tbody");

    const inicio = (paginaAtual - 1) * CLIENTES_POR_PAGINA;
    const pagina = clientesFiltrados.slice(inicio, inicio + CLIENTES_POR_PAGINA);

    // Estado vazio
    if (pagina.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="empty-state">Nenhum cliente encontrado.</td></tr>`;
    } else {
        tbody.innerHTML = pagina.map(c => {

            // Define se é PF ou PJ
            const tipo = c.razaoSocial ? "PJ" : "PF";

            // Formata saldo devedor
            const saldo = c.saldoDevedor != null
                ? `R$ ${Number(c.saldoDevedor).toFixed(2).replace(".", ",")}`
                : "—";

            return `
            <tr>
                <td class="area-acoes">
                    <!-- Editar -->
                    <button class="btn-acao btn-editar" title="Editar" onclick="abrirModalEdicao(${c.idCliente})">
                        <i class="bi bi-pencil-fill"></i>
                    </button>

                    <!-- Inativar / Reativar -->
                    <button class="btn-acao btn-inativar" title="${c.fAtivo ? 'Inativar' : 'Reativar'}"
                        onclick="confirmarDeletar(${c.idCliente})">
                        <i class="bi bi-${c.fAtivo ? 'person-dash-fill' : 'person-check-fill'}"></i>
                    </button>
                </td>

                <!-- Status -->
                <td><span class="status-pill status-${c.fAtivo ? 'ativo' : 'inativo'}">
                    ${c.fAtivo ? 'Ativo' : 'Inativo'}
                </span></td>

                <!-- Tipo -->
                <td>${tipo}</td>

                <!-- Dados -->
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


// Renderiza controles de paginação
function renderizarPaginacao() {
    const total = clientesFiltrados.length;
    const totalPaginas = Math.ceil(total / CLIENTES_POR_PAGINA);

    const inicio = total === 0 ? 0 : (paginaAtual - 1) * CLIENTES_POR_PAGINA + 1;
    const fim = Math.min(paginaAtual * CLIENTES_POR_PAGINA, total);

    document.querySelector(".paginacao-info").textContent =
        total === 0
            ? "Nenhum registro"
            : `Mostrando ${inicio}–${fim} de ${total} clientes`;

    const controles = document.querySelector(".paginacao-controles");
    controles.innerHTML = "";

    // Botão anterior
    controles.appendChild(criarBtnPagina("‹", paginaAtual === 1,
        () => { paginaAtual--; renderizarTabela(); }));

    // Botões numéricos
    for (let i = 1; i <= totalPaginas; i++) {
        const btn = criarBtnPagina(i, false, () => {
            paginaAtual = i;
            renderizarTabela();
        });
        if (i === paginaAtual) btn.classList.add("ativo");
        controles.appendChild(btn);
    }

    // Botão próximo
    controles.appendChild(criarBtnPagina("›",
        paginaAtual === totalPaginas || totalPaginas === 0,
        () => { paginaAtual++; renderizarTabela(); }));
}


// Cria botão de paginação reutilizável
function criarBtnPagina(label, disabled, onClick) {
    const btn = document.createElement("button");
    btn.className = "btn-pagina";
    btn.textContent = label;
    btn.disabled = disabled;
    btn.addEventListener("click", onClick);
    return btn;
}

// ──────────────────────────────────────────
// TIPO PF / PJ
// ──────────────────────────────────────────
function configurarTipoSelector(prefixo) {
    document.querySelectorAll(`.tipo-btn[data-prefixo="${prefixo}"]`).forEach(btn => {
        btn.addEventListener("click", () => {

            // Remove seleção anterior
            document.querySelectorAll(`.tipo-btn[data-prefixo="${prefixo}"]`)
                .forEach(b => b.classList.remove("tipo-btn-ativo"));

            // Marca botão atual
            btn.classList.add("tipo-btn-ativo");

            // Alterna campos
            alternarCamposPorTipo(prefixo, btn.dataset.tipo);
        });
    });
}


// Alterna campos conforme PF ou PJ
function alternarCamposPorTipo(prefixo, tipo) {

    const camposPF = [
        `${prefixo}-grupo-genero`,
        `${prefixo}-grupo-nascimento`,
        `${prefixo}-grupo-estadocivil`
    ];

    const camposPJ = [`${prefixo}-grupo-razaosocial`];

    // Exibe/esconde campos PF
    camposPF.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = tipo === "PF" ? "" : "none";
    });

    // Exibe/esconde campos PJ
    camposPJ.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = tipo === "PJ" ? "" : "none";
    });

    // Atualiza labels dinamicamente
    const labelNome = document.getElementById(`${prefixo}-label-nome`);
    const labelDoc = document.getElementById(`${prefixo}-label-doc`);
    const inputDoc = document.getElementById(`${prefixo}-doc`);

    if (labelNome) labelNome.innerHTML =
        tipo === "PF"
            ? 'Nome Completo <span class="obrigatorio">*</span>'
            : 'Nome Fantasia <span class="obrigatorio">*</span>';

    if (labelDoc) labelDoc.innerHTML =
        tipo === "PF"
            ? 'CPF <span class="obrigatorio">*</span>'
            : 'CNPJ <span class="obrigatorio">*</span>';

    // Aplica máscara correta no documento
    if (inputDoc) {
        inputDoc.placeholder = tipo === "PF"
            ? "000.000.000-00"
            : "00.000.000/0000-00";

        inputDoc._listeners?.forEach(fn => inputDoc.removeEventListener("input", fn));

        if (tipo === "PF") aplicarMascaraCPF(inputDoc);
        else aplicarMascaraCNPJ(inputDoc);
    }
}


// Retorna o tipo selecionado (PF ou PJ)
function getTipoAtivo(prefixo) {
    const btn = document.querySelector(`.tipo-btn[data-prefixo="${prefixo}"].tipo-btn-ativo`);
    return btn?.dataset.tipo ?? "PF";
}

// ──────────────────────────────────────────
// VALIDAÇÃO DO FORMULÁRIO
// ──────────────────────────────────────────
function validarFormCliente(prefixo) {

    const tipo = getTipoAtivo(prefixo);
    let ok = true;

    // Captura campos
    const nome = document.getElementById(`${prefixo}-nome`);
    const doc = document.getElementById(`${prefixo}-doc`);
    const email = document.getElementById(`${prefixo}-email`);
    const tel = document.getElementById(`${prefixo}-telefone`);
    const logr = document.getElementById(`${prefixo}-logradouro`);
    const num = document.getElementById(`${prefixo}-numero`);
    const cidade = document.getElementById(`${prefixo}-cidade`);
    const estado = document.getElementById(`${prefixo}-estado`);

    // Validações principais
    if (!validarObrigatorio(nome, "Nome")) ok = false;
    if (!validarCampoCpfCnpj(doc, tipo)) ok = false;
    if (!validarCampoEmail(email, true)) ok = false;
    if (!validarCampoTelefone(tel, true)) ok = false;
    if (!validarObrigatorio(logr, "Logradouro")) ok = false;
    if (!validarObrigatorio(num, "Número")) ok = false;
    if (!validarObrigatorio(cidade, "Cidade")) ok = false;
    if (!validarObrigatorio(estado, "Estado")) ok = false;

    // Validação de CEP (opcional)
    const cep = document.getElementById(`${prefixo}-cep`);
    if (cep && !campoVazio(cep.value)) {
        const digits = cep.value.replace(/\D/g, "");
        if (!validarCEP(digits)) {
            marcarErro(cep, "CEP inválido. Informe 8 dígitos.");
            ok = false;
        } else {
            limparErro(cep);
        }
    }

    if (!ok) flexToast("Corrija os campos destacados antes de salvar.", "aviso");

    return ok;
}

// ──────────────────────────────────────────
// MONTAR PAYLOAD
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


// Monta payload para criação
function montarPayloadNovo() {
    const tipo = getTipoAtivo("novo");

    return {
        Cliente: {
            nome: lerCampo("novo-nome"),
            nomeFantasia: tipo === "PJ" ? lerCampo("novo-nome") : null,
            razaoSocial: tipo === "PJ" ? lerCampo("novo-razaosocial") : null,
            cpfCNPJ: (lerCampo("novo-doc") ?? "").replace(/\D/g, ""),
            email: lerCampo("novo-email"),
            telefone: (lerCampo("novo-telefone") ?? "").replace(/\D/g, ""),
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
    };
}

function montarPayloadEdicao() {
    const tipo = getTipoAtivo("edit");

    const cliente = { idCliente: clienteEmEdicao.idCliente };

    const campos = {
        nome: lerCampoSeguro("edit-nome"),
        cpfCNPJ: lerCampoSeguro("edit-doc"),
        email: lerCampoSeguro("edit-email"),
        telefone: lerCampoSeguro("edit-telefone"),
        observacao: lerCampoSeguro("edit-observacao"),
        saldoDevedor: lerCampoSeguro("edit-saldo"),
        genero: tipo === "PF" ? lerCampoSeguro("edit-genero") : undefined,
        dthNascimento: tipo === "PF" ? lerCampoSeguro("edit-nascimento") : undefined,
        nomeFantasia: tipo === "PJ" ? lerCampoSeguro("edit-nome") : undefined,
        razaoSocial: tipo === "PJ" ? lerCampoSeguro("edit-razaosocial") : undefined,
    };


    Object.entries(campos).forEach(([k, v]) => {
        if (v !== undefined) cliente[k] = v;
    });

    cliente.tipoCliente_id = Number(document.getElementById("edit-tipocliente")?.value) || 1;
    cliente.enderecoId = clienteEmEdicao.enderecoId;

    return { Cliente: cliente, Endereco: montarEnderecoEdicao() };
}

// ──────────────────────────────────────────
// MODAL NOVO CLIENTE
// ──────────────────────────────────────────
function abrirModal() {
    const form = document.getElementById("form-cliente");

    form.reset();
    limparTodosErros(form);

    // Define padrão PF
    document.querySelectorAll('.tipo-btn[data-prefixo="novo"]').forEach(b =>
        b.classList.remove("tipo-btn-ativo"));

    document.querySelector('.tipo-btn[data-prefixo="novo"][data-tipo="PF"]')
        .classList.add("tipo-btn-ativo");

    alternarCamposPorTipo("novo", "PF");

    document.getElementById("modal-novo-cliente").classList.add("open");
}


// Fecha modal novo cliente
function fecharModal() {
    document.getElementById("modal-novo-cliente").classList.remove("open");
}


// Submit criação cliente
document.getElementById("form-cliente").addEventListener("submit", async function (e) {
    e.preventDefault();

    if (!validarFormCliente("novo")) return;

    const btnTexto = this.querySelector(".btn-texto");
    const btnLoading = this.querySelector(".btn-loading");
    const btnSubmit = this.querySelector('[type="submit"]');

    btnSubmit.disabled = true;
    btnTexto.style.display = "none";
    btnLoading.style.display = "";

    try {
        await apiPost("/Cliente/Criar", montarPayloadNovo());

        fecharModal();
        await carregarClientes();

        flexToast("Cliente cadastrado com sucesso!", "sucesso");

    } catch (err) {
        flexToast("Erro ao criar cliente: " + err.message, "erro");
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

    const form = document.getElementById("form-edicao");
    limparTodosErros(form);

    const tipo = clienteEmEdicao.razaoSocial ? "PJ" : "PF";

    document.querySelectorAll('.tipo-btn[data-prefixo="edit"]').forEach(b =>
        b.classList.remove("tipo-btn-ativo"));

    document.querySelector(`.tipo-btn[data-prefixo="edit"][data-tipo="${tipo}"]`)
        .classList.add("tipo-btn-ativo");

    alternarCamposPorTipo("edit", tipo);

    const c = clienteEmEdicao;

    // Preenche campos
    setCampo("edit-nome", c.nome);
    setCampo("edit-doc", c.cpfCNPJ);
    setCampo("edit-email", c.email);
    setCampo("edit-telefone", c.telefone);
    setCampo("edit-tipocliente", c.tipoCliente_id);
    setCampo("edit-observacao", c.observacao);
    setCampo("edit-genero", c.genero);
    setCampo("edit-razaosocial", c.razaoSocial);
    setCampo("edit-saldo", c.saldoDevedor);

    if (c.dthNascimento) setCampo("edit-nascimento", c.dthNascimento.substring(0, 10));
    if (c.dthCadastro) setCampo("edit-cadastro", new Date(c.dthCadastro).toLocaleDateString("pt-BR"));

    setCampo("edit-logradouro", c.logradouro);
    setCampo("edit-numero", c.numero);
    setCampo("edit-complemento", c.complemento);
    setCampo("edit-bairro", c.bairro);
    setCampo("edit-cidade", c.cidade);
    setCampo("edit-estado", c.estado);
    setCampo("edit-cep", c.cep);

    document.getElementById("modal-edicao").classList.add("open");

    await aplicarPermissoesCampos('edit');
}


// Fecha modal edição
function fecharModalEdicao() {
    document.getElementById("modal-edicao").classList.remove("open");
    clienteEmEdicao = null;
}


// Submit edição
document.getElementById("form-edicao").addEventListener("submit", async function (e) {
    e.preventDefault();

    if (!clienteEmEdicao) return;
    if (!validarFormCliente("edit")) return;

    const btnTexto = this.querySelector(".btn-texto");
    const btnLoading = this.querySelector(".btn-loading");
    const btnSubmit = this.querySelector('[type="submit"]');

    btnSubmit.disabled = true;
    btnTexto.style.display = "none";
    btnLoading.style.display = "";

    try {
        await apiPost("/Cliente/Editar", montarPayloadEdicao());

        fecharModalEdicao();
        await carregarClientes();

        flexToast("Cliente atualizado com sucesso!", "sucesso");

    } catch (err) {
        flexToast("Erro ao salvar cliente: " + err.message, "erro");
    } finally {
        btnSubmit.disabled = false;
        btnTexto.style.display = "";
        btnLoading.style.display = "none";
    }
});

// ──────────────────────────────────────────
// EXCLUSÃO LÓGICA (inativar/reativar)
// ──────────────────────────────────────────
function confirmarDeletar(id) {
    clienteParaDeletar = todosClientes.find(c => c.idCliente === id);
    if (!clienteParaDeletar) return;

    const acao = clienteParaDeletar.fAtivo ? "inativado" : "reativado";
    const btnTexto = clienteParaDeletar.fAtivo ? "Sim, inativar" : "Sim, reativar";

    flexConfirmar(
        `Deseja ${acao} o cliente "${clienteParaDeletar.nome}"?\n(O registro não será excluído do sistema.)`,
        async () => {
            try {
                await apiPost("/Cliente/Deletar", clienteParaDeletar.idCliente);
                await carregarClientes();
                flexToast(`Cliente ${acao} do com sucesso!`, "sucesso");
            } catch (err) {
                flexToast("Erro ao alterar status: " + err.message, "erro");
            }
        },
        btnTexto
    );
}

// ──────────────────────────────────────────
// FECHAR CLICANDO FORA DO MODAL
// ──────────────────────────────────────────
["modal-novo-cliente", "modal-edicao", "modal-confirmar"].forEach(id => {
    document.getElementById(id)?.addEventListener("click", function (e) {
        if (e.target !== this) return;

        if (id === "modal-novo-cliente") fecharModal();
        else if (id === "modal-edicao") fecharModalEdicao();
    });
});


// Bind de eventos de UI
document.getElementById("btn-abrir-modal")?.addEventListener("click", abrirModal);
document.getElementById("btn-fechar-novo")?.addEventListener("click", fecharModal);
document.getElementById("btn-cancelar-novo")?.addEventListener("click", fecharModal);
document.getElementById("btn-fechar-edicao")?.addEventListener("click", fecharModalEdicao);
document.getElementById("btn-cancelar-edicao")?.addEventListener("click", fecharModalEdicao);
document.getElementById("select-tipo-filtro")?.addEventListener("change", filtrarTabela);
document.getElementById("input-termo-busca")?.addEventListener("input", filtrarTabela);

// ──────────────────────────────────────────
// INIT — aplica máscaras e CEP automático
// ──────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {

    // Configura PF/PJ
    configurarTipoSelector("novo");
    configurarTipoSelector("edit");

    // Marca filtro inicial
    document.getElementById("btn-filtro-todos").classList.add("ativo-sel");

    // Máscaras telefone
    ["novo-telefone", "edit-telefone"].forEach(id => {
        const el = document.getElementById(id);
        if (el) aplicarMascaraTelefone(el);
    });

    // Máscaras CPF padrão
    ["novo-doc", "edit-doc"].forEach(id => {
        const el = document.getElementById(id);
        if (el) aplicarMascaraCPF(el);
    });

    // Máscara CEP + busca automática
    ["novo-cep", "edit-cep"].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;

        aplicarMascaraCEP(el);

        const prefixo = id.replace("-cep", "");
        el.addEventListener("blur", () => preencherEnderecoPorCEP(el, prefixo));
    });

    // Limpa erros ao digitar
    document.querySelectorAll("input, select, textarea").forEach(el => {
        el.addEventListener("input", () => limparErro(el));
        el.addEventListener("change", () => limparErro(el));
    });

    // Carrega dados iniciais
    carregarClientes();
});