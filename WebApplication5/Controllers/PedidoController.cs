using Microsoft.AspNetCore.Mvc;
using WebApplication5.Models;
using WebApplication5.Services;

public class PedidoController : BaseController
{
    private readonly PedidoService _service;

    public PedidoController(PedidoService service)
    {
        _service = service;
    }

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

    [HttpPost]
    public IActionResult Filtrar([FromBody] PedidoFiltroDto filtro)
    {
        var r = VerificarSessaoApi(); if (r != null) return r;
        var idEmpresa = HttpContext.Session.GetInt32("IdEmpresa")!.Value;
        return Json(_service.Filtrar(filtro, idEmpresa));
    }

    public IActionResult ListarItens(int idPedido)
    {
        var r = VerificarSessaoApi(); if (r != null) return r;
        return Json(_service.ListarItens(idPedido));
    }

    [HttpPost]
    public IActionResult Criar([FromBody] PedidoCriarDto dto)
    {
        var r = VerificarSessaoApi(); if (r != null) return r;
        var idEmpresa = HttpContext.Session.GetInt32("IdEmpresa")!.Value;
        var idGerado = _service.Criar(dto, idEmpresa);
        return Ok(new { idPedido = idGerado });
    }

    [HttpPost]
    public IActionResult AtualizarStatus([FromBody] AtualizarStatusDto dto)
    {
        var r = VerificarSessaoApi(); if (r != null) return r;
        _service.AtualizarStatus(dto.IdPedido, dto.Status);
        return Ok();
    }

    [HttpPost]
    public IActionResult Cancelar([FromBody] int idPedido)
    {
        var r = VerificarSessaoApi(); if (r != null) return r;
        _service.Cancelar(idPedido);
        return Ok();
    }
}

public class AtualizarStatusDto
{
    public int IdPedido { get; set; }
    public string Status { get; set; } = string.Empty;
}
