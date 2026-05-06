using Microsoft.AspNetCore.Mvc;
using WebApplication5.Models;
using WebApplication5.Services;

namespace WebApplication5.Controllers
{
    public class PedidoController : BaseController
    {
        private readonly PedidoService _service;
        private readonly AuditoriaService _auditoria;

        public PedidoController(PedidoService service, AuditoriaService auditoria)
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

        public IActionResult ListarItens(int idPedido)
        {
            var r = VerificarSessaoApi(); if (r != null) return r;
            return Json(_service.ListarItens(idPedido));
        }

        [HttpPost]
        public IActionResult Criar([FromBody] PedidoCriarDto dto)
        {
            var r = VerificarSessaoApi(); if (r != null) return r;
            var idEmpresa = HttpContext.Session.GetInt32("IdEmpresa")!.Value;
            var idUsuario = HttpContext.Session.GetInt32("idUsuario")!.Value;
            try
            {
                var idGerado = _service.Criar(dto, idEmpresa, idUsuario);
                Auditar("PEDIDO", "CRIAR", $"Pedido #{idGerado} criado");
                return Ok(new { idPedido = idGerado });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { mensagem = ex.Message });
            }
        }

        [HttpPost]
        public IActionResult AtualizarStatus([FromBody] AtualizarStatusPedidoDto dto)
        {
            var r = VerificarSessaoApi(); if (r != null) return r;
            var idUsuario = HttpContext.Session.GetInt32("idUsuario")!.Value;
            _service.AtualizarStatus(dto.IdPedido, dto.StatusPedidoId, idUsuario);
            Auditar("PEDIDO", "ALTERAR_STATUS", $"Pedido #{dto.IdPedido} -> status {dto.StatusPedidoId}");
            return Ok();
        }

        [HttpPost]
        public IActionResult Cancelar([FromBody] int idPedido)
        {
            var r = VerificarSessaoApi(); if (r != null) return r;
            var idUsuario = HttpContext.Session.GetInt32("idUsuario")!.Value;
            _service.Cancelar(idPedido, idUsuario);
            Auditar("PEDIDO", "CANCELAR", $"Pedido #{idPedido} cancelado");
            return Ok();
        }

        [HttpPost]
        public IActionResult Editar([FromBody] PedidoEditarDto dto)
        {
            var r = VerificarSessaoApi(); if (r != null) return r;
            var idEmpresa = HttpContext.Session.GetInt32("IdEmpresa")!.Value;
            var idUsuario = HttpContext.Session.GetInt32("idUsuario")!.Value;
            try
            {
                _service.Editar(dto, idEmpresa, idUsuario);
                Auditar("PEDIDO", "EDITAR", $"Pedido #{dto.IdPedido} editado");
                return Ok();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { mensagem = ex.Message });
            }
        }

        public IActionResult ListarPagamentos(int idPedido)
        {
            var r = VerificarSessaoApi(); if (r != null) return r;
            return Json(_service.ListarPagamentos(idPedido));
        }

        public IActionResult ListarHistoricoStatus(int idPedido)
        {
            var r = VerificarSessaoApi(); if (r != null) return r;
            return Json(_service.ListarHistoricoStatus(idPedido));
        }

        // Busca total ja pago de um pedido via caixa
        public IActionResult TotalPago(int idPedido)
        {
            var r = VerificarSessaoApi(); if (r != null) return r;
            var total = _service.BuscarTotalPago(idPedido);
            return Json(new { totalPago = total });
        }

        // Registra pagamento do pedido no caixa
        [HttpPost]
        public IActionResult Pagar([FromBody] PagarPedidoDto dto)
        {
            var r = VerificarSessaoApi(); if (r != null) return r;
            var idEmpresa = HttpContext.Session.GetInt32("IdEmpresa")!.Value;
            var idUsuario = HttpContext.Session.GetInt32("idUsuario")!.Value;

            if (dto.Valor <= 0)
                return BadRequest(new { mensagem = "Valor deve ser maior que zero." });

            try
            {
                var resultado = _service.PagarPedido(dto, idEmpresa, idUsuario);

                var descAuditoria = resultado.Concluido
                    ? $"Pedido #{dto.IdPedido} CONCLUIDO - pago R$ {dto.Valor:F2}"
                    : $"Pedido #{dto.IdPedido} - pagamento parcial R$ {dto.Valor:F2}";

                Auditar("PEDIDO", resultado.Concluido ? "CONCLUIR" : "PAGAMENTO_PARCIAL", descAuditoria);
                return Ok(resultado);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { mensagem = ex.Message });
            }
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
}