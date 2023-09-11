export interface AnObject {
  [key: string]: string | object | null | number | AnObject | boolean;
}

export class ObjectTools {
  static flatten(obj: AnObject): { [key: string]: string | null } {
    const result: { [key: string]: string | null } = {};

    Object.keys(obj).forEach((field) => {
      const value = obj[field];
      if (value === null) {
        result[field] = value;
      } else if (typeof value === 'object' && !Array.isArray(value)) {
        // @ts-ignore
        const temp = this.flatten(value);
        for (const j in temp) {
          const tempValue = temp[j];
          result[field + '.' + j] = tempValue !== null ? tempValue.toString() : null;
        }
      } else {
        result[field] = value.toString();
      }
    });
    return result;
  }
}
