using WebApplication5.Models;
using WebApplication5.Repositories;

namespace WebApplication5.Services
{
    public class FinanceiroService
    {
        private readonly FinanceiroRepository _repo;
        private readonly CaixaRepository _caixaRepo;

        public FinanceiroService(FinanceiroRepository repo, CaixaRepository caixaRepo)
        {
            _repo = repo;
            _caixaRepo = caixaRepo;
        }

        // ── CONTAS A RECEBER ──────────────────────────────
        public IEnumerable<ContaReceberModel> ListarContasReceber(int idEmpresa)
            => _repo.ListarContasReceber(idEmpresa);

        public int CriarContaReceber(int idEmpresa, CriarContaReceberDto dto)
            => _repo.CriarContaReceber(idEmpresa, dto, null);

        public void EditarContaReceber(EditarContaReceberDto dto)
            => _repo.EditarContaReceber(dto);

        public void ExcluirContaReceber(int idContaReceber)
            => _repo.ExcluirContaReceber(idContaReceber);

        public void ReceberConta(int idEmpresa, int idUsuario, ReceberContaFinanceiroDto dto)
        {
            _repo.ReceberConta(dto.IdContaReceber, dto.ValorPago);

            var caixa = _caixaRepo.BuscarAberto(idEmpresa);
            if (caixa != null)
            {
                _caixaRepo.Lancar(caixa.idCaixa, idEmpresa, idUsuario, new LancarCaixaDto
                {
                    IdFormaPagamento = dto.IdFormaPagamento,
                    IdCategoriaFinanceira = dto.IdCategoriaFinanceira,
                    Valor = dto.ValorPago,
                    TipoLancamento = "RECEBIMENTO",
                    ContaReceberId = dto.IdContaReceber,
                    Descricao = "Recebimento — financeiro"
                });
            }
        }

        public void AlterarVencimentoContaReceber(int idContaReceber, DateTime novaData)
            => _repo.AlterarVencimentoContaReceber(idContaReceber, novaData);

        public IEnumerable<PagamentoHistoricoDto> ListarHistoricoReceber(int idContaReceber)
            => _repo.ListarHistoricoReceber(idContaReceber);

        // ── CONTAS A PAGAR ────────────────────────────────
        public IEnumerable<ContaPagarModel> ListarContasPagar(int idEmpresa)
            => _repo.ListarContasPagar(idEmpresa);

        public int CriarContaPagar(int idEmpresa, CriarContaPagarDto dto)
            => _repo.CriarContaPagar(idEmpresa, dto);

        public void EditarContaPagar(EditarContaPagarDto dto)
            => _repo.EditarContaPagar(dto);

        public void ExcluirContaPagar(int idContaPagar)
            => _repo.ExcluirContaPagar(idContaPagar);

        public void PagarConta(int idEmpresa, int idUsuario, PagarContaDto dto)
        {
            _repo.PagarConta(dto.IdContaPagar, dto.ValorPago);

            var caixa = _caixaRepo.BuscarAberto(idEmpresa);
            if (caixa != null)
            {
                _caixaRepo.Lancar(caixa.idCaixa, idEmpresa, idUsuario, new LancarCaixaDto
                {
                    IdFormaPagamento = dto.IdFormaPagamento,
                    IdCategoriaFinanceira = dto.IdCategoriaFinanceira,
                    Valor = dto.ValorPago,
                    TipoLancamento = "PAGAMENTO",
                    Descricao = "Pagamento — financeiro"
                });
            }
        }

        public void AlterarVencimentoContaPagar(int idContaPagar, DateTime novaData)
            => _repo.AlterarVencimentoContaPagar(idContaPagar, novaData);

        public IEnumerable<PagamentoHistoricoDto> ListarHistoricoPagar(int idContaPagar)
            => _repo.ListarHistoricoPagar(idContaPagar);

        // ── EXPORTAR ─────────────────────────────────────
        public byte[] GerarExcel(int idEmpresa, string tipo) => Array.Empty<byte>();
        public byte[] GerarPdf(int idEmpresa, string tipo) => Array.Empty<byte>();
    }
}