import { Request, Response, NextFunction } from 'express';
import MetricsService from '../services/metrics.service.ts';
export class MetricsController {

    private _metricsService: MetricsService;

    constructor(metricsService: MetricsService) {
        this._metricsService = metricsService;
    }

    metricsCounter(
        req: Request,
        res: Response,
        next: NextFunction
    ): void {

        const start = Date.now();

        res.on('finish', () => {

            const durationInSeconds =
                (Date.now() - start) / 1000;

            const route = req.route?.path
                ? `${req.baseUrl}${req.route.path}`
                : 'unmatched';

            const labels = {
                method: req.method,
                route,
                status: res.statusCode.toString()
            };

            MetricsService.httpRequestCounter.inc(labels);

            MetricsService.httpRequestDuration.observe(
                labels,
                durationInSeconds
            );
        });

        next();
    }

    async metrics(
        req: Request,
        res: Response
    ): Promise<void> {

        res.set(
            'Content-Type',
            this._metricsService.getContentType()
        );

        res.send(
            await this._metricsService.getMetrics()
        );
    }
}