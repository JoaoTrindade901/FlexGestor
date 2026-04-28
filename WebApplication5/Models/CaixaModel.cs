namespace WebApplication5.Models
{
    public class CaixaModel
    {
        public int idCaixa { get; set; }
        public int idEmpresa { get; set; }
        public int idUsuarioAbertura { get; set; }
        public int? idUsuarioFechamento { get; set; }
        public DateTime dthAbertura { get; set; }
        public DateTime? dthFechamento { get; set; }
        public decimal saldoInicial { get; set; }
        public decimal? saldoFinal { get; set; }
        public decimal saldoDinheiro { get; set; }
        public decimal? saldoFinalContado { get; set; }
        public decimal? diferenca { get; set; }
        public string? obsEncerramento { get; set; }
        public string? nomeOperador { get; set; }
        public bool fAtivo { get; set; }
    }

    public class LancamentoCaixaModel
    {
        public int idLancamento { get; set; }
        public int idCaixa { get; set; }
        public int idEmpresa { get; set; }
        public int idUsuario { get; set; }
        public int idFormaPagamento { get; set; }
        public string? nomeFormaPagamento { get; set; }
        public int idCategoriaFinanceira { get; set; }
        public string? nomeCategoria { get; set; }
        public int tipoCategoria { get; set; } // 1 = entrada, 2 = saída

        public int tipoCategoria { get; set; }
        public decimal valor { get; set; }
        public DateTime dthLancamento { get; set; }
        public string? descricao { get; set; }
        public string? referencia { get; set; }
        public string tipoLancamento { get; set; } = "MANUAL";
        public int? pedido_id { get; set; }
        public int? cliente_id { get; set; }
        public string? nomeCliente { get; set; }
        public int? contaReceber_id { get; set; }
    }

    public class BreakdownFormaPagamentoDto
    {
        public int idFormaPagamento { get; set; }
        public string nomeFormaPagamento { get; set; } = string.Empty;
        public decimal totalEntradas { get; set; }
        public decimal totalSaidas { get; set; }
        public decimal saldoLiquido { get; set; }
    }

    public class ContaReceberModel
    {
        public int idContaReceber { get; set; }
        public int idEmpresa { get; set; }
        public int cliente_id { get; set; }
        public string? nomeCliente { get; set; }
        public string? cpfCNPJ { get; set; }
        public int? pedido_id { get; set; }
        public int? lancamento_id { get; set; }
        public string? descricao { get; set; }
        public decimal valorTotal { get; set; }
        public decimal valorPago { get; set; }
        public decimal valorRestante => valorTotal - valorPago;
        public DateTime dthVencimento { get; set; }
        public DateTime? dthPagamento { get; set; }
        public DateTime dthCriacao { get; set; }
        public string status { get; set; } = "ABERTO";
        public string? statusAtual { get; set; }
    }

    public class AbrirCaixaDto
    {
        public decimal SaldoInicial { get; set; }
    }

    public class FecharCaixaDto
    {
        public decimal SaldoFinalContado { get; set; }
        public string? Obs { get; set; }
    }

    public class LancarCaixaDto
    {
        public int IdFormaPagamento { get; set; }
        public int IdCategoriaFinanceira { get; set; }
        public decimal Valor { get; set; }
        public string? Descricao { get; set; }
        public string? Referencia { get; set; }
        public string TipoLancamento { get; set; } = "MANUAL";
        public int? PedidoId { get; set; }
        public int? ClienteId { get; set; }
        public int? ContaReceberId { get; set; }
    }

    public class VendaRapidaDto
    {
        public int IdFormaPagamento { get; set; }
        public decimal Valor { get; set; }
        public string? Descricao { get; set; }
        public int? ClienteId { get; set; }
        public int? PedidoId { get; set; }
        public bool Fiado { get; set; } = false;
        public DateTime? DthVencimentoFiado { get; set; }
        public List<ItemVendaRapidaDto> Itens { get; set; } = new();
    }

    public class ItemVendaRapidaDto
    {
        public int IdProduto { get; set; }
        public int Quantidade { get; set; }
        public decimal ValorUnitario { get; set; }
    }

    public class CriarContaReceberDto
    {
        public int ClienteId { get; set; }
        public int? PedidoId { get; set; }
        public string? Descricao { get; set; }
        public decimal ValorTotal { get; set; }
        public DateTime DthVencimento { get; set; }
    }

    public class ReceberContaDto
    {
        public int IdContaReceber { get; set; }
        public decimal ValorPago { get; set; }
        public int IdFormaPagamento { get; set; }
        public int IdCategoriaFinanceira { get; set; }
    }

    public class AlterarVencimentoDto
    {
        public int IdContaReceber { get; set; }
        public DateTime NovaData { get; set; }
    }
}