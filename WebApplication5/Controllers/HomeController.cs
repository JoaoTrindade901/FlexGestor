using Microsoft.AspNetCore.Mvc;

public class HomeController : BaseController
{
    public IActionResult Index()
    {
        var r = VerificarSessao(); if (r != null) return r;
        if (HttpContext.Session.GetInt32("idUsuario") == null)
            return RedirectToAction("Index", "Login");

        ViewBag.NomeUsuario = HttpContext.Session.GetString("nomeUsuario");
        return View();
    }
}