using WebApplication5.Models;
using WebApplication5.Repositories;

namespace WebApplication5.Services
{
    public class PedidoService
    {
        private readonly PedidoRepository _repo;
        private readonly EstoqueService _estoqueService;

        public PedidoService(PedidoRepository repo, EstoqueService estoqueService)
        {
            _repo = repo;
            _estoqueService = estoqueService;
        }

        public IEnumerable<PedidoListaGridDto> Listar(int idEmpresa)
            => _repo.Listar(idEmpresa);

        public IEnumerable<PedidoItemGridDto> ListarItens(int idPedido)
            => _repo.ListarItens(idPedido);

        public int Criar(PedidoCriarDto dto, int idEmpresa, int idUsuario)
        {
            var pedido = dto.Pedido;
            pedido.IdEmpresa = idEmpresa;
            pedido.IdUsuario = idUsuario;
            pedido.StatusPedidoId = 1; // PENDENTE
            pedido.DthCriacao = DateTime.Now;

            // Recalcula totais no servidor
            pedido.ValorTotal =
                dto.Itens.Sum(i => i.ValorTotal) + pedido.ValorFrete - pedido.Desconto;

            // endereco_id: usa o do cliente se não informado
            if (pedido.EnderecoId == 0) pedido.EnderecoId = 1;

            var idPedido = _repo.Inserir(pedido);

            foreach (var item in dto.Itens)
            {
                item.IdPedido = idPedido;
                item.ValorTotal = (item.ValorUnitario * item.Quantidade) - item.Desconto;
                _repo.InserirItem(item);

                // Desconta estoque automaticamente
                _estoqueService.DescontarEstoque(
                    item.IdProduto, item.Quantidade, idEmpresa, idUsuario);
            }

            return idPedido;
        }

        public void AtualizarStatus(int idPedido, int statusPedidoId)
            => _repo.AtualizarStatus(idPedido, statusPedidoId);

        public void Cancelar(int idPedido)
            => _repo.Cancelar(idPedido);

        public void Editar(PedidoEditarDto dto, int idEmpresa, int idUsuario)
        {
            // 1. Atualiza status se necessário
            _repo.AtualizarStatus(dto.IdPedido, dto.StatusPedidoId);

            // 2. Deleta itens antigos e reinserindo os novos
            _repo.DeletarItens(dto.IdPedido);

            decimal valorTotal = 0;
            foreach (var item in dto.Itens)
            {
                item.IdPedido = dto.IdPedido;
                item.ValorTotal = (item.ValorUnitario * item.Quantidade) - item.Desconto;
                valorTotal += item.ValorTotal;
                _repo.InserirItem(item);
            }

            // 3. Atualiza cabeçalho do pedido
            valorTotal = valorTotal + dto.ValorFrete - dto.Desconto;
            _repo.AtualizarCabecalho(dto.IdPedido, valorTotal, dto.Desconto, dto.ValorFrete, dto.Observacao);
        }
    }
}