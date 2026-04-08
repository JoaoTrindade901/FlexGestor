// ===== CAIXA.JS — integrado com backend FlexGestor =====

const ITENS_POR_PAGINA = 10;
let paginaAtual = 1;
let abaAtiva = "lancamentos";

let caixaAtual = null;       // CaixaModel do backend
let lancamentos = [];        // LancamentoCaixaModel[]
let historicoList = [];      // CaixaModel[] histórico
let formasPagamento = [];    // FormaPagamentoModel[]
let categorias = [];         // CategoriaFinanceiraModel[]
let tipoLancamentoAtual = "entrada";

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
    return new Date(s).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

// ──────────────────────────────────────────
// HELPERS — detecta se lançamento é entrada
// Suporta tipoCategoria como número (1=entrada, 2=saida) ou string ("entrada"/"saida")
// ──────────────────────────────────────────
function isEntrada(lancamento) {
    const t = lancamento.tipoCategoria;
    return Number(t) === 1 || (typeof t === "string" && t.toLowerCase() === "entrada");
}

// ──────────────────────────────────────────
// CARREGAR TUDO
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

        if (caixaAtual) {
            lancamentos = await apiGet("/Caixa/Lancamentos"); 
        } else {
            lancamentos = [];
        }

        atualizarPainel();
    } catch (err) {
        console.error("Erro ao inicializar caixa:", err);
        flexToast("Erro ao carregar dados do caixa. Tente recarregar a página.", "erro");
    }
}

// ──────────────────────────────────────────
// CÁLCULOS — CORRIGIDOS
// ──────────────────────────────────────────
function calcularEntradas() {
    return lancamentos
        .filter(l => isEntrada(l))
        .reduce((acc, l) => acc + Number(l.valor), 0);
}

function calcularSaidas() {
    return lancamentos
        .filter(l => !isEntrada(l))
        .reduce((acc, l) => acc + Number(l.valor), 0);
}

function calcularSaldo() {
    if (!caixaAtual) return 0;
    return Number(caixaAtual.saldoInicial) + calcularEntradas() - calcularSaidas();
}

// ──────────────────────────────────────────
// PAINEL DE STATUS
// ──────────────────────────────────────────
function atualizarPainel() {
    const aberto = caixaAtual !== null;

    const badge = document.getElementById("caixa-status-badge");
    badge.className = `caixa-status-badge ${aberto ? "aberto" : "fechado"}`;
    badge.innerHTML = `<i class="bi bi-${aberto ? "unlock-fill" : "lock-fill"}"></i> ${aberto ? "Aberto" : "Fechado"}`;

    const saldo = calcularSaldo();
    const elSaldo = document.getElementById("caixa-saldo-atual");
    elSaldo.textContent = fmtMoeda(saldo);
    elSaldo.className = `caixa-card-valor ${saldo >= 0 ? "verde" : "vermelho"}`;

    document.getElementById("caixa-entradas").textContent = fmtMoeda(aberto ? calcularEntradas() : 0);
    document.getElementById("caixa-saidas").textContent = fmtMoeda(aberto ? calcularSaidas() : 0);
    document.getElementById("caixa-abertura").textContent = aberto ? fmtDataHora(caixaAtual.dthAbertura) : "—";

    document.getElementById("btn-abrir").style.display = aberto ? "none" : "flex";
    document.getElementById("btn-fechar").style.display = aberto ? "flex" : "none";
    document.getElementById("btn-entrada").disabled = !aberto;
    document.getElementById("btn-saida").disabled = !aberto;
    document.getElementById("btn-entrada").style.opacity = aberto ? "1" : "0.4";
    document.getElementById("btn-saida").style.opacity = aberto ? "1" : "0.4";

    renderizarAba();
}

// ──────────────────────────────────────────
// ABAS
// ──────────────────────────────────────────
function mudarAba(aba) {
    abaAtiva = aba;
    paginaAtual = 1;
    document.querySelectorAll(".aba-btn").forEach(b => b.classList.remove("ativa"));
    document.getElementById(`aba-${aba}`).classList.add("ativa");
    renderizarAba();
}

function renderizarAba() {
    document.getElementById("conteudo-lancamentos").style.display = abaAtiva === "lancamentos" ? "" : "none";
    document.getElementById("conteudo-historico").style.display = abaAtiva === "historico" ? "" : "none";
    if (abaAtiva === "lancamentos") renderizarLancamentos();
    else renderizarHistorico();
}

