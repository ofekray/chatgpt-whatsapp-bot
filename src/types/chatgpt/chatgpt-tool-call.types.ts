export interface ChatGPTToolCall {
    id: string;
    name: string;
    arguments: string;
    response: string;
}