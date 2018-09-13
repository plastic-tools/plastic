let nextId = 1;
export const uuid = () => `uuid-${nextId++}`;
export default uuid;
