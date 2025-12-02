import {
  BasicError,
  Pager,
  PagerResult,
  Result,
} from '../../../utils';
import { Transport } from '../../serviceBus/resolveBus';

export const PRODUCT_FACADE_TOKEN = Symbol.for('ProductBaseFacade');

export interface CreateProductCommandContract {
  id?: string;
  name: string;
  priceCents: number;
}

export interface CreateProductResponseContract {
  id: string;
}

export interface DeleteProductCommandContract {
  id: string;
}

export interface DeleteProductResponseContract {
  id: string;
}

export interface ProductContract {
  id: string;
  name: string;
  priceCents: number;
}

export interface IProductBaseFacade {
  invokeCreateProduct(
    payload: CreateProductCommandContract,
    opts?: { via?: Transport },
  ): Promise<Result<CreateProductResponseContract, BasicError>>;
  invokeDeleteProduct(
    payload: DeleteProductCommandContract,
    opts?: { via?: Transport },
  ): Promise<Result<DeleteProductResponseContract, BasicError>>;
  getPagedProducts(
    pager: Pager,
    opts?: { via?: Transport },
  ): Promise<Result<PagerResult<ProductContract>, BasicError>>;
}
