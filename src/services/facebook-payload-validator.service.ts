import * as crypto from 'crypto';
import { FunctionURLEvent } from "../types/function-url-event.type.js";
import { logger } from "./logger.service.js";

export const facebookPayloadValidator = (event: FunctionURLEvent): boolean => {
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
        logger.info("Error validating payload", { error });
    }

    logger.debug("Payload validation result", { result: isValid });
    return isValid;
}