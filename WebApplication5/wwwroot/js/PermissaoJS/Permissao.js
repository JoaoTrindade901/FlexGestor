// ===== PERMISSAO.JS — layout melhorado =====

let listaCargos = [];
let listaMenus = [];
let listaCampos = [];
let cargoAtual = null;

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

const CARGO_CORES = [
    'cargo-cor-1', 'cargo-cor-2', 'cargo-cor-3', 'cargo-cor-4', 'cargo-cor-5'
];

async function apiGet(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`GET ${url} → ${res.status}`);
    return res.json();
}

async function apiPost(url, body) {
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(`POST ${url} → ${res.status}`);
    return res;
}

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

// ── INICIALIZAR ──────────────────────────
async function inicializar() {
    try {
        listaCargos = await apiGet('/Usuario/ListarCargos');
        renderizarCargos();
    } catch (err) {
        flexToast('Erro ao carregar cargos', 'erro');
    }
}

function renderizarCargos() {
    const container = document.getElementById('lista-cargos');
    container.innerHTML = listaCargos.map((c, idx) => {
        const cor = CARGO_CORES[idx % CARGO_CORES.length];
        const inicial = (c.nome ?? c.Nome ?? '?')[0].toUpperCase();
        return `
        <div class="perm-cargo-item" id="cargo-item-${c.idCargo}"
             onclick="selecionarCargo(${c.idCargo})">
            <div class="perm-cargo-avatar ${cor}">${inicial}</div>
            <div class="perm-cargo-info">
                <div class="perm-cargo-nome">${c.nome ?? c.Nome}</div>
                <div class="perm-cargo-desc">Clique para configurar</div>
            </div>
            <i class="bi bi-chevron-right perm-cargo-seta"></i>
        </div>`;
    }).join('');
}

async function selecionarCargo(idCargo) {
    cargoAtual = idCargo;

    // Destaca cargo selecionado
    document.querySelectorAll('.perm-cargo-item').forEach(el =>
        el.classList.remove('ativo'));
    document.getElementById(`cargo-item-${idCargo}`)?.classList.add('ativo');

    // Mostra editor
    document.getElementById('perm-vazio').style.display = 'none';
    document.getElementById('perm-editor').style.display = 'flex';
    document.getElementById('perm-editor').style.flexDirection = 'column';
    document.getElementById('perm-editor').style.gap = '2rem';

    try {
        [listaMenus, listaCampos] = await Promise.all([
            apiGet(`/Permissao/ListarMenus?idCargo=${idCargo}`),
            apiGet(`/Permissao/ListarCampos?idCargo=${idCargo}`)
        ]);
        renderizarMenus();
        renderizarCampos();
        mudarAba('menus');
        setStatus('');
    } catch (err) {
        flexToast('Erro ao carregar permissões', 'erro');
    }
}

function renderizarMenus() {
    const container = document.getElementById('lista-menus');
    container.innerHTML = listaMenus.map(m => {
        const icone = MENU_ICONES[m.rota] ?? 'bi-circle';
        const cls = m.temAcesso ? 'permitido' : 'bloqueado';
        return `
        <div class="perm-menu-card ${cls}" id="menu-card-${m.idMenu}"
             onclick="toggleMenu(${m.idMenu})">
            <div class="perm-menu-icon">
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

function toggleMenu(idMenu) {
    const m = listaMenus.find(x => x.idMenu === idMenu);
    if (!m) return;
    m.temAcesso = !m.temAcesso;
    renderizarMenus();
}

function marcarTodosMenus(valor) {
    listaMenus.forEach(m => m.temAcesso = valor);
    renderizarMenus();
}

function renderizarCampos() {
    const tbody = document.getElementById('lista-campos');
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
            <tr id="campo-row-${c.idCampo}" style="${!c.visivel ? 'opacity:.5' : ''}">
                <td style="font-weight:600">
                    ${!c.visivel
                    ? `<i class="bi bi-eye-slash-fill" style="color:#dc2626;margin-right:.6rem;font-size:1.2rem"></i>`
                    : `<i class="bi bi-eye-fill" style="color:#15803d;margin-right:.6rem;font-size:1.2rem"></i>`
                }
                    ${c.nome}
                </td>
                <td style="font-family:monospace;color:#9ca3af;font-size:1.2rem">${c.chave}</td>
                <td style="text-align:center">
                    <label class="perm-switch" style="margin:0 auto">
                        <input type="checkbox" data-campo-id="${c.idCampo}" data-tipo="visivel"
                            ${c.visivel ? 'checked' : ''}
                            onchange="toggleCampo(${c.idCampo},'visivel',this.checked)">
                        <span class="perm-switch-slider"></span>
                    </label>
                </td>
                <td style="text-align:center">
                    ${editBloqueado
                    ? `<span title="Ative a visibilidade primeiro">
                               <i class="bi bi-lock-fill" style="color:#d97706;font-size:1.6rem"></i>
                           </span>`
                    : `<label class="perm-switch" style="margin:0 auto">
                               <input type="checkbox" data-campo-id="${c.idCampo}" data-tipo="editavel"
                                   ${c.editavel ? 'checked' : ''}
                                   onchange="toggleCampo(${c.idCampo},'editavel',this.checked)">
                               <span class="perm-switch-slider"></span>
                           </label>`
                }
                </td>
            </tr>`;
        });
    });
    tbody.innerHTML = html;
}

function toggleCampo(idCampo, tipo, valor) {
    const c = listaCampos.find(x => x.idCampo === idCampo);
    if (!c) return;
    c[tipo] = valor;
    if (tipo === 'visivel' && !valor) c.editavel = false;
    renderizarCampos();
}

function marcarTodosCampos(tipo, valor) {
    listaCampos.forEach(c => {
        c[tipo] = valor;
        if (tipo === 'visivel' && !valor) c.editavel = false;
    });
    renderizarCampos();
}

function mudarAba(aba) {
    document.getElementById('aba-menus').style.display = aba === 'menus' ? '' : 'none';
    document.getElementById('aba-campos').style.display = aba === 'campos' ? '' : 'none';
    document.getElementById('tab-menus-btn').classList.toggle('ativa', aba === 'menus');
    document.getElementById('tab-campos-btn').classList.toggle('ativa', aba === 'campos');
}

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

function setStatus(tipo) {
    const el = document.getElementById('status-salvamento');
    if (tipo === 'sucesso') {
        el.className = 'perm-footer-info sucesso';
        el.innerHTML = '<i class="bi bi-check-circle-fill"></i> Salvo com sucesso!';
    } else if (tipo === 'erro') {
        el.className = 'perm-footer-info erro';
        el.innerHTML = '<i class="bi bi-x-circle-fill"></i> Erro ao salvar.';
    } else {
        el.className = 'perm-footer-info';
        el.innerHTML = '<i class="bi bi-info-circle"></i> As alterações só são aplicadas após salvar.';
    }
}

document.addEventListener('DOMContentLoaded', inicializar);