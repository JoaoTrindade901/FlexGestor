namespace WebApplication5.Models
{
    public class EnderecoModel
    {
        public int idEndereco { get; set; }
        public int tipoEndereco { get; set; }
        public string logradouro { get; set; } = string.Empty;
        public string numero { get; set; } = string.Empty;
        public string? complemento { get; set; }
        public string bairro { get; set; } = string.Empty;
        public string cidade { get; set; } = string.Empty;
        public string estado { get; set; } = string.Empty;
        public string pais { get; set; } = "Brasil";
        public string cep { get; set; } = string.Empty; // string para preservar zero à esquerda
        public byte fAtivo { get; set; } = 1;
    }
}