using Microsoft.AspNetCore.Mvc;
using WebApplication5.Services;

public class HomeController : BaseController
{
    private readonly HomeService _service;

    public HomeController(HomeService service) => _service = service;

    public IActionResult Index()
    {
        var r = VerificarSessao(); if (r != null) return r;
        ViewBag.NomeUsuario = HttpContext.Session.GetString("nomeUsuario");
        return View();
    }

    // GET /Home/Dashboard — chamado pelo JS da página
    public IActionResult Dashboard()
    {
        var r = VerificarSessaoApi(); if (r != null) return r;
        var idEmpresa = HttpContext.Session.GetInt32("IdEmpresa")!.Value;
        var kpi = _service.BuscarDashboard(idEmpresa);
        return Json(kpi);
    }
}