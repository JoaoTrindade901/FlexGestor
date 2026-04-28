using Microsoft.AspNetCore.Mvc;
using WebApplication5.Models;
using WebApplication5.Repositories;
using WebApplication5.Services;

public class CaixaController : BaseController
{
    private readonly CaixaService _service;
    private readonly ClienteRepository _clienteRepo;
    private readonly AuditoriaService _auditoria;

    public CaixaController(CaixaService service, ClienteRepository clienteRepo, AuditoriaService auditoria)
    {
        _service = service;
        _clienteRepo = clienteRepo;
        _auditoria = auditoria;
    }

    public IActionResult Index()
    {
        var r = VerificarSessao(); if (r != null) return r;
        return View();
    }

    public IActionResult Status()
    {
        var r = VerificarSessaoApi(); if (r != null) return r;
        var idEmpresa = HttpContext.Session.GetInt32("IdEmpresa")!.Value;
        var caixa = _service.BuscarAberto(idEmpresa);
        return Json(new { caixaAberto = caixa != null, caixa });
    }

    public IActionResult Historico()
    {
        var r = VerificarSessaoApi(); if (r != null) return r;
        var idEmpresa = HttpContext.Session.GetInt32("IdEmpresa")!.Value;
        return Json(_service.ListarHistorico(idEmpresa));
    }

    public IActionResult Lancamentos()
    {
        var r = VerificarSessaoApi(); if (r != null) return r;
        var idEmpresa = HttpContext.Session.GetInt32("IdEmpresa")!.Value;
        return Json(_service.ListarLancamentos(idEmpresa));
    }

    public IActionResult Breakdown()
    {
        var r = VerificarSessaoApi(); if (r != null) return r;
        var idEmpresa = HttpContext.Session.GetInt32("IdEmpresa")!.Value;
        return Json(_service.Breakdown(idEmpresa));
    }

    public IActionResult FormasPagamento()
    {
        var r = VerificarSessaoApi(); if (r != null) return r;
        var idEmpresa = HttpContext.Session.GetInt32("IdEmpresa")!.Value;
        return Json(_service.ListarFormasPagamento(idEmpresa));
    }

    public IActionResult Categorias()
    {
        var r = VerificarSessaoApi(); if (r != null) return r;
        var idEmpresa = HttpContext.Session.GetInt32("IdEmpresa")!.Value;
        return Json(_service.ListarCategorias(idEmpresa));
    }

    public IActionResult SaldoAnterior()
    {
        var r = VerificarSessaoApi(); if (r != null) return r;
        var idEmpresa = HttpContext.Session.GetInt32("IdEmpresa")!.Value;
        var saldo = _service.BuscarSaldoUltimoCaixa(idEmpresa);
        return Json(new { saldo });
    }

    public IActionResult BuscarClientePorCpf(string cpf)
    {
        var r = VerificarSessaoApi(); if (r != null) return r;
        var cpfLimpo = new string(cpf.Where(char.IsDigit).ToArray());
        if (cpfLimpo.Length < 11) return BadRequest("CPF inválido.");
        var cliente = _clienteRepo.BuscarPorCpf(cpfLimpo);
        if (cliente == null) return NotFound();
        return Json(new
        {
            idCliente = cliente.idCliente,
            nome = cliente.nome,
            cpfCNPJ = cliente.cpfCNPJ,
            saldoDevedor = cliente.saldoDevedor
        });
    }

    [HttpPost]
    public IActionResult Abrir([FromBody] AbrirCaixaDto dto)
    {
        var r = VerificarSessaoApi(); if (r != null) return r;
        var idEmpresa = HttpContext.Session.GetInt32("IdEmpresa");
        var idUsuario = HttpContext.Session.GetInt32("idUsuario");
        var nomeUsuario = HttpContext.Session.GetString("nomeUsuario");

        if (idEmpresa == null || idUsuario == null)
            return BadRequest($"Sessão inválida.");

        if (_service.BuscarAberto(idEmpresa.Value) != null)
            return BadRequest("Já existe um caixa aberto.");

        var idCaixa = _service.Abrir(idEmpresa.Value, idUsuario.Value, dto.SaldoInicial, nomeUsuario);
        Auditar("CAIXA", "ABRIR_CAIXA", $"Caixa #{idCaixa} aberto com saldo inicial R$ {dto.SaldoInicial:F2}");
        return Ok(new { idCaixa });
    }

