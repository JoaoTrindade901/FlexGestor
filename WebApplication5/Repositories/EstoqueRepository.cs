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

        public IEnumerable<EstoqueListaGridDto> Filtrar(MovimentacaoFiltroDto filtro, int idEmpresa)
        {
            using var conn = new MySqlConnection(_connectionString);
            return conn.Query<EstoqueListaGridDto>(
                "sp_FiltrarEstoque",
                new
                {
                    p_idEmpresa         = idEmpresa,
                    p_idProduto         = filtro.IdProduto,
                    p_tipoMovimentacao  = filtro.TipoMovimentacao,
                    p_dthInicio         = filtro.DthInicio,
                    p_dthFim            = filtro.DthFim
                },
                commandType: CommandType.StoredProcedure);
        }

        public IEnumerable<MovimentacaoEstoqueModel> ListarMovimentacoes(int idProduto, int idEmpresa)
        {
            using var conn = new MySqlConnection(_connectionString);
            return conn.Query<MovimentacaoEstoqueModel>(
                "sp_ListarMovimentacaoEstoque",
                new { p_idProduto = idProduto, p_idEmpresa = idEmpresa },
                commandType: CommandType.StoredProcedure);
        }

        public void Movimentar(MovimentacaoEstoqueModel m)
        {
            using var conn = new MySqlConnection(_connectionString);
            conn.Execute(
                "sp_MovimentarEstoque",
                new
                {
                    p_IdProduto = m.IdProduto,
                    p_IdEmpresa = m.IdEmpresa,
                    p_TipoMovimentacao = m.TipoMovimentacao,
                    p_Quantidade = m.Quantidade,
                    p_Motivo = m.Motivo,
                    p_IdUsuario = m.IdUsuario,
                    p_DthMovimentacao = m.DthMovimentacao
                },
                commandType: CommandType.StoredProcedure);
        }

        public void AtualizarMinimo(int idProduto, int estoqueMinimo)
        {
            using var conn = new MySqlConnection(_connectionString);
            conn.Execute(
                "sp_AtualizarEstoqueMinimo",
                new { p_idProduto = idProduto, p_estoqueMinimo = estoqueMinimo },
                commandType: CommandType.StoredProcedure);
        }
    }
}
