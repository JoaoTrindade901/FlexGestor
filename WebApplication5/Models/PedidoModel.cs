namespace WebApplication5.Models
{
    public class PedidoModel
    {
        public int IdPedido { get; set; }
        public int NumeroPedido { get; set; }
        public int IdCliente { get; set; }
        public int IdUsuario { get; set; }
        public int IdEmpresa { get; set; }
        public int EnderecoId { get; set; }
        public int StatusPedidoId { get; set; } 
        public string? Canal { get; set; } = "PROPRIO";
        public string? NumeroExterno { get; set; }
        public string? Observacao { get; set; }
        public decimal ValorTotal { get; set; }
        public decimal ValorFrete { get; set; }
        public decimal Desconto { get; set; }
        public DateTime DthCriacao { get; set; }
    }

    public class PedidoItemModel
    {
        public int IdPedidoItem { get; set; }
        public int IdPedido { get; set; }
        public int IdProduto { get; set; }
        public int Quantidade { get; set; }
        public decimal ValorUnitario { get; set; }
        public decimal Desconto { get; set; }
        public decimal ValorTotal { get; set; }
    }

    public class PedidoListaGridDto
    {
        public int idPedido { get; set; }
        public int numeroPedido { get; set; }
        public int idCliente { get; set; }
        public string nomeCliente { get; set; } = string.Empty;
        public int statusPedidoId { get; set; }
        public string? canal { get; set; }
        public string? numeroExterno { get; set; }
        public string? status { get; set; }
        public int idUsuario { get; set; }
        public string? observacao { get; set; }
        public decimal valorTotal { get; set; }
        public decimal desconto { get; set; }
        public decimal valorFrete { get; set; }
        public DateTime dthCriacao { get; set; }
        public int idEmpresa { get; set; }
    }

    public class PedidoItemGridDto
    {
        public int idPedidoItem { get; set; }
        public int idPedido { get; set; }
        public int idProduto { get; set; }
        public string nomeProduto { get; set; } = string.Empty;
        public string? skuProduto { get; set; }
        public int quantidade { get; set; }
        public decimal valorUnitario { get; set; }
        public decimal desconto { get; set; }
        public decimal valorTotal { get; set; }
    }

    public class PedidoCriarDto
    {
        public PedidoModel Pedido { get; set; } = new();
        public List<PedidoItemModel> Itens { get; set; } = new();
    }

    public class AtualizarStatusPedidoDto
    {
        public int IdPedido { get; set; }
        public int StatusPedidoId { get; set; }
    }
}