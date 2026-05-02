// ===== MENU.JS — FlexGestor =====

const menuItens = [
    { label: "Início", icone: "bi-house-fill", rota: "Home" },
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
    { label: "Usuarios", icone: "bi-person-gear", rota: "Usuario" },
    { label: "Permissoes", icone: "bi-shield-lock-fill", rota: "Permissao" }
];

let notifCarregadas = false;
let notifCarregando = false;
let alertasCache = [];

function fmtNotif(v) {
    return "R$ " + Number(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 });
}

function safeGet(url, timeoutMs) {
    timeoutMs = timeoutMs || 4000;
    var ctrl = new AbortController();
    var timer = setTimeout(function () { ctrl.abort(); }, timeoutMs);
    return fetch(url, { signal: ctrl.signal })
        .then(function (r) { return r.ok ? r.json() : []; })
        .then(function (d) { clearTimeout(timer); return Array.isArray(d) ? d : []; })
        .catch(function () { return []; });
}

async function inicializarMenu() {
    var rotaAtual = document.body.dataset.rota || "";

    var permissoes = null;
    try {
        var res = await fetch("/Permissao/MinhasPermissoes");
        if (res.ok) permissoes = await res.json();
    } catch (e) { }

    var temAcesso = function (rota) {
        if (!rota) return false;
        if (!permissoes) return true;
        if (permissoes.admin) return true;
        return permissoes.rotas && permissoes.rotas.some(function (r) {
            return r.toLowerCase() === rota.toLowerCase();
        });
    };

    var isAdmin = !permissoes || permissoes.admin === true;
    var container = document.getElementById("menu");
    if (!container) return;

    // ── Cabeçalho ──
    var cabecalho = document.createElement("header");
    cabecalho.className = "cabecalho";
    cabecalho.innerHTML =
        '<h1><i class="bi bi-lightning-charge-fill" style="margin-right:.6rem"></i>FlexGestor</h1>' +
        '<div style="display:flex;align-items:center;gap:1.2rem">' +
        '<div style="position:relative">' +
        '<button id="notif-btn" onclick="toggleNotif(event)" title="Alertas" style="' +
        'background:none;border:none;cursor:pointer;color:#fff;font-size:2rem;' +
        'padding:.4rem;display:flex;align-items:center;opacity:.85;transition:opacity .2s">' +
        '<i class="bi bi-bell-fill"></i>' +
        '<span id="notif-count" style="' +
        'display:none;position:absolute;top:-.2rem;right:-.2rem;' +
        'background:#ef4444;color:#fff;border-radius:50%;' +
        'width:1.8rem;height:1.8rem;font-size:1.1rem;font-weight:700;' +
        'align-items:center;justify-content:center;' +
        'font-family:Segoe UI,sans-serif;line-height:1">0</span>' +
        '</button>' +
        '<div id="notif-panel" style="' +
        'display:none;position:absolute;top:calc(100% + 1rem);right:0;' +
        'width:36rem;background:#fff;border-radius:1.2rem;' +
        'box-shadow:0 1.2rem 4rem rgba(0,0,0,.18);' +
        'z-index:9999;overflow:hidden;font-family:Segoe UI,sans-serif">' +
        '<div style="background:#1e3c72;color:#fff;padding:1.4rem 1.8rem;' +
        'font-size:1.4rem;font-weight:700;display:flex;align-items:center;gap:.8rem">' +
        '<i class="bi bi-bell-fill"></i> Alertas do Sistema' +
        '</div>' +
        '<div id="notif-lista" style="max-height:48rem;overflow-y:auto;padding:.8rem"></div>' +
        '</div>' +
        '</div>' +
        '<a href="/Login/Sair" class="sair"><i class="bi bi-box-arrow-left"></i> Sair</a>' +
        '</div>';
    container.appendChild(cabecalho);

    // ── Sidebar ──
    var sidebar = document.createElement("nav");
    sidebar.className = "sidebar";
    var ul = document.createElement("ul");

    menuItens.forEach(function (item) {
        if (item.rota === "Permissao" && !isAdmin) return;

        var paiAcessivel = item.futuro ? false
            : item.filhos
                ? item.filhos.some(function (f) { return !f.futuro && temAcesso(f.rota); })
                : temAcesso(item.rota);

        if (!item.futuro && !paiAcessivel) return;

        var li = document.createElement("li");
        var atvoPai = item.rota === rotaAtual ||
            (item.filhos && item.filhos.some(function (f) { return f.rota === rotaAtual; }));

        if (!item.filhos) {
            li.innerHTML = item.futuro
                ? '<span class="menu-item-futuro"><i class="bi ' + item.icone + '"></i> ' + item.label + '</span>'
                : '<a href="/' + item.rota + '" class="' + (atvoPai ? "active" : "") + '"><i class="bi ' + item.icone + '"></i> ' + item.label + '</a>';
        } else {
            li.className = "menu-expansivel" + (atvoPai ? " active" : "") + (item.futuro ? " menu-futuro" : "");
            li.innerHTML =
                '<span>' +
                '<span class="menu-item-label">' +
                '<i class="bi ' + item.icone + '"></i> ' + item.label +
                '</span>' +
                '<i class="bi bi-chevron-down seta"></i>' +
                '</span>' +
                '<ul class="submenu" style="' + (atvoPai ? "max-height:40rem" : "") + '"></ul>';

            var submenu = li.querySelector(".submenu");
            item.filhos.forEach(function (filho) {
                if (!filho.futuro && !temAcesso(filho.rota)) return;
                var liFilho = document.createElement("li");
                liFilho.innerHTML = filho.futuro
                    ? '<span class="menu-item-futuro">' + filho.label + '</span>'
                    : '<a href="/' + filho.rota + '" class="' + (filho.rota === rotaAtual ? "active" : "") + '">' + filho.label + '</a>';
                submenu.appendChild(liFilho);
            });
        }

        ul.appendChild(li);
    });

    sidebar.appendChild(ul);
    container.appendChild(sidebar);

    document.addEventListener("click", function (e) {
        var panel = document.getElementById("notif-panel");
        var btn = document.getElementById("notif-btn");
        if (panel && !panel.contains(e.target) && btn && !btn.contains(e.target)) {
            panel.style.display = "none";
        }
    });

    document.addEventListener("click", function (e) {
        var spanClicado = e.target.closest(".sidebar .menu-expansivel > span");
        if (!spanClicado) return;

        var liClicado = spanClicado.parentElement;
        var estaAberto = liClicado.classList.contains("active");

        document.querySelectorAll(".sidebar .menu-expansivel").forEach(function (li) {
            li.classList.remove("active");
            var sub = li.querySelector(".submenu");
            if (sub) sub.style.maxHeight = "";
        });

        if (!estaAberto) {
            liClicado.classList.add("active");
            var submenuClicado = liClicado.querySelector(".submenu");
            if (submenuClicado) submenuClicado.style.maxHeight = "40rem";
        }
    });

    if (window.__dashboardCache) {
        processarDashboardCache(window.__dashboardCache);
    }
}

