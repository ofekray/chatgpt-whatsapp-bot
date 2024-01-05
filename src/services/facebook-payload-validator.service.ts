import * as crypto from 'crypto';
import { FunctionURLEvent } from "../types/function-url-event.type.js";
import { Logger } from './logger.service.js';
import { singleton } from 'tsyringe';

@singleton()
export class FacebookPayloadValidator {
    constructor(private readonly logger: Logger) {}

    public validate(event: FunctionURLEvent): boolean {
        let isValid: boolean = false;
        try {
            const signatureHeader = event?.headers?.['x-hub-signature-256'];
            const payload = event.body;
            if (signatureHeader && payload) {
                const [algorithm, signature] = signatureHeader.split('=');
                if (algorithm === 'sha256' && signature) {
                    const generatedSignature  = crypto.createHmac(algorithm, process.env.WHATSAPP_FACEBOOK_APP_SECRET!).update(payload).digest('hex');
                    isValid = signature === generatedSignature;
                }
            }
        }
        catch(error) {
            this.logger.info("Error validating payload", { error });
        }
    
        this.logger.debug("Payload validation result", { result: isValid });
        return isValid;
    }
}