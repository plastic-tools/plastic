export interface Poolable {
  /** Resets the state of the object */
  poolReset?();
}

type Constructor<T> = new () => T;

/** Simple internal pool manager */
export class Pool {
  POOL_LIMIT = 20;
  readonly pools = new WeakMap<Constructor<any>, any[]>();
  get<T extends Poolable>(Class: Constructor<T>): T {
    const pools = this.pools;
    const pool = pools.get(Class);
    return (pool && pool.pop()) || new Class();
  }

  release<T extends Poolable>(inst: T) {
    const { pools, POOL_LIMIT } = this;
    const Class = inst.constructor as Constructor<T>;
    let pool = pools.get(Class);
    if (!pool) pool = pools.set(Class, []).get(Class);
    if (pool.length < POOL_LIMIT) {
      if (inst.poolReset) inst.poolReset();
      pool.push(inst);
    }
    return this;
  }
}

export const pool = new Pool();
export default pool;
