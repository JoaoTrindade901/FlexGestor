namespace WebApplication5.Models
{
    public class CategoriaFinanceiraModel
    {
        public int idCategoriaFinanceira { get; set; }
        public string nome { get; set; } = string.Empty;
        public int Tipo { get; set; }    // 1=entrada, 2=saida
        public int SubTipo { get; set; } // 0=geral, 1=sangria, 2=despesa
        public bool fAtivo { get; set; }
    }
}