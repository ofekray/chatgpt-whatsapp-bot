# ChatGPT WhatsApp Bot

![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)

## Overview

This repository contains an open-source WhatsApp bot that mimics ChatGPT's behavior.

It is a fun project that showcases how you can create a bot capable of interacting with users through WhatsApp, handling both text and audio messages, and maintaining a history of recent conversations.
The bot also supports generating images, and performing currency conversions via function calls.

Feel free to explore and customize the code to suit your specific needs!

## Getting Started

### OpenAI

To use this bot, you will need an OpenAI API key. If you don't have one already, you can generate it by following the instructions provided [here](https://www.howtogeek.com/885918/how-to-get-an-openai-api-key/).

### WhatsApp

In order to set up the bot for WhatsApp, you need to perform the following steps:

1. Create a new WhatsApp application by following the instructions provided [here](https://developers.facebook.com/docs/whatsapp/cloud-api/get-started#set-up-developer-assets).
2. Configure a WhatsApp webhook by referring to the guide available [here](https://developers.facebook.com/docs/graph-api/webhooks/getting-started).
3. Set up a permanent access token as explained in this [blog post](https://developers.facebook.com/blog/post/2022/12/05/auth-tokens/).

### Redis

To enable the history feature of the bot, you will need to create a Redis Cloud account. You can sign up for a free account [here](https://redis.com/try-free/).

### AWS

To deploy the bot, you must have an AWS account. If you don't have one yet, you can create it by following the instructions provided [here](https://docs.aws.amazon.com/accounts/latest/reference/manage-acct-creating.html).

Additionally, you need to set up the necessary parameters in the AWS Systems Manager (SSM) by referring to the configuration details in the [serverless.yml](https://github.com/ofekray/chatgpt-whatsapp-bot/blob/main/serverless.yml) file.

## Deployment

To deploy the bot, follow these steps:

1. Generate AWS access keys by following the instructions available [here](https://docs.aws.amazon.com/keyspaces/latest/devguide/access.credentials.html).
2. Configure your AWS environment variables. You can find detailed instructions [here](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-envvars.html).
3. Run the deployment command using `npm run deploy`.

## License

This project is licensed under the Apache 2.0 License. For more information, see the [LICENSE](https://github.com/ofekray/chatgpt-whatsapp-bot/blob/main/LICENSE) file.
