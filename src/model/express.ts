import { Send } from 'express-serve-static-core';

export interface TypedResponse<ResBody> extends Express.Response {
    status: (s: number) => TypedResponse<ResBody>;
    json: Send<ResBody, this>;
    send: (b?: ResBody) => void;
 }
