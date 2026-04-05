// ===== flexValidation.js — FlexGestor =====
// Coloque em: /wwwroot/js/shared/flexValidation.js
// Inclua em todas as views: <script src="/js/shared/flexValidation.js"></script>

// ──────────────────────────────────────────
// VISUAL: marca campo com erro
// ──────────────────────────────────────────
function marcarErro(inputEl, mensagem) {
    if (!inputEl) return;
    inputEl.style.borderColor = "#dc2626";
    inputEl.style.boxShadow = "0 0 0 0.3rem rgba(220,38,38,0.12)";

    const wrapper = inputEl.closest(".form-group") ?? inputEl.parentElement;
    let span = wrapper?.querySelector(".validation-msg");
    if (!span) {
        span = document.createElement("span");
        span.className = "validation-msg";
        span.style.cssText = "display:block;font-size:1.1rem;color:#dc2626;margin-top:0.3rem;font-family:'Segoe UI',sans-serif;";
        wrapper?.appendChild(span);
    }
    span.textContent = mensagem;
}

function limparErro(inputEl) {
    if (!inputEl) return;
    inputEl.style.borderColor = "";
    inputEl.style.boxShadow = "";
    const wrapper = inputEl.closest(".form-group") ?? inputEl.parentElement;
    wrapper?.querySelector(".validation-msg")?.remove();
}

function limparTodosErros(formEl) {
    if (!formEl) return;
    formEl.querySelectorAll("input, select, textarea").forEach(limparErro);
}

// ──────────────────────────────────────────
// TOAST DE FEEDBACK
// ──────────────────────────────────────────
function flexToast(mensagem, tipo = "erro") {
    let t = document.getElementById("flex-toast");
    if (!t) {
        t = document.createElement("div");
        t.id = "flex-toast";
        t.style.cssText = `
            position:fixed; top:2rem; right:2rem; z-index:9999;
            padding:1.2rem 1.8rem; border-radius:0.8rem;
            font-size:1.4rem; font-family:'Segoe UI',sans-serif;
            font-weight:600; box-shadow:0 0.6rem 2rem rgba(0,0,0,0.2);
            display:flex; align-items:center; gap:0.8rem;
            opacity:0; transform:translateY(-1rem);
            transition:opacity 0.25s, transform 0.25s;
        `;
        document.body.appendChild(t);
    }
    const cores = {
        erro: { bg: "#fef2f2", texto: "#b91c1c", borda: "#fecaca" },
        sucesso: { bg: "#f0fdf4", texto: "#15803d", borda: "#bbf7d0" },
        aviso: { bg: "#fefce8", texto: "#92400e", borda: "#fef08a" },
    };
    const c = cores[tipo] ?? cores.erro;
    t.style.background = c.bg;
    t.style.color = c.texto;
    t.style.border = `1px solid ${c.borda}`;
    const icones = { erro: "⚠", sucesso: "✓", aviso: "!" };
    t.innerHTML = `<span style="font-size:1.6rem">${icones[tipo] ?? "!"}</span> ${mensagem}`;
    t.style.opacity = "1";
    t.style.transform = "translateY(0)";
    clearTimeout(t._timer);
    t._timer = setTimeout(() => {
        t.style.opacity = "0";
        t.style.transform = "translateY(-1rem)";
    }, 4000);
}

// ──────────────────────────────────────────
// VALIDAÇÕES DE CAMPO VAZIO
// ──────────────────────────────────────────
function campoVazio(valor) {
    return !valor || String(valor).trim() === "";
}

function validarObrigatorio(inputEl, nomeAmigavel) {
    if (campoVazio(inputEl?.value)) {
        marcarErro(inputEl, `${nomeAmigavel} é obrigatório.`);
        return false;
    }
    limparErro(inputEl);
    return true;
}

// ──────────────────────────────────────────
// CPF
// ──────────────────────────────────────────
function validarCPF(cpf) {
    const s = String(cpf ?? "").replace(/\D/g, "");
    if (s.length !== 11 || /^(\d)\1{10}$/.test(s)) return false;
    let soma = 0;
    for (let i = 0; i < 9; i++) soma += +s[i] * (10 - i);
    let r = (soma * 10) % 11;
    if (r === 10 || r === 11) r = 0;
    if (r !== +s[9]) return false;
    soma = 0;
    for (let i = 0; i < 10; i++) soma += +s[i] * (11 - i);
    r = (soma * 10) % 11;
    if (r === 10 || r === 11) r = 0;
    return r === +s[10];
}

function validarCampoCPF(inputEl) {
    const v = String(inputEl?.value ?? "").replace(/\D/g, "");
    if (campoVazio(inputEl?.value)) {
        marcarErro(inputEl, "CPF é obrigatório.");
        return false;
    }
    if (!validarCPF(v)) {
        marcarErro(inputEl, "CPF inválido. Verifique os dígitos.");
        return false;
    }
    limparErro(inputEl);
    return true;
}

