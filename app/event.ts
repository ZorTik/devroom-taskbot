interface EnumLike<T extends string, U> {
    [key: string]: U;
}

type AnyFunc = (...args: any[]) => any;

class EventEmitter<E extends EnumLike<string, AnyFunc>> {
    private readonly listeners: Map<any, AnyFunc[]> = new Map();
    on<K extends keyof E>(name: K, listener: E[K]) {
        const listeners = this.listeners.get(name) ?? [];
        listeners.push(listener);
        this.listeners.set(name, listeners);
    }
    emit<K extends keyof E>(name: K, ...args: Parameters<E[K]>) {
        const listeners = this.listeners.get(name) ?? [];
        for (const listener of listeners) {
            listener(...args);
        }
    }
}

export {
    EventEmitter
}
