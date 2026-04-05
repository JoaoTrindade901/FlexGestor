// ===== PEDIDO.JS =====

const ITENS_POR_PAGINA = 10;
let paginaAtual = 1;
let pedidosFiltrados = [];
let pedidoEmEdicao = null;
let pedidoParaCancelar = null;
let filtroStatusPedido = "todos";
let filtroClienteStr = "";
let itensPedidoAtual = [];
let pagamentosPedidoAtual = [];

// contexto dos modais de busca
let _buscaClientePrefixo = null;
let _buscaProdutoIdx = null;
let _buscaProdutoPrefixo = null;

// ── DADOS MOCKADOS ──
const statusPedidos = [
    { idStatusPedido: 1, Nome: "Aguardando",   Descricao: "Pedido aguardando confirmação", classe: "aguardando" },
    { idStatusPedido: 2, Nome: "Em andamento", Descricao: "Pedido em processamento",       classe: "andamento"  },
    { idStatusPedido: 3, Nome: "Concluído",    Descricao: "Pedido finalizado com sucesso", classe: "concluido"  },
    { idStatusPedido: 4, Nome: "Cancelado",    Descricao: "Pedido cancelado",              classe: "cancelado"  },
];

const formasPagamento = [
    { idFormaPagamento: 1, Nome: "Dinheiro",          fAtivo: true },
    { idFormaPagamento: 2, Nome: "Cartão de Crédito", fAtivo: true },
    { idFormaPagamento: 3, Nome: "Cartão de Débito",  fAtivo: true },
    { idFormaPagamento: 4, Nome: "PIX",               fAtivo: true },
    { idFormaPagamento: 5, Nome: "Boleto",            fAtivo: true },
    { idFormaPagamento: 6, Nome: "Transferência",     fAtivo: true },
];

const clientes = [
    { id: 1, nome: "João Silva",          doc: "123.456.789-00" },
    { id: 2, nome: "Tech Solutions Ltda", doc: "12.345.678/0001-99" },
    { id: 3, nome: "Maria Souza",         doc: "987.654.321-00" },
    { id: 4, nome: "Mercado Bom Ltda",    doc: "98.765.432/0001-11" },
    { id: 5, nome: "Carlos Lima",         doc: "456.123.789-00" },
    { id: 6, nome: "Ana Pereira",         doc: "321.654.987-00" },
];

const produtos = [
    { id: 1, nome: "Notebook Dell Inspiron 15", codigo: "NB-001", preco: 3500.00 },
    { id: 2, nome: "Mouse Logitech MX Master",  codigo: "MS-001", preco: 420.00  },
    { id: 3, nome: "Teclado Mecânico Redragon", codigo: "TC-001", preco: 280.00  },
    { id: 4, nome: "Monitor LG 24 pol.",         codigo: "MN-001", preco: 1200.00 },
    { id: 5, nome: "Headset Sony WH-1000XM4",   codigo: "HS-001", preco: 1800.00 },
    { id: 6, nome: "Webcam Logitech C920",       codigo: "WC-001", preco: 560.00  },
    { id: 7, nome: "SSD Samsung 1TB",            codigo: "SD-001", preco: 480.00  },
    { id: 8, nome: "Memória RAM 16GB DDR4",      codigo: "RM-001", preco: 320.00  },
];

