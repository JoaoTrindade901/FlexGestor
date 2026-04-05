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
            var clientes = conn.Query<ClienteListaGridDto>(
                "sp_ListarCliente",
                commandType: CommandType.StoredProcedure);

            foreach (var c in clientes)
                c.fAtivo = c.fAtivo; 

            return clientes;
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
                    fAtivo               = filtro.fAtivo,
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
                    cliente.fAtivo,
                    cliente.saldoDevedor
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
                    p_idCliente = cliente.idCliente,
                    p_nome = cliente.nome,
                    p_nomeFantasia = cliente.nomeFantasia,
                    p_razaoSocial = cliente.razaoSocial,
                    p_cpfCNPJ = cliente.cpfCNPJ,
                    p_email = cliente.email,
                    p_telefone = cliente.telefone,
                    p_tipoCliente_id = cliente.tipoCliente_id,
                    p_observacao = cliente.observacao,
                    p_genero = cliente.genero,
                    p_enderecoId = cliente.enderecoId,
                    p_dthNascimento = cliente.dthNascimento,
                    p_saldoDevedor = cliente.saldoDevedor
                },
                commandType: CommandType.StoredProcedure);
        }

        public void DeletarCliente(int idCliente)
        {
            using var conn = new MySqlConnection(_connectionString);
            conn.Execute(
                "sp_DeletarCliente",
                new { p_idCliente = idCliente },
                commandType: CommandType.StoredProcedure);
        }
    }
}
