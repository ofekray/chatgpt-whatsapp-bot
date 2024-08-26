import OpenAI from "openai";

export enum ChatGPTResponseType {
    Text = "text",
    Image = "image",
}

export interface ChatGPTResponse {
    newMessages: OpenAI.ChatCompletionMessageParam[];
    content: string;
    type: ChatGPTResponseType;
}