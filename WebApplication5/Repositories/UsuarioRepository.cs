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

        public IEnumerable<UsuarioListaGridDto> Listar()
        {
            using var conn = new SqlConnection(_connectionString);

            return conn.Query<UsuarioListaGridDto>(
                "sp_ListarUsuario",
                commandType: CommandType.StoredProcedure);
        }

        //usado na SenhaResetService
        public Usuario? BuscarPorEmail(string email)
        {
            using var conn = new SqlConnection(_connectionString);
            return conn.QueryFirstOrDefault<Usuario>(
                "SELECT idUsuario, Nome, Email FROM Usuario WHERE Email = @email AND fAtivo = 1",
                new { email });
        }

        public Usuario? BuscarPorLogin(string login, string CNPJ)
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
                "sp_CriarUsuario",
                new
                {
                    usuario.Login,
                    usuario.Senha,
                    usuario.Nome,
                    usuario.CPF,
                    usuario.Email,
                    usuario.Telefone,
                    dthCriacao = DateTime.Now,
                    cargo_id = usuario.cargo_id,
                    usuario.fAtivo
                },
                commandType: CommandType.StoredProcedure);
        }

        public void Atualizar(Usuario usuario)
        {
            using var conn = new SqlConnection(_connectionString);
            conn.Execute(
                "sp_EditarUsuario",
                new
                {
                    usuario.IdUsuario,
                    usuario.Nome,
                    usuario.Login,
                    usuario.Senha,
                    usuario.CPF,
                    usuario.Email,
                    usuario.Telefone,
                    cargo_id = usuario.cargo_id
                },
                commandType: CommandType.StoredProcedure);
        }
    }
}