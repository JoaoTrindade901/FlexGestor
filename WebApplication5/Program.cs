using WebApplication5.Repositories;
using WebApplication5.Services;
using System.Data;
using MySql.Data.MySqlClient;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddScoped<IDbConnection>(sp =>
    new MySqlConnection(builder.Configuration.GetConnectionString("Default")));

builder.Services.AddControllersWithViews(options =>
{
    options.Filters.AddService<PermissaoFilter>();
});

// Usuário / Auth
builder.Services.AddScoped<UsuarioRepository>();
builder.Services.AddScoped<CargoRepository>();
builder.Services.AddScoped<UsuarioService>();
builder.Services.AddScoped<LoginService>();
builder.Services.AddScoped<SenhaService>();
builder.Services.AddScoped<TokenResetRepository>();
builder.Services.AddScoped<EmailService>();
builder.Services.AddScoped<SenhaResetService>();
builder.Services.AddScoped<PermissaoFilter>();

// Cliente
builder.Services.AddScoped<EnderecoRepository>();
builder.Services.AddScoped<ClienteRepository>();
builder.Services.AddScoped<ClienteService>();

// Produto / Estoque / Pedido
builder.Services.AddScoped<ProdutoRepository>();
builder.Services.AddScoped<ProdutoService>();
builder.Services.AddScoped<EstoqueRepository>();
builder.Services.AddScoped<EstoqueService>();
builder.Services.AddScoped<PedidoRepository>();
builder.Services.AddScoped<PedidoService>();

// Categoria Produto
builder.Services.AddScoped<CategoriaProdutoRepository>();
builder.Services.AddScoped<CategoriaProdutoService>();

// Caixa
builder.Services.AddScoped<CaixaRepository>();
builder.Services.AddScoped<CaixaService>();

// Auditoria
builder.Services.AddScoped<AuditoriaRepository>();
builder.Services.AddScoped<AuditoriaService>();

// Fornecedor
builder.Services.AddScoped<FornecedorRepository>();
builder.Services.AddScoped<FornecedorService>();

// Home
builder.Services.AddScoped<HomeRepository>();
builder.Services.AddScoped<HomeService>();

// Financeiro
builder.Services.AddScoped<FinanceiroRepository>();
builder.Services.AddScoped<FinanceiroService>();

builder.Services.AddScoped<DespesaRepository>();
builder.Services.AddScoped<DespesaService>();

// Permissão
builder.Services.AddScoped<PermissaoRepository>();
builder.Services.AddScoped<PermissaoService>();

builder.Services.AddSession();
builder.Services.AddHttpContextAccessor();

var app = builder.Build();

if (app.Environment.IsDevelopment())
    app.UseDeveloperExceptionPage();

app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseRouting();
app.UseSession();
app.UseAuthorization();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Login}/{action=Index}/{id?}");

app.Run();