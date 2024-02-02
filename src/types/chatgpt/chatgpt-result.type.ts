import { ChatGPTToolCall } from "./chatgpt-tool-call.types.js";

export enum InternalChatGPTResultType {
    Text = "text",
    ToolCalls = "tool_calls"
}

export interface InternalChatGPTTextResult {
    type: InternalChatGPTResultType.Text;
    text: string;
}

export interface InternalChatGPTToolCallsResult {
    type: InternalChatGPTResultType.ToolCalls;
    toolCalls: ChatGPTToolCall[];
}

export type InternalChatGPTResult = InternalChatGPTTextResult | InternalChatGPTToolCallsResult;