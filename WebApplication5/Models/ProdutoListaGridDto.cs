namespace WebApplication5.Models
{
    public class ProdutoListaGridDto
    {
        public int idProduto { get; set; }
        public int idEmpresa { get; set; }
        public string nome { get; set; } = string.Empty;
        public string? descricao { get; set; }
        public string? sku { get; set; }
        public string? codigoBarras { get; set; }
        public decimal precoCusto { get; set; }
        public decimal precoVenda { get; set; }
        public int? idCategoria { get; set; }
        public string? nomeCategoria { get; set; }
        public string? unidade { get; set; }
        public int qtdEstoque { get; set; }
        public bool fAtivo { get; set; }
        public DateTime dthCadastro { get; set; }
    }
}
