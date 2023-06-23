import { Configuration, OpenAIApi } from "openai";
import * as mime from "mime-types"
import { logger } from "./logger.service.js";
import { WhatsappMedia } from "../types/whatsapp-media.type.js";
import { Readable } from "stream";



class ChatGPTApi {
    private readonly openaiClient: OpenAIApi;

    constructor() {
        const config = new Configuration({
            organization: process.env.OPENAI_ORG,
            apiKey: process.env.OPENAI_API_KEY,
        });
        this.openaiClient = new OpenAIApi(config);
    }

    async transcribe(audio: WhatsappMedia): Promise<string> {
        try {
            const ext = mime.extension(audio.mimeType);
            if (!ext) {
                logger.error("Missing audio extension", { mimeType: audio.mimeType });
                return "";
            }
            const audioReadStream = Readable.from(audio.buffer);
            //@ts-expect-error
            audioReadStream.path = `conversation.${ext}`;
            const transcription = await this.openaiClient.createTranscription(audioReadStream, "whisper-1");
            logger.debug("Transcription received from OpenAI", { transcription });
            return transcription?.data?.text;
        }
        catch(error) {
            logger.error("Error getting transcription from OpenAI", { error });
            return "";
        }
    }

    async ask(question: string): Promise<string> {
        try {
            const chatCompletion = await this.openaiClient.createChatCompletion({
                model: "gpt-3.5-turbo",
                messages: [
                    { role: "system", content: "You are ChatGPT a helpful assistant" },
                    { role: "user", content: question },
                ]
            });
    
            if (!chatCompletion?.data?.choices?.length || !chatCompletion.data.choices[0].message?.content) {
                logger.error("Error getting answer from OpenAI", { chatCompletion });
                return "(ERROR: Empty response)";
            }
    
            const choice = chatCompletion.data.choices[0];
            logger.debug("Answer received from OpenAI", { choice });
            
            switch (choice.finish_reason) {
                case "stop":
                    return choice.message?.content!;
                case "length":
                    return choice.message?.content! + "\n(ERROR: Token limit reached)";
                default:
                    return choice.message?.content! + `\n(ERROR: ${choice.finish_reason})`;
            }
        }
        catch(error) {
            logger.error("Error getting answer from OpenAI", { error });
            return "(ERROR: Unknown)";
        }
    }
}

export const chatGPTApi = new ChatGPTApi();