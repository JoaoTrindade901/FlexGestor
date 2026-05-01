using WebApplication5.Models;
using WebApplication5.Repositories;

namespace WebApplication5.Services
{
    public class DespesaService
    {
        private readonly DespesaRepository _repo;

        public DespesaService(DespesaRepository repo) => _repo = repo;

        public IEnumerable<DespesaModel> Listar(int idEmpresa)
            => _repo.Listar(idEmpresa);

        public int Criar(int idEmpresa, SalvarDespesaDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Nome))
                throw new InvalidOperationException("Nome é obrigatório.");
            return _repo.Criar(idEmpresa, dto);
        }

        public void Editar(SalvarDespesaDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Nome))
                throw new InvalidOperationException("Nome é obrigatório.");
            _repo.Editar(dto);
        }

        public void AlterarStatus(int id, bool ativo)
            => _repo.AlterarStatus(id, ativo);
    }
}