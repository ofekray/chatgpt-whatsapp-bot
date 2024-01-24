import Big, { BigSource } from "big.js";
import { singleton } from "tsyringe";

// Set default decimal places
Big.DP = 5;

@singleton()
export class DecimalMathService {
    public add(first: BigSource, second: BigSource): number {
        const firstBig = new Big(first);
        const secondBig = new Big(second);

        const result = firstBig.add(secondBig);
        return result.toNumber();
    }

    public subtract(first: BigSource, second: BigSource): number {
        const firstBig = new Big(first);
        const secondBig = new Big(second);

        const result = firstBig.minus(secondBig);
        return result.toNumber();
    }

    public divide(firstNumber: BigSource, secondNumber: BigSource): number {
        const firstBig = new Big(firstNumber);
        const secondBig = new Big(secondNumber);

        const result = firstBig.div(secondBig);
        return result.toNumber();
    }

    public multiply(firstNumber: BigSource, secondNumber: BigSource): number {
        const firstBig = new Big(firstNumber);
        const secondBig = new Big(secondNumber);

        const result = firstBig.times(secondBig);
        return result.toNumber();
    }
}