import { singleton } from "tsyringe";
import { Logger } from "./logger.service.js";
import got from "got";
import { CurrencyResult } from "../types/currency-api/currency-result.types.js";
import { DecimalMathService } from "./decimal-math.service.js";

@singleton()
export class CurrencyApi {
    constructor(private readonly logger: Logger, private readonly decimalMathService: DecimalMathService) {}

    async convertCurrency(amount: number, from: string, to: string): Promise<number> {
        try {
            const url = process.env.CURRENCY_API_URL!.replace("{from}", from).replace("{to}", to);
            const response: CurrencyResult = await got.get(url).json();
            this.logger.debug("Sucessfully retrieved currency conversion", { from, to, response });

            const unitValue = response[to.toLowerCase()];
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