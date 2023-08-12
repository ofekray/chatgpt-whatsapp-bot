export enum ChatGPTResponseType {
    Text = "text",
    Image = "image"
}

export interface ChatGPTTextResponse {
    type: ChatGPTResponseType.Text;
    text: string;
}

export interface ChatGPTImageResponse {
    type: ChatGPTResponseType.Image;
    url: string;
}

export type ChatGPTResponse = ChatGPTTextResponse | ChatGPTImageResponse;