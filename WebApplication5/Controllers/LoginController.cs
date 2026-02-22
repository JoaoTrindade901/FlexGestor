using Microsoft.AspNetCore.Mvc;
using WebApplication5.Services;

namespace WebApplication5.Controllers
{
    public class LoginController : Controller
    {
        private readonly LoginService _service;

        public LoginController(LoginService service)
        {
            _service = service;
        }

        // GET: /Login
        [HttpGet]
        public IActionResult Index()
        {
            return View();
        }

        [HttpPost]
        public IActionResult Entrar(string login, string senha)
        {
            var user = _service.Autenticar(login, senha);

            if (user == null)
            {
                ViewBag.Erro = "Login ou senha inválidos";
                return View("Index");
            }

            return RedirectToAction("Index", "Usuario");
        }
    }
}