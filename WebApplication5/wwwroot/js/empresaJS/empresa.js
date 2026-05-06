// ===== empresa.js =====

let _ambienteAtual = 2;
let _certArquivo = null;

// ──────────────────────────────────────────
// UTILITÁRIOS
// ──────────────────────────────────────────
function flexToast(msg, tipo) {
    tipo = tipo || "sucesso";
    var cores = { sucesso: "#15803d", erro: "#dc2626", aviso: "#d97706" };
    var icones = { sucesso: "bi-check-circle-fill", erro: "bi-x-circle-fill", aviso: "bi-exclamation-triangle-fill" };
    var t = document.createElement("div");
    t.style.cssText = "position:fixed;top:2rem;right:2rem;background:" + cores[tipo] + ";color:#fff;" +
        "padding:1.2rem 1.8rem;border-radius:.8rem;font-size:1.4rem;font-family:'DM Sans',sans-serif;" +
        "display:flex;align-items:center;gap:.8rem;box-shadow:0 .6rem 2rem rgba(0,0,0,.2);" +
        "z-index:9999;opacity:0;transform:translateY(-1rem);transition:all .3s ease;max-width:44rem;";
    t.innerHTML = '<i class="bi ' + icones[tipo] + '"></i><span>' + msg + '</span>';
    document.body.appendChild(t);
    requestAnimationFrame(function () { t.style.opacity = "1"; t.style.transform = "translateY(0)"; });
    setTimeout(function () {
        t.style.opacity = "0"; t.style.transform = "translateY(-1rem)";
        setTimeout(function () { t.remove(); }, 350);
    }, 4000);
}

function setBtnLoading(btn, loading) {
    if (loading) {
        btn.disabled = true;
        btn.dataset.orig = btn.innerHTML;
        btn.innerHTML = '<span class="emp-spinner"></span> Salvando...';
    } else {
        btn.disabled = false;
        btn.innerHTML = btn.dataset.orig || btn.innerHTML;
    }
}

function apiGet(url) {
    return fetch(url).then(function (res) {
        if (!res.ok) throw new Error("GET " + url + " -> " + res.status);
        return res.json();
    });
}

function apiPost(url, body) {
    return fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    }).then(function (res) {
        if (!res.ok) {
            return res.text().then(function (txt) {
                var msg = txt;
                try { msg = JSON.parse(txt).mensagem || txt; } catch (e) { }
                throw new Error(msg || "Erro " + res.status);
            });
        }
        return res.json().catch(function () { return null; });
    });
}

// ──────────────────────────────────────────
// ABAS
// ──────────────────────────────────────────
function mudarAba(aba) {
    document.querySelectorAll(".emp-tab-btn").forEach(function (b) { b.classList.remove("ativo"); });
    document.querySelectorAll(".emp-tab-painel").forEach(function (p) { p.classList.remove("ativo"); });
    var btn = document.getElementById("tab-btn-" + aba);
    var painel = document.getElementById("tab-" + aba);
    if (btn) btn.classList.add("ativo");
    if (painel) painel.classList.add("ativo");
}

// ──────────────────────────────────────────
// CARREGAR DADOS DA EMPRESA
// ──────────────────────────────────────────
function carregarEmpresa() {
    apiGet("/Empresa/Buscar").then(function (data) {
        var empresa = data.empresa;
        var endereco = data.endereco;

        if (empresa) {
            document.getElementById("emp-nome").value = empresa.nome || "";
            document.getElementById("emp-cnpj").value = empresa.cnpj || "";
            document.getElementById("emp-tel").value = empresa.telefone || "";
            document.getElementById("emp-email").value = empresa.email || "";
            document.getElementById("emp-codmun").value = empresa.codigoMunicipio || "";
            document.getElementById("emp-nome-topo").textContent = empresa.nome || "Empresa";
            document.getElementById("emp-cnpj-topo").textContent = empresa.cnpj ? "CNPJ: " + formatarCNPJ(empresa.cnpj) : "";
        }

        if (endereco) {
            document.getElementById("emp-cep").value = endereco.cep || "";
            document.getElementById("emp-logradouro").value = endereco.logradouro || "";
            document.getElementById("emp-numero").value = endereco.numero || "";
            document.getElementById("emp-complemento").value = endereco.complemento || "";
            document.getElementById("emp-bairro").value = endereco.bairro || "";
            document.getElementById("emp-cidade").value = endereco.cidade || "";
            var sel = document.getElementById("emp-estado");
            if (sel && endereco.estado) sel.value = endereco.estado;
        }
    }).catch(function (err) {
        flexToast("Erro ao carregar dados: " + err.message, "erro");
    });
}

