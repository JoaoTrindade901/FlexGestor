using Microsoft.AspNetCore.Mvc;
using WebApplication5.Models;
using WebApplication5.Services;

namespace WebApplication5.Controllers
{
    public class UsuarioController : Controller
    {
        private readonly UsuarioService _service;

    public UsuarioController(UsuarioService service, CargoRepository cargoRepository)
        {
            _service = service;
        }

        public IActionResult Index()
        {
            var lista = _service.Listar();
        return Json(lista);
        }

    public IActionResult ListarCargos()
        {
        var cargos = _cargoRepository.Listar();
        return Json(cargos);
        }


        [HttpPost]
    public IActionResult Criar([FromBody] Usuario usuario)
        {
            _service.Criar(usuario);
        return Ok();
        }
    }
}