// ──────────────────────────────────────────
// CNPJ
// ──────────────────────────────────────────
function validarCNPJ(cnpj) {
    const s = String(cnpj ?? "").replace(/\D/g, "");
    if (s.length !== 14 || /^(\d)\1{13}$/.test(s)) return false;
    let t = s.length - 2, d = s.substring(t), n = s.substring(0, t);
    let soma = 0, pos = t - 7;
    for (let i = t; i >= 1; i--) {
        soma += +n[t - i] * pos--;
        if (pos < 2) pos = 9;
    }
    let r = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    if (r !== +d[0]) return false;
    t++; n = s.substring(0, t); soma = 0; pos = t - 7;
    for (let i = t; i >= 1; i--) {
        soma += +n[t - i] * pos--;
        if (pos < 2) pos = 9;
    }
    r = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    return r === +d[1];
}

function validarCampoCNPJ(inputEl) {
    const v = String(inputEl?.value ?? "").replace(/\D/g, "");
    if (campoVazio(inputEl?.value)) {
        marcarErro(inputEl, "CNPJ é obrigatório.");
        return false;
    }
    if (!validarCNPJ(v)) {
        marcarErro(inputEl, "CNPJ inválido. Verifique os dígitos.");
        return false;
    }
    limparErro(inputEl);
    return true;
}

// ──────────────────────────────────────────
// CPF ou CNPJ (cliente PF/PJ)
// ──────────────────────────────────────────
function validarCampoCpfCnpj(inputEl, tipoPessoa) {
    const s = String(inputEl?.value ?? "").replace(/\D/g, "");
    if (campoVazio(inputEl?.value)) {
        const label = tipoPessoa === "PJ" ? "CNPJ" : "CPF";
        marcarErro(inputEl, `${label} é obrigatório.`);
        return false;
    }
    if (tipoPessoa === "PJ") return validarCampoCNPJ(inputEl);
    return validarCampoCPF(inputEl);
}

// ──────────────────────────────────────────
// EMAIL
// ──────────────────────────────────────────
function validarEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email ?? "").trim());
}

function validarCampoEmail(inputEl, obrigatorio = true) {
    const v = String(inputEl?.value ?? "").trim();
    if (campoVazio(v)) {
        if (obrigatorio) {
            marcarErro(inputEl, "Email é obrigatório.");
            return false;
        }
        limparErro(inputEl);
        return true;
    }
    if (!validarEmail(v)) {
        marcarErro(inputEl, "Email inválido. Ex: usuario@dominio.com");
        return false;
    }
    limparErro(inputEl);
    return true;
}

// ──────────────────────────────────────────
// TELEFONE (aceita (XX) XXXXX-XXXX ou XXXXXXXXXX)
// ──────────────────────────────────────────
function validarTelefone(tel) {
    const s = String(tel ?? "").replace(/\D/g, "");
    return s.length === 10 || s.length === 11;
}

function validarCampoTelefone(inputEl, obrigatorio = true) {
    const v = String(inputEl?.value ?? "");
    if (campoVazio(v)) {
        if (obrigatorio) {
            marcarErro(inputEl, "Telefone é obrigatório.");
            return false;
        }
        limparErro(inputEl);
        return true;
    }
    if (!validarTelefone(v)) {
        marcarErro(inputEl, "Telefone inválido. Use (XX) XXXXX-XXXX.");
        return false;
    }
    limparErro(inputEl);
    return true;
}

// ──────────────────────────────────────────
// CEP — com consulta ViaCEP
// ──────────────────────────────────────────
function validarCEP(cep) {
    const s = String(cep ?? "").replace(/\D/g, "");
    return s.length === 8;
}

async function buscarCEP(cep, callbacks = {}) {
    const s = String(cep ?? "").replace(/\D/g, "");
    if (s.length !== 8) return null;
    try {
        const res = await fetch(`https://viacep.com.br/ws/${s}/json/`);
        const data = await res.json();
        if (data.erro) {
            callbacks.onErro?.("CEP não encontrado.");
            return null;
        }
        callbacks.onSucesso?.(data);
        return data;
    } catch {
        callbacks.onErro?.("Não foi possível consultar o CEP.");
        return null;
    }
}

// preencheAutomaico: prefixa os IDs com o prefixo do modal (ex: "novo" → #novo-logradouro)
async function preencherEnderecoPorCEP(inputCep, prefixo) {
    const cep = String(inputCep?.value ?? "").replace(/\D/g, "");
    if (cep.length !== 8) {
        if (cep.length > 0) marcarErro(inputCep, "CEP inválido. Informe 8 dígitos.");
        return;
    }
    limparErro(inputCep);
    inputCep.placeholder = "Buscando...";

    await buscarCEP(cep, {
        onSucesso: (d) => {
            const set = (id, val) => {
                const el = document.getElementById(`${prefixo}-${id}`);
                if (el && val) { el.value = val; limparErro(el); }
            };
            set("logradouro", d.logradouro);
            set("bairro", d.bairro);
            set("cidade", d.localidade);
            set("estado", d.uf);
            set("complemento", d.complemento ?? "");
            flexToast("Endereço preenchido automaticamente!", "sucesso");
        },
        onErro: (msg) => {
            marcarErro(inputCep, msg);
        }
    });
    inputCep.placeholder = "00000-000";
}

