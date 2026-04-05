namespace WebApplication5.Models
{
    public class FormaPagamentoModel
    {
        public int idFormaPagamento { get; set; }
        public string nome { get; set; } = string.Empty;
        public bool fAtivo { get; set; }
    }
}