using WebApplication5.Models;
using WebApplication5.Repositories;

namespace WebApplication5.Services
{
    public class AuditoriaService
    {
        private readonly AuditoriaRepository _repo;

        public AuditoriaService(AuditoriaRepository repo)
            => _repo = repo;

        public void Registrar(RegistrarAuditoriaDto dto)
        {
            try { _repo.Registrar(dto); }
            catch (Exception ex) { Console.WriteLine($"[AUDITORIA ERROR] {ex.Message}"); }
        }

        public IEnumerable<LogAuditoriaModel> Listar(int idEmpresa, AuditoriaFiltroDto filtro)
            => _repo.Listar(idEmpresa, filtro);

        public IEnumerable<string> ListarModulos(int idEmpresa)
            => _repo.ListarModulos(idEmpresa);
    }
}