// ──────────────────────────────────────────
// TABELA DE LANÇAMENTOS — CORRIGIDA
// ──────────────────────────────────────────
function renderizarLancamentos() {
    const tbody = document.querySelector("#tabela-lancamentos tbody");
    if (!caixaAtual) {
        tbody.innerHTML = `<tr><td colspan="6" class="caixa-fechado-msg"><i class="bi bi-lock-fill"></i> Abra o caixa para ver os lançamentos.</td></tr>`;
        renderizarPaginacao("paginacao-lancamentos", 0, 0);
        return;
    }

    const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
    const pagina = lancamentos.slice(inicio, inicio + ITENS_POR_PAGINA);

    if (pagina.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="empty-state">Nenhum lançamento ainda.</td></tr>`;
    } else {
        tbody.innerHTML = pagina.map(l => {
            const entrada = isEntrada(l);
            const classeValor = entrada ? "valor-entrada" : "valor-saida";
            const sinal = entrada ? "+" : "-";
            const classeTipo = entrada ? "tipo-entrada" : "tipo-saida";
            const labelTipo = entrada ? "↑ Entrada" : "↓ Saída";
            return `<tr>
                <td>${fmtDataHora(l.dthLancamento)}</td>
                <td><span class="${classeTipo}">${labelTipo}</span></td>
                <td title="${l.nomeCategoria || ''}">${l.nomeCategoria || "—"}</td>
                <td>${l.nomeFormaPagamento || "—"}</td>
                <td title="${l.descricao || ''}">${l.descricao || "—"}</td>
                <td><span class="${classeValor}">${sinal} ${fmtMoeda(l.valor)}</span></td>
            </tr>`;
        }).join('');
    }
    renderizarPaginacao("paginacao-lancamentos", lancamentos.length, paginaAtual);
}

// ──────────────────────────────────────────
// TABELA DE HISTÓRICO
// ──────────────────────────────────────────
function renderizarHistorico() {
    const tbody = document.querySelector("#tabela-historico tbody");
    const todos = [...historicoList].filter(c => !c.fAtivo);

    if (todos.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="empty-state">Nenhum caixa anterior.</td></tr>`;
        return;
    }

    tbody.innerHTML = todos.map(c => {
        const resultado = (c.saldoFinal ?? 0) - c.saldoInicial;
        const classeRes = resultado >= 0 ? "valor-entrada" : "valor-saida";
        return `<tr>
            <td><span class="status-pill status-fechado">Fechado</span></td>
            <td>${fmtDataHora(c.dthAbertura)}</td>
            <td>${fmtDataHora(c.dthFechamento)}</td>
            <td>${fmtMoeda(c.saldoInicial)}</td>
            <td>${c.saldoFinal !== null ? fmtMoeda(c.saldoFinal) : "—"}</td>
            <td><span class="${classeRes}">${resultado >= 0 ? "+" : ""}${fmtMoeda(resultado)}</span></td>
            <td>Usuário #${c.idUsuarioAbertura}</td>
        </tr>`;
    }).join('');
}

