namespace WebApplication5.Models
{
    public class PedidoModel
    {
        public int IdPedido { get; set; }
        public int IdCliente { get; set; }
        public int IdEmpresa { get; set; }
        public string? NumeroExterno { get; set; }  // numero no marketplace (ML, Shopee, etc)
        public string? Canal { get; set; }           // PROPRIO | MERCADOLIVRE | SHOPEE | OUTRO
        public string Status { get; set; } = "PENDENTE"; // PENDENTE | CONFIRMADO | ENVIADO | ENTREGUE | CANCELADO
        public string? Observacao { get; set; }
        public decimal ValorProdutos { get; set; }
        public decimal ValorFrete { get; set; }
        public decimal Desconto { get; set; }
        public decimal ValorTotal { get; set; }
        public DateTime DthCriacao { get; set; }
        public DateTime? DthEnvio { get; set; }
        public DateTime? DthEntrega { get; set; }
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
        public int idCliente { get; set; }
        public int idEmpresa { get; set; }
        public string nomeCliente { get; set; } = string.Empty;
        public string? numeroExterno { get; set; }
        public string? canal { get; set; }
        public string status { get; set; } = string.Empty;
        public string? observacao { get; set; }
        public decimal valorProdutos { get; set; }
        public decimal valorFrete { get; set; }
        public decimal desconto { get; set; }
        public decimal valorTotal { get; set; }
        public int totalItens { get; set; }
        public DateTime dthCriacao { get; set; }
        public DateTime? dthEnvio { get; set; }
        public DateTime? dthEntrega { get; set; }
    }

    public class PedidoItemGridDto
    {
        public int idPedidoItem { get; set; }
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

    public class PedidoFiltroDto
    {
        public string? NomeCliente { get; set; }
        public string? NumeroExterno { get; set; }
        public string? Canal { get; set; }
        public string? Status { get; set; }
        public DateTime? DthCriacaoInicio { get; set; }
        public DateTime? DthCriacaoFim { get; set; }
        public decimal? ValorMin { get; set; }
        public decimal? ValorMax { get; set; }
    }
}
