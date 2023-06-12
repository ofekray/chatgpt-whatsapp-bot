export const enum WhatsappMessageTypesEnum {
	Audio = 'audio',
	Contacts = 'contacts',
	Document = 'document',
	Image = 'image',
	Interactive = 'interactive',
	Location = 'location',
	Reaction = 'sticker',
	Sticker = 'sticker',
	Template = 'template',
	Text = 'text',
	Video = 'video',
}

export const enum WhatsappParametersTypesEnum {
	Currency = 'currency',
	DateTime = 'date_time',
	Document = 'document',
	Image = 'image',
	Text = 'text',
	Video = 'video',
	Payload = 'payload',
}

export const enum WhatsappInteractiveTypesEnum {
	Button = 'button',
	List = 'list',
	Product = 'product',
	ProductList = 'product_list',
}

export const enum WhatsappButtonTypesEnum {
	QuickReply = 'quick_reply',
	URL = 'url',
}

export const enum WhatsappButtonPositionEnum {
	First,
	Second,
	Third,
}

export const enum WhatsappComponentTypesEnum {
	Header = 'header',
	Body = 'body',
	Button = 'button',
}

export enum WhatsappWAConfigEnum {
	BaseURL = 'WA_BASE_URL',
	AppId = 'M4D_APP_ID',
	AppSecret = 'M4D_APP_SECRET',
	PhoneNumberId = 'WA_PHONE_NUMBER_ID',
	BusinessAcctId = 'WA_BUSINESS_ACCOUNT_ID',
	APIVersion = 'CLOUD_API_VERSION',
	AccessToken = 'CLOUD_API_ACCESS_TOKEN',
	WebhookEndpoint = 'WEBHOOK_ENDPOINT',
	WebhookVerificationToken = 'WEBHOOK_VERIFICATION_TOKEN',
	ListenerPort = 'LISTENER_PORT',
	MaxRetriesAfterWait = 'MAX_RETRIES_AFTER_WAIT',
	RequestTimeout = 'REQUEST_TIMEOUT',
	Debug = 'DEBUG',
}

export enum WhatsappWARequiredConfigEnum {
	APIVersion = 'CLOUD_API_VERSION',
	AccessToken = 'CLOUD_API_ACCESS_TOKEN',
}

export const enum WhatsappConversationTypesEnum {
	BusinessInitiated = 'business_initiated',
	CustomerInitiated = 'customer_initiated',
	ReferralConversion = 'referral_conversion',
}

export const enum WhatsappStatusEnum {
	Delivered = 'delivered',
	Read = 'read',
	Sent = 'sent',
}

export const enum WhatsappVideoMediaTypesEnum {
	Mp4 = 'video/mp4',
	Threegp = 'video/3gp',
}

export const enum WhatsappStickerMediaTypesEnum {
	Webp = 'image/webp',
}

export const enum WhatsappImageMediaTypesEnum {
	Jpeg = 'image/jpeg',
	Png = 'image/png',
}

export const enum WhatsappDocumentMediaTypesEnum {
	Text = 'text/plain',
	Pdf = 'application/pdf',
	Ppt = 'application/vnd.ms-powerpoint',
	Word = 'application/msword',
	Excel = 'application/vnd.ms-excel',
	OpenDoc = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
	OpenPres = 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
	OpenSheet = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
}

export const enum WhatsappAudioMediaTypesEnum {
	Aac = 'audio/aac',
	Mp4 = 'audio/mp4',
	Mpeg = 'audio/mpeg',
	Amr = 'audio/amr',
	Ogg = 'audio/ogg',
}

export const enum WhatsappWebhookTypesEnum {
	Audio = 'audio',
	Button = 'button',
	Document = 'document',
	Text = 'text',
	Image = 'image',
	Interactive = 'interactive',
	Order = 'order',
	Sticker = 'sticker',
	System = 'system',
	Unknown = 'unknown',
	Video = 'video',
}

export const enum WhatsappSystemChangeTypesEnum {
	CustomerChangedNumber = 'customer_changed_number',
	CustomerIdentityChanged = 'customer_identity_changed',
}

export const enum WhatsappReferralSourceTypesEnum {
	Ad = 'ad',
	Post = 'post',
}

export const enum WhatsappRequestCodeMethodsEnum {
	Sms = 'SMS',
	Voice = 'VOICE',
}