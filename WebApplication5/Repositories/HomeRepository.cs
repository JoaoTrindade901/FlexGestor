using Dapper;
using DocumentFormat.OpenXml.Office2016.Drawing.ChartDrawing;
using MySql.Data.MySqlClient;
using System.Data;
using WebApplication5.Models;

namespace WebApplication5.Repositories
{
    public class HomeRepository
    {
        private readonly string _connectionString;

        public HomeRepository(IConfiguration config)
            => _connectionString = config.GetConnectionString("Default")!;

        public HomeKpiDto BuscarKPIs(int idEmpresa, DateTime dataInicio, DateTime dataFim)
        {
            using var conn = new MySqlConnection(_connectionString);
            conn.Open();
            using var multi = conn.QueryMultiple(
                "sp_HomeKPIs",
                new { p_idEmpresa = idEmpresa, p_dataInicio = dataInicio, p_dataFim = dataFim },
                commandType: CommandType.StoredProcedure);

            var pedidos = multi.ReadFirstOrDefault<dynamic>();
            var clientes = multi.ReadFirstOrDefault<dynamic>();
            var estoque = multi.ReadFirstOrDefault<dynamic>();
            var caixa = multi.ReadFirstOrDefault<dynamic>();
            var porStatus = multi.Read<PedidoStatusKpiDto>().ToList();

            return new HomeKpiDto
            {
                TotalPedidosMes = (int)(pedidos?.totalPedidosMes ?? 0),
                FaturamentoMes = (decimal)(pedidos?.faturamentoMes ?? 0),
                TicketMedio = (decimal)(pedidos?.ticketMedio ?? 0),
                TotalPedidosMesAnterior = (int)(pedidos?.totalPedidosMesAnterior ?? 0),
                FaturamentoMesAnterior = (decimal)(pedidos?.faturamentoMesAnterior ?? 0),
                TotalClientes = (int)(clientes?.totalClientes ?? 0),
                ClientesAtivos = (int)(clientes?.clientesAtivos ?? 0),
                SaldoDevedorTotal = (decimal)(clientes?.saldoDevedorTotal ?? 0),
                ProdutosEstoqueCritico = (int)(estoque?.produtosEstoqueCritico ?? 0),
                TotalProdutos = (int)(estoque?.totalProdutos ?? 0),
                CaixaAberto = caixa != null && (bool)(caixa?.caixaAberto ?? false),
                SaldoInicial = (decimal)(caixa?.saldoInicial ?? 0),
                TotalEntradas = (decimal)(caixa?.totalEntradas ?? 0),
                TotalSaidas = (decimal)(caixa?.totalSaidas ?? 0),
                PedidosPorStatus = porStatus
            };
        }

        public List<TopProdutoDto> BuscarTopProdutos(int idEmpresa, DateTime dataInicio, DateTime dataFim)
        {
            using var conn = new MySqlConnection(_connectionString);
            return conn.Query<TopProdutoDto>(
                "sp_HomeTopProdutos",
                new { p_idEmpresa = idEmpresa, p_dataInicio = dataInicio, p_dataFim = dataFim },
                commandType: CommandType.StoredProcedure).ToList();
        }

        public List<FaturamentoMensalDto> BuscarFaturamentoMensal(int idEmpresa, DateTime dataInicio, DateTime dataFim)
        {
            using var conn = new MySqlConnection(_connectionString);
            return conn.Query<FaturamentoMensalDto>(
                "sp_HomeFaturamentoMensal",
                new { p_idEmpresa = idEmpresa, p_dataInicio = dataInicio, p_dataFim = dataFim },
                commandType: CommandType.StoredProcedure).ToList();
        }
    }
}