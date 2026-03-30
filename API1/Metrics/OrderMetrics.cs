using System.Diagnostics.Metrics;

namespace API1.Metrics
{
    public static class OrderMetrics
    {
        public static readonly Meter Meter =
            new("API1.BusinessMetrics", "1.0.0");

        public static readonly Counter<long> OrderCounter =
            Meter.CreateCounter<long>("api_orders_total");
    }
}
