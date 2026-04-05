// Repositories/EstoqueRepository.cs
using Dapper;
using MySql.Data.MySqlClient;
using System.Data;
using WebApplication5.Models;

namespace WebApplication5.Repositories
{
    public class EstoqueRepository
    {
        private readonly string _connectionString;

        public EstoqueRepository(IConfiguration config)
        {
            _connectionString = config.GetConnectionString("Default")!;
        }

        public IEnumerable<EstoqueListaGridDto> Listar(int idEmpresa)
        {
            using var conn = new MySqlConnection(_connectionString);
            return conn.Query<EstoqueListaGridDto>(
                "sp_ListarEstoque",
                new { p_idEmpresa = idEmpresa },
                commandType: CommandType.StoredProcedure);
        }

        public IEnumerable<MovimentacaoEstoqueModel> ListarMovimentacoes(int idEmpresa)
        {
            using var conn = new MySqlConnection(_connectionString);
            return conn.Query<MovimentacaoEstoqueModel>(
                "sp_ListarMovimentacaoEstoque",
                new { p_idEmpresa = idEmpresa },
                commandType: CommandType.StoredProcedure);
        }

        public void Movimentar(MovimentacaoEstoqueModel m)
        {
            using var conn = new MySqlConnection(_connectionString);
            conn.Execute(
                "sp_MovimentarEstoque",
                new
                {
                    p_produto_id = m.IdProduto,
                    p_idEmpresa = m.IdEmpresa,
                    p_tipoMovimentacao = m.TipoMovimentacao,
                    p_Qtde = m.Quantidade,
                    p_Observacao = m.Motivo,
                    p_usuario_id = m.IdUsuario
                },
                commandType: CommandType.StoredProcedure);
        }

        public void AtualizarMinimo(int idProduto, int estoqueMinimo)
        {
            using var conn = new MySqlConnection(_connectionString);
            conn.Execute(
                "sp_AtualizarEstoqueMinimo",
                new { p_produto_id = idProduto, p_estoqueMin = estoqueMinimo },
                commandType: CommandType.StoredProcedure);
        }
    }
}