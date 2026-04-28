using Dapper;
using MySql.Data.MySqlClient;
using System.Data;
using WebApplication5.Models;

namespace WebApplication5.Repositories
{
    public class CaixaRepository
    {
        private readonly string _connectionString;

        public CaixaRepository(IConfiguration config)
            => _connectionString = config.GetConnectionString("Default")!;

        public CaixaModel? BuscarAberto(int idEmpresa)
        {
            using var conn = new MySqlConnection(_connectionString);
            return conn.QueryFirstOrDefault<CaixaModel>(
                "sp_BuscarCaixaAberto",
                new { p_idEmpresa = idEmpresa },
                commandType: CommandType.StoredProcedure);
        }

        public int Abrir(int idEmpresa, int idUsuario, decimal saldoInicial, string? nomeOperador)
        {
            using var conn = new MySqlConnection(_connectionString);
            return conn.ExecuteScalar<int>(
                "sp_AbrirCaixa",
                new
                {
                    p_idEmpresa = idEmpresa,
                    p_idUsuario = idUsuario,
                    p_saldoInicial = saldoInicial,
                    p_nomeOperador = nomeOperador
                },
                commandType: CommandType.StoredProcedure);
        }

        public void Fechar(int idEmpresa, int idUsuario, decimal saldoFinal,
                           decimal saldoFinalContado, decimal diferenca, string? obs)
        {
            var caixa = BuscarAberto(idEmpresa)
                ?? throw new InvalidOperationException("Nenhum caixa aberto.");

            using var conn = new MySqlConnection(_connectionString);
            conn.Execute(
                "sp_FecharCaixa",
                new
                {
                    p_idCaixa = caixa.idCaixa,
                    p_idUsuario = idUsuario,
                    p_saldoFinal = saldoFinal,
                    p_saldoFinalContado = saldoFinalContado,
                    p_obs = obs
                },
                commandType: CommandType.StoredProcedure);
        }

        public IEnumerable<CaixaModel> ListarHistorico(int idEmpresa)
        {
            using var conn = new MySqlConnection(_connectionString);
            return conn.Query<CaixaModel>(
                "sp_ListarCaixas",
                new { p_idEmpresa = idEmpresa },
                commandType: CommandType.StoredProcedure);
        }

        public int Lancar(int idCaixa, int idEmpresa, int idUsuario, LancarCaixaDto dto)
        {
            using var conn = new MySqlConnection(_connectionString);
            return conn.ExecuteScalar<int>(
                "sp_LancarCaixa",
                new
                {
                    p_idCaixa = idCaixa,
                    p_idEmpresa = idEmpresa,
                    p_idUsuario = idUsuario,
                    p_idFormaPagamento = dto.IdFormaPagamento,
                    p_idCategoriaFinanceira = dto.IdCategoriaFinanceira,
                    p_valor = dto.Valor,
                    p_descricao = dto.Descricao,
                    p_referencia = dto.Referencia,
                    p_tipoLancamento = dto.TipoLancamento,
                    p_pedido_id = dto.PedidoId,
                    p_cliente_id = dto.ClienteId,
                    p_contaReceber_id = dto.ContaReceberId
                },
                commandType: CommandType.StoredProcedure);
        }

        public IEnumerable<LancamentoCaixaModel> ListarLancamentos(int idEmpresa, int idCaixa)
        {
            using var conn = new MySqlConnection(_connectionString);
            return conn.Query<LancamentoCaixaModel>(
                "sp_ListarLancamentosCaixa",
                new { p_idEmpresa = idEmpresa, p_idCaixa = idCaixa },
                commandType: CommandType.StoredProcedure);
        }

        public IEnumerable<BreakdownFormaPagamentoDto> Breakdown(int idEmpresa, int idCaixa)
        {
            using var conn = new MySqlConnection(_connectionString);
            return conn.Query<BreakdownFormaPagamentoDto>(
                "sp_BreakdownFormaPagamento",
                new { p_idEmpresa = idEmpresa, p_idCaixa = idCaixa },
                commandType: CommandType.StoredProcedure);
        }

        public IEnumerable<FormaPagamentoModel> ListarFormasPagamento(int idEmpresa)
        {
            using var conn = new MySqlConnection(_connectionString);
            return conn.Query<FormaPagamentoModel>(
                "sp_ListarFormaPagamento",
                new { p_idEmpresa = idEmpresa },
                commandType: CommandType.StoredProcedure);
        }

        public IEnumerable<CategoriaFinanceiraModel> ListarCategorias(int idEmpresa)
        {
            using var conn = new MySqlConnection(_connectionString);
            return conn.Query<CategoriaFinanceiraModel>(
                "sp_ListarCategoriaFinanceira",
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

        public IEnumerable<ContaReceberModel> ListarContasReceber(int idEmpresa)
        {
            using var conn = new MySqlConnection(_connectionString);
            return conn.Query<ContaReceberModel>(
                "sp_ListarContasReceber",
                new { p_idEmpresa = idEmpresa },
                commandType: CommandType.StoredProcedure);
        }

        public void ReceberConta(int idContaReceber, decimal valorPago)
        {
            using var conn = new MySqlConnection(_connectionString);
            conn.Execute(
                "sp_ReceberConta",
                new
                {
                    p_idContaReceber = idContaReceber,
                    p_valorPago = valorPago,
                    p_dthPagamento = DateTime.Now
                },
                commandType: CommandType.StoredProcedure);
        }

        public void AlterarVencimentoConta(int idContaReceber, DateTime novaData)
        {
            using var conn = new MySqlConnection(_connectionString);
            conn.Execute(
                "UPDATE ContaReceber SET dthVencimento = @data WHERE idContaReceber = @id",
                new { data = novaData.Date, id = idContaReceber });
        }
    }
}