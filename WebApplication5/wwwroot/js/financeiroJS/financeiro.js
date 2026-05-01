// ===== FINANCEIRO.JS — FlexGestor =====

let contasReceber = [];
let contasReceberFiltradas = [];
let filtroReceber = "todos";
let filtroReceberTexto = "";
let pagReceberAtual = 1;
const PAG_RECEBER = 15;

let contasPagar = [];
let contasPagarFiltradas = [];
let filtroPagar = "todos";
let filtroPagarTexto = "";
let pagPagarAtual = 1;
const PAG_PAGAR = 15;

let formasPagamento = [];
let categorias = [];
let clientes = [];
let fornecedores = [];

let filtroVencimentoInicioR = null;
let filtroVencimentoFimR = null;
let filtroVencimentoInicioP = null;
let filtroVencimentoFimP = null;
let ordemReceber = { campo: 'dthVencimento', asc: true };
let ordemPagar = { campo: 'dthVencimento', asc: true };

// ──────────────────────────────────────────
// HELPERS
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

function flexToast(msg, tipo = "sucesso") {
    const cores = { sucesso: "#15803d", erro: "#dc2626", aviso: "#d97706" };
    const icones = { sucesso: "bi-check-circle-fill", erro: "bi-x-circle-fill", aviso: "bi-exclamation-triangle-fill" };
    const t = document.createElement("div");
    t.style.cssText = `position:fixed;top:2rem;right:2rem;background:${cores[tipo]};color:#fff;
        padding:1.2rem 1.8rem;border-radius:.8rem;font-size:1.4rem;font-family:'Segoe UI',sans-serif;
        display:flex;align-items:center;gap:.8rem;box-shadow:0 .6rem 2rem rgba(0,0,0,.2);
        z-index:9999;opacity:0;transform:translateY(-1rem);transition:all .3s ease;max-width:36rem;`;
    t.innerHTML = `<i class="bi ${icones[tipo]}"></i><span>${msg}</span>`;
    document.body.appendChild(t);
    requestAnimationFrame(() => { t.style.opacity = "1"; t.style.transform = "translateY(0)"; });
    setTimeout(() => { t.style.opacity = "0"; t.style.transform = "translateY(-1rem)"; setTimeout(() => t.remove(), 350); }, 3200);
}

function fmt(v) {
    return "R$ " + Number(v ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtData(d) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("pt-BR");
}

function getPillClass(status) {
    if (status === "PAGO") return "pill-pago";
    if (status === "VENCIDO") return "pill-vencido";
    return "pill-aberto";
}

function getPillLabel(status) {
    if (status === "PAGO") return "Pago";
    if (status === "VENCIDO") return "Vencido";
    return "Aberto";
}

// ──────────────────────────────────────────
// CARREGAR DADOS
// ──────────────────────────────────────────
async function carregarTudo() {
    console.log("[carregarTudo] iniciando...");
    try {
        [contasReceber, contasPagar, formasPagamento, categorias, clientes, fornecedores] = await Promise.all([
            apiGet("/Financeiro/ListarContasReceber"),
            apiGet("/Financeiro/ListarContasPagar"),
            apiGet("/Caixa/FormasPagamento"),
            apiGet("/Caixa/Categorias"),
            apiGet("/Cliente/Listar"),
            apiGet("/Fornecedor/Listar")
        ]);
        console.log("[carregarTudo] contasReceber:", contasReceber.length, "registros");
        atualizarKPIs();
        aplicarFiltroReceber();
        aplicarFiltroPagar();
        popularSelects();
        popularSelectsEdicao();
        console.log("[carregarTudo] concluído");
    } catch (err) {
        console.error("[carregarTudo] ERRO:", err.message);
        flexToast("Erro ao carregar dados: " + err.message, "erro");
    }
}

function popularSelects() {
    const selCliente = document.getElementById("nr-cliente");
    if (selCliente) {
        selCliente.innerHTML = '<option value="">Selecione...</option>' +
            clientes.filter(c => c.fAtivo).map(c =>
                `<option value="${c.idCliente}">${c.nome}</option>`).join("");
    }

    const selForn = document.getElementById("np-fornecedor");
    if (selForn) {
        selForn.innerHTML = '<option value="">Nenhum</option>' +
            fornecedores.filter(f => f.fAtivo !== false).map(f =>
                `<option value="${f.idFornecedor}">${f.nomeFantasia || f.razaoSocial}</option>`).join("");
    }

    ["rp-forma", "pc-forma"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = formasPagamento.map(f =>
            `<option value="${f.idFormaPagamento}">${f.nome}</option>`).join("");
    });

    const getTipo = c => c.Tipo ?? c.tipo ?? c.TipoCategoriaFinanceira ?? c.tipoCategoriaFinanceira;
    const catEntrada = categorias.filter(c => getTipo(c) == 1);
    const catSaida = categorias.filter(c => getTipo(c) == 2);

    const rpCat = document.getElementById("rp-categoria");
    if (rpCat) rpCat.innerHTML = catEntrada.map(c =>
        `<option value="${c.idCategoriaFinanceira}">${c.nome}</option>`).join("");

    const pcCat = document.getElementById("pc-categoria");
    if (pcCat) pcCat.innerHTML = catSaida.map(c =>
        `<option value="${c.idCategoriaFinanceira}">${c.nome}</option>`).join("");
}

