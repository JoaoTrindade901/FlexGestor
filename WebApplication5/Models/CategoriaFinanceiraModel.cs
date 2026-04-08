namespace WebApplication5.Models
{
    public class CategoriaFinanceiraModel
    {
        public int idCategoriaFinanceira { get; set; }
        public string nome { get; set; } = string.Empty;
        public int Tipo { get; set; } // 1=entrada, 2=saida
        public bool fAtivo { get; set; }
    }
}