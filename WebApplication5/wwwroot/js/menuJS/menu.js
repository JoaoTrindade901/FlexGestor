// =========================
// ROTA ATUAL (injetada pelo layout via data attribute)
// =========================
const rotaAtual = document.body.dataset.rota || "";

// =========================
// HTML DO MENU
// =========================
function ativo(rota) {
    return rotaAtual === rota ? "active" : "";
}

const menuHTML = `
<header class="cabecalho">
    <h1>FlexGestor</h1>
    <a href="/Login/Sair" class="sair">Sair</a>
</header>
<nav class="sidebar">
    <ul>
        <li><a href="/Home"    class="${ativo('Home')}">Início</a></li>
        <li><a href="/Usuario" class="${ativo('Usuario')}">Usuários</a></li>
        <li><a href="/Cliente" class="${ativo('Cliente')}">Clientes</a></li>
        <li><a href="/Pedido"  class="${ativo('Pedido')}">Pedidos</a></li>
        <li><a href="/Estoque" class="${ativo('Estoque')}">Estoque</a></li>

        <!-- CADASTROS -->
        <li class="menu-expansivel">
            <span>
                Cadastros
                <i class="bi bi-chevron-down seta"></i>
            </span>
            <ul class="submenu">
                <li><a href="/Fornecedor" class="${ativo('Fornecedores')}">Fornecedores</a></li>
                <li><a href="/CategoriaProduto" class="${ativo('CategoriaProduto')}">Categoria Produto</a></li>
            </ul>
        </li>

        <!-- INTELIGÊNCIA -->
        <li class="menu-expansivel ${ativo('ML')}">
            <span>
                Análise Gerencial
                <i class="bi bi-chevron-down seta"></i>
            </span>
            <ul class="submenu">
                <li><a href="/ML"     class="${ativo('ML')}">Previsões ML</a></li>
                <li><a href="/ML/EDA" class="">Análise EDA</a></li>
            </ul>
        </li>
    </ul>
</nav>
`;

// =========================
// INSERE MENU
// =========================
document.getElementById("menu").innerHTML = menuHTML;

// =========================
// MENU EXPANSÍVEL
// =========================
const menus = document.querySelectorAll('.menu-expansivel');
menus.forEach(menu => {
    const toggle = menu.querySelector('span');
    const submenu = menu.querySelector('.submenu');

    // Abre automaticamente o grupo ativo ao carregar
    if (menu.classList.contains('active') && submenu) {
        submenu.style.maxHeight = submenu.scrollHeight + "px";
    }

    toggle.addEventListener('click', () => {
        const isActive = menu.classList.contains('active');
        menus.forEach(m => {
            m.classList.remove('active');
            const sub = m.querySelector('.submenu');
            if (sub) sub.style.maxHeight = null;
        });
        if (!isActive) {
            menu.classList.add('active');
            submenu.style.maxHeight = submenu.scrollHeight + "px";
        }
    });
});
