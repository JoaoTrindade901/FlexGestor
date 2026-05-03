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
    public IActionResult Dashboard(DateTime? dataInicio, DateTime? dataFim)
    {
        var r = VerificarSessaoApi(); if (r != null) return r;
        var idEmpresa = HttpContext.Session.GetInt32("IdEmpresa")!.Value;

        var inicio = dataInicio ?? new DateTime(DateTime.Now.Year, DateTime.Now.Month, 1);
        var fim = dataFim ?? DateTime.Now;

        var kpi = _service.BuscarDashboard(idEmpresa, inicio, fim);
        return Json(kpi);
    }
}