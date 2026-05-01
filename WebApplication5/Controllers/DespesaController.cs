using Microsoft.AspNetCore.Mvc;
using WebApplication5.Models;
using WebApplication5.Services;

public class DespesaController : BaseController
{
    private readonly DespesaService _service;
    private readonly AuditoriaService _auditoria;

    public DespesaController(DespesaService service, AuditoriaService auditoria)
    {
        _service = service;
        _auditoria = auditoria;
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
    public IActionResult Criar([FromBody] SalvarDespesaDto dto)
    {
        var r = VerificarSessaoApi(); if (r != null) return r;
        var idEmpresa = HttpContext.Session.GetInt32("IdEmpresa")!.Value;
        var id = _service.Criar(idEmpresa, dto);
        Auditar("DESPESA", "CRIAR", $"Categoria de despesa \"{dto.Nome}\" criada");
        return Ok(new { id });
    }

    [HttpPost]
    public IActionResult Editar([FromBody] SalvarDespesaDto dto)
    {
        var r = VerificarSessaoApi(); if (r != null) return r;
        _service.Editar(dto);
        Auditar("DESPESA", "EDITAR", $"Categoria de despesa #{dto.Id} editada");
        return Ok();
    }

    [HttpPost]
    public IActionResult AlterarStatus([FromBody] AlterarStatusDespesaDto dto)
    {
        var r = VerificarSessaoApi(); if (r != null) return r;
        _service.AlterarStatus(dto.Id, dto.Ativo);
        Auditar("DESPESA", dto.Ativo ? "ATIVAR" : "INATIVAR", $"Categoria #{dto.Id} {(dto.Ativo ? "ativada" : "inativada")}");
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