let listalistaCargos = []; // Lista de cargos disponíveis no sistema
let listaMenus = []; // Lista de menus com permissões do cargo
let listaCampos = []; // Lista de campos com permissões do cargo
let cargoAtual = null; // Armazena o cargo atualmente selecionado

// Mapeamento de rotas para ícones (usando Bootstrap Icons)
const MENU_ICONES = {
    'Home': 'bi-house-fill',
    'Usuario': 'bi-person-fill',
    'Cliente': 'bi-people-fill',
    'Pedido': 'bi-bag-fill',
    'Caixa': 'bi-cash-coin',
    'Estoque': 'bi-box-seam-fill',
    'Auditoria': 'bi-shield-check',
    'Fornecedor': 'bi-building',
    'CategoriaProduto': 'bi-tag-fill',
    'ML': 'bi-graph-up-arrow',
    'Permissao': 'bi-shield-lock-fill',
};

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

// Função para exibir notificações visuais (toast)
function flexToast(msg, tipo = 'sucesso') {
    const cores = { sucesso: '#15803d', erro: '#dc2626', aviso: '#d97706' };
    const icones = { sucesso: 'bi-check-circle-fill', erro: 'bi-x-circle-fill', aviso: 'bi-exclamation-triangle-fill' };
    const t = document.createElement('div');
    t.style.cssText = `position:fixed;top:2rem;right:2rem;background:${cores[tipo]};color:#fff;
        padding:1.2rem 1.8rem;border-radius:.8rem;font-size:1.4rem;font-family:'Segoe UI',sans-serif;
        display:flex;align-items:center;gap:.8rem;box-shadow:0 .6rem 2rem rgba(0,0,0,.2);
        z-index:9999;opacity:0;transform:translateY(-1rem);transition:all .3s ease;`;
    t.innerHTML = `<i class="bi ${icones[tipo]}"></i><span>${msg}</span>`;
    document.body.appendChild(t);
    requestAnimationFrame(() => { t.style.opacity = '1'; t.style.transform = 'translateY(0)'; });
    setTimeout(() => {
        t.style.opacity = '0'; t.style.transform = 'translateY(-1rem)';
        setTimeout(() => t.remove(), 350);
    }, 3200);
}

// Função inicial que carrega os cargos no select
async function inicializar() {
    try {
        listaCargos = await apiGet('/Usuario/ListarCargos');
        const sel = document.getElementById('select-cargo');
        listaCargos.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.idCargo;
            opt.textContent = c.nome ?? c.Nome;
            sel.appendChild(opt);
        });
    } catch (err) {
        flexToast('Erro ao carregar cargos: ' + err.message, 'erro');
    }
}

// Carrega permissões (menus + campos) do cargo selecionado
async function carregarPermissoes() {
    const sel = document.getElementById('select-cargo');
    const idCargo = Number(sel.value);

    // Se não selecionou cargo, mostra estado vazio
    if (!idCargo) {
        document.getElementById('permissao-conteudo').style.display = 'none';
        document.getElementById('permissao-vazio').style.display = 'flex';
        document.getElementById('cargo-badge').style.display = 'none';
        return;
    }

    cargoAtual = idCargo;
    const nomeCargo = sel.options[sel.selectedIndex].text;

    // Atualiza badge com nome do cargo
    const badge = document.getElementById('cargo-badge');
    badge.innerHTML = `<i class="bi bi-person-badge-fill"></i> ${nomeCargo}`;
    badge.style.display = 'inline-flex';

    try {
        // Busca menus e campos em paralelo
        [listaMenus, listaCampos] = await Promise.all([
            apiGet(`/Permissao/ListarMenus?idCargo=${idCargo}`),
            apiGet(`/Permissao/ListarCampos?idCargo=${idCargo}`)
        ]);

        renderizarMenus();
        renderizarCampos();

        // Atualiza UI
        document.getElementById('permissao-vazio').style.display = 'none';
        document.getElementById('permissao-conteudo').style.display = 'block';
        document.getElementById('status-salvamento').textContent = '';
        document.getElementById('status-salvamento').className = 'status-salvamento';

    } catch (err) {
        flexToast('Erro ao carregar permissões: ' + err.message, 'erro');
    }
}

// Renderiza menus agrupando por menuPai
function renderizarMenus() {
    const container = document.getElementById('lista-menus');

    const raiz = listaMenus.filter(m => !m.menuPai);
    const filhos = listaMenus.filter(m => m.menuPai);

    const grupos = {};
    filhos.forEach(f => {
        if (!grupos[f.menuPai]) grupos[f.menuPai] = [];
        grupos[f.menuPai].push(f);
    });

    let html = '';

    raiz.forEach(m => {
        html += renderizarItemMenu(m);

        if (grupos[m.nome]) {
            grupos[m.nome].forEach(filho => {
                html += renderizarItemMenu(filho, true);
            });
        }
    });

    // Trata filhos órfãos
    filhos.forEach(f => {
        const paiExiste = raiz.some(r => r.nome === f.menuPai);
        if (!paiExiste) html += renderizarItemMenu(f, true);
    });

    container.innerHTML = html;
}

