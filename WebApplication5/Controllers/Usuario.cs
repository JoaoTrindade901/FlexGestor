using static System.Formats.Asn1.AsnWriter;

namespace WebApplication5.Controllers
{
    public class Usuario
    {
        //Pesquisa Usuário
        public Usuario BuscaUsuarios()
        {
            return null;

        }

        //Cria Usuário 
        public Usuario CriarUsuario()
        {
            return null;

        }


        //Inativa Usuário 
        public Usuario InativarUsuario()
        {
            return null;

        }

        //Atualiza Usuário 
        public Usuario AtualizarUsuario(int idUsuario, string nomeUsuario, string login, string senha, string email, DateTime dthAtualizacao)
        {
            //cria uma lista de usuarios para armazenar varios objetos do tipo usuario.
            List<Usuario> usuarios = new List<Usuario>();


            //guarda na variavel user o primeiro registro onde o idusuario é o mesmo passado como parametro.
            var user = usuarios.FirstOrDefault(u => u.idusuario == idUsuario);


            try
            {

                //verifica se o retorno não é nulo, se não for, guarda o retorno da procedure de atualização em uma variavel do tipo Usuario.
                if (user != null)
                {

                    // atualiza o registro no banco de dados através da sp
                    Usuario ret = spAtualizaUsuario(
                        idUsuario,
                        nomeUsuario,
                        login,
                        senha,
                        email,
                        dthAtualizacao
                        );

                    // sincroniza o objeto em memória com os novos valores
                    user.nomeUsuario = nomeUsuario;
                    user.login = login;
                    user.senha = senha;
                    user.email = email;
                    user.dthAtualizacao = dthAtualizacao;

                    //atualiza info no banco e logo em seguida retorna info fresquinha dedepois de a


                    //adicionar dth de atualização depois

                    return user;
                }

            else
                {
                    throw new Exception("Usuario não encontrado");
                }

            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
            }
        }
    }
}
