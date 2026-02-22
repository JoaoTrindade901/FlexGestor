namespace WebApplication5.Models
{
    public class Cargo
    {
        public byte IdCargo { get; set; }

        public string Nome { get; set; } = string.Empty;

        public string? Descricao { get; set; }

        public bool fAtivo { get; set; }
    }
}