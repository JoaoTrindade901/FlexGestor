using Dapper;
using MySql.Data.MySqlClient;
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

        public IEnumerable<CargoModel> Listar()
        {
            using var conn = new MySqlConnection(_connectionString);

            return conn.Query<CargoModel>(
                "spCargo_Listar",
                commandType: CommandType.StoredProcedure);
        }
    }
}