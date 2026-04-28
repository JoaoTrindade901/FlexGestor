using Microsoft.AspNetCore.Mvc;
using WebApplication5.Models;
using WebApplication5.Services;

public class CaixaController : BaseController
{
    private readonly CaixaService _service;

    public CaixaController(CaixaService service) => _service = service;

    public IActionResult Index()
    {
        var r = VerificarSessao(); if (r != null) return r;
        return View();
    }

    public IActionResult Status()
    {
        var r = VerificarSessaoApi(); if (r != null) return r;
        var idEmpresa = HttpContext.Session.GetInt32("IdEmpresa")!.Value;
        var caixa = _service.BuscarAberto(idEmpresa);
        return Json(new { caixaAberto = caixa != null, caixa });
    }

    public IActionResult Historico()
    {
        var r = VerificarSessaoApi(); if (r != null) return r;
        var idEmpresa = HttpContext.Session.GetInt32("IdEmpresa")!.Value;
        return Json(_service.ListarHistorico(idEmpresa));
    }

    public IActionResult Lancamentos()
    {
        var r = VerificarSessaoApi(); if (r != null) return r;
        var idEmpresa = HttpContext.Session.GetInt32("IdEmpresa")!.Value;
        return Json(_service.ListarLancamentos(idEmpresa));
    }

    public IActionResult Breakdown()
    {
        var r = VerificarSessaoApi(); if (r != null) return r;
        var idEmpresa = HttpContext.Session.GetInt32("IdEmpresa")!.Value;
        return Json(_service.Breakdown(idEmpresa));
    }

    public IActionResult FormasPagamento()
    {
        var r = VerificarSessaoApi(); if (r != null) return r;
        var idEmpresa = HttpContext.Session.GetInt32("IdEmpresa")!.Value;
        return Json(_service.ListarFormasPagamento(idEmpresa));
    }

    public IActionResult Categorias()
    {
        var r = VerificarSessaoApi(); if (r != null) return r;
        var idEmpresa = HttpContext.Session.GetInt32("IdEmpresa")!.Value;
        return Json(_service.ListarCategorias(idEmpresa));
    }

    public IActionResult SaldoAnterior()
    {
        var r = VerificarSessaoApi(); if (r != null) return r;
        var idEmpresa = HttpContext.Session.GetInt32("IdEmpresa")!.Value;
        var saldo = _service.BuscarSaldoUltimoCaixa(idEmpresa);
        return Json(new { saldo });
    }

    [HttpPost]
    public IActionResult Abrir([FromBody] AbrirCaixaDto dto)
    {
        var r = VerificarSessaoApi(); if (r != null) return r;
        var idEmpresa = HttpContext.Session.GetInt32("IdEmpresa");
        var idUsuario = HttpContext.Session.GetInt32("idUsuario");
        var nomeUsuario = HttpContext.Session.GetString("nomeUsuario");

        if (idEmpresa == null || idUsuario == null)
            return BadRequest($"Sessão inválida. idEmpresa={idEmpresa} idUsuario={idUsuario}");

        if (_service.BuscarAberto(idEmpresa.Value) != null)
            return BadRequest("Já existe um caixa aberto.");

        var idCaixa = _service.Abrir(idEmpresa.Value, idUsuario.Value, dto.SaldoInicial, nomeUsuario);
        return Ok(new { idCaixa });
    }

    [HttpPost]
    public IActionResult Fechar([FromBody] FecharCaixaDto dto)
    {
        var r = VerificarSessaoApi(); if (r != null) return r;
        var idEmpresa = HttpContext.Session.GetInt32("IdEmpresa")!.Value;
        var idUsuario = HttpContext.Session.GetInt32("idUsuario")!.Value;
        try { _service.Fechar(idEmpresa, idUsuario, dto.SaldoFinalContado, dto.Obs); return Ok(); }
        catch (InvalidOperationException ex) { return BadRequest(ex.Message); }
    }

    [HttpPost]
    public IActionResult Lancar([FromBody] LancarCaixaDto dto)
    {
        var r = VerificarSessaoApi(); if (r != null) return r;
        var idEmpresa = HttpContext.Session.GetInt32("IdEmpresa")!.Value;
        var idUsuario = HttpContext.Session.GetInt32("idUsuario")!.Value;
        try { var id = _service.Lancar(idEmpresa, idUsuario, dto); return Ok(new { idLancamento = id }); }
        catch (InvalidOperationException ex) { return BadRequest(ex.Message); }
    }

    [HttpPost]
    public IActionResult VendaRapida([FromBody] VendaRapidaDto dto)
    {
        var r = VerificarSessaoApi(); if (r != null) return r;
        var idEmpresa = HttpContext.Session.GetInt32("IdEmpresa")!.Value;
        var idUsuario = HttpContext.Session.GetInt32("idUsuario")!.Value;

        var catVenda = _service.ListarCategorias(idEmpresa).FirstOrDefault(c => c.Tipo == 1);
        if (catVenda == null) return BadRequest("Nenhuma categoria de entrada cadastrada.");

        try { var id = _service.VendaRapida(idEmpresa, idUsuario, dto, catVenda.idCategoriaFinanceira); return Ok(new { id }); }
        catch (InvalidOperationException ex) { return BadRequest(ex.Message); }
    }

    public IActionResult ContasReceber()
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
        return Ok(new { idContaReceber = id });
    }

    [HttpPost]
    public IActionResult ReceberConta([FromBody] ReceberContaDto dto)
    {
        var r = VerificarSessaoApi(); if (r != null) return r;
        var idEmpresa = HttpContext.Session.GetInt32("IdEmpresa")!.Value;
        var idUsuario = HttpContext.Session.GetInt32("idUsuario")!.Value;
        _service.ReceberConta(idEmpresa, idUsuario, dto);
        return Ok();
    }

    [HttpPost]
    public IActionResult AlterarVencimento([FromBody] AlterarVencimentoDto dto)
    {
        var r = VerificarSessaoApi(); if (r != null) return r;
        _service.AlterarVencimentoConta(dto.IdContaReceber, dto.NovaData);
        return Ok();
    }
}