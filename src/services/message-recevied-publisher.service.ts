import { SQSClient, SendMessageCommand, SendMessageCommandInput } from "@aws-sdk/client-sqs";
import { singleton } from "tsyringe";
import { Logger } from "./logger.service.js";

@singleton()
export class MessageReceivedPublisher {
    private readonly sqsClient: SQSClient;

    constructor(private readonly logger: Logger) {
        this.sqsClient = new SQSClient({});
    }

    async publish(whatsappWebhookBody: string): Promise<void> {
        try {
            const input: SendMessageCommandInput = {
                MessageBody: whatsappWebhookBody,
                QueueUrl: process.env.WHATSAPP_MESSAGE_QUEUE_URL,
            };
            const command = new SendMessageCommand(input);
            await this.sqsClient.send(command);
            this.logger.debug("Message published", { input });
        }
        catch (error) {
            this.logger.error("Error publishing message", { error });
        }
    }
}