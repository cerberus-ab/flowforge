// simple natural number generator
export function nextIdGenerator(): () => number {
    let id = 0;

    return function nextId(): number {
        return id++;
    };
}
