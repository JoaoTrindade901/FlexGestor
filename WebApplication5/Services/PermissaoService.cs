// Services/PermissaoService.cs
using WebApplication5.Models;
using WebApplication5.Repositories;

namespace WebApplication5.Services
{
    public class PermissaoService
    {
        private readonly PermissaoRepository _repo;

        public PermissaoService(PermissaoRepository repo) => _repo = repo;

        public IEnumerable<MenuModel> ListarMenus(int idEmpresa, int idCargo)
            => _repo.ListarMenus(idEmpresa, idCargo);

        public IEnumerable<CampoClienteModel> ListarCampos(int idEmpresa, int idCargo)
            => _repo.ListarCampos(idEmpresa, idCargo);

        public void SalvarPermissoes(int idEmpresa, SalvarPermissoesDto dto)
        {
            foreach (var m in dto.Menus)
                _repo.SalvarPermissaoMenu(idEmpresa, dto.IdCargo, m.IdMenu, m.FAtivo);

            foreach (var c in dto.Campos)
                _repo.SalvarPermissaoCampo(idEmpresa, dto.IdCargo, c.IdCampo, c.Visivel, c.Editavel);
        }

        public IEnumerable<string> ListarRotasPermitidas(int idEmpresa, int idCargo)
            => _repo.ListarRotasPermitidas(idEmpresa, idCargo);

        public IEnumerable<CampoClienteModel> ListarCamposDoUsuario(int idEmpresa, int idCargo)
            => _repo.ListarCampos(idEmpresa, idCargo);
    }
}