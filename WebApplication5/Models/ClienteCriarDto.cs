namespace WebApplication5.Models
{
    // DTO recebido pelo controller ao criar/editar cliente
    // agrupa cliente + endereço em uma única requisição
    public class ClienteCriarDto
    {
        public ClienteModel Cliente { get; set; } = new();
        public EnderecoModel Endereco { get; set; } = new();
    }
}