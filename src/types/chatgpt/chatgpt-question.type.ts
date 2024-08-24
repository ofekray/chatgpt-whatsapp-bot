export enum ChatGPTQuestionType {
    Text = "text",
    Image = "image",
    Audio = "audio",
}

export interface ChatGPTQuestion {
    type: ChatGPTQuestionType;
}

export interface ChatGTPTextQuestion extends ChatGPTQuestion {
    type: ChatGPTQuestionType.Text;
    text: string;
}

export interface ChatGPTImageQuestion extends ChatGPTQuestion {
    type: ChatGPTQuestionType.Image;
    image: ArrayBuffer;
    mimeType: string;
    text?: string;
}

export interface ChatGPTAudioQuestion extends ChatGPTQuestion {
    type: ChatGPTQuestionType.Audio;
    audio: ArrayBuffer;
}