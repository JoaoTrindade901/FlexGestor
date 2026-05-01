using Dapper;
using MySql.Data.MySqlClient;
using System.Data;
using WebApplication5.Models;

namespace WebApplication5.Repositories
{
    public class FinanceiroRepository
    {
        private readonly string _connectionString;

        public FinanceiroRepository(IConfiguration config)
            => _connectionString = config.GetConnectionString("Default")!;

        // ── CONTAS A RECEBER ──────────────────────────────
        public IEnumerable<ContaReceberModel> ListarContasReceber(int idEmpresa)
        {
            using var conn = new MySqlConnection(_connectionString);
            return conn.Query<ContaReceberModel>(
                "sp_ListarContasReceber",
                new { p_idEmpresa = idEmpresa },
                commandType: CommandType.StoredProcedure);
        }

        public int CriarContaReceber(int idEmpresa, CriarContaReceberDto dto, int? lancamentoId)
        {
            using var conn = new MySqlConnection(_connectionString);
            return conn.ExecuteScalar<int>(
                "sp_CriarContaReceber",
                new
                {
                    p_idEmpresa = idEmpresa,
                    p_cliente_id = dto.ClienteId,
                    p_pedido_id = dto.PedidoId,
                    p_lancamento_id = lancamentoId,
                    p_descricao = dto.Descricao,
                    p_valorTotal = dto.ValorTotal,
                    p_dthVencimento = dto.DthVencimento
                },
                commandType: CommandType.StoredProcedure);
        }

        public void EditarContaReceber(EditarContaReceberDto dto)
        {
            using var conn = new MySqlConnection(_connectionString);
            conn.Execute("sp_EditarContaReceber",
                new
                {
                    p_idContaReceber = dto.IdContaReceber,
                    p_descricao = dto.Descricao,
                    p_valorTotal = dto.ValorTotal,
                    p_dthVencimento = dto.DthVencimento,
                    p_cliente_id = dto.ClienteId
                },
                commandType: CommandType.StoredProcedure);
        }

        public void ExcluirContaReceber(int idContaReceber)
        {
            using var conn = new MySqlConnection(_connectionString);
            conn.Execute("sp_ExcluirContaReceber",
                new { p_idContaReceber = idContaReceber },
                commandType: CommandType.StoredProcedure);
        }

        public void ReceberConta(int idContaReceber, decimal valorPago)
        {
            using var conn = new MySqlConnection(_connectionString);
            conn.Execute(
                "sp_ReceberConta",
                new { p_idContaReceber = idContaReceber, p_valorPago = valorPago, p_dthPagamento = DateTime.Now },
                commandType: CommandType.StoredProcedure);
        }

        public void AlterarVencimentoContaReceber(int idContaReceber, DateTime novaData)
        {
            using var conn = new MySqlConnection(_connectionString);
            conn.Execute(
                "UPDATE ContaReceber SET dthVencimento = @data WHERE idContaReceber = @id",
                new { data = novaData.Date, id = idContaReceber });
        }

        public IEnumerable<PagamentoHistoricoDto> ListarHistoricoReceber(int idContaReceber)
        {
            using var conn = new MySqlConnection(_connectionString);
            return conn.Query<PagamentoHistoricoDto>(
                "sp_ListarHistoricoContaReceber",
                new { p_idContaReceber = idContaReceber },
                commandType: CommandType.StoredProcedure);
        }

        // ── CONTAS A PAGAR ────────────────────────────────
        public IEnumerable<ContaPagarModel> ListarContasPagar(int idEmpresa)
        {
            using var conn = new MySqlConnection(_connectionString);
            return conn.Query<ContaPagarModel>(
                "sp_ListarContasPagar",
                new { p_idEmpresa = idEmpresa },
                commandType: CommandType.StoredProcedure);
        }

        public int CriarContaPagar(int idEmpresa, CriarContaPagarDto dto)
        {
            using var conn = new MySqlConnection(_connectionString);
            return conn.ExecuteScalar<int>(
                "sp_CriarContaPagar",
                new
                {
                    p_idEmpresa = idEmpresa,
                    p_fornecedor_id = dto.FornecedorId,
                    p_descricao = dto.Descricao,
                    p_valorTotal = dto.ValorTotal,
                    p_dthVencimento = dto.DthVencimento
                },
                commandType: CommandType.StoredProcedure);
        }

        public void EditarContaPagar(EditarContaPagarDto dto)
        {
            using var conn = new MySqlConnection(_connectionString);
            conn.Execute("sp_EditarContaPagar",
                new
                {
                    p_idContaPagar = dto.IdContaPagar,
                    p_descricao = dto.Descricao,
                    p_valorTotal = dto.ValorTotal,
                    p_dthVencimento = dto.DthVencimento,
                    p_fornecedor_id = dto.FornecedorId
                },
                commandType: CommandType.StoredProcedure);
        }

        public void ExcluirContaPagar(int idContaPagar)
        {
            using var conn = new MySqlConnection(_connectionString);
            conn.Execute("sp_ExcluirContaPagar",
                new { p_idContaPagar = idContaPagar },
                commandType: CommandType.StoredProcedure);
        }

        public void PagarConta(int idContaPagar, decimal valorPago)
        {
            using var conn = new MySqlConnection(_connectionString);
            conn.Execute(
                "sp_PagarConta",
                new { p_idContaPagar = idContaPagar, p_valorPago = valorPago, p_dthPagamento = DateTime.Now },
                commandType: CommandType.StoredProcedure);
        }

        public void AlterarVencimentoContaPagar(int idContaPagar, DateTime novaData)
        {
            using var conn = new MySqlConnection(_connectionString);
            conn.Execute(
                "sp_AlterarVencimentoContaPagar",
                new { p_idContaPagar = idContaPagar, p_novaData = novaData.Date },
                commandType: CommandType.StoredProcedure);
        }

        public IEnumerable<PagamentoHistoricoDto> ListarHistoricoPagar(int idContaPagar)
        {
            using var conn = new MySqlConnection(_connectionString);
            return conn.Query<PagamentoHistoricoDto>(
                "sp_ListarHistoricoContaPagar",
                new { p_idContaPagar = idContaPagar },
                commandType: CommandType.StoredProcedure);
        }
    }
}