import { ChatCompletionRequestMessage, Configuration, CreateChatCompletionRequest, CreateChatCompletionResponse, OpenAIApi } from "openai";
import { createReadStream } from "fs";
import * as fs from "fs/promises";
import * as path from 'path';
import { logger } from "./logger.service.js";
import { audioConverter } from "./audio-converter.service.js";
import { HistoryChatMessage } from "../types/chat-history.types.js";
import { ChatGPTResponse, ChatGPTResponseType } from "../types/chatgpt-response.type.js";

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

    async ask(name: string, question: string, messageHistory: HistoryChatMessage[]): Promise<ChatGPTResponse> {
        try {
            if (question.startsWith("!image")) {
                const image = question.replace(/^!image\s+/, "").trim();
                return await this.askForImage(image);
            }
            else {
                return await this.askForText(name, question, messageHistory);
            }
        }
        catch(error) {
            logger.error("Error getting answer from OpenAI", { error });
            return { type: ChatGPTResponseType.Text, text: "(ERROR: Unknown)" };
        }
    }

    async askForText(name: string, question: string, messageHistory: HistoryChatMessage[]): Promise<ChatGPTResponse> {
        try {
            const chatCompletion = await this.openaiClient.createChatCompletion(this.createChatCompletionRequest(name, question, messageHistory));
            const answer = this.extractAnswerFromChatCompletionResponse(chatCompletion?.data);
            return { type: ChatGPTResponseType.Text, text: answer };
        }
        catch(error) {
            logger.error("Error getting text answer from OpenAI", { error });
            return { type: ChatGPTResponseType.Text, text: "(ERROR: Unknown)" };
        }
    }

    private async askForImage(prompt: string): Promise<ChatGPTResponse> {
        try {
            const response = await this.openaiClient.createImage({ prompt, n: 1, size: "512x512" });
            if (!response?.data?.data?.length || !response?.data?.data[0]?.url) {
                logger.error("Error getting image answer from OpenAI", { data: response?.data });
            }
            return { type: ChatGPTResponseType.Image, url: response?.data?.data[0]?.url! };
        }
        catch(error) {
            logger.error("Error generating image from OpenAI", { error });
            return { type: ChatGPTResponseType.Text, text: "(ERROR: Unknown)" };
        }
    }

    private createChatCompletionRequest(name: string, question: string, messageHistory: HistoryChatMessage[]): CreateChatCompletionRequest {
        return {
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: "You are ChatGPT a helpful assistant" },
                { role: "system", content: `The name of the user is ${name}` },
                ...this.mapHistoryToChatMessages(messageHistory),
                { role: "user", content: question }
            ]
        };
    }

    private extractAnswerFromChatCompletionResponse(chatCompletion: CreateChatCompletionResponse): string {
        if (!chatCompletion?.choices?.length || !chatCompletion.choices[0].message?.content) {
            logger.error("Error getting answer from OpenAI", { chatCompletion });
            return "(ERROR: Empty answer)";
        }

        const choice = chatCompletion.choices[0];
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

    private mapHistoryToChatMessages(messageHistory: HistoryChatMessage[]): ChatCompletionRequestMessage[] {
        return messageHistory.flatMap(x => [
            { role: 'user', content: x.question },
            { role: 'assistant', content: x.answer }
        ]);
    }
}

export const chatGPTApi = new ChatGPTApi();