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

        public int Abrir(int idEmpresa, int idUsuario, decimal saldoInicial)
        {
            using var conn = new MySqlConnection(_connectionString);
            return conn.ExecuteScalar<int>(
                "sp_AbrirCaixa",
                new { p_idEmpresa = idEmpresa, p_idUsuario = idUsuario, p_saldoInicial = saldoInicial },
                commandType: CommandType.StoredProcedure);
        }

        public void Fechar(int idCaixa, int idUsuario, decimal saldoFinal)
        {
            using var conn = new MySqlConnection(_connectionString);
            conn.Execute(
                "sp_FecharCaixa",
                new { p_idCaixa = idCaixa, p_idUsuario = idUsuario, p_saldoFinal = saldoFinal },
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
                    p_referencia = dto.Referencia
                },
                commandType: CommandType.StoredProcedure);
        }

        public IEnumerable<LancamentoCaixaModel> ListarLancamentos(int idCaixa)
        {
            using var conn = new MySqlConnection(_connectionString);
            return conn.Query<LancamentoCaixaModel>(
                "sp_ListarLancamentosCaixa",
                new { p_idCaixa = idCaixa },
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
    }
} 