import { singleton } from "tsyringe";
import ky from 'ky';
import { Logger } from "./logger.service.js";
import { CurrencyResult } from "../types/currency-api/currency-result.types.js";
import { DecimalMathService } from "./decimal-math.service.js";

@singleton()
export class CurrencyApi {
    constructor(private readonly logger: Logger, private readonly decimalMathService: DecimalMathService) {}

    async convertCurrency(amount: number, from: string, to: string): Promise<number> {
        try {
            const fromLowerCase = from.toLowerCase();
            const toLowerCase = to.toLowerCase();
            const url = process.env.CURRENCY_API_URL!.replace("{from}", fromLowerCase);
            const response: CurrencyResult = await ky.get(url).json();
            const unitValue = response[fromLowerCase][toLowerCase];
            this.logger.debug("Sucessfully retrieved currency conversion", { from: fromLowerCase, to: toLowerCase, unitValue });

            const result = this.decimalMathService.multiply(amount, unitValue);
            this.logger.info("Sucessfully converted currency", { from, to, amount, result });
            return result;
        }
        catch(error) {
            this.logger.error("Error getting currency convertion", { error });
            throw error;
        }
    }
}