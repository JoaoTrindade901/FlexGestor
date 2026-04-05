// Controllers/EstoqueController.cs
using Microsoft.AspNetCore.Mvc;
using WebApplication5.Models;
using WebApplication5.Services;

public class EstoqueController : BaseController
{
    private readonly EstoqueService _service;

    public EstoqueController(EstoqueService service) => _service = service;

    public IActionResult Index()
    {
        var r = VerificarSessao(); if (r != null) return r;
        return View();
    }

    public IActionResult Listar()
    {
        var r = VerificarSessaoApi(); if (r != null) return r;
        var idEmpresa = HttpContext.Session.GetInt32("IdEmpresa")!.Value;
        return Json(_service.Listar(idEmpresa));
    }

    public IActionResult ListarMovimentacoes()
    {
        var r = VerificarSessaoApi(); if (r != null) return r;
        var idEmpresa = HttpContext.Session.GetInt32("IdEmpresa")!.Value;
        return Json(_service.ListarMovimentacoes(idEmpresa));
    }

    [HttpPost]
    public IActionResult Movimentar([FromBody] MovimentacaoEstoqueModel m)
    {
        var r = VerificarSessaoApi(); if (r != null) return r;
        var idEmpresa = HttpContext.Session.GetInt32("IdEmpresa")!.Value;
        var idUsuario = HttpContext.Session.GetInt32("idUsuario")!.Value;
        _service.Movimentar(m, idEmpresa, idUsuario);
        return Ok();
    }

    [HttpPost]
    public IActionResult AtualizarMinimo([FromBody] AtualizarMinimoDto dto)
    {
        var r = VerificarSessaoApi(); if (r != null) return r;
        _service.AtualizarMinimo(dto.IdProduto, dto.EstoqueMinimo);
        return Ok();
    }
}

public class AtualizarMinimoDto
{
    public int IdProduto { get; set; }
    public int EstoqueMinimo { get; set; }
}