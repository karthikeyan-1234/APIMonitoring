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

        [HttpGet(Name = "GetWeatherForecast")]
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

        [HttpPost("AddOrder")]
        public IActionResult AddNewOrder()
        {
            OrderMetrics.OrderCounter.Add(1);
            //OrderMetrics.OrderCounter.Add(1,new KeyValuePair<string, object?>("order_type", "online")); //optionally add domain labels

            return Ok("Order added");
        }
    }
}
