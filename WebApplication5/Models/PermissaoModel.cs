// Models/PermissaoModel.cs
namespace WebApplication5.Models
{
    public class MenuModel
    {
        public int idMenu { get; set; }
        public string nome { get; set; } = string.Empty;
        public string rota { get; set; } = string.Empty;
        public string? menuPai { get; set; }
        public int ordem { get; set; }
        public bool temAcesso { get; set; }
    }

    public class CampoClienteModel
    {
        public int idCampo { get; set; }
        public string nome { get; set; } = string.Empty;
        public string chave { get; set; } = string.Empty;
        public string secao { get; set; } = string.Empty;
        public int ordem { get; set; }
        public bool visivel { get; set; } = true;
        public bool editavel { get; set; } = true;
    }

    public class PermissaoMenuDto
    {
        public int IdCargo { get; set; }
        public int IdMenu { get; set; }
        public bool FAtivo { get; set; }
    }

    public class PermissaoCampoDto
    {
        public int IdCargo { get; set; }
        public int IdCampo { get; set; }
        public bool Visivel { get; set; }
        public bool Editavel { get; set; }
    }

    public class SalvarPermissoesDto
    {
        public int IdCargo { get; set; }
        public List<PermissaoMenuDto> Menus { get; set; } = new();
        public List<PermissaoCampoDto> Campos { get; set; } = new();
    }
}