using API1.Metrics;

using Microsoft.AspNetCore.Mvc;

using OpenTelemetry.Metrics;

using Prometheus;

namespace API1.Controllers
{


    [ApiController]
    [Route("[controller]")]
    public class WeatherForecastController : ControllerBase
    {
    

        private static readonly string[] Summaries = new[]
        {
            "Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching"
        };

        private readonly ILogger<WeatherForecastController> _logger;

        public WeatherForecastController(ILogger<WeatherForecastController> logger)
        {
            _logger = logger;
        }

        [HttpGet("GetWeatherForecast", Name = "GetWeatherForecast")]
        public IEnumerable<WeatherForecast> Get()
        {
            return Enumerable.Range(1, 5).Select(index => new WeatherForecast
            {
                Date = DateOnly.FromDateTime(DateTime.Now.AddDays(index)),
                TemperatureC = Random.Shared.Next(-20, 55),
                Summary = Summaries[Random.Shared.Next(Summaries.Length)]
            })
            .ToArray();
        }

        [HttpPost("AddOrder", Name = "AddOrder")]
        public IActionResult AddNewOrder()
        {
            OrderMetrics.OrderCounter.Add(1);
            //OrderMetrics.OrderCounter.Add(1,new KeyValuePair<string, object?>("order_type", "online")); //optionally add domain labels

            return Ok("Order added");
        }



        // ── Simulation Endpoints ────────────────────────────────────────────

        // Simulates a 400 Bad Request (random ~30% of the time, else 200)
        [HttpGet("SimulateBadRequest", Name = "SimulateBadRequest")]
        public IActionResult SimulateBadRequest()
        {
            if (Random.Shared.NextDouble() < 0.3)
                return BadRequest("Simulated 400: Invalid request parameters");

            return Ok("Request was valid");
        }

        // Simulates a 500 Internal Server Error (random ~30% of the time, else 200)
        [HttpGet("SimulateServerError", Name = "SimulateServerError")]
        public IActionResult SimulateServerError()
        {
            if (Random.Shared.NextDouble() < 0.3)
                throw new InvalidOperationException("Simulated 500: Database connection timed out.");

            return Ok("Server handled request successfully");
        }

        // Simulates GC heap pressure by allocating large byte arrays
        [HttpGet("SimulateMemoryPressure", Name = "SimulateMemoryPressure")]
        public IActionResult SimulateMemoryPressure()
        {
            var allocations = new List<byte[]>();

            // Allocate ~200MB in chunks to force GC pressure
            for (int i = 0; i < 20; i++)
                allocations.Add(new byte[10 * 1024 * 1024]); // 10MB per chunk

            // Hold briefly so GC can't immediately collect
            Thread.Sleep(500);

            allocations.Clear();
            GC.Collect(); // explicit collect so heap spike is visible then drops

            return Ok($"Memory pressure simulated. Allocated and released ~200MB.");
        }
    }
}
