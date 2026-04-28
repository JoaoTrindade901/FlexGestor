using Microsoft.AspNetCore.Mvc;
using WebApplication5.Models;
using WebApplication5.Services;

namespace WebApplication5.Controllers
{
    public class LoginController : Controller
    {
        private readonly LoginService _service;
        private readonly SenhaResetService _senhaResetService;
        private readonly AuditoriaService _auditoria;

        public LoginController(LoginService service, SenhaResetService senhaResetService, AuditoriaService auditoria)
        {
            _service = service;
            _senhaResetService = senhaResetService;
            _auditoria = auditoria;
        }

        [HttpGet]
        public IActionResult Index() => View();

        [HttpPost]
        public IActionResult Entrar(string login, string senha, string cnpj)
        {
            var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
            var user = _service.Autenticar(login, senha, cnpj);

            if (user == null)
            {
                // Registra tentativa falha
                _auditoria.Registrar(new RegistrarAuditoriaDto
                {
                    IdEmpresa = 0,
                    NomeUsuario = login,
                    Modulo = "AUTH",
                    Acao = "LOGIN_FALHA",
                    Descricao = $"Tentativa de login falhou para '{login}'",
                    IpUsuario = ip
                });
                ModelState.AddModelError(string.Empty, "Login ou senha inválidos");
                return View("Index");
            }

            HttpContext.Session.SetInt32("idUsuario", user.IdUsuario);
            HttpContext.Session.SetString("nomeUsuario", user.Nome);
            HttpContext.Session.SetInt32("IdEmpresa", user.idEmpresa);

            _auditoria.Registrar(new RegistrarAuditoriaDto
            {
                IdEmpresa = user.idEmpresa,
                IdUsuario = user.IdUsuario,
                NomeUsuario = user.Nome,
                Modulo = "AUTH",
                Acao = "LOGIN",
                Descricao = $"Usuário '{user.Nome}' realizou login",
                IpUsuario = ip
            });

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
            if (string.IsNullOrEmpty(token)) return RedirectToAction("Index", "Login");
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
            var idEmpresa = HttpContext.Session.GetInt32("IdEmpresa") ?? 0;
            var idUsuario = HttpContext.Session.GetInt32("idUsuario");
            var nomeUsuario = HttpContext.Session.GetString("nomeUsuario");
            var ip = HttpContext.Connection.RemoteIpAddress?.ToString();

            _auditoria.Registrar(new RegistrarAuditoriaDto
            {
                IdEmpresa = idEmpresa,
                IdUsuario = idUsuario,
                NomeUsuario = nomeUsuario,
                Modulo = "AUTH",
                Acao = "LOGOUT",
                Descricao = $"Usuário '{nomeUsuario}' saiu do sistema",
                IpUsuario = ip
            });

            HttpContext.Session.Clear();
            return RedirectToAction("Index", "Login");
        }
    }
}