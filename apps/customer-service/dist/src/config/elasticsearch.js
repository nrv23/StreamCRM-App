import { Client } from '@elastic/elasticsearch';
//'@elastic/elasticsearch/lib/api/typesWithBodyKey';
import { env } from "./enviroment.js";
import { WinstonLogger } from "../shared/utils/winstonLogger.js";
const log = WinstonLogger.getInstance(env.elastic_search_url, 'customerElasticSearchServer', 'debug', env.index_elastic_search_name);
export const elasticSearchClient = new Client({
    node: env.elastic_search_url
});
async function createLogIndex() {
    const exists = await elasticSearchClient.indices.exists({
        index: env.index_elastic_search_name
    });
    if (exists) {
        log.info(`Elasticsearch index [${env.index_elastic_search_name}] already exists`);
        return;
    }
    await elasticSearchClient.indices.create({
        index: env.index_elastic_search_name,
        mappings: {
            properties: {
                '@timestamp': {
                    type: 'date'
                },
                level: {
                    type: 'keyword'
                },
                service: {
                    type: 'keyword'
                },
                event: {
                    type: 'keyword'
                },
                event_id: {
                    type: 'keyword'
                },
                message: {
                    type: 'text'
                }
            }
        }
    });
    log.info(`Elasticsearch index [${env.index_elastic_search_name}] created`);
}
export async function connect() {
    let isConnected = false;
    while (!isConnected) {
        log.info('CustomerService connecting to Elasticsearch...');
        try {
            const healthResponse = await elasticSearchClient.cluster.health({});
            log.info(`CustomerService Elasticsearch health status - ${healthResponse.status}`);
            await createLogIndex();
            isConnected = true;
        }
        catch (error) {
            log.error('Connection to Elasticsearch failed. Retrying...', {
                error
            });
        }
    }
}
//# sourceMappingURL=elasticsearch.js.map