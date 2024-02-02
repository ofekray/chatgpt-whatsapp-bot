import { singleton } from "tsyringe";
import OpenAI from "openai";
import { createReadStream } from "fs";
import * as fs from "fs/promises";
import * as path from 'path';
import { HistoryChatMessage } from "../types/history/chat-history.types.js";
import { ChatGPTResponse, ChatGPTResponseType } from "../types/chatgpt/chatgpt-response.type.js";
import { AudioConverter } from "./audio-converter.service.js";
import { Logger } from "./logger.service.js";
import { ChatGPTToolCall } from "../types/chatgpt/chatgpt-tool-call.types.js";
import { InternalChatGPTResult, InternalChatGPTResultType, InternalChatGPTToolCallsResult } from "../types/chatgpt/chatgpt-result.type.js";
import { CurrencyApi } from "./currency-api.service.js";

@singleton()
export class ChatGPTApi {
    private readonly openaiClient: OpenAI;

    constructor(private readonly audioConverter: AudioConverter, private readonly currencyApi: CurrencyApi, private readonly logger: Logger) {
        this.openaiClient = new OpenAI({
            organization: process.env.OPENAI_ORG,
            apiKey: process.env.OPENAI_API_KEY,
        });
    }

    async transcribe(audioBuffer: Buffer): Promise<string> {
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
        catch(error) {
            this.logger.error("Error getting transcription from OpenAI", { error });
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
            this.logger.error("Error getting answer from OpenAI", { error });
            return this.buildTextResponse("(ERROR: Unknown)");
        }
    }

    async askForText(name: string, question: string, messageHistory: HistoryChatMessage[]): Promise<ChatGPTResponse> {
        try {
            const chatCompletionRequest = this.createChatCompletionRequest(name, question, messageHistory);
            const chatCompletion = await this.openaiClient.chat.completions.create(chatCompletionRequest);
            const result = await this.buildResultFromChatCompletionResponse(chatCompletion);
            if (result.type === InternalChatGPTResultType.Text) {
                return this.buildTextResponse(result.text);
            }
            else {
                this.addToolCallsToChatMessages(chatCompletionRequest.messages, result.toolCalls);
                const toolCallsResult = await this.buildResultFromChatCompletionResponse(await this.openaiClient.chat.completions.create(chatCompletionRequest));
                if (toolCallsResult.type === InternalChatGPTResultType.ToolCalls) {
                    return this.buildTextResponse("(ERROR: Tool calls recursion not supported)");
                }
                return this.buildTextResponse(toolCallsResult.text, result.toolCalls);
            }
        }
        catch(error) {
            this.logger.error("Error getting text answer from OpenAI", { error });
            return this.buildTextResponse("(ERROR: Unknown)");
        }
    }

    private async askForImage(prompt: string): Promise<ChatGPTResponse> {
        try {
            const response = await this.openaiClient.images.generate({ prompt, n: 1, size: "512x512" });
            if (!response?.data?.length || !response?.data?.[0].url) {
                this.logger.error("Error getting image answer from OpenAI", { data: response?.data });
            }
            return { type: ChatGPTResponseType.Image, url: response?.data?.[0].url! };
        }
        catch(error) {
            this.logger.error("Error generating image from OpenAI", { error });
            return this.buildTextResponse("(ERROR: Unknown)");
        }
    }

