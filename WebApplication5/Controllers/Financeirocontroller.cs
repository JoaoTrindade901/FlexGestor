using Microsoft.AspNetCore.Mvc;
using WebApplication5.Models;
using WebApplication5.Services;

public class FinanceiroController : BaseController
{
    private readonly FinanceiroService _service;
    private readonly AuditoriaService _auditoria;

    public FinanceiroController(FinanceiroService service, AuditoriaService auditoria)
    {
        _service = service;
        _auditoria = auditoria;
    }

    public IActionResult Index()
    {
        var r = VerificarSessao(); if (r != null) return r;
        return View();
    }

    // ── CONTAS A RECEBER ──────────────────────────────────
    public IActionResult ListarContasReceber()
    {
        var r = VerificarSessaoApi(); if (r != null) return r;
        var idEmpresa = HttpContext.Session.GetInt32("IdEmpresa")!.Value;
        return Json(_service.ListarContasReceber(idEmpresa));
    }

    [HttpPost]
    public IActionResult CriarContaReceber([FromBody] CriarContaReceberDto dto)
    {
        var r = VerificarSessaoApi(); if (r != null) return r;
        var idEmpresa = HttpContext.Session.GetInt32("IdEmpresa")!.Value;
        var id = _service.CriarContaReceber(idEmpresa, dto);
        Auditar("FINANCEIRO", "CRIAR_RECEBER", $"Conta a receber #{id} criada — R$ {dto.ValorTotal:F2}");
        return Ok(new { idContaReceber = id });
    }

    [HttpPost]
    public IActionResult ReceberConta([FromBody] ReceberContaFinanceiroDto dto)
    {
        var r = VerificarSessaoApi(); if (r != null) return r;
        var idEmpresa = HttpContext.Session.GetInt32("IdEmpresa")!.Value;
        var idUsuario = HttpContext.Session.GetInt32("idUsuario")!.Value;
        _service.ReceberConta(idEmpresa, idUsuario, dto);
        Auditar("FINANCEIRO", "RECEBER_CONTA", $"Recebimento R$ {dto.ValorPago:F2} — Conta #{dto.IdContaReceber}");
        return Ok();
    }

    [HttpPost]
    public IActionResult AlterarVencimentoReceber([FromBody] AlterarVencimentoContaReceberDto dto)
    {
        var r = VerificarSessaoApi(); if (r != null) return r;
        _service.AlterarVencimentoContaReceber(dto.IdContaReceber, dto.NovaData);
        Auditar("FINANCEIRO", "EDITAR_RECEBER", $"Vencimento conta #{dto.IdContaReceber} → {dto.NovaData:dd/MM/yyyy}");
        return Ok();
    }

    // ── CONTAS A PAGAR ────────────────────────────────────
    public IActionResult ListarContasPagar()
    {
        var r = VerificarSessaoApi(); if (r != null) return r;
        var idEmpresa = HttpContext.Session.GetInt32("IdEmpresa")!.Value;
        return Json(_service.ListarContasPagar(idEmpresa));
    }

    [HttpPost]
    public IActionResult CriarContaPagar([FromBody] CriarContaPagarDto dto)
    {
        var r = VerificarSessaoApi(); if (r != null) return r;
        var idEmpresa = HttpContext.Session.GetInt32("IdEmpresa")!.Value;
        var id = _service.CriarContaPagar(idEmpresa, dto);
        Auditar("FINANCEIRO", "CRIAR_PAGAR", $"Conta a pagar #{id} criada — R$ {dto.ValorTotal:F2}");
        return Ok(new { idContaPagar = id });
    }

    [HttpPost]
    public IActionResult PagarConta([FromBody] PagarContaDto dto)
    {
        var r = VerificarSessaoApi(); if (r != null) return r;
        var idEmpresa = HttpContext.Session.GetInt32("IdEmpresa")!.Value;
        var idUsuario = HttpContext.Session.GetInt32("idUsuario")!.Value;
        _service.PagarConta(idEmpresa, idUsuario, dto);
        Auditar("FINANCEIRO", "PAGAR_CONTA", $"Pagamento R$ {dto.ValorPago:F2} — Conta #{dto.IdContaPagar}");
        return Ok();
    }

    [HttpPost]
    public IActionResult AlterarVencimentoPagar([FromBody] AlterarVencimentoContaPagarDto dto)
    {
        var r = VerificarSessaoApi(); if (r != null) return r;
        _service.AlterarVencimentoContaPagar(dto.IdContaPagar, dto.NovaData);
        Auditar("FINANCEIRO", "EDITAR_PAGAR", $"Vencimento conta #{dto.IdContaPagar} → {dto.NovaData:dd/MM/yyyy}");
        return Ok();
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

    [HttpPost]
    public IActionResult EditarContaReceber([FromBody] EditarContaReceberDto dto)
    {
        var r = VerificarSessaoApi(); if (r != null) return r;
        _service.EditarContaReceber(dto);
        return Ok();
    }

    [HttpPost]
    public IActionResult ExcluirContaReceber([FromBody] int id)
    {
        var r = VerificarSessaoApi(); if (r != null) return r;
        _service.ExcluirContaReceber(id);
        return Ok();
    }

    public IActionResult ListarPagamentosContaReceber(int id)
    {
        var r = VerificarSessaoApi(); if (r != null) return r;
        return Json(_service.ListarPagamentosContaReceber(id));
    }

    [HttpPost]
    public IActionResult EditarContaPagar([FromBody] EditarContaPagarDto dto)
    {
        var r = VerificarSessaoApi(); if (r != null) return r;
        _service.EditarContaPagar(dto);
        return Ok();
    }

    [HttpPost]
    public IActionResult ExcluirContaPagar([FromBody] int id)
    {
        var r = VerificarSessaoApi(); if (r != null) return r;
        _service.ExcluirContaPagar(id);
        return Ok();
    }

    public IActionResult ListarPagamentosContaPagar(int id)
    {
        var r = VerificarSessaoApi(); if (r != null) return r;
        return Json(_service.ListarPagamentosContaPagar(id));
    }

    // ── EXPORTAR ─────────────────────────────────────────────────
    public IActionResult ExportarExcel(string tipo)
    {
        var r = VerificarSessaoApi(); if (r != null) return r;
        var idEmpresa = HttpContext.Session.GetInt32("IdEmpresa")!.Value;
        var bytes = _service.GerarExcel(idEmpresa, tipo);
        var nome = $"financeiro_{tipo}_{DateTime.Now:yyyyMMdd}.xlsx";
        return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", nome);
    }

    public IActionResult ExportarPdf(string tipo)
    {
        var r = VerificarSessaoApi(); if (r != null) return r;
        var idEmpresa = HttpContext.Session.GetInt32("IdEmpresa")!.Value;
        var bytes = _service.GerarPdf(idEmpresa, tipo);
        var nome = $"financeiro_{tipo}_{DateTime.Now:yyyyMMdd}.pdf";
        return File(bytes, "application/pdf", nome);
    }
}