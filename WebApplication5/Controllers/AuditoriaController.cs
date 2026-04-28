using Microsoft.AspNetCore.Mvc;
using WebApplication5.Models;
using WebApplication5.Services;

public class AuditoriaController : BaseController
{
    private readonly AuditoriaService _service;

    public AuditoriaController(AuditoriaService service)
        => _service = service;

    public IActionResult Index()
    {
        var r = VerificarSessao(); if (r != null) return r;
        return View();
    }

    public IActionResult Listar([FromQuery] AuditoriaFiltroDto filtro)
    {
        var r = VerificarSessaoApi(); if (r != null) return r;
        var idEmpresa = HttpContext.Session.GetInt32("IdEmpresa")!.Value;
        return Json(_service.Listar(idEmpresa, filtro));
    }

    public IActionResult Modulos()
    {
        var r = VerificarSessaoApi(); if (r != null) return r;
        var idEmpresa = HttpContext.Session.GetInt32("IdEmpresa")!.Value;
        return Json(_service.ListarModulos(idEmpresa));
    }
}