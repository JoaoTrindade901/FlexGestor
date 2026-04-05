// ===== CAIXA.JS =====

const ITENS_POR_PAGINA = 10;
let paginaAtual = 1;
let abaAtiva = "lancamentos"; // "lancamentos" | "historico"

// ── DADOS MOCKADOS ──
const formasPagamento = [
    { id: 1, nome: "Dinheiro" },
    { id: 2, nome: "Cartão Débito" },
    { id: 3, nome: "Cartão Crédito" },
    { id: 4, nome: "PIX" },
    { id: 5, nome: "Transferência" },
];

// Tabela CategoriaFinanceira: idCategoriaFinanceira, Nome, Tipo (entrada|saida), fAtivo
// Tipo define a natureza do lançamento — a categoria descreve/justifica o motivo
const categoriasFinanceiras = [
    { idCategoriaFinanceira: 1, Nome: "Venda Realizada",          Tipo: "entrada", fAtivo: true },
    { idCategoriaFinanceira: 2, Nome: "Prestação de Serviço",     Tipo: "entrada", fAtivo: true },
    { idCategoriaFinanceira: 3, Nome: "Recebimento de Cliente",   Tipo: "entrada", fAtivo: true },
    { idCategoriaFinanceira: 4, Nome: "Devolução Recebida",       Tipo: "entrada", fAtivo: true },
    { idCategoriaFinanceira: 5, Nome: "Outros Recebimentos",      Tipo: "entrada", fAtivo: true },
    { idCategoriaFinanceira: 6, Nome: "Extorno",                  Tipo: "saida",   fAtivo: true },
    { idCategoriaFinanceira: 7, Nome: "Compra de Mercadoria",     Tipo: "saida",   fAtivo: true },
    { idCategoriaFinanceira: 8, Nome: "Despesa Operacional",      Tipo: "saida",   fAtivo: true },
    { idCategoriaFinanceira: 9, Nome: "Pagamento de Fornecedor",  Tipo: "saida",   fAtivo: true },
    { idCategoriaFinanceira: 10, Nome: "Retirada de Caixa",       Tipo: "saida",   fAtivo: true },
    { idCategoriaFinanceira: 11, Nome: "Outros Pagamentos",       Tipo: "saida",   fAtivo: true },
];

// Caixas históricos
const caixas = [
    { idCaixa: 1, usuario_open_id: 1, usuario_close_id: 1, dthOpen: "2026-03-20T08:00:00", dthClose: "2026-03-20T18:00:00", saldoInicial: 500, saldoFinal: 1820.50, idEmpresa: 1, fAtivo: false },
    { idCaixa: 2, usuario_open_id: 1, usuario_close_id: 1, dthOpen: "2026-03-21T08:00:00", dthClose: "2026-03-21T18:30:00", saldoInicial: 300, saldoFinal: 2150.00, idEmpresa: 1, fAtivo: false },
];

// Caixa atual (aberto)
let caixaAtual = {
    idCaixa: 3,
    usuario_open_id: 1,
    usuario_close_id: null,
    dthOpen: "2026-03-22T08:15:00",
    dthClose: null,
    saldoInicial: 500,
    saldoFinal: null,
    idEmpresa: 1,
    fAtivo: true,
};

// Lançamentos do caixa atual
let lancamentos = [
    { idLancamento: 1, caixa_id: 3, formaPagamento_id: 4, usuario_id: 1, categoriaFinanceira_id: 1,  Valor: 350.00, DataHora: "2026-03-22T09:10:00", Descricao: "Venda notebook",           Referencia: "Pedido", Referencia_id: 101, Referencia_Tipo: "Pedido",  idEmpresa: 1 },
    { idLancamento: 2, caixa_id: 3, formaPagamento_id: 1, usuario_id: 1, categoriaFinanceira_id: 8,  Valor: 80.00,  DataHora: "2026-03-22T10:30:00", Descricao: "Conta de energia",         Referencia: "",       Referencia_id: null, Referencia_Tipo: "",        idEmpresa: 1 },
    { idLancamento: 3, caixa_id: 3, formaPagamento_id: 2, usuario_id: 1, categoriaFinanceira_id: 3,  Valor: 520.00, DataHora: "2026-03-22T11:45:00", Descricao: "Recebimento João Silva",   Referencia: "Cliente", Referencia_id: 1,  Referencia_Tipo: "Cliente", idEmpresa: 1 },
    { idLancamento: 4, caixa_id: 3, formaPagamento_id: 4, usuario_id: 1, categoriaFinanceira_id: 2,  Valor: 200.00, DataHora: "2026-03-22T13:00:00", Descricao: "Serviço de manutenção",   Referencia: "",       Referencia_id: null, Referencia_Tipo: "",        idEmpresa: 1 },
    { idLancamento: 5, caixa_id: 3, formaPagamento_id: 1, usuario_id: 1, categoriaFinanceira_id: 10, Valor: 150.00, DataHora: "2026-03-22T14:20:00", Descricao: "Retirada para troco",     Referencia: "",       Referencia_id: null, Referencia_Tipo: "",        idEmpresa: 1 },
    { idLancamento: 6, caixa_id: 3, formaPagamento_id: 3, usuario_id: 1, categoriaFinanceira_id: 6,  Valor: 45.00,  DataHora: "2026-03-22T15:05:00", Descricao: "Extorno venda cancelada", Referencia: "",       Referencia_id: null, Referencia_Tipo: "",        idEmpresa: 1 },
];

