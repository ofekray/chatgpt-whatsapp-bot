import { singleton } from "tsyringe";
import OpenAI from "openai";
import * as CurrencyCodes from "currency-codes";
import { createReadStream } from "fs";
import * as fs from "fs/promises";
import * as path from 'path';
import { HistoryChatMessage } from "../types/history/chat-history.types.js";
import { AudioConverter } from "./audio-converter.service.js";
import { Logger } from "./logger.service.js";
import { CurrencyApi } from "./currency-api.service.js";
import { ChatGPTAudioQuestion, ChatGPTImageQuestion, ChatGPTQuestion, ChatGPTQuestionType, ChatGTPTextQuestion } from "../types/chatgpt/chatgpt-question.type.js";
import { ImageStore } from "./image-store.service.js";
import { ChatGPTResponse } from "../types/chatgpt/chatgpt-response.type.js";

@singleton()
export class ChatGPTApi {
    private readonly openaiClient: OpenAI;

    constructor(private readonly audioConverter: AudioConverter, private readonly imageStore: ImageStore, private readonly currencyApi: CurrencyApi, private readonly logger: Logger) {
        this.openaiClient = new OpenAI({
            organization: process.env.OPENAI_ORG,
            apiKey: process.env.OPENAI_API_KEY,
        });
    }

    async ask(name: string, questions: ChatGPTQuestion[], messageHistory: HistoryChatMessage[]): Promise<ChatGPTResponse> {
        const newMessages: OpenAI.ChatCompletionMessageParam[] = [];
        for (const question of questions) {
            const questionChatMessage = await this.mapQuestionToChatMessage(question);
            newMessages.push(questionChatMessage);
        }

        try {
            const messages: OpenAI.ChatCompletionMessageParam[] = [
                { role: "system", content: "You are ChatGPT a helpful assistant" },
                { role: "system", content: `The name of the user is ${name}` },
                ...this.mapHistoryToChatMessages(messageHistory),
                ...newMessages
            ];
    
            const convert_currency = ({ amount, from, to }: { amount: number, from: string, to: string }) => {
                return this.currencyApi.convertCurrency(amount, from, to);
            };
    
            const generate_image = async ({ prompt }: { prompt: string }) => {
                const response = await this.openaiClient.images.generate({ prompt, n: 1, size: "512x512" });
                if (!response?.data?.length || !response?.data?.[0].url) {
                    this.logger.error("Error generating image from OpenAI", { data: response?.data });
                }
                return response?.data?.[0].url!
            };

            let runnerMessageCount = 0;
            const runner = this.openaiClient.beta.chat.completions
                .runTools({
                    model: 'gpt-4o-mini',
                    messages,
                    tools: [
                        {
                            type: 'function',
                            function: {
                                function: convert_currency,
                                parse: JSON.parse,
                                description: "Converts amount from one currency to another",
                                parameters: {
                                    type: "object",
                                    required: ["amount", "from", "to"],
                                    properties: {
                                        amount: { type: "number", description: "The amount to convert" },
                                        from: { type: "string", enum: CurrencyCodes.codes(), description: "The currency code to convert from in ISO 4217 format" },
                                        to: { type: "string", enum: CurrencyCodes.codes(), description: "The currency code to convert to in ISO 4217 format" }
                                    },
                                }
                            },
                        },
                        {
                            type: 'function',
                            function: {
                                function: generate_image,
                                parse: JSON.parse,
                                description: "Generates/Creates/Draws an image/drawing/photo/picture based on the prompt",
                                parameters: {
                                    type: "object",
                                    required: ["prompt"],
                                    properties: {
                                        prompt: { type: "string", minLength: 1, description: "The prompt to generate the image from" },
                                    },
                                }
                            },
                        },
                    ],
                })
                .on('message', message => {
                    runnerMessageCount++;
                    if (runnerMessageCount > messages.length) {
                        newMessages.push(this.buildValidMessage(message));
                    }
                });
    
            const content = await runner.finalContent();
            if (!content) {
                throw new Error("No content received from OpenAI");
            }
            return { newMessages, content };
        }
        catch (error) {
            this.logger.error("Error getting text answer from OpenAI", { error });

            const content = "I'm sorry, I can't answer that question right now. Please try again later.";
            newMessages.push({ role: "assistant", content });
            return { newMessages, content };
        }
    }

    private buildValidMessage(message: OpenAI.ChatCompletionMessageParam): OpenAI.ChatCompletionMessageParam {
        // Resolve issues with empty message parts, for example empty tool_calls array that causes OpenAI API to fail

        const validMessage = { ...message };
        const keys: Array<keyof OpenAI.ChatCompletionMessageParam> = Object.keys(validMessage) as any;
        for (const key of keys) {
            if (!validMessage[key] || (Array.isArray(validMessage[key]) && !validMessage[key].length)) {
                delete validMessage[key];
            }
        }

        return validMessage;
    }

    private mapHistoryToChatMessages(messageHistory: HistoryChatMessage[]): OpenAI.ChatCompletionMessageParam[] {
        return messageHistory.flat();
    }

    private mapQuestionToChatMessage(question: ChatGPTQuestion): Promise<OpenAI.ChatCompletionMessageParam> {
        switch (question.type) {
            case ChatGPTQuestionType.Text:
                return this.convertTextToPrompt(question as ChatGTPTextQuestion);
            case ChatGPTQuestionType.Image:
                return this.convertImageToPrompt(question as ChatGPTImageQuestion);
            case ChatGPTQuestionType.Audio:
                return this.convertAudioToPrompt(question as ChatGPTAudioQuestion);
        }
    }

    private async convertImageToPrompt(question: ChatGPTImageQuestion): Promise<OpenAI.ChatCompletionMessageParam> {
        const content: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [];

        if (question.text) {
            content.push({ type: "text", text: question.text });
        }

        const imageUrl = await this.imageStore.uploadImage(question.image, question.mimeType);
        content.push({
            type: "image_url",
            image_url: {
                url: imageUrl
            }
        });

        return { role: "user", content };
    }

    private async convertAudioToPrompt(question: ChatGPTAudioQuestion): Promise<OpenAI.ChatCompletionMessageParam> {
        const transcription = await this.transcribeAudio(question.audio);
        return { role: "user", content: transcription };
    }

    private async convertTextToPrompt(question: ChatGTPTextQuestion): Promise<OpenAI.ChatCompletionMessageParam> {
        return { role: "user", content: question.text };
    }

    private async transcribeAudio(audioBuffer: ArrayBuffer): Promise<string> {
        let mp3AudioPath: string = "";

        try {
            mp3AudioPath = await this.audioConverter.toMp3(audioBuffer);
            if (!mp3AudioPath) {
                return "";
            }
            const audioReadStream = createReadStream(mp3AudioPath);
            const transcription = await this.openaiClient.audio.transcriptions.create({ file: audioReadStream, model: "whisper-1" });
            const text = transcription?.text;
            this.logger.debug("Transcription received from OpenAI", { text });
            return text;
        }
        catch (error) {
            this.logger.error("Error getting transcription from OpenAI", { error });
            return "";
        }
        finally {
            if (mp3AudioPath) {
                await fs.rm(path.dirname(mp3AudioPath), { recursive: true });
            }
        }
    }
}