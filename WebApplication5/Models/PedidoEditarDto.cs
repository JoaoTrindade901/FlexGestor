using WebApplication5.Models;

public class PedidoEditarDto
{
    public int IdPedido { get; set; }
    public int StatusPedidoId { get; set; }
    public decimal Desconto { get; set; }
    public decimal ValorFrete { get; set; }
    public string? Observacao { get; set; }
    public List<PedidoItemModel> Itens { get; set; } = new();
}