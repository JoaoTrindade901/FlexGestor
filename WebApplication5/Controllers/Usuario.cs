using static System.Formats.Asn1.AsnWriter;

namespace WebApplication5.Controllers
{
    public class Usuario
    {
        //Pesquisa Usuário
        public List<Usuario> BuscaUsuarios(int? idUsuario, string nomeUsuario, bool fAtivo, string login, string senha, string email)
        {
            try
            {

                Usuario ret = spBuscaUsuario(
                    idUsuario,
                    nomeUsuario,
                    fAtivo
                    );

                //GravaLog(ret);
                return ret;


            }
            catch (Exception ex)
            {

                //GravaLog(ret);
                Console.WriteLine(ex.Message);

                throw;
            }

        }

        //Cria Usuário 
        public Usuario CriarUsuario(string nomeUsuario,bool fAtivo, string login, string senha, string email, DateTime dthCriacao)
        {
            List<Usuario> usuarios = new List<Usuario>();

            try
            {

                    Usuario ret = spCriaUsuario(
                        nomeUsuario,
                        fAtivo,
                        dthCriacao,
                        login,
                        senha,
                        email
                        );

                    usuarios.Add(ret);
                    //GravaLog(ret);
                    return ret;

            }
            catch (Exception ex)
            {
                //GravaLog(ret);
                Console.WriteLine(ex.Message);

                throw;
            }


        }


        //Inativa Usuário 
        public Usuario InativarUsuario(List<int> idUsuario, bool fAtivo)
        {

            try
            {
                spInativaUsuario(idsUsuarios, fAtivo);
                return true;
            }
            catch (Exception)
            {
                throw;
            }


        }

        //Atualiza Usuário 
        public Usuario AtualizarUsuario(int idUsuario, string login, string senha, string nomeUsuario,string cpf, string genero, string telefone,DateTime dthNascimento, string email, DateTime dthAdmissao, DateTime dthDemissao, float salario, bool fAtivo)
        {
            try
            {
                    // atualiza o registro no banco de dados através da sp
                    Usuario ret = spAtualizaUsuario(
                        idUsuario,
                        login,
                        senha,
                        nomeUsuario,
                        cpf,
                        genero,
                        dthNascimento,
                        email,
                        dthAdmissao,
                        telefone,
                        dthDemissao,
                        salario,
                        fAtivo
                        );
                //GravaLog(ret);
                return ret; 

            }
            catch (Exception ex)
            {
                //GravaLog(ret);
                Console.WriteLine(ex.Message);

                throw;
            }
        }
    }
}
