import client from 'prom-client';

// 1. Recolectar métricas del sistema (CPU, RAM, Event Loop)

//client.collectDefaultMetrics({ prefix: 'customer_api_' });
client.collectDefaultMetrics();

class MetricsService {
    public static readonly httpRequestCounter = new client.Counter({
        name: 'http_requests_total',
        help: 'Total de peticiones HTTP recibidas',
        labelNames: ['method', 'route', 'status']
    });

    public static readonly httpRequestDuration = new client.Histogram({
        name: 'http_request_duration_seconds',
        help: 'Duración de peticiones HTTP en segundos',
        labelNames: ['method', 'route', 'status'],
        buckets: [0.05, 0.1, 0.3, 0.5, 1, 2, 5]
    });

    async getMetrics(): Promise<string> {
        return await client.register.metrics();
    }

    getContentType(): string {
        return client.register.contentType;
    }
}


export default MetricsService