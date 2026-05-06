using System;

namespace WebApplication5.Models
{
    // ── JÁ EXISTIA — não alterar ──
    public class EmpresaModel
    {
        public int IdEmpresa { get; set; }
        public string nome { get; set; } = string.Empty;
        public string cnpj { get; set; } = string.Empty;
        public DateTime dthCriacao { get; set; }
        public bool fAtivo { get; set; }

        // Campos extras usados na tela de empresa
        public string? Telefone { get; set; }
        public string? Email { get; set; }
        public string? CodigoMunicipio { get; set; }
    }

    // ── NOVO: Endereço da empresa (tabela Endereco) ──
    public class EnderecoEmpresaModel
    {
        public int? IdEndereco { get; set; }
        public string Logradouro { get; set; } = "";
        public string? Numero { get; set; }
        public string? Complemento { get; set; }
        public string? Bairro { get; set; }
        public string Cidade { get; set; } = "";
        public string Estado { get; set; } = "";
        public string CEP { get; set; } = "";
    }

    // ── NOVO: DTO para salvar empresa + endereço juntos ──
    public class SalvarEmpresaDto
    {
        public string Nome { get; set; } = "";
        public string CNPJ { get; set; } = "";
        public string? Telefone { get; set; }
        public string? Email { get; set; }
        public string? CodigoMunicipio { get; set; }
        public string Logradouro { get; set; } = "";
        public string? Numero { get; set; }
        public string? Complemento { get; set; }
        public string? Bairro { get; set; }
        public string Cidade { get; set; } = "";
        public string Estado { get; set; } = "";
        public string CEP { get; set; } = "";
    }

    // ── NOVO: Configuração fiscal (tabela EmpresaConfigFiscal) ──
    public class EmpresaConfigFiscalModel
    {
        public int? IdEmpresaConfigFiscal { get; set; }
        public int IdEmpresa { get; set; }
        public string? CnpjFiscal { get; set; }
        public string? InscricaoEstadual { get; set; }
        public string? InscricaoMunicipal { get; set; }
        public int? RegimeTributario { get; set; }
        public int Ambiente { get; set; } = 2;
        public string SerieNFe { get; set; } = "1";
        public string SerieNFCe { get; set; } = "1";
        public int ProximoNumNFe { get; set; } = 1;
        public int ProximoNumNFCe { get; set; } = 1;
        public decimal AliqPadraoICMS { get; set; }
        public decimal AliqPadraoPIS { get; set; } = 0.65m;
        public decimal AliqPadraoCOFINS { get; set; } = 3.00m;
        public bool TemCertificado { get; set; }
        public DateTime? DthVencCertificado { get; set; }
        public DateTime? DthAtualizacao { get; set; }
    }

    // ── NOVO: DTO para salvar config fiscal (sem o blob do certificado) ──
    public class SalvarConfigFiscalDto
    {
        public string? CnpjFiscal { get; set; }
        public string? InscricaoEstadual { get; set; }
        public string? InscricaoMunicipal { get; set; }
        public int? RegimeTributario { get; set; }
        public int Ambiente { get; set; } = 2;
        public string SerieNFe { get; set; } = "1";
        public string SerieNFCe { get; set; } = "1";
        public int ProximoNumNFe { get; set; } = 1;
        public int ProximoNumNFCe { get; set; } = 1;
        public decimal AliqPadraoICMS { get; set; }
        public decimal AliqPadraoPIS { get; set; }
        public decimal AliqPadraoCOFINS { get; set; }
    }
}