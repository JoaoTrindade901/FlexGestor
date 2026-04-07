using WebApplication5.Models;
using WebApplication5.Repositories;

namespace WebApplication5.Services
{
    public class HomeService
    {
        private readonly HomeRepository _repo;

        public HomeService(HomeRepository repo) => _repo = repo;

        public HomeKpiDto BuscarDashboard(int idEmpresa)
        {
            var kpi = _repo.BuscarKPIs(idEmpresa);
            kpi.TopProdutos = _repo.BuscarTopProdutos(idEmpresa);
            kpi.FaturamentoMensal = _repo.BuscarFaturamentoMensal(idEmpresa);
            return kpi;
        }
    }
}