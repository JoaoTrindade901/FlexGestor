namespace WebApplication5.Models
{
    public class ClienteFiltroDto
    {
        public string? Nome { get; set; }
        public string? CpfCnpj { get; set; }
        public string? Email { get; set; }
        public int? TipoCliente { get; set; }
        public string? Genero { get; set; }
        public string? Estado { get; set; }
        public string? Cidade { get; set; }
        public bool? FAtivo { get; set; }
        public DateTime? DthCadastroInicio { get; set; }
        public DateTime? DthCadastroFim { get; set; }
        public DateTime? DthNascimentoInicio { get; set; }
        public DateTime? DthNascimentoFim { get; set; }
        public bool? SemEmail { get; set; }
        public bool? AniversariantesDoMes { get; set; }
    }
}