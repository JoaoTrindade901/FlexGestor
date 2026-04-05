public class EstoqueListaGridDto
{
    public int idEstoque { get; set; }
    public int idProduto { get; set; }
    public string nomeProduto { get; set; } = string.Empty;
    public string? skuProduto { get; set; }
    public string? nomeCategoria { get; set; }
    public int quantidade { get; set; }
    public int estoqueMinimo { get; set; }
    public bool estoqueCritico { get; set; }
    public DateTime dthUltimaAtualizacao { get; set; }
}