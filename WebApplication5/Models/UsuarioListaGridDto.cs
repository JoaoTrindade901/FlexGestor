public class UsuarioListaGridDto
{
    public int IdUsuario { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string Login { get; set; } = string.Empty;
    public string NomeCargo { get; set; } = string.Empty;
    public int cargo_id { get; set; } 
    public DateTime dthCriacao { get; set; }
    public bool fAtivo { get; set; }
}