// ──────────────────────────────────────────
// SALVAR DADOS DA EMPRESA
// ──────────────────────────────────────────
function salvarEmpresa() {
    var btn = document.getElementById("btn-salvar-empresa");
    var dto = {
        Nome: document.getElementById("emp-nome").value.trim(),
        CNPJ: document.getElementById("emp-cnpj").value.replace(/\D/g, ""),
        Telefone: document.getElementById("emp-tel").value.trim() || null,
        Email: document.getElementById("emp-email").value.trim() || null,
        CodigoMunicipio: document.getElementById("emp-codmun").value.trim() || null,
        Logradouro: document.getElementById("emp-logradouro").value.trim(),
        Numero: document.getElementById("emp-numero").value.trim() || null,
        Complemento: document.getElementById("emp-complemento").value.trim() || null,
        Bairro: document.getElementById("emp-bairro").value.trim() || null,
        Cidade: document.getElementById("emp-cidade").value.trim(),
        Estado: document.getElementById("emp-estado").value.trim(),
        CEP: document.getElementById("emp-cep").value.replace(/\D/g, "")
    };

    if (!dto.Nome) { flexToast("O nome da empresa e obrigatorio.", "aviso"); return; }
    if (dto.CNPJ.length !== 14) { flexToast("CNPJ invalido.", "aviso"); return; }

    setBtnLoading(btn, true);
    apiPost("/Empresa/Salvar", dto).then(function () {
        document.getElementById("emp-nome-topo").textContent = dto.Nome;
        document.getElementById("emp-cnpj-topo").textContent = "CNPJ: " + formatarCNPJ(dto.CNPJ);
        flexToast("Dados salvos com sucesso!");
    }).catch(function (err) {
        flexToast(err.message, "erro");
    }).finally(function () {
        setBtnLoading(btn, false);
    });
}

// ──────────────────────────────────────────
// CEP / ViaCEP
// ──────────────────────────────────────────
function buscarCEP() {
    var cep = document.getElementById("emp-cep").value.replace(/\D/g, "");
    if (cep.length !== 8) { flexToast("CEP invalido.", "aviso"); return; }

    var btn = document.getElementById("btn-buscar-cep");
    btn.disabled = true;
    btn.innerHTML = '<span class="emp-spinner"></span>';

    fetch("https://viacep.com.br/ws/" + cep + "/json/")
        .then(function (r) { return r.json(); })
        .then(function (data) {
            if (data.erro) { flexToast("CEP nao encontrado.", "aviso"); return; }
            document.getElementById("emp-logradouro").value = data.logradouro || "";
            document.getElementById("emp-bairro").value = data.bairro || "";
            document.getElementById("emp-cidade").value = data.localidade || "";
            var sel = document.getElementById("emp-estado");
            if (sel && data.uf) sel.value = data.uf;
            document.getElementById("emp-numero").focus();
        })
        .catch(function () { flexToast("Erro ao consultar o CEP.", "erro"); })
        .finally(function () {
            btn.disabled = false;
            btn.innerHTML = '<i class="bi bi-search"></i> Buscar';
        });
}

function formatarCNPJ(cnpj) {
    cnpj = cnpj.replace(/\D/g, "");
    return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
}

