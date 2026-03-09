using WebApplication5.Models;
using WebApplication5.Repositories;

namespace WebApplication5.Services
{
    public class UsuarioService
    {
        private readonly UsuarioRepository _repo;
        private readonly SenhaService _password;

        public UsuarioService(UsuarioRepository repo, SenhaService password)
        {
            _repo = repo;
            _password = password;
        }

        public IEnumerable<UsuarioListaGridDto> Listar()
        {
            return _repo.Listar();
        }

        public void Criar(UsuarioModel usuario)
        {
            usuario.Senha = _password.Hash(usuario.Senha);
            usuario.dthCriacao = DateTime.Now;
            usuario.fAtivo = true;

            _repo.Inserir(usuario); 
        }

        public void Editar(UsuarioModel usuario)
        {
            usuario.Senha = _password.Hash(usuario.Senha);
            _repo.Atualizar(usuario);
        }
    }
}