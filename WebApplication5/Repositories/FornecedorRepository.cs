using Dapper;
using MySql.Data.MySqlClient;
using System.Data;

namespace WebApplication5.Repositories
{
    public class FornecedorListaDto
    {
        public int IdFornecedor { get; set; }
        public string NomeFantasia { get; set; } = string.Empty;
        public string? RazaoSocial { get; set; }
        public string CNPJ { get; set; } = string.Empty;
        public string Telefone { get; set; } = string.Empty;
        public string? Email { get; set; }
        public bool FAtivo { get; set; }
        public int IdEmpresa { get; set; }
    }

    public class FornecedorModel
    {
        public int IdFornecedor { get; set; }
        public string NomeFantasia { get; set; } = string.Empty;
        public string? RazaoSocial { get; set; }
        public string CNPJ { get; set; } = string.Empty;
        public string Telefone { get; set; } = string.Empty;
        public string? Email { get; set; }
        public bool FAtivo { get; set; }
        public int IdEmpresa { get; set; }
    }

    public class FornecedorRepository
    {
        private readonly string _connectionString;

        public FornecedorRepository(IConfiguration config)
        {
            _connectionString = config.GetConnectionString("Default")!;
        }

        public IEnumerable<FornecedorListaDto> Listar(int idEmpresa)
        {
            using var conn = new MySqlConnection(_connectionString);
            return conn.Query<FornecedorListaDto>(
                "sp_ListarFornecedor",
                new { p_idEmpresa = idEmpresa },
                commandType: CommandType.StoredProcedure);
        }

        public int Inserir(FornecedorModel f)
        {
            using var conn = new MySqlConnection(_connectionString);
            return conn.ExecuteScalar<int>(
                "sp_CriarFornecedor",
                new
                {
                    p_idEmpresa = f.IdEmpresa,
                    p_NomeFantasia = f.NomeFantasia,
                    p_RazaoSocial = f.RazaoSocial,
                    p_CNPJ = f.CNPJ,
                    p_Telefone = f.Telefone,
                    p_Email = f.Email
                },
                commandType: CommandType.StoredProcedure);
        }

        public void Atualizar(FornecedorModel f)
        {
            using var conn = new MySqlConnection(_connectionString);
            conn.Execute(
                "sp_EditarFornecedor",
                new
                {
                    p_idFornecedor = f.IdFornecedor,
                    p_NomeFantasia = f.NomeFantasia,
                    p_RazaoSocial = f.RazaoSocial,
                    p_CNPJ = f.CNPJ,
                    p_Telefone = f.Telefone,
                    p_Email = f.Email
                },
                commandType: CommandType.StoredProcedure);
        }

        public void AlterarStatus(int idFornecedor)
        {
            using var conn = new MySqlConnection(_connectionString);
            conn.Execute(
                "sp_AlterarStatusFornecedor",
                new { p_idFornecedor = idFornecedor },
                commandType: CommandType.StoredProcedure);
        }
    }
}
