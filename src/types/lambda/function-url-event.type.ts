import { APIGatewayProxyEventV2WithIAMAuthorizer, APIGatewayProxyHandlerV2WithIAMAuthorizer, APIGatewayProxyResultV2 } from "aws-lambda";
import { Route } from "@middy/http-router";

export type FunctionURLEvent = APIGatewayProxyEventV2WithIAMAuthorizer;
export type FunctionURLHandler = APIGatewayProxyHandlerV2WithIAMAuthorizer;
export type FunctionURLRoute = Route<APIGatewayProxyEventV2WithIAMAuthorizer>;