function popularSelectsEdicao() {
    const erCliente = document.getElementById('er-cliente');
    if (erCliente) {
        erCliente.innerHTML = '<option value="">Selecione...</option>' +
            clientes.filter(c => c.fAtivo).map(c =>
                `<option value="${c.idCliente}">${c.nome}</option>`).join('');
    }
    const epForn = document.getElementById('ep-fornecedor');
    if (epForn) {
        epForn.innerHTML = '<option value="">Nenhum</option>' +
            fornecedores.filter(f => f.fAtivo !== false).map(f =>
                `<option value="${f.idFornecedor}">${f.nomeFantasia || f.razaoSocial}</option>`).join('');
    }
}

// ──────────────────────────────────────────
// KPIs
// ──────────────────────────────────────────
function atualizarKPIs() {
    const abertas = contasReceber.filter(c => c.statusAtual !== "PAGO");
    const vencidasR = contasReceber.filter(c => c.statusAtual === "VENCIDO");
    const abertoP = contasPagar.filter(c => c.statusAtual !== "PAGO");
    const vencidasP = contasPagar.filter(c => c.statusAtual === "VENCIDO");

    const totalReceber = abertas.reduce((s, c) => s + Math.max(0, c.valorTotal - c.valorPago), 0);
    const totalVencidoR = vencidasR.reduce((s, c) => s + Math.max(0, c.valorTotal - c.valorPago), 0);
    const totalPagar = abertoP.reduce((s, c) => s + Math.max(0, c.valorTotal - c.valorPago), 0);
    const totalVencidoP = vencidasP.reduce((s, c) => s + Math.max(0, c.valorTotal - c.valorPago), 0);

    document.getElementById("kpi-a-receber").textContent = fmt(totalReceber);
    document.getElementById("kpi-a-receber-sub").textContent = `${abertas.length} conta${abertas.length !== 1 ? "s" : ""} aberta${abertas.length !== 1 ? "s" : ""}`;
    document.getElementById("kpi-vencido-receber").textContent = fmt(totalVencidoR);
    document.getElementById("kpi-vencido-receber-sub").textContent = `${vencidasR.length} vencida${vencidasR.length !== 1 ? "s" : ""}`;
    document.getElementById("kpi-a-pagar").textContent = fmt(totalPagar);
    document.getElementById("kpi-a-pagar-sub").textContent = `${abertoP.length} conta${abertoP.length !== 1 ? "s" : ""} aberta${abertoP.length !== 1 ? "s" : ""}`;
    document.getElementById("kpi-vencido-pagar").textContent = fmt(totalVencidoP);
    document.getElementById("kpi-vencido-pagar-sub").textContent = `${vencidasP.length} vencida${vencidasP.length !== 1 ? "s" : ""}`;

    const badgeR = document.getElementById("badge-vencido-receber");
    const badgeP = document.getElementById("badge-vencido-pagar");
    if (badgeR) { badgeR.textContent = vencidasR.length; badgeR.classList.toggle("visivel", vencidasR.length > 0); }
    if (badgeP) { badgeP.textContent = vencidasP.length; badgeP.classList.toggle("visivel", vencidasP.length > 0); }
}

// ──────────────────────────────────────────
// ABAS
// ──────────────────────────────────────────
function mudarAba(aba) {
    document.getElementById("painel-receber").style.display = aba === "receber" ? "" : "none";
    document.getElementById("painel-pagar").style.display = aba === "pagar" ? "" : "none";
    document.getElementById("aba-btn-receber").classList.toggle("ativa", aba === "receber");
    document.getElementById("aba-btn-pagar").classList.toggle("ativa", aba === "pagar");
}

// ──────────────────────────────────────────
// FILTROS RECEBER
// ──────────────────────────────────────────
function setFiltroReceber(valor) {
    filtroReceber = valor;
    document.querySelectorAll("#painel-receber .btn-status-filtro").forEach(b =>
        b.classList.remove("sel-todos", "sel-aberto", "sel-vencido", "sel-pago"));
    document.getElementById(`fr-${valor}`)?.classList.add(`sel-${valor}`);
    pagReceberAtual = 1;
    aplicarFiltroReceber();
}

function filtrarReceber() {
    filtroReceberTexto = document.getElementById("busca-receber")?.value ?? "";
    pagReceberAtual = 1;
    aplicarFiltroReceber();
}

function setFiltroPeriodo(tipo, campo, valor) {
    if (tipo === 'receber') {
        if (campo === 'inicio') filtroVencimentoInicioR = valor || null;
        else filtroVencimentoFimR = valor || null;
        pagReceberAtual = 1;
        aplicarFiltroReceber();
    } else {
        if (campo === 'inicio') filtroVencimentoInicioP = valor || null;
        else filtroVencimentoFimP = valor || null;
        pagPagarAtual = 1;
        aplicarFiltroPagar();
    }
}