// Mascara CEP
document.addEventListener("DOMContentLoaded", function () {
    var cepInput = document.getElementById("emp-cep");
    if (cepInput) {
        cepInput.addEventListener("input", function () {
            var v = this.value.replace(/\D/g, "").slice(0, 8);
            if (v.length > 5) v = v.slice(0, 5) + "-" + v.slice(5);
            this.value = v;
        });
        cepInput.addEventListener("keydown", function (e) {
            if (e.key === "Enter") { e.preventDefault(); buscarCEP(); }
        });
    }

    // Mascara CNPJ
    var cnpjInput = document.getElementById("emp-cnpj");
    if (cnpjInput) {
        cnpjInput.addEventListener("input", function () {
            var v = this.value.replace(/\D/g, "").slice(0, 14);
            v = v.replace(/^(\d{2})(\d)/, "$1.$2")
                .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
                .replace(/\.(\d{3})(\d)/, ".$1/$2")
                .replace(/(\d{4})(\d)/, "$1-$2");
            this.value = v;
        });
    }

    // Mascara Telefone
    var telInput = document.getElementById("emp-tel");
    if (telInput) {
        telInput.addEventListener("input", function () {
            var v = this.value.replace(/\D/g, "").slice(0, 11);
            if (v.length > 10) v = v.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
            else if (v.length > 6) v = v.replace(/^(\d{2})(\d{4})(\d*)$/, "($1) $2-$3");
            else if (v.length > 2) v = v.replace(/^(\d{2})(\d*)$/, "($1) $2");
            this.value = v;
        });
    }

    // Abas
    document.querySelectorAll(".emp-tab-btn").forEach(function (btn) {
        btn.addEventListener("click", function () {
            mudarAba(this.dataset.aba);
        });
    });

    // Botao buscar CEP
    var btnCep = document.getElementById("btn-buscar-cep");
    if (btnCep) btnCep.addEventListener("click", buscarCEP);

    // Botao salvar empresa
    var btnSalvar = document.getElementById("btn-salvar-empresa");
    if (btnSalvar) btnSalvar.addEventListener("click", salvarEmpresa);

    // Botao salvar fiscal
    var btnFiscal = document.getElementById("btn-salvar-fiscal");
    if (btnFiscal) btnFiscal.addEventListener("click", salvarFiscal);

    // Botao salvar certificado
    var btnCert = document.getElementById("btn-salvar-cert");
    if (btnCert) btnCert.addEventListener("click", salvarCertificado);

    // Toggle senha certificado
    var btnSenha = document.getElementById("btn-toggle-senha");
    if (btnSenha) {
        btnSenha.addEventListener("click", function () {
            var input = document.getElementById("cert-senha");
            var isPass = input.type === "password";
            input.type = isPass ? "text" : "password";
            this.querySelector("i").className = isPass ? "bi bi-eye-slash" : "bi bi-eye";
        });
    }

    // Ambiente: botao homologacao
    var btnHomolog = document.getElementById("btn-amb-homolog");
    if (btnHomolog) btnHomolog.addEventListener("click", function () { setAmbiente(2); });

    // Ambiente: botao producao
    var btnProd = document.getElementById("btn-amb-prod");
    if (btnProd) btnProd.addEventListener("click", function () { confirmarAmbienteProd(); });

    // Modal producao: cancelar
    var btnCancelarProd = document.getElementById("btn-modal-cancelar-prod");
    if (btnCancelarProd) btnCancelarProd.addEventListener("click", fecharModalProd);

    // Modal producao: confirmar
    var btnConfirmarProd = document.getElementById("btn-modal-confirmar-prod");
    if (btnConfirmarProd) btnConfirmarProd.addEventListener("click", confirmarProd);

    // Upload certificado
    var certInput = document.getElementById("cert-input");
    if (certInput) certInput.addEventListener("change", function () {
        if (this.files[0]) selecionarCert(this.files[0]);
    });

    // Drag and drop
    var certArea = document.getElementById("cert-upload-area");
    if (certArea) {
        certArea.addEventListener("dragover", function (e) {
            e.preventDefault();
            this.classList.add("drag-over");
        });
        certArea.addEventListener("dragleave", function () { this.classList.remove("drag-over"); });
        certArea.addEventListener("drop", function (e) {
            e.preventDefault();
            this.classList.remove("drag-over");
            var file = e.dataTransfer.files[0];
            if (file) selecionarCert(file);
        });
    }

    // Carrega dados
    carregarEmpresa();
    carregarFiscal();
});

