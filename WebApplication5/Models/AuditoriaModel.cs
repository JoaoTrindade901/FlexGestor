namespace WebApplication5.Models
{
    public class LogAuditoriaModel
    {
        public int idLog { get; set; }
        public int idEmpresa { get; set; }
        public int? idUsuario { get; set; }
        public string? nomeUsuario { get; set; }
        public string modulo { get; set; } = string.Empty;
        public string acao { get; set; } = string.Empty;
        public string? descricao { get; set; }
        public string? valorAnterior { get; set; }
        public string? valorNovo { get; set; }
        public string? ipUsuario { get; set; }
        public DateTime dthAcao { get; set; }
    }

    public class AuditoriaFiltroDto
    {
        public string? Modulo { get; set; }
        public string? Acao { get; set; }
        public string? NomeUsuario { get; set; }
        public DateTime? DataInicio { get; set; }
        public DateTime? DataFim { get; set; }
    }

    public class RegistrarAuditoriaDto
    {
        public int IdEmpresa { get; set; }
        public int? IdUsuario { get; set; }
        public string? NomeUsuario { get; set; }
        public string Modulo { get; set; } = string.Empty;
        public string Acao { get; set; } = string.Empty;
        public string? Descricao { get; set; }
        public string? ValorAnterior { get; set; }
        public string? ValorNovo { get; set; }
        public string? IpUsuario { get; set; }
    }
}