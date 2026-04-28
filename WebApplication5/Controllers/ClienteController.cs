using Microsoft.AspNetCore.Mvc;
using WebApplication5.Models;
using WebApplication5.Services;

public class ClienteController : BaseController
{
    private readonly ClienteService _service;
    private readonly AuditoriaService _auditoria;

    public ClienteController(ClienteService service, AuditoriaService auditoria)
    {
        _service = service;
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
        dto.Cliente.idEmpresa = HttpContext.Session.GetInt32("IdEmpresa") ?? 0;
        try
        {
            var idGerado = _service.CriarCliente(dto);
            Auditar("CLIENTE", "CRIAR", $"Cliente '{dto.Cliente.nome}' criado (CPF: {dto.Cliente.cpfCNPJ})");
            return Ok(new { idCliente = idGerado });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { mensagem = ex.Message });
        }
    }

    [HttpPost]
    public IActionResult Editar([FromBody] ClienteCriarDto dto)
    {
        var r = VerificarSessaoApi(); if (r != null) return r;
        _service.EditarCliente(dto);
        Auditar("CLIENTE", "EDITAR", $"Cliente '{dto.Cliente.nome}' editado");
        return Ok();
    }

    [HttpPost]
    public IActionResult Deletar([FromBody] int idCliente)
    {
        var r = VerificarSessaoApi(); if (r != null) return r;
        _service.DeletarCliente(idCliente);
        Auditar("CLIENTE", "INATIVAR", $"Cliente #{idCliente} inativado/reativado");
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