function aplicarFiltroReceber() {
    const termo = filtroReceberTexto.toLowerCase();
    contasReceberFiltradas = contasReceber.filter(c => {
        if (filtroReceber !== 'todos' && (c.statusAtual ?? 'ABERTO').toLowerCase() !== filtroReceber) return false;
        if (termo && !(c.nomeCliente ?? '').toLowerCase().includes(termo) &&
            !(c.descricao ?? '').toLowerCase().includes(termo)) return false;
        if (filtroVencimentoInicioR && new Date(c.dthVencimento) < new Date(filtroVencimentoInicioR)) return false;
        if (filtroVencimentoFimR && new Date(c.dthVencimento) > new Date(filtroVencimentoFimR + 'T23:59:59')) return false;
        return true;
    });
    contasReceberFiltradas = ordenar(contasReceberFiltradas, ordemReceber);
    renderizarReceber();
}

// ──────────────────────────────────────────
// FILTROS PAGAR
// ──────────────────────────────────────────
function setFiltroPagar(valor) {
    filtroPagar = valor;
    document.querySelectorAll("#painel-pagar .btn-status-filtro").forEach(b =>
        b.classList.remove("sel-todos", "sel-aberto", "sel-vencido", "sel-pago"));
    document.getElementById(`fp-${valor}`)?.classList.add(`sel-${valor}`);
    pagPagarAtual = 1;
    aplicarFiltroPagar();
}

function filtrarPagar() {
    filtroPagarTexto = document.getElementById("busca-pagar")?.value ?? "";
    pagPagarAtual = 1;
    aplicarFiltroPagar();
}

function aplicarFiltroPagar() {
    const termo = filtroPagarTexto.toLowerCase();
    contasPagarFiltradas = contasPagar.filter(c => {
        if (filtroPagar !== 'todos' && (c.statusAtual ?? 'ABERTO').toLowerCase() !== filtroPagar) return false;
        if (termo && !(c.nomeFornecedor ?? '').toLowerCase().includes(termo) &&
            !(c.descricao ?? '').toLowerCase().includes(termo)) return false;
        if (filtroVencimentoInicioP && new Date(c.dthVencimento) < new Date(filtroVencimentoInicioP)) return false;
        if (filtroVencimentoFimP && new Date(c.dthVencimento) > new Date(filtroVencimentoFimP + 'T23:59:59')) return false;
        return true;
    });
    contasPagarFiltradas = ordenar(contasPagarFiltradas, ordemPagar);
    renderizarPagar();
}

// ──────────────────────────────────────────
// ORDENAÇÃO
// ──────────────────────────────────────────
function ordenar(arr, ordem) {
    return [...arr].sort((a, b) => {
        let va = a[ordem.campo], vb = b[ordem.campo];
        if (typeof va === 'string') { va = va.toLowerCase(); vb = (vb ?? '').toLowerCase(); }
        if (va === null || va === undefined) return 1;
        if (vb === null || vb === undefined) return -1;
        return ordem.asc ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
    });
}

function setOrdem(tipo, campo) {
    if (tipo === 'receber') {
        ordemReceber.asc = ordemReceber.campo === campo ? !ordemReceber.asc : true;
        ordemReceber.campo = campo;
        aplicarFiltroReceber();
    } else {
        ordemPagar.asc = ordemPagar.campo === campo ? !ordemPagar.asc : true;
        ordemPagar.campo = campo;
        aplicarFiltroPagar();
    }
}

// ──────────────────────────────────────────
// PAGINAÇÃO
// ──────────────────────────────────────────
function renderizarPaginacao(containerId, atual, total, onClick) {
    const el = document.getElementById(containerId);
    if (!el) return;
    if (total <= 1) { el.innerHTML = ""; return; }
    let html = `<button class="btn-pagina" ${atual === 1 ? "disabled" : ""} onclick="(${onClick})(${atual - 1})">‹</button>`;
    for (let i = 1; i <= total; i++) {
        if (i === 1 || i === total || Math.abs(i - atual) <= 1)
            html += `<button class="btn-pagina ${i === atual ? "ativo" : ""}" onclick="(${onClick})(${i})">${i}</button>`;
        else if (Math.abs(i - atual) === 2)
            html += `<span style="padding:0 0.4rem;color:#9ca3af">…</span>`;
    }
    html += `<button class="btn-pagina" ${atual === total ? "disabled" : ""} onclick="(${onClick})(${atual + 1})">›</button>`;
    el.innerHTML = html;
}

