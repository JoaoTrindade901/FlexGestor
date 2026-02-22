using Microsoft.AspNetCore.Mvc;
using WebApplication5.Models;
using WebApplication5.Services;

namespace WebApplication5.Controllers
{
    public class UsuarioController : Controller
    {
        private readonly UsuarioService _service;

        public UsuarioController(UsuarioService service)
        {
            _service = service;
        }

        public IActionResult Index()
        {
            var lista = _service.Listar();
            return View(lista);
        }


        public IActionResult Create()
        {
            return View();
        }


        [HttpPost]
        public IActionResult Create(Usuario usuario)
        {
            _service.Criar(usuario);
            return RedirectToAction("Index");
        }
    }
}