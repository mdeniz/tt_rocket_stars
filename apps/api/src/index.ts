import { createApi } from './app.ts';
import { parseWorkerEnv } from './config.ts';

let localApi: ReturnType<typeof createApi> | undefined;

export default {
  fetch(request: Request, env: Record<string, unknown>, executionContext: ExecutionContext): Response | Promise<Response> {
    localApi ??= createApi(parseWorkerEnv(env));
    return localApi.fetch(request, env, executionContext);
  },
};
