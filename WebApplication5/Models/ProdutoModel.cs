// ===== ProdutoModel.cs =====
// Contém apenas ProdutoModel e ProdutoFiscalDto
// ProdutoListaGridDto e ProdutoFiltroDto estão em seus próprios arquivos — não duplicar
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

    // DTO exclusivo para salvar apenas os dados fiscais (endpoint /Produto/SalvarFiscal)
    public class ProdutoFiscalDto
    {
        public int IdProduto { get; set; }
        public string NCM { get; set; } = string.Empty;
        public string CFOP { get; set; } = string.Empty;
        public byte Origem { get; set; } = 0;
        public string? CSOSN { get; set; }
        public string? CST_ICMS { get; set; }
        public string CstPIS { get; set; } = "07";
        public decimal AliqPIS { get; set; } = 0.65m;
        public string CstCOFINS { get; set; } = "07";
        public decimal AliqCOFINS { get; set; } = 3.00m;
    }
}