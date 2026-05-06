// ===== MENU.JS — FlexGestor =====

// Array que define toda a estrutura do menu lateral do sistema
const menuItens = [
    { label: "Início", icone: "bi-house-fill", rota: "Home" }, // Item simples

    // Item com submenu (filhos)
    {
        label: "Caixa", icone: "bi-cash-coin", rota: "Caixa",
        filhos: [{ label: "Controle de Caixa", rota: "Caixa" }]
    },

    {
        label: "Vendas", icone: "bi-bag-fill", rota: "Pedido",
        filhos: [{ label: "Pedidos", rota: "Pedido" }]
    },

    {
        label: "Financeiro", icone: "bi-bank", rota: "Financeiro",
        filhos: [{ label: "Contas a Receber / Pagar", rota: "Financeiro" }]
    },

    {
        label: "Estoque", icone: "bi-boxes", rota: "Estoque",
        filhos: [
            { label: "Controle de Estoque", rota: "Estoque" },
            { label: "Movimentações", rota: "EstoqueHistorico" }
        ]
    },

    // Itens marcados como "futuro" não ficam clicáveis
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
            { label: "Categorias", rota: "CategoriaProduto" },
            { label: "Despesas", rota: "Despesa" }
        ]
    },

    { label: "Auditoria", icone: "bi-shield-check", rota: "Auditoria" },

    {
        label: "Configurações", icone: "bi-gear-fill", rota: "Empresa",
        filhos: [
            { label: "Empresa", rota: "Empresa" },
            { label: "Usuários", rota: "Usuario" },
            { label: "Permissões", rota: "Permissao" }
        ]
    }
];

// Flags de controle das notificações
let notifCarregadas = false;   // já carregou?
let notifCarregando = false;  // está carregando?
let alertasCache = [];        // cache dos alertas

// Formata valores monetários no padrão BR
function fmtNotif(v) {
    return "R$ " + Number(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 });
}

// GET com timeout (evita travar UI)
function safeGet(url, timeoutMs) {
    timeoutMs = timeoutMs || 4000;

    var ctrl = new AbortController(); // permite cancelar a requisição
    var timer = setTimeout(function () { ctrl.abort(); }, timeoutMs);

    return fetch(url, { signal: ctrl.signal })
        .then(function (r) { return r.ok ? r.json() : []; }) // fallback seguro
        .then(function (d) {
            clearTimeout(timer);
            return Array.isArray(d) ? d : [];
        })
        .catch(function () { return []; }); // nunca quebra o sistema
}

// Função principal que monta o menu
async function inicializarMenu() {

    // Descobre rota atual pela tag <body data-rota="...">
    var rotaAtual = document.body.dataset.rota || "";

    var permissoes = null;

    // Busca permissões do usuário
    try {
        var res = await fetch("/Permissao/MinhasPermissoes");
        if (res.ok) permissoes = await res.json();
    } catch (e) { }

    // Verifica se usuário tem acesso a uma rota
    var temAcesso = function (rota) {
        if (!rota) return false;
        if (!permissoes) return true; // fallback
        if (permissoes.admin) return true;

        return permissoes.rotas && permissoes.rotas.some(function (r) {
            return r.toLowerCase() === rota.toLowerCase();
        });
    };

    var isAdmin = !permissoes || permissoes.admin === true;

    var container = document.getElementById("menu");
    if (!container) return;

    // ───────────────── HEADER ─────────────────
    var cabecalho = document.createElement("header");
    cabecalho.className = "cabecalho";

    // HTML do topo (logo + notificações + logout)
    cabecalho.innerHTML =
        '<h1><i class="bi bi-lightning-charge-fill"></i>FlexGestor</h1>' +
        '<div>' +

        // Botão de notificações
        '<button id="notif-btn" onclick="toggleNotif(event)">' +
        '<i class="bi bi-bell-fill"></i>' +

        // Badge contador
        '<span id="notif-count">0</span>' +
        '</button>' +

        // Painel de notificações
        '<div id="notif-panel">' +
        '<div>Alertas do Sistema</div>' +
        '<div id="notif-lista"></div>' +
        '</div>' +

        // Logout
        '<a href="/Login/Sair">Sair</a>' +
        '</div>';

    container.appendChild(cabecalho);

    // ───────────────── SIDEBAR ─────────────────
    var sidebar = document.createElement("nav");
    var ul = document.createElement("ul");

    menuItens.forEach(function (item) {

        // Regra especial para configurações
        if (item.label === "Configurações") {
            if (!isAdmin && !temAcesso("Empresa")) return;
        }

        // Verifica se item deve aparecer
        var paiAcessivel = item.futuro ? false
            : item.filhos
                ? item.filhos.some(function (f) { return !f.futuro && temAcesso(f.rota); })
                : temAcesso(item.rota);

        if (!item.futuro && !paiAcessivel) return;

        var li = document.createElement("li");

        // Verifica se está ativo
        var ativo = item.rota === rotaAtual ||
            (item.filhos && item.filhos.some(function (f) { return f.rota === rotaAtual; }));

        // Item sem submenu
        if (!item.filhos) {

            li.innerHTML = item.futuro
                ? '<span>' + item.label + '</span>'
                : '<a href="/' + item.rota + '" class="' + (ativo ? "active" : "") + '">' + item.label + '</a>';

        } else {

            // Item com submenu
            li.className = "menu-expansivel" + (ativo ? " active" : "");

            li.innerHTML =
                '<span>' + item.label + '</span>' +
                '<ul class="submenu"></ul>';

            var submenu = li.querySelector(".submenu");

            item.filhos.forEach(function (filho) {

                if ((filho.rota === "Usuario" || filho.rota === "Permissao") && !isAdmin) return;
                if (!filho.futuro && !temAcesso(filho.rota)) return;

                var liFilho = document.createElement("li");

                liFilho.innerHTML = filho.futuro
                    ? '<span>' + filho.label + '</span>'
                    : '<a href="/' + filho.rota + '">' + filho.label + '</a>';

                submenu.appendChild(liFilho);
            });

            if (!item.futuro) {
                li.querySelector("span").addEventListener("click", function () {
                    var aberto = li.classList.contains("active");
                    li.classList.toggle("active", !aberto);
                    submenu.style.maxHeight = aberto ? "" : "40rem";
                });
            }
        }

        ul.appendChild(li);
    });

    sidebar.appendChild(ul);
    container.appendChild(sidebar);

    // Fecha notificações ao clicar fora
    document.addEventListener("click", function (e) {
        var panel = document.getElementById("notif-panel");
        var btn = document.getElementById("notif-btn");

        if (panel && !panel.contains(e.target) && btn && !btn.contains(e.target)) {
            panel.style.display = "none";
        }
    });

    if (window.__dashboardCache) {
        processarDashboardCache(window.__dashboardCache);
    }
}

