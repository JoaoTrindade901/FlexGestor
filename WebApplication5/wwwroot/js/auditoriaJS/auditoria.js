// ===== AUDITORIA.JS — FlexGestor =====

const LOGS_POR_PAGINA = 20;
let paginaAtual = 1;
let todosLogs = [];

async function apiGet(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`GET ${url} → ${res.status}`);
    return res.json();
}

function fmtDataHora(s) {
    if (!s) return "—";
    const local = s.endsWith("Z") ? s.slice(0, -1) : s;
    return new Date(local).toLocaleString("pt-BR", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit", second: "2-digit"
    });
}

// Cores por módulo
const MODULO_CONFIG = {
    AUTH: { classe: "mod-auth", label: "Autenticação" },
    CAIXA: { classe: "mod-caixa", label: "Caixa" },
    PRODUTO: { classe: "mod-produto", label: "Produto" },
    CLIENTE: { classe: "mod-cliente", label: "Cliente" },
    PEDIDO: { classe: "mod-pedido", label: "Pedido" },
    ESTOQUE: { classe: "mod-estoque", label: "Estoque" },
    USUARIO: { classe: "mod-usuario", label: "Usuário" },
};

const ACAO_CONFIG = {
    LOGIN: { icone: "bi-box-arrow-in-right", classe: "acao-info" },
    LOGOUT: { icone: "bi-box-arrow-right", classe: "acao-info" },
    CRIAR: { icone: "bi-plus-circle-fill", classe: "acao-sucesso" },
    EDITAR: { icone: "bi-pencil-fill", classe: "acao-aviso" },
    INATIVAR: { icone: "bi-dash-circle-fill", classe: "acao-perigo" },
    REATIVAR: { icone: "bi-check-circle-fill", classe: "acao-sucesso" },
    EXCLUIR: { icone: "bi-trash3-fill", classe: "acao-perigo" },
    ABRIR_CAIXA: { icone: "bi-unlock-fill", classe: "acao-sucesso" },
    FECHAR_CAIXA: { icone: "bi-lock-fill", classe: "acao-perigo" },
    VENDA: { icone: "bi-cart-fill", classe: "acao-sucesso" },
    SANGRIA: { icone: "bi-dash-circle-fill", classe: "acao-aviso" },
    SUPRIMENTO: { icone: "bi-plus-circle-fill", classe: "acao-info" },
    DESPESA: { icone: "bi-arrow-up-circle-fill", classe: "acao-perigo" },
    RECEBIMENTO: { icone: "bi-currency-dollar", classe: "acao-sucesso" },
    ALTERAR_STATUS: { icone: "bi-arrow-repeat", classe: "acao-aviso" },
    CANCELAR: { icone: "bi-x-circle-fill", classe: "acao-perigo" },
    ENTRADA: { icone: "bi-box-arrow-in-down", classe: "acao-sucesso" },
    SAIDA: { icone: "bi-box-arrow-up", classe: "acao-perigo" },
    AJUSTE: { icone: "bi-sliders", classe: "acao-aviso" },
};

async function carregarLogs() {
    paginaAtual = 1;
    const modulo = document.getElementById("filtro-modulo").value;
    const usuario = document.getElementById("filtro-usuario").value;
    const dataInicio = document.getElementById("filtro-data-inicio").value;
    const dataFim = document.getElementById("filtro-data-fim").value;

    const params = new URLSearchParams();
    if (modulo) params.append("Modulo", modulo);
    if (usuario) params.append("NomeUsuario", usuario);
    if (dataInicio) params.append("DataInicio", dataInicio);
    if (dataFim) params.append("DataFim", dataFim);

    document.getElementById("tbody-auditoria").innerHTML =
        `<tr><td colspan="7" class="empty-state">Carregando...</td></tr>`;

    try {
        todosLogs = await apiGet(`/Auditoria/Listar?${params.toString()}`);
        renderizarTabela();
    } catch (err) {
        document.getElementById("tbody-auditoria").innerHTML =
            `<tr><td colspan="7" class="empty-state">Erro ao carregar logs.</td></tr>`;
    }
}

function limparFiltros() {
    document.getElementById("filtro-modulo").value = "";
    document.getElementById("filtro-usuario").value = "";
    document.getElementById("filtro-data-inicio").value = "";
    document.getElementById("filtro-data-fim").value = "";
    carregarLogs();
}

