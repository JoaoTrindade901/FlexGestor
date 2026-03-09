namespace WebApplication5.Models
{
    public class EmpresaModel
    {
        public int IdEmpresa { get; set; }
        public string nome { get; set; } = string.Empty;
        public string cnpj { get; set; } = string.Empty;
        public DateTime dthCriacao { get; set; }
        public bool fAtivo { get; set; }
    }
}