using WebApplication5.Repositories;
using WebApplication5.Services;
using System.Data;
using Microsoft.Data.SqlClient;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddScoped<IDbConnection>(sp =>
    new SqlConnection(builder.Configuration.GetConnectionString("Default")));

builder.Services.AddControllersWithViews();


builder.Services.AddScoped<UsuarioRepository>();
builder.Services.AddScoped<CargoRepository>();

builder.Services.AddScoped<UsuarioService>();
builder.Services.AddScoped<LoginService>();
builder.Services.AddScoped<SenhaService>();

builder.Services.AddScoped<TokenResetRepository>();
builder.Services.AddScoped<EmailService>();
builder.Services.AddScoped<SenhaResetService>();

builder.Services.AddScoped<EnderecoRepository>();
builder.Services.AddScoped<ClienteRepository>();
builder.Services.AddScoped<ClienteService>();

builder.Services.AddSession();
builder.Services.AddHttpContextAccessor();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}

app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseRouting();

app.UseSession();

app.UseAuthorization();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Login}/{action=Index}/{id?}");

app.Run();