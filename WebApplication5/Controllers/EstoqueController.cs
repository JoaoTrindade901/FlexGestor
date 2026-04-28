using Microsoft.AspNetCore.Mvc;
using WebApplication5.Models;
using WebApplication5.Services;

public class EstoqueController : BaseController
{
    private readonly EstoqueService _service;
    private readonly AuditoriaService _auditoria;

    public EstoqueController(EstoqueService service, AuditoriaService auditoria)
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

    public IActionResult ListarMovimentacoes()
    {
        var r = VerificarSessaoApi(); if (r != null) return r;
        var idEmpresa = HttpContext.Session.GetInt32("IdEmpresa")!.Value;
        return Json(_service.ListarMovimentacoes(idEmpresa));
    }

    [HttpPost]
    public IActionResult Movimentar([FromBody] MovimentacaoEstoqueModel m)
    {
        var r = VerificarSessaoApi(); if (r != null) return r;
        var idEmpresa = HttpContext.Session.GetInt32("IdEmpresa")!.Value;
        var idUsuario = HttpContext.Session.GetInt32("idUsuario")!.Value;
        _service.Movimentar(m, idEmpresa, idUsuario);
        Auditar("ESTOQUE", m.TipoMovimentacao ?? "MOVIMENTACAO",
            $"Produto #{m.IdProduto} — {m.TipoMovimentacao} de {m.Quantidade} unidades");
        return Ok();
    }

    [HttpPost]
    public IActionResult AtualizarMinimo([FromBody] AtualizarMinimoDto dto)
    {
        var r = VerificarSessaoApi(); if (r != null) return r;
        _service.AtualizarMinimo(dto.IdProduto, dto.EstoqueMinimo);
        Auditar("ESTOQUE", "AJUSTE",
            $"Estoque mínimo do produto #{dto.IdProduto} atualizado para {dto.EstoqueMinimo}");
        return Ok();
    }

    [HttpPost]
    public IActionResult AssociarFornecedor([FromBody] AssociarFornecedorDto dto)
    {
        var r = VerificarSessaoApi(); if (r != null) return r;
        var idEmpresa = HttpContext.Session.GetInt32("IdEmpresa")!.Value;
        _service.AssociarFornecedor(dto.IdFornecedor, dto.IdProduto, idEmpresa, dto.PrecoCompra);
        Auditar("ESTOQUE", "ASSOCIAR_FORNECEDOR",
            $"Fornecedor #{dto.IdFornecedor} associado ao produto #{dto.IdProduto}");
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

public class AtualizarMinimoDto
{
    public int IdProduto { get; set; }
    public int EstoqueMinimo { get; set; }
}

public class AssociarFornecedorDto
{
    public int IdFornecedor { get; set; }
    public int IdProduto { get; set; }
    public decimal PrecoCompra { get; set; }
}