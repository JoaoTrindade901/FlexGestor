using Microsoft.AspNetCore.Mvc;

public class MLController : BaseController
{
    public IActionResult Index()
    {
        var r = VerificarSessao();
        if (r != null) return r;
        return View();
    }

    public IActionResult EDA()
    {
        var r = VerificarSessao();
        if (r != null) return r;
        return View();
    }
}