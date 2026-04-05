using Microsoft.AspNetCore.Mvc;

namespace WebApplication5.Controllers
{
    public class EstoqueHistoricoController : BaseController
    {
        public IActionResult Index()
        {
            var r = VerificarSessao(); if (r != null) return r;
            return View();
        }
    }
}
