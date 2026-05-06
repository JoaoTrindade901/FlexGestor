// Arquivo responsável por gerenciar as categorias de despesa no sistema (CRUD + filtros + paginação)

let todasDespesas = []; // Lista completa vinda do backend
let filtroStatus = 'todos'; // Filtro atual de status (todos | ativo | inativo)
let filtroTexto = ''; // Texto digitado para busca
let acaoConfirmar = null; // Função temporária usada no modal de confirmação

const PAG = 15; // Quantidade de itens por página
let pagAtual = 1; // Página atual da listagem

// Função genérica para requisições GET
async function apiGet(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`GET ${url} → ${res.status}`);
    return res.json();
}

// Função genérica para requisições POST
async function apiPost(url, body) {
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    if (!res.ok) {
        const t = await res.text().catch(() => '');
        throw new Error(t || `POST ${url} → ${res.status}`);
    }
    return res;
}

// Função responsável por exibir mensagens toast (feedback visual ao usuário)
function flexToast(msg, tipo = 'sucesso') {
    const cores = { sucesso: '#15803d', erro: '#dc2626', aviso: '#d97706' };
    const icones = { sucesso: 'bi-check-circle-fill', erro: 'bi-x-circle-fill', aviso: 'bi-exclamation-triangle-fill' };

    const t = document.createElement('div');
    t.style.cssText = `position:fixed;top:2rem;right:2rem;background:${cores[tipo]};color:#fff;
        padding:1.2rem 1.8rem;border-radius:.8rem;font-size:1.4rem;font-family:'Segoe UI',sans-serif;
        display:flex;align-items:center;gap:.8rem;box-shadow:0 .6rem 2rem rgba(0,0,0,.2);
        z-index:9999;opacity:0;transform:translateY(-1rem);transition:all .3s ease;max-width:36rem;`;

    t.innerHTML = `<i class="bi ${icones[tipo]}"></i><span>${msg}</span>`;
    document.body.appendChild(t);

    // Animação de entrada
    requestAnimationFrame(() => {
        t.style.opacity = '1';
        t.style.transform = 'translateY(0)';
    });

    // Remove após alguns segundos
    setTimeout(() => {
        t.style.opacity = '0';
        t.style.transform = 'translateY(-1rem)';
        setTimeout(() => t.remove(), 350);
    }, 3200);
}

// Carrega as despesas do backend e reseta a paginação
async function carregar() {
    todasDespesas = await apiGet('/Despesa/Listar').catch(() => []);
    pagAtual = 1;
    renderizar();
}

// Atualiza o filtro de texto conforme o usuário digita
function filtrar() {
    filtroTexto = document.getElementById('input-busca').value;
    pagAtual = 1;
    renderizar();
}

// Define o filtro de status (ativo/inativo/todos) e atualiza o visual dos botões
function setFiltroStatus(valor) {
    filtroStatus = valor;

    document.querySelectorAll('.btn-status-filtro').forEach(b =>
        b.classList.remove('ativo-sel', 'ativo-on', 'ativo-off')
    );

    const mapa = {
        todos: 'ativo-sel',
        ativo: 'ativo-on',
        inativo: 'ativo-off'
    };

    document.getElementById(`btn-filtro-${valor}`)?.classList.add(mapa[valor]);

    pagAtual = 1;
    renderizar();
}

// Renderiza a tabela com base nos filtros e paginação
function renderizar() {
    const termo = filtroTexto.toLowerCase();

    // Aplica filtros na lista
    const lista = todasDespesas.filter(d => {
        if (filtroStatus === 'ativo' && !d.fAtivo) return false;
        if (filtroStatus === 'inativo' && d.fAtivo) return false;
        if (termo && !d.nome.toLowerCase().includes(termo)) return false;
        return true;
    });

    const tbody = document.getElementById('tbody-despesa');
    const total = lista.length;

    // Calcula os itens da página atual
    const inicio = (pagAtual - 1) * PAG;
    const pagina = lista.slice(inicio, inicio + PAG);

    // Caso não tenha dados
    if (!pagina.length) {
        tbody.innerHTML = `<tr><td colspan="3" class="empty-state">Nenhuma categoria encontrada.</td></tr>`;
        document.getElementById('pag-info').textContent = '';
        document.getElementById('pag-ctrl').innerHTML = '';
        return;
    }

    // Monta HTML da tabela
    tbody.innerHTML = pagina.map(d => `
        <tr>
            <td class="area-acoes">
                <button class="btn-acao btn-editar" title="Editar"
                    onclick="abrirModalEditar(${d.idCategoriaFinanceira})">
                    <i class="bi bi-pencil-fill"></i>
                </button>

                ${d.fAtivo
            ? `<button class="btn-acao btn-inativar" title="Inativar"
                        onclick="confirmarStatus(${d.idCategoriaFinanceira}, true, '${d.nome.replace(/'/g, "\\'")}')">
                        <i class="bi bi-slash-circle-fill"></i>
                    </button>`
            : `<button class="btn-acao btn-reativar" title="Ativar"
                        onclick="confirmarStatus(${d.idCategoriaFinanceira}, false, '${d.nome.replace(/'/g, "\\'")}')">
                        <i class="bi bi-check-circle-fill"></i>
                    </button>`
        }
            </td>

            <td>
                <span class="status-pill ${d.fAtivo ? 'status-ativo' : 'status-inativo'}">
                    ${d.fAtivo ? 'Ativo' : 'Inativo'}
                </span>
            </td>

            <td>${d.nome}</td>
        </tr>
    `).join('');

    // Atualiza informações de paginação
    const totalPags = Math.ceil(total / PAG);
    const ini = inicio + 1;
    const fim = Math.min(inicio + PAG, total);

    document.getElementById('pag-info').textContent =
        `Mostrando ${ini}–${fim} de ${total}`;

    // Cria botões de paginação
    const ctrl = document.getElementById('pag-ctrl');
    ctrl.innerHTML = '';

    const prev = document.createElement('button');
    prev.className = 'btn-pagina';
    prev.textContent = '‹';
    prev.disabled = pagAtual === 1;
    prev.onclick = () => { pagAtual--; renderizar(); };
    ctrl.appendChild(prev);

    for (let i = 1; i <= totalPags; i++) {
        const btn = document.createElement('button');
        btn.className = `btn-pagina${i === pagAtual ? ' ativo' : ''}`;
        btn.textContent = i;
        btn.onclick = () => { pagAtual = i; renderizar(); };
        ctrl.appendChild(btn);
    }

    const next = document.createElement('button');
    next.className = 'btn-pagina';
    next.textContent = '›';
    next.disabled = pagAtual >= totalPags;
    next.onclick = () => { pagAtual++; renderizar(); };
    ctrl.appendChild(next);
}

