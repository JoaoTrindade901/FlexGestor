using WebApplication5.Models;
using WebApplication5.Repositories;

namespace WebApplication5.Services
{
    public class CaixaService
    {
        private readonly CaixaRepository _repo;
        public CaixaService(CaixaRepository repo) => _repo = repo;

        public CaixaModel? BuscarAberto(int idEmpresa)
            => _repo.BuscarAberto(idEmpresa);

        public int Abrir(int idEmpresa, int idUsuario, decimal saldoInicial)
            => _repo.Abrir(idEmpresa, idUsuario, saldoInicial);

        public void Fechar(int idCaixa, int idUsuario, decimal saldoFinal)
            => _repo.Fechar(idCaixa, idUsuario, saldoFinal);

        public IEnumerable<CaixaModel> ListarHistorico(int idEmpresa)
            => _repo.ListarHistorico(idEmpresa);

        public int Lancar(int idEmpresa, int idUsuario, LancarCaixaDto dto)
        {
            // Busca caixa aberto — lança no caixa atual
            var caixa = _repo.BuscarAberto(idEmpresa)
                ?? throw new InvalidOperationException("Nenhum caixa aberto.");
            return _repo.Lancar(caixa.idCaixa, idEmpresa, idUsuario, dto);
        }

        public IEnumerable<LancamentoCaixaModel> ListarLancamentos(int idEmpresa)
        {
            var caixa = _repo.BuscarAberto(idEmpresa);
            if (caixa == null) return Enumerable.Empty<LancamentoCaixaModel>();
            return _repo.ListarLancamentos(caixa.idCaixa);
        }

        public IEnumerable<FormaPagamentoModel> ListarFormasPagamento(int idEmpresa)
            => _repo.ListarFormasPagamento(idEmpresa);

        public IEnumerable<CategoriaFinanceiraModel> ListarCategorias(int idEmpresa)
            => _repo.ListarCategorias(idEmpresa);
    }
}