// ──────────────────────────────────────────
// RENDER RECEBER
// ──────────────────────────────────────────
function renderizarReceber() {
    const tbody = document.querySelector('#tabela-receber tbody');
    if (!tbody) return;
    const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
    const total = contasReceberFiltradas.length;
    const inicio = (pagReceberAtual - 1) * PAG_RECEBER;
    const pagina = contasReceberFiltradas.slice(inicio, inicio + PAG_RECEBER);

    if (!pagina.length) {
        tbody.innerHTML = `<tr><td colspan="8" class="empty-state">Nenhuma conta encontrada.</td></tr>`;
        document.getElementById('pag-info-receber').textContent = '';
        document.getElementById('pag-ctrl-receber').innerHTML = '';
        return;
    }

    tbody.innerHTML = pagina.map(c => {
        const status = c.statusAtual ?? 'ABERTO';
        const restante = Math.max(0, c.valorTotal - c.valorPago);
        const isPago = status === 'PAGO';
        const venc = new Date(c.dthVencimento); venc.setHours(0, 0, 0, 0);
        const vencida = !isPago && venc < hoje;
        const rowStyle = vencida ? 'style="background:#fef2f2"' : '';
        const tooltip = `title="Pago: ${fmt(c.valorPago)} / Total: ${fmt(c.valorTotal)}"`;

        return `<tr ${rowStyle}>
            <td class="area-acoes">
                ${!isPago ? `<button class="btn-acao btn-pagar-icon" title="Receber" onclick="abrirModalReceberPagamento(${c.idContaReceber}, '${(c.nomeCliente ?? '').replace(/'/g, "&#39;")}', ${restante})">
                    <i class="bi bi-currency-dollar"></i>
                </button>` : ''}
                <button class="btn-acao btn-editar" title="Editar" onclick="abrirModalEditarReceber(${c.idContaReceber})">
                    <i class="bi bi-pencil-fill"></i>
                </button>
                <button class="btn-acao" style="color:#9ca3af" title="Histórico" onclick="abrirHistoricoReceber(${c.idContaReceber})">
                    <i class="bi bi-clock-history"></i>
                </button>
                ${!isPago ? `<button class="btn-acao" style="color:#ef4444" title="Excluir" onclick="excluirContaReceber(${c.idContaReceber})">
                    <i class="bi bi-trash3-fill"></i>
                </button>` : ''}
                ${!isPago ? `<button class="btn-acao btn-calendar-icon" title="Alterar vencimento" onclick="abrirModalVencReceber(${c.idContaReceber}, '${c.dthVencimento?.substring(0, 10)}')">
                    <i class="bi bi-calendar-event"></i>
                </button>` : ''}
            </td>
            <td><span class="status-pill ${getPillClass(status)}">${getPillLabel(status)}</span>
                ${vencida ? '<span style="font-size:1rem;color:#dc2626;margin-left:.4rem">●</span>' : ''}
            </td>
            <td>${c.nomeCliente || '—'}</td>
            <td title="${c.descricao || ''}">${c.descricao || '—'}</td>
            <td>${fmtData(c.dthVencimento)}</td>
            <td>${fmt(c.valorTotal)}</td>
            <td>${fmt(c.valorPago)}</td>
            <td><strong ${tooltip} style="cursor:help">${fmt(restante)}</strong></td>
        </tr>`;
    }).join('');

    document.getElementById('pag-info-receber').textContent =
        `Exibindo ${inicio + 1}–${Math.min(inicio + PAG_RECEBER, total)} de ${total}`;
    renderizarPaginacao('pag-ctrl-receber', pagReceberAtual,
        Math.ceil(total / PAG_RECEBER), p => { pagReceberAtual = p; renderizarReceber(); });
}

// ──────────────────────────────────────────
// RENDER PAGAR
// ──────────────────────────────────────────
function renderizarPagar() {
    const tbody = document.querySelector('#tabela-pagar tbody');
    if (!tbody) return;
    const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
    const total = contasPagarFiltradas.length;
    const inicio = (pagPagarAtual - 1) * PAG_PAGAR;
    const pagina = contasPagarFiltradas.slice(inicio, inicio + PAG_PAGAR);

    if (!pagina.length) {
        tbody.innerHTML = `<tr><td colspan="8" class="empty-state">Nenhuma conta encontrada.</td></tr>`;
        document.getElementById('pag-info-pagar').textContent = '';
        document.getElementById('pag-ctrl-pagar').innerHTML = '';
        return;
    }

    tbody.innerHTML = pagina.map(c => {
        const status = c.statusAtual ?? 'ABERTO';
        const restante = Math.max(0, c.valorTotal - c.valorPago);
        const isPago = status === 'PAGO';
        const venc = new Date(c.dthVencimento); venc.setHours(0, 0, 0, 0);
        const vencida = !isPago && venc < hoje;
        const rowStyle = vencida ? 'style="background:#fef2f2"' : '';
        const tooltip = `title="Pago: ${fmt(c.valorPago)} / Total: ${fmt(c.valorTotal)}"`;

        return `<tr ${rowStyle}>
            <td class="area-acoes">
                ${!isPago ? `<button class="btn-acao btn-pagar-icon" title="Pagar" onclick="abrirModalPagarConta(${c.idContaPagar}, '${(c.nomeFornecedor ?? 'Sem fornecedor').replace(/'/g, "&#39;")}', ${restante})">
                    <i class="bi bi-cash-coin"></i>
                </button>` : ''}
                <button class="btn-acao btn-editar" title="Editar" onclick="abrirModalEditarPagar(${c.idContaPagar})">
                    <i class="bi bi-pencil-fill"></i>
                </button>
                <button class="btn-acao" style="color:#9ca3af" title="Histórico" onclick="abrirHistoricoPagar(${c.idContaPagar})">
                    <i class="bi bi-clock-history"></i>
                </button>
                ${!isPago ? `<button class="btn-acao" style="color:#ef4444" title="Excluir" onclick="excluirContaPagar(${c.idContaPagar})">
                    <i class="bi bi-trash3-fill"></i>
                </button>` : ''}
                ${!isPago ? `<button class="btn-acao btn-calendar-icon" title="Alterar vencimento" onclick="abrirModalVencPagar(${c.idContaPagar}, '${c.dthVencimento?.substring(0, 10)}')">
                    <i class="bi bi-calendar-event"></i>
                </button>` : ''}
            </td>
            <td><span class="status-pill ${getPillClass(status)}">${getPillLabel(status)}</span>
                ${vencida ? '<span style="font-size:1rem;color:#dc2626;margin-left:.4rem">●</span>' : ''}
            </td>
            <td>${c.nomeFornecedor || '—'}</td>
            <td title="${c.descricao || ''}">${c.descricao || '—'}</td>
            <td>${fmtData(c.dthVencimento)}</td>
            <td>${fmt(c.valorTotal)}</td>
            <td>${fmt(c.valorPago)}</td>
            <td><strong ${tooltip} style="cursor:help">${fmt(restante)}</strong></td>
        </tr>`;
    }).join('');

    document.getElementById('pag-info-pagar').textContent =
        `Exibindo ${inicio + 1}–${Math.min(inicio + PAG_PAGAR, total)} de ${total}`;
    renderizarPaginacao('pag-ctrl-pagar', pagPagarAtual,
        Math.ceil(total / PAG_PAGAR), p => { pagPagarAtual = p; renderizarPagar(); });
}

