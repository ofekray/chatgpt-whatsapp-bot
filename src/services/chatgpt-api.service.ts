import { ChatCompletionRequestMessage, Configuration, OpenAIApi } from "openai";
import { createReadStream } from "fs";
import * as fs from "fs/promises";
import * as path from 'path';
import { logger } from "./logger.service.js";
import { audioConverter } from "./audio-converter.service.js";
import { HistoryChatMessage } from "../types/chat-history.types.js";

class ChatGPTApi {
    private readonly openaiClient: OpenAIApi;

    constructor() {
        const config = new Configuration({
            organization: process.env.OPENAI_ORG,
            apiKey: process.env.OPENAI_API_KEY,
        });
        this.openaiClient = new OpenAIApi(config);
    }

    async transcribe(audioBuffer: Buffer): Promise<string> {
        let mp3AudioPath: string = "";

        try {
            mp3AudioPath = await audioConverter.toMp3(audioBuffer);
            if (!mp3AudioPath) {
                return "";
            }
            const audioReadStream = createReadStream(mp3AudioPath);
            const transcription = await this.openaiClient.createTranscription(audioReadStream, "whisper-1");
            const text = transcription?.data?.text;
            logger.debug("Transcription received from OpenAI", { text });
            return text;
        }
        catch(error) {
            logger.error("Error getting transcription from OpenAI", { error });
            return "";
        }
        finally {
            if (mp3AudioPath) {
                await fs.rm(path.dirname(mp3AudioPath), { recursive: true });
            }
        }
    }

    async ask(name: string, question: string, messageHistory: HistoryChatMessage[]): Promise<string> {
        try {
            const chatCompletion = await this.openaiClient.createChatCompletion({
                model: "gpt-3.5-turbo",
                messages: [
                    { role: "system", content: "You are ChatGPT a helpful assistant" },
                    { role: "system", content: `The name of the user is ${name}` },
                    ...this.mapHistoryToChatMessages(messageHistory),
                    { role: "user", content: question }
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

    private mapHistoryToChatMessages(messageHistory: HistoryChatMessage[]): ChatCompletionRequestMessage[] {
        return messageHistory.flatMap(x => [
            { role: 'user', content: x.question },
            { role: 'assistant', content: x.answer }
        ]);
    }
}

export const chatGPTApi = new ChatGPTApi();