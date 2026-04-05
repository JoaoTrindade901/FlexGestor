using WebApplication5.Repositories;

namespace WebApplication5.Services
{
    public class FornecedorService
    {
        private readonly FornecedorRepository _repo;
        public FornecedorService(FornecedorRepository repo) => _repo = repo;

        public IEnumerable<FornecedorListaDto> Listar(int idEmpresa)
            => _repo.Listar(idEmpresa);

        public int Criar(FornecedorModel f, int idEmpresa)
        {
            f.IdEmpresa = idEmpresa;
            f.FAtivo = true;
            return _repo.Inserir(f);
        }

        public void Editar(FornecedorModel f) => _repo.Atualizar(f);

        public void AlterarStatus(int idFornecedor) => _repo.AlterarStatus(idFornecedor);
    }
}