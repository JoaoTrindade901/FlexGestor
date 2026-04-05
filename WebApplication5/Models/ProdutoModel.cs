namespace WebApplication5.Models
{
    public class ProdutoModel
    {
        public int IdProduto { get; set; }
        public int IdEmpresa { get; set; }
        public string Nome { get; set; } = string.Empty;
        public string? Descricao { get; set; }
        public string? SKU { get; set; }
        public string? CodigoBarras { get; set; }
        public decimal PrecoCusto { get; set; }
        public decimal PrecoVenda { get; set; }
        public int? IdCategoria { get; set; }
        public string? Unidade { get; set; }
        public bool FAtivo { get; set; }
        public DateTime DthCadastro { get; set; }
    }
}
