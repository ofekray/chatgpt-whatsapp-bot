import OpenAI from "openai";

export interface ChatGPTResponse {
    newMessages: OpenAI.ChatCompletionMessageParam[];
    content: string;
}