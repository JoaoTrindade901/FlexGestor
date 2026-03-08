using Dapper;
using Microsoft.Data.SqlClient;
using System.Data;

public class TokenResetRepository
{
    private readonly string _connectionString;
    public TokenResetRepository(IConfiguration config)
    {
        _connectionString = config.GetConnectionString("Default");
    }

    public void Inserir(int idUsuario, string token, DateTime expiracao)
    {
        using var conn = new SqlConnection(_connectionString);
        conn.Execute("sp_InserirTokenReset",
            new { idUsuario, token, dthExpiracao = expiracao },
            commandType: CommandType.StoredProcedure);
    }

    public TokenResetSenha? Buscar(string token)
    {
        using var conn = new SqlConnection(_connectionString);
        return conn.QueryFirstOrDefault<TokenResetSenha>("sp_BuscarTokenReset",
            new { token },
            commandType: CommandType.StoredProcedure);
    }

    public void Invalidar(string token)
    {
        using var conn = new SqlConnection(_connectionString);
        conn.Execute("sp_InvalidarTokenReset",
            new { token },
            commandType: CommandType.StoredProcedure);
    }

    public void AtualizarSenha(int idUsuario, string senhaHash)
    {
        using var conn = new SqlConnection(_connectionString);
        conn.Execute("sp_AtualizarSenha",
            new { idUsuario, Senha = senhaHash },
            commandType: CommandType.StoredProcedure);
    }
}