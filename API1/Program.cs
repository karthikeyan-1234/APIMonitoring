using OpenTelemetry.Logs;
using OpenTelemetry.Metrics;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;

var builder = WebApplication.CreateBuilder(args);

// ---------------------------
// Service Info (Dynamic Version)
// ---------------------------
var serviceName = "API1";
var serviceVersion = Environment.GetEnvironmentVariable("APP_VERSION") ?? "1.0.0";



// ---------------------------
// Logging (OTEL)
// ---------------------------
builder.Logging.ClearProviders();

builder.Logging.AddOpenTelemetry(options =>
{
    options.SetResourceBuilder(
        ResourceBuilder.CreateDefault().AddService(
            serviceName: serviceName,
            serviceVersion: serviceVersion));

    options.AddOtlpExporter(otlpOptions =>
    {
        otlpOptions.Endpoint = new Uri("http://otel-collector:4317");
    });
});


// ---------------------------
// Common Resource
// Build ONCE and reuse everywhere so service.version is consistent.
// ---------------------------
Action<ResourceBuilder> configureResource = r => r
    .AddService(serviceName: serviceName, serviceVersion: serviceVersion)
    .AddAttributes(new Dictionary<string, object>
    {
        ["service.version"] = serviceVersion
    });

// ---------------------------
// OpenTelemetry (Metrics + Traces)
// ---------------------------
builder.Services.AddOpenTelemetry()
    .ConfigureResource(configureResource)

    // -------- TRACES --------
    .WithTracing(tracing =>
    {
        tracing
            .AddAspNetCoreInstrumentation()
            .AddHttpClientInstrumentation()
            .AddOtlpExporter(options =>
            {
                options.Endpoint = new Uri("http://otel-collector:4317");
            });
    })

    // -------- METRICS --------
    .WithMetrics(metrics =>
    {
        metrics
            .AddAspNetCoreInstrumentation()
            .AddHttpClientInstrumentation()
            .AddRuntimeInstrumentation()
            .AddOtlpExporter(options =>
            {
                options.Endpoint = new Uri("http://otel-collector:4317");
            });
    });

// ---------------------------
// Services
// ---------------------------
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = serviceName,
        Version = serviceVersion,
        Description = "API for OpenTelemetry monitoring"
    });
});

var app = builder.Build();

// ---------------------------
// Middleware
// ---------------------------
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", $"{serviceName} V1");
    c.RoutePrefix = "swagger";
});

app.UseStaticFiles();

app.UseAuthorization();
app.MapControllers();

// ---------------------------
// Test Endpoint
// ---------------------------
app.MapGet("/test", (ILogger<Program> logger) =>
{
    var podName = Environment.GetEnvironmentVariable("HOSTNAME") ?? "No Pod name";
    var podIp = Environment.GetEnvironmentVariable("POD_IP") ?? "No Pod IP";
    var appVersion = Environment.GetEnvironmentVariable("APP_VERSION") ?? "unknown";

    logger.LogInformation("Hit {Version} on {Pod}", appVersion, podName);

    return Results.Ok(new
    {
        Message = "Telemetry working!",
        Version = appVersion,
        HandledBy = podName,
        PodIP = podIp,
        Time = DateTime.UtcNow
    });
});

app.Run();