// ──────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────
function nomeCategoria(id) {
    const c = categoriasFinanceiras.find(c => c.idCategoriaFinanceira === id);
    return c ? c.Nome : `Cat. #${id}`;
}
function tipoCategoria(id) {
    const c = categoriasFinanceiras.find(c => c.idCategoriaFinanceira === id);
    return c ? c.Tipo : "entrada";
}
function nomeFormaPgto(id) {
    const f = formasPagamento.find(f => f.id === id);
    return f ? f.nome : `Forma #${id}`;
}
function fmtMoeda(v) {
    return `R$ ${Number(v).toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
}
function fmtDataHora(s) {
    return new Date(s).toLocaleString("pt-BR", { day:"2-digit", month:"2-digit", year:"numeric", hour:"2-digit", minute:"2-digit" });
}
function fmtData(s) {
    return new Date(s).toLocaleDateString("pt-BR");
}

// ──────────────────────────────────────────
// SALDO CALCULADO
// ──────────────────────────────────────────
function calcularSaldo() {
    return lancamentos.reduce((acc, l) => {
        const tipo = tipoCategoria(l.categoriaFinanceira_id);
        return tipo === "entrada" ? acc + l.Valor : acc - l.Valor;
    }, caixaAtual ? caixaAtual.saldoInicial : 0);
}

function calcularEntradas() {
    return lancamentos.filter(l => tipoCategoria(l.categoriaFinanceira_id) === "entrada")
                      .reduce((acc, l) => acc + l.Valor, 0);
}

function calcularSaidas() {
    return lancamentos.filter(l => tipoCategoria(l.categoriaFinanceira_id) === "saida")
                      .reduce((acc, l) => acc + l.Valor, 0);
}

// ──────────────────────────────────────────
// PAINEL DE STATUS
// ──────────────────────────────────────────
function atualizarPainel() {
    const aberto = caixaAtual && caixaAtual.fAtivo;

    // Status
    const badge = document.getElementById("caixa-status-badge");
    badge.className = `caixa-status-badge ${aberto ? "aberto" : "fechado"}`;
    badge.innerHTML = `<i class="bi bi-${aberto ? "unlock-fill" : "lock-fill"}"></i> ${aberto ? "Aberto" : "Fechado"}`;

    // Saldo
    const saldo = aberto ? calcularSaldo() : 0;
    const elSaldo = document.getElementById("caixa-saldo-atual");
    elSaldo.textContent = fmtMoeda(saldo);
    elSaldo.className = `caixa-card-valor ${saldo >= 0 ? "verde" : "vermelho"}`;

    // Entradas / Saídas
    document.getElementById("caixa-entradas").textContent = fmtMoeda(aberto ? calcularEntradas() : 0);
    document.getElementById("caixa-saidas").textContent   = fmtMoeda(aberto ? calcularSaidas() : 0);

    // Abertura
    document.getElementById("caixa-abertura").textContent = aberto
        ? fmtDataHora(caixaAtual.dthOpen)
        : "—";

    // Botões
    document.getElementById("btn-abrir").style.display   = aberto ? "none" : "flex";
    document.getElementById("btn-fechar").style.display  = aberto ? "flex" : "none";
    document.getElementById("btn-entrada").disabled = !aberto;
    document.getElementById("btn-saida").disabled   = !aberto;
    document.getElementById("btn-entrada").style.opacity = aberto ? "1" : "0.4";
    document.getElementById("btn-saida").style.opacity   = aberto ? "1" : "0.4";

    // Conteúdo da aba
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
    document.getElementById("conteudo-historico").style.display   = abaAtiva === "historico"   ? "" : "none";

    if (abaAtiva === "lancamentos") renderizarLancamentos();
    else renderizarHistorico();
}

// ──────────────────────────────────────────
// TABELA DE LANÇAMENTOS
// ──────────────────────────────────────────
function renderizarLancamentos() {
    const tbody = document.querySelector("#tabela-lancamentos tbody");
    const aberto = caixaAtual && caixaAtual.fAtivo;

    if (!aberto) {
        tbody.innerHTML = `<tr><td colspan="6" class="caixa-fechado-msg"><i class="bi bi-lock-fill"></i>Abra o caixa para ver os lançamentos.</td></tr>`;
        renderizarPaginacao("paginacao-lancamentos", 0, 0, 0);
        return;
    }

    const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
    const pagina = lancamentos.slice(inicio, inicio + ITENS_POR_PAGINA);

    if (pagina.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="empty-state">Nenhum lançamento ainda.</td></tr>`;
    } else {
        tbody.innerHTML = pagina.map(l => {
            const tipo = tipoCategoria(l.categoriaFinanceira_id);
            const classeValor = tipo === "entrada" ? "valor-entrada" : "valor-saida";
            const sinal = tipo === "entrada" ? "+" : "-";
            const classeTipo = tipo === "entrada" ? "tipo-entrada" : "tipo-saida";
            return `<tr>
                <td>${fmtDataHora(l.DataHora)}</td>
                <td><span class="${classeTipo}">${tipo === "entrada" ? "↑ Entrada" : "↓ Saída"}</span></td>
                <td title="${nomeCategoria(l.categoriaFinanceira_id)}">${nomeCategoria(l.categoriaFinanceira_id)}</td>
                <td>${nomeFormaPgto(l.formaPagamento_id)}</td>
                <td title="${l.Descricao}">${l.Descricao || "—"}</td>
                <td><span class="${classeValor}">${sinal} ${fmtMoeda(l.Valor)}</span></td>
            </tr>`;
        }).join('');
    }
    renderizarPaginacao("paginacao-lancamentos", lancamentos.length, paginaAtual, () => renderizarLancamentos());
}

