using WebApplication5.Models;
using WebApplication5.Repositories;
using ClosedXML.Excel;
using iText.Kernel.Pdf;
using iText.Layout;
using iText.Layout.Element;
using iText.Layout.Properties;

namespace WebApplication5.Services
{
    public class FinanceiroService
    {
        private readonly FinanceiroRepository _repo;
        private readonly CaixaRepository _caixaRepo;

        public FinanceiroService(FinanceiroRepository repo, CaixaRepository caixaRepo)
        {
            _repo = repo;
            _caixaRepo = caixaRepo;
        }

        // ── CONTAS A RECEBER ──────────────────────────────
        public IEnumerable<ContaReceberModel> ListarContasReceber(int idEmpresa)
            => _repo.ListarContasReceber(idEmpresa);

        public int CriarContaReceber(int idEmpresa, CriarContaReceberDto dto)
            => _repo.CriarContaReceber(idEmpresa, dto, null);

        public void ReceberConta(int idEmpresa, int idUsuario, ReceberContaFinanceiroDto dto)
        {
            _repo.ReceberConta(dto.IdContaReceber, dto.ValorPago);

            var caixa = _caixaRepo.BuscarAberto(idEmpresa);
            if (caixa != null)
            {
                _caixaRepo.Lancar(caixa.idCaixa, idEmpresa, idUsuario, new LancarCaixaDto
                {
                    IdFormaPagamento = dto.IdFormaPagamento,
                    IdCategoriaFinanceira = dto.IdCategoriaFinanceira,
                    Valor = dto.ValorPago,
                    TipoLancamento = "RECEBIMENTO",
                    ContaReceberId = dto.IdContaReceber,
                    Descricao = "Recebimento — financeiro"
                });
            }
        }

        public void AlterarVencimentoContaReceber(int idContaReceber, DateTime novaData)
            => _repo.AlterarVencimentoContaReceber(idContaReceber, novaData);

        // ── CONTAS A PAGAR ────────────────────────────────
        public IEnumerable<ContaPagarModel> ListarContasPagar(int idEmpresa)
            => _repo.ListarContasPagar(idEmpresa);

        public int CriarContaPagar(int idEmpresa, CriarContaPagarDto dto)
            => _repo.CriarContaPagar(idEmpresa, dto);

        public void PagarConta(int idEmpresa, int idUsuario, PagarContaDto dto)
        {
            _repo.PagarConta(dto.IdContaPagar, dto.ValorPago);

            var caixa = _caixaRepo.BuscarAberto(idEmpresa);
            if (caixa != null)
            {
                _caixaRepo.Lancar(caixa.idCaixa, idEmpresa, idUsuario, new LancarCaixaDto
                {
                    IdFormaPagamento = dto.IdFormaPagamento,
                    IdCategoriaFinanceira = dto.IdCategoriaFinanceira,
                    Valor = dto.ValorPago,
                    TipoLancamento = "PAGAMENTO",
                    Descricao = "Pagamento — financeiro"
                });
            }
        }

        public void AlterarVencimentoContaPagar(int idContaPagar, DateTime novaData)
            => _repo.AlterarVencimentoContaPagar(idContaPagar, novaData);

        public void EditarContaReceber(EditarContaReceberDto dto) => _repo.EditarContaReceber(dto);
        public void ExcluirContaReceber(int id) => _repo.ExcluirContaReceber(id);
        public IEnumerable<PagamentoHistoricoDto> ListarPagamentosContaReceber(int id)
            => _repo.ListarPagamentosContaReceber(id);

        public void EditarContaPagar(EditarContaPagarDto dto) => _repo.EditarContaPagar(dto);
        public void ExcluirContaPagar(int id) => _repo.ExcluirContaPagar(id);
        public IEnumerable<PagamentoHistoricoDto> ListarPagamentosContaPagar(int id)
            => _repo.ListarPagamentosContaPagar(id);

