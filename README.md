# OpenTelemetry Observability Stack for .NET 9 Web APIs in Kubernetes

A complete, production-ready observability pipeline for **any .NET 9 Web API** using:

- **OpenTelemetry** (Push via OTLP)
- **OpenTelemetry Collector** (Enrichment + Conversion)
- **Prometheus** (Scrape)
- **Grafana** (Visualization)

Supports **Stable + Canary** deployments with automatic metric separation via `service.version` labels.

---

## Architecture Overview

```mermaid
flowchart LR
    subgraph Application [".NET 9 Web API"]
        API1[api1-stable\nv1-stable\nAPI1-Deployment-Stable.yaml]
        API2[api1-canary\nv1-canary\nAPI1-Deployment-Canary.yaml]
    end

    subgraph Collector ["OpenTelemetry Collector"]
        OTLP[OTLP Receiver\n:4317\notel-collector-config.yaml]
        PROC[Processors\nbatch + k8sattributes\notel-collector-config.yaml]
        EXP[Prometheus Exporter\n:8889\nresource_to_telemetry_conversion\notel-collector-config.yaml]
    end

    subgraph Monitoring ["Monitoring Stack"]
        PROM[Prometheus\nscrape every 5s\nprometheus-config.yaml]
        GRAF[Grafana\ngrafana-deployment.yaml\ngrafana-datasource-config.yaml]
    end

    API1 -->|"Push OTLP gRPC"| OTLP
    API2 -->|"Push OTLP gRPC"| OTLP
    OTLP --> PROC
    PROC --> EXP
    EXP -->|"Scrape (Pull)"| PROM
    PROM --> GRAF

    style Application fill:#1e40af,stroke:#67e8f9,color:#fff
    style Collector fill:#6b21a8,stroke:#c026d3,color:#fff
    style Monitoring fill:#166534,stroke:#4ade80,color:#fff
