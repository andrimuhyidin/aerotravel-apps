declare module 'midtrans-client' {
  export class Snap {
    constructor(config: { serverKey: string; clientKey: string; isProduction?: boolean });
    createTransaction(parameter: unknown): Promise<unknown>;
  }
  
  export class CoreApi {
    constructor(config: { serverKey: string; clientKey: string; isProduction?: boolean });
    charge(parameter: unknown): Promise<unknown>;
    transaction: {
      status(orderId: string): Promise<unknown>;
    };
  }
  
  export class MidtransClient {
    static Snap: typeof Snap;
    static CoreApi: typeof CoreApi;
  }
  
  export default MidtransClient;
}
