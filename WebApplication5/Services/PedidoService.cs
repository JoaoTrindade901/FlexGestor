// Services/PedidoService.cs
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

        public IEnumerable<PedidoListaGridDto> Filtrar(PedidoFiltroDto filtro, int idEmpresa)
            => _repo.Filtrar(filtro, idEmpresa);

        public IEnumerable<PedidoItemGridDto> ListarItens(int idPedido)
            => _repo.ListarItens(idPedido);

        public int Criar(PedidoCriarDto dto, int idEmpresa, int idUsuario)
        {
            dto.Pedido.IdEmpresa = idEmpresa;
            dto.Pedido.DthCriacao = DateTime.Now;
            dto.Pedido.Status = "PENDENTE";

            dto.Pedido.ValorProdutos = dto.Itens.Sum(i => i.ValorTotal);
            dto.Pedido.ValorTotal =
                dto.Pedido.ValorProdutos + dto.Pedido.ValorFrete - dto.Pedido.Desconto;

            var idPedido = _repo.Inserir(dto.Pedido);

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

        public void AtualizarStatus(int idPedido, string status)
            => _repo.AtualizarStatus(idPedido, status);

        public void Cancelar(int idPedido)
            => _repo.Cancelar(idPedido);
    }
}