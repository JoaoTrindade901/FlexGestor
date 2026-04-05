// ===== CATEGORIPRODUTO.JS — integrado com backend =====

let categorias = [];
let filtrado = [];
let categoriaEdicao = null;
let categoriaAcao = null;
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
        const t = await res.text().catch(() => "");
        throw new Error(t || `POST ${url} → ${res.status}`);
    }
    return res;
}

// ──────────────────────────────────────────
// CARREGAR
// ──────────────────────────────────────────
async function carregarCategorias() {
    try {
        categorias = await apiGet("/CategoriaProduto/Listar");
        aplicarFiltro();
    } catch (err) {
        alert("Erro ao carregar categorias: " + err.message);
    }
}

// ──────────────────────────────────────────
// RENDER
// ──────────────────────────────────────────
function renderizarTabela() {
    const tbody = document.getElementById("tbody-categoria");
    if (!tbody) return;

    if (filtrado.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="empty-state">Nenhuma categoria encontrada.</td></tr>`;
        return;
    }

    tbody.innerHTML = filtrado.map(c => `
        <tr>
            <td class="area-acoes">
                <button class="btn-acao btn-editar" onclick="abrirModalEdicao(${c.idCategoria})">
                    <i class="bi bi-pencil-fill"></i>
                </button>
                <button class="btn-acao ${c.fAtivo ? 'btn-inativar' : 'btn-reativar'}"
                    onclick="confirmarAcao(${c.idCategoria})">
                    <i class="bi bi-${c.fAtivo ? 'trash3-fill' : 'arrow-counterclockwise'}"></i>
                </button>
            </td>
            <td>
                <span class="status-pill ${c.fAtivo ? 'status-normal' : 'status-critico'}">
                    ${c.fAtivo ? 'Ativo' : 'Inativo'}
                </span>
            </td>
            <td>${c.nome}</td>
            <td>${c.descricao || '—'}</td>
            <td>${c.nomeCategoriaPai || '—'}</td>
        </tr>
    `).join("");
}

// ──────────────────────────────────────────
// FILTRO
// ──────────────────────────────────────────
function filtrar() {
    const termo = document.getElementById("input-busca")?.value.toLowerCase() || "";
    filtrado = categorias.filter(c => {
        if (filtroStatus === "ativo" && !c.fAtivo) return false;
        if (filtroStatus === "inativo" && c.fAtivo) return false;
        if (termo && !c.nome.toLowerCase().includes(termo)) return false;
        return true;
    });
    renderizarTabela();
}

function aplicarFiltro() {
    filtrado = [...categorias];
    filtrar();
}

function setFiltroStatus(valor) {
    filtroStatus = valor;
    document.querySelectorAll(".btn-status-filtro").forEach(b =>
        b.classList.remove("sel-todos", "sel-ativo", "sel-inativo"));
    document.getElementById("btn-filtro-" + valor).classList.add("sel-" + valor);
    filtrar();
}

// ──────────────────────────────────────────
// SELECT PAI
// ──────────────────────────────────────────
function popularSelectPai(idExcluir = null) {
    const select = document.getElementById("categoriaPai");
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

// ──────────────────────────────────────────
// MODAL NOVO
// ──────────────────────────────────────────
function abrirModal() {
    categoriaEdicao = null;
    document.getElementById("formCategoria").reset();
    popularSelectPai();
    document.getElementById("modalCategoria").classList.add("open");
}

function fecharModal() {
    document.getElementById("modalCategoria").classList.remove("open");
}

// ──────────────────────────────────────────
// MODAL EDIÇÃO
// ──────────────────────────────────────────
function abrirModalEdicao(id) {
    categoriaEdicao = categorias.find(c => c.idCategoria === id);
    if (!categoriaEdicao) return;

    document.getElementById("nomeCategoria").value = categoriaEdicao.nome;
    document.getElementById("descricao").value = categoriaEdicao.descricao || "";
    popularSelectPai(categoriaEdicao.idCategoria);
    document.getElementById("categoriaPai").value = categoriaEdicao.idCategoriaPai || "";

    document.getElementById("modalCategoria").classList.add("open");
}

// ──────────────────────────────────────────
// CONFIRMAÇÃO
// ──────────────────────────────────────────
function confirmarAcao(id) {
    categoriaAcao = categorias.find(c => c.idCategoria === id);
    if (!categoriaAcao) return;

    const acao = categoriaAcao.fAtivo ? "inativar" : "reativar";
    document.getElementById("confirmMensagem").innerHTML =
        `Deseja realmente <strong>${acao}</strong> a categoria <strong>"${categoriaAcao.nome}"</strong>?`;

    document.getElementById("modalConfirmar").classList.add("open");
}

function fecharModalConfirmar() {
    document.getElementById("modalConfirmar").classList.remove("open");
    categoriaAcao = null;
}

// ──────────────────────────────────────────
// EVENTOS
// ──────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {

    document.getElementById("formCategoria").addEventListener("submit", async function (e) {
        e.preventDefault();

        const payload = {
            idCategoria: categoriaEdicao?.idCategoria ?? 0,
            nome: document.getElementById("nomeCategoria").value.trim(),
            descricao: document.getElementById("descricao").value.trim() || null,
            idCategoriaPai: document.getElementById("categoriaPai").value
                ? Number(document.getElementById("categoriaPai").value)
                : null
        };

        try {
            if (categoriaEdicao) {
                await apiPost("/CategoriaProduto/Editar", payload);
            } else {
                await apiPost("/CategoriaProduto/Criar", payload);
            }
            fecharModal();
            await carregarCategorias();
        } catch (err) {
            alert("Erro ao salvar: " + err.message);
        }
    });

    document.getElementById("btnConfirmar").addEventListener("click", async function () {
        if (!categoriaAcao) return;
        try {
            await apiPost("/CategoriaProduto/AlterarStatus", categoriaAcao.idCategoria);
            fecharModalConfirmar();
            await carregarCategorias();
        } catch (err) {
            alert("Erro ao alterar status: " + err.message);
        }
    });

    document.getElementById("input-busca")?.addEventListener("input", filtrar);

    document.getElementById("btn-filtro-todos").classList.add("sel-todos");
    carregarCategorias();
});