    [HttpPost]
    public IActionResult Fechar([FromBody] FecharCaixaDto dto)
    {
        var r = VerificarSessaoApi(); if (r != null) return r;
        var idEmpresa = HttpContext.Session.GetInt32("IdEmpresa")!.Value;
        var idUsuario = HttpContext.Session.GetInt32("idUsuario")!.Value;
        try
        {
            _service.Fechar(idEmpresa, idUsuario, dto.SaldoFinalContado, dto.Obs);
            Auditar("CAIXA", "FECHAR_CAIXA", $"Caixa fechado. Saldo final: R$ {dto.SaldoFinalContado:F2}");
            return Ok();
        }
        catch (InvalidOperationException ex) { return BadRequest(ex.Message); }
    }

    [HttpPost]
    public IActionResult Lancar([FromBody] LancarCaixaDto dto)
    {
        var r = VerificarSessaoApi(); if (r != null) return r;
        var idEmpresa = HttpContext.Session.GetInt32("IdEmpresa")!.Value;
        var idUsuario = HttpContext.Session.GetInt32("idUsuario")!.Value;
        try
        {
            var id = _service.Lancar(idEmpresa, idUsuario, dto);
            Auditar("CAIXA", dto.TipoLancamento, $"Lançamento R$ {dto.Valor:F2} — {dto.Descricao}");
            return Ok(new { idLancamento = id });
        }
        catch (InvalidOperationException ex) { return BadRequest(ex.Message); }
    }

    [HttpPost]
    public IActionResult VendaRapida([FromBody] VendaRapidaDto dto)
    {
        var r = VerificarSessaoApi(); if (r != null) return r;
        var idEmpresa = HttpContext.Session.GetInt32("IdEmpresa")!.Value;
        var idUsuario = HttpContext.Session.GetInt32("idUsuario")!.Value;

        var catVenda = _service.ListarCategorias(idEmpresa).FirstOrDefault(c => c.Tipo == 1);
        if (catVenda == null) return BadRequest("Nenhuma categoria de entrada cadastrada.");

        try
        {
            var id = _service.VendaRapida(idEmpresa, idUsuario, dto, catVenda.idCategoriaFinanceira);
            var tipo = dto.Fiado ? "VENDA (Fiado)" : "VENDA";
            Auditar("CAIXA", "VENDA", $"{tipo} R$ {dto.Valor:F2} — {dto.Itens.Count} item(s)");
            return Ok(new { id });
        }
        catch (InvalidOperationException ex) { return BadRequest(ex.Message); }
    }

    public IActionResult ContasReceber()
    {
        var r = VerificarSessaoApi(); if (r != null) return r;
        var idEmpresa = HttpContext.Session.GetInt32("IdEmpresa")!.Value;
        return Json(_service.ListarContasReceber(idEmpresa));
    }

    [HttpPost]
    public IActionResult CriarContaReceber([FromBody] CriarContaReceberDto dto)
    {
        var r = VerificarSessaoApi(); if (r != null) return r;
        var idEmpresa = HttpContext.Session.GetInt32("IdEmpresa")!.Value;
        var id = _service.CriarContaReceber(idEmpresa, dto);
        return Ok(new { idContaReceber = id });
    }

    [HttpPost]
    public IActionResult ReceberConta([FromBody] ReceberContaDto dto)
    {
        var r = VerificarSessaoApi(); if (r != null) return r;
        var idEmpresa = HttpContext.Session.GetInt32("IdEmpresa")!.Value;
        var idUsuario = HttpContext.Session.GetInt32("idUsuario")!.Value;
        _service.ReceberConta(idEmpresa, idUsuario, dto);
        Auditar("CAIXA", "RECEBIMENTO", $"Recebimento de R$ {dto.ValorPago:F2} — Conta #{dto.IdContaReceber}");
        return Ok();
    }

    [HttpPost]
    public IActionResult AlterarVencimento([FromBody] AlterarVencimentoDto dto)
    {
        var r = VerificarSessaoApi(); if (r != null) return r;
        _service.AlterarVencimentoConta(dto.IdContaReceber, dto.NovaData);
        Auditar("CAIXA", "EDITAR", $"Vencimento da conta #{dto.IdContaReceber} alterado para {dto.NovaData:dd/MM/yyyy}");
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