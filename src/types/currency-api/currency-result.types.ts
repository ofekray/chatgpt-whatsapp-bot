export type CurrencyResult = {
    [key: string]: Record<string, number>;
} & {
    date: string;
}