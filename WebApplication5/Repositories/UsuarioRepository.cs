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

        public Usuario? BuscarPorEmail(string email)
        {
            using var conn = new SqlConnection(_connectionString);

            return conn.QueryFirstOrDefault<Usuario>(
                "sp_BuscarLogin",
                new { Login = login,  cnpj = CNPJ } ,
                commandType: CommandType.StoredProcedure);
        }

        public void Inserir(Usuario usuario)
        {
            using var conn = new SqlConnection(_connectionString);

            conn.Execute(
                "sp_EditarUsuario",
                new
                {
                    usuario.IdUsuario,
                    usuario.Nome,
                    usuario.CPF,
                    usuario.Genero,
                    usuario.Email,
                    usuario.Telefone,
                    usuario.dthNascimento,
                    usuario.dthAdmissao,
                    usuario.dthDemissao,
                    cargo_id = usuario.cargo_id
                },
                commandType: CommandType.StoredProcedure);
        }
    }
}