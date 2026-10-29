import { createApi } from './app.ts';
import { parseWorkerEnv } from './config.ts';

export default {
  fetch(request: Request, env: Record<string, unknown>, executionContext: ExecutionContext): Response | Promise<Response> {
    return createApi(parseWorkerEnv(env)).fetch(request, env, executionContext);
  },
};