// ──────────────────────────────────────────
// MODAL: NOVA CONTA A RECEBER
// ──────────────────────────────────────────
function abrirModalNovaReceber() {
    document.getElementById("nr-cliente").value = "";
    document.getElementById("nr-descricao").value = "";
    document.getElementById("nr-valor").value = "";
    document.getElementById("nr-vencimento").value = "";
    document.getElementById("modal-nova-receber").classList.add("open");
}
function fecharModalNovaReceber() { document.getElementById("modal-nova-receber").classList.remove("open"); }

async function salvarNovaReceber() {
    const clienteId = Number(document.getElementById("nr-cliente").value);
    const descricao = document.getElementById("nr-descricao").value.trim() || null;
    const valor = Number(document.getElementById("nr-valor").value);
    const vencimento = document.getElementById("nr-vencimento").value;
    if (!clienteId) { flexToast("Selecione um cliente.", "aviso"); return; }
    if (!valor || valor <= 0) { flexToast("Informe o valor.", "aviso"); return; }
    if (!vencimento) { flexToast("Informe o vencimento.", "aviso"); return; }
    try {
        await apiPost("/Financeiro/CriarContaReceber", { ClienteId: clienteId, Descricao: descricao, ValorTotal: valor, DthVencimento: vencimento });
        fecharModalNovaReceber();
        await carregarTudo();
        flexToast("Conta a receber criada!", "sucesso");
    } catch (err) { flexToast("Erro: " + err.message, "erro"); }
}

// ──────────────────────────────────────────
// MODAL: RECEBER PAGAMENTO
// ──────────────────────────────────────────
function abrirModalReceberPagamento(id, cliente, restante) {
    document.getElementById("rp-id").value = id;
    document.getElementById("rp-restante-raw").value = restante;
    document.getElementById("rp-cliente").textContent = cliente;
    document.getElementById("rp-restante").textContent = fmt(restante);
    document.getElementById("rp-valor").value = restante.toFixed(2);
    document.getElementById("rp-valor").max = restante;
    document.getElementById("modal-receber-pagamento").classList.add("open");
}
function fecharModalReceberPagamento() { document.getElementById("modal-receber-pagamento").classList.remove("open"); }

async function confirmarReceber() {
    const id = Number(document.getElementById("rp-id").value);
    const valor = Number(document.getElementById("rp-valor").value);
    const forma = Number(document.getElementById("rp-forma").value);
    const cat = Number(document.getElementById("rp-categoria").value);
    const restante = Number(document.getElementById("rp-restante-raw").value);
    if (!valor || valor <= 0) { flexToast("Informe o valor.", "aviso"); return; }
    if (valor > restante + 0.01) {
        flexToast(`Valor não pode exceder o restante (${fmt(restante)}).`, "aviso");
        return;
    }
    try {
        await apiPost("/Financeiro/ReceberConta", { IdContaReceber: id, ValorPago: valor, IdFormaPagamento: forma, IdCategoriaFinanceira: cat });
        fecharModalReceberPagamento();
        await carregarTudo();
        flexToast("Recebimento registrado!", "sucesso");
    } catch (err) { flexToast("Erro: " + err.message, "erro"); }
}

// ──────────────────────────────────────────
// MODAL: ALTERAR VENCIMENTO RECEBER
// ──────────────────────────────────────────
function abrirModalVencReceber(id, data) {
    document.getElementById("vr-id").value = id;
    document.getElementById("vr-data").value = data || "";
    document.getElementById("modal-venc-receber").classList.add("open");
}
function fecharModalVencReceber() { document.getElementById("modal-venc-receber").classList.remove("open"); }

async function confirmarVencReceber() {
    const id = Number(document.getElementById("vr-id").value);
    const data = document.getElementById("vr-data").value;
    if (!data) { flexToast("Informe a data.", "aviso"); return; }
    try {
        await apiPost("/Financeiro/AlterarVencimentoReceber", { IdContaReceber: id, NovaData: data });
        fecharModalVencReceber();
        await carregarTudo();
        flexToast("Vencimento alterado!", "sucesso");
    } catch (err) { flexToast("Erro: " + err.message, "erro"); }
}

