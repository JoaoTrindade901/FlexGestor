using WebApplication5.Repositories;
using WebApplication5.Services;

public class SenhaResetService
{
    private readonly UsuarioRepository _usuarioRepo;
    private readonly TokenResetRepository _tokenRepo;
    private readonly EmailService _emailService;
    private readonly SenhaService _senhaService;

    public SenhaResetService(UsuarioRepository usuarioRepo, TokenResetRepository tokenRepo,
        EmailService emailService, SenhaService senhaService)
    {
        _usuarioRepo = usuarioRepo;
        _tokenRepo = tokenRepo;
        _emailService = emailService;
        _senhaService = senhaService;
    }

    public async Task SolicitarReset(string email)
    {
        var usuario = _usuarioRepo.BuscarPorEmail(email);
        if (usuario == null) return; // não revela se email existe

        var token = Guid.NewGuid().ToString("N") + Guid.NewGuid().ToString("N");
        _tokenRepo.Inserir(usuario.IdUsuario, token, DateTime.Now.AddHours(1));

        try
        {
            await _emailService.EnviarResetSenha(usuario.Email!, usuario.Nome, token);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Erro ao enviar email: {ex.Message}");
            throw;
        }
    }

    public bool RedefinirSenha(string token, string novaSenha)
    {
        var registro = _tokenRepo.Buscar(token);
        if (registro == null) return false;

        var hash = _senhaService.Hash(novaSenha);
        _tokenRepo.AtualizarSenha(registro.idUsuario, hash);
        _tokenRepo.Invalidar(token);
        return true;
    }
}