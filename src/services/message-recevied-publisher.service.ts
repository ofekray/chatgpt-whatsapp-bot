import { SQSClient, SendMessageCommand, SendMessageCommandInput } from "@aws-sdk/client-sqs";
import { logger } from "./logger.service.js";

class MessageReceivedPublisher {
    private readonly sqsClient: SQSClient;

    constructor() {
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
            logger.debug("Message published", { input });
        }
        catch (error) {
            logger.error("Error publishing message", { error });
        }
    }
}

export const messageReceivedPublisher = new MessageReceivedPublisher();