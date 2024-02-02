import { ChatGPTToolCall } from "./chatgpt-tool-call.types.js";

export enum ChatGPTResponseType {
    Text = "text",
    Image = "image"
}

export interface ChatGPTTextResponse {
    type: ChatGPTResponseType.Text;
    toolCalls: ChatGPTToolCall[];
    text: string;
}

export interface ChatGPTImageResponse {
    type: ChatGPTResponseType.Image;
    url: string;
}

export type ChatGPTResponse = ChatGPTTextResponse | ChatGPTImageResponse;