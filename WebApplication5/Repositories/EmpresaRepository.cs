using Dapper;
using MySql.Data.MySqlClient;
using System;
using System.Data;
using Microsoft.Extensions.Configuration;
using WebApplication5.Models;

namespace WebApplication5.Repositories
{
    public class EmpresaRepository
    {
        private readonly string _connectionString;

        public EmpresaRepository(IConfiguration config)
            => _connectionString = config.GetConnectionString("Default")!;

        public EmpresaModel? BuscarEmpresa(int idEmpresa)
        {
            using var conn = new MySqlConnection(_connectionString);
            return conn.QueryFirstOrDefault<EmpresaModel>(
                "sp_BuscarEmpresa",
                new { p_idEmpresa = idEmpresa },
                commandType: CommandType.StoredProcedure);
        }

        public void SalvarEmpresa(int idEmpresa, SalvarEmpresaDto dto)
        {
            using var conn = new MySqlConnection(_connectionString);
            conn.Execute(
                "sp_SalvarEmpresa",
                new
                {
                    p_idEmpresa = idEmpresa,
                    p_Nome = dto.Nome,
                    p_CNPJ = dto.CNPJ,
                    p_Telefone = dto.Telefone,
                    p_Email = dto.Email,
                    p_codigoMunicipio = dto.CodigoMunicipio
                },
                commandType: CommandType.StoredProcedure);
        }

        public EnderecoEmpresaModel? BuscarEndereco(int idEmpresa)
        {
            using var conn = new MySqlConnection(_connectionString);
            return conn.QueryFirstOrDefault<EnderecoEmpresaModel>(
                "sp_BuscarEnderecoEmpresa",
                new { p_idEmpresa = idEmpresa },
                commandType: CommandType.StoredProcedure);
        }

        public void SalvarEndereco(int idEmpresa, SalvarEmpresaDto dto)
        {
            using var conn = new MySqlConnection(_connectionString);
            conn.Execute(
                "sp_SalvarEnderecoEmpresa",
                new
                {
                    p_idEmpresa = idEmpresa,
                    p_Logradouro = dto.Logradouro,
                    p_Numero = dto.Numero,
                    p_Complemento = dto.Complemento,
                    p_Bairro = dto.Bairro,
                    p_Cidade = dto.Cidade,
                    p_Estado = dto.Estado,
                    p_CEP = dto.CEP
                },
                commandType: CommandType.StoredProcedure);
        }

        public EmpresaConfigFiscalModel? BuscarConfigFiscal(int idEmpresa)
        {
            using var conn = new MySqlConnection(_connectionString);
            return conn.QueryFirstOrDefault<EmpresaConfigFiscalModel>(
                "sp_BuscarConfigFiscal",
                new { p_idEmpresa = idEmpresa },
                commandType: CommandType.StoredProcedure);
        }

        public void SalvarConfigFiscal(int idEmpresa, SalvarConfigFiscalDto dto)
        {
            using var conn = new MySqlConnection(_connectionString);
            conn.Execute(
                "sp_SalvarConfigFiscal",
                new
                {
                    p_idEmpresa = idEmpresa,
                    p_cnpjFiscal = dto.CnpjFiscal,
                    p_inscricaoEstadual = dto.InscricaoEstadual,
                    p_inscricaoMunicipal = dto.InscricaoMunicipal,
                    p_regimeTributario = dto.RegimeTributario,
                    p_ambiente = dto.Ambiente,
                    p_serieNFe = dto.SerieNFe,
                    p_serieNFCe = dto.SerieNFCe,
                    p_proximoNumNFe = dto.ProximoNumNFe,
                    p_proximoNumNFCe = dto.ProximoNumNFCe,
                    p_aliqPadraoICMS = dto.AliqPadraoICMS,
                    p_aliqPadraoPIS = dto.AliqPadraoPIS,
                    p_aliqPadraoCOFINS = dto.AliqPadraoCOFINS
                },
                commandType: CommandType.StoredProcedure);
        }

        public void SalvarCertificado(int idEmpresa, byte[] certificadoBytes,
            string senha, DateTime? dthVencimento)
        {
            using var conn = new MySqlConnection(_connectionString);
            conn.Execute(
                "sp_SalvarCertificadoA1",
                new
                {
                    p_idEmpresa = idEmpresa,
                    p_certificadoA1 = certificadoBytes,
                    p_senhaCertificado = senha,
                    p_dthVencimento = dthVencimento
                },
                commandType: CommandType.StoredProcedure);
        }
    }
}