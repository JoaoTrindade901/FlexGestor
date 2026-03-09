namespace WebApplication5.Models
{
    public class PedidoModel
    {
        public int IdPedido { get; set; }
        public int idCliente { get; set; }
        public int idEmpresa { get; set; }
        public DateTime dthCriacao { get; set; }
        public string descricao { get; set; }
        public decimal valorTotal { get; set; }
    }
}
