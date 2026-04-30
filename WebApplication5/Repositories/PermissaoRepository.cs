// Repositories/PermissaoRepository.cs
using Dapper;
using MySql.Data.MySqlClient;
using WebApplication5.Models;

namespace WebApplication5.Repositories
{
    public class PermissaoRepository
    {
        private readonly string _connectionString;

        public PermissaoRepository(IConfiguration config)
            => _connectionString = config.GetConnectionString("Default")!;

        public IEnumerable<MenuModel> ListarMenus(int idEmpresa, int idCargo)
        {
            using var conn = new MySqlConnection(_connectionString);
            return conn.Query<MenuModel>(@"
                SELECT
                    m.idMenu, m.nome, m.rota, m.menuPai, m.ordem,
                    CASE
                        WHEN pm.idPermissaoMenu IS NOT NULL AND pm.fAtivo = 1 THEN 1
                        ELSE 0
                    END as temAcesso
                FROM Menu m
                LEFT JOIN PermissaoMenu pm
                    ON pm.idMenu = m.idMenu
                    AND pm.idCargo = @idCargo
                    AND pm.idEmpresa = @idEmpresa
                ORDER BY m.ordem",
                new { idEmpresa, idCargo });
        }

        public IEnumerable<CampoClienteModel> ListarCampos(int idEmpresa, int idCargo)
        {
            using var conn = new MySqlConnection(_connectionString);
            return conn.Query<CampoClienteModel>(@"
                SELECT
                    c.idCampo, c.nome, c.chave, c.secao, c.ordem,
                    COALESCE(pc.visivel, 1) as visivel,
                    COALESCE(pc.editavel, 1) as editavel
                FROM CampoCliente c
                LEFT JOIN PermissaoCampo pc
                    ON pc.idCampo = c.idCampo
                    AND pc.idCargo = @idCargo
                    AND pc.idEmpresa = @idEmpresa
                ORDER BY c.ordem",
                new { idEmpresa, idCargo });
        }

        public void SalvarPermissaoMenu(int idEmpresa, int idCargo, int idMenu, bool fAtivo)
        {
            using var conn = new MySqlConnection(_connectionString);
            conn.Execute(@"
                INSERT INTO PermissaoMenu (idEmpresa, idCargo, idMenu, fAtivo)
                VALUES (@idEmpresa, @idCargo, @idMenu, @fAtivo)
                ON DUPLICATE KEY UPDATE fAtivo = @fAtivo",
                new { idEmpresa, idCargo, idMenu, fAtivo });
        }

        public void SalvarPermissaoCampo(int idEmpresa, int idCargo, int idCampo, bool visivel, bool editavel)
        {
            using var conn = new MySqlConnection(_connectionString);
            conn.Execute(@"
                INSERT INTO PermissaoCampo (idEmpresa, idCargo, idCampo, visivel, editavel)
                VALUES (@idEmpresa, @idCargo, @idCampo, @visivel, @editavel)
                ON DUPLICATE KEY UPDATE visivel = @visivel, editavel = @editavel",
                new { idEmpresa, idCargo, idCampo, visivel, editavel });
        }

        public IEnumerable<string> ListarRotasPermitidas(int idEmpresa, int idCargo)
        {
            using var conn = new MySqlConnection(_connectionString);
            return conn.Query<string>(@"
                SELECT m.rota FROM Menu m
                INNER JOIN PermissaoMenu pm
                    ON pm.idMenu = m.idMenu
                WHERE pm.idEmpresa = @idEmpresa
                    AND pm.idCargo = @idCargo
                    AND pm.fAtivo = 1",
                new { idEmpresa, idCargo });
        }
    }
}