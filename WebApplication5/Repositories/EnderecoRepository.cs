using Dapper;
using MySql.Data.MySqlClient;
using System.Data;
using WebApplication5.Models;

namespace WebApplication5.Repositories
{
    public class EnderecoRepository
    {
        private readonly string _connectionString;

        public EnderecoRepository(IConfiguration config)
        {
            _connectionString = config.GetConnectionString("Default")!;
        }

        public int InserirEndereco(EnderecoModel endereco)
        {
            using var conn = new MySqlConnection(_connectionString);
            return conn.ExecuteScalar<int>(
                "sp_CriarEndereco",
                new
                {
                    endereco.tipoEndereco,
                    endereco.logradouro,
                    endereco.numero,
                    endereco.complemento,
                    endereco.bairro,
                    endereco.cidade,
                    endereco.estado,
                    endereco.pais,
                    endereco.cep,
                    endereco.fAtivo
                },
                commandType: CommandType.StoredProcedure);
        }

        public void AtualizarEndereco(EnderecoModel endereco)
        {
            using var conn = new MySqlConnection(_connectionString);
            conn.Execute(
                "sp_EditarEndereco",
                new
                {
                    endereco.idEndereco,
                    endereco.tipoEndereco,
                    endereco.logradouro,
                    endereco.numero,
                    endereco.complemento,
                    endereco.bairro,
                    endereco.cidade,
                    endereco.estado,
                    endereco.pais,
                    endereco.cep
                },
                commandType: CommandType.StoredProcedure);
        }
    }
}