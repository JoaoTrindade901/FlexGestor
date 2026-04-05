using Dapper;
using MySql.Data.MySqlClient;
using System.Data;
using WebApplication5.Models;

namespace WebApplication5.Repositories
{
    public class CategoriaProdutoRepository
    {
        private readonly string _connectionString;
        public CategoriaProdutoRepository(IConfiguration config)
            => _connectionString = config.GetConnectionString("Default")!;

        public IEnumerable<CategoriaProdutoListaDto> Listar(int idEmpresa)
        {
            using var conn = new MySqlConnection(_connectionString);
            return conn.Query<CategoriaProdutoListaDto>(
                "sp_ListarCategoriaProduto",
                new { p_idEmpresa = idEmpresa },
                commandType: CommandType.StoredProcedure);
        }

        public int Criar(CategoriaProdutoModel cat)
        {
            using var conn = new MySqlConnection(_connectionString);
            return conn.ExecuteScalar<int>(
                "sp_CriarCategoriaProduto",
                new
                {
                    p_idEmpresa = cat.idEmpresa,
                    p_nome = cat.nome,
                    p_descricao = cat.descricao,
                    p_idCategoriaPai = cat.idCategoriaPai
                },
                commandType: CommandType.StoredProcedure);
        }

        public void Editar(CategoriaProdutoModel cat)
        {
            using var conn = new MySqlConnection(_connectionString);
            conn.Execute(
                "sp_EditarCategoriaProduto",
                new
                {
                    p_idCategoria = cat.idCategoria,
                    p_nome = cat.nome,
                    p_descricao = cat.descricao,
                    p_idCategoriaPai = cat.idCategoriaPai
                },
                commandType: CommandType.StoredProcedure);
        }

        public void AlterarStatus(int idCategoria)
        {
            using var conn = new MySqlConnection(_connectionString);
            conn.Execute(
                "sp_AlterarStatusCategoriaProduto",
                new { p_idCategoria = idCategoria },
                commandType: CommandType.StoredProcedure);
        }
    }
}