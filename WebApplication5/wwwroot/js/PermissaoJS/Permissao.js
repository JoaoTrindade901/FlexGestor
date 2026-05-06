let listalistaCargos = [];
let listaMenus = [];
let listaCampos = [];
let cargoAtual = null;

// Mapeamento de rotas para ícones (usando Bootstrap Icons)
const MENU_ICONES = {
    'Home': 'bi-house-fill', 'Usuario': 'bi-person-fill',
    'Cliente': 'bi-people-fill', 'Pedido': 'bi-bag-fill',
    'Caixa': 'bi-cash-coin', 'Estoque': 'bi-boxes',
    'Auditoria': 'bi-shield-check', 'Fornecedor': 'bi-building',
    'CategoriaProduto': 'bi-tag-fill', 'ML': 'bi-graph-up-arrow',
    'Permissao': 'bi-shield-lock-fill', 'Financeiro': 'bi-bank',
    'Despesa': 'bi-receipt', 'Produto': 'bi-box-seam',
    'EstoqueHistorico': 'bi-clock-history',
};

// ──────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────
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
    if (!res.ok) throw new Error(`POST ${url} → ${res.status}`);
    return res;
}

// Função para exibir notificações visuais (toast)
function flexToast(msg, tipo = 'sucesso') {
    const cores = { sucesso: '#15803d', erro: '#dc2626', aviso: '#d97706' };
    const t = document.createElement('div');
    t.style.cssText = `position:fixed;top:2rem;right:2rem;background:${cores[tipo]};color:#fff;
        padding:1.2rem 1.8rem;border-radius:.8rem;font-size:1.4rem;font-family:'Segoe UI',sans-serif;
        display:flex;align-items:center;gap:.8rem;box-shadow:0 .6rem 2rem rgba(0,0,0,.2);
        z-index:9999;opacity:0;transform:translateY(-1rem);transition:all .3s ease;`;
    t.innerHTML = `<i class="bi bi-check-circle-fill"></i><span>${msg}</span>`;
    document.body.appendChild(t);
    requestAnimationFrame(() => { t.style.opacity = '1'; t.style.transform = 'translateY(0)'; });
    setTimeout(() => {
        t.style.opacity = '0'; t.style.transform = 'translateY(-1rem)';
        setTimeout(() => t.remove(), 350);
    }, 3200);
}

// ──────────────────────────────────────────
// INIT
// ──────────────────────────────────────────
async function inicializar() {
    try {
        listaCargos = await apiGet('/Usuario/ListarCargos');
        renderizarCargos();
    } catch (err) {
        flexToast('Erro ao carregar cargos', 'erro');
    }
}