    private createChatCompletionRequest(name: string, question: string, messageHistory: HistoryChatMessage[]): OpenAI.ChatCompletionCreateParamsNonStreaming {
        return {
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: "You are ChatGPT a helpful assistant" },
                { role: "system", content: `The name of the user is ${name}` },
                ...this.mapHistoryToChatMessages(messageHistory),
                { role: "user", content: question }
            ],
            tools: [
                {
                    type: "function",
                    function: {
                        name: "convert_currency",
                        description: "Converts amount from one currency to another",
                        parameters: {
                            type: "object",
                            required: ["amount", "from", "to"],
                            properties: {
                                amount: { type: "number", description: "The amount to convert" },
                                from: { type: "string", description: "The currency code to convert from in ISO 4217 format" },
                                to: { type: "string", description: "The currency code to convert to in ISO 4217 format" }
                            },
                        }
                    }
                }
            ],
            tool_choice: "auto"
        };
    }

    private async buildResultFromChatCompletionResponse(chatCompletion: OpenAI.ChatCompletion): Promise<InternalChatGPTResult> {
        if (!chatCompletion?.choices?.length || (!chatCompletion.choices[0].message?.content && !chatCompletion.choices[0].message?.tool_calls?.length)) {
            this.logger.error("Error getting answer from OpenAI", { chatCompletion });
            return this.buildInternalTextResult("(ERROR: Empty answer)");
        }

        const choice = chatCompletion.choices[0];
        this.logger.debug("Answer received from OpenAI", { choice });
        
        switch (choice.finish_reason) {
            case "tool_calls":
                return await this.buildInternalToolCallsResult(choice.message?.tool_calls!);
            case "stop":
                return this.buildInternalTextResult(choice.message?.content!);
            case "length":
                return this.buildInternalTextResult(choice.message?.content! + "\n(ERROR: Token limit reached)");
            default:
                return this.buildInternalTextResult(choice.message?.content! + `\n(ERROR: ${choice.finish_reason})`);
        }
    }

    private mapHistoryToChatMessages(messageHistory: HistoryChatMessage[]): OpenAI.ChatCompletionMessageParam[] {
        return messageHistory.flatMap(x => {
            const messages: OpenAI.ChatCompletionMessageParam[] = [];
            messages.push({ role: 'user', content: x.question });
            this.addToolCallsToChatMessages(messages, x.toolCalls);
            messages.push({ role: 'assistant', content: x.answer });
            return messages;
        });
    }

    private addToolCallsToChatMessages(messages: OpenAI.ChatCompletionMessageParam[], toolCalls: ChatGPTToolCall[]): void {
        if (toolCalls?.length) {
            messages.push({ role: 'assistant', tool_calls: toolCalls.map(x => ({
                type: "function",
                id: x.id,
                function: {
                    arguments: x.arguments,
                    name: x.name,
                }
            }))});
            toolCalls.forEach(x => messages.push({ role: 'tool', tool_call_id: x.id, content: x.response }));
        }
    }

    private async buildInternalToolCallsResult(toolCalls: OpenAI.Chat.Completions.ChatCompletionMessageToolCall[]): Promise<InternalChatGPTResult> {
        const resultToolCalls: ChatGPTToolCall[] = [];

        for (const toolCall of toolCalls) {
            const functionName = toolCall.function?.name;
            switch (functionName) {
                case "convert_currency":
                    resultToolCalls.push(await this.buildConvertCurrencyToolCall(toolCall));
                    break;
                default:
                    return this.buildInternalTextResult(`(ERROR: Unknown function name: ${functionName})`);
                    break;
            }
        }

        return { type: InternalChatGPTResultType.ToolCalls, toolCalls: resultToolCalls };
    }

    private async buildConvertCurrencyToolCall(from: OpenAI.Chat.Completions.ChatCompletionMessageToolCall): Promise<ChatGPTToolCall> {
        const args: { amount: number, from: string, to: string } = JSON.parse(from.function?.arguments);
        const result = await this.currencyApi.convertCurrency(args.amount, args.from, args.to);
        return { id: from.id!, name: from.function?.name!, arguments: from.function?.arguments!, response: JSON.stringify({ result }) };
    }

    private buildInternalTextResult(text: string): InternalChatGPTResult {
        return { type: InternalChatGPTResultType.Text, text };
    }

    private buildTextResponse(text: string, toolCalls: ChatGPTToolCall[] = []): ChatGPTResponse {
        return { type: ChatGPTResponseType.Text, text, toolCalls };
    }
}