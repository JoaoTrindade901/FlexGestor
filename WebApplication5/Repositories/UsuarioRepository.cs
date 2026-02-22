using Dapper;
using Microsoft.Data.SqlClient;
using System.Data;
using WebApplication5.Models;

namespace WebApplication5.Repositories
{
    public class UsuarioRepository
    {
        private readonly string _connectionString;

        public UsuarioRepository(IConfiguration config)
        {
            _connectionString = config.GetConnectionString("Default");
        }

        public IEnumerable<Usuario> Listar()
        {
            using var conn = new SqlConnection(_connectionString);

            return conn.Query<Usuario>(
                "sp_ListarUsuario",
                commandType: CommandType.StoredProcedure);
        }

        public Usuario? BuscarPorLogin(string login)
        {
            using var conn = new SqlConnection(_connectionString);

            return conn.QueryFirstOrDefault<Usuario>(
                "sp_BuscarLogin",
                new { Login = login },
                commandType: CommandType.StoredProcedure);
        }

        public void Inserir(Usuario usuario)
        {
            using var conn = new SqlConnection(_connectionString);

            conn.Execute(
                "sp_CriarUsuario",
                usuario,
                commandType: CommandType.StoredProcedure);
        }
    }
}