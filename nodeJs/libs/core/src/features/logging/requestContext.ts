import { AsyncLocalStorage } from "node:async_hooks";

export type RequestContextData = {
  requestId?: string;
  domain?: string;
};

export class RequestContext {
  private storage = new AsyncLocalStorage<RequestContextData>();

  run<T>(data: RequestContextData, fn: () => T): T {
    return this.storage.run(data, fn);
  }

  get(): RequestContextData | undefined {
    return this.storage.getStore();
  }
}
