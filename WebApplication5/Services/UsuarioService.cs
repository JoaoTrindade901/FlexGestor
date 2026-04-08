using MySql.Data.MySqlClient;
using WebApplication5.Exceptions;
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

        public IEnumerable<UsuarioModel> Listar(int idEmpresa)
        {
            return _repo.Listar(idEmpresa);
        }

        public void Criar(UsuarioModel usuario)
        {
            try
            {
                usuario.Senha = _password.Hash(usuario.Senha);
                usuario.dthCriacao = DateTime.Now;
                usuario.fAtivo = true;

                _repo.Inserir(usuario);
            }
            catch (MySqlException ex) when (ex.Number == 1062)
            {
                throw new RegraNegocioException("CPF já cadastrado.");
            }
        }

        public void Editar(UsuarioModel usuario)
        {
            try
            {
                if (!string.IsNullOrEmpty(usuario.Senha))
                    usuario.Senha = _password.Hash(usuario.Senha);

                _repo.Atualizar(usuario);
            }
            catch (MySqlException ex) when (ex.Number == 1062)
            {
                throw new RegraNegocioException("CPF já cadastrado.");
            }
        }

        public void AlterarStatus(int idUsuario)
        {
            _repo.AlterarStatus(idUsuario);
        }
    }
}