// Abre o modal para criar nova categoria
function abrirModal() {
    document.getElementById('despesa-id').value = '';
    document.getElementById('despesa-nome').value = '';

    document.getElementById('modal-despesa-titulo').innerHTML =
        '<i class="bi bi-tag-fill"></i> Nova Categoria de Despesa';

    document.getElementById('modal-despesa').classList.add('open');

    setTimeout(() =>
        document.getElementById('despesa-nome').focus(), 80);
}

// Abre o modal já preenchido para edição
function abrirModalEditar(id) {
    const d = todasDespesas.find(x => x.idCategoriaFinanceira === id);
    if (!d) return;

    document.getElementById('despesa-id').value = id;
    document.getElementById('despesa-nome').value = d.nome;

    document.getElementById('modal-despesa-titulo').innerHTML =
        '<i class="bi bi-pencil-fill"></i> Editar Categoria de Despesa';

    document.getElementById('modal-despesa').classList.add('open');

    setTimeout(() =>
        document.getElementById('despesa-nome').focus(), 80);
}

// Fecha o modal de cadastro/edição
function fecharModal() {
    document.getElementById('modal-despesa').classList.remove('open');
}

// Salva a categoria (criar ou editar)
async function salvar() {
    const id = Number(document.getElementById('despesa-id').value) || 0;
    const nome = document.getElementById('despesa-nome').value.trim();

    if (!nome) {
        flexToast('Informe o nome da categoria.', 'aviso');
        return;
    }

    try {
        if (id) {
            await apiPost('/Despesa/Editar', { Id: id, Nome: nome });
            flexToast('Categoria atualizada!', 'sucesso');
        } else {
            await apiPost('/Despesa/Criar', { Nome: nome });
            flexToast('Categoria criada!', 'sucesso');
        }

        fecharModal();
        await carregar();
    } catch (err) {
        flexToast('Erro: ' + err.message, 'erro');
    }
}

// Abre modal de confirmação para ativar/inativar
function confirmarStatus(id, ativo, nome) {
    const acao = ativo ? 'inativar' : 'ativar';

    document.getElementById('confirmar-msg').textContent =
        `Deseja ${acao} a categoria "${nome}"?`;

    document.getElementById('btn-confirmar-ok').textContent =
        `Sim, ${acao}`;

    // Define ação que será executada ao confirmar
    acaoConfirmar = async () => {
        try {
            await apiPost('/Despesa/AlterarStatus', {
                Id: id,
                Ativo: !ativo
            });

            flexToast(
                `Categoria ${!ativo ? 'ativada' : 'inativada'} com sucesso.`,
                'sucesso'
            );

            fecharModalConfirmar();
            await carregar();
        } catch (err) {
            flexToast('Erro: ' + err.message, 'erro');
        }
    };

    document.getElementById('modal-confirmar').classList.add('open');
}

// Fecha modal de confirmação
function fecharModalConfirmar() {
    document.getElementById('modal-confirmar').classList.remove('open');
    acaoConfirmar = null;
}

// Inicialização do módulo ao carregar a página
document.addEventListener('DOMContentLoaded', () => {

    // Botão de confirmação do modal
    document.getElementById('btn-confirmar-ok')
        .addEventListener('click', () => {
            if (acaoConfirmar) acaoConfirmar();
        });

    // Fecha modal ao clicar fora dele
    document.getElementById('modal-despesa')?.addEventListener('click', function (e) {
        if (e.target === this) fecharModal();
    });

    document.getElementById('modal-confirmar')?.addEventListener('click', function (e) {
        if (e.target === this) fecharModalConfirmar();
    });

    // Define filtro inicial como ativo
    setFiltroStatus('ativo');

    // Carrega dados iniciais
    carregar();
});