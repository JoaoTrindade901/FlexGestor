namespace WebApplication5.Models
{
    public class ContaPagarModel
    {
        public int idContaPagar { get; set; }
        public int idEmpresa { get; set; }
        public int? fornecedor_id { get; set; }
        public string? nomeFornecedor { get; set; }
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

    public class CriarContaPagarDto
    {
        public int? FornecedorId { get; set; }
        public string? Descricao { get; set; }
        public decimal ValorTotal { get; set; }
        public DateTime DthVencimento { get; set; }
    }

    public class PagarContaDto
    {
        public int IdContaPagar { get; set; }
        public decimal ValorPago { get; set; }
        public int IdFormaPagamento { get; set; }
        public int IdCategoriaFinanceira { get; set; }
    }

    public class AlterarVencimentoContaPagarDto
    {
        public int IdContaPagar { get; set; }
        public DateTime NovaData { get; set; }
    }

    public class AlterarVencimentoContaReceberDto
    {
        public int IdContaReceber { get; set; }
        public DateTime NovaData { get; set; }
    }

    public class ReceberContaFinanceiroDto
    {
        public int IdContaReceber { get; set; }
        public decimal ValorPago { get; set; }
        public int IdFormaPagamento { get; set; }
        public int IdCategoriaFinanceira { get; set; }
    }

    public class EditarContaReceberDto
    {
        public int IdContaReceber { get; set; }
        public string? Descricao { get; set; }
        public decimal ValorTotal { get; set; }
        public DateTime DthVencimento { get; set; }
        public int ClienteId { get; set; }
    }

    public class EditarContaPagarDto
    {
        public int IdContaPagar { get; set; }
        public string? Descricao { get; set; }
        public decimal ValorTotal { get; set; }
        public DateTime DthVencimento { get; set; }
        public int? FornecedorId { get; set; }
    }

    public class PagamentoHistoricoDto
    {
        public int idPagamento { get; set; }
        public decimal valorPago { get; set; }
        public DateTime dthPagamento { get; set; }
        public string? observacao { get; set; }
    }
}