// ──────────────────────────────────────────
// CARREGAR PERMISSÕES DO CARGO
// ──────────────────────────────────────────
async function carregarPermissoes() {
    const sel = document.getElementById('select-cargo');
    const idCargo = Number(sel.value);

    if (!idCargo) {
        document.getElementById('permissao-conteudo').style.display = 'none';
        document.getElementById('permissao-vazio').style.display = 'flex';
        document.getElementById('cargo-badge').style.display = 'none';
        return;
    }

async function selecionarCargo(idCargo) {
    cargoAtual = idCargo;

    // Badge
    const badge = document.getElementById('cargo-badge');
    badge.innerHTML = `<i class="bi bi-person-badge-fill"></i> ${nomeCargo}`;
    badge.style.display = 'inline-flex';

    // Mostra editor
    document.getElementById('perm-vazio').style.display = 'none';
    document.getElementById('perm-editor').style.display = 'flex';
    document.getElementById('perm-editor').style.flexDirection = 'column';
    document.getElementById('perm-editor').style.gap = '2rem';

    try {
        // Busca menus e campos em paralelo
        [listaMenus, listaCampos] = await Promise.all([
            apiGet(`/Permissao/ListarMenus?idCargo=${idCargo}`),
            apiGet(`/Permissao/ListarCampos?idCargo=${idCargo}`)
        ]);
        renderizarMenus();
        renderizarCampos();

        document.getElementById('permissao-vazio').style.display = 'none';
        document.getElementById('permissao-conteudo').style.display = 'block';
        document.getElementById('status-salvamento').textContent = '';
        document.getElementById('status-salvamento').className = 'status-salvamento';

    } catch (err) {
        flexToast('Erro ao carregar permissões', 'erro');
    }
}

// ──────────────────────────────────────────
// RENDERIZAR MENUS
// ──────────────────────────────────────────
function renderizarMenus() {
    const container = document.getElementById('lista-menus');

    // Agrupa por menuPai
    const raiz = listaMenus.filter(m => !m.menuPai);
    const filhos = listaMenus.filter(m => m.menuPai);

    // Monta itens raiz + filhos agrupados
    const grupos = {};
    filhos.forEach(f => {
        if (!grupos[f.menuPai]) grupos[f.menuPai] = [];
        grupos[f.menuPai].push(f);
    });

    let html = '';

    raiz.forEach(m => {
        html += renderizarItemMenu(m);

        // Se tem filhos, renderiza com indentação
        if (grupos[m.nome]) {
            grupos[m.nome].forEach(filho => {
                html += renderizarItemMenu(filho, true);
            });
        }
    });

    // Filhos órfãos (menuPai não está na raiz como nome)
    filhos.forEach(f => {
        const paiExiste = raiz.some(r => r.nome === f.menuPai);
        if (!paiExiste) html += renderizarItemMenu(f, true);
    });

    container.innerHTML = html;
}

function renderizarItemMenu(m, filho = false) {
    const icone = MENU_ICONES[m.rota] ?? 'bi-circle';
    const ativo = m.temAcesso;

    return `
    <div class="permissao-item ${ativo ? 'ativo' : 'inativo'} ${filho ? 'filho' : ''}"
         id="menu-item-${m.idMenu}"
         style="${filho ? 'margin-left:3.2rem;' : ''}">
        <div class="permissao-item-info">
            <div class="permissao-item-icone">
                <i class="bi ${icone}"></i>
            </div>
            <div class="perm-menu-info">
                <div class="perm-menu-nome">${m.nome}</div>
                <div class="perm-menu-rota">/${m.rota}</div>
            </div>
            <label class="perm-switch" onclick="event.stopPropagation()">
                <input type="checkbox" data-menu-id="${m.idMenu}"
                    ${m.temAcesso ? 'checked' : ''}
                    onchange="toggleMenu(${m.idMenu})">
                <span class="perm-switch-slider"></span>
            </label>
        </div>`;
    }).join('');
}

function toggleMenu(el, idMenu) {
    const item = document.getElementById(`menu-item-${idMenu}`);
    const labelEl = item.querySelector('.toggle-label');
    const ativo = el.checked;

    // Atualiza no array
    const m = listaMenus.find(x => x.idMenu === idMenu);
    if (m) m.temAcesso = ativo;

    // Atualiza visual
    item.classList.toggle('ativo', ativo);
    item.classList.toggle('inativo', !ativo);
    labelEl.textContent = ativo ? 'Permitido' : 'Bloqueado';
    labelEl.className = `toggle-label ${ativo ? 'ativo' : ''}`;
}

// Marca/desmarca todos menus
function marcarTodosMenus(valor) {
    listaMenus.forEach(m => m.temAcesso = valor);
    renderizarMenus();
}

