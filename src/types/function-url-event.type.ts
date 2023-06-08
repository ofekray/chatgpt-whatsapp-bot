import { APIGatewayProxyEventV2WithIAMAuthorizer, APIGatewayProxyHandlerV2WithIAMAuthorizer, APIGatewayProxyResultV2 } from "aws-lambda";

export type FunctionURLEvent = APIGatewayProxyEventV2WithIAMAuthorizer;
export type FunctionURLHandler = APIGatewayProxyHandlerV2WithIAMAuthorizer;
export type FunctionURLResult = APIGatewayProxyResultV2;
