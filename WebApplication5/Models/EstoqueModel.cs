namespace WebApplication5.Models
{
    public class EstoqueModel
    {
        public int IdEstoque { get; set; }
        public int IdProduto { get; set; }
        public int IdEmpresa { get; set; }
        public int Quantidade { get; set; }
        public int EstoqueMinimo { get; set; }
        public int EstoqueMaximo { get; set; }
        public string? Local { get; set; }
        public DateTime DthUltimaAtualizacao { get; set; }
    }

    public class MovimentacaoEstoqueModel
    {
        public int IdMovimentacao { get; set; }
        public int IdProduto { get; set; }
        public int IdEmpresa { get; set; }
        public string TipoMovimentacao { get; set; } = string.Empty;
        public int Quantidade { get; set; }
        public string? Motivo { get; set; }
        public int IdUsuario { get; set; }
        public DateTime DthMovimentacao { get; set; }
        public string? NomeProduto { get; set; }
        public string? NomeUsuario { get; set; }
    }


    public class MovimentacaoFiltroDto
    {
        public int? IdProduto { get; set; }
        public string? TipoMovimentacao { get; set; }
        public DateTime? DthInicio { get; set; }
        public DateTime? DthFim { get; set; }
    }
}