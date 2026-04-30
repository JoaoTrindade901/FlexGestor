// ===== MENU.JS — FlexGestor =====

const menuItens = [
    {
        label: "Início", icone: "bi-house-fill", rota: "Home"
    },
    {
        label: "Caixa", icone: "bi-cash-coin", rota: "Caixa",
        filhos: [
            { label: "Controle de Caixa", rota: "Caixa" }
        ]
    },
    {
        label: "Vendas", icone: "bi-bag-fill", rota: "Pedido",
        filhos: [
            { label: "Pedidos", rota: "Pedido" }
        ]
    },
    {
        label: "Financeiro", icone: "bi-bank", rota: "Financeiro",
        filhos: [
            { label: "Contas a Receber / Pagar", rota: "Financeiro" }
        ]
    },
    {
        label: "Estoque", icone: "bi-boxes", rota: "Estoque",
        filhos: [
            { label: "Controle de Estoque", rota: "Estoque" },
            { label: "Movimentações", rota: "EstoqueHistorico" }
        ]
    },
    {
        label: "Compras", icone: "bi-truck", futuro: true,
        filhos: [
            { label: "Pedidos de Compra", futuro: true },
            { label: "Entrada de Mercadoria", futuro: true }
        ]
    },
    {
        label: "Pessoas", icone: "bi-people-fill", rota: "Cliente",
        filhos: [
            { label: "Clientes", rota: "Cliente" },
            { label: "Fornecedores", rota: "Fornecedor" }
        ]
    },
    {
        label: "Cadastros", icone: "bi-box-seam", rota: "Produto",
        filhos: [
            { label: "Produtos", rota: "Produto" },
            { label: "Categorias", rota: "CategoriaProduto" }
        ]
    },
    {
        label: "Auditoria", icone: "bi-shield-check", rota: "Auditoria"
    },
    {
        label: "Usuários", icone: "bi-person-gear", rota: "Usuario"
    },
    {
        label: "Permissões", icone: "bi-shield-lock-fill", rota: "Permissao"
    }
];

async function inicializarMenu() {
    const rotaAtual = document.body.dataset.rota ?? "";

    let permissoes = null;
    try {
        const res = await fetch("/Permissao/MinhasPermissoes");
        if (res.ok) permissoes = await res.json();
    } catch { /* falha silenciosa — tabelas ainda não existem */ }

    const temAcesso = (rota) => {
        if (!rota) return false;
        // Se permissoes é null (endpoint falhou / tabelas não existem), libera tudo
        if (!permissoes) return true;
        if (permissoes.admin) return true;
        return permissoes.rotas?.some(r => r.toLowerCase() === rota.toLowerCase()) ?? false;
    };

    // "Permissões" só aparece para admin (idCargo == 1)
    const isAdmin = !permissoes || permissoes.admin === true;

    const container = document.getElementById("menu");
    if (!container) return;

    // ── Cabeçalho ──────────────────────────────────────
    const cabecalho = document.createElement("header");
    cabecalho.className = "cabecalho";
    cabecalho.innerHTML = `
        <h1><i class="bi bi-lightning-charge-fill" style="margin-right:.6rem"></i>FlexGestor</h1>
        <a href="/Login/Sair" class="sair"><i class="bi bi-box-arrow-left"></i> Sair</a>`;
    container.appendChild(cabecalho);

    // ── Sidebar ─────────────────────────────────────────
    const sidebar = document.createElement("nav");
    sidebar.className = "sidebar";

    const ul = document.createElement("ul");

    menuItens.forEach(item => {
        // Item de Permissões só aparece para admin
        if (item.rota === "Permissao" && !isAdmin) return;

        // Verificar acesso ao pai
        const paiAcessivel = item.futuro ? false
            : item.filhos
                ? item.filhos.some(f => !f.futuro && temAcesso(f.rota))
                : temAcesso(item.rota);

        if (!item.futuro && !paiAcessivel) return;

        const li = document.createElement("li");

        const atvoPai = item.rota === rotaAtual ||
            item.filhos?.some(f => f.rota === rotaAtual);

        if (!item.filhos) {
            // ── Item simples ──
            if (item.futuro) {
                li.innerHTML = `<span class="menu-item-futuro">
                    <i class="bi ${item.icone}"></i> ${item.label}
                </span>`;
            } else {
                li.innerHTML = `<a href="/${item.rota}" class="${atvoPai ? "active" : ""}">
                    <i class="bi ${item.icone}"></i> ${item.label}
                </a>`;
            }
        } else {
            // ── Grupo expansível ──
            li.className = `menu-expansivel${atvoPai ? " active" : ""}${item.futuro ? " menu-futuro" : ""}`;

            li.innerHTML = `
                <span>
                    <span class="menu-item-label">
                        <i class="bi ${item.icone}"></i> ${item.label}
                    </span>
                    <i class="bi bi-chevron-down seta"></i>
                </span>
                <ul class="submenu" style="${atvoPai ? "max-height:40rem" : ""}"></ul>`;

            const submenu = li.querySelector(".submenu");

            item.filhos.forEach(filho => {
                if (!filho.futuro && !temAcesso(filho.rota)) return;
                const liFilho = document.createElement("li");
                if (filho.futuro) {
                    liFilho.innerHTML = `<span class="menu-item-futuro">${filho.label}</span>`;
                } else {
                    liFilho.innerHTML = `<a href="/${filho.rota}" class="${filho.rota === rotaAtual ? "active" : ""}">
                        ${filho.label}
                    </a>`;
                }
                submenu.appendChild(liFilho);
            });

            // Toggle ao clicar no cabeçalho do grupo
            if (!item.futuro) {
                li.querySelector("span").addEventListener("click", () => {
                    const aberto = li.classList.contains("active");
                    li.classList.toggle("active", !aberto);
                    submenu.style.maxHeight = aberto ? "" : "40rem";
                });
            }
        }

        ul.appendChild(li);
    });

    sidebar.appendChild(ul);
    container.appendChild(sidebar);
}

inicializarMenu();