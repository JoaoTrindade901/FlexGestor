using Microsoft.AspNetCore.Mvc;
using WebApplication5.Services;

namespace WebApplication5.Controllers
{
    public class LoginController : Controller
    {
        private readonly LoginService _service;
        private readonly SenhaResetService _senhaResetService;

        public LoginController(LoginService service, SenhaResetService senhaResetService)
        {
            _service = service;
            _senhaResetService = senhaResetService;
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

            HttpContext.Session.SetInt32("idUsuario", user.IdUsuario);
            HttpContext.Session.SetString("nomeUsuario", user.Nome);

            return RedirectToAction("Index", "Home");
        }

        [HttpGet]
        public IActionResult EsqueciSenha() => View();

        [HttpPost]
        public async Task<IActionResult> EsqueciSenha(string email)
        {
            await _senhaResetService.SolicitarReset(email);
            ViewBag.Mensagem = "Se o email existir, você receberá as instruções em breve.";
            return View();
        }

        [HttpGet]
        public IActionResult RedefinirSenha(string token)
        {
            if (string.IsNullOrEmpty(token))
                return RedirectToAction("Index", "Login");
            ViewBag.Token = token;
            return View();
        }

        [HttpPost]
        public IActionResult RedefinirSenha(string token, string novaSenha, string confirmarSenha)
        {
            if (novaSenha != confirmarSenha)
            {
                ViewBag.Erro = "As senhas não conferem.";
                ViewBag.Token = token;
                return View();
            }
            var sucesso = _senhaResetService.RedefinirSenha(token, novaSenha);
            if (!sucesso)
            {
                ViewBag.Erro = "Link inválido ou expirado.";
                ViewBag.Token = token;
                return View();
            }
            return RedirectToAction("Index", "Login");
        }


        public IActionResult Sair()
        {
            HttpContext.Session.Clear();
            return RedirectToAction("Index", "Login");
        }
    }
}