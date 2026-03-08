using Microsoft.AspNetCore.Mvc;

public class BaseController : Controller
{
    protected bool SessaoValida =>
        HttpContext.Session.GetInt32("idUsuario") != null;

    protected IActionResult? VerificarSessao() =>
        SessaoValida ? null : RedirectToAction("Index", "Login");

    protected IActionResult? VerificarSessaoApi() =>
        SessaoValida ? null : Unauthorized();
}