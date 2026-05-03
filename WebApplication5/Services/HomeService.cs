using WebApplication5.Models;
using WebApplication5.Repositories;

namespace WebApplication5.Services
{
    public class HomeService
    {
        private readonly HomeRepository _repo;
        private readonly FinanceiroRepository _finRepo;

        public HomeService(HomeRepository repo, FinanceiroRepository finRepo)
        {
            _repo = repo;
            _finRepo = finRepo;
        }

        public HomeKpiDto BuscarDashboard(int idEmpresa, DateTime dataInicio, DateTime dataFim)
        {
            var kpi = _repo.BuscarKPIs(idEmpresa, dataInicio, dataFim);
            kpi.TopProdutos = _repo.BuscarTopProdutos(idEmpresa, dataInicio, dataFim);
            kpi.FaturamentoMensal = _repo.BuscarFaturamentoMensal(idEmpresa, dataInicio, dataFim);

            var receber = _finRepo.ListarContasReceber(idEmpresa).ToList();
            var pagar = _finRepo.ListarContasPagar(idEmpresa).ToList();
            var vencidasR = receber.Where(c => c.statusAtual == "VENCIDO").ToList();
            var vencidasP = pagar.Where(c => c.statusAtual == "VENCIDO").ToList();
            kpi.ContasReceberVencidas = vencidasR.Count;
            kpi.TotalReceberVencido = vencidasR.Sum(c => Math.Max(0, c.valorTotal - c.valorPago));
            kpi.ContasPagarVencidas = vencidasP.Count;
            kpi.TotalPagarVencido = vencidasP.Sum(c => Math.Max(0, c.valorTotal - c.valorPago));
            return kpi;
        }
    }
}