        public byte[] GerarExcel(int idEmpresa, string tipo)
        {
            using var wb = new XLWorkbook();
            var ws = wb.Worksheets.Add(tipo == "receber" ? "Contas a Receber" : "Contas a Pagar");

            if (tipo == "receber")
            {
                var dados = _repo.ListarContasReceber(idEmpresa).ToList();
                string[] headers = { "Cliente", "Descrição", "Total", "Pago", "Restante", "Vencimento", "Status" };
                for (int i = 0; i < headers.Length; i++)
                {
                    ws.Cell(1, i + 1).Value = headers[i];
                    ws.Cell(1, i + 1).Style.Font.Bold = true;
                }
                for (int i = 0; i < dados.Count; i++)
                {
                    var c = dados[i]; var row = i + 2;
                    ws.Cell(row, 1).Value = c.nomeCliente ?? "—";
                    ws.Cell(row, 2).Value = c.descricao ?? "—";
                    ws.Cell(row, 3).Value = c.valorTotal;
                    ws.Cell(row, 4).Value = c.valorPago;
                    ws.Cell(row, 5).Value = c.valorTotal - c.valorPago;
                    ws.Cell(row, 6).Value = c.dthVencimento.ToString("dd/MM/yyyy");
                    ws.Cell(row, 7).Value = c.statusAtual ?? c.status;
                }
            }
            else
            {
                var dados = _repo.ListarContasPagar(idEmpresa).ToList();
                string[] headers = { "Fornecedor", "Descrição", "Total", "Pago", "Restante", "Vencimento", "Status" };
                for (int i = 0; i < headers.Length; i++)
                {
                    ws.Cell(1, i + 1).Value = headers[i];
                    ws.Cell(1, i + 1).Style.Font.Bold = true;
                }
                for (int i = 0; i < dados.Count; i++)
                {
                    var c = dados[i]; var row = i + 2;
                    ws.Cell(row, 1).Value = c.nomeFornecedor ?? "—";
                    ws.Cell(row, 2).Value = c.descricao ?? "—";
                    ws.Cell(row, 3).Value = c.valorTotal;
                    ws.Cell(row, 4).Value = c.valorPago;
                    ws.Cell(row, 5).Value = c.valorTotal - c.valorPago;
                    ws.Cell(row, 6).Value = c.dthVencimento.ToString("dd/MM/yyyy");
                    ws.Cell(row, 7).Value = c.statusAtual ?? c.status;
                }
            }

            ws.Columns().AdjustToContents();
            using var ms = new MemoryStream();
            wb.SaveAs(ms);
            return ms.ToArray();
        }

        public byte[] GerarPdf(int idEmpresa, string tipo)
        {
            using var ms = new MemoryStream();
            var writer = new PdfWriter(ms);
            var pdf = new PdfDocument(writer);
            var doc = new Document(pdf);

            var titulo = tipo == "receber" ? "Contas a Receber" : "Contas a Pagar";
            doc.Add(new Paragraph(titulo).SetFontSize(16));
            doc.Add(new Paragraph($"Gerado em: {DateTime.Now:dd/MM/yyyy HH:mm}").SetFontSize(10));

            var table = new Table(UnitValue.CreatePercentArray(tipo == "receber"
                ? new float[] { 20, 20, 10, 10, 10, 12, 10 }
                : new float[] { 20, 20, 10, 10, 10, 12, 10 })).UseAllAvailableWidth();

            string[] headers = tipo == "receber"
                ? new[] { "Cliente", "Descrição", "Total", "Pago", "Restante", "Vencimento", "Status" }
                : new[] { "Fornecedor", "Descrição", "Total", "Pago", "Restante", "Vencimento", "Status" };

            foreach (var h in headers)
                table.AddHeaderCell(new Cell().Add(new Paragraph(h).SetFontSize(9)));

            if (tipo == "receber")
            {
                foreach (var c in _repo.ListarContasReceber(idEmpresa))
                {
                    table.AddCell(new Cell().Add(new Paragraph(c.nomeCliente ?? "—").SetFontSize(8)));
                    table.AddCell(new Cell().Add(new Paragraph(c.descricao ?? "—").SetFontSize(8)));
                    table.AddCell(new Cell().Add(new Paragraph($"R$ {c.valorTotal:F2}").SetFontSize(8)));
                    table.AddCell(new Cell().Add(new Paragraph($"R$ {c.valorPago:F2}").SetFontSize(8)));
                    table.AddCell(new Cell().Add(new Paragraph($"R$ {c.valorTotal - c.valorPago:F2}").SetFontSize(8)));
                    table.AddCell(new Cell().Add(new Paragraph(c.dthVencimento.ToString("dd/MM/yyyy")).SetFontSize(8)));
                    table.AddCell(new Cell().Add(new Paragraph(c.statusAtual ?? c.status ?? "—").SetFontSize(8)));
                }
            }
            else
            {
                foreach (var c in _repo.ListarContasPagar(idEmpresa))
                {
                    table.AddCell(new Cell().Add(new Paragraph(c.nomeFornecedor ?? "—").SetFontSize(8)));
                    table.AddCell(new Cell().Add(new Paragraph(c.descricao ?? "—").SetFontSize(8)));
                    table.AddCell(new Cell().Add(new Paragraph($"R$ {c.valorTotal:F2}").SetFontSize(8)));
                    table.AddCell(new Cell().Add(new Paragraph($"R$ {c.valorPago:F2}").SetFontSize(8)));
                    table.AddCell(new Cell().Add(new Paragraph($"R$ {c.valorTotal - c.valorPago:F2}").SetFontSize(8)));
                    table.AddCell(new Cell().Add(new Paragraph(c.dthVencimento.ToString("dd/MM/yyyy")).SetFontSize(8)));
                    table.AddCell(new Cell().Add(new Paragraph(c.statusAtual ?? c.status ?? "—").SetFontSize(8)));
                }
            }

            doc.Add(table);
            doc.Close();
            return ms.ToArray();
        }
    }
}