using Dapper;
using MySql.Data.MySqlClient;
using Newtonsoft.Json.Linq;
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
        using var conn = new MySqlConnection(_connectionString);
        conn.Execute("sp_InserirTokenReset",
            new { idUsuario, token, dthExpiracao = expiracao },
            commandType: CommandType.StoredProcedure);
    }

    public TokenResetSenhaModel? Buscar(string token)
    {
        using var conn = new MySqlConnection(_connectionString);
        return conn.QueryFirstOrDefault<TokenResetSenhaModel>(
            "SELECT * FROM TokenResetSenha WHERE token = @token AND fUsado = 0",
            new { token });
    }

    public void Invalidar(string token)
    {
        using var conn = new MySqlConnection(_connectionString);
        conn.Execute("sp_InvalidarTokenReset",
            new { token },
            commandType: CommandType.StoredProcedure);
    }

    public void AtualizarSenha(int idUsuario, string senhaHash)
    {
        using var conn = new MySqlConnection(_connectionString);
        conn.Execute("sp_AtualizarSenha",
            new { idUsuario, Senha = senhaHash },
            commandType: CommandType.StoredProcedure);
    }
}