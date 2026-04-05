// ===== CategoriaProdutoModel.cs =====
namespace WebApplication5.Models
{
    public class CategoriaProdutoModel
    {
        public int idCategoria { get; set; }
        public int idEmpresa { get; set; }
        public string nome { get; set; } = string.Empty;
        public string? descricao { get; set; }
        public int? idCategoriaPai { get; set; }
        public bool fAtivo { get; set; }
    }

    public class CategoriaProdutoListaDto
    {
        public int idCategoria { get; set; }
        public int idEmpresa { get; set; }
        public string nome { get; set; } = string.Empty;
        public string? descricao { get; set; }
        public int? idCategoriaPai { get; set; }
        public string? nomeCategoriaPai { get; set; }
        public bool fAtivo { get; set; }
    }
}