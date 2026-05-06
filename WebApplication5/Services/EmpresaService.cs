using System;
using System.IO;
using System.Security.Cryptography.X509Certificates;
using Microsoft.AspNetCore.Http;
using WebApplication5.Models;
using WebApplication5.Repositories;

namespace WebApplication5.Services
{
    public class EmpresaService
    {
        private readonly EmpresaRepository _repo;

        public EmpresaService(EmpresaRepository repo)
            => _repo = repo;

        public (EmpresaModel? empresa, EnderecoEmpresaModel? endereco) BuscarDados(int idEmpresa)
        {
            var empresa = _repo.BuscarEmpresa(idEmpresa);
            var endereco = _repo.BuscarEndereco(idEmpresa);
            return (empresa, endereco);
        }

        public void SalvarDados(int idEmpresa, SalvarEmpresaDto dto)
        {
            _repo.SalvarEmpresa(idEmpresa, dto);
            _repo.SalvarEndereco(idEmpresa, dto);
        }

        public EmpresaConfigFiscalModel? BuscarConfigFiscal(int idEmpresa)
            => _repo.BuscarConfigFiscal(idEmpresa);

        public void SalvarConfigFiscal(int idEmpresa, SalvarConfigFiscalDto dto)
            => _repo.SalvarConfigFiscal(idEmpresa, dto);

        public void SalvarCertificado(int idEmpresa, IFormFile arquivo, string senha)
        {
            if (arquivo == null || arquivo.Length == 0)
                throw new InvalidOperationException("Arquivo invalido.");

            if (!arquivo.FileName.EndsWith(".pfx", StringComparison.OrdinalIgnoreCase) &&
                !arquivo.FileName.EndsWith(".p12", StringComparison.OrdinalIgnoreCase))
                throw new InvalidOperationException("O arquivo deve ser um certificado .pfx ou .p12.");

            if (arquivo.Length > 5 * 1024 * 1024)
                throw new InvalidOperationException("O certificado nao pode ultrapassar 5 MB.");

            using var ms = new MemoryStream();
            arquivo.CopyTo(ms);
            var bytes = ms.ToArray();

            try
            {
                var cert = new X509Certificate2(
                    bytes, senha,
                    X509KeyStorageFlags.EphemeralKeySet);

                _repo.SalvarCertificado(idEmpresa, bytes, senha, cert.NotAfter);
            }
            catch (System.Security.Cryptography.CryptographicException)
            {
                throw new InvalidOperationException("Senha do certificado incorreta ou arquivo corrompido.");
            }
        }
    }
}