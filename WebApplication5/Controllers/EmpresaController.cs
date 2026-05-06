// ===== EmpresaController.cs =====
using Microsoft.AspNetCore.Mvc;
using WebApplication5.Models;
using WebApplication5.Services;

public class EmpresaController : BaseController
{
    private readonly EmpresaService _service;
    private readonly AuditoriaService _auditoria;

    public EmpresaController(EmpresaService service, AuditoriaService auditoria)
    {
        _service = service;
        _auditoria = auditoria;
    }

    // ── View principal ──
    public IActionResult Index()
    {
        var r = VerificarSessao(); if (r != null) return r;
        return View();
    }

    // ── Buscar dados da empresa + endereço ──
    public IActionResult Buscar()
    {
        var r = VerificarSessaoApi(); if (r != null) return r;
        var idEmpresa = HttpContext.Session.GetInt32("IdEmpresa")!.Value;
        var (empresa, endereco) = _service.BuscarDados(idEmpresa);
        return Json(new { empresa, endereco });
    }

    // ── Salvar dados da empresa + endereço ──
    [HttpPost]
    public IActionResult Salvar([FromBody] SalvarEmpresaDto dto)
    {
        var r = VerificarSessaoApi(); if (r != null) return r;
        var idEmpresa = HttpContext.Session.GetInt32("IdEmpresa")!.Value;

        if (string.IsNullOrWhiteSpace(dto.Nome))
            return BadRequest(new { mensagem = "O nome da empresa é obrigatório." });
        if (string.IsNullOrWhiteSpace(dto.CNPJ))
            return BadRequest(new { mensagem = "O CNPJ é obrigatório." });

        _service.SalvarDados(idEmpresa, dto);
        Auditar("EMPRESA", "SALVAR", $"Dados da empresa #{idEmpresa} atualizados");
        return Ok(new { mensagem = "Dados salvos com sucesso." });
    }

    // ── Buscar configuração fiscal ──
    public IActionResult BuscarFiscal()
    {
        var r = VerificarSessaoApi(); if (r != null) return r;
        var idEmpresa = HttpContext.Session.GetInt32("IdEmpresa")!.Value;
        var config = _service.BuscarConfigFiscal(idEmpresa);
        return Json(config);
    }

    // ── Salvar configuração fiscal (sem certificado) ──
    [HttpPost]
    public IActionResult SalvarFiscal([FromBody] SalvarConfigFiscalDto dto)
    {
        var r = VerificarSessaoApi(); if (r != null) return r;
        var idEmpresa = HttpContext.Session.GetInt32("IdEmpresa")!.Value;
        _service.SalvarConfigFiscal(idEmpresa, dto);
        Auditar("EMPRESA", "SALVAR_FISCAL", $"Config fiscal da empresa #{idEmpresa} atualizada");
        return Ok(new { mensagem = "Configuração fiscal salva com sucesso." });
    }

    // ── Upload do certificado A1 ──
    [HttpPost]
    public IActionResult SalvarCertificado(IFormFile arquivo, string senha)
    {
        var r = VerificarSessaoApi(); if (r != null) return r;
        var idEmpresa = HttpContext.Session.GetInt32("IdEmpresa")!.Value;

        if (string.IsNullOrWhiteSpace(senha))
            return BadRequest(new { mensagem = "Informe a senha do certificado." });

        try
        {
            _service.SalvarCertificado(idEmpresa, arquivo, senha);
            Auditar("EMPRESA", "CERTIFICADO", $"Certificado A1 da empresa #{idEmpresa} atualizado");
            return Ok(new { mensagem = "Certificado salvo com sucesso." });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { mensagem = ex.Message });
        }
    }

    private void Auditar(string modulo, string acao, string descricao)
    {
        _auditoria.Registrar(new RegistrarAuditoriaDto
        {
            IdEmpresa = HttpContext.Session.GetInt32("IdEmpresa") ?? 0,
            IdUsuario = HttpContext.Session.GetInt32("idUsuario"),
            NomeUsuario = HttpContext.Session.GetString("nomeUsuario"),
            Modulo = modulo,
            Acao = acao,
            Descricao = descricao,
            IpUsuario = HttpContext.Connection.RemoteIpAddress?.ToString()
        });
    }
}