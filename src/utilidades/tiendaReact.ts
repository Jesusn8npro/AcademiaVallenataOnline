/**
 * 💡 TIENDA REACT (Reemplazo de Svelte Stores)
 * ==========================================
 * Implementación simple de 'writable', 'derived' y 'get' 
 * para usar estados globales en React de manera similar a Svelte.
 */

export type Subscriber<T> = (value: T) => void;
export type Unsubscriber = () => void;
export type Updater<T> = (value: T) => T;

export interface Readable<T> {
    subscribe(run: Subscriber<T>): Unsubscriber;
}

export interface Writable<T> extends Readable<T> {
    set(value: T): void;
    update(updater: Updater<T>): void;
}

/**
 * Crea una tienda escribible (writable)
 */
export function writable<T>(value: T): Writable<T> {
    const subscribers = new Set<Subscriber<T>>();

    function subscribe(run: Subscriber<T>): Unsubscriber {
        subscribers.add(run);
        run(value);
        return () => subscribers.delete(run);
    }

    function set(newValue: T): void {
        if (value !== newValue) {
            value = newValue;
            subscribers.forEach(run => run(value));
        }
    }

    function update(updater: Updater<T>): void {
        set(updater(value));
    }

    return { subscribe, set, update };
}

/**
 * Obtiene el valor actual de una tienda de forma síncrona
 */
export function get<T>(store: Readable<T>): T {
    let value: T;
    const unsubscribe = store.subscribe(v => value = v);
    unsubscribe();
    return value!;
}

/**
 * Crea una tienda derivada (derived)
 */
export function derived<S, T>(
    store: Readable<S>,
    fn: (value: S) => T
): Readable<T> {
    return {
        subscribe(run: Subscriber<T>): Unsubscriber {
            return store.subscribe(value => {
                run(fn(value));
            });
        }
    };
}

/**
 * Hook de React para usar una tienda y provocar re-renders
 */
import { useState, useEffect } from 'react';

export function useTienda<T>(store: Readable<T>): T {
    const [value, setValue] = useState(() => get(store));

    useEffect(() => {
        return store.subscribe(v => setValue(v));
    }, [store]);

    return value;
}
