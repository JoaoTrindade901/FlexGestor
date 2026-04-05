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

    // GET status do caixa atual
    public IActionResult Status()
    {
        var r = VerificarSessaoApi(); if (r != null) return r;
        var idEmpresa = HttpContext.Session.GetInt32("IdEmpresa")!.Value;
        var caixa = _service.BuscarAberto(idEmpresa);
        return Json(new { caixaAberto = caixa != null, caixa });
    }

    // GET histórico de caixas
    public IActionResult Historico()
    {
        var r = VerificarSessaoApi(); if (r != null) return r;
        var idEmpresa = HttpContext.Session.GetInt32("IdEmpresa")!.Value;
        return Json(_service.ListarHistorico(idEmpresa));
    }

    // GET lançamentos do caixa aberto
    public IActionResult Lancamentos()
    {
        var r = VerificarSessaoApi(); if (r != null) return r;
        var idEmpresa = HttpContext.Session.GetInt32("IdEmpresa")!.Value;
        return Json(_service.ListarLancamentos(idEmpresa));
    }

    // GET formas de pagamento
    public IActionResult FormasPagamento()
    {
        var r = VerificarSessaoApi(); if (r != null) return r;
        var idEmpresa = HttpContext.Session.GetInt32("IdEmpresa")!.Value;
        return Json(_service.ListarFormasPagamento(idEmpresa));
    }

    // GET categorias financeiras
    public IActionResult Categorias()
    {
        var r = VerificarSessaoApi(); if (r != null) return r;
        var idEmpresa = HttpContext.Session.GetInt32("IdEmpresa")!.Value;
        return Json(_service.ListarCategorias(idEmpresa));
    }

    [HttpPost]
    public IActionResult Abrir([FromBody] AbrirCaixaDto dto)
    {
        var r = VerificarSessaoApi(); if (r != null) return r;
        var idEmpresa = HttpContext.Session.GetInt32("IdEmpresa")!.Value;
        var idUsuario = HttpContext.Session.GetInt32("idUsuario")!.Value;

        // Não permite abrir se já tiver aberto
        if (_service.BuscarAberto(idEmpresa) != null)
            return BadRequest("Já existe um caixa aberto.");

        var idCaixa = _service.Abrir(idEmpresa, idUsuario, dto.SaldoInicial);
        return Ok(new { idCaixa });
    }

    [HttpPost]
    public IActionResult Fechar([FromBody] FecharCaixaDto dto)
    {
        var r = VerificarSessaoApi(); if (r != null) return r;
        var idUsuario = HttpContext.Session.GetInt32("idUsuario")!.Value;
        _service.Fechar(dto.IdCaixa, idUsuario, dto.SaldoFinal);
        return Ok();
    }

    [HttpPost]
    public IActionResult Lancar([FromBody] LancarCaixaDto dto)
    {
        var r = VerificarSessaoApi(); if (r != null) return r;
        var idEmpresa = HttpContext.Session.GetInt32("IdEmpresa")!.Value;
        var idUsuario = HttpContext.Session.GetInt32("idUsuario")!.Value;
        try
        {
            var id = _service.Lancar(idEmpresa, idUsuario, dto);
            return Ok(new { idLancamento = id });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }
}