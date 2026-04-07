using Dapper;
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

        public HomeKpiDto BuscarKPIs(int idEmpresa)
        {
            using var conn = new MySqlConnection(_connectionString);
            conn.Open();

            using var multi = conn.QueryMultiple(
                "sp_HomeKPIs",
                new { p_idEmpresa = idEmpresa },
                commandType: CommandType.StoredProcedure);

            // Result set 1: pedidos do mês
            var pedidos = multi.ReadFirstOrDefault<dynamic>();

            // Result set 2: clientes
            var clientes = multi.ReadFirstOrDefault<dynamic>();

            // Result set 3: estoque
            var estoque = multi.ReadFirstOrDefault<dynamic>();

            // Result set 4: caixa (pode não ter caixa aberto)
            var caixa = multi.ReadFirstOrDefault<dynamic>();

            // Result set 5: pedidos por status
            var porStatus = multi.Read<PedidoStatusKpiDto>().ToList();

            var kpi = new HomeKpiDto
            {
                // Pedidos
                TotalPedidosMes = (int)(pedidos?.totalPedidosMes ?? 0),
                FaturamentoMes = (decimal)(pedidos?.faturamentoMes ?? 0),
                TicketMedio = (decimal)(pedidos?.ticketMedio ?? 0),
                TotalPedidosMesAnterior = (int)(pedidos?.totalPedidosMesAnterior ?? 0),
                FaturamentoMesAnterior = (decimal)(pedidos?.faturamentoMesAnterior ?? 0),

                // Clientes
                TotalClientes = (int)(clientes?.totalClientes ?? 0),
                ClientesAtivos = (int)(clientes?.clientesAtivos ?? 0),
                SaldoDevedorTotal = (decimal)(clientes?.saldoDevedorTotal ?? 0),

                // Estoque
                ProdutosEstoqueCritico = (int)(estoque?.produtosEstoqueCritico ?? 0),
                TotalProdutos = (int)(estoque?.totalProdutos ?? 0),

                // Caixa
                CaixaAberto = caixa != null && (bool)(caixa?.caixaAberto ?? false),
                SaldoInicial = (decimal)(caixa?.saldoInicial ?? 0),
                TotalEntradas = (decimal)(caixa?.totalEntradas ?? 0),
                TotalSaidas = (decimal)(caixa?.totalSaidas ?? 0),

                PedidosPorStatus = porStatus
            };

            return kpi;
        }

        public List<TopProdutoDto> BuscarTopProdutos(int idEmpresa)
        {
            using var conn = new MySqlConnection(_connectionString);
            return conn.Query<TopProdutoDto>(
                "sp_HomeTopProdutos",
                new { p_idEmpresa = idEmpresa },
                commandType: CommandType.StoredProcedure).ToList();
        }

        public List<FaturamentoMensalDto> BuscarFaturamentoMensal(int idEmpresa)
        {
            using var conn = new MySqlConnection(_connectionString);
            return conn.Query<FaturamentoMensalDto>(
                "sp_HomeFaturamentoMensal",
                new { p_idEmpresa = idEmpresa },
                commandType: CommandType.StoredProcedure).ToList();
        }
    }
}