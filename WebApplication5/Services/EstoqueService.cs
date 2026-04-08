// Services/EstoqueService.cs
using WebApplication5.Models;
using WebApplication5.Repositories;

namespace WebApplication5.Services
{
    public class EstoqueService
    {
        private readonly EstoqueRepository _repo;

        public EstoqueService(EstoqueRepository repo) => _repo = repo;

        public IEnumerable<EstoqueListaGridDto> Listar(int idEmpresa)
            => _repo.Listar(idEmpresa);

        public IEnumerable<MovimentacaoEstoqueModel> ListarMovimentacoes(int idEmpresa)
            => _repo.ListarMovimentacoes(idEmpresa);

        public void Movimentar(MovimentacaoEstoqueModel m, int idEmpresa, int idUsuario)
        {
            m.IdEmpresa = idEmpresa;
            m.IdUsuario = idUsuario;
            m.DthMovimentacao = DateTime.Now;
            _repo.Movimentar(m);
        }

        public void AtualizarMinimo(int idProduto, int estoqueMinimo)
            => _repo.AtualizarMinimo(idProduto, estoqueMinimo);

        public void AssociarFornecedor(int idFornecedor, int idProduto, int idEmpresa, decimal precoCompra)
            => _repo.AssociarFornecedor(idFornecedor, idProduto, idEmpresa, precoCompra);

        // Chamado pelo PedidoService ao criar pedido
        public void DescontarEstoque(int idProduto, int quantidade, int idEmpresa, int idUsuario)
        {
            _repo.Movimentar(new MovimentacaoEstoqueModel
            {
                IdProduto = idProduto,
                IdEmpresa = idEmpresa,
                IdUsuario = idUsuario,
                TipoMovimentacao = "SAIDA",
                Quantidade = quantidade,
                Motivo = "Venda — pedido gerado automaticamente",
                DthMovimentacao = DateTime.Now
            });
        }
    }
}