namespace WebApplication5.Models
{
    public class Usuario
    {
        public int IdUsuario { get; set; }

        public string Login { get; set; } = string.Empty;
        public string Senha { get; set; } = string.Empty;
        public string Nome { get; set; } = string.Empty;
        public string CPF { get; set; } = string.Empty;

        public string? Genero { get; set; }
        public string? Email { get; set; }
        public string? Telefone { get; set; }

        public DateTime dthNascimento { get; set; }
        public DateTime dthCriacao { get; set; }

        public DateTime? dthAdmissao { get; set; }
        public DateTime? dthDemissao { get; set; }

        public byte cargo_id { get; set; }
        public bool fAtivo { get; set; }
    }
}