let pedidos = [
    {
        idPedido: 1, numeroPedido: "PED-001", cliente_id: 1, usuario_id: 1,
        statusPedido_id: 3, dthPedido: "2026-03-10T10:00:00",
        valorTotal: 3920.00, Desconto: 0, Observacao: "Entrega urgente",
        endereco_id: 1, idEmpresa: 1,
        itens: [
            { idPedidoItem: 1, pedido_id: 1, produto_id: 1, Qtde: 1, precoUnit: 3500.00, Desconto: 0, Subtotal: 3500.00 },
            { idPedidoItem: 2, pedido_id: 1, produto_id: 2, Qtde: 1, precoUnit: 420.00,  Desconto: 0, Subtotal: 420.00  },
        ],
        pagamentos: [
            { idPagamento: 1, pedido_id: 1, formaPagamento_id: 4, valor: 3920.00, dthPagamento: "2026-03-11T09:00:00", empresa_id: 1 },
        ],
        historico: [
            { idHistorico: 1, pedido_id: 1, status_id: 1, usuario_id: 1, dthAltercacao: "2026-03-10T10:00:00", Observacao: "Pedido criado" },
            { idHistorico: 2, pedido_id: 1, status_id: 2, usuario_id: 1, dthAltercacao: "2026-03-10T14:00:00", Observacao: "Em separação" },
            { idHistorico: 3, pedido_id: 1, status_id: 3, usuario_id: 1, dthAltercacao: "2026-03-11T09:00:00", Observacao: "Entregue" },
        ]
    },
    {
        idPedido: 2, numeroPedido: "PED-002", cliente_id: 3, usuario_id: 1,
        statusPedido_id: 1, dthPedido: "2026-03-18T14:30:00",
        valorTotal: 280.00, Desconto: 0, Observacao: "",
        endereco_id: 2, idEmpresa: 1,
        itens: [
            { idPedidoItem: 3, pedido_id: 2, produto_id: 3, Qtde: 1, precoUnit: 280.00, Desconto: 0, Subtotal: 280.00 },
        ],
        pagamentos: [],
        historico: [
            { idHistorico: 4, pedido_id: 2, status_id: 1, usuario_id: 1, dthAltercacao: "2026-03-18T14:30:00", Observacao: "Pedido criado" },
        ]
    },
    {
        idPedido: 3, numeroPedido: "PED-003", cliente_id: 2, usuario_id: 1,
        statusPedido_id: 2, dthPedido: "2026-03-20T09:15:00",
        valorTotal: 2960.00, Desconto: 240.00, Observacao: "Cliente VIP",
        endereco_id: 3, idEmpresa: 1,
        itens: [
            { idPedidoItem: 5, pedido_id: 3, produto_id: 4, Qtde: 2, precoUnit: 1200.00, Desconto: 120.00, Subtotal: 2280.00 },
            { idPedidoItem: 6, pedido_id: 3, produto_id: 6, Qtde: 1, precoUnit: 560.00,  Desconto: 0,      Subtotal: 560.00  },
        ],
        pagamentos: [
            { idPagamento: 2, pedido_id: 3, formaPagamento_id: 2, valor: 1480.00, dthPagamento: "2026-03-21T08:00:00", empresa_id: 1 },
            { idPagamento: 3, pedido_id: 3, formaPagamento_id: 4, valor: 1480.00, dthPagamento: "2026-03-21T08:05:00", empresa_id: 1 },
        ],
        historico: [
            { idHistorico: 5, pedido_id: 3, status_id: 1, usuario_id: 1, dthAltercacao: "2026-03-20T09:15:00", Observacao: "Pedido criado" },
            { idHistorico: 6, pedido_id: 3, status_id: 2, usuario_id: 1, dthAltercacao: "2026-03-21T08:00:00", Observacao: "Em preparação" },
        ]
    },
    {
        idPedido: 4, numeroPedido: "PED-004", cliente_id: 5, usuario_id: 1,
        statusPedido_id: 4, dthPedido: "2026-03-15T11:00:00",
        valorTotal: 800.00, Desconto: 0, Observacao: "Cancelado a pedido do cliente",
        endereco_id: 4, idEmpresa: 1,
        itens: [
            { idPedidoItem: 7, pedido_id: 4, produto_id: 8, Qtde: 2, precoUnit: 320.00, Desconto: 0,      Subtotal: 640.00 },
            { idPedidoItem: 8, pedido_id: 4, produto_id: 3, Qtde: 1, precoUnit: 280.00, Desconto: 120.00, Subtotal: 160.00 },
        ],
        pagamentos: [],
        historico: [
            { idHistorico: 7, pedido_id: 4, status_id: 1, usuario_id: 1, dthAltercacao: "2026-03-15T11:00:00", Observacao: "Pedido criado" },
            { idHistorico: 8, pedido_id: 4, status_id: 4, usuario_id: 1, dthAltercacao: "2026-03-16T10:00:00", Observacao: "Cancelado pelo cliente" },
        ]
    },
];

