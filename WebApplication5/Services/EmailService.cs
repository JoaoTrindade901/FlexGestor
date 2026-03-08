using Azure;
using SendGrid;
using SendGrid.Helpers.Mail;

public class EmailService
{
    private readonly string _apiKey;
    private readonly string _baseUrl;

    public EmailService(IConfiguration config)
    {
        _apiKey = config["SendGrid:ApiKey"];
        _baseUrl = config["App:BaseUrl"];
    }

    public async Task EnviarResetSenha(string emailDestino, string nomeUsuario, string token)
    {
        var client = new SendGridClient(_apiKey);
        var link = $"{_baseUrl}/Login/RedefinirSenha?token={token}";
        var from = new EmailAddress("decaozao@gmail.com", "teste");
        var to = new EmailAddress(emailDestino, nomeUsuario);
        var subject = "Redefinição de senha — FlexGestor";
        var html = $@"
            <div style='font-family:sans-serif;max-width:480px;margin:auto'>
                <h2>Redefinição de senha</h2>
                <p>Olá, <strong>{nomeUsuario}</strong>!</p>
                <p>Clique no botão abaixo para redefinir sua senha. O link expira em <strong>1 hora</strong>.</p>
                <a href='{link}' style='display:inline-block;margin:20px 0;padding:12px 24px;
                    background:#4f8eff;color:white;border-radius:8px;text-decoration:none;font-weight:600'>
                    Redefinir senha
                </a>
                <p style='color:#999;font-size:12px'>Se você não solicitou isso, ignore este email.</p>
            </div>";

        var msg = MailHelper.CreateSingleEmail(from, to, subject, "", html);
        //linha pra ver o retorno se deu boa ou nao pode ser removida depois
        var response = await client.SendEmailAsync(msg);
        Console.WriteLine($"Status: {response.StatusCode}");
    }
}