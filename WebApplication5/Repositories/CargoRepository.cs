using Dapper;
using Microsoft.Data.SqlClient;
using System.Data;
using WebApplication5.Models;

namespace WebApplication5.Repositories
{
    public class CargoRepository
    {
        private readonly string _connectionString;

        public CargoRepository(IConfiguration config)
        {
            _connectionString = config.GetConnectionString("Default");
        }

        public IEnumerable<Cargo> Listar()
        {
            using var conn = new SqlConnection(_connectionString);

            return conn.Query<Cargo>(
                "spCargo_Listar",
                commandType: CommandType.StoredProcedure);
        }
    }
}