// ──────────────────────────────────────────
// AMBIENTE
// ──────────────────────────────────────────
function setAmbiente(valor) {
    _ambienteAtual = Number(valor);
    var btnH = document.getElementById("btn-amb-homolog");
    var btnP = document.getElementById("btn-amb-prod");
    var hint = document.getElementById("amb-hint");
    if (btnH) btnH.classList.remove("sel-homolog");
    if (btnP) btnP.classList.remove("sel-prod");
    if (_ambienteAtual === 2) {
        if (btnH) btnH.classList.add("sel-homolog");
        if (hint) hint.textContent = "Homologacao: notas enviadas ao ambiente de testes da SEFAZ, sem valor fiscal.";
    } else {
        if (btnP) btnP.classList.add("sel-prod");
        if (hint) hint.textContent = "ATENCAO: Producao ativa! Notas emitidas terao valor fiscal real e serao enviadas a SEFAZ.";
    }
}

function confirmarAmbienteProd() {
    if (_ambienteAtual === 1) return;
    var modal = document.getElementById("modal-amb-prod");
    if (modal) modal.style.display = "flex";
}

function fecharModalProd() {
    var modal = document.getElementById("modal-amb-prod");
    if (modal) modal.style.display = "none";
}

function confirmarProd() {
    fecharModalProd();
    setAmbiente(1);
    flexToast("Ambiente definido como Producao. Lembre-se de salvar.", "aviso");
}

// ──────────────────────────────────────────
// CARREGAR CONFIG FISCAL
// ──────────────────────────────────────────
function carregarFiscal() {
    apiGet("/Empresa/BuscarFiscal").then(function (cfg) {
        if (!cfg) return;
        document.getElementById("fisc-cnpj").value = cfg.cnpjFiscal || "";
        document.getElementById("fisc-ie").value = cfg.inscricaoEstadual || "";
        document.getElementById("fisc-im").value = cfg.inscricaoMunicipal || "";
        document.getElementById("fisc-regime").value = cfg.regimeTributario || "";
        document.getElementById("fisc-serie-nfe").value = cfg.serieNFe || "1";
        document.getElementById("fisc-serie-nfce").value = cfg.serieNFCe || "1";
        document.getElementById("fisc-num-nfe").value = cfg.proximoNumNFe || 1;
        document.getElementById("fisc-num-nfce").value = cfg.proximoNumNFCe || 1;
        document.getElementById("fisc-icms").value = cfg.aliqPadraoICMS || 0;
        document.getElementById("fisc-pis").value = cfg.aliqPadraoPIS || 0.65;
        document.getElementById("fisc-cofins").value = cfg.aliqPadraoCOFINS || 3.00;
        setAmbiente(cfg.ambiente || 2);
        renderCertStatus(cfg.temCertificado, cfg.dthVencCertificado);
    }).catch(function () { });
}

// ──────────────────────────────────────────
// SALVAR CONFIG FISCAL
// ──────────────────────────────────────────
function salvarFiscal() {
    var btn = document.getElementById("btn-salvar-fiscal");
    var dto = {
        CnpjFiscal: document.getElementById("fisc-cnpj").value.replace(/\D/g, "") || null,
        InscricaoEstadual: document.getElementById("fisc-ie").value.trim() || null,
        InscricaoMunicipal: document.getElementById("fisc-im").value.trim() || null,
        RegimeTributario: Number(document.getElementById("fisc-regime").value) || null,
        Ambiente: _ambienteAtual,
        SerieNFe: document.getElementById("fisc-serie-nfe").value.trim() || "1",
        SerieNFCe: document.getElementById("fisc-serie-nfce").value.trim() || "1",
        ProximoNumNFe: Number(document.getElementById("fisc-num-nfe").value) || 1,
        ProximoNumNFCe: Number(document.getElementById("fisc-num-nfce").value) || 1,
        AliqPadraoICMS: Number(document.getElementById("fisc-icms").value) || 0,
        AliqPadraoPIS: Number(document.getElementById("fisc-pis").value) || 0,
        AliqPadraoCOFINS: Number(document.getElementById("fisc-cofins").value) || 0
    };

    setBtnLoading(btn, true);
    apiPost("/Empresa/SalvarFiscal", dto).then(function () {
        flexToast("Configuracao fiscal salva com sucesso!");
    }).catch(function (err) {
        flexToast(err.message, "erro");
    }).finally(function () {
        setBtnLoading(btn, false);
    });
}