// ──────────────────────────────────────────
// TABELA DE HISTÓRICO
// ──────────────────────────────────────────
function renderizarHistorico() {
    const tbody = document.querySelector("#tabela-historico tbody");
    const todos = [...caixas].reverse();

    if (todos.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="empty-state">Nenhum caixa anterior.</td></tr>`;
        return;
    }

    tbody.innerHTML = todos.map(c => {
        const resultado = c.saldoFinal - c.saldoInicial;
        const classeRes = resultado >= 0 ? "valor-entrada" : "valor-saida";
        return `<tr>
            <td><span class="status-pill ${c.fAtivo ? 'status-aberto' : 'status-fechado'}">${c.fAtivo ? 'Aberto' : 'Fechado'}</span></td>
            <td>${fmtDataHora(c.dthOpen)}</td>
            <td>${c.dthClose ? fmtDataHora(c.dthClose) : "—"}</td>
            <td>${fmtMoeda(c.saldoInicial)}</td>
            <td>${c.saldoFinal !== null ? fmtMoeda(c.saldoFinal) : "—"}</td>
            <td><span class="${classeRes}">${resultado >= 0 ? "+" : ""}${fmtMoeda(resultado)}</span></td>
            <td>Usuário #${c.usuario_open_id}</td>
        </tr>`;
    }).join('');
}

// ──────────────────────────────────────────
// PAGINAÇÃO
// ──────────────────────────────────────────
function renderizarPaginacao(containerId, total, pagina, onMudar) {
    const totalPaginas = Math.ceil(total / ITENS_POR_PAGINA);
    const inicio = total === 0 ? 0 : (pagina - 1) * ITENS_POR_PAGINA + 1;
    const fim = Math.min(pagina * ITENS_POR_PAGINA, total);

    const container = document.getElementById(containerId);
    container.querySelector(".paginacao-info").textContent =
        total === 0 ? "Nenhum registro" : `Mostrando ${inicio}–${fim} de ${total}`;

    const controles = container.querySelector(".paginacao-controles");
    controles.innerHTML = "";

    const btnAnterior = document.createElement("button");
    btnAnterior.className = "btn-pagina";
    btnAnterior.textContent = "‹";
    btnAnterior.disabled = pagina === 1;
    btnAnterior.addEventListener("click", () => { paginaAtual--; onMudar && onMudar(); });
    controles.appendChild(btnAnterior);

    for (let i = 1; i <= totalPaginas; i++) {
        const btn = document.createElement("button");
        btn.className = `btn-pagina${i === pagina ? " ativo" : ""}`;
        btn.textContent = i;
        btn.addEventListener("click", () => { paginaAtual = i; onMudar && onMudar(); });
        controles.appendChild(btn);
    }

    const btnProximo = document.createElement("button");
    btnProximo.className = "btn-pagina";
    btnProximo.textContent = "›";
    btnProximo.disabled = pagina === totalPaginas || totalPaginas === 0;
    btnProximo.addEventListener("click", () => { paginaAtual++; onMudar && onMudar(); });
    controles.appendChild(btnProximo);
}

// ──────────────────────────────────────────
// ABRIR CAIXA
// ──────────────────────────────────────────
function abrirModalAbrirCaixa() {
    document.getElementById("form-abrir-caixa").reset();
    document.getElementById("modal-abrir-caixa").classList.add("open");
}
function fecharModalAbrirCaixa() {
    document.getElementById("modal-abrir-caixa").classList.remove("open");
}

document.getElementById("form-abrir-caixa").addEventListener("submit", function(e) {
    e.preventDefault();
    caixaAtual = {
        idCaixa: Date.now(),
        usuario_open_id: 1,
        usuario_close_id: null,
        dthOpen: new Date().toISOString(),
        dthClose: null,
        saldoInicial: Number(document.getElementById("abrir-saldo-inicial").value) || 0,
        saldoFinal: null,
        idEmpresa: 1,
        fAtivo: true,
    };
    lancamentos = [];
    fecharModalAbrirCaixa();
    atualizarPainel();
});

// ──────────────────────────────────────────
// FECHAR CAIXA
// ──────────────────────────────────────────
function abrirModalFecharCaixa() {
    const saldo = calcularSaldo();
    document.getElementById("fechar-saldo-final").value = saldo.toFixed(2);
    document.getElementById("modal-fechar-caixa").classList.add("open");
}
function fecharModalFecharCaixa() {
    document.getElementById("modal-fechar-caixa").classList.remove("open");
}

document.getElementById("confirm-fechar-sim").addEventListener("click", function() {
    if (!caixaAtual) return;
    caixaAtual.fAtivo = false;
    caixaAtual.dthClose = new Date().toISOString();
    caixaAtual.saldoFinal = calcularSaldo();
    caixas.push({ ...caixaAtual });
    caixaAtual = null;
    lancamentos = [];
    fecharModalFecharCaixa();
    atualizarPainel();
});

// ──────────────────────────────────────────
// LANÇAMENTO (ENTRADA / SAÍDA)
// ──────────────────────────────────────────
let tipoLancamentoAtual = "entrada";

function abrirModalLancamento(tipo) {
    if (!caixaAtual || !caixaAtual.fAtivo) return;
    tipoLancamentoAtual = tipo;

    // Filtra categorias pelo tipo e apenas ativas
    const cats = categoriasFinanceiras.filter(c => c.Tipo === tipo && c.fAtivo);
    const select = document.getElementById("lanc-categoria");
    select.innerHTML = cats.map(c =>
        `<option value="${c.idCategoriaFinanceira}">${c.Nome}</option>`
    ).join('');

    // Formas de pagamento
    const selectFP = document.getElementById("lanc-formapgto");
    selectFP.innerHTML = formasPagamento.map(f => `<option value="${f.id}">${f.nome}</option>`).join('');

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

    document.getElementById("form-lancamento").reset();
    modal.classList.add("open");
}

function fecharModalLancamento() {
    document.getElementById("modal-lancamento").classList.remove("open");
}

document.getElementById("form-lancamento").addEventListener("submit", function(e) {
    e.preventDefault();
    lancamentos.unshift({
        idLancamento:          Date.now(),
        caixa_id:              caixaAtual.idCaixa,
        formaPagamento_id:     Number(document.getElementById("lanc-formapgto").value),
        usuario_id:            1,
        categoriaFinanceira_id: Number(document.getElementById("lanc-categoria").value),
        Valor:                 Number(document.getElementById("lanc-valor").value),
        DataHora:              new Date().toISOString(),
        Descricao:             document.getElementById("lanc-descricao").value,
        Referencia:            document.getElementById("lanc-referencia").value,
        Referencia_id:         null,
        Referencia_Tipo:       "",
        idEmpresa:             1,
    });
    fecharModalLancamento();
    atualizarPainel();
});

// Fechar modais clicando fora
["modal-abrir-caixa", "modal-fechar-caixa", "modal-lancamento"].forEach(id => {
    document.getElementById(id).addEventListener("click", function(e) {
        if (e.target !== this) return;
        if (id === "modal-abrir-caixa") fecharModalAbrirCaixa();
        else if (id === "modal-fechar-caixa") fecharModalFecharCaixa();
        else fecharModalLancamento();
    });
});

// ── INIT ──
mudarAba("lancamentos");
atualizarPainel();