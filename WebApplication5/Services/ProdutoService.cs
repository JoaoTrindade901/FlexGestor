using WebApplication5.Models;
using WebApplication5.Repositories;

namespace WebApplication5.Services
{
    public class ProdutoService
    {
        private readonly ProdutoRepository _repo;

        public ProdutoService(ProdutoRepository repo)
        {
            _repo = repo;
        }

        public IEnumerable<ProdutoListaGridDto> Listar(int idEmpresa)
            => _repo.Listar(idEmpresa);

        public IEnumerable<ProdutoListaGridDto> Filtrar(ProdutoFiltroDto filtro, int idEmpresa)
            => _repo.Filtrar(filtro, idEmpresa);

        public int Criar(ProdutoModel produto, int idEmpresa)
        {
            produto.IdEmpresa = idEmpresa;
            produto.DthCadastro = DateTime.Now;
            produto.FAtivo = true;
            return _repo.Inserir(produto);
        }

        public void Editar(ProdutoModel produto)
            => _repo.Atualizar(produto);

        public void AlterarStatus(int idProduto)
            => _repo.AlterarStatus(idProduto);
    }
}
