import fetch from 'node-fetch';
import AbortController from 'abort-controller';
import { URLSearchParams, URL } from 'url';
import { Agent as HttpAgent } from 'http';
import { Agent as HttpsAgent } from 'https';
import cacheManager from 'cache-manager';
import redisStore from 'cache-manager-redis-store';
import StatsD from 'hot-shots';

const redisHost = process.env.REDIS_HOST || 'localhost';
const cacheDisable = !!process.env.CACHE_DISABLE;

export const cache = cacheDisable ?
  cacheManager.caching({
    store: 'memory',
    max: 0,
    ttl: 180,
  }) :
  cacheManager.caching(<any>{
    store: redisStore,
    host: redisHost,
    ttl: 180,
  });

if (!cacheDisable) {
  // log redis errors
  (<any>cache).store.getClient().on('error', console.error);
}

const stats = new StatsD({ prefix: 'brawltime.api.' });

const httpAgent = new HttpAgent({
  keepAlive: true,
  keepAliveMsecs: 90*60,
});

const httpsAgent = new HttpsAgent({
  keepAlive: true,
  keepAliveMsecs: 90*60,
});

export function request<T>(
    path: string,
    base: string,
    metricName: string,
    params: { [key: string]: string },
    headers: { [header: string]: string },
    timeoutMs: number = 10000,
    ttlS: number = 180): Promise<T> {
  const url = new URL(base + path);
  const urlParams = new URLSearchParams(params);
  url.search = urlParams.toString();
  const urlStr = url.toString();
  const agent = urlStr.startsWith('https') ? httpsAgent : httpAgent;
  const controller = new AbortController()
  const timeout = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  stats.increment(metricName + '.cache.access')
  return cache.wrap(`request:${urlStr}`, () => stats.asyncTimer(() => fetch(urlStr, {
      headers,
      agent,
      compress: true,
      signal: controller.signal,
    }), metricName + '.timer')()
    .then(response => {
      stats.increment(metricName + '.cache.miss');
      if (!response.ok) {
        if (response.status == 429) {
          stats.increment(metricName + '.ratelimited');
        } else if (response.status >= 500) {
          stats.increment(metricName + '.servererror');
        }

        throw {
          url: url.toString(),
          status: response.status,
          reason: response.statusText,
        };
      }

      return response.json();
    })
    .catch(error => {
      stats.increment(metricName + '.cache.miss');
      if (error.type == 'aborted') {
        stats.increment(metricName + '.timeout');
        throw {
          url: url.toString(),
          status: 429,
          reason: 'API took too long to respond',
        };
      }
      throw error
    }), { ttl: ttlS })
    .finally(() => clearTimeout(timeout))
}

export function post<T>(
    url: string,
    data: any,
    metricName: string,
    timeoutMs: number = 500): Promise<T> {
  const agent = url.startsWith('https') ? httpsAgent : httpAgent;
  const controller = new AbortController()
  const timeout = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  stats.increment(metricName + '.run')
  return stats.asyncTimer<[], any>(() => fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      agent,
      compress: true,
      signal: controller.signal,
    }), metricName + '.timer')()
    .then(response => {
      if (!response.ok) {
        if (response.status >= 500) {
          stats.increment(metricName + '.servererror');
        }
        throw {
          url: url.toString(),
          status: response.status,
          reason: response.statusText,
        };
      }

      return response.json();
    })
    .catch(error => {
      if (error.type == 'aborted') {
        stats.increment(metricName + '.timeout');
        throw {
          url: url.toString(),
          status: 429,
          reason: 'API took too long to respond',
        };
      }
      throw error
    })
    .finally(() => clearTimeout(timeout))
}
