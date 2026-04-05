using WebApplication5.Models;
using WebApplication5.Repositories;

namespace WebApplication5.Services
{
    public class CategoriaProdutoService
    {
        private readonly CategoriaProdutoRepository _repo;
        public CategoriaProdutoService(CategoriaProdutoRepository repo) => _repo = repo;

        public IEnumerable<CategoriaProdutoListaDto> Listar(int idEmpresa)
            => _repo.Listar(idEmpresa);

        public int Criar(CategoriaProdutoModel cat, int idEmpresa)
        {
            cat.idEmpresa = idEmpresa;
            return _repo.Criar(cat);
        }

        public void Editar(CategoriaProdutoModel cat) => _repo.Editar(cat);

        public void AlterarStatus(int idCategoria) => _repo.AlterarStatus(idCategoria);
    }
}