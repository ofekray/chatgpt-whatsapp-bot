import { WhatsappButtonPositionEnum, WhatsappButtonTypesEnum, WhatsappComponentTypesEnum, WhatsappInteractiveTypesEnum, WhatsappMessageTypesEnum, WhatsappParametersTypesEnum } from "./whatsapp-enums.type.js";

export type GeneralMessageBody =  {
	messaging_product: 'whatsapp';
};

export type StatusObject = {
	status: 'read';
	message_id: string;
};

export type StatusRequestBody = GeneralMessageBody & StatusObject;

type ConTextObject = {
	message_id: string;
};

export type MessageRequestBody<T extends WhatsappMessageTypesEnum> =
	GeneralMessageBody & {
		recipient_type?: string;
		to: string;
		context?: ConTextObject;
		type?: T;
	};

type MetaAudioMediaObject = {
	id: string;
	link?: never;
};

type HostedAudioMediaObject = {
	id?: never;
	link: string;
};

export type AudioMediaObject = MetaAudioMediaObject | HostedAudioMediaObject;

export type AudioMessageRequestBody =
	MessageRequestBody<WhatsappMessageTypesEnum.Audio> & {
		[WhatsappMessageTypesEnum.Audio]: AudioMediaObject;
	};

type AddressesObject = {
	street?: string;
	city?: string;
	state?: string;
	zip?: string;
	country?: string;
	country_code?: string;
	type?: 'HOME' | 'WORK' | string;
};

type EmailObject = {
	email?: string;
	type?: 'HOME' | 'WORK' | string;
};

type NameObject = {
	formatted_name: string;
	first_name?: string;
	last_name?: string;
	middle_name?: string;
	suffix?: string;
	prefix?: string;
};

type OrgObject = {
	company?: string;
	department?: string;
	title?: string;
};

type PhoneObject = {
	phone?: 'PHONE_NUMBER';
	type?: 'CELL' | 'MAIN' | 'IPHONE' | 'HOME' | 'WORK' | string;
	wa_id?: string;
};

type URLObject = {
	url?: string;
	type?: 'HOME' | 'WORK' | string;
};

export type ContactObject = {
	addresses?: AddressesObject[];
	birthday?: `${number}${number}${number}${number}-${number}${number}-${number}${number}`;
	emails?: EmailObject[];
	name: NameObject;
	org?: OrgObject;
	phones?: PhoneObject[];
	urls?: URLObject[];
};

export type ContactsMessageRequestBody =
	MessageRequestBody<WhatsappMessageTypesEnum.Contacts> & {
		[WhatsappMessageTypesEnum.Contacts]: ContactObject;
	};

type MetaDocumentMediaObject = {
	id: string;
	link?: never;
	caption?: string;
	filename?: string;
};

type HostedDocumentMediaObject = {
	id?: never;
	link: string;
	caption?: string;
	filename?: string;
};

export type DocumentMediaObject =
	| MetaDocumentMediaObject
	| HostedDocumentMediaObject;

export type DocumentMessageRequestBody =
	MessageRequestBody<WhatsappMessageTypesEnum.Document> & {
		[WhatsappMessageTypesEnum.Document]: DocumentMediaObject;
	};

type MetaImageMediaObject = {
	id: string;
	link?: never;
	caption?: string;
};

type HostedImageMediaObject = {
	id?: never;
	link: string;
	caption?: string;
};

export type ImageMediaObject = MetaImageMediaObject | HostedImageMediaObject;

export type ImageMessageRequestBody =
	MessageRequestBody<WhatsappMessageTypesEnum.Image> & {
		[WhatsappMessageTypesEnum.Image]: ImageMediaObject;
	};

type ProductObject = {
	product_retailer_id: string;
};

type SimpleTextObject = {
	text: string;
};

type RowObject = {
	id: string;
	title: string;
	description?: string;
};

type MultiProductSectionObject = {
	product_items: ProductObject[];
	rows?: never;
	title?: string;
};

type ListSectionObject = {
	product_items?: never;
	rows: RowObject[];
	title?: string;
};

type SectionObject = MultiProductSectionObject | ListSectionObject;

type ButtonObject = {
	title: string;
	id: string;
};

type ReplyButtonObject = {
	type: 'reply';
	reply: ButtonObject;
};

type ActionObject = {
	button?: string;
	buttons?: ReplyButtonObject[];
	catalog_id?: string;
	product_retailer_id?: string;
	sections?: SectionObject;
};

type HeaderObject = {
	type: 'document' | 'image' | 'text' | 'video';
	document?: DocumentMediaObject;
	image?: ImageMediaObject;
	text?: string;
	video?: VideoMediaObject;
};

type ButtonInteractiveObject = {
	type: WhatsappInteractiveTypesEnum.Button;
	body: SimpleTextObject;
	footer?: SimpleTextObject;
	header?: HeaderObject;
	action: ActionObject;
};

type ListInteractiveObject = {
	type: WhatsappInteractiveTypesEnum.List;
	body: SimpleTextObject;
	footer?: SimpleTextObject;
	header?: HeaderObject;
	action: ActionObject;
};