// ──────────────────────────────────────────
// CERTIFICADO A1
// ──────────────────────────────────────────
function renderCertStatus(tem, dthVenc) {
    var el = document.getElementById("cert-status");
    if (!el) return;
    if (!tem) {
        el.className = "emp-cert-status sem-cert";
        el.innerHTML = '<i class="bi bi-shield-x"></i><span>Nenhum certificado cadastrado.</span>';
        return;
    }
    var hoje = new Date();
    var venc = dthVenc ? new Date(dthVenc) : null;
    var dias = venc ? Math.ceil((venc - hoje) / 86400000) : null;

    if (!venc) {
        el.className = "emp-cert-status ok";
        el.innerHTML = '<i class="bi bi-shield-check"></i><span>Certificado ativo.</span>';
    } else if (dias < 0) {
        el.className = "emp-cert-status vencido";
        el.innerHTML = '<i class="bi bi-shield-exclamation"></i><span>Certificado VENCIDO em ' + venc.toLocaleDateString("pt-BR") + '.</span>';
    } else if (dias <= 30) {
        el.className = "emp-cert-status vencendo";
        el.innerHTML = '<i class="bi bi-shield-exclamation"></i><span>Certificado vence em ' + dias + ' dias (' + venc.toLocaleDateString("pt-BR") + ').</span>';
    } else {
        el.className = "emp-cert-status ok";
        el.innerHTML = '<i class="bi bi-shield-check"></i><span>Certificado valido ate ' + venc.toLocaleDateString("pt-BR") + ' (' + dias + ' dias).</span>';
    }
}

function selecionarCert(file) {
    if (!file.name.match(/\.(pfx|p12)$/i)) {
        flexToast("Selecione um arquivo .pfx ou .p12.", "aviso");
        return;
    }
    _certArquivo = file;
    var area = document.getElementById("cert-upload-area");
    area.querySelector("p").textContent = file.name;
    area.querySelector("small").textContent = (file.size / 1024).toFixed(1) + " KB - clique para trocar";
    area.style.borderColor = "var(--emp-success)";
    area.style.background = "var(--emp-success-lt)";
    area.querySelector(".emp-cert-icone").innerHTML = '<i class="bi bi-file-earmark-lock2-fill" style="color:var(--emp-success)"></i>';
}

function salvarCertificado() {
    if (!_certArquivo) { flexToast("Selecione o arquivo .pfx primeiro.", "aviso"); return; }
    var senha = document.getElementById("cert-senha").value;
    if (!senha) { flexToast("Informe a senha do certificado.", "aviso"); return; }

    var btn = document.getElementById("btn-salvar-cert");
    setBtnLoading(btn, true);

    var form = new FormData();
    form.append("arquivo", _certArquivo);
    form.append("senha", senha);

    fetch("/Empresa/SalvarCertificado", { method: "POST", body: form })
        .then(function (res) {
            if (!res.ok) {
                return res.text().then(function (txt) {
                    var msg = txt;
                    try { msg = JSON.parse(txt).mensagem || txt; } catch (e) { }
                    throw new Error(msg);
                });
            }
            flexToast("Certificado salvo com sucesso!");
            _certArquivo = null;
            document.getElementById("cert-senha").value = "";
            return carregarFiscal();
        })
        .catch(function (err) { flexToast(err.message, "erro"); })
        .finally(function () { setBtnLoading(btn, false); });
}