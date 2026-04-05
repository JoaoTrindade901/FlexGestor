public class UsuarioModel
{
    public int IdUsuario { get; set; }
    public string Login { get; set; } = string.Empty;
    public string Senha { get; set; } = string.Empty;
    public string Nome { get; set; } = string.Empty;
    public string CPF { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Telefone { get; set; }
    public DateTime dthCriacao { get; set; }
    public int cargo_id { get; set; }
    public bool fAtivo { get; set; }
    public int idEmpresa { get; set; }
}