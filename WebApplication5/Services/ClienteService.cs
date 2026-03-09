using WebApplication5.Models;
using WebApplication5.Repositories;

namespace WebApplication5.Services
{
    public class ClienteService
    {
        private readonly ClienteRepository _clienteRepo;
        private readonly EnderecoRepository _enderecoRepo;

        public ClienteService(ClienteRepository clienteRepo, EnderecoRepository enderecoRepo)
        {
            _clienteRepo = clienteRepo;
            _enderecoRepo = enderecoRepo;
        }

        public IEnumerable<ClienteListaGridDto> Listar()
        {
            return _clienteRepo.ListarClientes();
        }

        public IEnumerable<ClienteListaGridDto> Filtrar(ClienteFiltroDto filtro)
        {
            return _clienteRepo.FiltrarClientes(filtro);
        }

        public int CriarCliente(ClienteCriarDto dto)
        {
            // 1. insere o endereço e pega o id gerado
            var idEndereco = _enderecoRepo.InserirEndereco(dto.Endereco);

            // 2. insere o cliente com o enderecoId
            dto.Cliente.enderecoId = idEndereco;
            dto.Cliente.dthCadastro = DateTime.Now;
            dto.Cliente.fAtivo = true;

            return _clienteRepo.InserirCliente(dto.Cliente);
        }

        public void EditarCliente(ClienteCriarDto dto)
        {
            // 1. atualiza o endereço existente
            _enderecoRepo.AtualizarEndereco(dto.Endereco);

            // 2. atualiza o cliente
            _clienteRepo.AtualizarCliente(dto.Cliente);
        }

        public void DeletarCliente(int idCliente)
        {
            _clienteRepo.DeletarCliente(idCliente);
        }
    }
}