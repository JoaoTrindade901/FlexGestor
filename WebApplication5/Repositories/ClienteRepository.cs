using Dapper;
using MySql.Data.MySqlClient;
using System.Data;
using WebApplication5.Models;

namespace WebApplication5.Repositories
{
    public class ClienteRepository
    {
        private readonly string _connectionString;

        public ClienteRepository(IConfiguration config)
        {
            _connectionString = config.GetConnectionString("Default")!;
        }

        public IEnumerable<ClienteListaGridDto> ListarClientes()
        {
            using var conn = new MySqlConnection(_connectionString);
            return conn.Query<ClienteListaGridDto>(
                "sp_ListarCliente",
                commandType: CommandType.StoredProcedure);
        }

        public IEnumerable<ClienteListaGridDto> FiltrarClientes(ClienteFiltroDto filtro)
        {
            using var conn = new MySqlConnection(_connectionString);
            return conn.Query<ClienteListaGridDto>(
                "sp_FiltrarCliente",
                new
                {
                    Nome                 = filtro.Nome,
                    CpfCnpj              = filtro.CpfCnpj,
                    Email                = filtro.Email,
                    TipoCliente          = filtro.TipoCliente,
                    Genero               = filtro.Genero,
                    Estado               = filtro.Estado,
                    Cidade               = filtro.Cidade,
                    FAtivo               = filtro.FAtivo,
                    DthCadastroInicio    = filtro.DthCadastroInicio,
                    DthCadastroFim       = filtro.DthCadastroFim,
                    DthNascimentoInicio  = filtro.DthNascimentoInicio,
                    DthNascimentoFim     = filtro.DthNascimentoFim,
                    SemEmail             = filtro.SemEmail,
                    AniversariantesDoMes = filtro.AniversariantesDoMes
                },
                commandType: CommandType.StoredProcedure);
        }

        public int InserirCliente(ClienteModel cliente)
        {
            using var conn = new MySqlConnection(_connectionString);
            return conn.ExecuteScalar<int>(
                "sp_CriarCliente",
                new
                {
                    cliente.idEmpresa,
                    cliente.nome,
                    cliente.nomeFantasia,
                    cliente.razaoSocial,
                    cliente.cpfCNPJ,
                    cliente.email,
                    cliente.telefone,
                    cliente.tipoCliente_id,
                    cliente.observacao,
                    cliente.genero,
                    cliente.enderecoId,
                    cliente.dthNascimento,
                    cliente.fAtivo
                },
                commandType: CommandType.StoredProcedure);
        }

        public void AtualizarCliente(ClienteModel cliente)
        {
            using var conn = new MySqlConnection(_connectionString);
            conn.Execute(
                "sp_EditarCliente",
                new
                {
                    cliente.idCliente,
                    cliente.nome,
                    cliente.nomeFantasia,
                    cliente.razaoSocial,
                    cliente.cpfCNPJ,
                    cliente.email,
                    cliente.telefone,
                    cliente.tipoCliente_id,
                    cliente.observacao,
                    cliente.genero,
                    cliente.enderecoId,
                    cliente.dthNascimento
                },
                commandType: CommandType.StoredProcedure);
        }

        public void DeletarCliente(int idCliente)
        {
            using var conn = new MySqlConnection(_connectionString);
            conn.Execute(
                "sp_DeletarCliente",
                new { idCliente },
                commandType: CommandType.StoredProcedure);
        }
    }
}
