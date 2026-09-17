
/**
 * Client
**/

import * as runtime from './runtime/client.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model Event
 * 
 */
export type Event = $Result.DefaultSelection<Prisma.$EventPayload>
/**
 * Model EventAttendee
 * 
 */
export type EventAttendee = $Result.DefaultSelection<Prisma.$EventAttendeePayload>
/**
 * Model EventWaitlist
 * 
 */
export type EventWaitlist = $Result.DefaultSelection<Prisma.$EventWaitlistPayload>
/**
 * Model EventInterest
 * 
 */
export type EventInterest = $Result.DefaultSelection<Prisma.$EventInterestPayload>

/**
 * Enums
 */
export namespace $Enums {
  export const EventMode: {
  ONLINE: 'ONLINE',
  OFFLINE: 'OFFLINE'
};

export type EventMode = (typeof EventMode)[keyof typeof EventMode]


export const EventRSVPStatus: {
  INTERESTED: 'INTERESTED',
  GOING: 'GOING',
  DECLINED: 'DECLINED'
};

export type EventRSVPStatus = (typeof EventRSVPStatus)[keyof typeof EventRSVPStatus]

}

export type EventMode = $Enums.EventMode

export const EventMode: typeof $Enums.EventMode

export type EventRSVPStatus = $Enums.EventRSVPStatus

