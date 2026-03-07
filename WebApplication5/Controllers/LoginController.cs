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
        public IActionResult Entrar(string login, string senha, string cnpj)
        {
            var user = _service.Autenticar(login, senha, cnpj);

            if (user == null)
            {
                ModelState.AddModelError(string.Empty, "Login ou senha inválidos");
                return View("Index");
            }

            return RedirectToAction("Index", "Usuario");
        }
    }
}