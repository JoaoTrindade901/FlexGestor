using BCrypt.Net;

namespace WebApplication5.Services
{
    public class SenhaService
    {
        public string Hash(string senha)
        {
            return BCrypt.Net.BCrypt.HashPassword(senha);
        }

        public bool Verify(string senha, string hash)
        {
            return BCrypt.Net.BCrypt.Verify(senha, hash);
        }
    }
}