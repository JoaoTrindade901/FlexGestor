let categorias = [
    { id: 1, nome: "Peças", descricao: "Peças automotivas", pai: null, fAtivo: true },
    { id: 2, nome: "Filtros", descricao: "", pai: 1, fAtivo: true }
];

let filtrado = [...categorias];
let categoriaEdicao = null;
let categoriaAcao = null;
let filtroStatus = "todos";

// RENDER
function renderizarTabela() {
    const tbody = document.getElementById("tbody-categoria");

    tbody.innerHTML = filtrado.map(c => {
        const pai = categorias.find(p => p.id === c.pai);

        return `
        <tr>
            <td class="area-acoes">
                <button class="btn-acao btn-editar" onclick="editar(${c.id})">
                    <i class="bi bi-pencil-fill"></i>
                </button>

                <button class="btn-acao ${c.fAtivo ? 'btn-inativar' : 'btn-reativar'}"
                    onclick="confirmarAcao(${c.id})">
                    <i class="bi bi-${c.fAtivo ? 'trash3-fill' : 'arrow-counterclockwise'}"></i>
                </button>
            </td>

            <td>
                <span class="status-pill ${c.fAtivo ? 'status-normal' : 'status-critico'}">
                    ${c.fAtivo ? 'Ativo' : 'Inativo'}
                </span>
            </td>

            <td>${c.nome}</td>
            <td>${c.descricao || '-'}</td>
            <td>${pai ? pai.nome : '-'}</td>
        </tr>
        `;
    }).join("");
}

// FILTRO
function filtrar() {
    const termo = document.getElementById("input-busca").value.toLowerCase();

    filtrado = categorias.filter(c => {
        if (filtroStatus === "ativo" && !c.fAtivo) return false;
        if (filtroStatus === "inativo" && c.fAtivo) return false;
        if (termo && !c.nome.toLowerCase().includes(termo)) return false;
        return true;
    });

    renderizarTabela();
}

// STATUS
function setFiltroStatus(valor) {
    filtroStatus = valor;

    document.querySelectorAll(".btn-status-filtro").forEach(b =>
        b.classList.remove("sel-todos", "sel-ativo", "sel-inativo")
    );

    document.getElementById("btn-filtro-" + valor).classList.add("sel-" + valor);

    filtrar();
}

// MODAL
function abrirModal() {
    categoriaEdicao = null;
    document.getElementById("formCategoria").reset();
    popularSelectPai();
    document.getElementById("modalCategoria").classList.add("open");
}

function fecharModal() {
    document.getElementById("modalCategoria").classList.remove("open");
}

// SELECT PAI
function popularSelectPai() {
    const select = document.getElementById("categoriaPai");

    let opcoes = `<option value="">Nenhuma</option>`;

    categorias.forEach(c => {
        if (categoriaEdicao && c.id === categoriaEdicao.id) return;
        opcoes += `<option value="${c.id}">${c.nome}</option>`;
    });

    select.innerHTML = opcoes;

    if (categoriaEdicao) {
        select.value = categoriaEdicao.pai || "";
    }
}

// EDITAR
function editar(id) {
    categoriaEdicao = categorias.find(c => c.id === id);

    nomeCategoria.value = categoriaEdicao.nome;
    descricao.value = categoriaEdicao.descricao;

    abrirModal();
}

// CONFIRMAÇÃO
function confirmarAcao(id) {
    categoriaAcao = categorias.find(c => c.id === id);

    const acao = categoriaAcao.fAtivo ? "inativar" : "reativar";

    confirmMensagem.innerHTML =
        `Deseja realmente <strong>${acao}</strong> a categoria <strong>${categoriaAcao.nome}</strong>?`;

    modalConfirmar.classList.add("open");
}

function fecharModalConfirmar() {
    modalConfirmar.classList.remove("open");
}

// EVENTOS
document.addEventListener("DOMContentLoaded", () => {

    document.getElementById("formCategoria").addEventListener("submit", function (e) {
        e.preventDefault();

        const nova = {
            id: categoriaEdicao ? categoriaEdicao.id : Date.now(),
            nome: nomeCategoria.value,
            descricao: descricao.value,
            pai: categoriaPai.value ? Number(categoriaPai.value) : null,
            fAtivo: true
        };

        if (categoriaEdicao) {
            Object.assign(categoriaEdicao, nova);
        } else {
            categorias.unshift(nova);
        }

        fecharModal();
        filtrar();
    });

    btnConfirmar.onclick = () => {
        categoriaAcao.fAtivo = !categoriaAcao.fAtivo;
        fecharModalConfirmar();
        filtrar();
    };

    document.getElementById("btn-filtro-todos").classList.add("sel-todos");

    renderizarTabela();
});