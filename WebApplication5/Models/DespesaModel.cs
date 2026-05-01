namespace WebApplication5.Models
{
    public class DespesaModel
    {
        public int idCategoriaFinanceira { get; set; }
        public string nome { get; set; } = string.Empty;
        public bool fAtivo { get; set; }
    }

    public class SalvarDespesaDto
    {
        public int Id { get; set; }
        public string Nome { get; set; } = string.Empty;
    }

    public class AlterarStatusDespesaDto
    {
        public int Id { get; set; }
        public bool Ativo { get; set; }
    }
}