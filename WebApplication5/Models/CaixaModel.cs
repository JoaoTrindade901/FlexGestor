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
        public bool fAtivo { get; set; } // true = aberto
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

        public decimal valor { get; set; }
        public DateTime dthLancamento { get; set; }

        public string? descricao { get; set; }
        public string? referencia { get; set; }
    }
    public class AbrirCaixaDto
    {
        public decimal SaldoInicial { get; set; }
    }

    public class FecharCaixaDto
    {
        public int IdCaixa { get; set; }
        public decimal SaldoFinal { get; set; }
    }

    public class LancarCaixaDto
    {
        public int IdFormaPagamento { get; set; }
        public int IdCategoriaFinanceira { get; set; }
        public decimal Valor { get; set; }
        public string? Descricao { get; set; }
        public string? Referencia { get; set; }

        public int? ReferenciaId { get; set; }
        public string? ReferenciaTipo { get; set; }
    }
}