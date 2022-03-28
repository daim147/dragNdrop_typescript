// autobind decorator
export const AutoBindThis = (_: any, __: string, property: PropertyDescriptor) => {
  let { value, writable, ...object } = property;

  let returnObj = {
    ...object,
    get() {
      return value.bind(this);
    },
    set() {},
  };

  return returnObj;
};
