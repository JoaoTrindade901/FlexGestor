using Dapper;
using MySql.Data.MySqlClient;
using System.Data;
using WebApplication5.Models;

namespace WebApplication5.Repositories
{
    public class PedidoRepository
    {
        private readonly string _connectionString;

        public PedidoRepository(IConfiguration config)
        {
            _connectionString = config.GetConnectionString("Default")!;
        }

        public IEnumerable<PedidoListaGridDto> Listar(int idEmpresa)
        {
            using var conn = new MySqlConnection(_connectionString);
            return conn.Query<PedidoListaGridDto>(
                "sp_ListarPedido",
                new { p_idEmpresa = idEmpresa },
                commandType: CommandType.StoredProcedure);
        }

        public IEnumerable<PedidoListaGridDto> Filtrar(PedidoFiltroDto filtro, int idEmpresa)
        {
            using var conn = new MySqlConnection(_connectionString);
            return conn.Query<PedidoListaGridDto>(
                "sp_FiltrarPedido",
                new
                {
                    p_idEmpresa        = idEmpresa,
                    p_nomeCliente      = filtro.NomeCliente,
                    p_numeroExterno    = filtro.NumeroExterno,
                    p_canal            = filtro.Canal,
                    p_status           = filtro.Status,
                    p_dthCriacaoInicio = filtro.DthCriacaoInicio,
                    p_dthCriacaoFim    = filtro.DthCriacaoFim,
                    p_valorMin         = filtro.ValorMin,
                    p_valorMax         = filtro.ValorMax
                },
                commandType: CommandType.StoredProcedure);
        }

        public IEnumerable<PedidoItemGridDto> ListarItens(int idPedido)
        {
            using var conn = new MySqlConnection(_connectionString);
            return conn.Query<PedidoItemGridDto>(
                "sp_ListarItensPedido",
                new { p_idPedido = idPedido },
                commandType: CommandType.StoredProcedure);
        }

        public int Inserir(PedidoModel pedido)
        {
            using var conn = new MySqlConnection(_connectionString);
            return conn.ExecuteScalar<int>(
                "sp_CriarPedido",
                new
                {
                    pedido.IdCliente,
                    pedido.IdEmpresa,
                    pedido.NumeroExterno,
                    pedido.Canal,
                    pedido.Status,
                    pedido.Observacao,
                    pedido.ValorProdutos,
                    pedido.ValorFrete,
                    pedido.Desconto,
                    pedido.ValorTotal,
                    DthCriacao = DateTime.Now
                },
                commandType: CommandType.StoredProcedure);
        }

        public void InserirItem(PedidoItemModel item)
        {
            using var conn = new MySqlConnection(_connectionString);
            conn.Execute(
                "sp_CriarItemPedido",
                new
                {
                    item.IdPedido,
                    item.IdProduto,
                    item.Quantidade,
                    item.ValorUnitario,
                    item.Desconto,
                    item.ValorTotal
                },
                commandType: CommandType.StoredProcedure);
        }

        public void AtualizarStatus(int idPedido, string status)
        {
            using var conn = new MySqlConnection(_connectionString);
            conn.Execute(
                "sp_AtualizarStatusPedido",
                new { p_idPedido = idPedido, p_status = status },
                commandType: CommandType.StoredProcedure);
        }

        public void Cancelar(int idPedido)
        {
            using var conn = new MySqlConnection(_connectionString);
            conn.Execute(
                "sp_CancelarPedido",
                new { p_idPedido = idPedido },
                commandType: CommandType.StoredProcedure);
        }
    }
}
