// ===== FORNECEDOR.JS — integrado com backend FlexGestor =====

let fornecedores = [];
let filtrado = [];
let fornecedorEdicao = null;
let fornecedorAcao = null;
let filtroStatus = "todos";

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
        const txt = await res.text().catch(() => "");
        throw new Error(txt || `POST ${url} → ${res.status}`);
    }
    return res;
}

// ──────────────────────────────────────────
// CARREGAR
// ──────────────────────────────────────────
async function carregarFornecedores() {
    try {
        fornecedores = await apiGet("/Fornecedor/Listar");
        aplicarFiltros();
    } catch (err) {
        alert("Erro ao carregar fornecedores: " + err.message);
    }
}

// ──────────────────────────────────────────
// FILTROS
// ──────────────────────────────────────────
function filtrar() {
    aplicarFiltros();
}

function aplicarFiltros() {
    const termo = document.getElementById("input-busca")?.value.toLowerCase() || "";
    filtrado = fornecedores.filter(f => {
        if (filtroStatus === "ativo" && !f.fAtivo) return false;
        if (filtroStatus === "inativo" && f.fAtivo) return false;
        if (termo && !f.nomeFantasia?.toLowerCase().includes(termo) &&
            !f.cnpj?.includes(termo)) return false;
        return true;
    });
    renderizarTabela();
}

function setFiltroStatus(valor) {
    filtroStatus = valor;
    document.querySelectorAll(".btn-status-filtro").forEach(b =>
        b.classList.remove("sel-todos", "sel-ativo", "sel-inativo"));
    document.getElementById(`btn-filtro-${valor}`).classList.add(`sel-${valor}`);
    aplicarFiltros();
}

// ──────────────────────────────────────────
// TABELA
// ──────────────────────────────────────────
function renderizarTabela() {
    const tbody = document.getElementById("tbody-fornecedor");
    if (filtrado.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="empty-state">Nenhum fornecedor encontrado.</td></tr>`;
        return;
    }
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
            <td><span class="status-pill ${f.fAtivo ? 'status-normal' : 'status-critico'}">${f.fAtivo ? 'Ativo' : 'Inativo'}</span></td>
            <td>${f.nomeFantasia}</td>
            <td>${f.razaoSocial || '—'}</td>
            <td>${f.cnpj}</td>
            <td>${f.telefone}</td>
            <td>${f.email || '—'}</td>
        </tr>`).join("");
}

// ──────────────────────────────────────────
// MODAL NOVO
// ──────────────────────────────────────────
function abrirModal() {
    fornecedorEdicao = null;
    document.getElementById("formFornecedor").reset();
    document.querySelector("#modalFornecedor .modal-header h3").textContent = "Novo Fornecedor";
    document.getElementById("modalFornecedor").classList.add("open");
}

function fecharModal() {
    document.getElementById("modalFornecedor").classList.remove("open");
}

// ──────────────────────────────────────────
// MODAL EDIÇÃO
// ──────────────────────────────────────────
function abrirModalEdicao(id) {
    fornecedorEdicao = fornecedores.find(f => f.idFornecedor === id);
    if (!fornecedorEdicao) return;
    document.querySelector("#modalFornecedor .modal-header h3").textContent = "Editar Fornecedor";
    document.getElementById("nomeFantasia").value = fornecedorEdicao.nomeFantasia || "";
    document.getElementById("razaoSocial").value = fornecedorEdicao.razaoSocial || "";
    document.getElementById("cnpj").value = fornecedorEdicao.cnpj || "";
    document.getElementById("telefone").value = fornecedorEdicao.telefone || "";
    document.getElementById("email").value = fornecedorEdicao.email || "";
    document.getElementById("modalFornecedor").classList.add("open");
}

// ──────────────────────────────────────────
// SUBMIT
// ──────────────────────────────────────────
document.getElementById("formFornecedor").addEventListener("submit", async function (e) {
    e.preventDefault();
    const btnSalvar = this.querySelector('[type="submit"]');
    btnSalvar.disabled = true;

    const payload = {
        IdFornecedor: fornecedorEdicao?.idFornecedor || 0,
        NomeFantasia: document.getElementById("nomeFantasia").value.trim(),
        RazaoSocial: document.getElementById("razaoSocial").value.trim() || null,
        CNPJ: document.getElementById("cnpj").value.replace(/\D/g, ""),
        Telefone: document.getElementById("telefone").value.replace(/\D/g, ""),
        Email: document.getElementById("email").value.trim() || null
    };

    try {
        if (fornecedorEdicao) {
            await apiPost("/Fornecedor/Editar", payload);
        } else {
            await apiPost("/Fornecedor/Criar", payload);
        }
        fecharModal();
        await carregarFornecedores();
    } catch (err) {
        alert("Erro ao salvar fornecedor: " + err.message);
    } finally {
        btnSalvar.disabled = false;
    }
});

// ──────────────────────────────────────────
// CONFIRMAÇÃO ATIVAR / INATIVAR
// ──────────────────────────────────────────
function confirmarAcao(id) {
    fornecedorAcao = fornecedores.find(f => f.idFornecedor === id);
    if (!fornecedorAcao) return;
    const acao = fornecedorAcao.fAtivo ? "inativar" : "reativar";
    document.getElementById("confirmMensagem").innerHTML =
        `Deseja <strong>${acao}</strong> o fornecedor <strong>${fornecedorAcao.nomeFantasia}</strong>?`;
    document.getElementById("modalConfirmar").classList.add("open");
}

function fecharModalConfirmar() {
    document.getElementById("modalConfirmar").classList.remove("open");
    fornecedorAcao = null;
}

document.getElementById("btnConfirmar").addEventListener("click", async function () {
    if (!fornecedorAcao) return;
    this.disabled = true;
    try {
        await apiPost("/Fornecedor/AlterarStatus", fornecedorAcao.idFornecedor);
        fecharModalConfirmar();
        await carregarFornecedores();
    } catch (err) {
        alert("Erro ao alterar status: " + err.message);
    } finally {
        this.disabled = false;
    }
});

// ──────────────────────────────────────────
// FECHAR CLICANDO FORA
// ──────────────────────────────────────────
["modalFornecedor", "modalConfirmar"].forEach(id => {
    document.getElementById(id)?.addEventListener("click", function (e) {
        if (e.target === this) {
            if (id === "modalFornecedor") fecharModal();
            else fecharModalConfirmar();
        }
    });
});

// ──────────────────────────────────────────
// INIT
// ──────────────────────────────────────────
document.getElementById("btn-filtro-todos").classList.add("sel-todos");
carregarFornecedores();