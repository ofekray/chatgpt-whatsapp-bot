export const httpResult = <T>(statusCode: number, body?: T)  => {
    return {
        statusCode,
        body: body ? (typeof body === "string" ? body : JSON.stringify(body)) : undefined
    };
};