function renderizarTabela() {
    const total = todosLogs.length;
    const totalPags = Math.ceil(total / LOGS_POR_PAGINA);
    const inicio = (paginaAtual - 1) * LOGS_POR_PAGINA;
    const pagina = todosLogs.slice(inicio, inicio + LOGS_POR_PAGINA);

    document.getElementById("auditoria-total").textContent =
        `${total} registro${total !== 1 ? "s" : ""} encontrado${total !== 1 ? "s" : ""}`;

    const tbody = document.getElementById("tbody-auditoria");
    if (!pagina.length) {
        tbody.innerHTML = `<tr><td colspan="7" class="empty-state">Nenhum registro encontrado.</td></tr>`;
        document.getElementById("audit-pag-info").textContent = "";
        document.getElementById("audit-pag-ctrl").innerHTML = "";
        return;
    }

    tbody.innerHTML = pagina.map((l, i) => {
        const modCfg = MODULO_CONFIG[l.modulo] || { classe: "mod-default", label: l.modulo };
        const acaoCfg = ACAO_CONFIG[l.acao] || { icone: "bi-circle", classe: "acao-info" };
        const temDetalhe = l.valorAnterior || l.valorNovo;
        const idx = inicio + i;
        return `<tr>
            <td class="td-data">${fmtDataHora(l.dthAcao)}</td>
            <td>
                <span class="usuario-tag">
                    <i class="bi bi-person-fill"></i> ${l.nomeUsuario || "Sistema"}
                </span>
            </td>
            <td><span class="modulo-pill ${modCfg.classe}">${modCfg.label}</span></td>
            <td>
                <span class="acao-pill ${acaoCfg.classe}">
                    <i class="bi ${acaoCfg.icone}"></i> ${l.acao}
                </span>
            </td>
            <td class="td-descricao" title="${l.descricao || ""}">${l.descricao || "—"}</td>
            <td class="td-ip">${l.ipUsuario || "—"}</td>
            <td>${temDetalhe ? `
                <button class="btn-detalhe" onclick="abrirDetalhe(${idx})" title="Ver alterações">
                    <i class="bi bi-eye-fill"></i>
                </button>` : ""}</td>
        </tr>`;
    }).join("");

    // Paginação
    const ini = total === 0 ? 0 : inicio + 1;
    const fim = Math.min(paginaAtual * LOGS_POR_PAGINA, total);
    document.getElementById("audit-pag-info").textContent = `Mostrando ${ini}–${fim} de ${total}`;

    const ctrl = document.getElementById("audit-pag-ctrl");
    ctrl.innerHTML = "";

    const prev = document.createElement("button");
    prev.className = "btn-pagina"; prev.textContent = "‹"; prev.disabled = paginaAtual === 1;
    prev.onclick = () => { paginaAtual--; renderizarTabela(); };
    ctrl.appendChild(prev);

    for (let i = 1; i <= totalPags; i++) {
        const btn = document.createElement("button");
        btn.className = `btn-pagina${i === paginaAtual ? " ativo" : ""}`;
        btn.textContent = i;
        btn.onclick = () => { paginaAtual = i; renderizarTabela(); };
        ctrl.appendChild(btn);
    }

    const next = document.createElement("button");
    next.className = "btn-pagina"; next.textContent = "›";
    next.disabled = paginaAtual >= totalPags;
    next.onclick = () => { paginaAtual++; renderizarTabela(); };
    ctrl.appendChild(next);
}

function abrirDetalhe(idx) {
    const log = todosLogs[idx];
    if (!log) return;

    let html = `
        <div class="detalhe-linha"><span class="detalhe-label">Data/Hora</span><span>${fmtDataHora(log.dthAcao)}</span></div>
        <div class="detalhe-linha"><span class="detalhe-label">Usuário</span><span>${log.nomeUsuario || "Sistema"}</span></div>
        <div class="detalhe-linha"><span class="detalhe-label">Módulo</span><span>${log.modulo}</span></div>
        <div class="detalhe-linha"><span class="detalhe-label">Ação</span><span>${log.acao}</span></div>
        <div class="detalhe-linha"><span class="detalhe-label">Descrição</span><span>${log.descricao || "—"}</span></div>
        <div class="detalhe-linha"><span class="detalhe-label">IP</span><span>${log.ipUsuario || "—"}</span></div>`;

    if (log.valorAnterior) {
        try {
            const obj = JSON.parse(log.valorAnterior);
            html += `<div class="detalhe-secao">Valor Anterior</div>
                <pre class="detalhe-json antes">${JSON.stringify(obj, null, 2)}</pre>`;
        } catch {
            html += `<div class="detalhe-secao">Valor Anterior</div>
                <pre class="detalhe-json antes">${log.valorAnterior}</pre>`;
        }
    }

    if (log.valorNovo) {
        try {
            const obj = JSON.parse(log.valorNovo);
            html += `<div class="detalhe-secao">Valor Novo</div>
                <pre class="detalhe-json depois">${JSON.stringify(obj, null, 2)}</pre>`;
        } catch {
            html += `<div class="detalhe-secao">Valor Novo</div>
                <pre class="detalhe-json depois">${log.valorNovo}</pre>`;
        }
    }

    document.getElementById("detalhe-corpo").innerHTML = html;
    document.getElementById("modal-detalhe-log").classList.add("open");
}

function fecharDetalhe() {
    document.getElementById("modal-detalhe-log").classList.remove("open");
}

document.addEventListener("DOMContentLoaded", () => {
    // Fechar modal clicando fora
    document.getElementById("modal-detalhe-log")?.addEventListener("click", function (e) {
        if (e.target === this) fecharDetalhe();
    });

    // Data fim padrão = hoje, data início = 7 dias atrás
    const hoje = new Date();
    const seteDias = new Date();
    seteDias.setDate(hoje.getDate() - 7);
    document.getElementById("filtro-data-inicio").value = seteDias.toISOString().split("T")[0];
    document.getElementById("filtro-data-fim").value = hoje.toISOString().split("T")[0];

    carregarLogs();
});