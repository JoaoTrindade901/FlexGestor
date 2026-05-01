using Dapper;
using MySql.Data.MySqlClient;
using WebApplication5.Models;

namespace WebApplication5.Repositories
{
    public class DespesaRepository
    {
        private readonly string _connectionString;

        public DespesaRepository(IConfiguration config)
            => _connectionString = config.GetConnectionString("Default")!;

        public IEnumerable<DespesaModel> Listar(int idEmpresa)
        {
            using var conn = new MySqlConnection(_connectionString);
            return conn.Query<DespesaModel>(
                @"SELECT idCategoriaFinanceira, Nome AS nome, fAtivo
                  FROM CategoriaFinanceira
                  WHERE idEmpresa = @idEmpresa AND Tipo = 2 AND SubTipo = 2
                  ORDER BY Nome",
                new { idEmpresa });
        }

        public int Criar(int idEmpresa, SalvarDespesaDto dto)
        {
            using var conn = new MySqlConnection(_connectionString);
            return conn.ExecuteScalar<int>(
                @"INSERT INTO CategoriaFinanceira (idEmpresa, Nome, Tipo, SubTipo, fAtivo)
                  VALUES (@idEmpresa, @nome, 2, 2, 1);
                  SELECT LAST_INSERT_ID();",
                new { idEmpresa, nome = dto.Nome.Trim() });
        }

        public void Editar(SalvarDespesaDto dto)
        {
            using var conn = new MySqlConnection(_connectionString);
            conn.Execute(
                "UPDATE CategoriaFinanceira SET Nome = @nome WHERE idCategoriaFinanceira = @id AND SubTipo = 2",
                new { nome = dto.Nome.Trim(), id = dto.Id });
        }

        public void AlterarStatus(int id, bool ativo)
        {
            using var conn = new MySqlConnection(_connectionString);
            conn.Execute(
                "UPDATE CategoriaFinanceira SET fAtivo = @ativo WHERE idCategoriaFinanceira = @id AND SubTipo = 2",
                new { ativo = ativo ? 1 : 0, id });
        }
    }
}