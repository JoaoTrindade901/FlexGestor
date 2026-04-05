// ========================================
// ESTADO
// ========================================
let fornecedores = [
    {
        idFornecedor: 1,
        nomeFantasia: "Auto Peças Brasil",
        razaoSocial: "Auto Peças Brasil LTDA",
        cnpj: "12345678000100",
        telefone: "44999990001",
        email: "contato@autopecas.com",
        fAtivo: true
    }
];

let filtrado = [...fornecedores];
let fornecedorAcao = null;
let fornecedorEdicao = null;
let filtroStatus = "todos";

// ========================================
// RENDER
// ========================================
function renderizarTabela() {
    const tbody = document.getElementById("tbody-fornecedor");

    if (filtrado.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7">Nenhum fornecedor</td></tr>`;
        return;
    }

    tbody.innerHTML = filtrado.map(f => `
        <tr>
            <td class="area-acoes">
                <button class="btn-acao btn-editar" onclick="editar(${f.idFornecedor})">
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
            <td>${f.razaoSocial || '-'}</td>
            <td>${f.cnpj}</td>
            <td>${f.telefone}</td>
            <td>${f.email || '-'}</td>
        </tr>
    `).join("");
}

// ========================================
// FILTRO
// ========================================
function filtrar() {
    const termo = document.getElementById("input-busca").value.toLowerCase();

    filtrado = fornecedores.filter(f => {
        if (filtroStatus === "ativo" && !f.fAtivo) return false;
        if (filtroStatus === "inativo" && f.fAtivo) return false;
        if (termo && !f.nomeFantasia.toLowerCase().includes(termo)) return false;
        return true;
    });

    renderizarTabela();
}

// ========================================
// FILTRO STATUS
// ========================================
function setFiltroStatus(valor) {
    filtroStatus = valor;

    document.querySelectorAll(".btn-status-filtro").forEach(b =>
        b.classList.remove("sel-todos", "sel-ativo", "sel-inativo")
    );

    document.getElementById("btn-filtro-" + valor).classList.add("sel-" + valor);

    filtrar();
}

// ========================================
// MODAL
// ========================================
function abrirModal() {
    fornecedorEdicao = null;
    document.getElementById("formFornecedor").reset();
    document.getElementById("modalFornecedor").classList.add("open");
}

function fecharModal() {
    document.getElementById("modalFornecedor").classList.remove("open");
}

// ========================================
// EDITAR
// ========================================
function editar(id) {
    fornecedorEdicao = fornecedores.find(f => f.idFornecedor === id);
    if (!fornecedorEdicao) return;

    document.getElementById("nomeFantasia").value = fornecedorEdicao.nomeFantasia;
    document.getElementById("razaoSocial").value = fornecedorEdicao.razaoSocial;
    document.getElementById("cnpj").value = fornecedorEdicao.cnpj;
    document.getElementById("telefone").value = fornecedorEdicao.telefone;
    document.getElementById("email").value = fornecedorEdicao.email;

    document.getElementById("modalFornecedor").classList.add("open");
}

// ========================================
// CONFIRMAÇÃO
// ========================================
function confirmarAcao(id) {
    fornecedorAcao = fornecedores.find(f => f.idFornecedor === id);
    if (!fornecedorAcao) return;

    const acao = fornecedorAcao.fAtivo ? "inativar" : "reativar";

    document.getElementById("confirmMensagem").innerHTML =
        `Deseja realmente <strong>${acao}</strong> o fornecedor <strong>${fornecedorAcao.nomeFantasia}</strong>?`;

    document.getElementById("modalConfirmar").classList.add("open");
}

function fecharModalConfirmar() {
    document.getElementById("modalConfirmar").classList.remove("open");
}

// ========================================
// EVENTOS
// ========================================
document.addEventListener("DOMContentLoaded", () => {

    // FORM
    document.getElementById("formFornecedor").addEventListener("submit", function (e) {
        e.preventDefault();

        const novo = {
            idFornecedor: fornecedorEdicao ? fornecedorEdicao.idFornecedor : Date.now(),
            nomeFantasia: document.getElementById("nomeFantasia").value,
            razaoSocial: document.getElementById("razaoSocial").value,
            cnpj: document.getElementById("cnpj").value,
            telefone: document.getElementById("telefone").value,
            email: document.getElementById("email").value,
            fAtivo: true
        };

        if (fornecedorEdicao) {
            Object.assign(fornecedorEdicao, novo);
        } else {
            fornecedores.unshift(novo);
        }

        fecharModal();
        filtrar();
    });

    // CONFIRMAR
    document.getElementById("btnConfirmar").addEventListener("click", () => {
        if (!fornecedorAcao) return;

        fornecedorAcao.fAtivo = !fornecedorAcao.fAtivo;

        fecharModalConfirmar();
        filtrar();
    });

    // INIT
    document.getElementById("btn-filtro-todos").classList.add("sel-todos");
    renderizarTabela();
});