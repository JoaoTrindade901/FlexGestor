using Microsoft.AspNetCore.Mvc;
using WebApplication5.Repositories;
using WebApplication5.Services;

public class FornecedorController : BaseController
{
    private readonly FornecedorService _service;
    public FornecedorController(FornecedorService service) => _service = service;

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
    public IActionResult Criar([FromBody] FornecedorModel f)
    {
        var r = VerificarSessaoApi(); if (r != null) return r;
        var idEmpresa = HttpContext.Session.GetInt32("IdEmpresa")!.Value;
        var idGerado = _service.Criar(f, idEmpresa);
        return Ok(new { idFornecedor = idGerado });
    }

    [HttpPost]
    public IActionResult Editar([FromBody] FornecedorModel f)
    {
        var r = VerificarSessaoApi(); if (r != null) return r;
        _service.Editar(f);
        return Ok();
    }

    [HttpPost]
    public IActionResult AlterarStatus([FromBody] int idFornecedor)
    {
        var r = VerificarSessaoApi(); if (r != null) return r;
        _service.AlterarStatus(idFornecedor);
        return Ok();
    }
}