// ──────────────────────────────────────────
// EXCLUIR RECEBER
// ──────────────────────────────────────────
function excluirContaReceber(id) {
    document.getElementById("excluir-r-id").value = id;
    document.getElementById("modal-excluir-receber").classList.add("open");
}
function fecharModalExcluirReceber() { document.getElementById("modal-excluir-receber").classList.remove("open"); }

async function confirmarExcluirReceber() {
    const id = Number(document.getElementById("excluir-r-id").value);
    const btn = document.getElementById("btn-confirmar-excluir-r");
    btn.disabled = true;
    console.log("[excluir receber] id:", id);
    try {
        const res = await apiPost("/Financeiro/ExcluirContaReceber", { Id: id });
        console.log("[excluir receber] status:", res.status);
        fecharModalExcluirReceber();
        console.log("[excluir receber] modal fechado, recarregando...");
        await carregarTudo();
        console.log("[excluir receber] recarregado, contasReceber:", contasReceber.length);
        flexToast("Conta excluída.", "sucesso");
    } catch (err) {
        console.error("[excluir receber] erro:", err.message);
        flexToast("Erro ao excluir: " + err.message, "erro");
    } finally {
        btn.disabled = false;
    }
}

// ──────────────────────────────────────────
// HISTÓRICO RECEBER
// ──────────────────────────────────────────
async function abrirHistoricoReceber(id) {
    const c = contasReceber.find(x => x.idContaReceber === id);
    document.getElementById('hist-titulo').textContent = c?.descricao || 'Histórico de Pagamentos';
    document.getElementById('hist-corpo').innerHTML = '<div style="text-align:center;padding:2rem;color:#9ca3af">Carregando...</div>';
    document.getElementById('modal-historico').classList.add('open');
    try {
        const data = await apiGet(`/Financeiro/HistoricoReceber?idContaReceber=${id}`);
        if (!data.length) {
            document.getElementById('hist-corpo').innerHTML =
                '<div style="text-align:center;padding:2rem;color:#9ca3af">Nenhum pagamento registrado.</div>';
            return;
        }
        document.getElementById('hist-corpo').innerHTML = `
            <table style="width:100%;border-collapse:collapse;font-size:1.3rem">
                <thead><tr style="background:#f7f9fc">
                    <th style="text-align:left;padding:1rem;border-bottom:2px solid #eaecf0">Data</th>
                    <th style="text-align:right;padding:1rem;border-bottom:2px solid #eaecf0">Valor Pago</th>
                </tr></thead>
                <tbody>${data.map(p => `
                    <tr style="border-bottom:1px solid #f0f2f5">
                        <td style="padding:1rem">${fmtData(p.dthPagamento)}</td>
                        <td style="padding:1rem;text-align:right;font-weight:700;color:#15803d">${fmt(p.valorPago)}</td>
                    </tr>`).join('')}
                    <tr style="background:#f8fafc;font-weight:700">
                        <td style="padding:1rem">Total pago</td>
                        <td style="padding:1rem;text-align:right;color:#15803d">${fmt(data.reduce((a, p) => a + p.valorPago, 0))}</td>
                    </tr>
                </tbody>
            </table>`;
    } catch (err) {
        console.error("[historico receber] erro:", err.message);
        document.getElementById('hist-corpo').innerHTML = '<div style="color:#dc2626;padding:2rem">Erro ao carregar.</div>';
    }
}

// ──────────────────────────────────────────
// MODAL: EDITAR RECEBER
// ──────────────────────────────────────────
function abrirModalEditarReceber(id) {
    const c = contasReceber.find(x => x.idContaReceber === id);
    if (!c) return;
    document.getElementById('er-id').value = id;
    document.getElementById('er-cliente').value = c.cliente_id || c.clienteId || '';
    document.getElementById('er-descricao').value = c.descricao || '';
    document.getElementById('er-valor').value = c.valorTotal;
    document.getElementById('er-vencimento').value = c.dthVencimento?.substring(0, 10) || '';
    document.getElementById('modal-editar-receber').classList.add('open');
}
function fecharModalEditarReceber() { document.getElementById('modal-editar-receber').classList.remove('open'); }

async function salvarEditarReceber() {
    const id = Number(document.getElementById('er-id').value);
    const payload = {
        IdContaReceber: id,
        ClienteId: Number(document.getElementById('er-cliente').value),
        Descricao: document.getElementById('er-descricao').value || null,
        ValorTotal: Number(document.getElementById('er-valor').value),
        DthVencimento: document.getElementById('er-vencimento').value
    };
    try {
        await apiPost('/Financeiro/EditarContaReceber', payload);
        fecharModalEditarReceber();
        await carregarTudo();
        flexToast('Conta atualizada!', 'sucesso');
    } catch (err) { flexToast('Erro: ' + err.message, 'erro'); }
}

