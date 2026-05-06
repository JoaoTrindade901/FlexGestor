using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using WebApplication5.Services;

public class PermissaoFilter : IActionFilter
{
    private readonly PermissaoService _permissao;

    // Rotas que qualquer um acessa (sem verificar permissão)
    private static readonly HashSet<string> RotasPublicas = new(StringComparer.OrdinalIgnoreCase)
    {
        "Login", "Home"
    };

    public PermissaoFilter(PermissaoService permissao)
    {
        _permissao = permissao;
    }

    public void OnActionExecuting(ActionExecutingContext context)
    {
        var controller = context.RouteData.Values["controller"]?.ToString();
        var action = context.RouteData.Values["action"]?.ToString();
        var session = context.HttpContext.Session;

        // Não logado — deixa o BaseController redirecionar
        var idUsuario = session.GetInt32("idUsuario");
        if (idUsuario == null) return;

        // Admin vê tudo
        var cargo = session.GetInt32("cargo_id") ?? 0;
        if (cargo == 1) return;

        // Rota pública
        if (RotasPublicas.Contains(controller ?? "")) return;

        // Endpoints de API internos (chamados pelo próprio JS) — não bloquear
        if (action != "Index" && action != null) return;

        // Verifica permissão
        var idEmpresa = session.GetInt32("IdEmpresa") ?? 0;
        var rotasPermitidas = _permissao.ListarRotasPermitidas(idEmpresa, cargo);

        bool temAcesso = rotasPermitidas.Any(r =>
            r.Equals(controller, StringComparison.OrdinalIgnoreCase));

        if (!temAcesso)
        {
            context.Result = new RedirectToActionResult("Index", "Home", null);
        }
    }

    public void OnActionExecuted(ActionExecutedContext context) { }
}