function toggleNotif(e) {
    e.stopPropagation();
    var panel = document.getElementById("notif-panel");
    var aberto = panel.style.display === "block";
    panel.style.display = aberto ? "none" : "block";
    if (!aberto && !notifCarregadas && !notifCarregando) {
        carregarNotificacoes();
    } else if (!aberto && notifCarregadas) {
        renderizarLista(alertasCache);
    }
}

async function carregarNotificacoes() {
    notifCarregando = true;
    renderizarLista(null);

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

function processarDashboardCache(d) {
    var alertas = [];

    if ((d.produtosEstoqueCritico || 0) > 0) {
        alertas.push({
            icone: "bi-exclamation-triangle-fill", cor: "#dc2626",
            titulo: d.produtosEstoqueCritico + " produto" + (d.produtosEstoqueCritico > 1 ? "s" : "") + " com estoque crítico",
            descricao: "Quantidade abaixo do mínimo. Realize reposição imediatamente.",
            rota: "/Estoque"
        });
    }

    if ((d.contasReceberVencidas || 0) > 0) {
        alertas.push({
            icone: "bi-arrow-down-circle-fill", cor: "#dc2626",
            titulo: d.contasReceberVencidas + " conta" + (d.contasReceberVencidas > 1 ? "s" : "") + " a receber vencida" + (d.contasReceberVencidas > 1 ? "s" : ""),
            descricao: fmtNotif(d.totalReceberVencido) + " em atraso. Entre em contato com os clientes.",
            rota: "/Financeiro"
        });
    }

    if ((d.contasPagarVencidas || 0) > 0) {
        alertas.push({
            icone: "bi-arrow-up-circle-fill", cor: "#dc2626",
            titulo: d.contasPagarVencidas + " conta" + (d.contasPagarVencidas > 1 ? "s" : "") + " a pagar vencida" + (d.contasPagarVencidas > 1 ? "s" : ""),
            descricao: fmtNotif(d.totalPagarVencido) + " em atraso. Regularize para evitar juros.",
            rota: "/Financeiro"
        });
    }

    notifCarregadas = true;
    alertasCache = alertas;
    atualizarContador(alertas);
}

function montarAlertas(estoque, receber, pagar) {
    var alertas = [];
    var hoje = new Date(); hoje.setHours(0, 0, 0, 0);
    var em3d = new Date(hoje); em3d.setDate(hoje.getDate() + 3);

    var criticos = estoque.filter(function (e) {
        return (e.estoqueMinimo || 0) > 0 && (e.quantidade || 0) <= (e.estoqueMinimo || 0);
    });
    if (criticos.length > 0) {
        var nomesCriticos = criticos.slice(0, 3).map(function (e) {
            return e.nomeProduto + " (" + (e.quantidade || 0) + " un.)";
        }).join(", ") + (criticos.length > 3 ? " e mais " + (criticos.length - 3) + "..." : "");
        alertas.push({
            icone: "bi-exclamation-triangle-fill", cor: "#dc2626",
            titulo: criticos.length + " produto" + (criticos.length > 1 ? "s" : "") + " com estoque crítico",
            descricao: nomesCriticos,
            rota: "/Estoque"
        });
    }

    var excessos = estoque.filter(function (e) {
        return (e.estoqueMax || 0) > 0 && (e.quantidade || 0) > (e.estoqueMax || 0);
    });
    if (excessos.length > 0) {
        var nomesExcessos = excessos.slice(0, 3).map(function (e) {
            var sobra = (e.quantidade || 0) - (e.estoqueMax || 0);
            return e.nomeProduto + " (+" + sobra + " un.)";
        }).join(", ") + (excessos.length > 3 ? " e mais " + (excessos.length - 3) + "..." : "");
        alertas.push({
            icone: "bi-arrow-up-circle-fill", cor: "#d97706",
            titulo: excessos.length + " produto" + (excessos.length > 1 ? "s" : "") + " com estoque em excesso",
            descricao: nomesExcessos,
            rota: "/Estoque"
        });
    }

    var vencidasR = receber.filter(function (c) { return c.statusAtual === "VENCIDO"; });
    if (vencidasR.length > 0) {
        var totalR = vencidasR.reduce(function (s, c) { return s + Math.max(0, c.valorTotal - c.valorPago); }, 0);
        alertas.push({
            icone: "bi-arrow-down-circle-fill", cor: "#dc2626",
            titulo: vencidasR.length + " conta" + (vencidasR.length > 1 ? "s" : "") + " a receber vencida" + (vencidasR.length > 1 ? "s" : ""),
            descricao: fmtNotif(totalR) + " em atraso. Entre em contato com os clientes.",
            rota: "/Financeiro"
        });
    }

    var vencidasP = pagar.filter(function (c) { return c.statusAtual === "VENCIDO"; });
    if (vencidasP.length > 0) {
        var totalP = vencidasP.reduce(function (s, c) { return s + Math.max(0, c.valorTotal - c.valorPago); }, 0);
        alertas.push({
            icone: "bi-arrow-up-circle-fill", cor: "#dc2626",
            titulo: vencidasP.length + " conta" + (vencidasP.length > 1 ? "s" : "") + " a pagar vencida" + (vencidasP.length > 1 ? "s" : ""),
            descricao: fmtNotif(totalP) + " em atraso. Regularize para evitar juros.",
            rota: "/Financeiro"
        });
    }

    return alertas;
}

function atualizarContador(alertas) {
    var count = document.getElementById("notif-count");
    if (!count) return;
    if (!alertas || alertas.length === 0) { count.style.display = "none"; return; }
    count.textContent = alertas.length > 9 ? "9+" : String(alertas.length);
    count.style.display = "flex";
    count.style.background = "#ef4444";
}

function renderizarLista(alertas) {
    var lista = document.getElementById("notif-lista");
    if (!lista) return;

    if (alertas === null) {
        lista.innerHTML =
            '<div style="padding:2rem;text-align:center;color:#9ca3af;font-size:1.3rem">' +
            '<div style="width:2rem;height:2rem;border:3px solid #e5e7eb;border-top-color:#1e3c72;' +
            'border-radius:50%;animation:menuSpin .8s linear infinite;margin:0 auto 1rem"></div>' +
            'Verificando alertas...' +
            '</div>' +
            '<style>@keyframes menuSpin{to{transform:rotate(360deg)}}</style>';
        return;
    }

    if (alertas.length === 0) {
        lista.innerHTML =
            '<div style="padding:2.4rem;text-align:center">' +
            '<i class="bi bi-check-circle-fill" style="font-size:3rem;color:#15803d;display:block;margin-bottom:.8rem"></i>' +
            '<span style="font-size:1.3rem;color:#6b7280">Tudo em ordem! Nenhum alerta.</span>' +
            '</div>';
        return;
    }

    lista.innerHTML = alertas.map(function (a) {
        return '<a href="' + a.rota + '" style="text-decoration:none;display:block">' +
            '<div style="padding:1.2rem 1.6rem;border-bottom:1px solid #f0f2f5;cursor:pointer;transition:background .15s"' +
            ' onmouseover="this.style.background=\'#f8fafc\'" onmouseout="this.style.background=\'transparent\'">' +
            '<div style="display:flex;align-items:flex-start;gap:1.2rem">' +
            '<i class="bi ' + a.icone + '" style="color:' + a.cor + ';font-size:2rem;flex-shrink:0;margin-top:.2rem"></i>' +
            '<div>' +
            '<div style="font-size:1.3rem;font-weight:700;color:#1f2937;margin-bottom:.3rem">' + a.titulo + '</div>' +
            '<div style="font-size:1.2rem;color:#6b7280;line-height:1.4">' + a.descricao + '</div>' +
            '</div>' +
            '</div>' +
            '</div>' +
            '</a>';
    }).join("");
}

inicializarMenu();