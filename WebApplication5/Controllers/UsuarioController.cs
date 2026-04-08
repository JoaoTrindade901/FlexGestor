using Microsoft.AspNetCore.Mvc;
using WebApplication5.Exceptions;
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
        var idEmpresa = HttpContext.Session.GetInt32("IdEmpresa");
        if (idEmpresa == null) return Unauthorized();
        return Ok(_service.Listar(idEmpresa.Value));
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
        try
        {
            _service.Criar(usuario);
            return Ok();
        }
        catch (RegraNegocioException ex)
        {
            return BadRequest(new { mensagem = ex.Message });
        }
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public IActionResult Editar([FromBody] UsuarioModel usuario)
    {
        var r = VerificarSessaoApi(); if (r != null) return r;
        try
        {
            _service.Editar(usuario);
            return Ok();
        }
        catch (RegraNegocioException ex)
        {
            return BadRequest(new { mensagem = ex.Message });
        }
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