// Abre/fecha painel de notificações
function toggleNotif(e) {
    e.stopPropagation();

    var panel = document.getElementById("notif-panel");
    var aberto = panel.style.display === "block";

    panel.style.display = aberto ? "none" : "block";

    // Lazy loading
    if (!aberto && !notifCarregadas && !notifCarregando) {
        carregarNotificacoes();
    } else if (!aberto && notifCarregadas) {
        renderizarLista(alertasCache);
    }
}

// Carrega dados e gera alertas
async function carregarNotificacoes() {
    notifCarregando = true;

    renderizarLista(null); // loading

    var resultados = await Promise.all([
        safeGet("/Estoque/Listar"),
        safeGet("/Financeiro/ListarContasReceber"),
        safeGet("/Financeiro/ListarContasPagar")
    ]);

    notifCarregando = false;
    notifCarregadas = true;

    alertasCache = montarAlertas(resultados[0], resultados[1], resultados[2]);

    atualizarContador(alertasCache);
    renderizarLista(alertasCache);
}

// Constrói lista de alertas baseado nos dados
function montarAlertas(estoque, receber, pagar) {
    var alertas = [];

    // Estoque crítico
    var criticos = estoque.filter(function (e) {
        return e.quantidade <= e.estoqueMinimo;
    });

    if (criticos.length > 0) {
        alertas.push({
            titulo: criticos.length + " produtos com estoque crítico",
            rota: "/Estoque"
        });
    }

    // Contas vencidas
    var vencidasR = receber.filter(c => c.statusAtual === "VENCIDO");

    if (vencidasR.length > 0) {
        alertas.push({
            titulo: vencidasR.length + " contas a receber vencidas",
            rota: "/Financeiro"
        });
    }

    return alertas;
}

// Atualiza número do badge
function atualizarContador(alertas) {
    var count = document.getElementById("notif-count");

    if (!alertas || alertas.length === 0) {
        count.style.display = "none";
        return;
    }

    count.textContent = alertas.length;
    count.style.display = "flex";
}

// Renderiza lista no painel
function renderizarLista(alertas) {
    var lista = document.getElementById("notif-lista");

    if (alertas === null) {
        lista.innerHTML = "Carregando...";
        return;
    }

    if (alertas.length === 0) {
        lista.innerHTML = "Nenhum alerta.";
        return;
    }

    lista.innerHTML = alertas.map(function (a) {
        return '<a href="' + a.rota + '">' + a.titulo + '</a>';
    }).join("");
}

// Inicializa tudo ao carregar
inicializarMenu();