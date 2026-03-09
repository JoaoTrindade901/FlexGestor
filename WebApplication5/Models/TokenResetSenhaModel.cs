public class TokenResetSenhaModel
{
    public int idToken { get; set; }
    public int idUsuario { get; set; }
    public string token { get; set; } = string.Empty;
    public DateTime dthExpiracao { get; set; }
    public bool fUsado { get; set; }
}