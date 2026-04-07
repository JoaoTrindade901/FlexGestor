namespace WebApplication5.Models
{
    public class HomeKpiDto
    {
        // Pedidos do mês
        public int TotalPedidosMes { get; set; }
        public decimal FaturamentoMes { get; set; }
        public decimal TicketMedio { get; set; }
        public int TotalPedidosMesAnterior { get; set; }
        public decimal FaturamentoMesAnterior { get; set; }

        // Clientes
        public int TotalClientes { get; set; }
        public int ClientesAtivos { get; set; }
        public decimal SaldoDevedorTotal { get; set; }

        // Estoque
        public int ProdutosEstoqueCritico { get; set; }
        public int TotalProdutos { get; set; }

        // Caixa
        public bool CaixaAberto { get; set; }
        public decimal SaldoInicial { get; set; }
        public decimal TotalEntradas { get; set; }
        public decimal TotalSaidas { get; set; }

        // Pedidos por status
        public List<PedidoStatusKpiDto> PedidosPorStatus { get; set; } = new();

        // Top produtos
        public List<TopProdutoDto> TopProdutos { get; set; } = new();

        // Faturamento mensal
        public List<FaturamentoMensalDto> FaturamentoMensal { get; set; } = new();

        // Calculados
        public decimal SaldoCaixaAtual => SaldoInicial + TotalEntradas - TotalSaidas;
        public double VariacaoFaturamento =>
            FaturamentoMesAnterior == 0 ? 0
            : (double)((FaturamentoMes - FaturamentoMesAnterior) / FaturamentoMesAnterior * 100);
        public double VariacaoPedidos =>
            TotalPedidosMesAnterior == 0 ? 0
            : (double)((TotalPedidosMes - TotalPedidosMesAnterior) / (double)TotalPedidosMesAnterior * 100);
        public double PercClientesAtivos =>
            TotalClientes == 0 ? 0
            : Math.Round((double)ClientesAtivos / TotalClientes * 100, 1);
        public double PercEstoqueCritico =>
            TotalProdutos == 0 ? 0
            : Math.Round((double)ProdutosEstoqueCritico / TotalProdutos * 100, 1);
    }

    public class PedidoStatusKpiDto
    {
        public string StatusNome { get; set; } = string.Empty;
        public int Quantidade { get; set; }
    }

    public class TopProdutoDto
    {
        public string NomeProduto { get; set; } = string.Empty;
        public int TotalVendido { get; set; }
        public decimal ReceitaTotal { get; set; }
    }

    public class FaturamentoMensalDto
    {
        public string Mes { get; set; } = string.Empty;
        public decimal Faturamento { get; set; }
        public int QtdPedidos { get; set; }
    }
}