// ──────────────────────────────────────────
// MODAL: NOVA CONTA A PAGAR
// ──────────────────────────────────────────
function abrirModalNovaPagar() {
    document.getElementById("np-fornecedor").value = "";
    document.getElementById("np-descricao").value = "";
    document.getElementById("np-valor").value = "";
    document.getElementById("np-vencimento").value = "";
    document.getElementById("modal-nova-pagar").classList.add("open");
}
function fecharModalNovaPagar() { document.getElementById("modal-nova-pagar").classList.remove("open"); }

async function salvarNovaPagar() {
    const fornecedorId = document.getElementById("np-fornecedor").value || null;
    const descricao = document.getElementById("np-descricao").value.trim() || null;
    const valor = Number(document.getElementById("np-valor").value);
    const vencimento = document.getElementById("np-vencimento").value;
    if (!descricao) { flexToast("Informe a descrição.", "aviso"); return; }
    if (!valor || valor <= 0) { flexToast("Informe o valor.", "aviso"); return; }
    if (!vencimento) { flexToast("Informe o vencimento.", "aviso"); return; }
    try {
        await apiPost("/Financeiro/CriarContaPagar", { FornecedorId: fornecedorId ? Number(fornecedorId) : null, Descricao: descricao, ValorTotal: valor, DthVencimento: vencimento });
        fecharModalNovaPagar();
        await carregarTudo();
        flexToast("Conta a pagar criada!", "sucesso");
    } catch (err) { flexToast("Erro: " + err.message, "erro"); }
}

// ──────────────────────────────────────────
// MODAL: PAGAR CONTA
// ──────────────────────────────────────────
function abrirModalPagarConta(id, fornecedor, restante) {
    document.getElementById("pc-id").value = id;
    document.getElementById("pc-restante-raw").value = restante;
    document.getElementById("pc-fornecedor").textContent = fornecedor;
    document.getElementById("pc-restante").textContent = fmt(restante);
    document.getElementById("pc-valor").value = restante.toFixed(2);
    document.getElementById("pc-valor").max = restante;
    document.getElementById("modal-pagar-conta").classList.add("open");
}
function fecharModalPagarConta() { document.getElementById("modal-pagar-conta").classList.remove("open"); }

async function confirmarPagar() {
    const id = Number(document.getElementById("pc-id").value);
    const valor = Number(document.getElementById("pc-valor").value);
    const forma = Number(document.getElementById("pc-forma").value);
    const cat = Number(document.getElementById("pc-categoria").value);
    const restante = Number(document.getElementById("pc-restante-raw").value);
    if (!valor || valor <= 0) { flexToast("Informe o valor.", "aviso"); return; }
    if (valor > restante + 0.01) {
        flexToast(`Valor não pode exceder o restante (${fmt(restante)}).`, "aviso");
        return;
    }
    try {
        await apiPost("/Financeiro/PagarConta", { IdContaPagar: id, ValorPago: valor, IdFormaPagamento: forma, IdCategoriaFinanceira: cat });
        fecharModalPagarConta();
        await carregarTudo();
        flexToast("Pagamento registrado!", "sucesso");
    } catch (err) { flexToast("Erro: " + err.message, "erro"); }
}

// ──────────────────────────────────────────
// MODAL: ALTERAR VENCIMENTO PAGAR
// ──────────────────────────────────────────
function abrirModalVencPagar(id, data) {
    document.getElementById("vp-id").value = id;
    document.getElementById("vp-data").value = data || "";
    document.getElementById("modal-venc-pagar").classList.add("open");
}
function fecharModalVencPagar() { document.getElementById("modal-venc-pagar").classList.remove("open"); }

async function confirmarVencPagar() {
    const id = Number(document.getElementById("vp-id").value);
    const data = document.getElementById("vp-data").value;
    if (!data) { flexToast("Informe a data.", "aviso"); return; }
    try {
        await apiPost("/Financeiro/AlterarVencimentoPagar", { IdContaPagar: id, NovaData: data });
        fecharModalVencPagar();
        await carregarTudo();
        flexToast("Vencimento alterado!", "sucesso");
    } catch (err) { flexToast("Erro: " + err.message, "erro"); }
}

// ──────────────────────────────────────────
// EXCLUIR PAGAR
// ──────────────────────────────────────────
function excluirContaPagar(id) {
    document.getElementById("excluir-p-id").value = id;
    document.getElementById("modal-excluir-pagar").classList.add("open");
}
function fecharModalExcluirPagar() { document.getElementById("modal-excluir-pagar").classList.remove("open"); }

async function confirmarExcluirPagar() {
    const id = Number(document.getElementById("excluir-p-id").value);
    const btn = document.getElementById("btn-confirmar-excluir-p");
    btn.disabled = true;
    console.log("[excluir pagar] id:", id);
    try {
        const res = await apiPost("/Financeiro/ExcluirContaPagar", { Id: id });
        console.log("[excluir pagar] status:", res.status);
        fecharModalExcluirPagar();
        console.log("[excluir pagar] modal fechado, recarregando...");
        await carregarTudo();
        console.log("[excluir pagar] recarregado, contasPagar:", contasPagar.length);
        flexToast("Conta excluída.", "sucesso");
    } catch (err) {
        console.error("[excluir pagar] erro:", err.message);
        flexToast("Erro ao excluir: " + err.message, "erro");
    } finally {
        btn.disabled = false;
    }
}