type ProductInteractiveObject = {
	type: WhatsappInteractiveTypesEnum.Product;
	body?: SimpleTextObject;
	footer?: SimpleTextObject;
	header?: HeaderObject;
	action: ActionObject;
};

type ProductListInteractiveObject = {
	type: WhatsappInteractiveTypesEnum.ProductList;
	body: SimpleTextObject;
	footer?: SimpleTextObject;
	header: HeaderObject;
	action: ActionObject;
};

export type InteractiveObject =
	| ButtonInteractiveObject
	| ListInteractiveObject
	| ProductInteractiveObject
	| ProductListInteractiveObject;

export type InteractiveMessageRequestBody =
	MessageRequestBody<WhatsappMessageTypesEnum.Interactive> & {
		[WhatsappMessageTypesEnum.Interactive]: InteractiveObject;
	};

type MetaStickerMediaObject = {
	id: string;
	link?: never;
};

type HostedStickerMediaObject = {
	id?: never;
	link: string;
};

export type StickerMediaObject =
	| MetaStickerMediaObject
	| HostedStickerMediaObject;

export type StickerMessageRequestBody =
	MessageRequestBody<WhatsappMessageTypesEnum.Sticker> & {
		[WhatsappMessageTypesEnum.Sticker]: StickerMediaObject;
	};

type ReActionObject = {
	message_id: string;
	emoji: string;
};

export type ReactionMessageRequestBody =
	MessageRequestBody<WhatsappMessageTypesEnum.Reaction> & ReActionObject;

export type TextObject = {
	body: string;
	preview_url?: boolean;
};

export type TextMessageRequestBody =
	MessageRequestBody<WhatsappMessageTypesEnum.Text> & {
		[WhatsappMessageTypesEnum.Text]: TextObject;
	};

type MetaHostedVideoMediaObject = {
	id: string;
	link?: never;
	caption?: string;
};

type SelfHostedVideoMediaObject = {
	id?: never;
	link: string;
	caption?: string;
};

export type VideoMediaObject =
	| MetaHostedVideoMediaObject
	| SelfHostedVideoMediaObject;

export type VideoMessageRequestBody =
	MessageRequestBody<WhatsappMessageTypesEnum.Video> & {
		[WhatsappMessageTypesEnum.Video]: VideoMediaObject;
	};

type LanguageObject = {
	policy: 'deterministic';
	code: string;
};

type ParametersObject<T extends WhatsappParametersTypesEnum> = {
	type: T;
};

type TextParametersObject = ParametersObject<WhatsappParametersTypesEnum.Text> &
	SimpleTextObject;

type CurrencyObject = {
	fallback_value: string;
	code: string;
	amount_1000: number;
};

type CurrencyParametersObject =
	ParametersObject<WhatsappParametersTypesEnum.Currency> & {
		currency: CurrencyObject;
	};

type DateTimeObject = {
	fallback_value: string;
};

type DateTimeParametersObject =
	ParametersObject<WhatsappParametersTypesEnum.Currency> & {
		date_time: DateTimeObject;
	};

type DocumentParametersObject = ParametersObject<WhatsappParametersTypesEnum.Document> &
	DocumentMediaObject;

type ImageParametersObject = ParametersObject<WhatsappParametersTypesEnum.Image> &
	ImageMediaObject;

type VideoParametersObject = ParametersObject<WhatsappParametersTypesEnum.Video> &
	VideoMediaObject;

type QuickReplyButtonParametersObject = {
	type: WhatsappParametersTypesEnum.Payload;
	payload: string;
};

type URLButtonParametersObject = SimpleTextObject & {
	type: WhatsappParametersTypesEnum.Text;
};

type ButtonParameterObject =
	| QuickReplyButtonParametersObject
	| URLButtonParametersObject;

type ComponentObject<T extends WhatsappComponentTypesEnum> = {
	type: T;
	parameters: (
		| CurrencyParametersObject
		| DateTimeParametersObject
		| DocumentParametersObject
		| ImageParametersObject
		| TextParametersObject
		| VideoParametersObject
	)[];
};

type ButtonComponentObject = ComponentObject<WhatsappComponentTypesEnum.Button> & {
	parameters: ButtonParameterObject;
	sub_type: WhatsappButtonTypesEnum;
	index: WhatsappButtonPositionEnum;
};

export type MessageTemplateObject<T extends WhatsappComponentTypesEnum> = {
	name: string;
	language: LanguageObject;
	components?: (ComponentObject<T> | ButtonComponentObject)[];
};

export type MessageTemplateRequestBody<T extends WhatsappComponentTypesEnum> =
	MessageRequestBody<WhatsappMessageTypesEnum.Template> & MessageTemplateObject<T>;

export type LocationObject = {
	longitude: number;
	latitude: number;
	name?: string;
	address?: string;
};

export type LocationMessageRequestBody =
	MessageRequestBody<WhatsappMessageTypesEnum.Location> & {
		[WhatsappMessageTypesEnum.Location]: LocationObject;
	};

export type MessagesResponse = GeneralMessageBody & {
	contacts: [
		{
			input: string;
			wa_id: string;
		},
	];
	messages: [
		{
			id: string;
		},
	];
};