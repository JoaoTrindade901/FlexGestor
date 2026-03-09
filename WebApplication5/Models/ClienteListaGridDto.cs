namespace WebApplication5.Models
{
    public class ClienteListaGridDto
    {
        public int idCliente { get; set; }
        public int idEmpresa { get; set; }
        public string nome { get; set; } = string.Empty;
        public string? nomeFantasia { get; set; }
        public string? razaoSocial { get; set; }
        public string cpfCNPJ { get; set; } = string.Empty;
        public string? email { get; set; }
        public string? telefone { get; set; }
        public int tipoCliente_id { get; set; }
        public string? observacao { get; set; }
        public string? genero { get; set; }
        public int enderecoId { get; set; }
        public DateTime dthCadastro { get; set; }
        public DateTime? dthNascimento { get; set; }
        public bool fAtivo { get; set; }
        // Endereço (JOIN na SP)
        public int tipoEndereco { get; set; }
        public string? logradouro { get; set; }
        public string? numero { get; set; }
        public string? complemento { get; set; }
        public string? bairro { get; set; }
        public string? cidade { get; set; }
        public string? estado { get; set; }
        public string? pais { get; set; }
        public string? cep { get; set; }
    }
}