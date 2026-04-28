using WebApplication5.Models;
using WebApplication5.Repositories;

namespace WebApplication5.Services
{
    public class LoginService
    {
        private readonly UsuarioRepository _repo;
        private readonly SenhaService _password;

        public LoginService(UsuarioRepository repo, SenhaService password)
        {
            _repo = repo;
            _password = password;
        }

        public UsuarioModel? Autenticar(string login, string senha, string cnpj)
        {
            var user = _repo.BuscarPorLogin(login, cnpj);

            if (user == null)
            {
                return null;
            }
                

            if (!_password.Verify(senha, user.Senha))
            {
                return null;
            }


            return user;
        }
    }
}