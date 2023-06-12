import {
	WhatsappConversationTypesEnum, WhatsappDocumentMediaTypesEnum, WhatsappImageMediaTypesEnum, WhatsappReferralSourceTypesEnum,
	WhatsappStatusEnum, WhatsappStickerMediaTypesEnum, WhatsappSystemChangeTypesEnum, WhatsappVideoMediaTypesEnum,
	WhatsappWebhookTypesEnum
} from "./whatsapp-enums.type.js";

type WhatsappPricingObject = {
	category: WhatsappConversationTypesEnum;
	pricing_model: 'CBP';
};

type WhatsappOriginObject = {
	type: WhatsappConversationTypesEnum;
};

type WhatsappConversationObject = {
	id: string;
	origin: WhatsappOriginObject;
	expiration_timestamp: string;
};

type WhatsappErrorDataObject = {
	details: string;
};

type WhatsappErrorObject = {
	code: number;
	title: string;
	message: string;
	error_data: WhatsappErrorDataObject;
};

export type WhatsappStatusesObject = {
	conversation: WhatsappConversationObject;
	errors: WhatsappErrorObject[];
	id: string;
	pricing: WhatsappPricingObject;
	recipient_id: string;
	status: WhatsappStatusEnum;
	timestamp: string;
};

type WhatsappAudioObject = {
	id: string;
	mime_type: string;
};

type WhatsappButtonObject = {
	payload: string;
	text: string;
};

type WhatsappConTextObject = {
	forwarded: boolean;
	frequently_forwarded: boolean;
	from: string;
	id: string;
	referred_product: {
		catalog_id: string;
		product_retailer_id: string;
	};
};

type WhatsappDocumentObject = {
	caption: string;
	filename: string;
	sha256: string;
	mime_type: WhatsappDocumentMediaTypesEnum;
	id: string;
};

type WhatsappIdentityObject = {
	acknowledged: string;
	created_timestamp: string;
	hash: string;
};

type WhatsappImageObject = {
	caption: string;
	sha256: string;
	id: string;
	mime_type: WhatsappImageMediaTypesEnum;
};

type WhatsappButtonReplyObject = {
	button_reply: {
		id: string;
		title: string;
	};
};

type WhatsappListReplyObject = {
	list_reply: {
		id: string;
		title: string;
		description: string;
	};
};

type WhatsappInteractiveObject = {
	type: WhatsappButtonReplyObject | WhatsappListReplyObject;
};

type WhatsappProductItemsObject = {
	product_retailer_id: string;
	quantity: string;
	item_price: string;
	currency: string;
};

type WhatsappOrder_Object = {
	catalog_id: string;
	text: string;
	product_items: WhatsappProductItemsObject;
};

type WhatsappReferralObject = {
	source_url: URL;
	source_type: WhatsappReferralSourceTypesEnum;
	source_id: string;
	headline: string;
	body: string;
	media_type: WhatsappImageMediaTypesEnum | WhatsappVideoMediaTypesEnum;
	image_url: URL;
	video_url: URL;
	thumbnail_url: URL;
};

type WhatsappStickerObject = {
	mime_type: WhatsappStickerMediaTypesEnum;
	sha256: string;
	id: string;
	animated: boolean;
};

type WhatsappSystemObject = {
	body: string;
	identity: string;
	wa_id: string;
	type: WhatsappSystemChangeTypesEnum;
	customer: string;
};

type WhatsappTextObject = {
	body: string;
};

type WhatsappVideoObject = {
	caption: string;
	filename: string;
	sha256: string;
	id: string;
	mime_type: WhatsappVideoMediaTypesEnum;
};

export type WhatsappMessagesObject = {
	audio?: WhatsappAudioObject;
	button?: WhatsappButtonObject;
	context?: WhatsappConTextObject;
	document?: WhatsappDocumentObject;
	errors: WhatsappErrorObject[];
	from: string;
	id: string;
	identity?: WhatsappIdentityObject;
	image?: WhatsappImageObject;
	interactive?: WhatsappInteractiveObject;
	order?: WhatsappOrder_Object;
	referral: WhatsappReferralObject;
	sticker?: WhatsappStickerObject;
	system?: WhatsappSystemObject;
	text?: WhatsappTextObject;
	timestamp: string;
	type: WhatsappWebhookTypesEnum;
	video?: WhatsappVideoObject;
};

type WhatsappProfileObject = {
	name: string;
};

type WhatsappContactObject = {
	wa_id: string;
	profile: WhatsappProfileObject;
};

type WhatsappMetadataObject = {
	display_phone_number: string;
	phoneNumberId: string;
};

export type WhatsappValueObject = {
	messaging_product: 'whatsapp';
	contacts: WhatsappContactObject[];
	errors: WhatsappErrorObject[];
	messages: WhatsappMessagesObject[];
	metadata: WhatsappMetadataObject[];
	statuses: WhatsappStatusesObject[];
};

type WhatsappChangesObject = {
	field: string;
	value: WhatsappValueObject;
};

type WhatsappEntry_Object = {
	id: string;
	changes: WhatsappChangesObject[];
};

export type WhatsappWebhookObject = {
	object: 'whatsapp_business_account';
	entry: WhatsappEntry_Object[];
};
