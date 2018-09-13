import {
  TrackedValue,
  Revision,
  reactor as sharedReactor,
  Reactor
} from "@plastic/reactor";
import { uuid, AnyJSON, pool } from "@plastic/runtime";

abstract class CellData<T = any> {
  /** if json is passed, restore from state */
  constructor(readonly container: CellContainer, json?: AnyJSON) {}

  /** Used to serialize the data.*/
  static readonly TYPE: string;

  /** The current value of the cell data. */
  abstract get(cell: Cell): T;

  /** If defined then can be used to modify the cell data */
  set?(v: T, cell: Cell): void;

  /** If defined will be consulated when validating cell */
  validate?(rev: Revision, changes: Set<TrackedValue>, cell: Cell<T>): boolean;

  /** Configure cell state from the JSON */
  fromJSON(json: AnyJSON) {}

  /** Returns JSON that can be used to reconstruct the cell data later. */
  toJSON(): AnyJSON {
    return {};
  }

  static fromJSON(container: CellContainer, json: AnyJSON) {
    return new (this as any)(container, json);
  }
}

interface CellDataConstructor<T = any> {
  fromJSON(container: CellContainer, json: AnyJSON): CellData<T>;
  readonly TYPE: string;
}

class StaticCellData extends CellData<AnyJSON> {
  static readonly TYPE = "static";

  protected value: AnyJSON;
  get() {
    return this.value;
  }

  set(v: AnyJSON) {
    this.value = v;
  }

  toJSON() {
    return this.value;
  }

  fromJSON(json: AnyJSON) {
    this.value = json;
  }
}

interface CellJSON {
  id: string;
  type: string;
  data: AnyJSON;
  changed: number;
}

class CellContainer {
  constructor(readonly reactor = sharedReactor) {}

  types: { [type: string]: CellDataConstructor } = {
    [StaticCellData.TYPE]: StaticCellData
  };

  registerType(cellDataConstructor: CellDataConstructor) {
    this.types[cellDataConstructor.TYPE] = cellDataConstructor;
  }

  unregisterType(cellDataConstructor: CellDataConstructor) {
    const { types } = this;
    if (types[cellDataConstructor.TYPE] === cellDataConstructor) {
      delete types[cellDataConstructor.TYPE];
    }
  }
}

export class Cell<T = any> implements TrackedValue {
  constructor(
    readonly container: CellContainer,
    readonly id = uuid(),
    private _data: CellData<T> = null,
    public changed = Revision.NEVER
  ) {}

  get data(): CellData<T> {
    const { _data } = this;
    this.recordAccess();
    return _data;
  }

  set data(v: CellData<T>) {
    this._data = v;
    this.recordChange();
  }

  get value(): T {
    const { _data } = this;
    this.recordAccess();
    return _data && _data.get(this);
  }

  set value(v: T) {
    const { _data } = this;
    if (_data && _data.set) _data.set(v, this);
    this.recordChange();
  }

  validate(rev: Revision, changes: Set<TrackedValue>) {
    const { data, changed } = this;
    return (
      changed <= rev &&
      (data && data.validate && data.validate(rev, changes, this))
    );
  }

  get reactor() {
    return this.container.reactor;
  }

  recordAccess() {
    this.reactor.recordAccess(this);
  }

  recordChange() {
    this.changed = this.reactor.recordChange(this);
  }

  toJSON(): CellJSON {
    const { id, _data, changed } = this;
    return {
      id,
      changed,
      type: _data && (_data.constructor as typeof CellData).TYPE,
      data: _data && _data.toJSON()
    };
  }

  static fromJSON(
    container: CellContainer,
    { id, changed, type, data }: CellJSON
  ) {
    const CellDataClass = type && container.types[type];
    return new this(
      container,
      id,
      CellDataClass && CellDataClass.fromJSON(container, data),
      changed
    );
  }
}
