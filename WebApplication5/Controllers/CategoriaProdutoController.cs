using Microsoft.AspNetCore.Mvc;
using WebApplication5.Models;
using WebApplication5.Services;

public class CategoriaProdutoController : BaseController
{
    private readonly CategoriaProdutoService _service;
    public CategoriaProdutoController(CategoriaProdutoService service)
        => _service = service;

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
    public IActionResult Criar([FromBody] CategoriaProdutoModel cat)
    {
        var r = VerificarSessaoApi(); if (r != null) return r;
        var idEmpresa = HttpContext.Session.GetInt32("IdEmpresa")!.Value;
        var id = _service.Criar(cat, idEmpresa);
        return Ok(new { idCategoria = id });
    }

    [HttpPost]
    public IActionResult Editar([FromBody] CategoriaProdutoModel cat)
    {
        var r = VerificarSessaoApi(); if (r != null) return r;
        _service.Editar(cat);
        return Ok();
    }

    [HttpPost]
    public IActionResult AlterarStatus([FromBody] int idCategoria)
    {
        var r = VerificarSessaoApi(); if (r != null) return r;
        _service.AlterarStatus(idCategoria);
        return Ok();
    }
}