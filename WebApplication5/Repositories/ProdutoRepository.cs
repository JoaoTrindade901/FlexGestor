using Dapper;
using MySql.Data.MySqlClient;
using System.Data;
using WebApplication5.Models;

namespace WebApplication5.Repositories
{
    public class ProdutoRepository
    {
        private readonly string _connectionString;

        public ProdutoRepository(IConfiguration config)
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

        public IEnumerable<ProdutoListaGridDto> Filtrar(ProdutoFiltroDto filtro, int idEmpresa)
        {
            using var conn = new MySqlConnection(_connectionString);
            return conn.Query<ProdutoListaGridDto>(
                "sp_FiltrarProduto",
                new
                {
                    p_idEmpresa      = idEmpresa,
                    p_nome           = filtro.Nome,
                    p_sku            = filtro.SKU,
                    p_codigoBarras   = filtro.CodigoBarras,
                    p_idCategoria    = filtro.IdCategoria,
                    p_unidade        = filtro.Unidade,
                    p_fAtivo         = filtro.FAtivo,
                    p_precoVendaMin  = filtro.PrecoVendaMin,
                    p_precoVendaMax  = filtro.PrecoVendaMax,
                    p_estoqueBaixo   = filtro.EstoqueBaixo,
                    p_dthInicio      = filtro.DthCadastroInicio,
                    p_dthFim         = filtro.DthCadastroFim
                },
                commandType: CommandType.StoredProcedure);
        }

        public int Inserir(ProdutoModel p)
        {
            using var conn = new MySqlConnection(_connectionString);
            return conn.ExecuteScalar<int>(
                "sp_CriarProduto",
                new
                {
                    p_idEmpresa = p.IdEmpresa,
                    p_Nome = p.Nome,
                    p_Descricao = p.Descricao,
                    p_codBarras = p.CodigoBarras,
                    p_categoriaProduto_id = p.IdCategoria,
                    p_precoCusto = p.PrecoCusto,
                    p_precoVenda = p.PrecoVenda,
                    p_fAtivo = p.FAtivo
                },
                commandType: CommandType.StoredProcedure);
        }

        public void Atualizar(ProdutoModel p)
        {
            using var conn = new MySqlConnection(_connectionString);
            conn.Execute(
                "sp_EditarProduto",
                new
                {
                    p.IdProduto,
                    p.Nome,
                    p.Descricao,
                    p.SKU,
                    p.CodigoBarras,
                    p.PrecoCusto,
                    p.PrecoVenda,
                    p.IdCategoria,
                    p.Unidade
                },
                commandType: CommandType.StoredProcedure);
        }

        public void AlterarStatus(int idProduto)
        {
            using var conn = new MySqlConnection(_connectionString);
            conn.Execute(
                "sp_AlterarStatusProduto",
                new { p_idProduto = idProduto },
                commandType: CommandType.StoredProcedure);
        }
    }
}
