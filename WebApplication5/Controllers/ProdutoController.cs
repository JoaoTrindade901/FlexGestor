// ===== ProdutoController.cs =====
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

    // GET /Produto → renderiza a view
    public IActionResult Index()
    {
        var r = VerificarSessao(); if (r != null) return r;
        return View();
    }

    // GET /Produto/Listar → JSON com todos os produtos da empresa
    public IActionResult Listar()
    {
        var r = VerificarSessaoApi(); if (r != null) return r;
        var idEmpresa = HttpContext.Session.GetInt32("IdEmpresa")!.Value;
        return Json(_service.Listar(idEmpresa));
    }

    // POST /Produto/Criar
    [HttpPost]
    public IActionResult Criar([FromBody] ProdutoModel produto)
    {
        var r = VerificarSessaoApi(); if (r != null) return r;
        var idEmpresa = HttpContext.Session.GetInt32("IdEmpresa")!.Value;
        var idGerado = _service.Criar(produto, idEmpresa);
        Auditar("PRODUTO", "CRIAR", $"Produto '{produto.Nome}' criado (ID: {idGerado})");
        return Ok(new { idProduto = idGerado });
    }

    // POST /Produto/Editar
    [HttpPost]
    public IActionResult Editar([FromBody] ProdutoModel produto)
    {
        var r = VerificarSessaoApi(); if (r != null) return r;
        _service.Editar(produto);
        Auditar("PRODUTO", "EDITAR", $"Produto '{produto.Nome}' editado");
        return Ok();
    }

    // POST /Produto/AlterarStatus
    [HttpPost]
    public IActionResult AlterarStatus([FromBody] int idProduto)
    {
        var r = VerificarSessaoApi(); if (r != null) return r;
        _service.AlterarStatus(idProduto);
        Auditar("PRODUTO", "INATIVAR", $"Status do produto #{idProduto} alterado");
        return Ok();
    }

    // POST /Produto/SalvarFiscal
    // Endpoint separado — salva apenas os dados fiscais do produto
    [HttpPost]
    public IActionResult SalvarFiscal([FromBody] ProdutoFiscalDto dto)
    {
        var r = VerificarSessaoApi(); if (r != null) return r;

        // Validações básicas no servidor
        if (string.IsNullOrWhiteSpace(dto.NCM) || dto.NCM.Length != 8)
            return BadRequest("NCM deve ter exatamente 8 dígitos.");

        if (string.IsNullOrWhiteSpace(dto.CFOP))
            return BadRequest("CFOP é obrigatório.");

        _service.SalvarDadosFiscais(dto);

        Auditar("PRODUTO", "FISCAL",
            $"Dados fiscais do produto #{dto.IdProduto} atualizados — NCM: {dto.NCM}, CFOP: {dto.CFOP}");

        return Ok();
    }

    // ── HELPER DE AUDITORIA ──
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