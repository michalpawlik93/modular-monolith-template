import 'reflect-metadata';
import { injectable } from 'inversify';
import {
  BusResolver,
  Transport,
  Envelope,
  Result,
  BasicError,
  isErr,
  Pager,
  PagerResult,
} from '@app/core';
import {
  CREATE_PRODUCT_COMMAND_TYPE,
  CreateProductCommand,
  CreateProductResponse,
} from '../handlers/createProductCommandHandler';
import {
  GET_PAGED_PRODUCTS_COMMAND,
  GetPagedProductsCommand,
} from '../handlers/getPagedProductsCommandHandler';
import { Product } from '../../../domain/models/product';

export const PRODUCT_FACADE_TOKENS = {
  Base: Symbol.for('ProductBaseFacade'),
} as const;

export interface IProductBaseFacade {
  invokeCreateProduct(
    payload: CreateProductCommand,
    opts?: { via?: Transport },
  ): Promise<Result<CreateProductResponse, BasicError>>;
  getPagedProducts(
    pager: Pager,
    opts?: { via?: Transport },
  ): Promise<Result<PagerResult<Product>, BasicError>>;
}

@injectable()
export class ProductBaseFacade implements IProductBaseFacade {
  constructor(
    private readonly resolveBus: BusResolver,
  ) {}

  async invokeCreateProduct(
    payload: CreateProductCommand,
    opts?: { via?: Transport },
  ): Promise<Result<CreateProductResponse, BasicError>> {
    const busResult = this.resolveBus(opts?.via);

    if (isErr(busResult)) {
      return busResult;
    }

    const envelope: Envelope<CreateProductCommand> = {
      type: CREATE_PRODUCT_COMMAND_TYPE,
      payload,
    };

    return busResult.value.invoke<CreateProductCommand, CreateProductResponse>(
      envelope,
    );
  }

  async getPagedProducts(
    pager: Pager,
    opts?: { via?: Transport },
  ): Promise<Result<PagerResult<Product>, BasicError>> {
    const busResult = this.resolveBus(opts?.via);

    if (isErr(busResult)) {
      return busResult;
    }

    const envelope: Envelope<GetPagedProductsCommand> = {
      type: GET_PAGED_PRODUCTS_COMMAND,
      payload: { pager },
    };

    return busResult.value.invoke<
      GetPagedProductsCommand,
      PagerResult<Product>
    >(envelope);
  }
}
