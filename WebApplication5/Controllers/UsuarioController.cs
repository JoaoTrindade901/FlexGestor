using Microsoft.AspNetCore.Mvc;
using WebApplication5.Models;
using WebApplication5.Repositories;
using WebApplication5.Services;

public class UsuarioController : BaseController
{
    private readonly UsuarioService _service;
    private readonly CargoRepository _cargoRepository;

    public UsuarioController(UsuarioService service, CargoRepository cargoRepository)
    {
        _service = service;
        _cargoRepository = cargoRepository;
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

    public IActionResult ListarCargos()
    {
        var r = VerificarSessaoApi(); if (r != null) return r;
        return Json(_cargoRepository.Listar());
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public IActionResult Criar([FromBody] UsuarioModel usuario)
    {
        var r = VerificarSessaoApi(); if (r != null) return r;
        _service.Criar(usuario);
        return Ok();
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public IActionResult Editar([FromBody] UsuarioModel usuario)
    {
        var r = VerificarSessaoApi(); if (r != null) return r;
        _service.Editar(usuario);
        return Ok();
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public IActionResult AlterarStatus(int id)
    {
        var r = VerificarSessaoApi(); if (r != null) return r;
        _service.AlterarStatus(id);
        return Ok();
    }
}