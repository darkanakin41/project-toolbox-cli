export namespace ObjectTools {
    export function flatten(obj: { [key: string]: string | object | null | number }): { [key: string]: string | null } {
        let result: { [key: string]: string | null } = {};

        Object.keys(obj).forEach((field) => {
            const value = obj[field]
            if (value === null) {
                result[field] = value;
            } else if ((typeof value) === 'object' && !Array.isArray(value)) {
                const temp = flatten(value);
                for (const j in temp) {
                    const tempValue = temp[j]
                    result[field + '.' + j] = (tempValue !== null ? tempValue.toString() : null);
                }
            } else {
                result[field] = value.toString();
            }
        })
        return result;
    }
}