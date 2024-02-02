import { ChatGPTToolCall } from "../chatgpt/chatgpt-tool-call.types.js";

export interface HistoryChatMessage {
    question: string;
    toolCalls: ChatGPTToolCall[];
    answer: string;
}