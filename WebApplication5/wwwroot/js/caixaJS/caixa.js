// ===== CAIXA.JS — FlexGestor novo módulo de caixa =====

const ITENS_POR_PAGINA = 15;
let paginaAtual = 1;
let abaAtiva = "lancamentos";

let caixaAtual = null;
let lancamentos = [];
let historicoList = [];
let formasPagamento = [];
let categorias = [];
let contasReceber = [];
let clientesCache = [];
let produtosCache = [];

let tipoLancamentoAtual = "VENDA";
let _vendaRapidaItens = [];
let _clienteSelecionadoVenda = null;

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
    return res.json().catch(() => null);
}

// ──────────────────────────────────────────
// FORMATTERS
// ──────────────────────────────────────────
function fmtMoeda(v) {
    return `R$ ${Number(v || 0).toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
}
function fmtDataHora(s) {
    if (!s) return "—";
    const local = s.endsWith("Z") ? s.slice(0, -1) : s;
    return new Date(local).toLocaleString("pt-BR", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit"
    });
}
function fmtData(s) {
    if (!s) return "—";
    return new Date(s).toLocaleDateString("pt-BR");
}

// ──────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────
function isEntrada(l) {
    return Number(l.tipoCategoria) === 1;
}

function calcularEntradas() {
    return lancamentos.filter(l => isEntrada(l)).reduce((a, l) => a + Number(l.valor), 0);
}

function calcularSaidas() {
    return lancamentos.filter(l => !isEntrada(l)).reduce((a, l) => a + Number(l.valor), 0);
}

function calcularSaldo() {
    if (!caixaAtual) return 0;
    return Number(caixaAtual.saldoInicial) + calcularEntradas() - calcularSaidas();
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
    setTimeout(() => {
        t.style.opacity = "0"; t.style.transform = "translateY(-1rem)";
        setTimeout(() => t.remove(), 350);
    }, 3200);
}

// ──────────────────────────────────────────
// INICIALIZAR
// ──────────────────────────────────────────
async function inicializar() {
    try {
        const [statusData, histData, fpData, catData] = await Promise.all([
            apiGet("/Caixa/Status"),
            apiGet("/Caixa/Historico"),
            apiGet("/Caixa/FormasPagamento"),
            apiGet("/Caixa/Categorias")
        ]);

        caixaAtual = statusData.caixa;
        historicoList = histData;
        formasPagamento = fpData;
        categorias = catData;

        lancamentos = caixaAtual ? await apiGet("/Caixa/Lancamentos") : [];
        contasReceber = await apiGet("/Caixa/ContasReceber").catch(() => []);

        atualizarPainel();
        atualizarBreakdown();
    } catch (err) {
        console.error("Erro ao inicializar caixa:", err);
        flexToast("Erro ao carregar dados do caixa.", "erro");
    }
}

// ──────────────────────────────────────────
// PAINEL PRINCIPAL
// ──────────────────────────────────────────
function atualizarPainel() {
    const aberto = caixaAtual !== null;
    const saldo = calcularSaldo();
    const entradas = aberto ? calcularEntradas() : 0;
    const saidas = aberto ? calcularSaidas() : 0;
    const troco = aberto ? Number(caixaAtual.saldoDinheiro || 0) : 0;

    // Badge status
    const badge = document.getElementById("caixa-status-badge");
    badge.className = `caixa-status-badge ${aberto ? "aberto" : "fechado"}`;
    badge.innerHTML = `<i class="bi bi-${aberto ? "unlock-fill" : "lock-fill"}"></i> ${aberto ? "Aberto" : "Fechado"}`;

    // Operador e horário
    document.getElementById("caixa-operador").textContent =
        aberto ? (caixaAtual.nomeOperador || "—") : "—";
    document.getElementById("caixa-abertura").textContent =
        aberto ? fmtDataHora(caixaAtual.dthAbertura) : "—";

    // Cards de valores
    const elSaldo = document.getElementById("caixa-saldo-atual");
    elSaldo.textContent = fmtMoeda(saldo);
    elSaldo.className = `caixa-card-valor ${saldo >= 0 ? "verde" : "vermelho"}`;

    document.getElementById("caixa-entradas").textContent = fmtMoeda(entradas);
    document.getElementById("caixa-saidas").textContent = fmtMoeda(saidas);
    document.getElementById("caixa-troco").textContent = fmtMoeda(troco);

    // Botões de ação
    document.getElementById("btn-abrir").style.display = aberto ? "none" : "flex";
    document.getElementById("btn-fechar").style.display = aberto ? "flex" : "none";

    const botoesAcao = document.querySelectorAll(".btn-acao-caixa");
    botoesAcao.forEach(b => {
        b.disabled = !aberto;
        b.style.opacity = aberto ? "1" : "0.4";
    });

    // Badge contas a receber vencidas
    const vencidas = contasReceber.filter(c => c.statusAtual === "VENCIDO").length;
    const badgeCR = document.getElementById("badge-contas-vencidas");
    if (badgeCR) {
        badgeCR.textContent = vencidas;
        badgeCR.style.display = vencidas > 0 ? "inline-flex" : "none";
    }

    renderizarAba();
}

async function atualizarBreakdown() {
    if (!caixaAtual) {
        document.getElementById("breakdown-lista").innerHTML =
            `<div class="breakdown-empty">Abra o caixa para ver o detalhamento.</div>`;
        return;
    }
    try {
        const data = await apiGet("/Caixa/Breakdown");
        const lista = document.getElementById("breakdown-lista");
        if (!data.length) {
            lista.innerHTML = `<div class="breakdown-empty">Nenhum lançamento ainda.</div>`;
            return;
        }
        lista.innerHTML = data.map(b => `
            <div class="breakdown-item">
                <span class="breakdown-nome">${b.nomeFormaPagamento}</span>
                <div class="breakdown-valores">
                    <span class="breakdown-entrada">+${fmtMoeda(b.totalEntradas)}</span>
                    <span class="breakdown-saida">-${fmtMoeda(b.totalSaidas)}</span>
                    <span class="breakdown-liquido ${b.saldoLiquido >= 0 ? "verde" : "vermelho"}">
                        ${fmtMoeda(b.saldoLiquido)}
                    </span>
                </div>
            </div>`).join("");
    } catch (err) {
        console.warn("Erro ao carregar breakdown:", err);
    }
}

// ──────────────────────────────────────────
// ABAS
// ──────────────────────────────────────────
function mudarAba(aba) {
    abaAtiva = aba;
    paginaAtual = 1;
    document.querySelectorAll(".aba-btn").forEach(b => b.classList.remove("ativa"));
    document.getElementById(`aba-${aba}`)?.classList.add("ativa");

    document.getElementById("conteudo-lancamentos").style.display = aba === "lancamentos" ? "" : "none";
    document.getElementById("conteudo-historico").style.display = aba === "historico" ? "" : "none";
    document.getElementById("conteudo-contas").style.display = aba === "contas" ? "" : "none";

    renderizarAba();
}

function renderizarAba() {
    if (abaAtiva === "lancamentos") renderizarLancamentos();
    else if (abaAtiva === "historico") renderizarHistorico();
    else if (abaAtiva === "contas") renderizarContasReceber();
}

// ──────────────────────────────────────────
// TABELA LANÇAMENTOS
// ──────────────────────────────────────────
const TIPO_CONFIG = {
    VENDA: { label: "Venda", classe: "tipo-venda", icone: "bi-cart-fill" },
    DESPESA: { label: "Despesa", classe: "tipo-despesa", icone: "bi-arrow-up-circle-fill" },
    SANGRIA: { label: "Sangria", classe: "tipo-sangria", icone: "bi-dash-circle-fill" },
    SUPRIMENTO: { label: "Suprimento", classe: "tipo-suprimento", icone: "bi-plus-circle-fill" },
    RECEBIMENTO: { label: "Recebimento", classe: "tipo-recebimento", icone: "bi-currency-dollar" },
    MANUAL: { label: "Manual", classe: "tipo-manual", icone: "bi-pencil-fill" },
};

function renderizarLancamentos() {
    const tbody = document.querySelector("#tabela-lancamentos tbody");

    if (!caixaAtual) {
        tbody.innerHTML = `<tr><td colspan="7" class="caixa-fechado-msg">
            <i class="bi bi-lock-fill"></i> Abra o caixa para ver os lançamentos.</td></tr>`;
        return;
    }

    const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
    const pagina = lancamentos.slice(inicio, inicio + ITENS_POR_PAGINA);

    if (!pagina.length) {
        tbody.innerHTML = `<tr><td colspan="7" class="empty-state">Nenhum lançamento ainda.</td></tr>`;
    } else {
        tbody.innerHTML = pagina.map(l => {
            const entrada = isEntrada(l);
            const cfg = TIPO_CONFIG[l.tipoLancamento] || TIPO_CONFIG.MANUAL;
            const sinal = entrada ? "+" : "-";
            const classeValor = entrada ? "valor-entrada" : "valor-saida";
            return `<tr>
                <td>${fmtDataHora(l.dthLancamento)}</td>
                <td><span class="tipo-pill ${cfg.classe}">
                    <i class="bi ${cfg.icone}"></i> ${cfg.label}
                </span></td>
                <td>${l.nomeCategoria || "—"}</td>
                <td>${l.nomeFormaPagamento || "—"}</td>
                <td>${l.nomeCliente ? `<span class="cliente-tag">${l.nomeCliente}</span>` : "—"}</td>
                <td title="${l.descricao || ""}">${l.descricao || "—"}</td>
                <td><span class="${classeValor}">${sinal} ${fmtMoeda(l.valor)}</span></td>
            </tr>`;
        }).join("");
    }

    // Paginação
    renderizarPaginacao(lancamentos.length);
}

function renderizarPaginacao(total) {
    const totalPags = Math.ceil(total / ITENS_POR_PAGINA);
    const ini = total === 0 ? 0 : (paginaAtual - 1) * ITENS_POR_PAGINA + 1;
    const fim = Math.min(paginaAtual * ITENS_POR_PAGINA, total);

    document.querySelector(".paginacao-info").textContent =
        total === 0 ? "Nenhum registro" : `Mostrando ${ini}–${fim} de ${total}`;

    const ctrl = document.querySelector(".paginacao-controles");
    ctrl.innerHTML = "";

    const prev = document.createElement("button");
    prev.className = "btn-pagina"; prev.textContent = "‹"; prev.disabled = paginaAtual === 1;
    prev.onclick = () => { paginaAtual--; renderizarLancamentos(); };
    ctrl.appendChild(prev);

    for (let i = 1; i <= totalPags; i++) {
        const btn = document.createElement("button");
        btn.className = `btn-pagina${i === paginaAtual ? " ativo" : ""}`;
        btn.textContent = i;
        btn.onclick = () => { paginaAtual = i; renderizarLancamentos(); };
        ctrl.appendChild(btn);
    }

    const next = document.createElement("button");
    next.className = "btn-pagina"; next.textContent = "›";
    next.disabled = paginaAtual >= totalPags || totalPags === 0;
    next.onclick = () => { paginaAtual++; renderizarLancamentos(); };
    ctrl.appendChild(next);
}

// ──────────────────────────────────────────
// TABELA HISTÓRICO
// ──────────────────────────────────────────
function renderizarHistorico() {
    const tbody = document.querySelector("#tabela-historico tbody");
    const fechados = historicoList.filter(c => !c.fAtivo);

    if (!fechados.length) {
        tbody.innerHTML = `<tr><td colspan="8" class="empty-state">Nenhum caixa anterior.</td></tr>`;
        return;
    }

    tbody.innerHTML = fechados.map(c => {
        const resultado = (c.saldoFinal || 0) - c.saldoInicial;
        const classeRes = resultado >= 0 ? "valor-entrada" : "valor-saida";
        const dif = c.diferenca;
        const classeDif = !dif ? "" : dif >= 0 ? "valor-entrada" : "valor-saida";
        return `<tr>
            <td><span class="status-pill status-fechado">Fechado</span></td>
            <td>${c.nomeOperador || `#${c.idUsuarioAbertura}`}</td>
            <td>${fmtDataHora(c.dthAbertura)}</td>
            <td>${fmtDataHora(c.dthFechamento)}</td>
            <td>${fmtMoeda(c.saldoInicial)}</td>
            <td><span class="${classeRes}">${fmtMoeda(c.saldoFinal)}</span></td>
            <td>${c.saldoFinalContado != null
                ? `<span class="${classeDif}">${fmtMoeda(c.saldoFinalContado)}</span>`
                : "—"}</td>
            <td>${dif != null
                ? `<span class="${classeDif}">${dif >= 0 ? "+" : ""}${fmtMoeda(dif)}</span>`
                : "—"}</td>
        </tr>`;
    }).join("");
}

// ──────────────────────────────────────────
// TABELA CONTAS A RECEBER
// ──────────────────────────────────────────
function renderizarContasReceber() {
    const tbody = document.querySelector("#tabela-contas tbody");

    if (!contasReceber.length) {
        tbody.innerHTML = `<tr><td colspan="7" class="empty-state">Nenhuma conta a receber.</td></tr>`;
        return;
    }

    tbody.innerHTML = contasReceber.map(c => {
        const st = c.statusAtual || c.status;
        const classeStatus = { PAGO: "status-concluido", VENCIDO: "status-cancelado", ABERTO: "status-pendente" }[st] || "status-pendente";
        const restante = c.valorTotal - c.valorPago;
        return `<tr>
            <td><span class="status-pill ${classeStatus}">${st}</span></td>
            <td>${c.nomeCliente || "—"}</td>
            <td>${c.descricao || "—"}</td>
            <td>${fmtData(c.dthVencimento)}</td>
            <td>${fmtMoeda(c.valorTotal)}</td>
            <td>${fmtMoeda(c.valorPago)}</td>
            <td class="area-acoes">
                ${st !== "PAGO" ? `
                <button class="btn-acao btn-receber" title="Receber"
                    onclick="abrirModalReceberConta(${c.idContaReceber}, '${c.nomeCliente}', ${restante})">
                    <i class="bi bi-currency-dollar"></i>
                </button>` : ""}
            </td>
        </tr>`;
    }).join("");
}

// ──────────────────────────────────────────
// MODAL ABRIR CAIXA
// ──────────────────────────────────────────
function abrirModalAbrirCaixa() {
    document.getElementById("form-abrir-caixa").reset();
    document.getElementById("modal-abrir-caixa").classList.add("open");
}
function fecharModalAbrirCaixa() {
    document.getElementById("modal-abrir-caixa").classList.remove("open");
}

document.getElementById("form-abrir-caixa").addEventListener("submit", async function (e) {
    e.preventDefault();
    const saldo = Number(document.getElementById("abrir-saldo-inicial").value) || 0;
    try {
        await apiPost("/Caixa/Abrir", { SaldoInicial: saldo });
        fecharModalAbrirCaixa();
        await inicializar();
        flexToast("Caixa aberto com sucesso!", "sucesso");
    } catch (err) {
        flexToast("Erro ao abrir caixa: " + err.message, "erro");
    }
});

// ──────────────────────────────────────────
// MODAL FECHAR CAIXA
// ──────────────────────────────────────────
function abrirModalFecharCaixa() {
    if (!caixaAtual) return;
    const saldo = calcularSaldo();
    document.getElementById("fechar-saldo-calculado").value = saldo.toFixed(2);
    document.getElementById("fechar-saldo-calculado-label").textContent = fmtMoeda(saldo);
    document.getElementById("fechar-saldo-contado").value = "";
    document.getElementById("fechar-diferenca").textContent = "—";
    document.getElementById("fechar-obs").value = "";
    document.getElementById("modal-fechar-caixa").classList.add("open");
}
function fecharModalFecharCaixa() {
    document.getElementById("modal-fechar-caixa").classList.remove("open");
}

document.getElementById("fechar-saldo-contado").addEventListener("input", function () {
    const calculado = calcularSaldo();
    const contado = Number(this.value) || 0;
    const dif = contado - calculado;
    const el = document.getElementById("fechar-diferenca");
    el.textContent = `${dif >= 0 ? "+" : ""}${fmtMoeda(dif)}`;
    el.className = `fechar-diferenca-valor ${dif >= 0 ? "verde" : "vermelho"}`;
});

document.getElementById("confirm-fechar-sim").addEventListener("click", async function () {
    if (!caixaAtual) return;
    const contado = Number(document.getElementById("fechar-saldo-contado").value);
    if (isNaN(contado) || document.getElementById("fechar-saldo-contado").value === "") {
        flexToast("Informe o saldo contado.", "aviso");
        return;
    }
    this.disabled = true;
    try {
        await apiPost("/Caixa/Fechar", {
            SaldoFinalContado: contado,
            Obs: document.getElementById("fechar-obs").value || null
        });
        fecharModalFecharCaixa();
        await inicializar();
        flexToast("Caixa fechado com sucesso!", "sucesso");
    } catch (err) {
        flexToast("Erro ao fechar caixa: " + err.message, "erro");
    } finally {
        this.disabled = false;
    }
});

// ──────────────────────────────────────────
// MODAL LANÇAMENTO (Despesa / Sangria / Suprimento)
// ──────────────────────────────────────────
function abrirModalLancamento(tipo) {
    if (!caixaAtual) { flexToast("Abra o caixa primeiro.", "aviso"); return; }

    tipoLancamentoAtual = tipo;
    document.getElementById("form-lancamento").reset();

    const configs = {
        DESPESA: { titulo: "Registrar Despesa", icone: "bi-arrow-up-circle-fill", cor: "#dc2626", btnClasse: "btn-perigo", btnLabel: "Confirmar Despesa", tipoCat: 2 },
        SANGRIA: { titulo: "Registrar Sangria", icone: "bi-dash-circle-fill", cor: "#d97706", btnClasse: "btn-aviso", btnLabel: "Confirmar Sangria", tipoCat: 2 },
        SUPRIMENTO: { titulo: "Registrar Suprimento", icone: "bi-plus-circle-fill", cor: "#15803d", btnClasse: "btn-primario verde", btnLabel: "Confirmar Suprimento", tipoCat: 1 },
    };

    const cfg = configs[tipo];
    document.querySelector("#modal-lancamento .modal-header h3").innerHTML =
        `<i class="bi ${cfg.icone}" style="color:${cfg.cor}"></i> ${cfg.titulo}`;

    const btn = document.getElementById("btn-confirm-lancamento");
    btn.className = cfg.btnClasse;
    btn.innerHTML = `<i class="bi bi-check-lg"></i> ${cfg.btnLabel}`;

    // Popula categorias pelo tipo
    const cats = categorias.filter(c => Number(c.tipo) === cfg.tipoCat);
    document.getElementById("lanc-categoria").innerHTML = cats.length
        ? cats.map(c => `<option value="${c.idCategoriaFinanceira}">${c.nome}</option>`).join("")
        : `<option value="">Nenhuma categoria</option>`;

    // Popula formas de pagamento
    document.getElementById("lanc-formapgto").innerHTML = formasPagamento
        .map(f => `<option value="${f.idFormaPagamento}">${f.nome}</option>`).join("");

    // Sangria e Suprimento não precisam de forma de pagamento
    const showFP = tipo !== "SANGRIA" && tipo !== "SUPRIMENTO";
    document.getElementById("grupo-formapgto").style.display = showFP ? "" : "none";

    document.getElementById("modal-lancamento").classList.add("open");
}

function fecharModalLancamento() {
    document.getElementById("modal-lancamento").classList.remove("open");
}

document.getElementById("form-lancamento").addEventListener("submit", async function (e) {
    e.preventDefault();
    if (!caixaAtual) return;

    const idFP = Number(document.getElementById("lanc-formapgto").value) || formasPagamento[0]?.idFormaPagamento;
    const idCat = Number(document.getElementById("lanc-categoria").value);
    const valor = Number(document.getElementById("lanc-valor").value);
    const descricao = document.getElementById("lanc-descricao").value || null;

    if (!valor || valor <= 0) { flexToast("Informe um valor válido.", "aviso"); return; }

    try {
        await apiPost("/Caixa/Lancar", {
            IdFormaPagamento: idFP,
            IdCategoriaFinanceira: idCat,
            Valor: valor,
            Descricao: descricao,
            TipoLancamento: tipoLancamentoAtual
        });
        fecharModalLancamento();
        lancamentos = await apiGet("/Caixa/Lancamentos");
        atualizarPainel();
        atualizarBreakdown();
        flexToast("Lançamento registrado!", "sucesso");
    } catch (err) {
        flexToast("Erro: " + err.message, "erro");
    }
});

// ──────────────────────────────────────────
// MODAL VENDA RÁPIDA
// ──────────────────────────────────────────
async function abrirModalVendaRapida() {
    if (!caixaAtual) { flexToast("Abra o caixa primeiro.", "aviso"); return; }

    _vendaRapidaItens = [];
    _clienteSelecionadoVenda = null;

    document.getElementById("form-venda-rapida").reset();
    document.getElementById("vr-cliente-info").style.display = "none";
    document.getElementById("vr-cpf-wrap").style.display = "none";
    document.getElementById("vr-fiado-wrap").style.display = "none";
    document.getElementById("vr-vencimento-wrap").style.display = "none";

    document.getElementById("vr-formapgto").innerHTML = formasPagamento
        .map(f => `<option value="${f.idFormaPagamento}">${f.nome}</option>`).join("");

    if (!produtosCache.length)
        produtosCache = await apiGet("/Produto/Listar").catch(() => []);

    renderizarItensVendaRapida();
    document.getElementById("modal-venda-rapida").classList.add("open");
}

function fecharModalVendaRapida() {
    document.getElementById("modal-venda-rapida").classList.remove("open");
}

function toggleCpfVenda() {
    const wrap = document.getElementById("vr-cpf-wrap");
    wrap.style.display = wrap.style.display === "none" ? "" : "none";
    if (wrap.style.display === "none") {
        _clienteSelecionadoVenda = null;
        document.getElementById("vr-cliente-info").style.display = "none";
    }
}

async function buscarClienteCpf() {
    const cpf = document.getElementById("vr-cpf").value.replace(/\D/g, "");
    if (cpf.length < 11) { flexToast("CPF inválido.", "aviso"); return; }

    if (!clientesCache.length)
        clientesCache = await apiGet("/Cliente/Listar").catch(() => []);

    const cliente = clientesCache.find(c => (c.cpfCNPJ || "").replace(/\D/g, "") === cpf);
    const infoEl = document.getElementById("vr-cliente-info");

    if (cliente) {
        _clienteSelecionadoVenda = cliente;
        infoEl.innerHTML = `<i class="bi bi-person-check-fill" style="color:#15803d"></i>
            <strong>${cliente.nome}</strong>`;
        infoEl.style.display = "flex";
        document.getElementById("vr-fiado-wrap").style.display = "";
    } else {
        _clienteSelecionadoVenda = null;
        infoEl.innerHTML = `<i class="bi bi-person-x-fill" style="color:#dc2626"></i>
            <span style="color:#dc2626">Cliente não encontrado</span>`;
        infoEl.style.display = "flex";
        document.getElementById("vr-fiado-wrap").style.display = "none";
    }
}

function toggleFiado() {
    const fiado = document.getElementById("vr-fiado").checked;
    document.getElementById("vr-vencimento-wrap").style.display = fiado ? "" : "none";
    document.getElementById("vr-formapgto-wrap").style.display = fiado ? "none" : "";
}

function adicionarItemVenda() {
    _vendaRapidaItens.push({ idProduto: null, nomeProduto: "", quantidade: 1, valorUnitario: 0 });
    renderizarItensVendaRapida();
    // Abre busca de produto para o novo item
    abrirBuscaProdutoVenda(_vendaRapidaItens.length - 1);
}

function renderizarItensVendaRapida() {
    const tbody = document.getElementById("vr-itens-body");

    if (!_vendaRapidaItens.length) {
        tbody.innerHTML = `<tr><td colspan="5" class="empty-state" style="padding:2rem">
            Clique em "Adicionar Item" para começar.</td></tr>`;
        atualizarTotalVenda();
        return;
    }

    tbody.innerHTML = _vendaRapidaItens.map((item, idx) => `
        <tr>
            <td>
                <div class="produto-cell">
                    <input type="text" readonly value="${item.nomeProduto}"
                        placeholder="Selecionar produto..."
                        onclick="abrirBuscaProdutoVenda(${idx})" style="cursor:pointer">
                    <button type="button" class="btn-buscar-produto"
                        onclick="abrirBuscaProdutoVenda(${idx})">
                        <i class="bi bi-search"></i>
                    </button>
                </div>
            </td>
            <td><input type="number" min="1" value="${item.quantidade}"
                onchange="atualizarItemVenda(${idx},'quantidade',this.value)"></td>
            <td><input type="number" min="0" step="0.01" value="${item.valorUnitario}"
                onchange="atualizarItemVenda(${idx},'valorUnitario',this.value)"></td>
            <td style="font-weight:700">${fmtMoeda(item.quantidade * item.valorUnitario)}</td>
            <td><button type="button" class="btn-del-item"
                onclick="removerItemVenda(${idx})">
                <i class="bi bi-trash3-fill"></i></button></td>
        </tr>`).join("");

    atualizarTotalVenda();
}

function atualizarItemVenda(idx, campo, valor) {
    _vendaRapidaItens[idx][campo] = Number(valor);
    renderizarItensVendaRapida();
}

function removerItemVenda(idx) {
    _vendaRapidaItens.splice(idx, 1);
    renderizarItensVendaRapida();
}

function atualizarTotalVenda() {
    const total = _vendaRapidaItens.reduce((a, i) => a + (i.quantidade * i.valorUnitario), 0);
    document.getElementById("vr-total").textContent = fmtMoeda(total);

    // Sincroniza campo de valor com o total dos itens
    if (_vendaRapidaItens.length > 0)
        document.getElementById("vr-valor").value = total.toFixed(2);
}

// Busca de produto para venda rápida
let _vrProdutoIdx = null;
function abrirBuscaProdutoVenda(idx) {
    _vrProdutoIdx = idx;
    document.getElementById("input-busca-produto-vr").value = "";
    renderListaProdutosVR(produtosCache, "");
    document.getElementById("modal-busca-produto-vr").classList.add("open");
    setTimeout(() => document.getElementById("input-busca-produto-vr").focus(), 80);
}
function fecharBuscaProdutoVR() {
    document.getElementById("modal-busca-produto-vr").classList.remove("open");
    _vrProdutoIdx = null;
}
function filtrarListaProdutosVR(q) {
    const filtrado = q ? produtosCache.filter(p =>
        p.nome?.toLowerCase().includes(q.toLowerCase()) ||
        p.sku?.toLowerCase().includes(q.toLowerCase())) : produtosCache;
    renderListaProdutosVR(filtrado, q);
}
function renderListaProdutosVR(lista, q) {
    const el = document.getElementById("lista-busca-produtos-vr");
    const ativos = lista.filter(p => p.fAtivo);
    if (!ativos.length) {
        el.innerHTML = `<div class="busca-vazia"><i class="bi bi-box-seam"></i> Nenhum produto</div>`;
        return;
    }
    el.innerHTML = ativos.map(p => `
        <div class="busca-item" onclick="selecionarProdutoVR(${p.idProduto})">
            <div class="busca-item-info">
                <span class="busca-item-nome">${p.nome}</span>
                <span class="busca-item-sub">Estoque: ${p.qtdEstoque ?? "—"}</span>
            </div>
            <span class="busca-item-preco">${fmtMoeda(p.precoVenda)}</span>
        </div>`).join("");
}
function selecionarProdutoVR(id) {
    const p = produtosCache.find(x => x.idProduto === id);
    if (!p || _vrProdutoIdx === null) return;
    _vendaRapidaItens[_vrProdutoIdx] = {
        idProduto: p.idProduto,
        nomeProduto: p.nome,
        quantidade: 1,
        valorUnitario: p.precoVenda
    };
    fecharBuscaProdutoVR();
    renderizarItensVendaRapida();
}

document.getElementById("form-venda-rapida").addEventListener("submit", async function (e) {
    e.preventDefault();

    const itensValidos = _vendaRapidaItens.filter(i => i.idProduto !== null);
    const valor = Number(document.getElementById("vr-valor").value);
    const fiado = document.getElementById("vr-fiado")?.checked ?? false;
    const idFP = Number(document.getElementById("vr-formapgto").value);
    const descricao = document.getElementById("vr-descricao").value || null;

    if (!valor || valor <= 0) { flexToast("Informe o valor da venda.", "aviso"); return; }
    if (fiado && !_clienteSelecionadoVenda) { flexToast("Selecione um cliente para venda no fiado.", "aviso"); return; }

    const vencimento = document.getElementById("vr-vencimento")?.value;

    const btn = this.querySelector('[type="submit"]');
    btn.disabled = true;

    try {
        await apiPost("/Caixa/VendaRapida", {
            IdFormaPagamento: idFP,
            Valor: valor,
            Descricao: descricao,
            ClienteId: _clienteSelecionadoVenda?.idCliente ?? null,
            Fiado: fiado,
            DthVencimentoFiado: vencimento || null,
            Itens: itensValidos.map(i => ({
                IdProduto: i.idProduto,
                Quantidade: i.quantidade,
                ValorUnitario: i.valorUnitario
            }))
        });

        fecharModalVendaRapida();
        lancamentos = await apiGet("/Caixa/Lancamentos");
        contasReceber = await apiGet("/Caixa/ContasReceber").catch(() => []);
        atualizarPainel();
        atualizarBreakdown();
        flexToast("Venda registrada com sucesso!", "sucesso");
    } catch (err) {
        flexToast("Erro: " + err.message, "erro");
    } finally {
        btn.disabled = false;
    }
});

// ──────────────────────────────────────────
// MODAL RECEBER CONTA (Fiado)
// ──────────────────────────────────────────
let _contaReceberAtual = null;

function abrirModalReceberConta(idConta, nomeCliente, valorRestante) {
    _contaReceberAtual = idConta;
    document.getElementById("receber-cliente").textContent = nomeCliente;
    document.getElementById("receber-valor-restante").textContent = fmtMoeda(valorRestante);
    document.getElementById("receber-valor").value = valorRestante.toFixed(2);

    document.getElementById("receber-formapgto").innerHTML = formasPagamento
        .map(f => `<option value="${f.idFormaPagamento}">${f.nome}</option>`).join("");

    const catReceb = categorias.find(c => Number(c.tipo) === 1);
    document.getElementById("receber-categoria-id").value = catReceb?.idCategoriaFinanceira || "";

    document.getElementById("modal-receber-conta").classList.add("open");
}

function fecharModalReceberConta() {
    document.getElementById("modal-receber-conta").classList.remove("open");
    _contaReceberAtual = null;
}

document.getElementById("form-receber-conta").addEventListener("submit", async function (e) {
    e.preventDefault();
    if (!_contaReceberAtual) return;

    const btn = this.querySelector('[type="submit"]');
    btn.disabled = true;

    try {
        await apiPost("/Caixa/ReceberConta", {
            IdContaReceber: _contaReceberAtual,
            ValorPago: Number(document.getElementById("receber-valor").value),
            IdFormaPagamento: Number(document.getElementById("receber-formapgto").value),
            IdCategoriaFinanceira: Number(document.getElementById("receber-categoria-id").value)
        });
        fecharModalReceberConta();
        lancamentos = await apiGet("/Caixa/Lancamentos");
        contasReceber = await apiGet("/Caixa/ContasReceber").catch(() => []);
        atualizarPainel();
        atualizarBreakdown();
        flexToast("Recebimento registrado!", "sucesso");
    } catch (err) {
        flexToast("Erro: " + err.message, "erro");
    } finally {
        btn.disabled = false;
    }
});

// ──────────────────────────────────────────
// FECHAR MODAIS CLICANDO FORA
// ──────────────────────────────────────────
[
    ["modal-abrir-caixa", fecharModalAbrirCaixa],
    ["modal-fechar-caixa", fecharModalFecharCaixa],
    ["modal-lancamento", fecharModalLancamento],
    ["modal-venda-rapida", fecharModalVendaRapida],
    ["modal-receber-conta", fecharModalReceberConta],
    ["modal-busca-produto-vr", fecharBuscaProdutoVR],
].forEach(([id, fn]) => {
    document.getElementById(id)?.addEventListener("click", function (e) {
        if (e.target === this) fn();
    });
});

// ──────────────────────────────────────────
// INIT
// ──────────────────────────────────────────
mudarAba("lancamentos");
inicializar();