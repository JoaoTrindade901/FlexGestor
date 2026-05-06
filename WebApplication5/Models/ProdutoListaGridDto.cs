// ===== ProdutoListaGridDto.cs =====
// Substitui o arquivo existente — adiciona campos fiscais no final
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

        // ── Campos fiscais — preenchidos pelo sp_ListarProduto atualizado ──
        // Usados para exibir o badge "Configurado / Pendente" na tabela
        // e para pré-preencher o modal de dados fiscais
        public string? ncm { get; set; }
        public string? cfop { get; set; }
        public byte origem { get; set; }
        public string? csosn { get; set; }
        public string? cstPis { get; set; }
        public decimal aliqPis { get; set; }
        public string? cstCofins { get; set; }
        public decimal aliqCofins { get; set; }
    }
}