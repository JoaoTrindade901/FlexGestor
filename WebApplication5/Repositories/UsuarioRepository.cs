using Dapper;
using MySql.Data.MySqlClient;
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
            using var conn = new MySqlConnection(_connectionString);

            return conn.Query<UsuarioListaGridDto>(
                "sp_ListarUsuario",
                commandType: CommandType.StoredProcedure);
        }

        //usado na SenhaResetService
        public UsuarioModel? BuscarPorEmail(string email)
        {
            using var conn = new MySqlConnection(_connectionString);
            return conn.QueryFirstOrDefault<UsuarioModel>(
                "SELECT idUsuario, Nome, Email FROM Usuario WHERE Email = @email AND fAtivo = 1",
                new { email });
        }

        public UsuarioModel? BuscarPorLogin(string login, string CNPJ)
        {
            using var conn = new MySqlConnection(_connectionString);

            return conn.QueryFirstOrDefault<UsuarioModel>(
                "sp_BuscarLogin",
                new { Login = login,  cnpj = CNPJ } ,
                commandType: CommandType.StoredProcedure);
        }

        public void Inserir(UsuarioModel usuario)
        {
            using var conn = new MySqlConnection(_connectionString);
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

        public void AlterarStatus(int idUsuario)
        {
            using var conn = new MySqlConnection(_connectionString);
            conn.Execute(
                "sp_AlterarStatusUsuario",
                new { p_idUsuario = idUsuario },
                commandType: CommandType.StoredProcedure);
        }

        public void Atualizar(UsuarioModel usuario)
        {
            using var conn = new MySqlConnection(_connectionString);
            conn.Execute(
                "sp_EditarUsuario",
                new
                {
                    p_idUsuario = usuario.IdUsuario,
                    p_Nome = usuario.Nome,
                    p_Login = usuario.Login,
                    p_Senha = string.IsNullOrEmpty(usuario.Senha) ? null : usuario.Senha,
                    p_CPF = usuario.CPF,
                    p_Email = usuario.Email,
                    p_Telefone = usuario.Telefone,
                    p_cargo_id = usuario.cargo_id
                },
                commandType: CommandType.StoredProcedure);
        }
    }
}