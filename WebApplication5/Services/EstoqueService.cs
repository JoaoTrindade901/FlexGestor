using WebApplication5.Models;
using WebApplication5.Repositories;

namespace WebApplication5.Services
{
    public class EstoqueService
    {
        private readonly EstoqueRepository _repo;

        public EstoqueService(EstoqueRepository repo)
        {
            _repo = repo;
        }

        public IEnumerable<EstoqueListaGridDto> Listar(int idEmpresa)
            => _repo.Listar(idEmpresa);

        public IEnumerable<EstoqueListaGridDto> Filtrar(MovimentacaoFiltroDto filtro, int idEmpresa)
            => _repo.Filtrar(filtro, idEmpresa);

        public IEnumerable<MovimentacaoEstoqueModel> ListarMovimentacoes(int idProduto, int idEmpresa)
            => _repo.ListarMovimentacoes(idProduto, idEmpresa);

        public void Movimentar(MovimentacaoEstoqueModel m, int idEmpresa, int idUsuario)
        {
            m.IdEmpresa = idEmpresa;
            m.IdUsuario = idUsuario;
            m.DthMovimentacao = DateTime.Now;
            _repo.Movimentar(m);
        }

        public void AtualizarMinimo(int idProduto, int estoqueMinimo)
            => _repo.AtualizarMinimo(idProduto, estoqueMinimo);
    }
}
