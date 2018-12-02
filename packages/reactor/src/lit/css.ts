export const css = (strings: TemplateStringsArray, ...values: any[]) => {
  const ret: string[] = [];
  for (let i = 0, lim = strings.length; i < lim; i++) {
    ret.push(strings[i]);
    if (i < values.length) ret.push(values[i]);
  }
  return ret.join("");
};

export default css;