// ──────────────────────────────────────────
// RENDERIZAR CAMPOS
// ──────────────────────────────────────────
function renderizarCampos() {
    const container = document.getElementById('lista-campos');

    // Agrupa por seção
    const secoes = {};
    listaCampos.forEach(c => {
        if (!secoes[c.secao]) secoes[c.secao] = [];
        secoes[c.secao].push(c);
    });

    let html = '';
    Object.entries(secoes).forEach(([secao, itens]) => {
        html += `<tr><td colspan="4" class="perm-secao-label">${secao}</td></tr>`;
        itens.forEach(c => {
            const editBloqueado = !c.visivel;
            html += `
            <div class="campo-item ${!c.visivel ? 'oculto' : ''}" id="campo-item-${c.idCampo}">
                <div>
                    <div class="campo-item-nome">${c.nome}</div>
                    <div class="campo-item-chave">${c.chave}</div>
                </div>

                <!-- VISÍVEL -->
                <div class="campo-controles">
                    <div class="campo-controle">
                        <span class="campo-controle-label">Visível</span>
                        <label class="toggle">
                            <input type="checkbox"
                                data-campo-id="${c.idCampo}"
                                data-tipo="visivel"
                                ${c.visivel ? 'checked' : ''}
                                onchange="toggleCampo(this, ${c.idCampo}, 'visivel')">
                            <span class="toggle-slider"></span>
                        </label>
                    </div>

                    <!-- EDITÁVEL -->
                    <div class="campo-controle">
                        <span class="campo-controle-label">Editável</span>
                        <label class="toggle">
                            <input type="checkbox"
                                data-campo-id="${c.idCampo}"
                                data-tipo="editavel"
                                ${c.editavel ? 'checked' : ''}
                                ${!c.visivel ? 'disabled' : ''}
                                onchange="toggleCampo(this, ${c.idCampo}, 'editavel')">
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                </div>
            </div>`;
        });
    });
    tbody.innerHTML = html;
}

function toggleCampo(el, idCampo, tipo) {
    const c = listaCampos.find(x => x.idCampo === idCampo);
    if (!c) return;

    c[tipo] = el.checked;

    const item = document.getElementById(`campo-item-${idCampo}`);

    // Se ocultar o campo, desabilita o toggle de editável também
    if (tipo === 'visivel') {
        const editavelToggle = item.querySelector('[data-tipo="editavel"]');
        if (!el.checked) {
            c.editavel = false;
            editavelToggle.checked = false;
            editavelToggle.disabled = true;
            item.classList.add('oculto');
        } else {
            editavelToggle.disabled = false;
            item.classList.remove('oculto');
        }
    }
}

// Marca/desmarca todos campos
function marcarTodosCampos(tipo, valor) {
    listaCampos.forEach(c => {
        c[tipo] = valor;
        if (tipo === 'visivel' && !valor) c.editavel = false;
    });
    renderizarCampos();
}

// ──────────────────────────────────────────
// ABAS
// ──────────────────────────────────────────
function mudarAba(aba) {
    document.getElementById('aba-menus').style.display = aba === 'menus' ? '' : 'none';
    document.getElementById('aba-campos').style.display = aba === 'campos' ? '' : 'none';
    document.getElementById('tab-menus-btn').classList.toggle('ativa', aba === 'menus');
    document.getElementById('tab-campos-btn').classList.toggle('ativa', aba === 'campos');
}

// ──────────────────────────────────────────
// SALVAR
// ──────────────────────────────────────────
async function salvarPermissoes() {
    if (!cargoAtual) return;
    const btn = document.querySelector('.btn-salvar-perm');
    btn.disabled = true;
    btn.innerHTML = '<i class="bi bi-hourglass-split"></i> Salvando...';
    setStatus('');

    try {
        await apiPost('/Permissao/Salvar', {
            IdCargo: cargoAtual,
            Menus: listaMenus.map(m => ({
                IdCargo: cargoAtual, IdMenu: m.idMenu, FAtivo: m.temAcesso
            })),
            Campos: listaCampos.map(c => ({
                IdCargo: cargoAtual, IdCampo: c.idCampo,
                Visivel: c.visivel, Editavel: c.editavel
            }))
        });
        setStatus('sucesso');
        flexToast('Permissões salvas com sucesso!', 'sucesso');
    } catch (err) {
        setStatus('erro');
        flexToast('Erro ao salvar: ' + err.message, 'erro');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-check-lg"></i> Salvar Permissões';
    }
}

// ──────────────────────────────────────────
// INIT
// ──────────────────────────────────────────
document.addEventListener('DOMContentLoaded', inicializar);