// Renderiza um item de menu
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
            <div>
                <div class="permissao-item-nome">
                    ${filho ? '<i class="bi bi-arrow-return-right" style="color:#9ca3af;font-size:1.1rem;margin-right:.4rem"></i>' : ''}
                    ${m.nome}
                </div>
                <div class="permissao-item-rota">/${m.rota}</div>
            </div>
        </div>
        <div class="toggle-wrap">
            <span class="toggle-label ${ativo ? 'ativo' : ''}">
                ${ativo ? 'Permitido' : 'Bloqueado'}
            </span>
            <label class="toggle">
                <input type="checkbox"
                    data-menu-id="${m.idMenu}"
                    ${ativo ? 'checked' : ''}
                    onchange="toggleMenu(this, ${m.idMenu})">
                <span class="toggle-slider"></span>
            </label>
        </div>
    </div>`;
}

// Alterna permissão de um menu
function toggleMenu(el, idMenu) {
    const item = document.getElementById(`menu-item-${idMenu}`);
    const labelEl = item.querySelector('.toggle-label');
    const ativo = el.checked;

    const m = listaMenus.find(x => x.idMenu === idMenu);
    if (m) m.temAcesso = ativo;

    item.classList.toggle('ativo', ativo);
    item.classList.toggle('inativo', !ativo);
    labelEl.textContent = ativo ? 'Permitido' : 'Bloqueado';
    labelEl.className = `toggle-label ${ativo ? 'ativo' : ''}`;
}

// Marca/desmarca todos menus
function marcarTodosMenus(valor) {
    listaMenus.forEach(m => { m.temAcesso = valor; });
    renderizarMenus();
}

// Renderiza campos agrupados por seção
function renderizarCampos() {
    const container = document.getElementById('lista-campos');

    const secoes = {};
    listaCampos.forEach(c => {
        if (!secoes[c.secao]) secoes[c.secao] = [];
        secoes[c.secao].push(c);
    });

    let html = '';
    Object.entries(secoes).forEach(([secao, itens]) => {
        html += `<div class="campos-secao">
            <div class="campos-secao-titulo">${secao}</div>`;

        itens.forEach(c => {
            html += `
            <div class="campo-item ${!c.visivel ? 'oculto' : ''}" id="campo-item-${c.idCampo}">
                <div>
                    <div class="campo-item-nome">${c.nome}</div>
                    <div class="campo-item-chave">${c.chave}</div>
                </div>

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

        html += `</div>`;
    });

    container.innerHTML = html;
}

// Alterna visibilidade/editabilidade de um campo
function toggleCampo(el, idCampo, tipo) {
    const c = listaCampos.find(x => x.idCampo === idCampo);
    if (!c) return;

    c[tipo] = el.checked;

    const item = document.getElementById(`campo-item-${idCampo}`);

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

// Controle de abas da interface
function mudarAba(aba) {
    document.querySelectorAll('.permissao-aba').forEach(b => b.classList.remove('ativa'));
    document.querySelectorAll('.aba-conteudo').forEach(p => p.classList.remove('ativa'));
    document.getElementById(`aba-btn-${aba}`).classList.add('ativa');
    document.getElementById(`aba-${aba}`).classList.add('ativa');
}

// Salva permissões no backend
async function salvarPermissoes() {
    if (!cargoAtual) return;

    const btn = document.querySelector('.btn-salvar');
    const status = document.getElementById('status-salvamento');
    btn.disabled = true;
    btn.innerHTML = '<i class="bi bi-hourglass-split"></i> Salvando...';
    status.textContent = '';
    status.className = 'status-salvamento';

    const payload = {
        IdCargo: cargoAtual,
        Menus: listaMenus.map(m => ({
            IdCargo: cargoAtual,
            IdMenu: m.idMenu,
            FAtivo: m.temAcesso
        })),
        Campos: listaCampos.map(c => ({
            IdCargo: cargoAtual,
            IdCampo: c.idCampo,
            Visivel: c.visivel,
            Editavel: c.editavel
        }))
    };

    try {
        await apiPost('/Permissao/Salvar', payload);
        status.textContent = '✓ Permissões salvas com sucesso';
        status.className = 'status-salvamento sucesso';
        flexToast('Permissões salvas!', 'sucesso');
        setTimeout(() => {
            status.textContent = '';
            status.className = 'status-salvamento';
        }, 4000);
    } catch (err) {
        status.textContent = '✗ Erro ao salvar';
        status.className = 'status-salvamento erro';
        flexToast('Erro ao salvar: ' + err.message, 'erro');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-check-lg"></i> Salvar Permissões';
    }
}

// Inicializa ao carregar a página
document.addEventListener('DOMContentLoaded', inicializar);