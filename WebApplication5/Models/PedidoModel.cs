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

        // Aceita tanto statusPedidoId quanto statusPedido_id vindo da SP
        public int statusPedidoId { get; set; }

        // Campo auxiliar: Dapper mapeia statusPedido_id aqui se vier com underscore
        public int statusPedido_id
        {
            set { if (statusPedidoId == 0) statusPedidoId = value; }
        }

        public string? canal { get; set; }
        public string? numeroExterno { get; set; }
        public string? status { get; set; }         // nome textual vindo da SP (ex: "PENDENTE")
        public int idUsuario { get; set; }
        public string? observacao { get; set; }
        public decimal valorTotal { get; set; }
        public decimal desconto { get; set; }
        public decimal valorFrete { get; set; }
        public DateTime dthCriacao { get; set; }
        public int idEmpresa { get; set; }
    }

    // DTO separado para o histórico de status (retornado como dynamic no repo,
    // mas tipado aqui para facilitar serialização futura se necessário)
    public class PedidoStatusHistoricoDto
    {
        public int idHistorico { get; set; }
        public int idPedido { get; set; }
        public int statusPedido_id { get; set; }
        public DateTime dthAlteracao { get; set; }
        public string? observacao { get; set; }
        public string? nomeUsuario { get; set; }
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

    public class PedidoPagamentoModel
    {
        public int IdPagamento { get; set; }
        public int IdPedido { get; set; }
        public int FormaPagamento_id { get; set; }
        public decimal Valor { get; set; }
        public DateTime DthPagamento { get; set; }
    }
}