// ──────────────────────────────────────────
// PAGINAÇÃO
// ──────────────────────────────────────────
function renderizarPaginacao(containerId, total, pagina) {
    const totalPaginas = Math.ceil(total / ITENS_POR_PAGINA);
    const inicio = total === 0 ? 0 : (pagina - 1) * ITENS_POR_PAGINA + 1;
    const fim = Math.min(pagina * ITENS_POR_PAGINA, total);

    const container = document.getElementById(containerId);
    if (!container) return;
    container.querySelector(".paginacao-info").textContent =
        total === 0 ? "Nenhum registro" : `Mostrando ${inicio}–${fim} de ${total}`;

    const controles = container.querySelector(".paginacao-controles");
    controles.innerHTML = "";

    const prev = document.createElement("button");
    prev.className = "btn-pagina"; prev.textContent = "‹"; prev.disabled = pagina === 1;
    prev.addEventListener("click", () => { paginaAtual--; renderizarLancamentos(); });
    controles.appendChild(prev);

    for (let i = 1; i <= totalPaginas; i++) {
        const btn = document.createElement("button");
        btn.className = `btn-pagina${i === pagina ? " ativo" : ""}`;
        btn.textContent = i;
        btn.addEventListener("click", () => { paginaAtual = i; renderizarLancamentos(); });
        controles.appendChild(btn);
    }

    const next = document.createElement("button");
    next.className = "btn-pagina"; next.textContent = "›";
    next.disabled = pagina === totalPaginas || totalPaginas === 0;
    next.addEventListener("click", () => { paginaAtual++; renderizarLancamentos(); });
    controles.appendChild(next);
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
    const saldoInicial = Number(document.getElementById("abrir-saldo-inicial").value) || 0;
    try {
        await apiPost("/Caixa/Abrir", { SaldoInicial: saldoInicial });
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
    document.getElementById("fechar-saldo-final").value = calcularSaldo().toFixed(2);
    document.getElementById("modal-fechar-caixa").classList.add("open");
}
function fecharModalFecharCaixa() {
    document.getElementById("modal-fechar-caixa").classList.remove("open");
}

document.getElementById("confirm-fechar-sim").addEventListener("click", async function () {
    if (!caixaAtual) return;
    try {
        await apiPost("/Caixa/Fechar", {
            IdCaixa: caixaAtual.idCaixa,
            SaldoFinal: calcularSaldo()
        });
        fecharModalFecharCaixa();
        await inicializar();
        flexToast("Caixa fechado com sucesso!", "sucesso");
    } catch (err) {
        flexToast("Erro ao fechar caixa: " + err.message, "erro");
    }
});

// ──────────────────────────────────────────
// MODAL LANÇAMENTO — CORRIGIDO
// ──────────────────────────────────────────
function abrirModalLancamento(tipo) {
    if (!caixaAtual) {
        flexToast("O caixa está fechado. Abra o caixa antes de realizar lançamentos.", "aviso");
        return;
    }

    tipoLancamentoAtual = tipo;

    // Reset ANTES de popular os selects
    document.getElementById("form-lancamento").reset();

    // Filtra categorias pelo tipo: 1 = entrada, 2 = saida
    const tipoNum = tipo === "entrada" ? 1 : 2;
    const cats = categorias.filter(c => Number(c.tipo) === tipoNum);
    const select = document.getElementById("lanc-categoria");
    select.innerHTML = cats.length > 0
        ? cats.map(c => `<option value="${c.idCategoriaFinanceira}">${c.nome}</option>`).join('')
        : `<option value="">Nenhuma categoria cadastrada</option>`;

    // Popula formas de pagamento
    document.getElementById("lanc-formapgto").innerHTML = formasPagamento.map(f =>
        `<option value="${f.idFormaPagamento}">${f.nome}</option>`
    ).join('');

    const modal = document.getElementById("modal-lancamento");
    const header = modal.querySelector(".modal-header h3");
    const btnConfirm = document.getElementById("btn-confirm-lancamento");

    if (tipo === "entrada") {
        header.innerHTML = `<i class="bi bi-arrow-down-circle-fill" style="color:#15803d"></i> Lançar Entrada`;
        btnConfirm.className = "btn-primario verde";
        btnConfirm.innerHTML = `<i class="bi bi-check-lg"></i> Confirmar Entrada`;
    } else {
        header.innerHTML = `<i class="bi bi-arrow-up-circle-fill" style="color:#dc2626"></i> Lançar Saída`;
        btnConfirm.className = "btn-perigo";
        btnConfirm.innerHTML = `<i class="bi bi-check-lg"></i> Confirmar Saída`;
    }

    modal.classList.add("open");
}

function fecharModalLancamento() {
    document.getElementById("modal-lancamento").classList.remove("open");
}

document.getElementById("form-lancamento").addEventListener("submit", async function (e) {
    e.preventDefault();

    // Validação extra: garante que o caixa ainda está aberto no momento do submit
    if (!caixaAtual) {
        flexToast("O caixa está fechado. Não é possível realizar lançamentos.", "aviso");
        fecharModalLancamento();
        return;
    }

    try {
        await apiPost("/Caixa/Lancar", {
            IdCaixa: caixaAtual.idCaixa,
            IdFormaPagamento: Number(document.getElementById("lanc-formapgto").value),
            IdCategoriaFinanceira: Number(document.getElementById("lanc-categoria").value),
            Valor: Number(document.getElementById("lanc-valor").value),
            Descricao: document.getElementById("lanc-descricao").value || null,
            Referencia: document.getElementById("lanc-referencia").value || null
        });
        fecharModalLancamento();
        lancamentos = await apiGet("/Caixa/Lancamentos");
        atualizarPainel();
        flexToast(`${tipoLancamentoAtual === "entrada" ? "Entrada" : "Saída"} lançada com sucesso!`, "sucesso");
    } catch (err) {
        flexToast("Erro ao lançar: " + err.message, "erro");
    }
});

// ──────────────────────────────────────────
// FECHAR MODAIS CLICANDO FORA
// ──────────────────────────────────────────
["modal-abrir-caixa", "modal-fechar-caixa", "modal-lancamento"].forEach(id => {
    document.getElementById(id).addEventListener("click", function (e) {
        if (e.target !== this) return;
        if (id === "modal-abrir-caixa") fecharModalAbrirCaixa();
        else if (id === "modal-fechar-caixa") fecharModalFecharCaixa();
        else fecharModalLancamento();
    });
});

// ──────────────────────────────────────────
// INIT
// ──────────────────────────────────────────
mudarAba("lancamentos");
inicializar();