using Microsoft.AspNetCore.Mvc;
using WebApplication5.Exceptions;
using WebApplication5.Models;
using WebApplication5.Repositories;
using WebApplication5.Services;

public class UsuarioController : BaseController
{
    private readonly UsuarioService _service;
    private readonly CargoRepository _cargoRepository;
    private readonly AuditoriaService _auditoria;

    public UsuarioController(UsuarioService service, CargoRepository cargoRepository, AuditoriaService auditoria)
    {
        _service = service;
        _cargoRepository = cargoRepository;
        _auditoria = auditoria;
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
            Auditar("USUARIO", "CRIAR", $"Usuário '{usuario.Nome}' criado");
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
            Auditar("USUARIO", "EDITAR", $"Usuário '{usuario.Nome}' editado");
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
        Auditar("USUARIO", "ALTERAR_STATUS", $"Status do usuário #{id} alterado");
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
}