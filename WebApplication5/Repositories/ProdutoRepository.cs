// ===== ProdutoRepository.cs =====
using Dapper;
using MySql.Data.MySqlClient;
using System.Data;
using WebApplication5.Models;

namespace WebApplication5.Repositories
{
    public class ProdutoRepository
    {
        private readonly string _connectionString;

        public ProdutoRepository(IConfiguration config)
            => _connectionString = config.GetConnectionString("Default")!;

        // ────────────────────────────────────────────
        // LISTAR — inclui campos fiscais para o badge
        // ────────────────────────────────────────────
        public IEnumerable<ProdutoListaGridDto> Listar(int idEmpresa)
        {
            using var conn = new MySqlConnection(_connectionString);
            return conn.Query<ProdutoListaGridDto>(@"
                SELECT
                    p.idProduto,
                    p.idEmpresa,
                    p.Nome           AS nome,
                    p.Descricao      AS descricao,
                    p.codProduto     AS sku,
                    p.codBarras      AS codigoBarras,
                    p.precoCusto,
                    p.precoVenda,
                    p.categoriaProduto_id AS idCategoria,
                    cp.nome          AS nomeCategoria,
                    um.sigla         AS unidade,
                    COALESCE(e.QtdeAtual, 0) AS qtdEstoque,
                    p.fAtivo,
                    p.dthCadastro,
                    /* Campos fiscais */
                    p.NCM            AS ncm,
                    p.CFOP           AS cfop,
                    p.origem,
                    p.CSOSN          AS csosn,
                    p.CST_PIS        AS cstPis,
                    p.AliqPIS        AS aliqPis,
                    p.CST_COFINS     AS cstCofins,
                    p.AliqCOFINS     AS aliqCofins
                FROM Produto p
                LEFT JOIN CategoriaProduto cp ON cp.idCategoriaProduto = p.categoriaProduto_id
                LEFT JOIN UnidadeMedida   um ON um.idUnidade           = p.uniMedida_id
                LEFT JOIN Estoque         e  ON e.produto_id           = p.idProduto
                                            AND e.idEmpresa            = p.idEmpresa
                WHERE p.idEmpresa = @idEmpresa
                ORDER BY p.Nome",
                new { idEmpresa });
        }

        // ────────────────────────────────────────────
        // FILTRAR
        // ────────────────────────────────────────────
        public IEnumerable<ProdutoListaGridDto> Filtrar(ProdutoFiltroDto filtro, int idEmpresa)
        {
            using var conn = new MySqlConnection(_connectionString);
            return conn.Query<ProdutoListaGridDto>(
                "sp_FiltrarProduto",
                new
                {
                    p_idEmpresa = idEmpresa,
                    p_nome = filtro.Nome,
                    p_sku = filtro.SKU,
                    p_codigoBarras = filtro.CodigoBarras,
                    p_idCategoria = filtro.IdCategoria,
                    p_unidade = filtro.Unidade,
                    p_fAtivo = filtro.FAtivo,
                    p_precoVendaMin = filtro.PrecoVendaMin,
                    p_precoVendaMax = filtro.PrecoVendaMax,
                    p_estoqueBaixo = filtro.EstoqueBaixo,
                    p_dthInicio = filtro.DthCadastroInicio,
                    p_dthFim = filtro.DthCadastroFim
                },
                commandType: CommandType.StoredProcedure);
        }

        // ────────────────────────────────────────────
        // INSERIR — usa sp_CriarProduto existente
        // A SP já cria o registro de Estoque zerado
        // ────────────────────────────────────────────
        public int Inserir(ProdutoModel p)
        {
            using var conn = new MySqlConnection(_connectionString);
            return conn.ExecuteScalar<int>(
                "sp_CriarProduto",
                new
                {
                    p_idEmpresa = p.IdEmpresa,
                    p_Nome = p.Nome,
                    p_Descricao = p.Descricao,
                    p_codBarras = p.CodigoBarras,
                    p_categoriaProduto_id = p.IdCategoria,
                    p_precoCusto = p.PrecoCusto,
                    p_precoVenda = p.PrecoVenda,
                    p_fAtivo = p.FAtivo ? 1 : 0
                },
                commandType: CommandType.StoredProcedure);
        }

        // ────────────────────────────────────────────
        // ATUALIZAR — usa sp_EditarProduto existente
        // ────────────────────────────────────────────
        public void Atualizar(ProdutoModel p)
        {
            using var conn = new MySqlConnection(_connectionString);
            conn.Execute(
                "sp_EditarProduto",
                new
                {
                    p_idProduto = p.IdProduto,
                    p_Nome = p.Nome,
                    p_Descricao = p.Descricao,
                    p_codProduto = p.SKU,
                    p_codBarras = p.CodigoBarras,
                    p_precoCusto = p.PrecoCusto,
                    p_precoVenda = p.PrecoVenda,
                    p_categoriaProduto_id = p.IdCategoria,
                    p_uniMedida_id = (int?)null
                },
                commandType: CommandType.StoredProcedure);
        }

        // ────────────────────────────────────────────
        // SALVAR DADOS FISCAIS — sp_SalvarFiscalProduto
        // Atualiza SOMENTE as colunas fiscais
        // Não toca em nenhum dado comercial
        // ────────────────────────────────────────────
        public void SalvarDadosFiscais(ProdutoFiscalDto dto)
        {
            using var conn = new MySqlConnection(_connectionString);
            conn.Execute(
                "sp_SalvarFiscalProduto",
                new
                {
                    p_idProduto = dto.IdProduto,
                    p_NCM = dto.NCM,
                    p_CFOP = dto.CFOP,
                    p_origem = dto.Origem,
                    p_CSOSN = dto.CSOSN,
                    p_CST_ICMS = dto.CST_ICMS,
                    p_CST_PIS = dto.CstPIS,
                    p_AliqPIS = dto.AliqPIS,
                    p_CST_COFINS = dto.CstCOFINS,
                    p_AliqCOFINS = dto.AliqCOFINS
                },
                commandType: CommandType.StoredProcedure);
        }

        // ────────────────────────────────────────────
        // ALTERAR STATUS — usa sp_AlterarStatusProduto
        // ────────────────────────────────────────────
        public void AlterarStatus(int idProduto)
        {
            using var conn = new MySqlConnection(_connectionString);
            conn.Execute(
                "sp_AlterarStatusProduto",
                new { p_idProduto = idProduto },
                commandType: CommandType.StoredProcedure);
        }
    }
}