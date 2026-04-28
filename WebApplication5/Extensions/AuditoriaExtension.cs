using Microsoft.AspNetCore.Mvc;
using WebApplication5.Models;
using WebApplication5.Services;

namespace WebApplication5.Extensions
{
    public static class AuditoriaExtension
    {
        public static void Auditar(this Controller controller,
            AuditoriaService auditoriaService,
            string modulo,
            string acao,
            string? descricao = null,
            string? valorAnterior = null,
            string? valorNovo = null)
        {
            var idEmpresa = controller.HttpContext.Session.GetInt32("IdEmpresa") ?? 0;
            var idUsuario = controller.HttpContext.Session.GetInt32("idUsuario");
            var nomeUsuario = controller.HttpContext.Session.GetString("nomeUsuario");
            var ip = controller.HttpContext.Connection.RemoteIpAddress?.ToString();

            auditoriaService.Registrar(new RegistrarAuditoriaDto
            {
                IdEmpresa = idEmpresa,
                IdUsuario = idUsuario,
                NomeUsuario = nomeUsuario,
                Modulo = modulo,
                Acao = acao,
                Descricao = descricao,
                ValorAnterior = valorAnterior,
                ValorNovo = valorNovo,
                IpUsuario = ip
            });
        }
    }
}