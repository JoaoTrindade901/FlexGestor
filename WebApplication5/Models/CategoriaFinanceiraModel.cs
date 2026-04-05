namespace WebApplication5.Models
{
    public class CategoriaFinanceiraModel
    {
        public int idCategoriaFinanceira { get; set; }
        public string nome { get; set; } = string.Empty;
        public string tipo { get; set; } = string.Empty; // "entrada" | "saida"
        public bool fAtivo { get; set; }
    }
}