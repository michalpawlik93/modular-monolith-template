import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { Container } from 'inversify';
import { isOk, BasicError, Result, Pager, PagerResult, CreateAccountCommandContract, CreateProductCommandContract, CreateAccountWithProductsCommandContract, CreateAccountResponseContract, CreateProductResponseContract, CreateAccountWithProductsResponseContract, ProductContract, AccountContract } from '@app/core';
import {
  IAccountBaseFacade,
  ACCOUNT_FACADE_TOKEN,
  IProductBaseFacade,
  PRODUCT_FACADE_TOKEN,
} from '@app/core';
import { invokeCreateAccount } from './commands/invokeCreateAccount';
import { invokeCreateAccountGrpc } from './commands/invokeCreateAccountGrpc';
import { invokeGetPagedAccounts } from './commands/invokeGetPagedAccounts';
import { invokeCreateProduct } from './commands/invokeCreateProduct';
import { invokeGetPagedProducts } from './commands/invokeGetPagedProducts';
import { invokeCreateAccountWithProducts } from './commands/invokeCreateAccountWithProducts';

class ConsoleApp {
  private readonly accountFacade: IAccountBaseFacade;
  private readonly productFacade: IProductBaseFacade;

  constructor(container: Container) {
    this.accountFacade = container.get<IAccountBaseFacade>(
      ACCOUNT_FACADE_TOKEN,
    );
    this.productFacade = container.get<IProductBaseFacade>(
      PRODUCT_FACADE_TOKEN,
    );
  }

  async run(): Promise<void> {
    const rl = createInterface({ input, output });
    let exit = false;

    while (!exit) {
      console.log('\n=== Console ===');
      console.log('1. Invoke create account');
      console.log('2. Invoke create account (gRPC)');
      console.log('3. Get paged accounts');
      console.log('4. Invoke create product');
      console.log('5. Get paged products');
      console.log('6. Invoke create account with products (saga)');
      console.log('0. Exit');

      const choice = (await rl.question('Select option: ')).trim();

      switch (choice) {
        case '1':
          await this.handleInvokeAccount();
          break;
        case '2':
          await this.handleInvokeAccountGrpc();
          break;
        case '3':
          await this.handleGetPagedAccounts();
          break;
        case '4':
          await this.handleInvokeProduct();
          break;
        case '5':
          await this.handleGetPagedProducts();
          break;
        case '6':
          await this.handleInvokeAccountWithProducts();
          break;
        case '0':
          exit = true;
          break;
        default:
          console.log('Unknown option. Please try again.');
      }
    }

    rl.close();
  }

  private buildAccountPayload(): CreateAccountCommandContract {
    return {
      id: `account-${Date.now()}`,
      email: `user${Date.now()}@example.com`,
      displayName: 'Console Account',
      role: 'user',
    };
  }

  private buildProductPayload(): CreateProductCommandContract {
    return {
      id: `product-${Date.now()}`,
      name: 'Console sample product',
      priceCents: 1999,
    };
  }

  private buildAccountWithProductsPayload(): CreateAccountWithProductsCommandContract {
    const accountId = `account-${Date.now()}`;
    const productId = `product-${Date.now()}`;
    return {
      commandId: `account-saga-${Date.now()}`,
      account: {
        id: accountId,
        email: `user${Date.now()}@example.com`,
        displayName: 'Console Account (saga)',
        role: 'user',
      },
      products: [
        {
          id: productId,
          name: 'Saga sample product',
          priceCents: 2999,
        },
      ],
    };
  }

  private async handleInvokeAccount(): Promise<void> {
    const payload = this.buildAccountPayload();
    console.log('Invoking CreateAccountCommand with payload:', payload);

    const result = await invokeCreateAccount(this.accountFacade, payload);
    this.logInvokeResult(result);
  }

  private async handleInvokeAccountGrpc(): Promise<void> {
    const payload = this.buildAccountPayload();
    console.log('Invoking CreateAccountCommand (gRPC) with payload:', payload);

    const result = await invokeCreateAccountGrpc(this.accountFacade, payload);
    this.logInvokeResult(result);
  }

  private async handleGetPagedAccounts(): Promise<void> {
    const pager: Pager = {
      pageSize: 5,
      cursor: undefined,
    };
    console.log('Fetching paged accounts with pager:', pager);

    const result = await invokeGetPagedAccounts(this.accountFacade, pager);
    this.logPagedAccountsResult(result);
  }

  private async handleInvokeProduct(): Promise<void> {
    const payload = this.buildProductPayload();
    console.log('Invoking CreateProductCommand with payload:', payload);

    const result = await invokeCreateProduct(this.productFacade, payload);
    this.logInvokeResult(result);
  }

  private async handleInvokeAccountWithProducts(): Promise<void> {
    const payload = this.buildAccountWithProductsPayload();
    console.log(
      'Invoking CreateAccountWithProductsCommand with payload:',
      payload,
    );

    const result = await invokeCreateAccountWithProducts(
      this.accountFacade,
      payload,
    );
    this.logInvokeResult(result);
  }

  private async handleGetPagedProducts(): Promise<void> {
    const pager: Pager = {
      pageSize: 5,
      cursor: undefined,
    };
    console.log('Fetching paged products with pager:', pager);

    const result = await invokeGetPagedProducts(this.productFacade, pager);
    this.logPagedProductsResult(result);
  }

  private logInvokeResult(
    result: Result<
      | CreateAccountResponseContract
      | CreateProductResponseContract
      | CreateAccountWithProductsResponseContract,
      BasicError
    >,
  ): void {
    if (isOk(result)) {
      console.log('Invoke succeeded. Created entity:', result.value);
    } else {
      console.error(
        `Invoke failed: [${result.error._type}] ${result.error.message}`
      );
    }
  }

  private logPagedProductsResult(
    result: Result<PagerResult<ProductContract>, BasicError>,
  ): void {
    if (isOk(result)) {
      const { data, cursor } = result.value;
      console.log(`Fetched ${data.length} products`);
      console.log(data);
      console.log('Next cursor:', cursor ?? 'none');
    } else {
      console.error(
        `Fetching products failed: [${result.error._type}] ${result.error.message}`,
      );
    }
  }

  private logPagedAccountsResult(
    result: Result<PagerResult<AccountContract>, BasicError>,
  ): void {
    if (isOk(result)) {
      const { data, cursor } = result.value;
      console.log(`Fetched ${data.length} accounts`);
      console.log(data);
      console.log('Next cursor:', cursor ?? 'none');
    } else {
      console.error(
        `Fetching accounts failed: [${result.error._type}] ${result.error.message}`,
      );
    }
  }
}

export const runConsole = async (container: Container): Promise<void> => {
  const app = new ConsoleApp(container);
  await app.run();
};
