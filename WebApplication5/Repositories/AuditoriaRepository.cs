using Dapper;
using MySql.Data.MySqlClient;
using WebApplication5.Models;

namespace WebApplication5.Repositories
{
    public class AuditoriaRepository
    {
        private readonly string _connectionString;

        public AuditoriaRepository(IConfiguration config)
            => _connectionString = config.GetConnectionString("Default")!;

        public void Registrar(RegistrarAuditoriaDto dto)
        {
            using var conn = new MySqlConnection(_connectionString);
            conn.Execute(@"
                INSERT INTO LogAuditoria 
                    (idEmpresa, idUsuario, nomeUsuario, modulo, acao, descricao, valorAnterior, valorNovo, ipUsuario, dthAcao)
                VALUES 
                    (@idEmpresa, @idUsuario, @nomeUsuario, @modulo, @acao, @descricao, @valorAnterior, @valorNovo, @ipUsuario, NOW())",
                new
                {
                    idEmpresa = dto.IdEmpresa,
                    idUsuario = dto.IdUsuario,
                    nomeUsuario = dto.NomeUsuario,
                    modulo = dto.Modulo,
                    acao = dto.Acao,
                    descricao = dto.Descricao,
                    valorAnterior = dto.ValorAnterior,
                    valorNovo = dto.ValorNovo,
                    ipUsuario = dto.IpUsuario
                });
        }

        public IEnumerable<LogAuditoriaModel> Listar(int idEmpresa, AuditoriaFiltroDto filtro)
        {
            using var conn = new MySqlConnection(_connectionString);
            var sql = @"
                SELECT * FROM LogAuditoria
                WHERE idEmpresa = @idEmpresa
                  AND (@modulo      IS NULL OR modulo      = @modulo)
                  AND (@acao        IS NULL OR acao        = @acao)
                  AND (@nomeUsuario IS NULL OR nomeUsuario LIKE @nomeUsuarioLike)
                  AND (@dataInicio  IS NULL OR dthAcao    >= @dataInicio)
                  AND (@dataFim     IS NULL OR dthAcao    <= @dataFim)
                ORDER BY dthAcao DESC
                LIMIT 500";

            return conn.Query<LogAuditoriaModel>(sql, new
            {
                idEmpresa,
                modulo = filtro.Modulo,
                acao = filtro.Acao,
                nomeUsuario = filtro.NomeUsuario,
                nomeUsuarioLike = string.IsNullOrEmpty(filtro.NomeUsuario) ? null : $"%{filtro.NomeUsuario}%",
                dataInicio = filtro.DataInicio,
                dataFim = filtro.DataFim.HasValue ? filtro.DataFim.Value.AddDays(1) : (DateTime?)null
            });
        }

        public IEnumerable<string> ListarModulos(int idEmpresa)
        {
            using var conn = new MySqlConnection(_connectionString);
            return conn.Query<string>(
                "SELECT DISTINCT modulo FROM LogAuditoria WHERE idEmpresa = @idEmpresa ORDER BY modulo",
                new { idEmpresa });
        }
    }
}