export const EventRSVPStatus: typeof $Enums.EventRSVPStatus

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient({
 *   adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL })
 * })
 * // Fetch zero or more Events
 * const events = await prisma.event.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://pris.ly/d/client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  const U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient({
   *   adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL })
   * })
   * // Fetch zero or more Events
   * const events = await prisma.event.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://pris.ly/d/client).
   */

  constructor(optionsArg ?: Prisma.PrismaClientConstructorArgs<ClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/orm/prisma-client/queries/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>

  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.event`: Exposes CRUD operations for the **Event** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Events
    * const events = await prisma.event.findMany()
    * ```
    */
  get event(): Prisma.EventDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.eventAttendee`: Exposes CRUD operations for the **EventAttendee** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more EventAttendees
    * const eventAttendees = await prisma.eventAttendee.findMany()
    * ```
    */
  get eventAttendee(): Prisma.EventAttendeeDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.eventWaitlist`: Exposes CRUD operations for the **EventWaitlist** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more EventWaitlists
    * const eventWaitlists = await prisma.eventWaitlist.findMany()
    * ```
    */
  get eventWaitlist(): Prisma.EventWaitlistDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.eventInterest`: Exposes CRUD operations for the **EventInterest** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more EventInterests
    * const eventInterests = await prisma.eventInterest.findMany()
    * ```
    */
  get eventInterest(): Prisma.EventInterestDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 7.9.1
   * Query Engine version: e922089b7d7502aff4249d5da3420f6fa55fc6ad
   */
  export type PrismaVersion = {
    client: string
    engine: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import Bytes = runtime.Bytes
  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * Resolved type of the argument passed to the `PrismaClient` constructor.
   *
   * When called without a narrower options type (the common case), this resolves
   * to `PrismaClientOptions` directly, which produces a clear TypeScript error
   * message (`not assignable to parameter of type 'PrismaClientOptions'`) when
   * the argument is missing or incomplete. When the user supplies a narrower
   * options type (e.g. via a literal), it falls back to `Subset` to keep
   * filtering out unknown properties.
   */
  export type PrismaClientConstructorArgs<Options extends PrismaClientOptions> =
    [PrismaClientOptions] extends [Options] ? PrismaClientOptions : Subset<Options, PrismaClientOptions>;

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      ((Without<T, U> & U) | (Without<U, T> & T)) & object
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    Event: 'Event',
    EventAttendee: 'EventAttendee',
    EventWaitlist: 'EventWaitlist',
    EventInterest: 'EventInterest'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]



  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "event" | "eventAttendee" | "eventWaitlist" | "eventInterest"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      Event: {
        payload: Prisma.$EventPayload<ExtArgs>
        fields: Prisma.EventFieldRefs
        operations: {
          findUnique: {
            args: Prisma.EventFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.EventFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventPayload>
          }
          findFirst: {
            args: Prisma.EventFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.EventFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventPayload>
          }
          findMany: {
            args: Prisma.EventFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventPayload>[]
          }
          create: {
            args: Prisma.EventCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventPayload>
          }
          createMany: {
            args: Prisma.EventCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.EventCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventPayload>[]
          }
          delete: {
            args: Prisma.EventDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventPayload>
          }
          update: {
            args: Prisma.EventUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventPayload>
          }
          deleteMany: {
            args: Prisma.EventDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.EventUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.EventUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventPayload>[]
          }
          upsert: {
            args: Prisma.EventUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventPayload>
          }
          aggregate: {
            args: Prisma.EventAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateEvent>
          }
          groupBy: {
            args: Prisma.EventGroupByArgs<ExtArgs>
            result: $Utils.Optional<EventGroupByOutputType>[]
          }
          count: {
            args: Prisma.EventCountArgs<ExtArgs>
            result: $Utils.Optional<EventCountAggregateOutputType> | number
          }
        }
      }
      EventAttendee: {
        payload: Prisma.$EventAttendeePayload<ExtArgs>
        fields: Prisma.EventAttendeeFieldRefs
        operations: {
          findUnique: {
            args: Prisma.EventAttendeeFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventAttendeePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.EventAttendeeFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventAttendeePayload>
          }
          findFirst: {
            args: Prisma.EventAttendeeFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventAttendeePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.EventAttendeeFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventAttendeePayload>
          }
          findMany: {
            args: Prisma.EventAttendeeFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventAttendeePayload>[]
          }
          create: {
            args: Prisma.EventAttendeeCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventAttendeePayload>
          }
          createMany: {
            args: Prisma.EventAttendeeCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.EventAttendeeCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventAttendeePayload>[]
          }
          delete: {
            args: Prisma.EventAttendeeDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventAttendeePayload>
          }
          update: {
            args: Prisma.EventAttendeeUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventAttendeePayload>
          }
          deleteMany: {
            args: Prisma.EventAttendeeDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.EventAttendeeUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.EventAttendeeUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventAttendeePayload>[]
          }
          upsert: {
            args: Prisma.EventAttendeeUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventAttendeePayload>
          }
          aggregate: {
            args: Prisma.EventAttendeeAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateEventAttendee>
          }
          groupBy: {
            args: Prisma.EventAttendeeGroupByArgs<ExtArgs>
            result: $Utils.Optional<EventAttendeeGroupByOutputType>[]
          }
          count: {
            args: Prisma.EventAttendeeCountArgs<ExtArgs>
            result: $Utils.Optional<EventAttendeeCountAggregateOutputType> | number
          }
        }
      }
      EventWaitlist: {
        payload: Prisma.$EventWaitlistPayload<ExtArgs>
        fields: Prisma.EventWaitlistFieldRefs
        operations: {
          findUnique: {
            args: Prisma.EventWaitlistFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventWaitlistPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.EventWaitlistFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventWaitlistPayload>
          }
          findFirst: {
            args: Prisma.EventWaitlistFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventWaitlistPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.EventWaitlistFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventWaitlistPayload>
          }
          findMany: {
            args: Prisma.EventWaitlistFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventWaitlistPayload>[]
          }
          create: {
            args: Prisma.EventWaitlistCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventWaitlistPayload>
          }
          createMany: {
            args: Prisma.EventWaitlistCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.EventWaitlistCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventWaitlistPayload>[]
          }
          delete: {
            args: Prisma.EventWaitlistDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventWaitlistPayload>
          }
          update: {
            args: Prisma.EventWaitlistUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventWaitlistPayload>
          }
          deleteMany: {
            args: Prisma.EventWaitlistDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.EventWaitlistUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.EventWaitlistUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventWaitlistPayload>[]
          }
          upsert: {
            args: Prisma.EventWaitlistUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventWaitlistPayload>
          }
          aggregate: {
            args: Prisma.EventWaitlistAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateEventWaitlist>
          }
          groupBy: {
            args: Prisma.EventWaitlistGroupByArgs<ExtArgs>
            result: $Utils.Optional<EventWaitlistGroupByOutputType>[]
          }
          count: {
            args: Prisma.EventWaitlistCountArgs<ExtArgs>
            result: $Utils.Optional<EventWaitlistCountAggregateOutputType> | number
          }
        }
      }
      EventInterest: {
        payload: Prisma.$EventInterestPayload<ExtArgs>
        fields: Prisma.EventInterestFieldRefs
        operations: {
          findUnique: {
            args: Prisma.EventInterestFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventInterestPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.EventInterestFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventInterestPayload>
          }
          findFirst: {
            args: Prisma.EventInterestFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventInterestPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.EventInterestFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventInterestPayload>
          }
          findMany: {
            args: Prisma.EventInterestFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventInterestPayload>[]
          }
          create: {
            args: Prisma.EventInterestCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventInterestPayload>
          }
          createMany: {
            args: Prisma.EventInterestCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.EventInterestCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventInterestPayload>[]
          }
          delete: {
            args: Prisma.EventInterestDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventInterestPayload>
          }
          update: {
            args: Prisma.EventInterestUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventInterestPayload>
          }
          deleteMany: {
            args: Prisma.EventInterestDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.EventInterestUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.EventInterestUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventInterestPayload>[]
          }
          upsert: {
            args: Prisma.EventInterestUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventInterestPayload>
          }
          aggregate: {
            args: Prisma.EventInterestAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateEventInterest>
          }
          groupBy: {
            args: Prisma.EventInterestGroupByArgs<ExtArgs>
            result: $Utils.Optional<EventInterestGroupByOutputType>[]
          }
          count: {
            args: Prisma.EventInterestCountArgs<ExtArgs>
            result: $Utils.Optional<EventInterestCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Shorthand for `emit: 'stdout'`
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events only
     * log: [
     *   { emit: 'event', level: 'query' },
     *   { emit: 'event', level: 'info' },
     *   { emit: 'event', level: 'warn' }
     *   { emit: 'event', level: 'error' }
     * ]
     * 
     * / Emit as events and log to stdout
     * og: [
     *  { emit: 'stdout', level: 'query' },
     *  { emit: 'stdout', level: 'info' },
     *  { emit: 'stdout', level: 'warn' }
     *  { emit: 'stdout', level: 'error' }
     * 
     * ```
     * Read more in our [docs](https://pris.ly/d/logging).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * A driver adapter that PrismaClient uses to connect to your database, such as the ones provided by `@prisma/adapter-pg`, `@prisma/adapter-libsql`, `@prisma/adapter-planetscale`, etc.
     * 
     * A driver adapter is **required** unless you connect to your database through Prisma Accelerate (in which case use `accelerateUrl` instead).
     * 
     * Learn more: https://pris.ly/d/driver-adapters
     * 
     * @example
     * ```ts
     * import { PrismaPg } from '@prisma/adapter-pg'
     * import { PrismaClient } from './generated/prisma/client'
     * 
     * const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
     * const prisma = new PrismaClient({ adapter })
     * ```
     */
    adapter?: runtime.SqlDriverAdapterFactory
    /**
     * The Prisma Accelerate connection URL. Use this option to connect to your database through Prisma Accelerate instead of using a driver adapter to connect directly.
     * 
     * Learn more: https://pris.ly/d/accelerate
     */
    accelerateUrl?: string
    /**
     * Global configuration for omitting model fields by default.
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
    /**
     * SQL commenter plugins that add metadata to SQL queries as comments.
     * Comments follow the sqlcommenter format: https://google.github.io/sqlcommenter/
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   adapter,
     *   comments: [
     *     traceContext(),
     *     queryInsights(),
     *   ],
     * })
     * ```
     */
    comments?: runtime.SqlCommenterPlugin[]
  }
  export type GlobalOmitConfig = {
    event?: EventOmit
    eventAttendee?: EventAttendeeOmit
    eventWaitlist?: EventWaitlistOmit
    eventInterest?: EventInterestOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type CheckIsLogLevel<T> = T extends LogLevel ? T : never;

  export type GetLogType<T> = CheckIsLogLevel<
    T extends LogDefinition ? T['level'] : T
  >;

  export type GetEvents<T extends any[]> = T extends Array<LogLevel | LogDefinition>
    ? GetLogType<T[number]>
    : never;

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type EventCountOutputType
   */

  export type EventCountOutputType = {
    attendees: number
    waitlist: number
    interests: number
  }

  export type EventCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    attendees?: boolean | EventCountOutputTypeCountAttendeesArgs
    waitlist?: boolean | EventCountOutputTypeCountWaitlistArgs
    interests?: boolean | EventCountOutputTypeCountInterestsArgs
  }

  // Custom InputTypes
  /**
   * EventCountOutputType without action
   */
  export type EventCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventCountOutputType
     */
    select?: EventCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * EventCountOutputType without action
   */
  export type EventCountOutputTypeCountAttendeesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: EventAttendeeWhereInput
  }

  /**
   * EventCountOutputType without action
   */
  export type EventCountOutputTypeCountWaitlistArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: EventWaitlistWhereInput
  }

  /**
   * EventCountOutputType without action
   */
  export type EventCountOutputTypeCountInterestsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: EventInterestWhereInput
  }


  /**
   * Models
   */

  /**
   * Model Event
   */

  export type AggregateEvent = {
    _count: EventCountAggregateOutputType | null
    _avg: EventAvgAggregateOutputType | null
    _sum: EventSumAggregateOutputType | null
    _min: EventMinAggregateOutputType | null
    _max: EventMaxAggregateOutputType | null
  }

  export type EventAvgAggregateOutputType = {
    capacity: number | null
  }

  export type EventSumAggregateOutputType = {
    capacity: number | null
  }

  export type EventMinAggregateOutputType = {
    id: string | null
    title: string | null
    description: string | null
    organizerId: string | null
    startAt: Date | null
    endAt: Date | null
    mode: $Enums.EventMode | null
    meetingUrl: string | null
    platform: string | null
    joinUrl: string | null
    venue: string | null
    location: string | null
    capacity: number | null
    bannerImageUrl: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type EventMaxAggregateOutputType = {
    id: string | null
    title: string | null
    description: string | null
    organizerId: string | null
    startAt: Date | null
    endAt: Date | null
    mode: $Enums.EventMode | null
    meetingUrl: string | null
    platform: string | null
    joinUrl: string | null
    venue: string | null
    location: string | null
    capacity: number | null
    bannerImageUrl: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type EventCountAggregateOutputType = {
    id: number
    title: number
    description: number
    organizerId: number
    startAt: number
    endAt: number
    mode: number
    meetingUrl: number
    platform: number
    joinUrl: number
    venue: number
    location: number
    capacity: number
    bannerImageUrl: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type EventAvgAggregateInputType = {
    capacity?: true
  }

  export type EventSumAggregateInputType = {
    capacity?: true
  }

  export type EventMinAggregateInputType = {
    id?: true
    title?: true
    description?: true
    organizerId?: true
    startAt?: true
    endAt?: true
    mode?: true
    meetingUrl?: true
    platform?: true
    joinUrl?: true
    venue?: true
    location?: true
    capacity?: true
    bannerImageUrl?: true
    createdAt?: true
    updatedAt?: true
  }

  export type EventMaxAggregateInputType = {
    id?: true
    title?: true
    description?: true
    organizerId?: true
    startAt?: true
    endAt?: true
    mode?: true
    meetingUrl?: true
    platform?: true
    joinUrl?: true
    venue?: true
    location?: true
    capacity?: true
    bannerImageUrl?: true
    createdAt?: true
    updatedAt?: true
  }

  export type EventCountAggregateInputType = {
    id?: true
    title?: true
    description?: true
    organizerId?: true
    startAt?: true
    endAt?: true
    mode?: true
    meetingUrl?: true
    platform?: true
    joinUrl?: true
    venue?: true
    location?: true
    capacity?: true
    bannerImageUrl?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type EventAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Event to aggregate.
     */
    where?: EventWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Events to fetch.
     */
    orderBy?: EventOrderByWithRelationInput | EventOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: EventWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Events from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Events.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Events
    **/
    _count?: true | EventCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: EventAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: EventSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: EventMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: EventMaxAggregateInputType
  }

  export type GetEventAggregateType<T extends EventAggregateArgs> = {
        [P in keyof T & keyof AggregateEvent]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateEvent[P]>
      : GetScalarType<T[P], AggregateEvent[P]>
  }




  export type EventGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: EventWhereInput
    orderBy?: EventOrderByWithAggregationInput | EventOrderByWithAggregationInput[]
    by: EventScalarFieldEnum[] | EventScalarFieldEnum
    having?: EventScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: EventCountAggregateInputType | true
    _avg?: EventAvgAggregateInputType
    _sum?: EventSumAggregateInputType
    _min?: EventMinAggregateInputType
    _max?: EventMaxAggregateInputType
  }

  export type EventGroupByOutputType = {
    id: string
    title: string
    description: string | null
    organizerId: string
    startAt: Date
    endAt: Date
    mode: $Enums.EventMode
    meetingUrl: string | null
    platform: string | null
    joinUrl: string | null
    venue: string | null
    location: string | null
    capacity: number | null
    bannerImageUrl: string | null
    createdAt: Date
    updatedAt: Date
    _count: EventCountAggregateOutputType | null
    _avg: EventAvgAggregateOutputType | null
    _sum: EventSumAggregateOutputType | null
    _min: EventMinAggregateOutputType | null
    _max: EventMaxAggregateOutputType | null
  }

  type GetEventGroupByPayload<T extends EventGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<EventGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof EventGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], EventGroupByOutputType[P]>
            : GetScalarType<T[P], EventGroupByOutputType[P]>
        }
      >
    >


  export type EventSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    title?: boolean
    description?: boolean
    organizerId?: boolean
    startAt?: boolean
    endAt?: boolean
    mode?: boolean
    meetingUrl?: boolean
    platform?: boolean
    joinUrl?: boolean
    venue?: boolean
    location?: boolean
    capacity?: boolean
    bannerImageUrl?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    attendees?: boolean | Event$attendeesArgs<ExtArgs>
    waitlist?: boolean | Event$waitlistArgs<ExtArgs>
    interests?: boolean | Event$interestsArgs<ExtArgs>
    _count?: boolean | EventCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["event"]>

  export type EventSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    title?: boolean
    description?: boolean
    organizerId?: boolean
    startAt?: boolean
    endAt?: boolean
    mode?: boolean
    meetingUrl?: boolean
    platform?: boolean
    joinUrl?: boolean
    venue?: boolean
    location?: boolean
    capacity?: boolean
    bannerImageUrl?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["event"]>

  export type EventSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    title?: boolean
    description?: boolean
    organizerId?: boolean
    startAt?: boolean
    endAt?: boolean
    mode?: boolean
    meetingUrl?: boolean
    platform?: boolean
    joinUrl?: boolean
    venue?: boolean
    location?: boolean
    capacity?: boolean
    bannerImageUrl?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["event"]>

  export type EventSelectScalar = {
    id?: boolean
    title?: boolean
    description?: boolean
    organizerId?: boolean
    startAt?: boolean
    endAt?: boolean
    mode?: boolean
    meetingUrl?: boolean
    platform?: boolean
    joinUrl?: boolean
    venue?: boolean
    location?: boolean
    capacity?: boolean
    bannerImageUrl?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type EventOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "title" | "description" | "organizerId" | "startAt" | "endAt" | "mode" | "meetingUrl" | "platform" | "joinUrl" | "venue" | "location" | "capacity" | "bannerImageUrl" | "createdAt" | "updatedAt", ExtArgs["result"]["event"]>
  export type EventInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    attendees?: boolean | Event$attendeesArgs<ExtArgs>
    waitlist?: boolean | Event$waitlistArgs<ExtArgs>
    interests?: boolean | Event$interestsArgs<ExtArgs>
    _count?: boolean | EventCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type EventIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type EventIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $EventPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Event"
    objects: {
      attendees: Prisma.$EventAttendeePayload<ExtArgs>[]
      waitlist: Prisma.$EventWaitlistPayload<ExtArgs>[]
      interests: Prisma.$EventInterestPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      title: string
      description: string | null
      organizerId: string
      startAt: Date
      endAt: Date
      mode: $Enums.EventMode
      meetingUrl: string | null
      platform: string | null
      joinUrl: string | null
      venue: string | null
      location: string | null
      capacity: number | null
      bannerImageUrl: string | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["event"]>
    composites: {}
  }

  type EventGetPayload<S extends boolean | null | undefined | EventDefaultArgs> = $Result.GetResult<Prisma.$EventPayload, S>

  type EventCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<EventFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: EventCountAggregateInputType | true
    }

  export interface EventDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Event'], meta: { name: 'Event' } }
    /**
     * Find zero or one Event that matches the filter.
     * @param {EventFindUniqueArgs} args - Arguments to find a Event
     * @example
     * // Get one Event
     * const event = await prisma.event.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends EventFindUniqueArgs>(args: SelectSubset<T, EventFindUniqueArgs<ExtArgs>>): Prisma__EventClient<$Result.GetResult<Prisma.$EventPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Event that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {EventFindUniqueOrThrowArgs} args - Arguments to find a Event
     * @example
     * // Get one Event
     * const event = await prisma.event.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends EventFindUniqueOrThrowArgs>(args: SelectSubset<T, EventFindUniqueOrThrowArgs<ExtArgs>>): Prisma__EventClient<$Result.GetResult<Prisma.$EventPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Event that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EventFindFirstArgs} args - Arguments to find a Event
     * @example
     * // Get one Event
     * const event = await prisma.event.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends EventFindFirstArgs>(args?: SelectSubset<T, EventFindFirstArgs<ExtArgs>>): Prisma__EventClient<$Result.GetResult<Prisma.$EventPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Event that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EventFindFirstOrThrowArgs} args - Arguments to find a Event
     * @example
     * // Get one Event
     * const event = await prisma.event.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends EventFindFirstOrThrowArgs>(args?: SelectSubset<T, EventFindFirstOrThrowArgs<ExtArgs>>): Prisma__EventClient<$Result.GetResult<Prisma.$EventPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Events that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EventFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Events
     * const events = await prisma.event.findMany()
     * 
     * // Get first 10 Events
     * const events = await prisma.event.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const eventWithIdOnly = await prisma.event.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends EventFindManyArgs>(args?: SelectSubset<T, EventFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$EventPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Event.
     * @param {EventCreateArgs} args - Arguments to create a Event.
     * @example
     * // Create one Event
     * const Event = await prisma.event.create({
     *   data: {
     *     // ... data to create a Event
     *   }
     * })
     * 
     */
    create<T extends EventCreateArgs>(args: SelectSubset<T, EventCreateArgs<ExtArgs>>): Prisma__EventClient<$Result.GetResult<Prisma.$EventPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Events.
     * @param {EventCreateManyArgs} args - Arguments to create many Events.
     * @example
     * // Create many Events
     * const event = await prisma.event.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends EventCreateManyArgs>(args?: SelectSubset<T, EventCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Events and returns the data saved in the database.
     * @param {EventCreateManyAndReturnArgs} args - Arguments to create many Events.
     * @example
     * // Create many Events
     * const event = await prisma.event.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Events and only return the `id`
     * const eventWithIdOnly = await prisma.event.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends EventCreateManyAndReturnArgs>(args?: SelectSubset<T, EventCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$EventPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Event.
     * @param {EventDeleteArgs} args - Arguments to delete one Event.
     * @example
     * // Delete one Event
     * const Event = await prisma.event.delete({
     *   where: {
     *     // ... filter to delete one Event
     *   }
     * })
     * 
     */
    delete<T extends EventDeleteArgs>(args: SelectSubset<T, EventDeleteArgs<ExtArgs>>): Prisma__EventClient<$Result.GetResult<Prisma.$EventPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Event.
     * @param {EventUpdateArgs} args - Arguments to update one Event.
     * @example
     * // Update one Event
     * const event = await prisma.event.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends EventUpdateArgs>(args: SelectSubset<T, EventUpdateArgs<ExtArgs>>): Prisma__EventClient<$Result.GetResult<Prisma.$EventPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Events.
     * @param {EventDeleteManyArgs} args - Arguments to filter Events to delete.
     * @example
     * // Delete a few Events
     * const { count } = await prisma.event.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends EventDeleteManyArgs>(args?: SelectSubset<T, EventDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Events.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EventUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Events
     * const event = await prisma.event.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends EventUpdateManyArgs>(args: SelectSubset<T, EventUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Events and returns the data updated in the database.
     * @param {EventUpdateManyAndReturnArgs} args - Arguments to update many Events.
     * @example
     * // Update many Events
     * const event = await prisma.event.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Events and only return the `id`
     * const eventWithIdOnly = await prisma.event.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends EventUpdateManyAndReturnArgs>(args: SelectSubset<T, EventUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$EventPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Event.
     * @param {EventUpsertArgs} args - Arguments to update or create a Event.
     * @example
     * // Update or create a Event
     * const event = await prisma.event.upsert({
     *   create: {
     *     // ... data to create a Event
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Event we want to update
     *   }
     * })
     */
    upsert<T extends EventUpsertArgs>(args: SelectSubset<T, EventUpsertArgs<ExtArgs>>): Prisma__EventClient<$Result.GetResult<Prisma.$EventPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Events.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EventCountArgs} args - Arguments to filter Events to count.
     * @example
     * // Count the number of Events
     * const count = await prisma.event.count({
     *   where: {
     *     // ... the filter for the Events we want to count
     *   }
     * })
    **/
    count<T extends EventCountArgs>(
      args?: Subset<T, EventCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], EventCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Event.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EventAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends EventAggregateArgs>(args: Subset<T, EventAggregateArgs>): Prisma.PrismaPromise<GetEventAggregateType<T>>

    /**
     * Group by Event.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EventGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends EventGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: EventGroupByArgs['orderBy'] }
        : { orderBy?: EventGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, EventGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetEventGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Event model
   */
  readonly fields: EventFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Event.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__EventClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    attendees<T extends Event$attendeesArgs<ExtArgs> = {}>(args?: Subset<T, Event$attendeesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$EventAttendeePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    waitlist<T extends Event$waitlistArgs<ExtArgs> = {}>(args?: Subset<T, Event$waitlistArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$EventWaitlistPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    interests<T extends Event$interestsArgs<ExtArgs> = {}>(args?: Subset<T, Event$interestsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$EventInterestPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Event model
   */
  interface EventFieldRefs {
    readonly id: FieldRef<"Event", 'String'>
    readonly title: FieldRef<"Event", 'String'>
    readonly description: FieldRef<"Event", 'String'>
    readonly organizerId: FieldRef<"Event", 'String'>
    readonly startAt: FieldRef<"Event", 'DateTime'>
    readonly endAt: FieldRef<"Event", 'DateTime'>
    readonly mode: FieldRef<"Event", 'EventMode'>
    readonly meetingUrl: FieldRef<"Event", 'String'>
    readonly platform: FieldRef<"Event", 'String'>
    readonly joinUrl: FieldRef<"Event", 'String'>
    readonly venue: FieldRef<"Event", 'String'>
    readonly location: FieldRef<"Event", 'String'>
    readonly capacity: FieldRef<"Event", 'Int'>
    readonly bannerImageUrl: FieldRef<"Event", 'String'>
    readonly createdAt: FieldRef<"Event", 'DateTime'>
    readonly updatedAt: FieldRef<"Event", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Event findUnique
   */
  export type EventFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Event
     */
    select?: EventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Event
     */
    omit?: EventOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EventInclude<ExtArgs> | null
    /**
     * Filter, which Event to fetch.
     */
    where: EventWhereUniqueInput
  }

  /**
   * Event findUniqueOrThrow
   */
  export type EventFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Event
     */
    select?: EventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Event
     */
    omit?: EventOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EventInclude<ExtArgs> | null
    /**
     * Filter, which Event to fetch.
     */
    where: EventWhereUniqueInput
  }

  /**
   * Event findFirst
   */
  export type EventFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Event
     */
    select?: EventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Event
     */
    omit?: EventOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EventInclude<ExtArgs> | null
    /**
     * Filter, which Event to fetch.
     */
    where?: EventWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Events to fetch.
     */
    orderBy?: EventOrderByWithRelationInput | EventOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Events.
     */
    cursor?: EventWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Events from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Events.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Events.
     */
    distinct?: EventScalarFieldEnum | EventScalarFieldEnum[]
  }

  /**
   * Event findFirstOrThrow
   */
  export type EventFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Event
     */
    select?: EventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Event
     */
    omit?: EventOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EventInclude<ExtArgs> | null
    /**
     * Filter, which Event to fetch.
     */
    where?: EventWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Events to fetch.
     */
    orderBy?: EventOrderByWithRelationInput | EventOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Events.
     */
    cursor?: EventWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Events from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Events.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Events.
     */
    distinct?: EventScalarFieldEnum | EventScalarFieldEnum[]
  }

  /**
   * Event findMany
   */
  export type EventFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Event
     */
    select?: EventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Event
     */
    omit?: EventOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EventInclude<ExtArgs> | null
    /**
     * Filter, which Events to fetch.
     */
    where?: EventWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Events to fetch.
     */
    orderBy?: EventOrderByWithRelationInput | EventOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Events.
     */
    cursor?: EventWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Events from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Events.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Events.
     */
    distinct?: EventScalarFieldEnum | EventScalarFieldEnum[]
  }

  /**
   * Event create
   */
  export type EventCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Event
     */
    select?: EventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Event
     */
    omit?: EventOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EventInclude<ExtArgs> | null
    /**
     * The data needed to create a Event.
     */
    data: XOR<EventCreateInput, EventUncheckedCreateInput>
  }

  /**
   * Event createMany
   */
  export type EventCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Events.
     */
    data: EventCreateManyInput | EventCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Event createManyAndReturn
   */
  export type EventCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Event
     */
    select?: EventSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Event
     */
    omit?: EventOmit<ExtArgs> | null
    /**
     * The data used to create many Events.
     */
    data: EventCreateManyInput | EventCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Event update
   */
  export type EventUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Event
     */
    select?: EventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Event
     */
    omit?: EventOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EventInclude<ExtArgs> | null
    /**
     * The data needed to update a Event.
     */
    data: XOR<EventUpdateInput, EventUncheckedUpdateInput>
    /**
     * Choose, which Event to update.
     */
    where: EventWhereUniqueInput
  }

  /**
   * Event updateMany
   */
  export type EventUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Events.
     */
    data: XOR<EventUpdateManyMutationInput, EventUncheckedUpdateManyInput>
    /**
     * Filter which Events to update
     */
    where?: EventWhereInput
    /**
     * Limit how many Events to update.
     */
    limit?: number
  }

  /**
   * Event updateManyAndReturn
   */
  export type EventUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Event
     */
    select?: EventSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Event
     */
    omit?: EventOmit<ExtArgs> | null
    /**
     * The data used to update Events.
     */
    data: XOR<EventUpdateManyMutationInput, EventUncheckedUpdateManyInput>
    /**
     * Filter which Events to update
     */
    where?: EventWhereInput
    /**
     * Limit how many Events to update.
     */
    limit?: number
  }

  /**
   * Event upsert
   */
  export type EventUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Event
     */
    select?: EventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Event
     */
    omit?: EventOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EventInclude<ExtArgs> | null
    /**
     * The filter to search for the Event to update in case it exists.
     */
    where: EventWhereUniqueInput
    /**
     * In case the Event found by the `where` argument doesn't exist, create a new Event with this data.
     */
    create: XOR<EventCreateInput, EventUncheckedCreateInput>
    /**
     * In case the Event was found with the provided `where` argument, update it with this data.
     */
    update: XOR<EventUpdateInput, EventUncheckedUpdateInput>
  }

  /**
   * Event delete
   */
  export type EventDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Event
     */
    select?: EventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Event
     */
    omit?: EventOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EventInclude<ExtArgs> | null
    /**
     * Filter which Event to delete.
     */
    where: EventWhereUniqueInput
  }

  /**
   * Event deleteMany
   */
  export type EventDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Events to delete
     */
    where?: EventWhereInput
    /**
     * Limit how many Events to delete.
     */
    limit?: number
  }

  /**
   * Event.attendees
   */
  export type Event$attendeesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventAttendee
     */
    select?: EventAttendeeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EventAttendee
     */
    omit?: EventAttendeeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EventAttendeeInclude<ExtArgs> | null
    where?: EventAttendeeWhereInput
    orderBy?: EventAttendeeOrderByWithRelationInput | EventAttendeeOrderByWithRelationInput[]
    cursor?: EventAttendeeWhereUniqueInput
    take?: number
    skip?: number
    distinct?: EventAttendeeScalarFieldEnum | EventAttendeeScalarFieldEnum[]
  }

  /**
   * Event.waitlist
   */
  export type Event$waitlistArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventWaitlist
     */
    select?: EventWaitlistSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EventWaitlist
     */
    omit?: EventWaitlistOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EventWaitlistInclude<ExtArgs> | null
    where?: EventWaitlistWhereInput
    orderBy?: EventWaitlistOrderByWithRelationInput | EventWaitlistOrderByWithRelationInput[]
    cursor?: EventWaitlistWhereUniqueInput
    take?: number
    skip?: number
    distinct?: EventWaitlistScalarFieldEnum | EventWaitlistScalarFieldEnum[]
  }

  /**
   * Event.interests
   */
  export type Event$interestsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventInterest
     */
    select?: EventInterestSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EventInterest
     */
    omit?: EventInterestOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EventInterestInclude<ExtArgs> | null
    where?: EventInterestWhereInput
    orderBy?: EventInterestOrderByWithRelationInput | EventInterestOrderByWithRelationInput[]
    cursor?: EventInterestWhereUniqueInput
    take?: number
    skip?: number
    distinct?: EventInterestScalarFieldEnum | EventInterestScalarFieldEnum[]
  }

  /**
   * Event without action
   */
  export type EventDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Event
     */
    select?: EventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Event
     */
    omit?: EventOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EventInclude<ExtArgs> | null
  }


  /**
   * Model EventAttendee
   */

  export type AggregateEventAttendee = {
    _count: EventAttendeeCountAggregateOutputType | null
    _min: EventAttendeeMinAggregateOutputType | null
    _max: EventAttendeeMaxAggregateOutputType | null
  }

  export type EventAttendeeMinAggregateOutputType = {
    id: string | null
    eventId: string | null
    userId: string | null
    rsvpStatus: $Enums.EventRSVPStatus | null
    joinedAt: Date | null
  }

  export type EventAttendeeMaxAggregateOutputType = {
    id: string | null
    eventId: string | null
    userId: string | null
    rsvpStatus: $Enums.EventRSVPStatus | null
    joinedAt: Date | null
  }

  export type EventAttendeeCountAggregateOutputType = {
    id: number
    eventId: number
    userId: number
    rsvpStatus: number
    joinedAt: number
    _all: number
  }


  export type EventAttendeeMinAggregateInputType = {
    id?: true
    eventId?: true
    userId?: true
    rsvpStatus?: true
    joinedAt?: true
  }

  export type EventAttendeeMaxAggregateInputType = {
    id?: true
    eventId?: true
    userId?: true
    rsvpStatus?: true
    joinedAt?: true
  }

  export type EventAttendeeCountAggregateInputType = {
    id?: true
    eventId?: true
    userId?: true
    rsvpStatus?: true
    joinedAt?: true
    _all?: true
  }

  export type EventAttendeeAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which EventAttendee to aggregate.
     */
    where?: EventAttendeeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of EventAttendees to fetch.
     */
    orderBy?: EventAttendeeOrderByWithRelationInput | EventAttendeeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: EventAttendeeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` EventAttendees from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` EventAttendees.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned EventAttendees
    **/
    _count?: true | EventAttendeeCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: EventAttendeeMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: EventAttendeeMaxAggregateInputType
  }

  export type GetEventAttendeeAggregateType<T extends EventAttendeeAggregateArgs> = {
        [P in keyof T & keyof AggregateEventAttendee]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateEventAttendee[P]>
      : GetScalarType<T[P], AggregateEventAttendee[P]>
  }




  export type EventAttendeeGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: EventAttendeeWhereInput
    orderBy?: EventAttendeeOrderByWithAggregationInput | EventAttendeeOrderByWithAggregationInput[]
    by: EventAttendeeScalarFieldEnum[] | EventAttendeeScalarFieldEnum
    having?: EventAttendeeScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: EventAttendeeCountAggregateInputType | true
    _min?: EventAttendeeMinAggregateInputType
    _max?: EventAttendeeMaxAggregateInputType
  }

  export type EventAttendeeGroupByOutputType = {
    id: string
    eventId: string
    userId: string
    rsvpStatus: $Enums.EventRSVPStatus
    joinedAt: Date
    _count: EventAttendeeCountAggregateOutputType | null
    _min: EventAttendeeMinAggregateOutputType | null
    _max: EventAttendeeMaxAggregateOutputType | null
  }

  type GetEventAttendeeGroupByPayload<T extends EventAttendeeGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<EventAttendeeGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof EventAttendeeGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], EventAttendeeGroupByOutputType[P]>
            : GetScalarType<T[P], EventAttendeeGroupByOutputType[P]>
        }
      >
    >


  export type EventAttendeeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    eventId?: boolean
    userId?: boolean
    rsvpStatus?: boolean
    joinedAt?: boolean
    event?: boolean | EventDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["eventAttendee"]>

  export type EventAttendeeSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    eventId?: boolean
    userId?: boolean
    rsvpStatus?: boolean
    joinedAt?: boolean
    event?: boolean | EventDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["eventAttendee"]>

  export type EventAttendeeSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    eventId?: boolean
    userId?: boolean
    rsvpStatus?: boolean
    joinedAt?: boolean
    event?: boolean | EventDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["eventAttendee"]>

  export type EventAttendeeSelectScalar = {
    id?: boolean
    eventId?: boolean
    userId?: boolean
    rsvpStatus?: boolean
    joinedAt?: boolean
  }

  export type EventAttendeeOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "eventId" | "userId" | "rsvpStatus" | "joinedAt", ExtArgs["result"]["eventAttendee"]>
  export type EventAttendeeInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    event?: boolean | EventDefaultArgs<ExtArgs>
  }
  export type EventAttendeeIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    event?: boolean | EventDefaultArgs<ExtArgs>
  }
  export type EventAttendeeIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    event?: boolean | EventDefaultArgs<ExtArgs>
  }

  export type $EventAttendeePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "EventAttendee"
    objects: {
      event: Prisma.$EventPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      eventId: string
      userId: string
      rsvpStatus: $Enums.EventRSVPStatus
      joinedAt: Date
    }, ExtArgs["result"]["eventAttendee"]>
    composites: {}
  }

  type EventAttendeeGetPayload<S extends boolean | null | undefined | EventAttendeeDefaultArgs> = $Result.GetResult<Prisma.$EventAttendeePayload, S>

  type EventAttendeeCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<EventAttendeeFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: EventAttendeeCountAggregateInputType | true
    }

  export interface EventAttendeeDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['EventAttendee'], meta: { name: 'EventAttendee' } }
    /**
     * Find zero or one EventAttendee that matches the filter.
     * @param {EventAttendeeFindUniqueArgs} args - Arguments to find a EventAttendee
     * @example
     * // Get one EventAttendee
     * const eventAttendee = await prisma.eventAttendee.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends EventAttendeeFindUniqueArgs>(args: SelectSubset<T, EventAttendeeFindUniqueArgs<ExtArgs>>): Prisma__EventAttendeeClient<$Result.GetResult<Prisma.$EventAttendeePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one EventAttendee that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {EventAttendeeFindUniqueOrThrowArgs} args - Arguments to find a EventAttendee
     * @example
     * // Get one EventAttendee
     * const eventAttendee = await prisma.eventAttendee.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends EventAttendeeFindUniqueOrThrowArgs>(args: SelectSubset<T, EventAttendeeFindUniqueOrThrowArgs<ExtArgs>>): Prisma__EventAttendeeClient<$Result.GetResult<Prisma.$EventAttendeePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first EventAttendee that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EventAttendeeFindFirstArgs} args - Arguments to find a EventAttendee
     * @example
     * // Get one EventAttendee
     * const eventAttendee = await prisma.eventAttendee.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends EventAttendeeFindFirstArgs>(args?: SelectSubset<T, EventAttendeeFindFirstArgs<ExtArgs>>): Prisma__EventAttendeeClient<$Result.GetResult<Prisma.$EventAttendeePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first EventAttendee that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EventAttendeeFindFirstOrThrowArgs} args - Arguments to find a EventAttendee
     * @example
     * // Get one EventAttendee
     * const eventAttendee = await prisma.eventAttendee.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends EventAttendeeFindFirstOrThrowArgs>(args?: SelectSubset<T, EventAttendeeFindFirstOrThrowArgs<ExtArgs>>): Prisma__EventAttendeeClient<$Result.GetResult<Prisma.$EventAttendeePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more EventAttendees that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EventAttendeeFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all EventAttendees
     * const eventAttendees = await prisma.eventAttendee.findMany()
     * 
     * // Get first 10 EventAttendees
     * const eventAttendees = await prisma.eventAttendee.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const eventAttendeeWithIdOnly = await prisma.eventAttendee.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends EventAttendeeFindManyArgs>(args?: SelectSubset<T, EventAttendeeFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$EventAttendeePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a EventAttendee.
     * @param {EventAttendeeCreateArgs} args - Arguments to create a EventAttendee.
     * @example
     * // Create one EventAttendee
     * const EventAttendee = await prisma.eventAttendee.create({
     *   data: {
     *     // ... data to create a EventAttendee
     *   }
     * })
     * 
     */
    create<T extends EventAttendeeCreateArgs>(args: SelectSubset<T, EventAttendeeCreateArgs<ExtArgs>>): Prisma__EventAttendeeClient<$Result.GetResult<Prisma.$EventAttendeePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many EventAttendees.
     * @param {EventAttendeeCreateManyArgs} args - Arguments to create many EventAttendees.
     * @example
     * // Create many EventAttendees
     * const eventAttendee = await prisma.eventAttendee.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends EventAttendeeCreateManyArgs>(args?: SelectSubset<T, EventAttendeeCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many EventAttendees and returns the data saved in the database.
     * @param {EventAttendeeCreateManyAndReturnArgs} args - Arguments to create many EventAttendees.
     * @example
     * // Create many EventAttendees
     * const eventAttendee = await prisma.eventAttendee.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many EventAttendees and only return the `id`
     * const eventAttendeeWithIdOnly = await prisma.eventAttendee.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends EventAttendeeCreateManyAndReturnArgs>(args?: SelectSubset<T, EventAttendeeCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$EventAttendeePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a EventAttendee.
     * @param {EventAttendeeDeleteArgs} args - Arguments to delete one EventAttendee.
     * @example
     * // Delete one EventAttendee
     * const EventAttendee = await prisma.eventAttendee.delete({
     *   where: {
     *     // ... filter to delete one EventAttendee
     *   }
     * })
     * 
     */
    delete<T extends EventAttendeeDeleteArgs>(args: SelectSubset<T, EventAttendeeDeleteArgs<ExtArgs>>): Prisma__EventAttendeeClient<$Result.GetResult<Prisma.$EventAttendeePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one EventAttendee.
     * @param {EventAttendeeUpdateArgs} args - Arguments to update one EventAttendee.
     * @example
     * // Update one EventAttendee
     * const eventAttendee = await prisma.eventAttendee.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends EventAttendeeUpdateArgs>(args: SelectSubset<T, EventAttendeeUpdateArgs<ExtArgs>>): Prisma__EventAttendeeClient<$Result.GetResult<Prisma.$EventAttendeePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more EventAttendees.
     * @param {EventAttendeeDeleteManyArgs} args - Arguments to filter EventAttendees to delete.
     * @example
     * // Delete a few EventAttendees
     * const { count } = await prisma.eventAttendee.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends EventAttendeeDeleteManyArgs>(args?: SelectSubset<T, EventAttendeeDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more EventAttendees.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EventAttendeeUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many EventAttendees
     * const eventAttendee = await prisma.eventAttendee.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends EventAttendeeUpdateManyArgs>(args: SelectSubset<T, EventAttendeeUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more EventAttendees and returns the data updated in the database.
     * @param {EventAttendeeUpdateManyAndReturnArgs} args - Arguments to update many EventAttendees.
     * @example
     * // Update many EventAttendees
     * const eventAttendee = await prisma.eventAttendee.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more EventAttendees and only return the `id`
     * const eventAttendeeWithIdOnly = await prisma.eventAttendee.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends EventAttendeeUpdateManyAndReturnArgs>(args: SelectSubset<T, EventAttendeeUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$EventAttendeePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one EventAttendee.
     * @param {EventAttendeeUpsertArgs} args - Arguments to update or create a EventAttendee.
     * @example
     * // Update or create a EventAttendee
     * const eventAttendee = await prisma.eventAttendee.upsert({
     *   create: {
     *     // ... data to create a EventAttendee
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the EventAttendee we want to update
     *   }
     * })
     */
    upsert<T extends EventAttendeeUpsertArgs>(args: SelectSubset<T, EventAttendeeUpsertArgs<ExtArgs>>): Prisma__EventAttendeeClient<$Result.GetResult<Prisma.$EventAttendeePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of EventAttendees.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EventAttendeeCountArgs} args - Arguments to filter EventAttendees to count.
     * @example
     * // Count the number of EventAttendees
     * const count = await prisma.eventAttendee.count({
     *   where: {
     *     // ... the filter for the EventAttendees we want to count
     *   }
     * })
    **/
    count<T extends EventAttendeeCountArgs>(
      args?: Subset<T, EventAttendeeCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], EventAttendeeCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a EventAttendee.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EventAttendeeAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends EventAttendeeAggregateArgs>(args: Subset<T, EventAttendeeAggregateArgs>): Prisma.PrismaPromise<GetEventAttendeeAggregateType<T>>

    /**
     * Group by EventAttendee.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EventAttendeeGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends EventAttendeeGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: EventAttendeeGroupByArgs['orderBy'] }
        : { orderBy?: EventAttendeeGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, EventAttendeeGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetEventAttendeeGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the EventAttendee model
   */
  readonly fields: EventAttendeeFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for EventAttendee.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__EventAttendeeClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    event<T extends EventDefaultArgs<ExtArgs> = {}>(args?: Subset<T, EventDefaultArgs<ExtArgs>>): Prisma__EventClient<$Result.GetResult<Prisma.$EventPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the EventAttendee model
   */
  interface EventAttendeeFieldRefs {
    readonly id: FieldRef<"EventAttendee", 'String'>
    readonly eventId: FieldRef<"EventAttendee", 'String'>
    readonly userId: FieldRef<"EventAttendee", 'String'>
    readonly rsvpStatus: FieldRef<"EventAttendee", 'EventRSVPStatus'>
    readonly joinedAt: FieldRef<"EventAttendee", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * EventAttendee findUnique
   */
  export type EventAttendeeFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventAttendee
     */
    select?: EventAttendeeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EventAttendee
     */
    omit?: EventAttendeeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EventAttendeeInclude<ExtArgs> | null
    /**
     * Filter, which EventAttendee to fetch.
     */
    where: EventAttendeeWhereUniqueInput
  }

  /**
   * EventAttendee findUniqueOrThrow
   */
  export type EventAttendeeFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventAttendee
     */
    select?: EventAttendeeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EventAttendee
     */
    omit?: EventAttendeeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EventAttendeeInclude<ExtArgs> | null
    /**
     * Filter, which EventAttendee to fetch.
     */
    where: EventAttendeeWhereUniqueInput
  }

  /**
   * EventAttendee findFirst
   */
  export type EventAttendeeFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventAttendee
     */
    select?: EventAttendeeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EventAttendee
     */
    omit?: EventAttendeeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EventAttendeeInclude<ExtArgs> | null
    /**
     * Filter, which EventAttendee to fetch.
     */
    where?: EventAttendeeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of EventAttendees to fetch.
     */
    orderBy?: EventAttendeeOrderByWithRelationInput | EventAttendeeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for EventAttendees.
     */
    cursor?: EventAttendeeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` EventAttendees from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` EventAttendees.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of EventAttendees.
     */
    distinct?: EventAttendeeScalarFieldEnum | EventAttendeeScalarFieldEnum[]
  }

  /**
   * EventAttendee findFirstOrThrow
   */
  export type EventAttendeeFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventAttendee
     */
    select?: EventAttendeeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EventAttendee
     */
    omit?: EventAttendeeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EventAttendeeInclude<ExtArgs> | null
    /**
     * Filter, which EventAttendee to fetch.
     */
    where?: EventAttendeeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of EventAttendees to fetch.
     */
    orderBy?: EventAttendeeOrderByWithRelationInput | EventAttendeeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for EventAttendees.
     */
    cursor?: EventAttendeeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` EventAttendees from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` EventAttendees.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of EventAttendees.
     */
    distinct?: EventAttendeeScalarFieldEnum | EventAttendeeScalarFieldEnum[]
  }

  /**
   * EventAttendee findMany
   */
  export type EventAttendeeFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventAttendee
     */
    select?: EventAttendeeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EventAttendee
     */
    omit?: EventAttendeeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EventAttendeeInclude<ExtArgs> | null
    /**
     * Filter, which EventAttendees to fetch.
     */
    where?: EventAttendeeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of EventAttendees to fetch.
     */
    orderBy?: EventAttendeeOrderByWithRelationInput | EventAttendeeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing EventAttendees.
     */
    cursor?: EventAttendeeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` EventAttendees from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` EventAttendees.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of EventAttendees.
     */
    distinct?: EventAttendeeScalarFieldEnum | EventAttendeeScalarFieldEnum[]
  }

  /**
   * EventAttendee create
   */
  export type EventAttendeeCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventAttendee
     */
    select?: EventAttendeeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EventAttendee
     */
    omit?: EventAttendeeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EventAttendeeInclude<ExtArgs> | null
    /**
     * The data needed to create a EventAttendee.
     */
    data: XOR<EventAttendeeCreateInput, EventAttendeeUncheckedCreateInput>
  }

  /**
   * EventAttendee createMany
   */
  export type EventAttendeeCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many EventAttendees.
     */
    data: EventAttendeeCreateManyInput | EventAttendeeCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * EventAttendee createManyAndReturn
   */
  export type EventAttendeeCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventAttendee
     */
    select?: EventAttendeeSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the EventAttendee
     */
    omit?: EventAttendeeOmit<ExtArgs> | null
    /**
     * The data used to create many EventAttendees.
     */
    data: EventAttendeeCreateManyInput | EventAttendeeCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EventAttendeeIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * EventAttendee update
   */
  export type EventAttendeeUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventAttendee
     */
    select?: EventAttendeeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EventAttendee
     */
    omit?: EventAttendeeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EventAttendeeInclude<ExtArgs> | null
    /**
     * The data needed to update a EventAttendee.
     */
    data: XOR<EventAttendeeUpdateInput, EventAttendeeUncheckedUpdateInput>
    /**
     * Choose, which EventAttendee to update.
     */
    where: EventAttendeeWhereUniqueInput
  }

  /**
   * EventAttendee updateMany
   */
  export type EventAttendeeUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update EventAttendees.
     */
    data: XOR<EventAttendeeUpdateManyMutationInput, EventAttendeeUncheckedUpdateManyInput>
    /**
     * Filter which EventAttendees to update
     */
    where?: EventAttendeeWhereInput
    /**
     * Limit how many EventAttendees to update.
     */
    limit?: number
  }

  /**
   * EventAttendee updateManyAndReturn
   */
  export type EventAttendeeUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventAttendee
     */
    select?: EventAttendeeSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the EventAttendee
     */
    omit?: EventAttendeeOmit<ExtArgs> | null
    /**
     * The data used to update EventAttendees.
     */
    data: XOR<EventAttendeeUpdateManyMutationInput, EventAttendeeUncheckedUpdateManyInput>
    /**
     * Filter which EventAttendees to update
     */
    where?: EventAttendeeWhereInput
    /**
     * Limit how many EventAttendees to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EventAttendeeIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * EventAttendee upsert
   */
  export type EventAttendeeUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventAttendee
     */
    select?: EventAttendeeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EventAttendee
     */
    omit?: EventAttendeeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EventAttendeeInclude<ExtArgs> | null
    /**
     * The filter to search for the EventAttendee to update in case it exists.
     */
    where: EventAttendeeWhereUniqueInput
    /**
     * In case the EventAttendee found by the `where` argument doesn't exist, create a new EventAttendee with this data.
     */
    create: XOR<EventAttendeeCreateInput, EventAttendeeUncheckedCreateInput>
    /**
     * In case the EventAttendee was found with the provided `where` argument, update it with this data.
     */
    update: XOR<EventAttendeeUpdateInput, EventAttendeeUncheckedUpdateInput>
  }

  /**
   * EventAttendee delete
   */
  export type EventAttendeeDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventAttendee
     */
    select?: EventAttendeeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EventAttendee
     */
    omit?: EventAttendeeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EventAttendeeInclude<ExtArgs> | null
    /**
     * Filter which EventAttendee to delete.
     */
    where: EventAttendeeWhereUniqueInput
  }

  /**
   * EventAttendee deleteMany
   */
  export type EventAttendeeDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which EventAttendees to delete
     */
    where?: EventAttendeeWhereInput
    /**
     * Limit how many EventAttendees to delete.
     */
    limit?: number
  }

  /**
   * EventAttendee without action
   */
  export type EventAttendeeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventAttendee
     */
    select?: EventAttendeeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EventAttendee
     */
    omit?: EventAttendeeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EventAttendeeInclude<ExtArgs> | null
  }


  /**
   * Model EventWaitlist
   */

  export type AggregateEventWaitlist = {
    _count: EventWaitlistCountAggregateOutputType | null
    _min: EventWaitlistMinAggregateOutputType | null
    _max: EventWaitlistMaxAggregateOutputType | null
  }

  export type EventWaitlistMinAggregateOutputType = {
    id: string | null
    eventId: string | null
    userId: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type EventWaitlistMaxAggregateOutputType = {
    id: string | null
    eventId: string | null
    userId: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type EventWaitlistCountAggregateOutputType = {
    id: number
    eventId: number
    userId: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type EventWaitlistMinAggregateInputType = {
    id?: true
    eventId?: true
    userId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type EventWaitlistMaxAggregateInputType = {
    id?: true
    eventId?: true
    userId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type EventWaitlistCountAggregateInputType = {
    id?: true
    eventId?: true
    userId?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type EventWaitlistAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which EventWaitlist to aggregate.
     */
    where?: EventWaitlistWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of EventWaitlists to fetch.
     */
    orderBy?: EventWaitlistOrderByWithRelationInput | EventWaitlistOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: EventWaitlistWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` EventWaitlists from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` EventWaitlists.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned EventWaitlists
    **/
    _count?: true | EventWaitlistCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: EventWaitlistMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: EventWaitlistMaxAggregateInputType
  }

  export type GetEventWaitlistAggregateType<T extends EventWaitlistAggregateArgs> = {
        [P in keyof T & keyof AggregateEventWaitlist]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateEventWaitlist[P]>
      : GetScalarType<T[P], AggregateEventWaitlist[P]>
  }




  export type EventWaitlistGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: EventWaitlistWhereInput
    orderBy?: EventWaitlistOrderByWithAggregationInput | EventWaitlistOrderByWithAggregationInput[]
    by: EventWaitlistScalarFieldEnum[] | EventWaitlistScalarFieldEnum
    having?: EventWaitlistScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: EventWaitlistCountAggregateInputType | true
    _min?: EventWaitlistMinAggregateInputType
    _max?: EventWaitlistMaxAggregateInputType
  }

  export type EventWaitlistGroupByOutputType = {
    id: string
    eventId: string
    userId: string
    createdAt: Date
    updatedAt: Date
    _count: EventWaitlistCountAggregateOutputType | null
    _min: EventWaitlistMinAggregateOutputType | null
    _max: EventWaitlistMaxAggregateOutputType | null
  }

  type GetEventWaitlistGroupByPayload<T extends EventWaitlistGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<EventWaitlistGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof EventWaitlistGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], EventWaitlistGroupByOutputType[P]>
            : GetScalarType<T[P], EventWaitlistGroupByOutputType[P]>
        }
      >
    >


  export type EventWaitlistSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    eventId?: boolean
    userId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    event?: boolean | EventDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["eventWaitlist"]>

  export type EventWaitlistSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    eventId?: boolean
    userId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    event?: boolean | EventDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["eventWaitlist"]>

  export type EventWaitlistSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    eventId?: boolean
    userId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    event?: boolean | EventDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["eventWaitlist"]>

  export type EventWaitlistSelectScalar = {
    id?: boolean
    eventId?: boolean
    userId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type EventWaitlistOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "eventId" | "userId" | "createdAt" | "updatedAt", ExtArgs["result"]["eventWaitlist"]>
  export type EventWaitlistInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    event?: boolean | EventDefaultArgs<ExtArgs>
  }
  export type EventWaitlistIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    event?: boolean | EventDefaultArgs<ExtArgs>
  }
  export type EventWaitlistIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    event?: boolean | EventDefaultArgs<ExtArgs>
  }

  export type $EventWaitlistPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "EventWaitlist"
    objects: {
      event: Prisma.$EventPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      eventId: string
      userId: string
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["eventWaitlist"]>
    composites: {}
  }

  type EventWaitlistGetPayload<S extends boolean | null | undefined | EventWaitlistDefaultArgs> = $Result.GetResult<Prisma.$EventWaitlistPayload, S>

  type EventWaitlistCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<EventWaitlistFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: EventWaitlistCountAggregateInputType | true
    }

  export interface EventWaitlistDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['EventWaitlist'], meta: { name: 'EventWaitlist' } }
    /**
     * Find zero or one EventWaitlist that matches the filter.
     * @param {EventWaitlistFindUniqueArgs} args - Arguments to find a EventWaitlist
     * @example
     * // Get one EventWaitlist
     * const eventWaitlist = await prisma.eventWaitlist.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends EventWaitlistFindUniqueArgs>(args: SelectSubset<T, EventWaitlistFindUniqueArgs<ExtArgs>>): Prisma__EventWaitlistClient<$Result.GetResult<Prisma.$EventWaitlistPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one EventWaitlist that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {EventWaitlistFindUniqueOrThrowArgs} args - Arguments to find a EventWaitlist
     * @example
     * // Get one EventWaitlist
     * const eventWaitlist = await prisma.eventWaitlist.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends EventWaitlistFindUniqueOrThrowArgs>(args: SelectSubset<T, EventWaitlistFindUniqueOrThrowArgs<ExtArgs>>): Prisma__EventWaitlistClient<$Result.GetResult<Prisma.$EventWaitlistPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first EventWaitlist that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EventWaitlistFindFirstArgs} args - Arguments to find a EventWaitlist
     * @example
     * // Get one EventWaitlist
     * const eventWaitlist = await prisma.eventWaitlist.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends EventWaitlistFindFirstArgs>(args?: SelectSubset<T, EventWaitlistFindFirstArgs<ExtArgs>>): Prisma__EventWaitlistClient<$Result.GetResult<Prisma.$EventWaitlistPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first EventWaitlist that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EventWaitlistFindFirstOrThrowArgs} args - Arguments to find a EventWaitlist
     * @example
     * // Get one EventWaitlist
     * const eventWaitlist = await prisma.eventWaitlist.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends EventWaitlistFindFirstOrThrowArgs>(args?: SelectSubset<T, EventWaitlistFindFirstOrThrowArgs<ExtArgs>>): Prisma__EventWaitlistClient<$Result.GetResult<Prisma.$EventWaitlistPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more EventWaitlists that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EventWaitlistFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all EventWaitlists
     * const eventWaitlists = await prisma.eventWaitlist.findMany()
     * 
     * // Get first 10 EventWaitlists
     * const eventWaitlists = await prisma.eventWaitlist.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const eventWaitlistWithIdOnly = await prisma.eventWaitlist.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends EventWaitlistFindManyArgs>(args?: SelectSubset<T, EventWaitlistFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$EventWaitlistPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a EventWaitlist.
     * @param {EventWaitlistCreateArgs} args - Arguments to create a EventWaitlist.
     * @example
     * // Create one EventWaitlist
     * const EventWaitlist = await prisma.eventWaitlist.create({
     *   data: {
     *     // ... data to create a EventWaitlist
     *   }
     * })
     * 
     */
    create<T extends EventWaitlistCreateArgs>(args: SelectSubset<T, EventWaitlistCreateArgs<ExtArgs>>): Prisma__EventWaitlistClient<$Result.GetResult<Prisma.$EventWaitlistPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many EventWaitlists.
     * @param {EventWaitlistCreateManyArgs} args - Arguments to create many EventWaitlists.
     * @example
     * // Create many EventWaitlists
     * const eventWaitlist = await prisma.eventWaitlist.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends EventWaitlistCreateManyArgs>(args?: SelectSubset<T, EventWaitlistCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many EventWaitlists and returns the data saved in the database.
     * @param {EventWaitlistCreateManyAndReturnArgs} args - Arguments to create many EventWaitlists.
     * @example
     * // Create many EventWaitlists
     * const eventWaitlist = await prisma.eventWaitlist.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many EventWaitlists and only return the `id`
     * const eventWaitlistWithIdOnly = await prisma.eventWaitlist.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends EventWaitlistCreateManyAndReturnArgs>(args?: SelectSubset<T, EventWaitlistCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$EventWaitlistPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a EventWaitlist.
     * @param {EventWaitlistDeleteArgs} args - Arguments to delete one EventWaitlist.
     * @example
     * // Delete one EventWaitlist
     * const EventWaitlist = await prisma.eventWaitlist.delete({
     *   where: {
     *     // ... filter to delete one EventWaitlist
     *   }
     * })
     * 
     */
    delete<T extends EventWaitlistDeleteArgs>(args: SelectSubset<T, EventWaitlistDeleteArgs<ExtArgs>>): Prisma__EventWaitlistClient<$Result.GetResult<Prisma.$EventWaitlistPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one EventWaitlist.
     * @param {EventWaitlistUpdateArgs} args - Arguments to update one EventWaitlist.
     * @example
     * // Update one EventWaitlist
     * const eventWaitlist = await prisma.eventWaitlist.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends EventWaitlistUpdateArgs>(args: SelectSubset<T, EventWaitlistUpdateArgs<ExtArgs>>): Prisma__EventWaitlistClient<$Result.GetResult<Prisma.$EventWaitlistPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more EventWaitlists.
     * @param {EventWaitlistDeleteManyArgs} args - Arguments to filter EventWaitlists to delete.
     * @example
     * // Delete a few EventWaitlists
     * const { count } = await prisma.eventWaitlist.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends EventWaitlistDeleteManyArgs>(args?: SelectSubset<T, EventWaitlistDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more EventWaitlists.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EventWaitlistUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many EventWaitlists
     * const eventWaitlist = await prisma.eventWaitlist.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends EventWaitlistUpdateManyArgs>(args: SelectSubset<T, EventWaitlistUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more EventWaitlists and returns the data updated in the database.
     * @param {EventWaitlistUpdateManyAndReturnArgs} args - Arguments to update many EventWaitlists.
     * @example
     * // Update many EventWaitlists
     * const eventWaitlist = await prisma.eventWaitlist.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more EventWaitlists and only return the `id`
     * const eventWaitlistWithIdOnly = await prisma.eventWaitlist.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends EventWaitlistUpdateManyAndReturnArgs>(args: SelectSubset<T, EventWaitlistUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$EventWaitlistPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one EventWaitlist.
     * @param {EventWaitlistUpsertArgs} args - Arguments to update or create a EventWaitlist.
     * @example
     * // Update or create a EventWaitlist
     * const eventWaitlist = await prisma.eventWaitlist.upsert({
     *   create: {
     *     // ... data to create a EventWaitlist
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the EventWaitlist we want to update
     *   }
     * })
     */
    upsert<T extends EventWaitlistUpsertArgs>(args: SelectSubset<T, EventWaitlistUpsertArgs<ExtArgs>>): Prisma__EventWaitlistClient<$Result.GetResult<Prisma.$EventWaitlistPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of EventWaitlists.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EventWaitlistCountArgs} args - Arguments to filter EventWaitlists to count.
     * @example
     * // Count the number of EventWaitlists
     * const count = await prisma.eventWaitlist.count({
     *   where: {
     *     // ... the filter for the EventWaitlists we want to count
     *   }
     * })
    **/
    count<T extends EventWaitlistCountArgs>(
      args?: Subset<T, EventWaitlistCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], EventWaitlistCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a EventWaitlist.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EventWaitlistAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends EventWaitlistAggregateArgs>(args: Subset<T, EventWaitlistAggregateArgs>): Prisma.PrismaPromise<GetEventWaitlistAggregateType<T>>

    /**
     * Group by EventWaitlist.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EventWaitlistGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends EventWaitlistGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: EventWaitlistGroupByArgs['orderBy'] }
        : { orderBy?: EventWaitlistGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, EventWaitlistGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetEventWaitlistGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the EventWaitlist model
   */
  readonly fields: EventWaitlistFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for EventWaitlist.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__EventWaitlistClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    event<T extends EventDefaultArgs<ExtArgs> = {}>(args?: Subset<T, EventDefaultArgs<ExtArgs>>): Prisma__EventClient<$Result.GetResult<Prisma.$EventPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the EventWaitlist model
   */
  interface EventWaitlistFieldRefs {
    readonly id: FieldRef<"EventWaitlist", 'String'>
    readonly eventId: FieldRef<"EventWaitlist", 'String'>
    readonly userId: FieldRef<"EventWaitlist", 'String'>
    readonly createdAt: FieldRef<"EventWaitlist", 'DateTime'>
    readonly updatedAt: FieldRef<"EventWaitlist", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * EventWaitlist findUnique
   */
  export type EventWaitlistFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventWaitlist
     */
    select?: EventWaitlistSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EventWaitlist
     */
    omit?: EventWaitlistOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EventWaitlistInclude<ExtArgs> | null
    /**
     * Filter, which EventWaitlist to fetch.
     */
    where: EventWaitlistWhereUniqueInput
  }

  /**
   * EventWaitlist findUniqueOrThrow
   */
  export type EventWaitlistFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventWaitlist
     */
    select?: EventWaitlistSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EventWaitlist
     */
    omit?: EventWaitlistOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EventWaitlistInclude<ExtArgs> | null
    /**
     * Filter, which EventWaitlist to fetch.
     */
    where: EventWaitlistWhereUniqueInput
  }

  /**
   * EventWaitlist findFirst
   */
  export type EventWaitlistFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventWaitlist
     */
    select?: EventWaitlistSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EventWaitlist
     */
    omit?: EventWaitlistOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EventWaitlistInclude<ExtArgs> | null
    /**
     * Filter, which EventWaitlist to fetch.
     */
    where?: EventWaitlistWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of EventWaitlists to fetch.
     */
    orderBy?: EventWaitlistOrderByWithRelationInput | EventWaitlistOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for EventWaitlists.
     */
    cursor?: EventWaitlistWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` EventWaitlists from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` EventWaitlists.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of EventWaitlists.
     */
    distinct?: EventWaitlistScalarFieldEnum | EventWaitlistScalarFieldEnum[]
  }

  /**
   * EventWaitlist findFirstOrThrow
   */
  export type EventWaitlistFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventWaitlist
     */
    select?: EventWaitlistSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EventWaitlist
     */
    omit?: EventWaitlistOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EventWaitlistInclude<ExtArgs> | null
    /**
     * Filter, which EventWaitlist to fetch.
     */
    where?: EventWaitlistWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of EventWaitlists to fetch.
     */
    orderBy?: EventWaitlistOrderByWithRelationInput | EventWaitlistOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for EventWaitlists.
     */
    cursor?: EventWaitlistWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` EventWaitlists from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` EventWaitlists.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of EventWaitlists.
     */
    distinct?: EventWaitlistScalarFieldEnum | EventWaitlistScalarFieldEnum[]
  }

  /**
   * EventWaitlist findMany
   */
  export type EventWaitlistFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventWaitlist
     */
    select?: EventWaitlistSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EventWaitlist
     */
    omit?: EventWaitlistOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EventWaitlistInclude<ExtArgs> | null
    /**
     * Filter, which EventWaitlists to fetch.
     */
    where?: EventWaitlistWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of EventWaitlists to fetch.
     */
    orderBy?: EventWaitlistOrderByWithRelationInput | EventWaitlistOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing EventWaitlists.
     */
    cursor?: EventWaitlistWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` EventWaitlists from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` EventWaitlists.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of EventWaitlists.
     */
    distinct?: EventWaitlistScalarFieldEnum | EventWaitlistScalarFieldEnum[]
  }

  /**
   * EventWaitlist create
   */
  export type EventWaitlistCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventWaitlist
     */
    select?: EventWaitlistSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EventWaitlist
     */
    omit?: EventWaitlistOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EventWaitlistInclude<ExtArgs> | null
    /**
     * The data needed to create a EventWaitlist.
     */
    data: XOR<EventWaitlistCreateInput, EventWaitlistUncheckedCreateInput>
  }

  /**
   * EventWaitlist createMany
   */
  export type EventWaitlistCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many EventWaitlists.
     */
    data: EventWaitlistCreateManyInput | EventWaitlistCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * EventWaitlist createManyAndReturn
   */
  export type EventWaitlistCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventWaitlist
     */
    select?: EventWaitlistSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the EventWaitlist
     */
    omit?: EventWaitlistOmit<ExtArgs> | null
    /**
     * The data used to create many EventWaitlists.
     */
    data: EventWaitlistCreateManyInput | EventWaitlistCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EventWaitlistIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * EventWaitlist update
   */
  export type EventWaitlistUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventWaitlist
     */
    select?: EventWaitlistSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EventWaitlist
     */
    omit?: EventWaitlistOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EventWaitlistInclude<ExtArgs> | null
    /**
     * The data needed to update a EventWaitlist.
     */
    data: XOR<EventWaitlistUpdateInput, EventWaitlistUncheckedUpdateInput>
    /**
     * Choose, which EventWaitlist to update.
     */
    where: EventWaitlistWhereUniqueInput
  }

  /**
   * EventWaitlist updateMany
   */
  export type EventWaitlistUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update EventWaitlists.
     */
    data: XOR<EventWaitlistUpdateManyMutationInput, EventWaitlistUncheckedUpdateManyInput>
    /**
     * Filter which EventWaitlists to update
     */
    where?: EventWaitlistWhereInput
    /**
     * Limit how many EventWaitlists to update.
     */
    limit?: number
  }

  /**
   * EventWaitlist updateManyAndReturn
   */
  export type EventWaitlistUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventWaitlist
     */
    select?: EventWaitlistSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the EventWaitlist
     */
    omit?: EventWaitlistOmit<ExtArgs> | null
    /**
     * The data used to update EventWaitlists.
     */
    data: XOR<EventWaitlistUpdateManyMutationInput, EventWaitlistUncheckedUpdateManyInput>
    /**
     * Filter which EventWaitlists to update
     */
    where?: EventWaitlistWhereInput
    /**
     * Limit how many EventWaitlists to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EventWaitlistIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * EventWaitlist upsert
   */
  export type EventWaitlistUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventWaitlist
     */
    select?: EventWaitlistSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EventWaitlist
     */
    omit?: EventWaitlistOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EventWaitlistInclude<ExtArgs> | null
    /**
     * The filter to search for the EventWaitlist to update in case it exists.
     */
    where: EventWaitlistWhereUniqueInput
    /**
     * In case the EventWaitlist found by the `where` argument doesn't exist, create a new EventWaitlist with this data.
     */
    create: XOR<EventWaitlistCreateInput, EventWaitlistUncheckedCreateInput>
    /**
     * In case the EventWaitlist was found with the provided `where` argument, update it with this data.
     */
    update: XOR<EventWaitlistUpdateInput, EventWaitlistUncheckedUpdateInput>
  }

  /**
   * EventWaitlist delete
   */
  export type EventWaitlistDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventWaitlist
     */
    select?: EventWaitlistSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EventWaitlist
     */
    omit?: EventWaitlistOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EventWaitlistInclude<ExtArgs> | null
    /**
     * Filter which EventWaitlist to delete.
     */
    where: EventWaitlistWhereUniqueInput
  }

  /**
   * EventWaitlist deleteMany
   */
  export type EventWaitlistDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which EventWaitlists to delete
     */
    where?: EventWaitlistWhereInput
    /**
     * Limit how many EventWaitlists to delete.
     */
    limit?: number
  }

  /**
   * EventWaitlist without action
   */
  export type EventWaitlistDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventWaitlist
     */
    select?: EventWaitlistSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EventWaitlist
     */
    omit?: EventWaitlistOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EventWaitlistInclude<ExtArgs> | null
  }


  /**
   * Model EventInterest
   */

  export type AggregateEventInterest = {
    _count: EventInterestCountAggregateOutputType | null
    _min: EventInterestMinAggregateOutputType | null
    _max: EventInterestMaxAggregateOutputType | null
  }

  export type EventInterestMinAggregateOutputType = {
    eventId: string | null
    subInterestId: string | null
  }

  export type EventInterestMaxAggregateOutputType = {
    eventId: string | null
    subInterestId: string | null
  }

  export type EventInterestCountAggregateOutputType = {
    eventId: number
    subInterestId: number
    _all: number
  }


  export type EventInterestMinAggregateInputType = {
    eventId?: true
    subInterestId?: true
  }

  export type EventInterestMaxAggregateInputType = {
    eventId?: true
    subInterestId?: true
  }

  export type EventInterestCountAggregateInputType = {
    eventId?: true
    subInterestId?: true
    _all?: true
  }

  export type EventInterestAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which EventInterest to aggregate.
     */
    where?: EventInterestWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of EventInterests to fetch.
     */
    orderBy?: EventInterestOrderByWithRelationInput | EventInterestOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: EventInterestWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` EventInterests from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` EventInterests.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned EventInterests
    **/
    _count?: true | EventInterestCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: EventInterestMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: EventInterestMaxAggregateInputType
  }

  export type GetEventInterestAggregateType<T extends EventInterestAggregateArgs> = {
        [P in keyof T & keyof AggregateEventInterest]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateEventInterest[P]>
      : GetScalarType<T[P], AggregateEventInterest[P]>
  }




  export type EventInterestGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: EventInterestWhereInput
    orderBy?: EventInterestOrderByWithAggregationInput | EventInterestOrderByWithAggregationInput[]
    by: EventInterestScalarFieldEnum[] | EventInterestScalarFieldEnum
    having?: EventInterestScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: EventInterestCountAggregateInputType | true
    _min?: EventInterestMinAggregateInputType
    _max?: EventInterestMaxAggregateInputType
  }

  export type EventInterestGroupByOutputType = {
    eventId: string
    subInterestId: string
    _count: EventInterestCountAggregateOutputType | null
    _min: EventInterestMinAggregateOutputType | null
    _max: EventInterestMaxAggregateOutputType | null
  }

  type GetEventInterestGroupByPayload<T extends EventInterestGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<EventInterestGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof EventInterestGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], EventInterestGroupByOutputType[P]>
            : GetScalarType<T[P], EventInterestGroupByOutputType[P]>
        }
      >
    >


  export type EventInterestSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    eventId?: boolean
    subInterestId?: boolean
    event?: boolean | EventDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["eventInterest"]>

  export type EventInterestSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    eventId?: boolean
    subInterestId?: boolean
    event?: boolean | EventDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["eventInterest"]>

  export type EventInterestSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    eventId?: boolean
    subInterestId?: boolean
    event?: boolean | EventDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["eventInterest"]>

  export type EventInterestSelectScalar = {
    eventId?: boolean
    subInterestId?: boolean
  }

  export type EventInterestOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"eventId" | "subInterestId", ExtArgs["result"]["eventInterest"]>
  export type EventInterestInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    event?: boolean | EventDefaultArgs<ExtArgs>
  }
  export type EventInterestIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    event?: boolean | EventDefaultArgs<ExtArgs>
  }
  export type EventInterestIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    event?: boolean | EventDefaultArgs<ExtArgs>
  }

  export type $EventInterestPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "EventInterest"
    objects: {
      event: Prisma.$EventPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      eventId: string
      subInterestId: string
    }, ExtArgs["result"]["eventInterest"]>
    composites: {}
  }

  type EventInterestGetPayload<S extends boolean | null | undefined | EventInterestDefaultArgs> = $Result.GetResult<Prisma.$EventInterestPayload, S>

  type EventInterestCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<EventInterestFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: EventInterestCountAggregateInputType | true
    }

  export interface EventInterestDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['EventInterest'], meta: { name: 'EventInterest' } }
    /**
     * Find zero or one EventInterest that matches the filter.
     * @param {EventInterestFindUniqueArgs} args - Arguments to find a EventInterest
     * @example
     * // Get one EventInterest
     * const eventInterest = await prisma.eventInterest.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends EventInterestFindUniqueArgs>(args: SelectSubset<T, EventInterestFindUniqueArgs<ExtArgs>>): Prisma__EventInterestClient<$Result.GetResult<Prisma.$EventInterestPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one EventInterest that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {EventInterestFindUniqueOrThrowArgs} args - Arguments to find a EventInterest
     * @example
     * // Get one EventInterest
     * const eventInterest = await prisma.eventInterest.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends EventInterestFindUniqueOrThrowArgs>(args: SelectSubset<T, EventInterestFindUniqueOrThrowArgs<ExtArgs>>): Prisma__EventInterestClient<$Result.GetResult<Prisma.$EventInterestPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first EventInterest that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EventInterestFindFirstArgs} args - Arguments to find a EventInterest
     * @example
     * // Get one EventInterest
     * const eventInterest = await prisma.eventInterest.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends EventInterestFindFirstArgs>(args?: SelectSubset<T, EventInterestFindFirstArgs<ExtArgs>>): Prisma__EventInterestClient<$Result.GetResult<Prisma.$EventInterestPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first EventInterest that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EventInterestFindFirstOrThrowArgs} args - Arguments to find a EventInterest
     * @example
     * // Get one EventInterest
     * const eventInterest = await prisma.eventInterest.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends EventInterestFindFirstOrThrowArgs>(args?: SelectSubset<T, EventInterestFindFirstOrThrowArgs<ExtArgs>>): Prisma__EventInterestClient<$Result.GetResult<Prisma.$EventInterestPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more EventInterests that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EventInterestFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all EventInterests
     * const eventInterests = await prisma.eventInterest.findMany()
     * 
     * // Get first 10 EventInterests
     * const eventInterests = await prisma.eventInterest.findMany({ take: 10 })
     * 
     * // Only select the `eventId`
     * const eventInterestWithEventIdOnly = await prisma.eventInterest.findMany({ select: { eventId: true } })
     * 
     */
    findMany<T extends EventInterestFindManyArgs>(args?: SelectSubset<T, EventInterestFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$EventInterestPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a EventInterest.
     * @param {EventInterestCreateArgs} args - Arguments to create a EventInterest.
     * @example
     * // Create one EventInterest
     * const EventInterest = await prisma.eventInterest.create({
     *   data: {
     *     // ... data to create a EventInterest
     *   }
     * })
     * 
     */
    create<T extends EventInterestCreateArgs>(args: SelectSubset<T, EventInterestCreateArgs<ExtArgs>>): Prisma__EventInterestClient<$Result.GetResult<Prisma.$EventInterestPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many EventInterests.
     * @param {EventInterestCreateManyArgs} args - Arguments to create many EventInterests.
     * @example
     * // Create many EventInterests
     * const eventInterest = await prisma.eventInterest.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends EventInterestCreateManyArgs>(args?: SelectSubset<T, EventInterestCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many EventInterests and returns the data saved in the database.
     * @param {EventInterestCreateManyAndReturnArgs} args - Arguments to create many EventInterests.
     * @example
     * // Create many EventInterests
     * const eventInterest = await prisma.eventInterest.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many EventInterests and only return the `eventId`
     * const eventInterestWithEventIdOnly = await prisma.eventInterest.createManyAndReturn({
     *   select: { eventId: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends EventInterestCreateManyAndReturnArgs>(args?: SelectSubset<T, EventInterestCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$EventInterestPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a EventInterest.
     * @param {EventInterestDeleteArgs} args - Arguments to delete one EventInterest.
     * @example
     * // Delete one EventInterest
     * const EventInterest = await prisma.eventInterest.delete({
     *   where: {
     *     // ... filter to delete one EventInterest
     *   }
     * })
     * 
     */
    delete<T extends EventInterestDeleteArgs>(args: SelectSubset<T, EventInterestDeleteArgs<ExtArgs>>): Prisma__EventInterestClient<$Result.GetResult<Prisma.$EventInterestPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one EventInterest.
     * @param {EventInterestUpdateArgs} args - Arguments to update one EventInterest.
     * @example
     * // Update one EventInterest
     * const eventInterest = await prisma.eventInterest.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends EventInterestUpdateArgs>(args: SelectSubset<T, EventInterestUpdateArgs<ExtArgs>>): Prisma__EventInterestClient<$Result.GetResult<Prisma.$EventInterestPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more EventInterests.
     * @param {EventInterestDeleteManyArgs} args - Arguments to filter EventInterests to delete.
     * @example
     * // Delete a few EventInterests
     * const { count } = await prisma.eventInterest.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends EventInterestDeleteManyArgs>(args?: SelectSubset<T, EventInterestDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more EventInterests.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EventInterestUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many EventInterests
     * const eventInterest = await prisma.eventInterest.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends EventInterestUpdateManyArgs>(args: SelectSubset<T, EventInterestUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more EventInterests and returns the data updated in the database.
     * @param {EventInterestUpdateManyAndReturnArgs} args - Arguments to update many EventInterests.
     * @example
     * // Update many EventInterests
     * const eventInterest = await prisma.eventInterest.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more EventInterests and only return the `eventId`
     * const eventInterestWithEventIdOnly = await prisma.eventInterest.updateManyAndReturn({
     *   select: { eventId: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends EventInterestUpdateManyAndReturnArgs>(args: SelectSubset<T, EventInterestUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$EventInterestPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one EventInterest.
     * @param {EventInterestUpsertArgs} args - Arguments to update or create a EventInterest.
     * @example
     * // Update or create a EventInterest
     * const eventInterest = await prisma.eventInterest.upsert({
     *   create: {
     *     // ... data to create a EventInterest
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the EventInterest we want to update
     *   }
     * })
     */
    upsert<T extends EventInterestUpsertArgs>(args: SelectSubset<T, EventInterestUpsertArgs<ExtArgs>>): Prisma__EventInterestClient<$Result.GetResult<Prisma.$EventInterestPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of EventInterests.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EventInterestCountArgs} args - Arguments to filter EventInterests to count.
     * @example
     * // Count the number of EventInterests
     * const count = await prisma.eventInterest.count({
     *   where: {
     *     // ... the filter for the EventInterests we want to count
     *   }
     * })
    **/
    count<T extends EventInterestCountArgs>(
      args?: Subset<T, EventInterestCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], EventInterestCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a EventInterest.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EventInterestAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends EventInterestAggregateArgs>(args: Subset<T, EventInterestAggregateArgs>): Prisma.PrismaPromise<GetEventInterestAggregateType<T>>

    /**
     * Group by EventInterest.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EventInterestGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends EventInterestGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: EventInterestGroupByArgs['orderBy'] }
        : { orderBy?: EventInterestGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, EventInterestGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetEventInterestGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the EventInterest model
   */
  readonly fields: EventInterestFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for EventInterest.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__EventInterestClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    event<T extends EventDefaultArgs<ExtArgs> = {}>(args?: Subset<T, EventDefaultArgs<ExtArgs>>): Prisma__EventClient<$Result.GetResult<Prisma.$EventPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the EventInterest model
   */
  interface EventInterestFieldRefs {
    readonly eventId: FieldRef<"EventInterest", 'String'>
    readonly subInterestId: FieldRef<"EventInterest", 'String'>
  }
    

  // Custom InputTypes
  /**
   * EventInterest findUnique
   */
  export type EventInterestFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventInterest
     */
    select?: EventInterestSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EventInterest
     */
    omit?: EventInterestOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EventInterestInclude<ExtArgs> | null
    /**
     * Filter, which EventInterest to fetch.
     */
    where: EventInterestWhereUniqueInput
  }

  /**
   * EventInterest findUniqueOrThrow
   */
  export type EventInterestFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventInterest
     */
    select?: EventInterestSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EventInterest
     */
    omit?: EventInterestOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EventInterestInclude<ExtArgs> | null
    /**
     * Filter, which EventInterest to fetch.
     */
    where: EventInterestWhereUniqueInput
  }

  /**
   * EventInterest findFirst
   */
  export type EventInterestFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventInterest
     */
    select?: EventInterestSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EventInterest
     */
    omit?: EventInterestOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EventInterestInclude<ExtArgs> | null
    /**
     * Filter, which EventInterest to fetch.
     */
    where?: EventInterestWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of EventInterests to fetch.
     */
    orderBy?: EventInterestOrderByWithRelationInput | EventInterestOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for EventInterests.
     */
    cursor?: EventInterestWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` EventInterests from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` EventInterests.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of EventInterests.
     */
    distinct?: EventInterestScalarFieldEnum | EventInterestScalarFieldEnum[]
  }

  /**
   * EventInterest findFirstOrThrow
   */
  export type EventInterestFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventInterest
     */
    select?: EventInterestSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EventInterest
     */
    omit?: EventInterestOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EventInterestInclude<ExtArgs> | null
    /**
     * Filter, which EventInterest to fetch.
     */
    where?: EventInterestWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of EventInterests to fetch.
     */
    orderBy?: EventInterestOrderByWithRelationInput | EventInterestOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for EventInterests.
     */
    cursor?: EventInterestWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` EventInterests from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` EventInterests.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of EventInterests.
     */
    distinct?: EventInterestScalarFieldEnum | EventInterestScalarFieldEnum[]
  }

  /**
   * EventInterest findMany
   */
  export type EventInterestFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventInterest
     */
    select?: EventInterestSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EventInterest
     */
    omit?: EventInterestOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EventInterestInclude<ExtArgs> | null
    /**
     * Filter, which EventInterests to fetch.
     */
    where?: EventInterestWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of EventInterests to fetch.
     */
    orderBy?: EventInterestOrderByWithRelationInput | EventInterestOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing EventInterests.
     */
    cursor?: EventInterestWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` EventInterests from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` EventInterests.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of EventInterests.
     */
    distinct?: EventInterestScalarFieldEnum | EventInterestScalarFieldEnum[]
  }

  /**
   * EventInterest create
   */
  export type EventInterestCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventInterest
     */
    select?: EventInterestSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EventInterest
     */
    omit?: EventInterestOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EventInterestInclude<ExtArgs> | null
    /**
     * The data needed to create a EventInterest.
     */
    data: XOR<EventInterestCreateInput, EventInterestUncheckedCreateInput>
  }

  /**
   * EventInterest createMany
   */
  export type EventInterestCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many EventInterests.
     */
    data: EventInterestCreateManyInput | EventInterestCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * EventInterest createManyAndReturn
   */
  export type EventInterestCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventInterest
     */
    select?: EventInterestSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the EventInterest
     */
    omit?: EventInterestOmit<ExtArgs> | null
    /**
     * The data used to create many EventInterests.
     */
    data: EventInterestCreateManyInput | EventInterestCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EventInterestIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * EventInterest update
   */
  export type EventInterestUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventInterest
     */
    select?: EventInterestSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EventInterest
     */
    omit?: EventInterestOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EventInterestInclude<ExtArgs> | null
    /**
     * The data needed to update a EventInterest.
     */
    data: XOR<EventInterestUpdateInput, EventInterestUncheckedUpdateInput>
    /**
     * Choose, which EventInterest to update.
     */
    where: EventInterestWhereUniqueInput
  }

  /**
   * EventInterest updateMany
   */
  export type EventInterestUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update EventInterests.
     */
    data: XOR<EventInterestUpdateManyMutationInput, EventInterestUncheckedUpdateManyInput>
    /**
     * Filter which EventInterests to update
     */
    where?: EventInterestWhereInput
    /**
     * Limit how many EventInterests to update.
     */
    limit?: number
  }

  /**
   * EventInterest updateManyAndReturn
   */
  export type EventInterestUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventInterest
     */
    select?: EventInterestSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the EventInterest
     */
    omit?: EventInterestOmit<ExtArgs> | null
    /**
     * The data used to update EventInterests.
     */
    data: XOR<EventInterestUpdateManyMutationInput, EventInterestUncheckedUpdateManyInput>
    /**
     * Filter which EventInterests to update
     */
    where?: EventInterestWhereInput
    /**
     * Limit how many EventInterests to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EventInterestIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * EventInterest upsert
   */
  export type EventInterestUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventInterest
     */
    select?: EventInterestSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EventInterest
     */
    omit?: EventInterestOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EventInterestInclude<ExtArgs> | null
    /**
     * The filter to search for the EventInterest to update in case it exists.
     */
    where: EventInterestWhereUniqueInput
    /**
     * In case the EventInterest found by the `where` argument doesn't exist, create a new EventInterest with this data.
     */
    create: XOR<EventInterestCreateInput, EventInterestUncheckedCreateInput>
    /**
     * In case the EventInterest was found with the provided `where` argument, update it with this data.
     */
    update: XOR<EventInterestUpdateInput, EventInterestUncheckedUpdateInput>
  }

  /**
   * EventInterest delete
   */
  export type EventInterestDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventInterest
     */
    select?: EventInterestSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EventInterest
     */
    omit?: EventInterestOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EventInterestInclude<ExtArgs> | null
    /**
     * Filter which EventInterest to delete.
     */
    where: EventInterestWhereUniqueInput
  }

  /**
   * EventInterest deleteMany
   */
  export type EventInterestDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which EventInterests to delete
     */
    where?: EventInterestWhereInput
    /**
     * Limit how many EventInterests to delete.
     */
    limit?: number
  }

  /**
   * EventInterest without action
   */
  export type EventInterestDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventInterest
     */
    select?: EventInterestSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EventInterest
     */
    omit?: EventInterestOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EventInterestInclude<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const EventScalarFieldEnum: {
    id: 'id',
    title: 'title',
    description: 'description',
    organizerId: 'organizerId',
    startAt: 'startAt',
    endAt: 'endAt',
    mode: 'mode',
    meetingUrl: 'meetingUrl',
    platform: 'platform',
    joinUrl: 'joinUrl',
    venue: 'venue',
    location: 'location',
    capacity: 'capacity',
    bannerImageUrl: 'bannerImageUrl',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type EventScalarFieldEnum = (typeof EventScalarFieldEnum)[keyof typeof EventScalarFieldEnum]


  export const EventAttendeeScalarFieldEnum: {
    id: 'id',
    eventId: 'eventId',
    userId: 'userId',
    rsvpStatus: 'rsvpStatus',
    joinedAt: 'joinedAt'
  };

  export type EventAttendeeScalarFieldEnum = (typeof EventAttendeeScalarFieldEnum)[keyof typeof EventAttendeeScalarFieldEnum]


  export const EventWaitlistScalarFieldEnum: {
    id: 'id',
    eventId: 'eventId',
    userId: 'userId',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type EventWaitlistScalarFieldEnum = (typeof EventWaitlistScalarFieldEnum)[keyof typeof EventWaitlistScalarFieldEnum]


  export const EventInterestScalarFieldEnum: {
    eventId: 'eventId',
    subInterestId: 'subInterestId'
  };

  export type EventInterestScalarFieldEnum = (typeof EventInterestScalarFieldEnum)[keyof typeof EventInterestScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  /**
   * Field references
   */


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'String[]'
   */
  export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    


  /**
   * Reference to a field of type 'EventMode'
   */
  export type EnumEventModeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'EventMode'>
    


  /**
   * Reference to a field of type 'EventMode[]'
   */
  export type ListEnumEventModeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'EventMode[]'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    


  /**
   * Reference to a field of type 'EventRSVPStatus'
   */
  export type EnumEventRSVPStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'EventRSVPStatus'>
    


  /**
   * Reference to a field of type 'EventRSVPStatus[]'
   */
  export type ListEnumEventRSVPStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'EventRSVPStatus[]'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    


  /**
   * Reference to a field of type 'Float[]'
   */
  export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float[]'>
    
  /**
   * Deep Input Types
   */


  export type EventWhereInput = {
    AND?: EventWhereInput | EventWhereInput[]
    OR?: EventWhereInput[]
    NOT?: EventWhereInput | EventWhereInput[]
    id?: StringFilter<"Event"> | string
    title?: StringFilter<"Event"> | string
    description?: StringNullableFilter<"Event"> | string | null
    organizerId?: StringFilter<"Event"> | string
    startAt?: DateTimeFilter<"Event"> | Date | string
    endAt?: DateTimeFilter<"Event"> | Date | string
    mode?: EnumEventModeFilter<"Event"> | $Enums.EventMode
    meetingUrl?: StringNullableFilter<"Event"> | string | null
    platform?: StringNullableFilter<"Event"> | string | null
    joinUrl?: StringNullableFilter<"Event"> | string | null
    venue?: StringNullableFilter<"Event"> | string | null
    location?: StringNullableFilter<"Event"> | string | null
    capacity?: IntNullableFilter<"Event"> | number | null
    bannerImageUrl?: StringNullableFilter<"Event"> | string | null
    createdAt?: DateTimeFilter<"Event"> | Date | string
    updatedAt?: DateTimeFilter<"Event"> | Date | string
    attendees?: EventAttendeeListRelationFilter
    waitlist?: EventWaitlistListRelationFilter
    interests?: EventInterestListRelationFilter
  }

  export type EventOrderByWithRelationInput = {
    id?: SortOrder
    title?: SortOrder
    description?: SortOrderInput | SortOrder
    organizerId?: SortOrder
    startAt?: SortOrder
    endAt?: SortOrder
    mode?: SortOrder
    meetingUrl?: SortOrderInput | SortOrder
    platform?: SortOrderInput | SortOrder
    joinUrl?: SortOrderInput | SortOrder
    venue?: SortOrderInput | SortOrder
    location?: SortOrderInput | SortOrder
    capacity?: SortOrderInput | SortOrder
    bannerImageUrl?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    attendees?: EventAttendeeOrderByRelationAggregateInput
    waitlist?: EventWaitlistOrderByRelationAggregateInput
    interests?: EventInterestOrderByRelationAggregateInput
  }

  export type EventWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: EventWhereInput | EventWhereInput[]
    OR?: EventWhereInput[]
    NOT?: EventWhereInput | EventWhereInput[]
    title?: StringFilter<"Event"> | string
    description?: StringNullableFilter<"Event"> | string | null
    organizerId?: StringFilter<"Event"> | string
    startAt?: DateTimeFilter<"Event"> | Date | string
    endAt?: DateTimeFilter<"Event"> | Date | string
    mode?: EnumEventModeFilter<"Event"> | $Enums.EventMode
    meetingUrl?: StringNullableFilter<"Event"> | string | null
    platform?: StringNullableFilter<"Event"> | string | null
    joinUrl?: StringNullableFilter<"Event"> | string | null
    venue?: StringNullableFilter<"Event"> | string | null
    location?: StringNullableFilter<"Event"> | string | null
    capacity?: IntNullableFilter<"Event"> | number | null
    bannerImageUrl?: StringNullableFilter<"Event"> | string | null
    createdAt?: DateTimeFilter<"Event"> | Date | string
    updatedAt?: DateTimeFilter<"Event"> | Date | string
    attendees?: EventAttendeeListRelationFilter
    waitlist?: EventWaitlistListRelationFilter
    interests?: EventInterestListRelationFilter
  }, "id">

  export type EventOrderByWithAggregationInput = {
    id?: SortOrder
    title?: SortOrder
    description?: SortOrderInput | SortOrder
    organizerId?: SortOrder
    startAt?: SortOrder
    endAt?: SortOrder
    mode?: SortOrder
    meetingUrl?: SortOrderInput | SortOrder
    platform?: SortOrderInput | SortOrder
    joinUrl?: SortOrderInput | SortOrder
    venue?: SortOrderInput | SortOrder
    location?: SortOrderInput | SortOrder
    capacity?: SortOrderInput | SortOrder
    bannerImageUrl?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: EventCountOrderByAggregateInput
    _avg?: EventAvgOrderByAggregateInput
    _max?: EventMaxOrderByAggregateInput
    _min?: EventMinOrderByAggregateInput
    _sum?: EventSumOrderByAggregateInput
  }

  export type EventScalarWhereWithAggregatesInput = {
    AND?: EventScalarWhereWithAggregatesInput | EventScalarWhereWithAggregatesInput[]
    OR?: EventScalarWhereWithAggregatesInput[]
    NOT?: EventScalarWhereWithAggregatesInput | EventScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Event"> | string
    title?: StringWithAggregatesFilter<"Event"> | string
    description?: StringNullableWithAggregatesFilter<"Event"> | string | null
    organizerId?: StringWithAggregatesFilter<"Event"> | string
    startAt?: DateTimeWithAggregatesFilter<"Event"> | Date | string
    endAt?: DateTimeWithAggregatesFilter<"Event"> | Date | string
    mode?: EnumEventModeWithAggregatesFilter<"Event"> | $Enums.EventMode
    meetingUrl?: StringNullableWithAggregatesFilter<"Event"> | string | null
    platform?: StringNullableWithAggregatesFilter<"Event"> | string | null
    joinUrl?: StringNullableWithAggregatesFilter<"Event"> | string | null
    venue?: StringNullableWithAggregatesFilter<"Event"> | string | null
    location?: StringNullableWithAggregatesFilter<"Event"> | string | null
    capacity?: IntNullableWithAggregatesFilter<"Event"> | number | null
    bannerImageUrl?: StringNullableWithAggregatesFilter<"Event"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"Event"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Event"> | Date | string
  }

  export type EventAttendeeWhereInput = {
    AND?: EventAttendeeWhereInput | EventAttendeeWhereInput[]
    OR?: EventAttendeeWhereInput[]
    NOT?: EventAttendeeWhereInput | EventAttendeeWhereInput[]
    id?: StringFilter<"EventAttendee"> | string
    eventId?: StringFilter<"EventAttendee"> | string
    userId?: StringFilter<"EventAttendee"> | string
    rsvpStatus?: EnumEventRSVPStatusFilter<"EventAttendee"> | $Enums.EventRSVPStatus
    joinedAt?: DateTimeFilter<"EventAttendee"> | Date | string
    event?: XOR<EventScalarRelationFilter, EventWhereInput>
  }

  export type EventAttendeeOrderByWithRelationInput = {
    id?: SortOrder
    eventId?: SortOrder
    userId?: SortOrder
    rsvpStatus?: SortOrder
    joinedAt?: SortOrder
    event?: EventOrderByWithRelationInput
  }

  export type EventAttendeeWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    eventId_userId?: EventAttendeeEventIdUserIdCompoundUniqueInput
    AND?: EventAttendeeWhereInput | EventAttendeeWhereInput[]
    OR?: EventAttendeeWhereInput[]
    NOT?: EventAttendeeWhereInput | EventAttendeeWhereInput[]
    eventId?: StringFilter<"EventAttendee"> | string
    userId?: StringFilter<"EventAttendee"> | string
    rsvpStatus?: EnumEventRSVPStatusFilter<"EventAttendee"> | $Enums.EventRSVPStatus
    joinedAt?: DateTimeFilter<"EventAttendee"> | Date | string
    event?: XOR<EventScalarRelationFilter, EventWhereInput>
  }, "id" | "eventId_userId">

  export type EventAttendeeOrderByWithAggregationInput = {
    id?: SortOrder
    eventId?: SortOrder
    userId?: SortOrder
    rsvpStatus?: SortOrder
    joinedAt?: SortOrder
    _count?: EventAttendeeCountOrderByAggregateInput
    _max?: EventAttendeeMaxOrderByAggregateInput
    _min?: EventAttendeeMinOrderByAggregateInput
  }

  export type EventAttendeeScalarWhereWithAggregatesInput = {
    AND?: EventAttendeeScalarWhereWithAggregatesInput | EventAttendeeScalarWhereWithAggregatesInput[]
    OR?: EventAttendeeScalarWhereWithAggregatesInput[]
    NOT?: EventAttendeeScalarWhereWithAggregatesInput | EventAttendeeScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"EventAttendee"> | string
    eventId?: StringWithAggregatesFilter<"EventAttendee"> | string
    userId?: StringWithAggregatesFilter<"EventAttendee"> | string
    rsvpStatus?: EnumEventRSVPStatusWithAggregatesFilter<"EventAttendee"> | $Enums.EventRSVPStatus
    joinedAt?: DateTimeWithAggregatesFilter<"EventAttendee"> | Date | string
  }

  export type EventWaitlistWhereInput = {
    AND?: EventWaitlistWhereInput | EventWaitlistWhereInput[]
    OR?: EventWaitlistWhereInput[]
    NOT?: EventWaitlistWhereInput | EventWaitlistWhereInput[]
    id?: StringFilter<"EventWaitlist"> | string
    eventId?: StringFilter<"EventWaitlist"> | string
    userId?: StringFilter<"EventWaitlist"> | string
    createdAt?: DateTimeFilter<"EventWaitlist"> | Date | string
    updatedAt?: DateTimeFilter<"EventWaitlist"> | Date | string
    event?: XOR<EventScalarRelationFilter, EventWhereInput>
  }

  export type EventWaitlistOrderByWithRelationInput = {
    id?: SortOrder
    eventId?: SortOrder
    userId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    event?: EventOrderByWithRelationInput
  }

  export type EventWaitlistWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    eventId_userId?: EventWaitlistEventIdUserIdCompoundUniqueInput
    AND?: EventWaitlistWhereInput | EventWaitlistWhereInput[]
    OR?: EventWaitlistWhereInput[]
    NOT?: EventWaitlistWhereInput | EventWaitlistWhereInput[]
    eventId?: StringFilter<"EventWaitlist"> | string
    userId?: StringFilter<"EventWaitlist"> | string
    createdAt?: DateTimeFilter<"EventWaitlist"> | Date | string
    updatedAt?: DateTimeFilter<"EventWaitlist"> | Date | string
    event?: XOR<EventScalarRelationFilter, EventWhereInput>
  }, "id" | "eventId_userId">

  export type EventWaitlistOrderByWithAggregationInput = {
    id?: SortOrder
    eventId?: SortOrder
    userId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: EventWaitlistCountOrderByAggregateInput
    _max?: EventWaitlistMaxOrderByAggregateInput
    _min?: EventWaitlistMinOrderByAggregateInput
  }

  export type EventWaitlistScalarWhereWithAggregatesInput = {
    AND?: EventWaitlistScalarWhereWithAggregatesInput | EventWaitlistScalarWhereWithAggregatesInput[]
    OR?: EventWaitlistScalarWhereWithAggregatesInput[]
    NOT?: EventWaitlistScalarWhereWithAggregatesInput | EventWaitlistScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"EventWaitlist"> | string
    eventId?: StringWithAggregatesFilter<"EventWaitlist"> | string
    userId?: StringWithAggregatesFilter<"EventWaitlist"> | string
    createdAt?: DateTimeWithAggregatesFilter<"EventWaitlist"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"EventWaitlist"> | Date | string
  }

  export type EventInterestWhereInput = {
    AND?: EventInterestWhereInput | EventInterestWhereInput[]
    OR?: EventInterestWhereInput[]
    NOT?: EventInterestWhereInput | EventInterestWhereInput[]
    eventId?: StringFilter<"EventInterest"> | string
    subInterestId?: StringFilter<"EventInterest"> | string
    event?: XOR<EventScalarRelationFilter, EventWhereInput>
  }

  export type EventInterestOrderByWithRelationInput = {
    eventId?: SortOrder
    subInterestId?: SortOrder
    event?: EventOrderByWithRelationInput
  }

  export type EventInterestWhereUniqueInput = Prisma.AtLeast<{
    eventId_subInterestId?: EventInterestEventIdSubInterestIdCompoundUniqueInput
    AND?: EventInterestWhereInput | EventInterestWhereInput[]
    OR?: EventInterestWhereInput[]
    NOT?: EventInterestWhereInput | EventInterestWhereInput[]
    eventId?: StringFilter<"EventInterest"> | string
    subInterestId?: StringFilter<"EventInterest"> | string
    event?: XOR<EventScalarRelationFilter, EventWhereInput>
  }, "eventId_subInterestId">

  export type EventInterestOrderByWithAggregationInput = {
    eventId?: SortOrder
    subInterestId?: SortOrder
    _count?: EventInterestCountOrderByAggregateInput
    _max?: EventInterestMaxOrderByAggregateInput
    _min?: EventInterestMinOrderByAggregateInput
  }

  export type EventInterestScalarWhereWithAggregatesInput = {
    AND?: EventInterestScalarWhereWithAggregatesInput | EventInterestScalarWhereWithAggregatesInput[]
    OR?: EventInterestScalarWhereWithAggregatesInput[]
    NOT?: EventInterestScalarWhereWithAggregatesInput | EventInterestScalarWhereWithAggregatesInput[]
    eventId?: StringWithAggregatesFilter<"EventInterest"> | string
    subInterestId?: StringWithAggregatesFilter<"EventInterest"> | string
  }

  export type EventCreateInput = {
    id?: string
    title: string
    description?: string | null
    organizerId: string
    startAt: Date | string
    endAt: Date | string
    mode: $Enums.EventMode
    meetingUrl?: string | null
    platform?: string | null
    joinUrl?: string | null
    venue?: string | null
    location?: string | null
    capacity?: number | null
    bannerImageUrl?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    attendees?: EventAttendeeCreateNestedManyWithoutEventInput
    waitlist?: EventWaitlistCreateNestedManyWithoutEventInput
    interests?: EventInterestCreateNestedManyWithoutEventInput
  }

  export type EventUncheckedCreateInput = {
    id?: string
    title: string
    description?: string | null
    organizerId: string
    startAt: Date | string
    endAt: Date | string
    mode: $Enums.EventMode
    meetingUrl?: string | null
    platform?: string | null
    joinUrl?: string | null
    venue?: string | null
    location?: string | null
    capacity?: number | null
    bannerImageUrl?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    attendees?: EventAttendeeUncheckedCreateNestedManyWithoutEventInput
    waitlist?: EventWaitlistUncheckedCreateNestedManyWithoutEventInput
    interests?: EventInterestUncheckedCreateNestedManyWithoutEventInput
  }

  export type EventUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    organizerId?: StringFieldUpdateOperationsInput | string
    startAt?: DateTimeFieldUpdateOperationsInput | Date | string
    endAt?: DateTimeFieldUpdateOperationsInput | Date | string
    mode?: EnumEventModeFieldUpdateOperationsInput | $Enums.EventMode
    meetingUrl?: NullableStringFieldUpdateOperationsInput | string | null
    platform?: NullableStringFieldUpdateOperationsInput | string | null
    joinUrl?: NullableStringFieldUpdateOperationsInput | string | null
    venue?: NullableStringFieldUpdateOperationsInput | string | null
    location?: NullableStringFieldUpdateOperationsInput | string | null
    capacity?: NullableIntFieldUpdateOperationsInput | number | null
    bannerImageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    attendees?: EventAttendeeUpdateManyWithoutEventNestedInput
    waitlist?: EventWaitlistUpdateManyWithoutEventNestedInput
    interests?: EventInterestUpdateManyWithoutEventNestedInput
  }

  export type EventUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    organizerId?: StringFieldUpdateOperationsInput | string
    startAt?: DateTimeFieldUpdateOperationsInput | Date | string
    endAt?: DateTimeFieldUpdateOperationsInput | Date | string
    mode?: EnumEventModeFieldUpdateOperationsInput | $Enums.EventMode
    meetingUrl?: NullableStringFieldUpdateOperationsInput | string | null
    platform?: NullableStringFieldUpdateOperationsInput | string | null
    joinUrl?: NullableStringFieldUpdateOperationsInput | string | null
    venue?: NullableStringFieldUpdateOperationsInput | string | null
    location?: NullableStringFieldUpdateOperationsInput | string | null
    capacity?: NullableIntFieldUpdateOperationsInput | number | null
    bannerImageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    attendees?: EventAttendeeUncheckedUpdateManyWithoutEventNestedInput
    waitlist?: EventWaitlistUncheckedUpdateManyWithoutEventNestedInput
    interests?: EventInterestUncheckedUpdateManyWithoutEventNestedInput
  }

  export type EventCreateManyInput = {
    id?: string
    title: string
    description?: string | null
    organizerId: string
    startAt: Date | string
    endAt: Date | string
    mode: $Enums.EventMode
    meetingUrl?: string | null
    platform?: string | null
    joinUrl?: string | null
    venue?: string | null
    location?: string | null
    capacity?: number | null
    bannerImageUrl?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type EventUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    organizerId?: StringFieldUpdateOperationsInput | string
    startAt?: DateTimeFieldUpdateOperationsInput | Date | string
    endAt?: DateTimeFieldUpdateOperationsInput | Date | string
    mode?: EnumEventModeFieldUpdateOperationsInput | $Enums.EventMode
    meetingUrl?: NullableStringFieldUpdateOperationsInput | string | null
    platform?: NullableStringFieldUpdateOperationsInput | string | null
    joinUrl?: NullableStringFieldUpdateOperationsInput | string | null
    venue?: NullableStringFieldUpdateOperationsInput | string | null
    location?: NullableStringFieldUpdateOperationsInput | string | null
    capacity?: NullableIntFieldUpdateOperationsInput | number | null
    bannerImageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type EventUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    organizerId?: StringFieldUpdateOperationsInput | string
    startAt?: DateTimeFieldUpdateOperationsInput | Date | string
    endAt?: DateTimeFieldUpdateOperationsInput | Date | string
    mode?: EnumEventModeFieldUpdateOperationsInput | $Enums.EventMode
    meetingUrl?: NullableStringFieldUpdateOperationsInput | string | null
    platform?: NullableStringFieldUpdateOperationsInput | string | null
    joinUrl?: NullableStringFieldUpdateOperationsInput | string | null
    venue?: NullableStringFieldUpdateOperationsInput | string | null
    location?: NullableStringFieldUpdateOperationsInput | string | null
    capacity?: NullableIntFieldUpdateOperationsInput | number | null
    bannerImageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type EventAttendeeCreateInput = {
    id?: string
    userId: string
    rsvpStatus: $Enums.EventRSVPStatus
    joinedAt?: Date | string
    event: EventCreateNestedOneWithoutAttendeesInput
  }

  export type EventAttendeeUncheckedCreateInput = {
    id?: string
    eventId: string
    userId: string
    rsvpStatus: $Enums.EventRSVPStatus
    joinedAt?: Date | string
  }

  export type EventAttendeeUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    rsvpStatus?: EnumEventRSVPStatusFieldUpdateOperationsInput | $Enums.EventRSVPStatus
    joinedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    event?: EventUpdateOneRequiredWithoutAttendeesNestedInput
  }

  export type EventAttendeeUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    eventId?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    rsvpStatus?: EnumEventRSVPStatusFieldUpdateOperationsInput | $Enums.EventRSVPStatus
    joinedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type EventAttendeeCreateManyInput = {
    id?: string
    eventId: string
    userId: string
    rsvpStatus: $Enums.EventRSVPStatus
    joinedAt?: Date | string
  }

  export type EventAttendeeUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    rsvpStatus?: EnumEventRSVPStatusFieldUpdateOperationsInput | $Enums.EventRSVPStatus
    joinedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type EventAttendeeUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    eventId?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    rsvpStatus?: EnumEventRSVPStatusFieldUpdateOperationsInput | $Enums.EventRSVPStatus
    joinedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type EventWaitlistCreateInput = {
    id?: string
    userId: string
    createdAt?: Date | string
    updatedAt?: Date | string
    event: EventCreateNestedOneWithoutWaitlistInput
  }

  export type EventWaitlistUncheckedCreateInput = {
    id?: string
    eventId: string
    userId: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type EventWaitlistUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    event?: EventUpdateOneRequiredWithoutWaitlistNestedInput
  }

  export type EventWaitlistUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    eventId?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type EventWaitlistCreateManyInput = {
    id?: string
    eventId: string
    userId: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type EventWaitlistUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type EventWaitlistUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    eventId?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type EventInterestCreateInput = {
    subInterestId: string
    event: EventCreateNestedOneWithoutInterestsInput
  }

  export type EventInterestUncheckedCreateInput = {
    eventId: string
    subInterestId: string
  }

  export type EventInterestUpdateInput = {
    subInterestId?: StringFieldUpdateOperationsInput | string
    event?: EventUpdateOneRequiredWithoutInterestsNestedInput
  }

  export type EventInterestUncheckedUpdateInput = {
    eventId?: StringFieldUpdateOperationsInput | string
    subInterestId?: StringFieldUpdateOperationsInput | string
  }

  export type EventInterestCreateManyInput = {
    eventId: string
    subInterestId: string
  }

  export type EventInterestUpdateManyMutationInput = {
    subInterestId?: StringFieldUpdateOperationsInput | string
  }

  export type EventInterestUncheckedUpdateManyInput = {
    eventId?: StringFieldUpdateOperationsInput | string
    subInterestId?: StringFieldUpdateOperationsInput | string
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type EnumEventModeFilter<$PrismaModel = never> = {
    equals?: $Enums.EventMode | EnumEventModeFieldRefInput<$PrismaModel>
    in?: $Enums.EventMode[] | ListEnumEventModeFieldRefInput<$PrismaModel>
    notIn?: $Enums.EventMode[] | ListEnumEventModeFieldRefInput<$PrismaModel>
    not?: NestedEnumEventModeFilter<$PrismaModel> | $Enums.EventMode
  }

  export type IntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type EventAttendeeListRelationFilter = {
    every?: EventAttendeeWhereInput
    some?: EventAttendeeWhereInput
    none?: EventAttendeeWhereInput
  }

  export type EventWaitlistListRelationFilter = {
    every?: EventWaitlistWhereInput
    some?: EventWaitlistWhereInput
    none?: EventWaitlistWhereInput
  }

  export type EventInterestListRelationFilter = {
    every?: EventInterestWhereInput
    some?: EventInterestWhereInput
    none?: EventInterestWhereInput
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type EventAttendeeOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type EventWaitlistOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type EventInterestOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type EventCountOrderByAggregateInput = {
    id?: SortOrder
    title?: SortOrder
    description?: SortOrder
    organizerId?: SortOrder
    startAt?: SortOrder
    endAt?: SortOrder
    mode?: SortOrder
    meetingUrl?: SortOrder
    platform?: SortOrder
    joinUrl?: SortOrder
    venue?: SortOrder
    location?: SortOrder
    capacity?: SortOrder
    bannerImageUrl?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type EventAvgOrderByAggregateInput = {
    capacity?: SortOrder
  }

  export type EventMaxOrderByAggregateInput = {
    id?: SortOrder
    title?: SortOrder
    description?: SortOrder
    organizerId?: SortOrder
    startAt?: SortOrder
    endAt?: SortOrder
    mode?: SortOrder
    meetingUrl?: SortOrder
    platform?: SortOrder
    joinUrl?: SortOrder
    venue?: SortOrder
    location?: SortOrder
    capacity?: SortOrder
    bannerImageUrl?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type EventMinOrderByAggregateInput = {
    id?: SortOrder
    title?: SortOrder
    description?: SortOrder
    organizerId?: SortOrder
    startAt?: SortOrder
    endAt?: SortOrder
    mode?: SortOrder
    meetingUrl?: SortOrder
    platform?: SortOrder
    joinUrl?: SortOrder
    venue?: SortOrder
    location?: SortOrder
    capacity?: SortOrder
    bannerImageUrl?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type EventSumOrderByAggregateInput = {
    capacity?: SortOrder
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type EnumEventModeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.EventMode | EnumEventModeFieldRefInput<$PrismaModel>
    in?: $Enums.EventMode[] | ListEnumEventModeFieldRefInput<$PrismaModel>
    notIn?: $Enums.EventMode[] | ListEnumEventModeFieldRefInput<$PrismaModel>
    not?: NestedEnumEventModeWithAggregatesFilter<$PrismaModel> | $Enums.EventMode
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumEventModeFilter<$PrismaModel>
    _max?: NestedEnumEventModeFilter<$PrismaModel>
  }

  export type IntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }

  export type EnumEventRSVPStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.EventRSVPStatus | EnumEventRSVPStatusFieldRefInput<$PrismaModel>
    in?: $Enums.EventRSVPStatus[] | ListEnumEventRSVPStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.EventRSVPStatus[] | ListEnumEventRSVPStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumEventRSVPStatusFilter<$PrismaModel> | $Enums.EventRSVPStatus
  }

  export type EventScalarRelationFilter = {
    is?: EventWhereInput
    isNot?: EventWhereInput
  }

  export type EventAttendeeEventIdUserIdCompoundUniqueInput = {
    eventId: string
    userId: string
  }

  export type EventAttendeeCountOrderByAggregateInput = {
    id?: SortOrder
    eventId?: SortOrder
    userId?: SortOrder
    rsvpStatus?: SortOrder
    joinedAt?: SortOrder
  }

  export type EventAttendeeMaxOrderByAggregateInput = {
    id?: SortOrder
    eventId?: SortOrder
    userId?: SortOrder
    rsvpStatus?: SortOrder
    joinedAt?: SortOrder
  }

  export type EventAttendeeMinOrderByAggregateInput = {
    id?: SortOrder
    eventId?: SortOrder
    userId?: SortOrder
    rsvpStatus?: SortOrder
    joinedAt?: SortOrder
  }

  export type EnumEventRSVPStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.EventRSVPStatus | EnumEventRSVPStatusFieldRefInput<$PrismaModel>
    in?: $Enums.EventRSVPStatus[] | ListEnumEventRSVPStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.EventRSVPStatus[] | ListEnumEventRSVPStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumEventRSVPStatusWithAggregatesFilter<$PrismaModel> | $Enums.EventRSVPStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumEventRSVPStatusFilter<$PrismaModel>
    _max?: NestedEnumEventRSVPStatusFilter<$PrismaModel>
  }

  export type EventWaitlistEventIdUserIdCompoundUniqueInput = {
    eventId: string
    userId: string
  }

  export type EventWaitlistCountOrderByAggregateInput = {
    id?: SortOrder
    eventId?: SortOrder
    userId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type EventWaitlistMaxOrderByAggregateInput = {
    id?: SortOrder
    eventId?: SortOrder
    userId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type EventWaitlistMinOrderByAggregateInput = {
    id?: SortOrder
    eventId?: SortOrder
    userId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type EventInterestEventIdSubInterestIdCompoundUniqueInput = {
    eventId: string
    subInterestId: string
  }

  export type EventInterestCountOrderByAggregateInput = {
    eventId?: SortOrder
    subInterestId?: SortOrder
  }

  export type EventInterestMaxOrderByAggregateInput = {
    eventId?: SortOrder
    subInterestId?: SortOrder
  }

  export type EventInterestMinOrderByAggregateInput = {
    eventId?: SortOrder
    subInterestId?: SortOrder
  }

  export type EventAttendeeCreateNestedManyWithoutEventInput = {
    create?: XOR<EventAttendeeCreateWithoutEventInput, EventAttendeeUncheckedCreateWithoutEventInput> | EventAttendeeCreateWithoutEventInput[] | EventAttendeeUncheckedCreateWithoutEventInput[]
    connectOrCreate?: EventAttendeeCreateOrConnectWithoutEventInput | EventAttendeeCreateOrConnectWithoutEventInput[]
    createMany?: EventAttendeeCreateManyEventInputEnvelope
    connect?: EventAttendeeWhereUniqueInput | EventAttendeeWhereUniqueInput[]
  }

  export type EventWaitlistCreateNestedManyWithoutEventInput = {
    create?: XOR<EventWaitlistCreateWithoutEventInput, EventWaitlistUncheckedCreateWithoutEventInput> | EventWaitlistCreateWithoutEventInput[] | EventWaitlistUncheckedCreateWithoutEventInput[]
    connectOrCreate?: EventWaitlistCreateOrConnectWithoutEventInput | EventWaitlistCreateOrConnectWithoutEventInput[]
    createMany?: EventWaitlistCreateManyEventInputEnvelope
    connect?: EventWaitlistWhereUniqueInput | EventWaitlistWhereUniqueInput[]
  }

  export type EventInterestCreateNestedManyWithoutEventInput = {
    create?: XOR<EventInterestCreateWithoutEventInput, EventInterestUncheckedCreateWithoutEventInput> | EventInterestCreateWithoutEventInput[] | EventInterestUncheckedCreateWithoutEventInput[]
    connectOrCreate?: EventInterestCreateOrConnectWithoutEventInput | EventInterestCreateOrConnectWithoutEventInput[]
    createMany?: EventInterestCreateManyEventInputEnvelope
    connect?: EventInterestWhereUniqueInput | EventInterestWhereUniqueInput[]
  }

  export type EventAttendeeUncheckedCreateNestedManyWithoutEventInput = {
    create?: XOR<EventAttendeeCreateWithoutEventInput, EventAttendeeUncheckedCreateWithoutEventInput> | EventAttendeeCreateWithoutEventInput[] | EventAttendeeUncheckedCreateWithoutEventInput[]
    connectOrCreate?: EventAttendeeCreateOrConnectWithoutEventInput | EventAttendeeCreateOrConnectWithoutEventInput[]
    createMany?: EventAttendeeCreateManyEventInputEnvelope
    connect?: EventAttendeeWhereUniqueInput | EventAttendeeWhereUniqueInput[]
  }

  export type EventWaitlistUncheckedCreateNestedManyWithoutEventInput = {
    create?: XOR<EventWaitlistCreateWithoutEventInput, EventWaitlistUncheckedCreateWithoutEventInput> | EventWaitlistCreateWithoutEventInput[] | EventWaitlistUncheckedCreateWithoutEventInput[]
    connectOrCreate?: EventWaitlistCreateOrConnectWithoutEventInput | EventWaitlistCreateOrConnectWithoutEventInput[]
    createMany?: EventWaitlistCreateManyEventInputEnvelope
    connect?: EventWaitlistWhereUniqueInput | EventWaitlistWhereUniqueInput[]
  }

  export type EventInterestUncheckedCreateNestedManyWithoutEventInput = {
    create?: XOR<EventInterestCreateWithoutEventInput, EventInterestUncheckedCreateWithoutEventInput> | EventInterestCreateWithoutEventInput[] | EventInterestUncheckedCreateWithoutEventInput[]
    connectOrCreate?: EventInterestCreateOrConnectWithoutEventInput | EventInterestCreateOrConnectWithoutEventInput[]
    createMany?: EventInterestCreateManyEventInputEnvelope
    connect?: EventInterestWhereUniqueInput | EventInterestWhereUniqueInput[]
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type EnumEventModeFieldUpdateOperationsInput = {
    set?: $Enums.EventMode
  }

  export type NullableIntFieldUpdateOperationsInput = {
    set?: number | null
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type EventAttendeeUpdateManyWithoutEventNestedInput = {
    create?: XOR<EventAttendeeCreateWithoutEventInput, EventAttendeeUncheckedCreateWithoutEventInput> | EventAttendeeCreateWithoutEventInput[] | EventAttendeeUncheckedCreateWithoutEventInput[]
    connectOrCreate?: EventAttendeeCreateOrConnectWithoutEventInput | EventAttendeeCreateOrConnectWithoutEventInput[]
    upsert?: EventAttendeeUpsertWithWhereUniqueWithoutEventInput | EventAttendeeUpsertWithWhereUniqueWithoutEventInput[]
    createMany?: EventAttendeeCreateManyEventInputEnvelope
    set?: EventAttendeeWhereUniqueInput | EventAttendeeWhereUniqueInput[]
    disconnect?: EventAttendeeWhereUniqueInput | EventAttendeeWhereUniqueInput[]
    delete?: EventAttendeeWhereUniqueInput | EventAttendeeWhereUniqueInput[]
    connect?: EventAttendeeWhereUniqueInput | EventAttendeeWhereUniqueInput[]
    update?: EventAttendeeUpdateWithWhereUniqueWithoutEventInput | EventAttendeeUpdateWithWhereUniqueWithoutEventInput[]
    updateMany?: EventAttendeeUpdateManyWithWhereWithoutEventInput | EventAttendeeUpdateManyWithWhereWithoutEventInput[]
    deleteMany?: EventAttendeeScalarWhereInput | EventAttendeeScalarWhereInput[]
  }

  export type EventWaitlistUpdateManyWithoutEventNestedInput = {
    create?: XOR<EventWaitlistCreateWithoutEventInput, EventWaitlistUncheckedCreateWithoutEventInput> | EventWaitlistCreateWithoutEventInput[] | EventWaitlistUncheckedCreateWithoutEventInput[]
    connectOrCreate?: EventWaitlistCreateOrConnectWithoutEventInput | EventWaitlistCreateOrConnectWithoutEventInput[]
    upsert?: EventWaitlistUpsertWithWhereUniqueWithoutEventInput | EventWaitlistUpsertWithWhereUniqueWithoutEventInput[]
    createMany?: EventWaitlistCreateManyEventInputEnvelope
    set?: EventWaitlistWhereUniqueInput | EventWaitlistWhereUniqueInput[]
    disconnect?: EventWaitlistWhereUniqueInput | EventWaitlistWhereUniqueInput[]
    delete?: EventWaitlistWhereUniqueInput | EventWaitlistWhereUniqueInput[]
    connect?: EventWaitlistWhereUniqueInput | EventWaitlistWhereUniqueInput[]
    update?: EventWaitlistUpdateWithWhereUniqueWithoutEventInput | EventWaitlistUpdateWithWhereUniqueWithoutEventInput[]
    updateMany?: EventWaitlistUpdateManyWithWhereWithoutEventInput | EventWaitlistUpdateManyWithWhereWithoutEventInput[]
    deleteMany?: EventWaitlistScalarWhereInput | EventWaitlistScalarWhereInput[]
  }

  export type EventInterestUpdateManyWithoutEventNestedInput = {
    create?: XOR<EventInterestCreateWithoutEventInput, EventInterestUncheckedCreateWithoutEventInput> | EventInterestCreateWithoutEventInput[] | EventInterestUncheckedCreateWithoutEventInput[]
    connectOrCreate?: EventInterestCreateOrConnectWithoutEventInput | EventInterestCreateOrConnectWithoutEventInput[]
    upsert?: EventInterestUpsertWithWhereUniqueWithoutEventInput | EventInterestUpsertWithWhereUniqueWithoutEventInput[]
    createMany?: EventInterestCreateManyEventInputEnvelope
    set?: EventInterestWhereUniqueInput | EventInterestWhereUniqueInput[]
    disconnect?: EventInterestWhereUniqueInput | EventInterestWhereUniqueInput[]
    delete?: EventInterestWhereUniqueInput | EventInterestWhereUniqueInput[]
    connect?: EventInterestWhereUniqueInput | EventInterestWhereUniqueInput[]
    update?: EventInterestUpdateWithWhereUniqueWithoutEventInput | EventInterestUpdateWithWhereUniqueWithoutEventInput[]
    updateMany?: EventInterestUpdateManyWithWhereWithoutEventInput | EventInterestUpdateManyWithWhereWithoutEventInput[]
    deleteMany?: EventInterestScalarWhereInput | EventInterestScalarWhereInput[]
  }

  export type EventAttendeeUncheckedUpdateManyWithoutEventNestedInput = {
    create?: XOR<EventAttendeeCreateWithoutEventInput, EventAttendeeUncheckedCreateWithoutEventInput> | EventAttendeeCreateWithoutEventInput[] | EventAttendeeUncheckedCreateWithoutEventInput[]
    connectOrCreate?: EventAttendeeCreateOrConnectWithoutEventInput | EventAttendeeCreateOrConnectWithoutEventInput[]
    upsert?: EventAttendeeUpsertWithWhereUniqueWithoutEventInput | EventAttendeeUpsertWithWhereUniqueWithoutEventInput[]
    createMany?: EventAttendeeCreateManyEventInputEnvelope
    set?: EventAttendeeWhereUniqueInput | EventAttendeeWhereUniqueInput[]
    disconnect?: EventAttendeeWhereUniqueInput | EventAttendeeWhereUniqueInput[]
    delete?: EventAttendeeWhereUniqueInput | EventAttendeeWhereUniqueInput[]
    connect?: EventAttendeeWhereUniqueInput | EventAttendeeWhereUniqueInput[]
    update?: EventAttendeeUpdateWithWhereUniqueWithoutEventInput | EventAttendeeUpdateWithWhereUniqueWithoutEventInput[]
    updateMany?: EventAttendeeUpdateManyWithWhereWithoutEventInput | EventAttendeeUpdateManyWithWhereWithoutEventInput[]
    deleteMany?: EventAttendeeScalarWhereInput | EventAttendeeScalarWhereInput[]
  }

  export type EventWaitlistUncheckedUpdateManyWithoutEventNestedInput = {
    create?: XOR<EventWaitlistCreateWithoutEventInput, EventWaitlistUncheckedCreateWithoutEventInput> | EventWaitlistCreateWithoutEventInput[] | EventWaitlistUncheckedCreateWithoutEventInput[]
    connectOrCreate?: EventWaitlistCreateOrConnectWithoutEventInput | EventWaitlistCreateOrConnectWithoutEventInput[]
    upsert?: EventWaitlistUpsertWithWhereUniqueWithoutEventInput | EventWaitlistUpsertWithWhereUniqueWithoutEventInput[]
    createMany?: EventWaitlistCreateManyEventInputEnvelope
    set?: EventWaitlistWhereUniqueInput | EventWaitlistWhereUniqueInput[]
    disconnect?: EventWaitlistWhereUniqueInput | EventWaitlistWhereUniqueInput[]
    delete?: EventWaitlistWhereUniqueInput | EventWaitlistWhereUniqueInput[]
    connect?: EventWaitlistWhereUniqueInput | EventWaitlistWhereUniqueInput[]
    update?: EventWaitlistUpdateWithWhereUniqueWithoutEventInput | EventWaitlistUpdateWithWhereUniqueWithoutEventInput[]
    updateMany?: EventWaitlistUpdateManyWithWhereWithoutEventInput | EventWaitlistUpdateManyWithWhereWithoutEventInput[]
    deleteMany?: EventWaitlistScalarWhereInput | EventWaitlistScalarWhereInput[]
  }

  export type EventInterestUncheckedUpdateManyWithoutEventNestedInput = {
    create?: XOR<EventInterestCreateWithoutEventInput, EventInterestUncheckedCreateWithoutEventInput> | EventInterestCreateWithoutEventInput[] | EventInterestUncheckedCreateWithoutEventInput[]
    connectOrCreate?: EventInterestCreateOrConnectWithoutEventInput | EventInterestCreateOrConnectWithoutEventInput[]
    upsert?: EventInterestUpsertWithWhereUniqueWithoutEventInput | EventInterestUpsertWithWhereUniqueWithoutEventInput[]
    createMany?: EventInterestCreateManyEventInputEnvelope
    set?: EventInterestWhereUniqueInput | EventInterestWhereUniqueInput[]
    disconnect?: EventInterestWhereUniqueInput | EventInterestWhereUniqueInput[]
    delete?: EventInterestWhereUniqueInput | EventInterestWhereUniqueInput[]
    connect?: EventInterestWhereUniqueInput | EventInterestWhereUniqueInput[]
    update?: EventInterestUpdateWithWhereUniqueWithoutEventInput | EventInterestUpdateWithWhereUniqueWithoutEventInput[]
    updateMany?: EventInterestUpdateManyWithWhereWithoutEventInput | EventInterestUpdateManyWithWhereWithoutEventInput[]
    deleteMany?: EventInterestScalarWhereInput | EventInterestScalarWhereInput[]
  }

  export type EventCreateNestedOneWithoutAttendeesInput = {
    create?: XOR<EventCreateWithoutAttendeesInput, EventUncheckedCreateWithoutAttendeesInput>
    connectOrCreate?: EventCreateOrConnectWithoutAttendeesInput
    connect?: EventWhereUniqueInput
  }

  export type EnumEventRSVPStatusFieldUpdateOperationsInput = {
    set?: $Enums.EventRSVPStatus
  }

  export type EventUpdateOneRequiredWithoutAttendeesNestedInput = {
    create?: XOR<EventCreateWithoutAttendeesInput, EventUncheckedCreateWithoutAttendeesInput>
    connectOrCreate?: EventCreateOrConnectWithoutAttendeesInput
    upsert?: EventUpsertWithoutAttendeesInput
    connect?: EventWhereUniqueInput
    update?: XOR<XOR<EventUpdateToOneWithWhereWithoutAttendeesInput, EventUpdateWithoutAttendeesInput>, EventUncheckedUpdateWithoutAttendeesInput>
  }

  export type EventCreateNestedOneWithoutWaitlistInput = {
    create?: XOR<EventCreateWithoutWaitlistInput, EventUncheckedCreateWithoutWaitlistInput>
    connectOrCreate?: EventCreateOrConnectWithoutWaitlistInput
    connect?: EventWhereUniqueInput
  }

  export type EventUpdateOneRequiredWithoutWaitlistNestedInput = {
    create?: XOR<EventCreateWithoutWaitlistInput, EventUncheckedCreateWithoutWaitlistInput>
    connectOrCreate?: EventCreateOrConnectWithoutWaitlistInput
    upsert?: EventUpsertWithoutWaitlistInput
    connect?: EventWhereUniqueInput
    update?: XOR<XOR<EventUpdateToOneWithWhereWithoutWaitlistInput, EventUpdateWithoutWaitlistInput>, EventUncheckedUpdateWithoutWaitlistInput>
  }

  export type EventCreateNestedOneWithoutInterestsInput = {
    create?: XOR<EventCreateWithoutInterestsInput, EventUncheckedCreateWithoutInterestsInput>
    connectOrCreate?: EventCreateOrConnectWithoutInterestsInput
    connect?: EventWhereUniqueInput
  }

  export type EventUpdateOneRequiredWithoutInterestsNestedInput = {
    create?: XOR<EventCreateWithoutInterestsInput, EventUncheckedCreateWithoutInterestsInput>
    connectOrCreate?: EventCreateOrConnectWithoutInterestsInput
    upsert?: EventUpsertWithoutInterestsInput
    connect?: EventWhereUniqueInput
    update?: XOR<XOR<EventUpdateToOneWithWhereWithoutInterestsInput, EventUpdateWithoutInterestsInput>, EventUncheckedUpdateWithoutInterestsInput>
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedEnumEventModeFilter<$PrismaModel = never> = {
    equals?: $Enums.EventMode | EnumEventModeFieldRefInput<$PrismaModel>
    in?: $Enums.EventMode[] | ListEnumEventModeFieldRefInput<$PrismaModel>
    notIn?: $Enums.EventMode[] | ListEnumEventModeFieldRefInput<$PrismaModel>
    not?: NestedEnumEventModeFilter<$PrismaModel> | $Enums.EventMode
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedEnumEventModeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.EventMode | EnumEventModeFieldRefInput<$PrismaModel>
    in?: $Enums.EventMode[] | ListEnumEventModeFieldRefInput<$PrismaModel>
    notIn?: $Enums.EventMode[] | ListEnumEventModeFieldRefInput<$PrismaModel>
    not?: NestedEnumEventModeWithAggregatesFilter<$PrismaModel> | $Enums.EventMode
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumEventModeFilter<$PrismaModel>
    _max?: NestedEnumEventModeFilter<$PrismaModel>
  }

  export type NestedIntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }

  export type NestedFloatNullableFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableFilter<$PrismaModel> | number | null
  }

  export type NestedEnumEventRSVPStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.EventRSVPStatus | EnumEventRSVPStatusFieldRefInput<$PrismaModel>
    in?: $Enums.EventRSVPStatus[] | ListEnumEventRSVPStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.EventRSVPStatus[] | ListEnumEventRSVPStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumEventRSVPStatusFilter<$PrismaModel> | $Enums.EventRSVPStatus
  }

  export type NestedEnumEventRSVPStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.EventRSVPStatus | EnumEventRSVPStatusFieldRefInput<$PrismaModel>
    in?: $Enums.EventRSVPStatus[] | ListEnumEventRSVPStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.EventRSVPStatus[] | ListEnumEventRSVPStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumEventRSVPStatusWithAggregatesFilter<$PrismaModel> | $Enums.EventRSVPStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumEventRSVPStatusFilter<$PrismaModel>
    _max?: NestedEnumEventRSVPStatusFilter<$PrismaModel>
  }

  export type EventAttendeeCreateWithoutEventInput = {
    id?: string
    userId: string
    rsvpStatus: $Enums.EventRSVPStatus
    joinedAt?: Date | string
  }

  export type EventAttendeeUncheckedCreateWithoutEventInput = {
    id?: string
    userId: string
    rsvpStatus: $Enums.EventRSVPStatus
    joinedAt?: Date | string
  }

  export type EventAttendeeCreateOrConnectWithoutEventInput = {
    where: EventAttendeeWhereUniqueInput
    create: XOR<EventAttendeeCreateWithoutEventInput, EventAttendeeUncheckedCreateWithoutEventInput>
  }

  export type EventAttendeeCreateManyEventInputEnvelope = {
    data: EventAttendeeCreateManyEventInput | EventAttendeeCreateManyEventInput[]
    skipDuplicates?: boolean
  }

  export type EventWaitlistCreateWithoutEventInput = {
    id?: string
    userId: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type EventWaitlistUncheckedCreateWithoutEventInput = {
    id?: string
    userId: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type EventWaitlistCreateOrConnectWithoutEventInput = {
    where: EventWaitlistWhereUniqueInput
    create: XOR<EventWaitlistCreateWithoutEventInput, EventWaitlistUncheckedCreateWithoutEventInput>
  }

  export type EventWaitlistCreateManyEventInputEnvelope = {
    data: EventWaitlistCreateManyEventInput | EventWaitlistCreateManyEventInput[]
    skipDuplicates?: boolean
  }

  export type EventInterestCreateWithoutEventInput = {
    subInterestId: string
  }

  export type EventInterestUncheckedCreateWithoutEventInput = {
    subInterestId: string
  }

  export type EventInterestCreateOrConnectWithoutEventInput = {
    where: EventInterestWhereUniqueInput
    create: XOR<EventInterestCreateWithoutEventInput, EventInterestUncheckedCreateWithoutEventInput>
  }

  export type EventInterestCreateManyEventInputEnvelope = {
    data: EventInterestCreateManyEventInput | EventInterestCreateManyEventInput[]
    skipDuplicates?: boolean
  }

  export type EventAttendeeUpsertWithWhereUniqueWithoutEventInput = {
    where: EventAttendeeWhereUniqueInput
    update: XOR<EventAttendeeUpdateWithoutEventInput, EventAttendeeUncheckedUpdateWithoutEventInput>
    create: XOR<EventAttendeeCreateWithoutEventInput, EventAttendeeUncheckedCreateWithoutEventInput>
  }

  export type EventAttendeeUpdateWithWhereUniqueWithoutEventInput = {
    where: EventAttendeeWhereUniqueInput
    data: XOR<EventAttendeeUpdateWithoutEventInput, EventAttendeeUncheckedUpdateWithoutEventInput>
  }

  export type EventAttendeeUpdateManyWithWhereWithoutEventInput = {
    where: EventAttendeeScalarWhereInput
    data: XOR<EventAttendeeUpdateManyMutationInput, EventAttendeeUncheckedUpdateManyWithoutEventInput>
  }

  export type EventAttendeeScalarWhereInput = {
    AND?: EventAttendeeScalarWhereInput | EventAttendeeScalarWhereInput[]
    OR?: EventAttendeeScalarWhereInput[]
    NOT?: EventAttendeeScalarWhereInput | EventAttendeeScalarWhereInput[]
    id?: StringFilter<"EventAttendee"> | string
    eventId?: StringFilter<"EventAttendee"> | string
    userId?: StringFilter<"EventAttendee"> | string
    rsvpStatus?: EnumEventRSVPStatusFilter<"EventAttendee"> | $Enums.EventRSVPStatus
    joinedAt?: DateTimeFilter<"EventAttendee"> | Date | string
  }

  export type EventWaitlistUpsertWithWhereUniqueWithoutEventInput = {
    where: EventWaitlistWhereUniqueInput
    update: XOR<EventWaitlistUpdateWithoutEventInput, EventWaitlistUncheckedUpdateWithoutEventInput>
    create: XOR<EventWaitlistCreateWithoutEventInput, EventWaitlistUncheckedCreateWithoutEventInput>
  }

  export type EventWaitlistUpdateWithWhereUniqueWithoutEventInput = {
    where: EventWaitlistWhereUniqueInput
    data: XOR<EventWaitlistUpdateWithoutEventInput, EventWaitlistUncheckedUpdateWithoutEventInput>
  }

  export type EventWaitlistUpdateManyWithWhereWithoutEventInput = {
    where: EventWaitlistScalarWhereInput
    data: XOR<EventWaitlistUpdateManyMutationInput, EventWaitlistUncheckedUpdateManyWithoutEventInput>
  }

  export type EventWaitlistScalarWhereInput = {
    AND?: EventWaitlistScalarWhereInput | EventWaitlistScalarWhereInput[]
    OR?: EventWaitlistScalarWhereInput[]
    NOT?: EventWaitlistScalarWhereInput | EventWaitlistScalarWhereInput[]
    id?: StringFilter<"EventWaitlist"> | string
    eventId?: StringFilter<"EventWaitlist"> | string
    userId?: StringFilter<"EventWaitlist"> | string
    createdAt?: DateTimeFilter<"EventWaitlist"> | Date | string
    updatedAt?: DateTimeFilter<"EventWaitlist"> | Date | string
  }

  export type EventInterestUpsertWithWhereUniqueWithoutEventInput = {
    where: EventInterestWhereUniqueInput
    update: XOR<EventInterestUpdateWithoutEventInput, EventInterestUncheckedUpdateWithoutEventInput>
    create: XOR<EventInterestCreateWithoutEventInput, EventInterestUncheckedCreateWithoutEventInput>
  }

  export type EventInterestUpdateWithWhereUniqueWithoutEventInput = {
    where: EventInterestWhereUniqueInput
    data: XOR<EventInterestUpdateWithoutEventInput, EventInterestUncheckedUpdateWithoutEventInput>
  }

  export type EventInterestUpdateManyWithWhereWithoutEventInput = {
    where: EventInterestScalarWhereInput
    data: XOR<EventInterestUpdateManyMutationInput, EventInterestUncheckedUpdateManyWithoutEventInput>
  }

  export type EventInterestScalarWhereInput = {
    AND?: EventInterestScalarWhereInput | EventInterestScalarWhereInput[]
    OR?: EventInterestScalarWhereInput[]
    NOT?: EventInterestScalarWhereInput | EventInterestScalarWhereInput[]
    eventId?: StringFilter<"EventInterest"> | string
    subInterestId?: StringFilter<"EventInterest"> | string
  }

  export type EventCreateWithoutAttendeesInput = {
    id?: string
    title: string
    description?: string | null
    organizerId: string
    startAt: Date | string
    endAt: Date | string
    mode: $Enums.EventMode
    meetingUrl?: string | null
    platform?: string | null
    joinUrl?: string | null
    venue?: string | null
    location?: string | null
    capacity?: number | null
    bannerImageUrl?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    waitlist?: EventWaitlistCreateNestedManyWithoutEventInput
    interests?: EventInterestCreateNestedManyWithoutEventInput
  }

  export type EventUncheckedCreateWithoutAttendeesInput = {
    id?: string
    title: string
    description?: string | null
    organizerId: string
    startAt: Date | string
    endAt: Date | string
    mode: $Enums.EventMode
    meetingUrl?: string | null
    platform?: string | null
    joinUrl?: string | null
    venue?: string | null
    location?: string | null
    capacity?: number | null
    bannerImageUrl?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    waitlist?: EventWaitlistUncheckedCreateNestedManyWithoutEventInput
    interests?: EventInterestUncheckedCreateNestedManyWithoutEventInput
  }

  export type EventCreateOrConnectWithoutAttendeesInput = {
    where: EventWhereUniqueInput
    create: XOR<EventCreateWithoutAttendeesInput, EventUncheckedCreateWithoutAttendeesInput>
  }

  export type EventUpsertWithoutAttendeesInput = {
    update: XOR<EventUpdateWithoutAttendeesInput, EventUncheckedUpdateWithoutAttendeesInput>
    create: XOR<EventCreateWithoutAttendeesInput, EventUncheckedCreateWithoutAttendeesInput>
    where?: EventWhereInput
  }

  export type EventUpdateToOneWithWhereWithoutAttendeesInput = {
    where?: EventWhereInput
    data: XOR<EventUpdateWithoutAttendeesInput, EventUncheckedUpdateWithoutAttendeesInput>
  }

  export type EventUpdateWithoutAttendeesInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    organizerId?: StringFieldUpdateOperationsInput | string
    startAt?: DateTimeFieldUpdateOperationsInput | Date | string
    endAt?: DateTimeFieldUpdateOperationsInput | Date | string
    mode?: EnumEventModeFieldUpdateOperationsInput | $Enums.EventMode
    meetingUrl?: NullableStringFieldUpdateOperationsInput | string | null
    platform?: NullableStringFieldUpdateOperationsInput | string | null
    joinUrl?: NullableStringFieldUpdateOperationsInput | string | null
    venue?: NullableStringFieldUpdateOperationsInput | string | null
    location?: NullableStringFieldUpdateOperationsInput | string | null
    capacity?: NullableIntFieldUpdateOperationsInput | number | null
    bannerImageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    waitlist?: EventWaitlistUpdateManyWithoutEventNestedInput
    interests?: EventInterestUpdateManyWithoutEventNestedInput
  }

  export type EventUncheckedUpdateWithoutAttendeesInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    organizerId?: StringFieldUpdateOperationsInput | string
    startAt?: DateTimeFieldUpdateOperationsInput | Date | string
    endAt?: DateTimeFieldUpdateOperationsInput | Date | string
    mode?: EnumEventModeFieldUpdateOperationsInput | $Enums.EventMode
    meetingUrl?: NullableStringFieldUpdateOperationsInput | string | null
    platform?: NullableStringFieldUpdateOperationsInput | string | null
    joinUrl?: NullableStringFieldUpdateOperationsInput | string | null
    venue?: NullableStringFieldUpdateOperationsInput | string | null
    location?: NullableStringFieldUpdateOperationsInput | string | null
    capacity?: NullableIntFieldUpdateOperationsInput | number | null
    bannerImageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    waitlist?: EventWaitlistUncheckedUpdateManyWithoutEventNestedInput
    interests?: EventInterestUncheckedUpdateManyWithoutEventNestedInput
  }

  export type EventCreateWithoutWaitlistInput = {
    id?: string
    title: string
    description?: string | null
    organizerId: string
    startAt: Date | string
    endAt: Date | string
    mode: $Enums.EventMode
    meetingUrl?: string | null
    platform?: string | null
    joinUrl?: string | null
    venue?: string | null
    location?: string | null
    capacity?: number | null
    bannerImageUrl?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    attendees?: EventAttendeeCreateNestedManyWithoutEventInput
    interests?: EventInterestCreateNestedManyWithoutEventInput
  }

  export type EventUncheckedCreateWithoutWaitlistInput = {
    id?: string
    title: string
    description?: string | null
    organizerId: string
    startAt: Date | string
    endAt: Date | string
    mode: $Enums.EventMode
    meetingUrl?: string | null
    platform?: string | null
    joinUrl?: string | null
    venue?: string | null
    location?: string | null
    capacity?: number | null
    bannerImageUrl?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    attendees?: EventAttendeeUncheckedCreateNestedManyWithoutEventInput
    interests?: EventInterestUncheckedCreateNestedManyWithoutEventInput
  }

  export type EventCreateOrConnectWithoutWaitlistInput = {
    where: EventWhereUniqueInput
    create: XOR<EventCreateWithoutWaitlistInput, EventUncheckedCreateWithoutWaitlistInput>
  }

  export type EventUpsertWithoutWaitlistInput = {
    update: XOR<EventUpdateWithoutWaitlistInput, EventUncheckedUpdateWithoutWaitlistInput>
    create: XOR<EventCreateWithoutWaitlistInput, EventUncheckedCreateWithoutWaitlistInput>
    where?: EventWhereInput
  }

  export type EventUpdateToOneWithWhereWithoutWaitlistInput = {
    where?: EventWhereInput
    data: XOR<EventUpdateWithoutWaitlistInput, EventUncheckedUpdateWithoutWaitlistInput>
  }

  export type EventUpdateWithoutWaitlistInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    organizerId?: StringFieldUpdateOperationsInput | string
    startAt?: DateTimeFieldUpdateOperationsInput | Date | string
    endAt?: DateTimeFieldUpdateOperationsInput | Date | string
    mode?: EnumEventModeFieldUpdateOperationsInput | $Enums.EventMode
    meetingUrl?: NullableStringFieldUpdateOperationsInput | string | null
    platform?: NullableStringFieldUpdateOperationsInput | string | null
    joinUrl?: NullableStringFieldUpdateOperationsInput | string | null
    venue?: NullableStringFieldUpdateOperationsInput | string | null
    location?: NullableStringFieldUpdateOperationsInput | string | null
    capacity?: NullableIntFieldUpdateOperationsInput | number | null
    bannerImageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    attendees?: EventAttendeeUpdateManyWithoutEventNestedInput
    interests?: EventInterestUpdateManyWithoutEventNestedInput
  }

  export type EventUncheckedUpdateWithoutWaitlistInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    organizerId?: StringFieldUpdateOperationsInput | string
    startAt?: DateTimeFieldUpdateOperationsInput | Date | string
    endAt?: DateTimeFieldUpdateOperationsInput | Date | string
    mode?: EnumEventModeFieldUpdateOperationsInput | $Enums.EventMode
    meetingUrl?: NullableStringFieldUpdateOperationsInput | string | null
    platform?: NullableStringFieldUpdateOperationsInput | string | null
    joinUrl?: NullableStringFieldUpdateOperationsInput | string | null
    venue?: NullableStringFieldUpdateOperationsInput | string | null
    location?: NullableStringFieldUpdateOperationsInput | string | null
    capacity?: NullableIntFieldUpdateOperationsInput | number | null
    bannerImageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    attendees?: EventAttendeeUncheckedUpdateManyWithoutEventNestedInput
    interests?: EventInterestUncheckedUpdateManyWithoutEventNestedInput
  }

  export type EventCreateWithoutInterestsInput = {
    id?: string
    title: string
    description?: string | null
    organizerId: string
    startAt: Date | string
    endAt: Date | string
    mode: $Enums.EventMode
    meetingUrl?: string | null
    platform?: string | null
    joinUrl?: string | null
    venue?: string | null
    location?: string | null
    capacity?: number | null
    bannerImageUrl?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    attendees?: EventAttendeeCreateNestedManyWithoutEventInput
    waitlist?: EventWaitlistCreateNestedManyWithoutEventInput
  }

  export type EventUncheckedCreateWithoutInterestsInput = {
    id?: string
    title: string
    description?: string | null
    organizerId: string
    startAt: Date | string
    endAt: Date | string
    mode: $Enums.EventMode
    meetingUrl?: string | null
    platform?: string | null
    joinUrl?: string | null
    venue?: string | null
    location?: string | null
    capacity?: number | null
    bannerImageUrl?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    attendees?: EventAttendeeUncheckedCreateNestedManyWithoutEventInput
    waitlist?: EventWaitlistUncheckedCreateNestedManyWithoutEventInput
  }

  export type EventCreateOrConnectWithoutInterestsInput = {
    where: EventWhereUniqueInput
    create: XOR<EventCreateWithoutInterestsInput, EventUncheckedCreateWithoutInterestsInput>
  }

  export type EventUpsertWithoutInterestsInput = {
    update: XOR<EventUpdateWithoutInterestsInput, EventUncheckedUpdateWithoutInterestsInput>
    create: XOR<EventCreateWithoutInterestsInput, EventUncheckedCreateWithoutInterestsInput>
    where?: EventWhereInput
  }

  export type EventUpdateToOneWithWhereWithoutInterestsInput = {
    where?: EventWhereInput
    data: XOR<EventUpdateWithoutInterestsInput, EventUncheckedUpdateWithoutInterestsInput>
  }

  export type EventUpdateWithoutInterestsInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    organizerId?: StringFieldUpdateOperationsInput | string
    startAt?: DateTimeFieldUpdateOperationsInput | Date | string
    endAt?: DateTimeFieldUpdateOperationsInput | Date | string
    mode?: EnumEventModeFieldUpdateOperationsInput | $Enums.EventMode
    meetingUrl?: NullableStringFieldUpdateOperationsInput | string | null
    platform?: NullableStringFieldUpdateOperationsInput | string | null
    joinUrl?: NullableStringFieldUpdateOperationsInput | string | null
    venue?: NullableStringFieldUpdateOperationsInput | string | null
    location?: NullableStringFieldUpdateOperationsInput | string | null
    capacity?: NullableIntFieldUpdateOperationsInput | number | null
    bannerImageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    attendees?: EventAttendeeUpdateManyWithoutEventNestedInput
    waitlist?: EventWaitlistUpdateManyWithoutEventNestedInput
  }

  export type EventUncheckedUpdateWithoutInterestsInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    organizerId?: StringFieldUpdateOperationsInput | string
    startAt?: DateTimeFieldUpdateOperationsInput | Date | string
    endAt?: DateTimeFieldUpdateOperationsInput | Date | string
    mode?: EnumEventModeFieldUpdateOperationsInput | $Enums.EventMode
    meetingUrl?: NullableStringFieldUpdateOperationsInput | string | null
    platform?: NullableStringFieldUpdateOperationsInput | string | null
    joinUrl?: NullableStringFieldUpdateOperationsInput | string | null
    venue?: NullableStringFieldUpdateOperationsInput | string | null
    location?: NullableStringFieldUpdateOperationsInput | string | null
    capacity?: NullableIntFieldUpdateOperationsInput | number | null
    bannerImageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    attendees?: EventAttendeeUncheckedUpdateManyWithoutEventNestedInput
    waitlist?: EventWaitlistUncheckedUpdateManyWithoutEventNestedInput
  }

  export type EventAttendeeCreateManyEventInput = {
    id?: string
    userId: string
    rsvpStatus: $Enums.EventRSVPStatus
    joinedAt?: Date | string
  }

  export type EventWaitlistCreateManyEventInput = {
    id?: string
    userId: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type EventInterestCreateManyEventInput = {
    subInterestId: string
  }

  export type EventAttendeeUpdateWithoutEventInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    rsvpStatus?: EnumEventRSVPStatusFieldUpdateOperationsInput | $Enums.EventRSVPStatus
    joinedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type EventAttendeeUncheckedUpdateWithoutEventInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    rsvpStatus?: EnumEventRSVPStatusFieldUpdateOperationsInput | $Enums.EventRSVPStatus
    joinedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type EventAttendeeUncheckedUpdateManyWithoutEventInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    rsvpStatus?: EnumEventRSVPStatusFieldUpdateOperationsInput | $Enums.EventRSVPStatus
    joinedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type EventWaitlistUpdateWithoutEventInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type EventWaitlistUncheckedUpdateWithoutEventInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type EventWaitlistUncheckedUpdateManyWithoutEventInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type EventInterestUpdateWithoutEventInput = {
    subInterestId?: StringFieldUpdateOperationsInput | string
  }

  export type EventInterestUncheckedUpdateWithoutEventInput = {
    subInterestId?: StringFieldUpdateOperationsInput | string
  }

  export type EventInterestUncheckedUpdateManyWithoutEventInput = {
    subInterestId?: StringFieldUpdateOperationsInput | string
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}