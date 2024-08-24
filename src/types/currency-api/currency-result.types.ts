type NotDate<T> = T extends 'date' ? never : T;

export type CurrencyResult = {
    [key: string]: Record<string, number>;
} & {
    date: string;
}