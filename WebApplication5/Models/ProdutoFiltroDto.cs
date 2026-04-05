namespace WebApplication5.Models
{
    public class ProdutoFiltroDto
    {
        public string? Nome { get; set; }
        public string? SKU { get; set; }
        public string? CodigoBarras { get; set; }
        public int? IdCategoria { get; set; }
        public string? Unidade { get; set; }
        public bool? FAtivo { get; set; }
        public decimal? PrecoVendaMin { get; set; }
        public decimal? PrecoVendaMax { get; set; }
        public bool? EstoqueBaixo { get; set; }
        public DateTime? DthCadastroInicio { get; set; }
        public DateTime? DthCadastroFim { get; set; }
    }
}