// ── HELPERS ──
function nomeCliente(id) {
    const c = clientes.find(c => c.id === id);
    return c ? c.nome : `Cliente #${id}`;
}
function nomeProduto(id) {
    const p = produtos.find(p => p.id === id);
    return p ? p.nome : `Produto #${id}`;
}
function nomeFormaPagamento(id) {
    const f = formasPagamento.find(f => f.idFormaPagamento === id);
    return f ? f.Nome : `Forma #${id}`;
}
function statusInfo(id) {
    return statusPedidos.find(s => s.idStatusPedido === id) || { Nome: "—", classe: "" };
}
function fmtMoeda(v) {
    return `R$ ${Number(v).toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
}
function fmtData(s) { return new Date(s).toLocaleDateString("pt-BR"); }
function fmtDataHora(s) {
    return new Date(s).toLocaleString("pt-BR", { day:"2-digit", month:"2-digit", year:"numeric", hour:"2-digit", minute:"2-digit" });
}
function gerarNumero() {
    return `PED-${String(pedidos.length + 1).padStart(3, "0")}`;
}
function highlight(texto, busca) {
    if (!busca) return texto;
    const re = new RegExp(`(${busca.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return texto.replace(re, '<mark>$1</mark>');
}

// ── FILTROS ──
function aplicarFiltros() {
    pedidosFiltrados = pedidos.filter(p => {
        if (filtroStatusPedido !== "todos") {
            const s = statusInfo(p.statusPedido_id);
            if (s.classe !== filtroStatusPedido) return false;
        }
        if (filtroClienteStr) {
            const q    = filtroClienteStr.toLowerCase();
            const nome = nomeCliente(p.cliente_id).toLowerCase();
            const num  = p.numeroPedido.toLowerCase();
            if (!nome.includes(q) && !num.includes(q)) return false;
        }
        return true;
    });
    paginaAtual = 1;
    renderizarTabela();
}

function filtrarCliente() {
    filtroClienteStr = document.getElementById("input-busca-cliente").value.trim();
    aplicarFiltros();
}

function setFiltroStatus(valor) {
    filtroStatusPedido = valor;
    document.querySelectorAll(".btn-status-filtro").forEach(b =>
        b.classList.remove("sel-todos","sel-aguardando","sel-andamento","sel-concluido","sel-cancelado"));
    document.getElementById(`btn-f-${valor}`).classList.add(`sel-${valor}`);
    aplicarFiltros();
}

// ── TABELA ──
function renderizarTabela() {
    const tbody  = document.querySelector("#tabela-pedidos tbody");
    const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
    const pagina = pedidosFiltrados.slice(inicio, inicio + ITENS_POR_PAGINA);

    if (pagina.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="empty-state">Nenhum pedido encontrado.</td></tr>`;
    } else {
        tbody.innerHTML = pagina.map(p => {
            const st        = statusInfo(p.statusPedido_id);
            const cancelado = st.classe === "cancelado";
            return `<tr>
                <td class="area-acoes">
                    <button class="btn-acao btn-ver" title="Detalhes" onclick="abrirDetalhes(${p.idPedido})">
                        <i class="bi bi-eye-fill"></i>
                    </button>
                    ${!cancelado ? `
                    <button class="btn-acao btn-editar" title="Editar" onclick="abrirEdicao(${p.idPedido})">
                        <i class="bi bi-pencil-fill"></i>
                    </button>
                    <button class="btn-acao btn-cancelar" title="Cancelar" onclick="confirmarCancelamento(${p.idPedido})">
                        <i class="bi bi-x-circle-fill"></i>
                    </button>` : ''}
                </td>
                <td><strong>${p.numeroPedido}</strong></td>
                <td><span class="status-pill status-${st.classe}">${st.Nome}</span></td>
                <td title="${nomeCliente(p.cliente_id)}">${nomeCliente(p.cliente_id)}</td>
                <td>${fmtData(p.dthPedido)}</td>
                <td>${p.Desconto > 0 ? `<span class="desconto-valor">- ${fmtMoeda(p.Desconto)}</span>` : '—'}</td>
                <td><span class="valor-total">${fmtMoeda(p.valorTotal)}</span></td>
                <td title="${p.Observacao || ''}">${p.Observacao || '—'}</td>
            </tr>`;
        }).join('');
    }

    const total        = pedidosFiltrados.length;
    const totalPaginas = Math.ceil(total / ITENS_POR_PAGINA);
    const ini = total === 0 ? 0 : (paginaAtual - 1) * ITENS_POR_PAGINA + 1;
    const fim = Math.min(paginaAtual * ITENS_POR_PAGINA, total);
    document.querySelector(".paginacao-info").textContent =
        total === 0 ? "Nenhum registro" : `Mostrando ${ini}–${fim} de ${total} pedidos`;

    const controles = document.querySelector(".paginacao-controles");
    controles.innerHTML = "";
    controles.appendChild(criarBtn("‹", paginaAtual === 1, () => { paginaAtual--; renderizarTabela(); }));
    for (let i = 1; i <= totalPaginas; i++) {
        const btn = criarBtn(i, false, () => { paginaAtual = i; renderizarTabela(); });
        if (i === paginaAtual) btn.classList.add("ativo");
        controles.appendChild(btn);
    }
    controles.appendChild(criarBtn("›", paginaAtual === totalPaginas || totalPaginas === 0, () => { paginaAtual++; renderizarTabela(); }));
}

function criarBtn(label, disabled, onClick) {
    const btn = document.createElement("button");
    btn.className   = "btn-pagina";
    btn.textContent = label;
    btn.disabled    = disabled;
    btn.addEventListener("click", onClick);
    return btn;
}

function popularStatusSelect(prefixo) {
    const sel = document.getElementById(`${prefixo}-status`);
    if (sel) sel.innerHTML = statusPedidos.map(s =>
        `<option value="${s.idStatusPedido}">${s.Nome}</option>`).join('');
}

// ══════════════════════════════════════════
// ABAS
// ══════════════════════════════════════════
function mudarAba(prefixo, aba) {
    const modalId = prefixo === 'novo' ? 'modal-novo-pedido' : 'modal-edicao';
    document.querySelectorAll(`#${modalId} .tab-btn`).forEach(b => b.classList.remove("ativo"));
    document.querySelectorAll(`#${modalId} .tab-painel`).forEach(p => p.classList.remove("ativo"));
    document.getElementById(`tab-btn-${prefixo}-${aba}`).classList.add("ativo");
    document.getElementById(`tab-${prefixo}-${aba}`).classList.add("ativo");
    // Ao entrar na aba de pagamentos, re-renderiza para refletir total atualizado
    if (aba === 'pagamento') renderizarPagamentos(prefixo);
}

// ══════════════════════════════════════════
// PAGAMENTOS
// ══════════════════════════════════════════
function calcularTotalPedido(prefixo) {
    const subtotal      = itensPedidoAtual.reduce((acc, i) => acc + (i.Qtde * i.precoUnit), 0);
    const descontoItens = itensPedidoAtual.reduce((acc, i) => acc + i.Desconto, 0);
    const descontoGeral = Number(document.getElementById(`${prefixo}-desconto`)?.value || 0);
    return Math.max(subtotal - descontoItens - descontoGeral, 0);
}

function renderizarPagamentos(prefixo) {
    const lista  = document.getElementById(`${prefixo}-pagamentos-lista`);
    const resumo = document.getElementById(`${prefixo}-pagamentos-resumo`);
    if (!lista || !resumo) return;

    const totalPedido = calcularTotalPedido(prefixo);
    const totalPago   = pagamentosPedidoAtual.reduce((acc, p) => acc + p.valor, 0);
    const restante    = +(totalPedido - totalPago).toFixed(2);

    // ── Lista ──
    if (pagamentosPedidoAtual.length === 0) {
        lista.innerHTML = `
            <div class="pagamentos-empty">
                <i class="bi bi-credit-card"></i>
                <span>Nenhum pagamento registrado. Clique em "Adicionar Pagamento" para começar.</span>
            </div>`;
    } else {
        lista.innerHTML = pagamentosPedidoAtual.map((pag, idx) => `
            <div class="pagamento-item">
                <div class="pagamento-item-forma">
                    <label class="pagamento-label">Forma de Pagamento</label>
                    <select class="pagamento-select"
                        onchange="atualizarPagamento(${idx}, 'formaPagamento_id', this.value, '${prefixo}')">
                        ${formasPagamento.filter(f => f.fAtivo).map(f => `
                            <option value="${f.idFormaPagamento}"
                                ${pag.formaPagamento_id === f.idFormaPagamento ? 'selected' : ''}>
                                ${f.Nome}
                            </option>
                        `).join('')}
                    </select>
                </div>
                <div class="pagamento-item-valor">
                    <label class="pagamento-label">Valor</label>
                    <div class="pagamento-valor-wrap">
                        <span class="pagamento-cifrao">R$</span>
                        <input type="number" min="0" step="0.01" class="pagamento-valor-input"
                            value="${pag.valor}"
                            onchange="atualizarPagamento(${idx}, 'valor', this.value, '${prefixo}')">
                    </div>
                </div>
                <div class="pagamento-item-data">
                    <label class="pagamento-label">Data do Pagamento</label>
                    <input type="datetime-local" class="pagamento-data-input"
                        value="${pag.dthPagamento ? pag.dthPagamento.slice(0,16) : ''}"
                        onchange="atualizarPagamento(${idx}, 'dthPagamento', this.value, '${prefixo}')">
                </div>
                <div class="pagamento-item-del">
                    <button type="button" class="btn-del-item" title="Remover"
                        onclick="removerPagamento(${idx}, '${prefixo}')">
                        <i class="bi bi-trash3-fill"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    // ── Resumo ──
    let statusClass, statusLabel, statusIcon;
    if (Math.abs(restante) < 0.01) {
        statusClass = 'quitado';  statusLabel = 'Pedido quitado';      statusIcon = 'bi-check-circle-fill';
    } else if (restante < 0) {
        statusClass = 'excede';   statusLabel = 'Valor excede o total'; statusIcon = 'bi-exclamation-triangle-fill';
    } else {
        statusClass = 'pendente'; statusLabel = 'Valor restante';       statusIcon = 'bi-clock-fill';
    }

    resumo.innerHTML = `
        <div class="pagamentos-resumo-grid">
            <div class="pag-resumo-item">
                <span class="pag-resumo-label">Total do pedido</span>
                <span class="pag-resumo-valor">${fmtMoeda(totalPedido)}</span>
            </div>
            <div class="pag-resumo-item">
                <span class="pag-resumo-label">Total pago</span>
                <span class="pag-resumo-valor">${fmtMoeda(totalPago)}</span>
            </div>
            <div class="pag-resumo-item pag-resumo-${statusClass}">
                <span class="pag-resumo-label"><i class="bi ${statusIcon}"></i> ${statusLabel}</span>
                <span class="pag-resumo-valor">${fmtMoeda(Math.abs(restante))}</span>
            </div>
        </div>`;
}

function adicionarPagamento(prefixo) {
    const totalPedido = calcularTotalPedido(prefixo);
    const totalPago   = pagamentosPedidoAtual.reduce((acc, p) => acc + p.valor, 0);
    const sugestao    = Math.max(+(totalPedido - totalPago).toFixed(2), 0);

    pagamentosPedidoAtual.push({
        idPagamento:       Date.now(),
        formaPagamento_id: formasPagamento.find(f => f.fAtivo)?.idFormaPagamento || 1,
        valor:             sugestao,
        dthPagamento:      new Date().toISOString().slice(0, 16),
        empresa_id:        1,
    });
    renderizarPagamentos(prefixo);
}

function removerPagamento(idx, prefixo) {
    pagamentosPedidoAtual.splice(idx, 1);
    renderizarPagamentos(prefixo);
}

function atualizarPagamento(idx, campo, valor, prefixo) {
    pagamentosPedidoAtual[idx][campo] = (campo === 'valor' || campo === 'formaPagamento_id')
        ? Number(valor) : valor;
    renderizarPagamentos(prefixo);
}

// ══════════════════════════════════════════
// MODAL BUSCA DE CLIENTE
// ══════════════════════════════════════════
function abrirBuscaCliente(prefixo) {
    _buscaClientePrefixo = prefixo;
    document.getElementById("input-busca-cliente-modal").value = "";
    renderListaClientes(clientes, "");
    document.getElementById("modal-busca-cliente").classList.add("open");
    setTimeout(() => document.getElementById("input-busca-cliente-modal").focus(), 80);
}
function fecharBuscaCliente() {
    document.getElementById("modal-busca-cliente").classList.remove("open");
    _buscaClientePrefixo = null;
}
function filtrarListaClientes(q) {
    const lista = q
        ? clientes.filter(c =>
            c.nome.toLowerCase().includes(q.toLowerCase()) ||
            c.doc.replace(/\D/g, '').includes(q.replace(/\D/g, '')) ||
            c.doc.toLowerCase().includes(q.toLowerCase()))
        : clientes;
    renderListaClientes(lista, q);
}
function renderListaClientes(lista, q) {
    const el = document.getElementById("lista-busca-clientes");
    if (lista.length === 0) {
        el.innerHTML = `<div class="busca-vazia"><i class="bi bi-person-x"></i>Nenhum cliente encontrado</div>`;
        return;
    }
    el.innerHTML = lista.map(c => `
        <div class="busca-item" onclick="selecionarCliente(${c.id})">
            <div class="busca-item-info">
                <span class="busca-item-nome">${highlight(c.nome, q)}</span>
                <span class="busca-item-sub">${highlight(c.doc, q)}</span>
            </div>
            <i class="bi bi-chevron-right" style="color:#9ca3af;font-size:1.4rem"></i>
        </div>
    `).join('');
}
function selecionarCliente(id) {
    const c = clientes.find(c => c.id === id);
    if (!c || !_buscaClientePrefixo) return;
    document.getElementById(`${_buscaClientePrefixo}-cliente-nome`).value = c.nome;
    document.getElementById(`${_buscaClientePrefixo}-cliente-id`).value   = c.id;
    fecharBuscaCliente();
}

// ══════════════════════════════════════════
// MODAL BUSCA DE PRODUTO
// ══════════════════════════════════════════
function abrirBuscaProduto(idx, prefixo) {
    _buscaProdutoIdx     = idx;
    _buscaProdutoPrefixo = prefixo;
    document.getElementById("input-busca-produto-modal").value = "";
    renderListaProdutos(produtos, "");
    document.getElementById("modal-busca-produto").classList.add("open");
    setTimeout(() => document.getElementById("input-busca-produto-modal").focus(), 80);
}
function fecharBuscaProduto() {
    document.getElementById("modal-busca-produto").classList.remove("open");
    if (_buscaProdutoIdx !== null) {
        const item = itensPedidoAtual[_buscaProdutoIdx];
        if (item && item.produto_id === null) {
            itensPedidoAtual.splice(_buscaProdutoIdx, 1);
            renderizarItens(_buscaProdutoPrefixo);
        }
    }
    _buscaProdutoIdx     = null;
    _buscaProdutoPrefixo = null;
}
function filtrarListaProdutos(q) {
    const lista = q
        ? produtos.filter(p =>
            p.nome.toLowerCase().includes(q.toLowerCase()) ||
            p.codigo.toLowerCase().includes(q.toLowerCase()))
        : produtos;
    renderListaProdutos(lista, q);
}
function renderListaProdutos(lista, q) {
    const el = document.getElementById("lista-busca-produtos");
    if (lista.length === 0) {
        el.innerHTML = `<div class="busca-vazia"><i class="bi bi-box-seam"></i>Nenhum produto encontrado</div>`;
        return;
    }
    el.innerHTML = lista.map(p => `
        <div class="busca-item" onclick="selecionarProduto(${p.id})">
            <div class="busca-item-info">
                <span class="busca-item-nome">${highlight(p.nome, q)}</span>
                <span class="busca-item-sub">Cód: ${highlight(p.codigo, q)}</span>
            </div>
            <span class="busca-item-preco">${fmtMoeda(p.preco)}</span>
        </div>
    `).join('');
}
function selecionarProduto(id) {
    const p = produtos.find(p => p.id === id);
    if (!p || _buscaProdutoIdx === null) return;
    const item      = itensPedidoAtual[_buscaProdutoIdx];
    item.produto_id = p.id;
    item.precoUnit  = p.preco;
    item.Subtotal   = (item.Qtde * item.precoUnit) - item.Desconto;
    renderizarItens(_buscaProdutoPrefixo);
    const prefixo = _buscaProdutoPrefixo;
    _buscaProdutoIdx     = null;
    _buscaProdutoPrefixo = null;
    document.getElementById("modal-busca-produto").classList.remove("open");
}

// ── ITENS DO PEDIDO ──
function renderizarItens(prefixo) {
    const tbody = document.getElementById(`${prefixo}-itens-body`);
    if (!tbody) return;
    tbody.innerHTML = itensPedidoAtual.map((item, idx) => `
        <tr>
            <td class="col-produto">
                <div class="produto-cell">
                    <input type="text" readonly
                        value="${item.produto_id !== null ? nomeProduto(item.produto_id) : ''}"
                        placeholder="Selecionar produto..."
                        onclick="abrirBuscaProduto(${idx}, '${prefixo}')">
                    <button type="button" class="btn-buscar-produto"
                        onclick="abrirBuscaProduto(${idx}, '${prefixo}')" title="Buscar produto">
                        <i class="bi bi-search"></i>
                    </button>
                </div>
            </td>
            <td class="col-qtde">
                <input type="number" min="1" value="${item.Qtde}"
                    onchange="atualizarItem(${idx}, 'Qtde', this.value, '${prefixo}')">
            </td>
            <td class="col-preco">
                <input type="number" min="0" step="0.01" value="${item.precoUnit}"
                    onchange="atualizarItem(${idx}, 'precoUnit', this.value, '${prefixo}')">
            </td>
            <td class="col-desc">
                <input type="number" min="0" step="0.01" value="${item.Desconto}"
                    onchange="atualizarItem(${idx}, 'Desconto', this.value, '${prefixo}')">
            </td>
            <td class="col-sub subtotal-label">${fmtMoeda(item.Subtotal)}</td>
            <td class="col-del">
                <button type="button" class="btn-del-item" onclick="removerItem(${idx}, '${prefixo}')">
                    <i class="bi bi-trash3-fill"></i>
                </button>
            </td>
        </tr>
    `).join('');
    atualizarResumo(prefixo);
}

function atualizarItem(idx, campo, valor, prefixo) {
    const item  = itensPedidoAtual[idx];
    item[campo] = Number(valor);
    item.Subtotal = (item.Qtde * item.precoUnit) - item.Desconto;
    renderizarItens(prefixo);
}

function adicionarItem(prefixo) {
    const novoIdx = itensPedidoAtual.length;
    itensPedidoAtual.push({ idPedidoItem: Date.now(), produto_id: null, Qtde: 1, precoUnit: 0, Desconto: 0, Subtotal: 0 });
    renderizarItens(prefixo);
    abrirBuscaProduto(novoIdx, prefixo);
}

function removerItem(idx, prefixo) {
    itensPedidoAtual.splice(idx, 1);
    renderizarItens(prefixo);
}

function atualizarResumo(prefixo) {
    const subtotal      = itensPedidoAtual.reduce((acc, i) => acc + (i.Qtde * i.precoUnit), 0);
    const descontoItens = itensPedidoAtual.reduce((acc, i) => acc + i.Desconto, 0);
    const descontoGeral = Number(document.getElementById(`${prefixo}-desconto`)?.value || 0);
    const total         = subtotal - descontoItens - descontoGeral;
    const el = id => document.getElementById(`${prefixo}-resumo-${id}`);
    if (el("subtotal"))   el("subtotal").textContent   = fmtMoeda(subtotal);
    if (el("desc-itens")) el("desc-itens").textContent = `- ${fmtMoeda(descontoItens)}`;
    if (el("desc-geral")) el("desc-geral").textContent = `- ${fmtMoeda(descontoGeral)}`;
    if (el("total"))      el("total").textContent      = fmtMoeda(Math.max(total, 0));
}

// ── MODAL NOVO PEDIDO ──
function abrirModal() {
    document.getElementById("form-pedido").reset();
    document.getElementById("novo-cliente-nome").value = "";
    document.getElementById("novo-cliente-id").value   = "";
    itensPedidoAtual      = [];
    pagamentosPedidoAtual = [];
    mudarAba("novo", "pedido");
    renderizarItens("novo");
    renderizarPagamentos("novo");
    document.getElementById("modal-novo-pedido").classList.add("open");
}
function fecharModal() {
    document.getElementById("modal-novo-pedido").classList.remove("open");
}

document.getElementById("form-pedido").addEventListener("submit", function(e) {
    e.preventDefault();
    const clienteId = Number(document.getElementById("novo-cliente-id").value);
    if (!clienteId) { alert("Selecione um cliente para o pedido."); return; }
    itensPedidoAtual = itensPedidoAtual.filter(i => i.produto_id !== null);
    if (itensPedidoAtual.length === 0) { alert("Adicione pelo menos um item ao pedido."); return; }

    const desconto = Number(document.getElementById("novo-desconto").value) || 0;
    const subtotal = itensPedidoAtual.reduce((a, i) => a + i.Subtotal, 0);
    const total    = subtotal - desconto;

    const novo = {
        idPedido:        Date.now(),
        numeroPedido:    gerarNumero(),
        cliente_id:      clienteId,
        usuario_id:      1,
        statusPedido_id: 1,
        dthPedido:       new Date().toISOString(),
        valorTotal:      Math.max(total, 0),
        Desconto:        desconto,
        Observacao:      document.getElementById("novo-obs").value,
        endereco_id:     1,
        idEmpresa:       1,
        itens:           [...itensPedidoAtual],
        pagamentos:      [...pagamentosPedidoAtual],
        historico: [{
            idHistorico:   Date.now(),
            pedido_id:     Date.now(),
            status_id:     1,
            usuario_id:    1,
            dthAltercacao: new Date().toISOString(),
            Observacao:    "Pedido criado"
        }],
    };
    pedidos.unshift(novo);
    aplicarFiltros();
    fecharModal();
});

// ── MODAL EDIÇÃO ──
function abrirEdicao(id) {
    pedidoEmEdicao = pedidos.find(p => p.idPedido === id);
    if (!pedidoEmEdicao) return;
    popularStatusSelect("edit");
    document.getElementById("edit-status").value       = pedidoEmEdicao.statusPedido_id;
    document.getElementById("edit-cliente-nome").value = nomeCliente(pedidoEmEdicao.cliente_id);
    document.getElementById("edit-cliente-id").value   = pedidoEmEdicao.cliente_id;
    document.getElementById("edit-desconto").value     = pedidoEmEdicao.Desconto;
    document.getElementById("edit-obs").value          = pedidoEmEdicao.Observacao;
    document.getElementById("edit-numero").value       = pedidoEmEdicao.numeroPedido;
    itensPedidoAtual      = pedidoEmEdicao.itens.map(i => ({ ...i }));
    pagamentosPedidoAtual = (pedidoEmEdicao.pagamentos || []).map(p => ({ ...p }));
    mudarAba("edit", "pedido");
    renderizarItens("edit");
    renderizarPagamentos("edit");
    document.getElementById("modal-edicao").classList.add("open");
}
function fecharEdicao() {
    document.getElementById("modal-edicao").classList.remove("open");
    pedidoEmEdicao = null;
}

document.getElementById("form-edicao").addEventListener("submit", function(e) {
    e.preventDefault();
    if (!pedidoEmEdicao) return;
    const clienteId = Number(document.getElementById("edit-cliente-id").value);
    if (!clienteId) { alert("Selecione um cliente."); return; }
    itensPedidoAtual = itensPedidoAtual.filter(i => i.produto_id !== null);
    if (itensPedidoAtual.length === 0) { alert("Adicione pelo menos um item."); return; }

    const novoStatus = Number(document.getElementById("edit-status").value);
    const desconto   = Number(document.getElementById("edit-desconto").value) || 0;
    const subtotal   = itensPedidoAtual.reduce((a, i) => a + i.Subtotal, 0);

    if (novoStatus !== pedidoEmEdicao.statusPedido_id) {
        pedidoEmEdicao.historico.push({
            idHistorico:   Date.now(),
            pedido_id:     pedidoEmEdicao.idPedido,
            status_id:     novoStatus,
            usuario_id:    1,
            dthAltercacao: new Date().toISOString(),
            Observacao:    `Status alterado para "${statusInfo(novoStatus).Nome}"`,
        });
    }
    Object.assign(pedidoEmEdicao, {
        cliente_id:      clienteId,
        statusPedido_id: novoStatus,
        Desconto:        desconto,
        Observacao:      document.getElementById("edit-obs").value,
        valorTotal:      Math.max(subtotal - desconto, 0),
        itens:           [...itensPedidoAtual],
        pagamentos:      [...pagamentosPedidoAtual],
    });
    aplicarFiltros();
    fecharEdicao();
});

// ── MODAL DETALHES ──
function abrirDetalhes(id) {
    const p = pedidos.find(p => p.idPedido === id);
    if (!p) return;
    const st = statusInfo(p.statusPedido_id);

    document.getElementById("det-numero").textContent   = p.numeroPedido;
    document.getElementById("det-status").innerHTML     = `<span class="status-pill status-${st.classe}">${st.Nome}</span>`;
    document.getElementById("det-cliente").textContent  = nomeCliente(p.cliente_id);
    document.getElementById("det-data").textContent     = fmtDataHora(p.dthPedido);
    document.getElementById("det-desconto").textContent = p.Desconto > 0 ? fmtMoeda(p.Desconto) : "—";
    document.getElementById("det-total").textContent    = fmtMoeda(p.valorTotal);
    document.getElementById("det-obs").textContent      = p.Observacao || "—";

    document.getElementById("det-itens-body").innerHTML = p.itens.map(i => `
        <tr>
            <td>${nomeProduto(i.produto_id)}</td>
            <td style="text-align:center">${i.Qtde}</td>
            <td>${fmtMoeda(i.precoUnit)}</td>
            <td>${i.Desconto > 0 ? fmtMoeda(i.Desconto) : '—'}</td>
            <td style="font-weight:700">${fmtMoeda(i.Subtotal)}</td>
        </tr>
    `).join('');

    // Pagamentos no modal de detalhes
    const pagamentos = p.pagamentos || [];
    const totalPago  = pagamentos.reduce((acc, pag) => acc + pag.valor, 0);
    const restante   = +(p.valorTotal - totalPago).toFixed(2);
    let badgeClass, badgeLabel;
    if (Math.abs(restante) < 0.01)  { badgeClass = "concluido";  badgeLabel = "Quitado"; }
    else if (restante < 0)           { badgeClass = "cancelado";  badgeLabel = "Valor excedido"; }
    else                             { badgeClass = "aguardando"; badgeLabel = "Pendente"; }

    document.getElementById("det-pagamentos").innerHTML = pagamentos.length === 0
        ? `<div class="pagamentos-empty" style="margin-bottom:1.6rem">
               <i class="bi bi-credit-card"></i>
               <span>Nenhum pagamento registrado para este pedido.</span>
           </div>`
        : `<table class="table-itens" style="margin-bottom:1rem">
               <thead>
                   <tr>
                       <th>Forma de Pagamento</th>
                       <th>Data</th>
                       <th style="text-align:right">Valor</th>
                   </tr>
               </thead>
               <tbody>
                   ${pagamentos.map(pag => `
                       <tr>
                           <td>${nomeFormaPagamento(pag.formaPagamento_id)}</td>
                           <td>${pag.dthPagamento ? fmtDataHora(pag.dthPagamento) : '—'}</td>
                           <td style="text-align:right;font-weight:700;color:#1e3c72">${fmtMoeda(pag.valor)}</td>
                       </tr>
                   `).join('')}
               </tbody>
           </table>
           <div class="det-pagamentos-rodape">
               <span>Total pago: <strong>${fmtMoeda(totalPago)}</strong></span>
               <span class="status-pill status-${badgeClass}">${badgeLabel}</span>
           </div>`;

    document.getElementById("det-historico").innerHTML = p.historico.map(h => {
        const s = statusInfo(h.status_id);
        return `
        <div class="historico-item">
            <div class="historico-dot"><i class="bi bi-check-lg"></i></div>
            <div class="historico-conteudo">
                <div class="historico-status">${s.Nome}</div>
                <div class="historico-data">${fmtDataHora(h.dthAltercacao)}</div>
                ${h.Observacao ? `<div class="historico-obs">${h.Observacao}</div>` : ''}
            </div>
        </div>`;
    }).join('');

    document.getElementById("modal-detalhes").classList.add("open");
}
function fecharDetalhes() {
    document.getElementById("modal-detalhes").classList.remove("open");
}

// ── CANCELAMENTO ──
function confirmarCancelamento(id) {
    pedidoParaCancelar = pedidos.find(p => p.idPedido === id);
    if (!pedidoParaCancelar) return;
    document.getElementById("confirm-mensagem").innerHTML =
        `Deseja <strong>cancelar</strong> o pedido <strong>${pedidoParaCancelar.numeroPedido}</strong>?`;
    document.getElementById("modal-confirmar").classList.add("open");
}
function fecharConfirmar() {
    document.getElementById("modal-confirmar").classList.remove("open");
    pedidoParaCancelar = null;
}

document.getElementById("confirm-btn-sim").addEventListener("click", function() {
    if (!pedidoParaCancelar) return;
    pedidoParaCancelar.historico.push({
        idHistorico:   Date.now(),
        pedido_id:     pedidoParaCancelar.idPedido,
        status_id:     4,
        usuario_id:    1,
        dthAltercacao: new Date().toISOString(),
        Observacao:    "Pedido cancelado",
    });
    pedidoParaCancelar.statusPedido_id = 4;
    aplicarFiltros();
    fecharConfirmar();
});

// ── FECHAR MODAIS CLICANDO FORA ──
["modal-novo-pedido", "modal-edicao", "modal-detalhes", "modal-confirmar"].forEach(id => {
    document.getElementById(id).addEventListener("click", function(e) {
        if (e.target !== this) return;
        if (id === "modal-novo-pedido") fecharModal();
        else if (id === "modal-edicao")   fecharEdicao();
        else if (id === "modal-detalhes") fecharDetalhes();
        else fecharConfirmar();
    });
});
document.getElementById("modal-busca-cliente").addEventListener("click", function(e) {
    if (e.target === this) fecharBuscaCliente();
});
document.getElementById("modal-busca-produto").addEventListener("click", function(e) {
    if (e.target === this) fecharBuscaProduto();
});

// ── INIT ──
document.getElementById("btn-f-todos").classList.add("sel-todos");
pedidosFiltrados = [...pedidos];
renderizarTabela();