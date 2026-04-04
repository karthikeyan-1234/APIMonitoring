using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace API1
{
    public class GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger) : IExceptionHandler
    {
        public async ValueTask<bool> TryHandleAsync(
            HttpContext httpContext,
            Exception exception,
            CancellationToken cancellationToken)
        {
            // The TraceId is automatically available via Activity.Current or HttpContext.TraceIdentifier
            var traceId = System.Diagnostics.Activity.Current?.Id ?? httpContext.TraceIdentifier;

            logger.LogError(
                exception,
                "An unhandled exception occurred. TraceId: {TraceId}, Message: {Message}",
                traceId,
                exception.Message);

            // This allows the built-in ProblemDetails to take over and format the response
            return false;
        }
    }
}
