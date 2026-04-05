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

        public void DeletarItens(int idPedido)
        {
            using var conn = new MySqlConnection(_connectionString);
            conn.Execute(
                "sp_DeletarItensPedido",
                new { p_idPedido = idPedido },
                commandType: CommandType.StoredProcedure);
        }

        public void AtualizarCabecalho(int idPedido, decimal valorTotal, decimal desconto, decimal valorFrete, string? observacao)
        {
            using var conn = new MySqlConnection(_connectionString);
            conn.Execute(
                "sp_AtualizarCabecalhoPedido",
                new { p_idPedido = idPedido, p_valorTotal = valorTotal, p_Desconto = desconto, p_valorFrete = valorFrete, p_Observacao = observacao },
                commandType: CommandType.StoredProcedure);
        }

        public int Inserir(PedidoModel pedido)
        {
            using var conn = new MySqlConnection(_connectionString);
            return conn.ExecuteScalar<int>(
                "sp_CriarPedido",
                new
                {
                    p_cliente_id = pedido.IdCliente,
                    p_usuario_id = pedido.IdUsuario,
                    p_idEmpresa = pedido.IdEmpresa,
                    p_endereco_id = pedido.EnderecoId,
                    p_canal = pedido.Canal ?? "PROPRIO",
                    p_numeroExterno = pedido.NumeroExterno,
                    p_statusPedido_id = pedido.StatusPedidoId,
                    p_valorTotal = pedido.ValorTotal,
                    p_valorFrete = pedido.ValorFrete,
                    p_Desconto = pedido.Desconto,
                    p_Observacao = pedido.Observacao
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
                    p_idPedido = item.IdPedido,
                    p_idProduto = item.IdProduto,
                    p_quantidade = item.Quantidade,
                    p_valorUnitario = item.ValorUnitario,
                    p_desconto = item.Desconto,
                    p_valorTotal = item.ValorTotal
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

        public void AtualizarStatus(int idPedido, int statusPedidoId)
        {
            using var conn = new MySqlConnection(_connectionString);
            conn.Execute(
                "sp_AtualizarStatusPedido",
                new { p_idPedido = idPedido, p_statusPedido_id = statusPedidoId },
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