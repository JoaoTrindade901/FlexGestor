using Microsoft.AspNetCore.Mvc;
using WebApplication5.Models;
using WebApplication5.Services;

public class PedidoController : BaseController
{
    private readonly PedidoService _service;

    public PedidoController(PedidoService service) => _service = service;

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
        var idUsuario = HttpContext.Session.GetInt32("idUsuario")!.Value;
        var idGerado = _service.Criar(dto, idEmpresa, idUsuario);
        return Ok(new { idPedido = idGerado });
    }

    [HttpPost]
    public IActionResult AtualizarStatus([FromBody] AtualizarStatusPedidoDto dto)
    {
        var r = VerificarSessaoApi(); if (r != null) return r;
        var idUsuario = HttpContext.Session.GetInt32("idUsuario")!.Value;
        _service.AtualizarStatus(dto.IdPedido, dto.StatusPedidoId, idUsuario);
        return Ok();
    }

    [HttpPost]
    public IActionResult Cancelar([FromBody] int idPedido)
    {
        var r = VerificarSessaoApi(); if (r != null) return r;
        _service.Cancelar(idPedido);
        return Ok();
    }

    [HttpPost]
    public IActionResult Editar([FromBody] PedidoEditarDto dto)
    {
        var r = VerificarSessaoApi(); if (r != null) return r;
        var idEmpresa = HttpContext.Session.GetInt32("IdEmpresa")!.Value;
        var idUsuario = HttpContext.Session.GetInt32("idUsuario")!.Value;
        _service.Editar(dto, idEmpresa, idUsuario);
        return Ok();
    }

    public IActionResult ListarPagamentos(int idPedido)
    {
        var r = VerificarSessaoApi(); if (r != null) return r;
        return Json(_service.ListarPagamentos(idPedido));
    }

    public IActionResult ListarHistoricoStatus(int idPedido)
    {
        var r = VerificarSessaoApi(); if (r != null) return r;
        return Json(_service.ListarHistoricoStatus(idPedido));
    }
}