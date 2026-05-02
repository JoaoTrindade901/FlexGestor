using WebApplication5.Models;
using WebApplication5.Repositories;

namespace WebApplication5.Services
{
    public class CaixaService
    {
        private readonly CaixaRepository _repo;
        private readonly EstoqueService _estoqueService;

        public CaixaService(CaixaRepository repo, EstoqueService estoqueService)
        {
            _repo = repo;
            _estoqueService = estoqueService;
        }

        public CaixaModel? BuscarAberto(int idEmpresa, int idUsuario)
            => _repo.BuscarAberto(idEmpresa, idUsuario);

        public decimal BuscarSaldoUltimoCaixa(int idEmpresa, int idUsuario)
        {
            var ultimo = _repo.ListarHistorico(idEmpresa, idUsuario)
                .Where(c => !c.fAtivo && c.saldoFinal.HasValue)
                .OrderByDescending(c => c.dthFechamento)
                .FirstOrDefault();
            return ultimo?.saldoFinal ?? 0m;
        }

        public int Abrir(int idEmpresa, int idUsuario, decimal saldoInicial, string? nomeOperador = null)
            => _repo.Abrir(idEmpresa, idUsuario, saldoInicial, nomeOperador);

        public void Fechar(int idEmpresa, int idUsuario, decimal saldoFinalContado, string? obs)
        {
            var caixa = _repo.BuscarAberto(idEmpresa, idUsuario)
                ?? throw new InvalidOperationException("Nenhum caixa aberto.");

            var lancamentos = _repo.ListarLancamentos(idEmpresa, caixa.idCaixa).ToList();
            var entradas = lancamentos.Where(l => l.tipoCategoria == 1).Sum(l => l.valor);
            var saidas = lancamentos.Where(l => l.tipoCategoria == 2).Sum(l => l.valor);
            var saldoCalc = caixa.saldoInicial + entradas - saidas;
            var diferenca = saldoFinalContado - saldoCalc;

            _repo.Fechar(idEmpresa, idUsuario, saldoCalc, saldoFinalContado, diferenca, obs);
        }

        public IEnumerable<CaixaModel> ListarHistorico(int idEmpresa, int idUsuario)
            => _repo.ListarHistorico(idEmpresa, idUsuario);

        public int Lancar(int idEmpresa, int idUsuario, LancarCaixaDto dto)
        {
            if (dto.Valor <= 0) throw new InvalidOperationException("Valor deve ser maior que zero.");
            var caixa = _repo.BuscarAberto(idEmpresa, idUsuario)
                ?? throw new InvalidOperationException("Nenhum caixa aberto.");
            return _repo.Lancar(caixa.idCaixa, idEmpresa, idUsuario, dto);
        }

        public void LancarVendaPedido(int idEmpresa, int idUsuario, int pedidoId,
                                      decimal valor, int idFormaPagamento, int idCategoriaFinanceira)
        {
            var caixa = _repo.BuscarAberto(idEmpresa, idUsuario);
            if (caixa == null) return;
            _repo.Lancar(caixa.idCaixa, idEmpresa, idUsuario, new LancarCaixaDto
            {
                IdFormaPagamento = idFormaPagamento,
                IdCategoriaFinanceira = idCategoriaFinanceira,
                Valor = valor,
                TipoLancamento = "VENDA",
                PedidoId = pedidoId,
                Descricao = $"Venda automática — Pedido #{pedidoId}"
            });
        }

        public IEnumerable<LancamentoCaixaModel> ListarLancamentos(int idEmpresa, int idUsuario)
        {
            var caixa = _repo.BuscarAberto(idEmpresa, idUsuario);
            if (caixa == null) return Enumerable.Empty<LancamentoCaixaModel>();
            return _repo.ListarLancamentos(idEmpresa, caixa.idCaixa);
        }

        public IEnumerable<BreakdownFormaPagamentoDto> Breakdown(int idEmpresa, int idUsuario)
        {
            var caixa = _repo.BuscarAberto(idEmpresa, idUsuario);
            if (caixa == null) return Enumerable.Empty<BreakdownFormaPagamentoDto>();
            return _repo.Breakdown(idEmpresa, caixa.idCaixa);
        }

        public IEnumerable<FormaPagamentoModel> ListarFormasPagamento(int idEmpresa)
            => _repo.ListarFormasPagamento(idEmpresa);

        public IEnumerable<CategoriaFinanceiraModel> ListarCategorias(int idEmpresa)
            => _repo.ListarCategorias(idEmpresa);

        public int VendaRapida(int idEmpresa, int idUsuario, VendaRapidaDto dto, int idCategoriaVenda)
        {
            var caixa = _repo.BuscarAberto(idEmpresa, idUsuario)
                ?? throw new InvalidOperationException("Nenhum caixa aberto.");

            foreach (var item in dto.Itens)
                _estoqueService.DescontarEstoque(item.IdProduto, item.Quantidade, idEmpresa, idUsuario);

            if (dto.Fiado)
            {
                if (dto.ClienteId == null)
                    throw new InvalidOperationException("Cliente obrigatório para venda no fiado.");

                return _repo.CriarContaReceber(idEmpresa, new CriarContaReceberDto
                {
                    ClienteId = dto.ClienteId.Value,
                    PedidoId = dto.PedidoId,
                    Descricao = dto.Descricao ?? "Venda rápida — fiado",
                    ValorTotal = dto.Valor,
                    DthVencimento = dto.DthVencimentoFiado ?? DateTime.Today.AddDays(30)
                }, null);
            }

            return _repo.Lancar(caixa.idCaixa, idEmpresa, idUsuario, new LancarCaixaDto
            {
                IdFormaPagamento = dto.IdFormaPagamento,
                IdCategoriaFinanceira = idCategoriaVenda,
                Valor = dto.Valor,
                TipoLancamento = "VENDA",
                ClienteId = dto.ClienteId,
                PedidoId = dto.PedidoId,
                Descricao = dto.Descricao ?? "Venda rápida"
            });
        }

        public IEnumerable<ContaReceberModel> ListarContasReceber(int idEmpresa)
            => _repo.ListarContasReceber(idEmpresa);

        public int CriarContaReceber(int idEmpresa, CriarContaReceberDto dto)
            => _repo.CriarContaReceber(idEmpresa, dto, null);

        public void ReceberConta(int idEmpresa, int idUsuario, ReceberContaDto dto)
        {
            _repo.ReceberConta(dto.IdContaReceber, dto.ValorPago);

            var caixa = _repo.BuscarAberto(idEmpresa, idUsuario);
            if (caixa != null)
            {
                _repo.Lancar(caixa.idCaixa, idEmpresa, idUsuario, new LancarCaixaDto
                {
                    IdFormaPagamento = dto.IdFormaPagamento,
                    IdCategoriaFinanceira = dto.IdCategoriaFinanceira,
                    Valor = dto.ValorPago,
                    TipoLancamento = "RECEBIMENTO",
                    ContaReceberId = dto.IdContaReceber,
                    Descricao = "Recebimento de fiado"
                });
            }
        }

        public void AlterarVencimentoConta(int idContaReceber, DateTime novaData)
            => _repo.AlterarVencimentoConta(idContaReceber, novaData);
    }
}