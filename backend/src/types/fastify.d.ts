import '@fastify/jwt';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: {
      id: string;
      email: string;
      name: string | null;
      isPro: boolean;
    };
    user: {
      id: string;
      email: string;
      name: string | null;
      isPro: boolean;
    };
  }
}