// ──────────────────────────────────────────
// FORMATAÇÃO AUTOMÁTICA (máscaras leves)
// ──────────────────────────────────────────
function aplicarMascaraCPF(inputEl) {
    inputEl.addEventListener("input", () => {
        let v = inputEl.value.replace(/\D/g, "").substring(0, 11);
        v = v.replace(/(\d{3})(\d)/, "$1.$2");
        v = v.replace(/(\d{3})\.(\d{3})(\d)/, "$1.$2.$3");
        v = v.replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");
        inputEl.value = v;
    });
}

function aplicarMascaraCNPJ(inputEl) {
    inputEl.addEventListener("input", () => {
        let v = inputEl.value.replace(/\D/g, "").substring(0, 14);
        v = v.replace(/(\d{2})(\d)/, "$1.$2");
        v = v.replace(/(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
        v = v.replace(/\.(\d{3})\.(\d{3})(\d)/, ".$1.$2/$3");
        v = v.replace(/(\d{4})(\d)/, "$1-$2");
        inputEl.value = v;
    });
}

function aplicarMascaraTelefone(inputEl) {
    inputEl.addEventListener("input", () => {
        let v = inputEl.value.replace(/\D/g, "").substring(0, 11);
        if (v.length > 10)
            v = v.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
        else if (v.length > 6)
            v = v.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
        else if (v.length > 2)
            v = v.replace(/(\d{2})(\d{0,5})/, "($1) $2");
        else if (v.length > 0)
            v = v.replace(/(\d{0,2})/, "($1");
        inputEl.value = v;
    });
}

function aplicarMascaraCEP(inputEl) {
    inputEl.addEventListener("input", () => {
        let v = inputEl.value.replace(/\D/g, "").substring(0, 8);
        if (v.length > 5) v = v.replace(/(\d{5})(\d)/, "$1-$2");
        inputEl.value = v;
    });
}

// ──────────────────────────────────────────
// EXCLUSÃO LÓGICA — helper de confirmação
// ──────────────────────────────────────────
// Uso: flexConfirmar("Inativar João Silva?", () => chamarEndpoint());
function flexConfirmar(mensagem, onConfirmar, textoBtn = "Confirmar") {
    let modal = document.getElementById("flex-confirm-modal");
    if (!modal) {
        modal = document.createElement("div");
        modal.id = "flex-confirm-modal";
        modal.style.cssText = `
            display:none; position:fixed; inset:0;
            background:rgba(15,23,42,0.5); backdrop-filter:blur(3px);
            z-index:5000; justify-content:center; align-items:center;
        `;
        modal.innerHTML = `
            <div style="background:#fff;border-radius:1.2rem;padding:2.8rem 2.4rem;
                width:42rem;max-width:95vw;box-shadow:0 2rem 6rem rgba(0,0,0,0.2);
                font-family:'Segoe UI',sans-serif;text-align:center;">
                <div style="font-size:4rem;color:#ef4444;margin-bottom:1.2rem">⚠</div>
                <p id="flex-confirm-msg" style="font-size:1.5rem;color:#374151;
                    margin:0 0 2rem;line-height:1.6"></p>
                <div style="display:flex;justify-content:flex-end;gap:1rem">
                    <button id="flex-confirm-cancel" style="padding:0.9rem 2rem;border:1px solid #dce1e7;
                        border-radius:0.6rem;background:#fff;color:#374151;
                        font-size:1.4rem;font-weight:600;cursor:pointer">Cancelar</button>
                    <button id="flex-confirm-ok" style="padding:0.9rem 2rem;border:none;
                        border-radius:0.6rem;background:#ef4444;color:#fff;
                        font-size:1.4rem;font-weight:600;cursor:pointer"></button>
                </div>
            </div>`;
        document.body.appendChild(modal);
        modal.addEventListener("click", (e) => {
            if (e.target === modal) fecharFlexConfirmar();
        });
        document.getElementById("flex-confirm-cancel").addEventListener("click", fecharFlexConfirmar);
    }
    document.getElementById("flex-confirm-msg").textContent = mensagem;
    const btnOk = document.getElementById("flex-confirm-ok");
    btnOk.textContent = textoBtn;
    btnOk.onclick = () => { fecharFlexConfirmar(); onConfirmar(); };
    modal.style.display = "flex";
}

function fecharFlexConfirmar() {
    const m = document.getElementById("flex-confirm-modal");
    if (m) m.style.display = "none";
}