// ──────────────────────────────────────────
// MODAL: EDITAR PAGAR
// ──────────────────────────────────────────
function abrirModalEditarPagar(id) {
    const c = contasPagar.find(x => x.idContaPagar === id);
    if (!c) return;
    document.getElementById('ep-id').value = id;
    document.getElementById('ep-fornecedor').value = c.fornecedor_id || c.fornecedorId || '';
    document.getElementById('ep-descricao').value = c.descricao || '';
    document.getElementById('ep-valor').value = c.valorTotal;
    document.getElementById('ep-vencimento').value = c.dthVencimento?.substring(0, 10) || '';
    document.getElementById('modal-editar-pagar').classList.add('open');
}
function fecharModalEditarPagar() { document.getElementById('modal-editar-pagar').classList.remove('open'); }

async function salvarEditarPagar() {
    const id = Number(document.getElementById('ep-id').value);
    const payload = {
        IdContaPagar: id,
        FornecedorId: Number(document.getElementById('ep-fornecedor').value) || null,
        Descricao: document.getElementById('ep-descricao').value || null,
        ValorTotal: Number(document.getElementById('ep-valor').value),
        DthVencimento: document.getElementById('ep-vencimento').value
    };
    try {
        await apiPost('/Financeiro/EditarContaPagar', payload);
        fecharModalEditarPagar();
        await carregarTudo();
        flexToast('Conta atualizada!', 'sucesso');
    } catch (err) { flexToast('Erro: ' + err.message, 'erro'); }
}

// ──────────────────────────────────────────
// HISTÓRICO PAGAR
// ──────────────────────────────────────────
async function abrirHistoricoPagar(id) {
    const c = contasPagar.find(x => x.idContaPagar === id);
    document.getElementById('hist-titulo').textContent = c?.descricao || 'Histórico de Pagamentos';
    document.getElementById('hist-corpo').innerHTML = '<div style="text-align:center;padding:2rem;color:#9ca3af">Carregando...</div>';
    document.getElementById('modal-historico').classList.add('open');
    try {
        const data = await apiGet(`/Financeiro/HistoricoPagar?idContaPagar=${id}`);
        if (!data.length) {
            document.getElementById('hist-corpo').innerHTML =
                '<div style="text-align:center;padding:2rem;color:#9ca3af">Nenhum pagamento registrado.</div>';
            return;
        }
        document.getElementById('hist-corpo').innerHTML = `
            <table style="width:100%;border-collapse:collapse;font-size:1.3rem">
                <thead><tr style="background:#f7f9fc">
                    <th style="text-align:left;padding:1rem;border-bottom:2px solid #eaecf0">Data</th>
                    <th style="text-align:right;padding:1rem;border-bottom:2px solid #eaecf0">Valor Pago</th>
                </tr></thead>
                <tbody>${data.map(p => `
                    <tr style="border-bottom:1px solid #f0f2f5">
                        <td style="padding:1rem">${fmtData(p.dthPagamento)}</td>
                        <td style="padding:1rem;text-align:right;font-weight:700;color:#dc2626">${fmt(p.valorPago)}</td>
                    </tr>`).join('')}
                    <tr style="background:#f8fafc;font-weight:700">
                        <td style="padding:1rem">Total pago</td>
                        <td style="padding:1rem;text-align:right;color:#dc2626">${fmt(data.reduce((a, p) => a + p.valorPago, 0))}</td>
                    </tr>
                </tbody>
            </table>`;
    } catch (err) {
        console.error("[historico pagar] erro:", err.message);
        document.getElementById('hist-corpo').innerHTML = '<div style="color:#dc2626;padding:2rem">Erro ao carregar.</div>';
    }
}

function fecharHistorico() { document.getElementById('modal-historico').classList.remove('open'); }

function exportar(tipo, formato) {
    const aba = document.getElementById('painel-receber').style.display !== 'none' ? 'receber' : 'pagar';
    window.open(`/Financeiro/Exportar${formato === 'excel' ? 'Excel' : 'Pdf'}?tipo=${aba}`, '_blank');
}

// ──────────────────────────────────────────
// INIT
// ──────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
    [
        ["modal-nova-receber", fecharModalNovaReceber],
        ["modal-receber-pagamento", fecharModalReceberPagamento],
        ["modal-venc-receber", fecharModalVencReceber],
        ["modal-editar-receber", fecharModalEditarReceber],
        ["modal-excluir-receber", fecharModalExcluirReceber],
        ["modal-nova-pagar", fecharModalNovaPagar],
        ["modal-pagar-conta", fecharModalPagarConta],
        ["modal-venc-pagar", fecharModalVencPagar],
        ["modal-editar-pagar", fecharModalEditarPagar],
        ["modal-excluir-pagar", fecharModalExcluirPagar],
        ["modal-historico", fecharHistorico],
    ].forEach(([id, fn]) => {
        document.getElementById(id)?.addEventListener("click", function (e) {
            if (e.target === this) fn();
        });
    });

    document.getElementById("fr-todos")?.classList.add("sel-todos");
    document.getElementById("fp-todos")?.classList.add("sel-todos");
    carregarTudo();
});