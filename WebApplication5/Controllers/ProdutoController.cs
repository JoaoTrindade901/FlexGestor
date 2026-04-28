using Microsoft.AspNetCore.Mvc;
using WebApplication5.Models;
using WebApplication5.Services;

public class ProdutoController : BaseController
{
    private readonly ProdutoService _service;
    private readonly AuditoriaService _auditoria;

    public ProdutoController(ProdutoService service, AuditoriaService auditoria)
    {
        _service = service;
        _auditoria = auditoria;
    }

    public IActionResult Index()
    {
        var r = VerificarSessao(); if (r != null) return r;
        return View();
    }

    public IActionResult Listar()
    {
        var r = VerificarSessaoApi(); if (r != null) return r;
        var idEmpresa = HttpContext.Session.GetInt32("IdEmpresa")!.Value;
        return Json(_service.Listar(idEmpresa));
    }

    [HttpPost]
    public IActionResult Filtrar([FromBody] ProdutoFiltroDto filtro)
    {
        var r = VerificarSessaoApi(); if (r != null) return r;
        var idEmpresa = HttpContext.Session.GetInt32("IdEmpresa")!.Value;
        return Json(_service.Filtrar(filtro, idEmpresa));
    }

    [HttpPost]
    public IActionResult Criar([FromBody] ProdutoModel produto)
    {
        var r = VerificarSessaoApi(); if (r != null) return r;
        var idEmpresa = HttpContext.Session.GetInt32("IdEmpresa")!.Value;
        var idGerado = _service.Criar(produto, idEmpresa);
        Auditar("PRODUTO", "CRIAR", $"Produto '{produto.Nome}' criado (ID: {idGerado})");
        return Ok(new { idProduto = idGerado });
    }

    [HttpPost]
    public IActionResult Editar([FromBody] ProdutoModel produto)
    {
        var r = VerificarSessaoApi(); if (r != null) return r;
        _service.Editar(produto);
        Auditar("PRODUTO", "EDITAR", $"Produto '{produto.Nome}' editado");
        return Ok();
    }

    [HttpPost]
    public IActionResult AlterarStatus([FromBody] int idProduto)
    {
        var r = VerificarSessaoApi(); if (r != null) return r;
        _service.AlterarStatus(idProduto);
        Auditar("PRODUTO", "INATIVAR", $"Status do produto #{idProduto} alterado");
        return Ok();
    }

    private void Auditar(string modulo, string acao, string descricao)
    {
        _auditoria.Registrar(new RegistrarAuditoriaDto
        {
            IdEmpresa = HttpContext.Session.GetInt32("IdEmpresa") ?? 0,
            IdUsuario = HttpContext.Session.GetInt32("idUsuario"),
            NomeUsuario = HttpContext.Session.GetString("nomeUsuario"),
            Modulo = modulo,
            Acao = acao,
            Descricao = descricao,
            IpUsuario = HttpContext.Connection.RemoteIpAddress?.ToString()
        });
    }
}