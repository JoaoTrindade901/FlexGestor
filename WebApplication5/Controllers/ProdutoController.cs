using Microsoft.AspNetCore.Mvc;
using WebApplication5.Models;
using WebApplication5.Services;

public class ProdutoController : BaseController
{
    private readonly ProdutoService _service;

    public ProdutoController(ProdutoService service)
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
    public IActionResult Filtrar([FromBody] ProdutoFiltroDto filtro)
    {
        var r = VerificarSessaoApi(); if (r != null) return r;
        var idEmpresa = HttpContext.Session.GetInt32("IdEmpresa")!.Value;
        return Json(_service.Filtrar(filtro, idEmpresa));
    }

    [HttpPost]
    public IActionResult Criar([FromBody] ProdutoModel produto)
    {
        var r = VerificarSessaoApi(); if (r != null) return r;
        var idEmpresa = HttpContext.Session.GetInt32("IdEmpresa")!.Value;
        var idGerado = _service.Criar(produto, idEmpresa);
        return Ok(new { idProduto = idGerado });
    }

    [HttpPost]
    public IActionResult Editar([FromBody] ProdutoModel produto)
    {
        var r = VerificarSessaoApi(); if (r != null) return r;
        _service.Editar(produto);
        return Ok();
    }

    [HttpPost]
    public IActionResult AlterarStatus([FromBody] int idProduto)
    {
        var r = VerificarSessaoApi(); if (r != null) return r;
        _service.AlterarStatus(idProduto);
        return Ok();
    }
}
