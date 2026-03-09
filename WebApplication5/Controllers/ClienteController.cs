using Microsoft.AspNetCore.Mvc;
using WebApplication5.Models;
using WebApplication5.Services;

public class ClienteController : BaseController
{
    private readonly ClienteService _service;

    public ClienteController(ClienteService service)
    {
        _service = service;
    }

    public IActionResult Index()
    {
        if (HttpContext.Session.GetInt32("idUsuario") == null)
            return RedirectToAction("Index", "Login");
        return View();
    }

    public IActionResult Listar()
    {
        var r = VerificarSessaoApi(); if (r != null) return r;
        return Json(_service.Listar());
    }

    [HttpPost]
    public IActionResult Filtrar([FromBody] ClienteFiltroDto filtro)
    {
        var r = VerificarSessaoApi(); if (r != null) return r;
        return Json(_service.Filtrar(filtro));
    }

    [HttpPost]
    public IActionResult Criar([FromBody] ClienteCriarDto dto)
    {
        var r = VerificarSessaoApi(); if (r != null) return r;

        var idGerado = _service.CriarCliente(dto);
        return Ok(new { idCliente = idGerado });
    }

    [HttpPost]
    public IActionResult Editar([FromBody] ClienteCriarDto dto)
    {
        var r = VerificarSessaoApi(); if (r != null) return r;

        _service.EditarCliente(dto);
        return Ok();
    }

    [HttpPost]
    public IActionResult Deletar([FromBody] int idCliente)
    {
        var r = VerificarSessaoApi(); if (r != null) return r;

        _service.DeletarCliente(idCliente);
        return Ok();
    }
}