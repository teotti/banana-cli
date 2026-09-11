import { Elysia } from "elysia";
export declare const appType: Elysia<"", {
    decorator: {
        usersRepository: import("./lib/repositories").UsersRepository;
    } & {
        activitiesRepository: import("./lib/repositories").ActivityRepository;
    } & {
        paymentsRepository: import("./lib/repositories").PaymentsRepository;
    } & {
        expensesRepository: import("./lib/repositories").ExpensesRepository;
    } & {
        recurringExpenseRulesRepository: import("./lib/repositories").RecurringExpenseRulesRepository;
    } & {
        groupsRepository: import("./lib/repositories").GroupsRepository;
    } & {
        friendshipRepository: import("./lib/repositories").FriendshipsRepository;
    } & {
        currenciesRepository: import("./lib/repositories").CurrenciesRepository;
    } & {
        invitesRepository: import("./lib/repositories").InvitesRepository;
    } & {
        notificationsRepository: import("./lib/repositories").NotificationsRepository;
    } & {
        categoriesRepository: import("./lib/repositories").CategoriesRepository;
    };
    store: {
        sessionUser: Omit<{
            id: string;
            name: string;
            email: string | null;
            emailVerified: boolean;
            image: string | null;
            createdAt: Date;
            updatedAt: Date;
            username: string | null;
            displayUsername: string | null;
            bio: string | null;
            isGuest: boolean;
            managedBy: string | null;
            currencyId: string | null;
            inviteToken: string | null;
            role: string | null;
            banned: boolean | null;
            banReason: string | null;
            banExpires: Date | null;
            lastLoginMethod: string | null;
            profileCompletedAt: Date | null;
            deletedAt: Date | null;
            guestState: "managed" | "archived" | "merged" | null;
            guestClaimedAt: Date | null;
            guestArchivedAt: Date | null;
            guestMergedAt: Date | null;
            mergedIntoUserId: string | null;
        }, "email" | "image"> & {
            email: string;
            image?: string | null;
        };
        session: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            expiresAt: Date;
            token: string;
            ipAddress?: string | null | undefined;
            userAgent?: string | null | undefined;
        } | null;
    };
    derive: {};
    resolve: {};
}, {
    typebox: {};
    error: {};
} & {
    typebox: {};
    error: {};
} & {
    typebox: {};
    error: {};
} & {
    typebox: {
        readonly params: import("@sinclair/typebox").TObject<{
            id: import("@sinclair/typebox").TString;
        }>;
    };
    error: {};
}, {
    schema: {};
    standaloneSchema: {};
    macro: {};
    macroFn: {};
    parser: {};
    response: {};
} & {
    schema: {};
    standaloneSchema: {};
    macro: {};
    macroFn: {};
    parser: {};
    response: {};
} & {
    schema: {};
    standaloneSchema: {};
    macro: {};
    macroFn: {};
    parser: {};
    response: {
        200: "Bots are not allowed to access this API";
    };
} & {
    schema: {};
    standaloneSchema: {};
    macro: {};
    macroFn: {};
    parser: {};
    response: {};
} & {
    schema: {};
    standaloneSchema: {};
    macro: Partial<{
        readonly auth: boolean;
        readonly "no-auth": boolean;
    }>;
    macroFn: {
        readonly auth: {
            readonly resolve: ({ request, status, store }: {
                body: unknown;
                query: Record<string, string>;
                params: {};
                headers: Record<string, string | undefined>;
                cookie: Record<string, import("elysia").Cookie<unknown>>;
                server: import("elysia/universal/server").Server | null;
                redirect: import("elysia").redirect;
                set: {
                    headers: import("elysia").HTTPHeaders;
                    status?: number | keyof import("elysia").StatusMap;
                    redirect?: string;
                    cookie?: Record<string, import("elysia/cookies").ElysiaCookie>;
                };
                path: string;
                route: string;
                request: Request;
                store: {
                    sessionUser: Omit<{
                        id: string;
                        name: string;
                        email: string | null;
                        emailVerified: boolean;
                        image: string | null;
                        createdAt: Date;
                        updatedAt: Date;
                        username: string | null;
                        displayUsername: string | null;
                        bio: string | null;
                        isGuest: boolean;
                        managedBy: string | null;
                        currencyId: string | null;
                        inviteToken: string | null;
                        role: string | null;
                        banned: boolean | null;
                        banReason: string | null;
                        banExpires: Date | null;
                        lastLoginMethod: string | null;
                        profileCompletedAt: Date | null;
                        deletedAt: Date | null;
                        guestState: "managed" | "archived" | "merged" | null;
                        guestClaimedAt: Date | null;
                        guestArchivedAt: Date | null;
                        guestMergedAt: Date | null;
                        mergedIntoUserId: string | null;
                    }, "email" | "image"> & {
                        email: string;
                        image?: string | null;
                    };
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        expiresAt: Date;
                        token: string;
                        ipAddress?: string | null | undefined;
                        userAgent?: string | null | undefined;
                    } | null;
                };
                status: <const Code extends number | keyof import("elysia").StatusMap, const T = Code extends 100 | 410 | 500 | 401 | 101 | 102 | 103 | 200 | 201 | 202 | 203 | 204 | 205 | 206 | 207 | 208 | 300 | 301 | 302 | 303 | 304 | 307 | 308 | 400 | 402 | 403 | 404 | 405 | 406 | 407 | 408 | 409 | 411 | 412 | 413 | 414 | 415 | 416 | 417 | 418 | 420 | 421 | 422 | 423 | 424 | 425 | 426 | 428 | 429 | 431 | 451 | 501 | 502 | 503 | 504 | 505 | 506 | 507 | 508 | 510 | 511 ? {
                    readonly 100: "Continue";
                    readonly 101: "Switching Protocols";
                    readonly 102: "Processing";
                    readonly 103: "Early Hints";
                    readonly 200: "OK";
                    readonly 201: "Created";
                    readonly 202: "Accepted";
                    readonly 203: "Non-Authoritative Information";
                    readonly 204: "No Content";
                    readonly 205: "Reset Content";
                    readonly 206: "Partial Content";
                    readonly 207: "Multi-Status";
                    readonly 208: "Already Reported";
                    readonly 300: "Multiple Choices";
                    readonly 301: "Moved Permanently";
                    readonly 302: "Found";
                    readonly 303: "See Other";
                    readonly 304: "Not Modified";
                    readonly 307: "Temporary Redirect";
                    readonly 308: "Permanent Redirect";
                    readonly 400: "Bad Request";
                    readonly 401: "Unauthorized";
                    readonly 402: "Payment Required";
                    readonly 403: "Forbidden";
                    readonly 404: "Not Found";
                    readonly 405: "Method Not Allowed";
                    readonly 406: "Not Acceptable";
                    readonly 407: "Proxy Authentication Required";
                    readonly 408: "Request Timeout";
                    readonly 409: "Conflict";
                    readonly 410: "Gone";
                    readonly 411: "Length Required";
                    readonly 412: "Precondition Failed";
                    readonly 413: "Payload Too Large";
                    readonly 414: "URI Too Long";
                    readonly 415: "Unsupported Media Type";
                    readonly 416: "Range Not Satisfiable";
                    readonly 417: "Expectation Failed";
                    readonly 418: "I'm a teapot";
                    readonly 420: "Enhance Your Calm";
                    readonly 421: "Misdirected Request";
                    readonly 422: "Unprocessable Content";
                    readonly 423: "Locked";
                    readonly 424: "Failed Dependency";
                    readonly 425: "Too Early";
                    readonly 426: "Upgrade Required";
                    readonly 428: "Precondition Required";
                    readonly 429: "Too Many Requests";
                    readonly 431: "Request Header Fields Too Large";
                    readonly 451: "Unavailable For Legal Reasons";
                    readonly 500: "Internal Server Error";
                    readonly 501: "Not Implemented";
                    readonly 502: "Bad Gateway";
                    readonly 503: "Service Unavailable";
                    readonly 504: "Gateway Timeout";
                    readonly 505: "HTTP Version Not Supported";
                    readonly 506: "Variant Also Negotiates";
                    readonly 507: "Insufficient Storage";
                    readonly 508: "Loop Detected";
                    readonly 510: "Not Extended";
                    readonly 511: "Network Authentication Required";
                }[Code] : Code>(code: Code, response?: T) => import("elysia").ElysiaCustomStatusResponse<Code, T, Code extends "Continue" | "Switching Protocols" | "Processing" | "Early Hints" | "OK" | "Created" | "Accepted" | "Non-Authoritative Information" | "No Content" | "Reset Content" | "Partial Content" | "Multi-Status" | "Already Reported" | "Multiple Choices" | "Moved Permanently" | "Found" | "See Other" | "Not Modified" | "Temporary Redirect" | "Permanent Redirect" | "Bad Request" | "Unauthorized" | "Payment Required" | "Forbidden" | "Not Found" | "Method Not Allowed" | "Not Acceptable" | "Proxy Authentication Required" | "Request Timeout" | "Conflict" | "Gone" | "Length Required" | "Precondition Failed" | "Payload Too Large" | "URI Too Long" | "Unsupported Media Type" | "Range Not Satisfiable" | "Expectation Failed" | "I'm a teapot" | "Enhance Your Calm" | "Misdirected Request" | "Unprocessable Content" | "Locked" | "Failed Dependency" | "Too Early" | "Upgrade Required" | "Precondition Required" | "Too Many Requests" | "Request Header Fields Too Large" | "Unavailable For Legal Reasons" | "Internal Server Error" | "Not Implemented" | "Bad Gateway" | "Service Unavailable" | "Gateway Timeout" | "HTTP Version Not Supported" | "Variant Also Negotiates" | "Insufficient Storage" | "Loop Detected" | "Not Extended" | "Network Authentication Required" ? {
                    readonly Continue: 100;
                    readonly "Switching Protocols": 101;
                    readonly Processing: 102;
                    readonly "Early Hints": 103;
                    readonly OK: 200;
                    readonly Created: 201;
                    readonly Accepted: 202;
                    readonly "Non-Authoritative Information": 203;
                    readonly "No Content": 204;
                    readonly "Reset Content": 205;
                    readonly "Partial Content": 206;
                    readonly "Multi-Status": 207;
                    readonly "Already Reported": 208;
                    readonly "Multiple Choices": 300;
                    readonly "Moved Permanently": 301;
                    readonly Found: 302;
                    readonly "See Other": 303;
                    readonly "Not Modified": 304;
                    readonly "Temporary Redirect": 307;
                    readonly "Permanent Redirect": 308;
                    readonly "Bad Request": 400;
                    readonly Unauthorized: 401;
                    readonly "Payment Required": 402;
                    readonly Forbidden: 403;
                    readonly "Not Found": 404;
                    readonly "Method Not Allowed": 405;
                    readonly "Not Acceptable": 406;
                    readonly "Proxy Authentication Required": 407;
                    readonly "Request Timeout": 408;
                    readonly Conflict: 409;
                    readonly Gone: 410;
                    readonly "Length Required": 411;
                    readonly "Precondition Failed": 412;
                    readonly "Payload Too Large": 413;
                    readonly "URI Too Long": 414;
                    readonly "Unsupported Media Type": 415;
                    readonly "Range Not Satisfiable": 416;
                    readonly "Expectation Failed": 417;
                    readonly "I'm a teapot": 418;
                    readonly "Enhance Your Calm": 420;
                    readonly "Misdirected Request": 421;
                    readonly "Unprocessable Content": 422;
                    readonly Locked: 423;
                    readonly "Failed Dependency": 424;
                    readonly "Too Early": 425;
                    readonly "Upgrade Required": 426;
                    readonly "Precondition Required": 428;
                    readonly "Too Many Requests": 429;
                    readonly "Request Header Fields Too Large": 431;
                    readonly "Unavailable For Legal Reasons": 451;
                    readonly "Internal Server Error": 500;
                    readonly "Not Implemented": 501;
                    readonly "Bad Gateway": 502;
                    readonly "Service Unavailable": 503;
                    readonly "Gateway Timeout": 504;
                    readonly "HTTP Version Not Supported": 505;
                    readonly "Variant Also Negotiates": 506;
                    readonly "Insufficient Storage": 507;
                    readonly "Loop Detected": 508;
                    readonly "Not Extended": 510;
                    readonly "Network Authentication Required": 511;
                }[Code] : Code>;
            }) => Promise<import("elysia").ElysiaCustomStatusResponse<401, any, 401> | import("elysia").ElysiaCustomStatusResponse<403, {
                code: string;
                message: string;
            }, 403> | {
                sessionUser: Omit<{
                    id: string;
                    name: string;
                    email: string | null;
                    emailVerified: boolean;
                    image: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                    username: string | null;
                    displayUsername: string | null;
                    bio: string | null;
                    isGuest: boolean;
                    managedBy: string | null;
                    currencyId: string | null;
                    inviteToken: string | null;
                    role: string | null;
                    banned: boolean | null;
                    banReason: string | null;
                    banExpires: Date | null;
                    lastLoginMethod: string | null;
                    profileCompletedAt: Date | null;
                    deletedAt: Date | null;
                    guestState: "managed" | "archived" | "merged" | null;
                    guestClaimedAt: Date | null;
                    guestArchivedAt: Date | null;
                    guestMergedAt: Date | null;
                    mergedIntoUserId: string | null;
                }, "email" | "image"> & {
                    email: string;
                    image?: string | null;
                };
                session: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    expiresAt: Date;
                    token: string;
                    ipAddress?: string | null | undefined;
                    userAgent?: string | null | undefined;
                } | null;
            }>;
        };
        readonly "no-auth": {
            readonly resolve: ({ status, request: { headers } }: {
                body: unknown;
                query: Record<string, string>;
                params: {};
                headers: Record<string, string | undefined>;
                cookie: Record<string, import("elysia").Cookie<unknown>>;
                server: import("elysia/universal/server").Server | null;
                redirect: import("elysia").redirect;
                set: {
                    headers: import("elysia").HTTPHeaders;
                    status?: number | keyof import("elysia").StatusMap;
                    redirect?: string;
                    cookie?: Record<string, import("elysia/cookies").ElysiaCookie>;
                };
                path: string;
                route: string;
                request: Request;
                store: {
                    sessionUser: Omit<{
                        id: string;
                        name: string;
                        email: string | null;
                        emailVerified: boolean;
                        image: string | null;
                        createdAt: Date;
                        updatedAt: Date;
                        username: string | null;
                        displayUsername: string | null;
                        bio: string | null;
                        isGuest: boolean;
                        managedBy: string | null;
                        currencyId: string | null;
                        inviteToken: string | null;
                        role: string | null;
                        banned: boolean | null;
                        banReason: string | null;
                        banExpires: Date | null;
                        lastLoginMethod: string | null;
                        profileCompletedAt: Date | null;
                        deletedAt: Date | null;
                        guestState: "managed" | "archived" | "merged" | null;
                        guestClaimedAt: Date | null;
                        guestArchivedAt: Date | null;
                        guestMergedAt: Date | null;
                        mergedIntoUserId: string | null;
                    }, "email" | "image"> & {
                        email: string;
                        image?: string | null;
                    };
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        expiresAt: Date;
                        token: string;
                        ipAddress?: string | null | undefined;
                        userAgent?: string | null | undefined;
                    } | null;
                };
                status: <const Code extends number | keyof import("elysia").StatusMap, const T = Code extends 100 | 410 | 500 | 401 | 101 | 102 | 103 | 200 | 201 | 202 | 203 | 204 | 205 | 206 | 207 | 208 | 300 | 301 | 302 | 303 | 304 | 307 | 308 | 400 | 402 | 403 | 404 | 405 | 406 | 407 | 408 | 409 | 411 | 412 | 413 | 414 | 415 | 416 | 417 | 418 | 420 | 421 | 422 | 423 | 424 | 425 | 426 | 428 | 429 | 431 | 451 | 501 | 502 | 503 | 504 | 505 | 506 | 507 | 508 | 510 | 511 ? {
                    readonly 100: "Continue";
                    readonly 101: "Switching Protocols";
                    readonly 102: "Processing";
                    readonly 103: "Early Hints";
                    readonly 200: "OK";
                    readonly 201: "Created";
                    readonly 202: "Accepted";
                    readonly 203: "Non-Authoritative Information";
                    readonly 204: "No Content";
                    readonly 205: "Reset Content";
                    readonly 206: "Partial Content";
                    readonly 207: "Multi-Status";
                    readonly 208: "Already Reported";
                    readonly 300: "Multiple Choices";
                    readonly 301: "Moved Permanently";
                    readonly 302: "Found";
                    readonly 303: "See Other";
                    readonly 304: "Not Modified";
                    readonly 307: "Temporary Redirect";
                    readonly 308: "Permanent Redirect";
                    readonly 400: "Bad Request";
                    readonly 401: "Unauthorized";
                    readonly 402: "Payment Required";
                    readonly 403: "Forbidden";
                    readonly 404: "Not Found";
                    readonly 405: "Method Not Allowed";
                    readonly 406: "Not Acceptable";
                    readonly 407: "Proxy Authentication Required";
                    readonly 408: "Request Timeout";
                    readonly 409: "Conflict";
                    readonly 410: "Gone";
                    readonly 411: "Length Required";
                    readonly 412: "Precondition Failed";
                    readonly 413: "Payload Too Large";
                    readonly 414: "URI Too Long";
                    readonly 415: "Unsupported Media Type";
                    readonly 416: "Range Not Satisfiable";
                    readonly 417: "Expectation Failed";
                    readonly 418: "I'm a teapot";
                    readonly 420: "Enhance Your Calm";
                    readonly 421: "Misdirected Request";
                    readonly 422: "Unprocessable Content";
                    readonly 423: "Locked";
                    readonly 424: "Failed Dependency";
                    readonly 425: "Too Early";
                    readonly 426: "Upgrade Required";
                    readonly 428: "Precondition Required";
                    readonly 429: "Too Many Requests";
                    readonly 431: "Request Header Fields Too Large";
                    readonly 451: "Unavailable For Legal Reasons";
                    readonly 500: "Internal Server Error";
                    readonly 501: "Not Implemented";
                    readonly 502: "Bad Gateway";
                    readonly 503: "Service Unavailable";
                    readonly 504: "Gateway Timeout";
                    readonly 505: "HTTP Version Not Supported";
                    readonly 506: "Variant Also Negotiates";
                    readonly 507: "Insufficient Storage";
                    readonly 508: "Loop Detected";
                    readonly 510: "Not Extended";
                    readonly 511: "Network Authentication Required";
                }[Code] : Code>(code: Code, response?: T) => import("elysia").ElysiaCustomStatusResponse<Code, T, Code extends "Continue" | "Switching Protocols" | "Processing" | "Early Hints" | "OK" | "Created" | "Accepted" | "Non-Authoritative Information" | "No Content" | "Reset Content" | "Partial Content" | "Multi-Status" | "Already Reported" | "Multiple Choices" | "Moved Permanently" | "Found" | "See Other" | "Not Modified" | "Temporary Redirect" | "Permanent Redirect" | "Bad Request" | "Unauthorized" | "Payment Required" | "Forbidden" | "Not Found" | "Method Not Allowed" | "Not Acceptable" | "Proxy Authentication Required" | "Request Timeout" | "Conflict" | "Gone" | "Length Required" | "Precondition Failed" | "Payload Too Large" | "URI Too Long" | "Unsupported Media Type" | "Range Not Satisfiable" | "Expectation Failed" | "I'm a teapot" | "Enhance Your Calm" | "Misdirected Request" | "Unprocessable Content" | "Locked" | "Failed Dependency" | "Too Early" | "Upgrade Required" | "Precondition Required" | "Too Many Requests" | "Request Header Fields Too Large" | "Unavailable For Legal Reasons" | "Internal Server Error" | "Not Implemented" | "Bad Gateway" | "Service Unavailable" | "Gateway Timeout" | "HTTP Version Not Supported" | "Variant Also Negotiates" | "Insufficient Storage" | "Loop Detected" | "Not Extended" | "Network Authentication Required" ? {
                    readonly Continue: 100;
                    readonly "Switching Protocols": 101;
                    readonly Processing: 102;
                    readonly "Early Hints": 103;
                    readonly OK: 200;
                    readonly Created: 201;
                    readonly Accepted: 202;
                    readonly "Non-Authoritative Information": 203;
                    readonly "No Content": 204;
                    readonly "Reset Content": 205;
                    readonly "Partial Content": 206;
                    readonly "Multi-Status": 207;
                    readonly "Already Reported": 208;
                    readonly "Multiple Choices": 300;
                    readonly "Moved Permanently": 301;
                    readonly Found: 302;
                    readonly "See Other": 303;
                    readonly "Not Modified": 304;
                    readonly "Temporary Redirect": 307;
                    readonly "Permanent Redirect": 308;
                    readonly "Bad Request": 400;
                    readonly Unauthorized: 401;
                    readonly "Payment Required": 402;
                    readonly Forbidden: 403;
                    readonly "Not Found": 404;
                    readonly "Method Not Allowed": 405;
                    readonly "Not Acceptable": 406;
                    readonly "Proxy Authentication Required": 407;
                    readonly "Request Timeout": 408;
                    readonly Conflict: 409;
                    readonly Gone: 410;
                    readonly "Length Required": 411;
                    readonly "Precondition Failed": 412;
                    readonly "Payload Too Large": 413;
                    readonly "URI Too Long": 414;
                    readonly "Unsupported Media Type": 415;
                    readonly "Range Not Satisfiable": 416;
                    readonly "Expectation Failed": 417;
                    readonly "I'm a teapot": 418;
                    readonly "Enhance Your Calm": 420;
                    readonly "Misdirected Request": 421;
                    readonly "Unprocessable Content": 422;
                    readonly Locked: 423;
                    readonly "Failed Dependency": 424;
                    readonly "Too Early": 425;
                    readonly "Upgrade Required": 426;
                    readonly "Precondition Required": 428;
                    readonly "Too Many Requests": 429;
                    readonly "Request Header Fields Too Large": 431;
                    readonly "Unavailable For Legal Reasons": 451;
                    readonly "Internal Server Error": 500;
                    readonly "Not Implemented": 501;
                    readonly "Bad Gateway": 502;
                    readonly "Service Unavailable": 503;
                    readonly "Gateway Timeout": 504;
                    readonly "HTTP Version Not Supported": 505;
                    readonly "Variant Also Negotiates": 506;
                    readonly "Insufficient Storage": 507;
                    readonly "Loop Detected": 508;
                    readonly "Not Extended": 510;
                    readonly "Network Authentication Required": 511;
                }[Code] : Code>;
            }) => Promise<import("elysia").ElysiaCustomStatusResponse<403, any, 403> | undefined>;
        };
    };
    parser: {};
    response: {};
} & {
    schema: {};
    standaloneSchema: {};
    macro: Partial<{
        readonly apiKey: boolean;
    }>;
    macroFn: {
        readonly apiKey: {
            readonly resolve: ({ status, request: { headers } }: {
                body: unknown;
                query: Record<string, string>;
                params: {};
                headers: Record<string, string | undefined>;
                cookie: Record<string, import("elysia").Cookie<unknown>>;
                server: import("elysia/universal/server").Server | null;
                redirect: import("elysia").redirect;
                set: {
                    headers: import("elysia").HTTPHeaders;
                    status?: number | keyof import("elysia").StatusMap;
                    redirect?: string;
                    cookie?: Record<string, import("elysia/cookies").ElysiaCookie>;
                };
                path: string;
                route: string;
                request: Request;
                store: {};
                status: <const Code extends number | keyof import("elysia").StatusMap, const T = Code extends 100 | 410 | 500 | 401 | 101 | 102 | 103 | 200 | 201 | 202 | 203 | 204 | 205 | 206 | 207 | 208 | 300 | 301 | 302 | 303 | 304 | 307 | 308 | 400 | 402 | 403 | 404 | 405 | 406 | 407 | 408 | 409 | 411 | 412 | 413 | 414 | 415 | 416 | 417 | 418 | 420 | 421 | 422 | 423 | 424 | 425 | 426 | 428 | 429 | 431 | 451 | 501 | 502 | 503 | 504 | 505 | 506 | 507 | 508 | 510 | 511 ? {
                    readonly 100: "Continue";
                    readonly 101: "Switching Protocols";
                    readonly 102: "Processing";
                    readonly 103: "Early Hints";
                    readonly 200: "OK";
                    readonly 201: "Created";
                    readonly 202: "Accepted";
                    readonly 203: "Non-Authoritative Information";
                    readonly 204: "No Content";
                    readonly 205: "Reset Content";
                    readonly 206: "Partial Content";
                    readonly 207: "Multi-Status";
                    readonly 208: "Already Reported";
                    readonly 300: "Multiple Choices";
                    readonly 301: "Moved Permanently";
                    readonly 302: "Found";
                    readonly 303: "See Other";
                    readonly 304: "Not Modified";
                    readonly 307: "Temporary Redirect";
                    readonly 308: "Permanent Redirect";
                    readonly 400: "Bad Request";
                    readonly 401: "Unauthorized";
                    readonly 402: "Payment Required";
                    readonly 403: "Forbidden";
                    readonly 404: "Not Found";
                    readonly 405: "Method Not Allowed";
                    readonly 406: "Not Acceptable";
                    readonly 407: "Proxy Authentication Required";
                    readonly 408: "Request Timeout";
                    readonly 409: "Conflict";
                    readonly 410: "Gone";
                    readonly 411: "Length Required";
                    readonly 412: "Precondition Failed";
                    readonly 413: "Payload Too Large";
                    readonly 414: "URI Too Long";
                    readonly 415: "Unsupported Media Type";
                    readonly 416: "Range Not Satisfiable";
                    readonly 417: "Expectation Failed";
                    readonly 418: "I'm a teapot";
                    readonly 420: "Enhance Your Calm";
                    readonly 421: "Misdirected Request";
                    readonly 422: "Unprocessable Content";
                    readonly 423: "Locked";
                    readonly 424: "Failed Dependency";
                    readonly 425: "Too Early";
                    readonly 426: "Upgrade Required";
                    readonly 428: "Precondition Required";
                    readonly 429: "Too Many Requests";
                    readonly 431: "Request Header Fields Too Large";
                    readonly 451: "Unavailable For Legal Reasons";
                    readonly 500: "Internal Server Error";
                    readonly 501: "Not Implemented";
                    readonly 502: "Bad Gateway";
                    readonly 503: "Service Unavailable";
                    readonly 504: "Gateway Timeout";
                    readonly 505: "HTTP Version Not Supported";
                    readonly 506: "Variant Also Negotiates";
                    readonly 507: "Insufficient Storage";
                    readonly 508: "Loop Detected";
                    readonly 510: "Not Extended";
                    readonly 511: "Network Authentication Required";
                }[Code] : Code>(code: Code, response?: T) => import("elysia").ElysiaCustomStatusResponse<Code, T, Code extends "Continue" | "Switching Protocols" | "Processing" | "Early Hints" | "OK" | "Created" | "Accepted" | "Non-Authoritative Information" | "No Content" | "Reset Content" | "Partial Content" | "Multi-Status" | "Already Reported" | "Multiple Choices" | "Moved Permanently" | "Found" | "See Other" | "Not Modified" | "Temporary Redirect" | "Permanent Redirect" | "Bad Request" | "Unauthorized" | "Payment Required" | "Forbidden" | "Not Found" | "Method Not Allowed" | "Not Acceptable" | "Proxy Authentication Required" | "Request Timeout" | "Conflict" | "Gone" | "Length Required" | "Precondition Failed" | "Payload Too Large" | "URI Too Long" | "Unsupported Media Type" | "Range Not Satisfiable" | "Expectation Failed" | "I'm a teapot" | "Enhance Your Calm" | "Misdirected Request" | "Unprocessable Content" | "Locked" | "Failed Dependency" | "Too Early" | "Upgrade Required" | "Precondition Required" | "Too Many Requests" | "Request Header Fields Too Large" | "Unavailable For Legal Reasons" | "Internal Server Error" | "Not Implemented" | "Bad Gateway" | "Service Unavailable" | "Gateway Timeout" | "HTTP Version Not Supported" | "Variant Also Negotiates" | "Insufficient Storage" | "Loop Detected" | "Not Extended" | "Network Authentication Required" ? {
                    readonly Continue: 100;
                    readonly "Switching Protocols": 101;
                    readonly Processing: 102;
                    readonly "Early Hints": 103;
                    readonly OK: 200;
                    readonly Created: 201;
                    readonly Accepted: 202;
                    readonly "Non-Authoritative Information": 203;
                    readonly "No Content": 204;
                    readonly "Reset Content": 205;
                    readonly "Partial Content": 206;
                    readonly "Multi-Status": 207;
                    readonly "Already Reported": 208;
                    readonly "Multiple Choices": 300;
                    readonly "Moved Permanently": 301;
                    readonly Found: 302;
                    readonly "See Other": 303;
                    readonly "Not Modified": 304;
                    readonly "Temporary Redirect": 307;
                    readonly "Permanent Redirect": 308;
                    readonly "Bad Request": 400;
                    readonly Unauthorized: 401;
                    readonly "Payment Required": 402;
                    readonly Forbidden: 403;
                    readonly "Not Found": 404;
                    readonly "Method Not Allowed": 405;
                    readonly "Not Acceptable": 406;
                    readonly "Proxy Authentication Required": 407;
                    readonly "Request Timeout": 408;
                    readonly Conflict: 409;
                    readonly Gone: 410;
                    readonly "Length Required": 411;
                    readonly "Precondition Failed": 412;
                    readonly "Payload Too Large": 413;
                    readonly "URI Too Long": 414;
                    readonly "Unsupported Media Type": 415;
                    readonly "Range Not Satisfiable": 416;
                    readonly "Expectation Failed": 417;
                    readonly "I'm a teapot": 418;
                    readonly "Enhance Your Calm": 420;
                    readonly "Misdirected Request": 421;
                    readonly "Unprocessable Content": 422;
                    readonly Locked: 423;
                    readonly "Failed Dependency": 424;
                    readonly "Too Early": 425;
                    readonly "Upgrade Required": 426;
                    readonly "Precondition Required": 428;
                    readonly "Too Many Requests": 429;
                    readonly "Request Header Fields Too Large": 431;
                    readonly "Unavailable For Legal Reasons": 451;
                    readonly "Internal Server Error": 500;
                    readonly "Not Implemented": 501;
                    readonly "Bad Gateway": 502;
                    readonly "Service Unavailable": 503;
                    readonly "Gateway Timeout": 504;
                    readonly "HTTP Version Not Supported": 505;
                    readonly "Variant Also Negotiates": 506;
                    readonly "Insufficient Storage": 507;
                    readonly "Loop Detected": 508;
                    readonly "Not Extended": 510;
                    readonly "Network Authentication Required": 511;
                }[Code] : Code>;
            }) => Promise<import("elysia").ElysiaCustomStatusResponse<403, "Unauthorized", 403> | import("elysia").ElysiaCustomStatusResponse<403, "Forbidden", 403> | undefined>;
        };
    };
    parser: {};
    response: {};
} & {
    schema: {};
    standaloneSchema: {};
    macro: Partial<{
        readonly auth: boolean;
        readonly "no-auth": boolean;
    }> & Partial<{
        readonly participant: boolean;
    }>;
    macroFn: {
        readonly auth: {
            readonly resolve: ({ request, status, store }: {
                body: unknown;
                query: Record<string, string>;
                params: {};
                headers: Record<string, string | undefined>;
                cookie: Record<string, import("elysia").Cookie<unknown>>;
                server: import("elysia/universal/server").Server | null;
                redirect: import("elysia").redirect;
                set: {
                    headers: import("elysia").HTTPHeaders;
                    status?: number | keyof import("elysia").StatusMap;
                    redirect?: string;
                    cookie?: Record<string, import("elysia/cookies").ElysiaCookie>;
                };
                path: string;
                route: string;
                request: Request;
                store: {
                    sessionUser: Omit<{
                        id: string;
                        name: string;
                        email: string | null;
                        emailVerified: boolean;
                        image: string | null;
                        createdAt: Date;
                        updatedAt: Date;
                        username: string | null;
                        displayUsername: string | null;
                        bio: string | null;
                        isGuest: boolean;
                        managedBy: string | null;
                        currencyId: string | null;
                        inviteToken: string | null;
                        role: string | null;
                        banned: boolean | null;
                        banReason: string | null;
                        banExpires: Date | null;
                        lastLoginMethod: string | null;
                        profileCompletedAt: Date | null;
                        deletedAt: Date | null;
                        guestState: "managed" | "archived" | "merged" | null;
                        guestClaimedAt: Date | null;
                        guestArchivedAt: Date | null;
                        guestMergedAt: Date | null;
                        mergedIntoUserId: string | null;
                    }, "email" | "image"> & {
                        email: string;
                        image?: string | null;
                    };
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        expiresAt: Date;
                        token: string;
                        ipAddress?: string | null | undefined;
                        userAgent?: string | null | undefined;
                    } | null;
                };
                status: <const Code extends number | keyof import("elysia").StatusMap, const T = Code extends 100 | 410 | 500 | 401 | 101 | 102 | 103 | 200 | 201 | 202 | 203 | 204 | 205 | 206 | 207 | 208 | 300 | 301 | 302 | 303 | 304 | 307 | 308 | 400 | 402 | 403 | 404 | 405 | 406 | 407 | 408 | 409 | 411 | 412 | 413 | 414 | 415 | 416 | 417 | 418 | 420 | 421 | 422 | 423 | 424 | 425 | 426 | 428 | 429 | 431 | 451 | 501 | 502 | 503 | 504 | 505 | 506 | 507 | 508 | 510 | 511 ? {
                    readonly 100: "Continue";
                    readonly 101: "Switching Protocols";
                    readonly 102: "Processing";
                    readonly 103: "Early Hints";
                    readonly 200: "OK";
                    readonly 201: "Created";
                    readonly 202: "Accepted";
                    readonly 203: "Non-Authoritative Information";
                    readonly 204: "No Content";
                    readonly 205: "Reset Content";
                    readonly 206: "Partial Content";
                    readonly 207: "Multi-Status";
                    readonly 208: "Already Reported";
                    readonly 300: "Multiple Choices";
                    readonly 301: "Moved Permanently";
                    readonly 302: "Found";
                    readonly 303: "See Other";
                    readonly 304: "Not Modified";
                    readonly 307: "Temporary Redirect";
                    readonly 308: "Permanent Redirect";
                    readonly 400: "Bad Request";
                    readonly 401: "Unauthorized";
                    readonly 402: "Payment Required";
                    readonly 403: "Forbidden";
                    readonly 404: "Not Found";
                    readonly 405: "Method Not Allowed";
                    readonly 406: "Not Acceptable";
                    readonly 407: "Proxy Authentication Required";
                    readonly 408: "Request Timeout";
                    readonly 409: "Conflict";
                    readonly 410: "Gone";
                    readonly 411: "Length Required";
                    readonly 412: "Precondition Failed";
                    readonly 413: "Payload Too Large";
                    readonly 414: "URI Too Long";
                    readonly 415: "Unsupported Media Type";
                    readonly 416: "Range Not Satisfiable";
                    readonly 417: "Expectation Failed";
                    readonly 418: "I'm a teapot";
                    readonly 420: "Enhance Your Calm";
                    readonly 421: "Misdirected Request";
                    readonly 422: "Unprocessable Content";
                    readonly 423: "Locked";
                    readonly 424: "Failed Dependency";
                    readonly 425: "Too Early";
                    readonly 426: "Upgrade Required";
                    readonly 428: "Precondition Required";
                    readonly 429: "Too Many Requests";
                    readonly 431: "Request Header Fields Too Large";
                    readonly 451: "Unavailable For Legal Reasons";
                    readonly 500: "Internal Server Error";
                    readonly 501: "Not Implemented";
                    readonly 502: "Bad Gateway";
                    readonly 503: "Service Unavailable";
                    readonly 504: "Gateway Timeout";
                    readonly 505: "HTTP Version Not Supported";
                    readonly 506: "Variant Also Negotiates";
                    readonly 507: "Insufficient Storage";
                    readonly 508: "Loop Detected";
                    readonly 510: "Not Extended";
                    readonly 511: "Network Authentication Required";
                }[Code] : Code>(code: Code, response?: T) => import("elysia").ElysiaCustomStatusResponse<Code, T, Code extends "Continue" | "Switching Protocols" | "Processing" | "Early Hints" | "OK" | "Created" | "Accepted" | "Non-Authoritative Information" | "No Content" | "Reset Content" | "Partial Content" | "Multi-Status" | "Already Reported" | "Multiple Choices" | "Moved Permanently" | "Found" | "See Other" | "Not Modified" | "Temporary Redirect" | "Permanent Redirect" | "Bad Request" | "Unauthorized" | "Payment Required" | "Forbidden" | "Not Found" | "Method Not Allowed" | "Not Acceptable" | "Proxy Authentication Required" | "Request Timeout" | "Conflict" | "Gone" | "Length Required" | "Precondition Failed" | "Payload Too Large" | "URI Too Long" | "Unsupported Media Type" | "Range Not Satisfiable" | "Expectation Failed" | "I'm a teapot" | "Enhance Your Calm" | "Misdirected Request" | "Unprocessable Content" | "Locked" | "Failed Dependency" | "Too Early" | "Upgrade Required" | "Precondition Required" | "Too Many Requests" | "Request Header Fields Too Large" | "Unavailable For Legal Reasons" | "Internal Server Error" | "Not Implemented" | "Bad Gateway" | "Service Unavailable" | "Gateway Timeout" | "HTTP Version Not Supported" | "Variant Also Negotiates" | "Insufficient Storage" | "Loop Detected" | "Not Extended" | "Network Authentication Required" ? {
                    readonly Continue: 100;
                    readonly "Switching Protocols": 101;
                    readonly Processing: 102;
                    readonly "Early Hints": 103;
                    readonly OK: 200;
                    readonly Created: 201;
                    readonly Accepted: 202;
                    readonly "Non-Authoritative Information": 203;
                    readonly "No Content": 204;
                    readonly "Reset Content": 205;
                    readonly "Partial Content": 206;
                    readonly "Multi-Status": 207;
                    readonly "Already Reported": 208;
                    readonly "Multiple Choices": 300;
                    readonly "Moved Permanently": 301;
                    readonly Found: 302;
                    readonly "See Other": 303;
                    readonly "Not Modified": 304;
                    readonly "Temporary Redirect": 307;
                    readonly "Permanent Redirect": 308;
                    readonly "Bad Request": 400;
                    readonly Unauthorized: 401;
                    readonly "Payment Required": 402;
                    readonly Forbidden: 403;
                    readonly "Not Found": 404;
                    readonly "Method Not Allowed": 405;
                    readonly "Not Acceptable": 406;
                    readonly "Proxy Authentication Required": 407;
                    readonly "Request Timeout": 408;
                    readonly Conflict: 409;
                    readonly Gone: 410;
                    readonly "Length Required": 411;
                    readonly "Precondition Failed": 412;
                    readonly "Payload Too Large": 413;
                    readonly "URI Too Long": 414;
                    readonly "Unsupported Media Type": 415;
                    readonly "Range Not Satisfiable": 416;
                    readonly "Expectation Failed": 417;
                    readonly "I'm a teapot": 418;
                    readonly "Enhance Your Calm": 420;
                    readonly "Misdirected Request": 421;
                    readonly "Unprocessable Content": 422;
                    readonly Locked: 423;
                    readonly "Failed Dependency": 424;
                    readonly "Too Early": 425;
                    readonly "Upgrade Required": 426;
                    readonly "Precondition Required": 428;
                    readonly "Too Many Requests": 429;
                    readonly "Request Header Fields Too Large": 431;
                    readonly "Unavailable For Legal Reasons": 451;
                    readonly "Internal Server Error": 500;
                    readonly "Not Implemented": 501;
                    readonly "Bad Gateway": 502;
                    readonly "Service Unavailable": 503;
                    readonly "Gateway Timeout": 504;
                    readonly "HTTP Version Not Supported": 505;
                    readonly "Variant Also Negotiates": 506;
                    readonly "Insufficient Storage": 507;
                    readonly "Loop Detected": 508;
                    readonly "Not Extended": 510;
                    readonly "Network Authentication Required": 511;
                }[Code] : Code>;
            }) => Promise<import("elysia").ElysiaCustomStatusResponse<401, any, 401> | import("elysia").ElysiaCustomStatusResponse<403, {
                code: string;
                message: string;
            }, 403> | {
                sessionUser: Omit<{
                    id: string;
                    name: string;
                    email: string | null;
                    emailVerified: boolean;
                    image: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                    username: string | null;
                    displayUsername: string | null;
                    bio: string | null;
                    isGuest: boolean;
                    managedBy: string | null;
                    currencyId: string | null;
                    inviteToken: string | null;
                    role: string | null;
                    banned: boolean | null;
                    banReason: string | null;
                    banExpires: Date | null;
                    lastLoginMethod: string | null;
                    profileCompletedAt: Date | null;
                    deletedAt: Date | null;
                    guestState: "managed" | "archived" | "merged" | null;
                    guestClaimedAt: Date | null;
                    guestArchivedAt: Date | null;
                    guestMergedAt: Date | null;
                    mergedIntoUserId: string | null;
                }, "email" | "image"> & {
                    email: string;
                    image?: string | null;
                };
                session: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    expiresAt: Date;
                    token: string;
                    ipAddress?: string | null | undefined;
                    userAgent?: string | null | undefined;
                } | null;
            }>;
        };
        readonly "no-auth": {
            readonly resolve: ({ status, request: { headers } }: {
                body: unknown;
                query: Record<string, string>;
                params: {};
                headers: Record<string, string | undefined>;
                cookie: Record<string, import("elysia").Cookie<unknown>>;
                server: import("elysia/universal/server").Server | null;
                redirect: import("elysia").redirect;
                set: {
                    headers: import("elysia").HTTPHeaders;
                    status?: number | keyof import("elysia").StatusMap;
                    redirect?: string;
                    cookie?: Record<string, import("elysia/cookies").ElysiaCookie>;
                };
                path: string;
                route: string;
                request: Request;
                store: {
                    sessionUser: Omit<{
                        id: string;
                        name: string;
                        email: string | null;
                        emailVerified: boolean;
                        image: string | null;
                        createdAt: Date;
                        updatedAt: Date;
                        username: string | null;
                        displayUsername: string | null;
                        bio: string | null;
                        isGuest: boolean;
                        managedBy: string | null;
                        currencyId: string | null;
                        inviteToken: string | null;
                        role: string | null;
                        banned: boolean | null;
                        banReason: string | null;
                        banExpires: Date | null;
                        lastLoginMethod: string | null;
                        profileCompletedAt: Date | null;
                        deletedAt: Date | null;
                        guestState: "managed" | "archived" | "merged" | null;
                        guestClaimedAt: Date | null;
                        guestArchivedAt: Date | null;
                        guestMergedAt: Date | null;
                        mergedIntoUserId: string | null;
                    }, "email" | "image"> & {
                        email: string;
                        image?: string | null;
                    };
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        expiresAt: Date;
                        token: string;
                        ipAddress?: string | null | undefined;
                        userAgent?: string | null | undefined;
                    } | null;
                };
                status: <const Code extends number | keyof import("elysia").StatusMap, const T = Code extends 100 | 410 | 500 | 401 | 101 | 102 | 103 | 200 | 201 | 202 | 203 | 204 | 205 | 206 | 207 | 208 | 300 | 301 | 302 | 303 | 304 | 307 | 308 | 400 | 402 | 403 | 404 | 405 | 406 | 407 | 408 | 409 | 411 | 412 | 413 | 414 | 415 | 416 | 417 | 418 | 420 | 421 | 422 | 423 | 424 | 425 | 426 | 428 | 429 | 431 | 451 | 501 | 502 | 503 | 504 | 505 | 506 | 507 | 508 | 510 | 511 ? {
                    readonly 100: "Continue";
                    readonly 101: "Switching Protocols";
                    readonly 102: "Processing";
                    readonly 103: "Early Hints";
                    readonly 200: "OK";
                    readonly 201: "Created";
                    readonly 202: "Accepted";
                    readonly 203: "Non-Authoritative Information";
                    readonly 204: "No Content";
                    readonly 205: "Reset Content";
                    readonly 206: "Partial Content";
                    readonly 207: "Multi-Status";
                    readonly 208: "Already Reported";
                    readonly 300: "Multiple Choices";
                    readonly 301: "Moved Permanently";
                    readonly 302: "Found";
                    readonly 303: "See Other";
                    readonly 304: "Not Modified";
                    readonly 307: "Temporary Redirect";
                    readonly 308: "Permanent Redirect";
                    readonly 400: "Bad Request";
                    readonly 401: "Unauthorized";
                    readonly 402: "Payment Required";
                    readonly 403: "Forbidden";
                    readonly 404: "Not Found";
                    readonly 405: "Method Not Allowed";
                    readonly 406: "Not Acceptable";
                    readonly 407: "Proxy Authentication Required";
                    readonly 408: "Request Timeout";
                    readonly 409: "Conflict";
                    readonly 410: "Gone";
                    readonly 411: "Length Required";
                    readonly 412: "Precondition Failed";
                    readonly 413: "Payload Too Large";
                    readonly 414: "URI Too Long";
                    readonly 415: "Unsupported Media Type";
                    readonly 416: "Range Not Satisfiable";
                    readonly 417: "Expectation Failed";
                    readonly 418: "I'm a teapot";
                    readonly 420: "Enhance Your Calm";
                    readonly 421: "Misdirected Request";
                    readonly 422: "Unprocessable Content";
                    readonly 423: "Locked";
                    readonly 424: "Failed Dependency";
                    readonly 425: "Too Early";
                    readonly 426: "Upgrade Required";
                    readonly 428: "Precondition Required";
                    readonly 429: "Too Many Requests";
                    readonly 431: "Request Header Fields Too Large";
                    readonly 451: "Unavailable For Legal Reasons";
                    readonly 500: "Internal Server Error";
                    readonly 501: "Not Implemented";
                    readonly 502: "Bad Gateway";
                    readonly 503: "Service Unavailable";
                    readonly 504: "Gateway Timeout";
                    readonly 505: "HTTP Version Not Supported";
                    readonly 506: "Variant Also Negotiates";
                    readonly 507: "Insufficient Storage";
                    readonly 508: "Loop Detected";
                    readonly 510: "Not Extended";
                    readonly 511: "Network Authentication Required";
                }[Code] : Code>(code: Code, response?: T) => import("elysia").ElysiaCustomStatusResponse<Code, T, Code extends "Continue" | "Switching Protocols" | "Processing" | "Early Hints" | "OK" | "Created" | "Accepted" | "Non-Authoritative Information" | "No Content" | "Reset Content" | "Partial Content" | "Multi-Status" | "Already Reported" | "Multiple Choices" | "Moved Permanently" | "Found" | "See Other" | "Not Modified" | "Temporary Redirect" | "Permanent Redirect" | "Bad Request" | "Unauthorized" | "Payment Required" | "Forbidden" | "Not Found" | "Method Not Allowed" | "Not Acceptable" | "Proxy Authentication Required" | "Request Timeout" | "Conflict" | "Gone" | "Length Required" | "Precondition Failed" | "Payload Too Large" | "URI Too Long" | "Unsupported Media Type" | "Range Not Satisfiable" | "Expectation Failed" | "I'm a teapot" | "Enhance Your Calm" | "Misdirected Request" | "Unprocessable Content" | "Locked" | "Failed Dependency" | "Too Early" | "Upgrade Required" | "Precondition Required" | "Too Many Requests" | "Request Header Fields Too Large" | "Unavailable For Legal Reasons" | "Internal Server Error" | "Not Implemented" | "Bad Gateway" | "Service Unavailable" | "Gateway Timeout" | "HTTP Version Not Supported" | "Variant Also Negotiates" | "Insufficient Storage" | "Loop Detected" | "Not Extended" | "Network Authentication Required" ? {
                    readonly Continue: 100;
                    readonly "Switching Protocols": 101;
                    readonly Processing: 102;
                    readonly "Early Hints": 103;
                    readonly OK: 200;
                    readonly Created: 201;
                    readonly Accepted: 202;
                    readonly "Non-Authoritative Information": 203;
                    readonly "No Content": 204;
                    readonly "Reset Content": 205;
                    readonly "Partial Content": 206;
                    readonly "Multi-Status": 207;
                    readonly "Already Reported": 208;
                    readonly "Multiple Choices": 300;
                    readonly "Moved Permanently": 301;
                    readonly Found: 302;
                    readonly "See Other": 303;
                    readonly "Not Modified": 304;
                    readonly "Temporary Redirect": 307;
                    readonly "Permanent Redirect": 308;
                    readonly "Bad Request": 400;
                    readonly Unauthorized: 401;
                    readonly "Payment Required": 402;
                    readonly Forbidden: 403;
                    readonly "Not Found": 404;
                    readonly "Method Not Allowed": 405;
                    readonly "Not Acceptable": 406;
                    readonly "Proxy Authentication Required": 407;
                    readonly "Request Timeout": 408;
                    readonly Conflict: 409;
                    readonly Gone: 410;
                    readonly "Length Required": 411;
                    readonly "Precondition Failed": 412;
                    readonly "Payload Too Large": 413;
                    readonly "URI Too Long": 414;
                    readonly "Unsupported Media Type": 415;
                    readonly "Range Not Satisfiable": 416;
                    readonly "Expectation Failed": 417;
                    readonly "I'm a teapot": 418;
                    readonly "Enhance Your Calm": 420;
                    readonly "Misdirected Request": 421;
                    readonly "Unprocessable Content": 422;
                    readonly Locked: 423;
                    readonly "Failed Dependency": 424;
                    readonly "Too Early": 425;
                    readonly "Upgrade Required": 426;
                    readonly "Precondition Required": 428;
                    readonly "Too Many Requests": 429;
                    readonly "Request Header Fields Too Large": 431;
                    readonly "Unavailable For Legal Reasons": 451;
                    readonly "Internal Server Error": 500;
                    readonly "Not Implemented": 501;
                    readonly "Bad Gateway": 502;
                    readonly "Service Unavailable": 503;
                    readonly "Gateway Timeout": 504;
                    readonly "HTTP Version Not Supported": 505;
                    readonly "Variant Also Negotiates": 506;
                    readonly "Insufficient Storage": 507;
                    readonly "Loop Detected": 508;
                    readonly "Not Extended": 510;
                    readonly "Network Authentication Required": 511;
                }[Code] : Code>;
            }) => Promise<import("elysia").ElysiaCustomStatusResponse<403, any, 403> | undefined>;
        };
    } & {
        readonly participant: {
            readonly resolve: ({ status, store: { sessionUser }, params }: {
                body: unknown;
                query: Record<string, string>;
                params: {};
                headers: Record<string, string | undefined>;
                cookie: Record<string, import("elysia").Cookie<unknown>>;
                server: import("elysia/universal/server").Server | null;
                redirect: import("elysia").redirect;
                set: {
                    headers: import("elysia").HTTPHeaders;
                    status?: number | keyof import("elysia").StatusMap;
                    redirect?: string;
                    cookie?: Record<string, import("elysia/cookies").ElysiaCookie>;
                };
                path: string;
                route: string;
                request: Request;
                store: {
                    sessionUser: Omit<{
                        id: string;
                        name: string;
                        email: string | null;
                        emailVerified: boolean;
                        image: string | null;
                        createdAt: Date;
                        updatedAt: Date;
                        username: string | null;
                        displayUsername: string | null;
                        bio: string | null;
                        isGuest: boolean;
                        managedBy: string | null;
                        currencyId: string | null;
                        inviteToken: string | null;
                        role: string | null;
                        banned: boolean | null;
                        banReason: string | null;
                        banExpires: Date | null;
                        lastLoginMethod: string | null;
                        profileCompletedAt: Date | null;
                        deletedAt: Date | null;
                        guestState: "managed" | "archived" | "merged" | null;
                        guestClaimedAt: Date | null;
                        guestArchivedAt: Date | null;
                        guestMergedAt: Date | null;
                        mergedIntoUserId: string | null;
                    }, "email" | "image"> & {
                        email: string;
                        image?: string | null;
                    };
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        expiresAt: Date;
                        token: string;
                        ipAddress?: string | null | undefined;
                        userAgent?: string | null | undefined;
                    } | null;
                };
                status: <const Code extends number | keyof import("elysia").StatusMap, const T = Code extends 100 | 410 | 500 | 401 | 101 | 102 | 103 | 200 | 201 | 202 | 203 | 204 | 205 | 206 | 207 | 208 | 300 | 301 | 302 | 303 | 304 | 307 | 308 | 400 | 402 | 403 | 404 | 405 | 406 | 407 | 408 | 409 | 411 | 412 | 413 | 414 | 415 | 416 | 417 | 418 | 420 | 421 | 422 | 423 | 424 | 425 | 426 | 428 | 429 | 431 | 451 | 501 | 502 | 503 | 504 | 505 | 506 | 507 | 508 | 510 | 511 ? {
                    readonly 100: "Continue";
                    readonly 101: "Switching Protocols";
                    readonly 102: "Processing";
                    readonly 103: "Early Hints";
                    readonly 200: "OK";
                    readonly 201: "Created";
                    readonly 202: "Accepted";
                    readonly 203: "Non-Authoritative Information";
                    readonly 204: "No Content";
                    readonly 205: "Reset Content";
                    readonly 206: "Partial Content";
                    readonly 207: "Multi-Status";
                    readonly 208: "Already Reported";
                    readonly 300: "Multiple Choices";
                    readonly 301: "Moved Permanently";
                    readonly 302: "Found";
                    readonly 303: "See Other";
                    readonly 304: "Not Modified";
                    readonly 307: "Temporary Redirect";
                    readonly 308: "Permanent Redirect";
                    readonly 400: "Bad Request";
                    readonly 401: "Unauthorized";
                    readonly 402: "Payment Required";
                    readonly 403: "Forbidden";
                    readonly 404: "Not Found";
                    readonly 405: "Method Not Allowed";
                    readonly 406: "Not Acceptable";
                    readonly 407: "Proxy Authentication Required";
                    readonly 408: "Request Timeout";
                    readonly 409: "Conflict";
                    readonly 410: "Gone";
                    readonly 411: "Length Required";
                    readonly 412: "Precondition Failed";
                    readonly 413: "Payload Too Large";
                    readonly 414: "URI Too Long";
                    readonly 415: "Unsupported Media Type";
                    readonly 416: "Range Not Satisfiable";
                    readonly 417: "Expectation Failed";
                    readonly 418: "I'm a teapot";
                    readonly 420: "Enhance Your Calm";
                    readonly 421: "Misdirected Request";
                    readonly 422: "Unprocessable Content";
                    readonly 423: "Locked";
                    readonly 424: "Failed Dependency";
                    readonly 425: "Too Early";
                    readonly 426: "Upgrade Required";
                    readonly 428: "Precondition Required";
                    readonly 429: "Too Many Requests";
                    readonly 431: "Request Header Fields Too Large";
                    readonly 451: "Unavailable For Legal Reasons";
                    readonly 500: "Internal Server Error";
                    readonly 501: "Not Implemented";
                    readonly 502: "Bad Gateway";
                    readonly 503: "Service Unavailable";
                    readonly 504: "Gateway Timeout";
                    readonly 505: "HTTP Version Not Supported";
                    readonly 506: "Variant Also Negotiates";
                    readonly 507: "Insufficient Storage";
                    readonly 508: "Loop Detected";
                    readonly 510: "Not Extended";
                    readonly 511: "Network Authentication Required";
                }[Code] : Code>(code: Code, response?: T) => import("elysia").ElysiaCustomStatusResponse<Code, T, Code extends "Continue" | "Switching Protocols" | "Processing" | "Early Hints" | "OK" | "Created" | "Accepted" | "Non-Authoritative Information" | "No Content" | "Reset Content" | "Partial Content" | "Multi-Status" | "Already Reported" | "Multiple Choices" | "Moved Permanently" | "Found" | "See Other" | "Not Modified" | "Temporary Redirect" | "Permanent Redirect" | "Bad Request" | "Unauthorized" | "Payment Required" | "Forbidden" | "Not Found" | "Method Not Allowed" | "Not Acceptable" | "Proxy Authentication Required" | "Request Timeout" | "Conflict" | "Gone" | "Length Required" | "Precondition Failed" | "Payload Too Large" | "URI Too Long" | "Unsupported Media Type" | "Range Not Satisfiable" | "Expectation Failed" | "I'm a teapot" | "Enhance Your Calm" | "Misdirected Request" | "Unprocessable Content" | "Locked" | "Failed Dependency" | "Too Early" | "Upgrade Required" | "Precondition Required" | "Too Many Requests" | "Request Header Fields Too Large" | "Unavailable For Legal Reasons" | "Internal Server Error" | "Not Implemented" | "Bad Gateway" | "Service Unavailable" | "Gateway Timeout" | "HTTP Version Not Supported" | "Variant Also Negotiates" | "Insufficient Storage" | "Loop Detected" | "Not Extended" | "Network Authentication Required" ? {
                    readonly Continue: 100;
                    readonly "Switching Protocols": 101;
                    readonly Processing: 102;
                    readonly "Early Hints": 103;
                    readonly OK: 200;
                    readonly Created: 201;
                    readonly Accepted: 202;
                    readonly "Non-Authoritative Information": 203;
                    readonly "No Content": 204;
                    readonly "Reset Content": 205;
                    readonly "Partial Content": 206;
                    readonly "Multi-Status": 207;
                    readonly "Already Reported": 208;
                    readonly "Multiple Choices": 300;
                    readonly "Moved Permanently": 301;
                    readonly Found: 302;
                    readonly "See Other": 303;
                    readonly "Not Modified": 304;
                    readonly "Temporary Redirect": 307;
                    readonly "Permanent Redirect": 308;
                    readonly "Bad Request": 400;
                    readonly Unauthorized: 401;
                    readonly "Payment Required": 402;
                    readonly Forbidden: 403;
                    readonly "Not Found": 404;
                    readonly "Method Not Allowed": 405;
                    readonly "Not Acceptable": 406;
                    readonly "Proxy Authentication Required": 407;
                    readonly "Request Timeout": 408;
                    readonly Conflict: 409;
                    readonly Gone: 410;
                    readonly "Length Required": 411;
                    readonly "Precondition Failed": 412;
                    readonly "Payload Too Large": 413;
                    readonly "URI Too Long": 414;
                    readonly "Unsupported Media Type": 415;
                    readonly "Range Not Satisfiable": 416;
                    readonly "Expectation Failed": 417;
                    readonly "I'm a teapot": 418;
                    readonly "Enhance Your Calm": 420;
                    readonly "Misdirected Request": 421;
                    readonly "Unprocessable Content": 422;
                    readonly Locked: 423;
                    readonly "Failed Dependency": 424;
                    readonly "Too Early": 425;
                    readonly "Upgrade Required": 426;
                    readonly "Precondition Required": 428;
                    readonly "Too Many Requests": 429;
                    readonly "Request Header Fields Too Large": 431;
                    readonly "Unavailable For Legal Reasons": 451;
                    readonly "Internal Server Error": 500;
                    readonly "Not Implemented": 501;
                    readonly "Bad Gateway": 502;
                    readonly "Service Unavailable": 503;
                    readonly "Gateway Timeout": 504;
                    readonly "HTTP Version Not Supported": 505;
                    readonly "Variant Also Negotiates": 506;
                    readonly "Insufficient Storage": 507;
                    readonly "Loop Detected": 508;
                    readonly "Not Extended": 510;
                    readonly "Network Authentication Required": 511;
                }[Code] : Code>;
            }) => Promise<import("elysia").ElysiaCustomStatusResponse<403, any, 403> | import("elysia").ElysiaCustomStatusResponse<404, any, 404> | undefined>;
        };
    };
    parser: {};
    response: {};
} & {
    schema: {};
    standaloneSchema: {};
    macro: Partial<{
        readonly auth: boolean;
        readonly "no-auth": boolean;
    }> & Partial<{
        readonly owner: boolean;
        readonly participant: boolean;
    }>;
    macroFn: {
        readonly auth: {
            readonly resolve: ({ request, status, store }: {
                body: unknown;
                query: Record<string, string>;
                params: {};
                headers: Record<string, string | undefined>;
                cookie: Record<string, import("elysia").Cookie<unknown>>;
                server: import("elysia/universal/server").Server | null;
                redirect: import("elysia").redirect;
                set: {
                    headers: import("elysia").HTTPHeaders;
                    status?: number | keyof import("elysia").StatusMap;
                    redirect?: string;
                    cookie?: Record<string, import("elysia/cookies").ElysiaCookie>;
                };
                path: string;
                route: string;
                request: Request;
                store: {
                    sessionUser: Omit<{
                        id: string;
                        name: string;
                        email: string | null;
                        emailVerified: boolean;
                        image: string | null;
                        createdAt: Date;
                        updatedAt: Date;
                        username: string | null;
                        displayUsername: string | null;
                        bio: string | null;
                        isGuest: boolean;
                        managedBy: string | null;
                        currencyId: string | null;
                        inviteToken: string | null;
                        role: string | null;
                        banned: boolean | null;
                        banReason: string | null;
                        banExpires: Date | null;
                        lastLoginMethod: string | null;
                        profileCompletedAt: Date | null;
                        deletedAt: Date | null;
                        guestState: "managed" | "archived" | "merged" | null;
                        guestClaimedAt: Date | null;
                        guestArchivedAt: Date | null;
                        guestMergedAt: Date | null;
                        mergedIntoUserId: string | null;
                    }, "email" | "image"> & {
                        email: string;
                        image?: string | null;
                    };
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        expiresAt: Date;
                        token: string;
                        ipAddress?: string | null | undefined;
                        userAgent?: string | null | undefined;
                    } | null;
                };
                status: <const Code extends number | keyof import("elysia").StatusMap, const T = Code extends 100 | 410 | 500 | 401 | 101 | 102 | 103 | 200 | 201 | 202 | 203 | 204 | 205 | 206 | 207 | 208 | 300 | 301 | 302 | 303 | 304 | 307 | 308 | 400 | 402 | 403 | 404 | 405 | 406 | 407 | 408 | 409 | 411 | 412 | 413 | 414 | 415 | 416 | 417 | 418 | 420 | 421 | 422 | 423 | 424 | 425 | 426 | 428 | 429 | 431 | 451 | 501 | 502 | 503 | 504 | 505 | 506 | 507 | 508 | 510 | 511 ? {
                    readonly 100: "Continue";
                    readonly 101: "Switching Protocols";
                    readonly 102: "Processing";
                    readonly 103: "Early Hints";
                    readonly 200: "OK";
                    readonly 201: "Created";
                    readonly 202: "Accepted";
                    readonly 203: "Non-Authoritative Information";
                    readonly 204: "No Content";
                    readonly 205: "Reset Content";
                    readonly 206: "Partial Content";
                    readonly 207: "Multi-Status";
                    readonly 208: "Already Reported";
                    readonly 300: "Multiple Choices";
                    readonly 301: "Moved Permanently";
                    readonly 302: "Found";
                    readonly 303: "See Other";
                    readonly 304: "Not Modified";
                    readonly 307: "Temporary Redirect";
                    readonly 308: "Permanent Redirect";
                    readonly 400: "Bad Request";
                    readonly 401: "Unauthorized";
                    readonly 402: "Payment Required";
                    readonly 403: "Forbidden";
                    readonly 404: "Not Found";
                    readonly 405: "Method Not Allowed";
                    readonly 406: "Not Acceptable";
                    readonly 407: "Proxy Authentication Required";
                    readonly 408: "Request Timeout";
                    readonly 409: "Conflict";
                    readonly 410: "Gone";
                    readonly 411: "Length Required";
                    readonly 412: "Precondition Failed";
                    readonly 413: "Payload Too Large";
                    readonly 414: "URI Too Long";
                    readonly 415: "Unsupported Media Type";
                    readonly 416: "Range Not Satisfiable";
                    readonly 417: "Expectation Failed";
                    readonly 418: "I'm a teapot";
                    readonly 420: "Enhance Your Calm";
                    readonly 421: "Misdirected Request";
                    readonly 422: "Unprocessable Content";
                    readonly 423: "Locked";
                    readonly 424: "Failed Dependency";
                    readonly 425: "Too Early";
                    readonly 426: "Upgrade Required";
                    readonly 428: "Precondition Required";
                    readonly 429: "Too Many Requests";
                    readonly 431: "Request Header Fields Too Large";
                    readonly 451: "Unavailable For Legal Reasons";
                    readonly 500: "Internal Server Error";
                    readonly 501: "Not Implemented";
                    readonly 502: "Bad Gateway";
                    readonly 503: "Service Unavailable";
                    readonly 504: "Gateway Timeout";
                    readonly 505: "HTTP Version Not Supported";
                    readonly 506: "Variant Also Negotiates";
                    readonly 507: "Insufficient Storage";
                    readonly 508: "Loop Detected";
                    readonly 510: "Not Extended";
                    readonly 511: "Network Authentication Required";
                }[Code] : Code>(code: Code, response?: T) => import("elysia").ElysiaCustomStatusResponse<Code, T, Code extends "Continue" | "Switching Protocols" | "Processing" | "Early Hints" | "OK" | "Created" | "Accepted" | "Non-Authoritative Information" | "No Content" | "Reset Content" | "Partial Content" | "Multi-Status" | "Already Reported" | "Multiple Choices" | "Moved Permanently" | "Found" | "See Other" | "Not Modified" | "Temporary Redirect" | "Permanent Redirect" | "Bad Request" | "Unauthorized" | "Payment Required" | "Forbidden" | "Not Found" | "Method Not Allowed" | "Not Acceptable" | "Proxy Authentication Required" | "Request Timeout" | "Conflict" | "Gone" | "Length Required" | "Precondition Failed" | "Payload Too Large" | "URI Too Long" | "Unsupported Media Type" | "Range Not Satisfiable" | "Expectation Failed" | "I'm a teapot" | "Enhance Your Calm" | "Misdirected Request" | "Unprocessable Content" | "Locked" | "Failed Dependency" | "Too Early" | "Upgrade Required" | "Precondition Required" | "Too Many Requests" | "Request Header Fields Too Large" | "Unavailable For Legal Reasons" | "Internal Server Error" | "Not Implemented" | "Bad Gateway" | "Service Unavailable" | "Gateway Timeout" | "HTTP Version Not Supported" | "Variant Also Negotiates" | "Insufficient Storage" | "Loop Detected" | "Not Extended" | "Network Authentication Required" ? {
                    readonly Continue: 100;
                    readonly "Switching Protocols": 101;
                    readonly Processing: 102;
                    readonly "Early Hints": 103;
                    readonly OK: 200;
                    readonly Created: 201;
                    readonly Accepted: 202;
                    readonly "Non-Authoritative Information": 203;
                    readonly "No Content": 204;
                    readonly "Reset Content": 205;
                    readonly "Partial Content": 206;
                    readonly "Multi-Status": 207;
                    readonly "Already Reported": 208;
                    readonly "Multiple Choices": 300;
                    readonly "Moved Permanently": 301;
                    readonly Found: 302;
                    readonly "See Other": 303;
                    readonly "Not Modified": 304;
                    readonly "Temporary Redirect": 307;
                    readonly "Permanent Redirect": 308;
                    readonly "Bad Request": 400;
                    readonly Unauthorized: 401;
                    readonly "Payment Required": 402;
                    readonly Forbidden: 403;
                    readonly "Not Found": 404;
                    readonly "Method Not Allowed": 405;
                    readonly "Not Acceptable": 406;
                    readonly "Proxy Authentication Required": 407;
                    readonly "Request Timeout": 408;
                    readonly Conflict: 409;
                    readonly Gone: 410;
                    readonly "Length Required": 411;
                    readonly "Precondition Failed": 412;
                    readonly "Payload Too Large": 413;
                    readonly "URI Too Long": 414;
                    readonly "Unsupported Media Type": 415;
                    readonly "Range Not Satisfiable": 416;
                    readonly "Expectation Failed": 417;
                    readonly "I'm a teapot": 418;
                    readonly "Enhance Your Calm": 420;
                    readonly "Misdirected Request": 421;
                    readonly "Unprocessable Content": 422;
                    readonly Locked: 423;
                    readonly "Failed Dependency": 424;
                    readonly "Too Early": 425;
                    readonly "Upgrade Required": 426;
                    readonly "Precondition Required": 428;
                    readonly "Too Many Requests": 429;
                    readonly "Request Header Fields Too Large": 431;
                    readonly "Unavailable For Legal Reasons": 451;
                    readonly "Internal Server Error": 500;
                    readonly "Not Implemented": 501;
                    readonly "Bad Gateway": 502;
                    readonly "Service Unavailable": 503;
                    readonly "Gateway Timeout": 504;
                    readonly "HTTP Version Not Supported": 505;
                    readonly "Variant Also Negotiates": 506;
                    readonly "Insufficient Storage": 507;
                    readonly "Loop Detected": 508;
                    readonly "Not Extended": 510;
                    readonly "Network Authentication Required": 511;
                }[Code] : Code>;
            }) => Promise<import("elysia").ElysiaCustomStatusResponse<401, any, 401> | import("elysia").ElysiaCustomStatusResponse<403, {
                code: string;
                message: string;
            }, 403> | {
                sessionUser: Omit<{
                    id: string;
                    name: string;
                    email: string | null;
                    emailVerified: boolean;
                    image: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                    username: string | null;
                    displayUsername: string | null;
                    bio: string | null;
                    isGuest: boolean;
                    managedBy: string | null;
                    currencyId: string | null;
                    inviteToken: string | null;
                    role: string | null;
                    banned: boolean | null;
                    banReason: string | null;
                    banExpires: Date | null;
                    lastLoginMethod: string | null;
                    profileCompletedAt: Date | null;
                    deletedAt: Date | null;
                    guestState: "managed" | "archived" | "merged" | null;
                    guestClaimedAt: Date | null;
                    guestArchivedAt: Date | null;
                    guestMergedAt: Date | null;
                    mergedIntoUserId: string | null;
                }, "email" | "image"> & {
                    email: string;
                    image?: string | null;
                };
                session: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    expiresAt: Date;
                    token: string;
                    ipAddress?: string | null | undefined;
                    userAgent?: string | null | undefined;
                } | null;
            }>;
        };
        readonly "no-auth": {
            readonly resolve: ({ status, request: { headers } }: {
                body: unknown;
                query: Record<string, string>;
                params: {};
                headers: Record<string, string | undefined>;
                cookie: Record<string, import("elysia").Cookie<unknown>>;
                server: import("elysia/universal/server").Server | null;
                redirect: import("elysia").redirect;
                set: {
                    headers: import("elysia").HTTPHeaders;
                    status?: number | keyof import("elysia").StatusMap;
                    redirect?: string;
                    cookie?: Record<string, import("elysia/cookies").ElysiaCookie>;
                };
                path: string;
                route: string;
                request: Request;
                store: {
                    sessionUser: Omit<{
                        id: string;
                        name: string;
                        email: string | null;
                        emailVerified: boolean;
                        image: string | null;
                        createdAt: Date;
                        updatedAt: Date;
                        username: string | null;
                        displayUsername: string | null;
                        bio: string | null;
                        isGuest: boolean;
                        managedBy: string | null;
                        currencyId: string | null;
                        inviteToken: string | null;
                        role: string | null;
                        banned: boolean | null;
                        banReason: string | null;
                        banExpires: Date | null;
                        lastLoginMethod: string | null;
                        profileCompletedAt: Date | null;
                        deletedAt: Date | null;
                        guestState: "managed" | "archived" | "merged" | null;
                        guestClaimedAt: Date | null;
                        guestArchivedAt: Date | null;
                        guestMergedAt: Date | null;
                        mergedIntoUserId: string | null;
                    }, "email" | "image"> & {
                        email: string;
                        image?: string | null;
                    };
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        expiresAt: Date;
                        token: string;
                        ipAddress?: string | null | undefined;
                        userAgent?: string | null | undefined;
                    } | null;
                };
                status: <const Code extends number | keyof import("elysia").StatusMap, const T = Code extends 100 | 410 | 500 | 401 | 101 | 102 | 103 | 200 | 201 | 202 | 203 | 204 | 205 | 206 | 207 | 208 | 300 | 301 | 302 | 303 | 304 | 307 | 308 | 400 | 402 | 403 | 404 | 405 | 406 | 407 | 408 | 409 | 411 | 412 | 413 | 414 | 415 | 416 | 417 | 418 | 420 | 421 | 422 | 423 | 424 | 425 | 426 | 428 | 429 | 431 | 451 | 501 | 502 | 503 | 504 | 505 | 506 | 507 | 508 | 510 | 511 ? {
                    readonly 100: "Continue";
                    readonly 101: "Switching Protocols";
                    readonly 102: "Processing";
                    readonly 103: "Early Hints";
                    readonly 200: "OK";
                    readonly 201: "Created";
                    readonly 202: "Accepted";
                    readonly 203: "Non-Authoritative Information";
                    readonly 204: "No Content";
                    readonly 205: "Reset Content";
                    readonly 206: "Partial Content";
                    readonly 207: "Multi-Status";
                    readonly 208: "Already Reported";
                    readonly 300: "Multiple Choices";
                    readonly 301: "Moved Permanently";
                    readonly 302: "Found";
                    readonly 303: "See Other";
                    readonly 304: "Not Modified";
                    readonly 307: "Temporary Redirect";
                    readonly 308: "Permanent Redirect";
                    readonly 400: "Bad Request";
                    readonly 401: "Unauthorized";
                    readonly 402: "Payment Required";
                    readonly 403: "Forbidden";
                    readonly 404: "Not Found";
                    readonly 405: "Method Not Allowed";
                    readonly 406: "Not Acceptable";
                    readonly 407: "Proxy Authentication Required";
                    readonly 408: "Request Timeout";
                    readonly 409: "Conflict";
                    readonly 410: "Gone";
                    readonly 411: "Length Required";
                    readonly 412: "Precondition Failed";
                    readonly 413: "Payload Too Large";
                    readonly 414: "URI Too Long";
                    readonly 415: "Unsupported Media Type";
                    readonly 416: "Range Not Satisfiable";
                    readonly 417: "Expectation Failed";
                    readonly 418: "I'm a teapot";
                    readonly 420: "Enhance Your Calm";
                    readonly 421: "Misdirected Request";
                    readonly 422: "Unprocessable Content";
                    readonly 423: "Locked";
                    readonly 424: "Failed Dependency";
                    readonly 425: "Too Early";
                    readonly 426: "Upgrade Required";
                    readonly 428: "Precondition Required";
                    readonly 429: "Too Many Requests";
                    readonly 431: "Request Header Fields Too Large";
                    readonly 451: "Unavailable For Legal Reasons";
                    readonly 500: "Internal Server Error";
                    readonly 501: "Not Implemented";
                    readonly 502: "Bad Gateway";
                    readonly 503: "Service Unavailable";
                    readonly 504: "Gateway Timeout";
                    readonly 505: "HTTP Version Not Supported";
                    readonly 506: "Variant Also Negotiates";
                    readonly 507: "Insufficient Storage";
                    readonly 508: "Loop Detected";
                    readonly 510: "Not Extended";
                    readonly 511: "Network Authentication Required";
                }[Code] : Code>(code: Code, response?: T) => import("elysia").ElysiaCustomStatusResponse<Code, T, Code extends "Continue" | "Switching Protocols" | "Processing" | "Early Hints" | "OK" | "Created" | "Accepted" | "Non-Authoritative Information" | "No Content" | "Reset Content" | "Partial Content" | "Multi-Status" | "Already Reported" | "Multiple Choices" | "Moved Permanently" | "Found" | "See Other" | "Not Modified" | "Temporary Redirect" | "Permanent Redirect" | "Bad Request" | "Unauthorized" | "Payment Required" | "Forbidden" | "Not Found" | "Method Not Allowed" | "Not Acceptable" | "Proxy Authentication Required" | "Request Timeout" | "Conflict" | "Gone" | "Length Required" | "Precondition Failed" | "Payload Too Large" | "URI Too Long" | "Unsupported Media Type" | "Range Not Satisfiable" | "Expectation Failed" | "I'm a teapot" | "Enhance Your Calm" | "Misdirected Request" | "Unprocessable Content" | "Locked" | "Failed Dependency" | "Too Early" | "Upgrade Required" | "Precondition Required" | "Too Many Requests" | "Request Header Fields Too Large" | "Unavailable For Legal Reasons" | "Internal Server Error" | "Not Implemented" | "Bad Gateway" | "Service Unavailable" | "Gateway Timeout" | "HTTP Version Not Supported" | "Variant Also Negotiates" | "Insufficient Storage" | "Loop Detected" | "Not Extended" | "Network Authentication Required" ? {
                    readonly Continue: 100;
                    readonly "Switching Protocols": 101;
                    readonly Processing: 102;
                    readonly "Early Hints": 103;
                    readonly OK: 200;
                    readonly Created: 201;
                    readonly Accepted: 202;
                    readonly "Non-Authoritative Information": 203;
                    readonly "No Content": 204;
                    readonly "Reset Content": 205;
                    readonly "Partial Content": 206;
                    readonly "Multi-Status": 207;
                    readonly "Already Reported": 208;
                    readonly "Multiple Choices": 300;
                    readonly "Moved Permanently": 301;
                    readonly Found: 302;
                    readonly "See Other": 303;
                    readonly "Not Modified": 304;
                    readonly "Temporary Redirect": 307;
                    readonly "Permanent Redirect": 308;
                    readonly "Bad Request": 400;
                    readonly Unauthorized: 401;
                    readonly "Payment Required": 402;
                    readonly Forbidden: 403;
                    readonly "Not Found": 404;
                    readonly "Method Not Allowed": 405;
                    readonly "Not Acceptable": 406;
                    readonly "Proxy Authentication Required": 407;
                    readonly "Request Timeout": 408;
                    readonly Conflict: 409;
                    readonly Gone: 410;
                    readonly "Length Required": 411;
                    readonly "Precondition Failed": 412;
                    readonly "Payload Too Large": 413;
                    readonly "URI Too Long": 414;
                    readonly "Unsupported Media Type": 415;
                    readonly "Range Not Satisfiable": 416;
                    readonly "Expectation Failed": 417;
                    readonly "I'm a teapot": 418;
                    readonly "Enhance Your Calm": 420;
                    readonly "Misdirected Request": 421;
                    readonly "Unprocessable Content": 422;
                    readonly Locked: 423;
                    readonly "Failed Dependency": 424;
                    readonly "Too Early": 425;
                    readonly "Upgrade Required": 426;
                    readonly "Precondition Required": 428;
                    readonly "Too Many Requests": 429;
                    readonly "Request Header Fields Too Large": 431;
                    readonly "Unavailable For Legal Reasons": 451;
                    readonly "Internal Server Error": 500;
                    readonly "Not Implemented": 501;
                    readonly "Bad Gateway": 502;
                    readonly "Service Unavailable": 503;
                    readonly "Gateway Timeout": 504;
                    readonly "HTTP Version Not Supported": 505;
                    readonly "Variant Also Negotiates": 506;
                    readonly "Insufficient Storage": 507;
                    readonly "Loop Detected": 508;
                    readonly "Not Extended": 510;
                    readonly "Network Authentication Required": 511;
                }[Code] : Code>;
            }) => Promise<import("elysia").ElysiaCustomStatusResponse<403, any, 403> | undefined>;
        };
    } & {
        readonly owner: {
            readonly resolve: ({ status, store: { sessionUser }, params }: {
                body: unknown;
                query: Record<string, string>;
                params: {};
                headers: Record<string, string | undefined>;
                cookie: Record<string, import("elysia").Cookie<unknown>>;
                server: import("elysia/universal/server").Server | null;
                redirect: import("elysia").redirect;
                set: {
                    headers: import("elysia").HTTPHeaders;
                    status?: number | keyof import("elysia").StatusMap;
                    redirect?: string;
                    cookie?: Record<string, import("elysia/cookies").ElysiaCookie>;
                };
                path: string;
                route: string;
                request: Request;
                store: {
                    sessionUser: Omit<{
                        id: string;
                        name: string;
                        email: string | null;
                        emailVerified: boolean;
                        image: string | null;
                        createdAt: Date;
                        updatedAt: Date;
                        username: string | null;
                        displayUsername: string | null;
                        bio: string | null;
                        isGuest: boolean;
                        managedBy: string | null;
                        currencyId: string | null;
                        inviteToken: string | null;
                        role: string | null;
                        banned: boolean | null;
                        banReason: string | null;
                        banExpires: Date | null;
                        lastLoginMethod: string | null;
                        profileCompletedAt: Date | null;
                        deletedAt: Date | null;
                        guestState: "managed" | "archived" | "merged" | null;
                        guestClaimedAt: Date | null;
                        guestArchivedAt: Date | null;
                        guestMergedAt: Date | null;
                        mergedIntoUserId: string | null;
                    }, "email" | "image"> & {
                        email: string;
                        image?: string | null;
                    };
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        expiresAt: Date;
                        token: string;
                        ipAddress?: string | null | undefined;
                        userAgent?: string | null | undefined;
                    } | null;
                };
                status: <const Code extends number | keyof import("elysia").StatusMap, const T = Code extends 100 | 410 | 500 | 401 | 101 | 102 | 103 | 200 | 201 | 202 | 203 | 204 | 205 | 206 | 207 | 208 | 300 | 301 | 302 | 303 | 304 | 307 | 308 | 400 | 402 | 403 | 404 | 405 | 406 | 407 | 408 | 409 | 411 | 412 | 413 | 414 | 415 | 416 | 417 | 418 | 420 | 421 | 422 | 423 | 424 | 425 | 426 | 428 | 429 | 431 | 451 | 501 | 502 | 503 | 504 | 505 | 506 | 507 | 508 | 510 | 511 ? {
                    readonly 100: "Continue";
                    readonly 101: "Switching Protocols";
                    readonly 102: "Processing";
                    readonly 103: "Early Hints";
                    readonly 200: "OK";
                    readonly 201: "Created";
                    readonly 202: "Accepted";
                    readonly 203: "Non-Authoritative Information";
                    readonly 204: "No Content";
                    readonly 205: "Reset Content";
                    readonly 206: "Partial Content";
                    readonly 207: "Multi-Status";
                    readonly 208: "Already Reported";
                    readonly 300: "Multiple Choices";
                    readonly 301: "Moved Permanently";
                    readonly 302: "Found";
                    readonly 303: "See Other";
                    readonly 304: "Not Modified";
                    readonly 307: "Temporary Redirect";
                    readonly 308: "Permanent Redirect";
                    readonly 400: "Bad Request";
                    readonly 401: "Unauthorized";
                    readonly 402: "Payment Required";
                    readonly 403: "Forbidden";
                    readonly 404: "Not Found";
                    readonly 405: "Method Not Allowed";
                    readonly 406: "Not Acceptable";
                    readonly 407: "Proxy Authentication Required";
                    readonly 408: "Request Timeout";
                    readonly 409: "Conflict";
                    readonly 410: "Gone";
                    readonly 411: "Length Required";
                    readonly 412: "Precondition Failed";
                    readonly 413: "Payload Too Large";
                    readonly 414: "URI Too Long";
                    readonly 415: "Unsupported Media Type";
                    readonly 416: "Range Not Satisfiable";
                    readonly 417: "Expectation Failed";
                    readonly 418: "I'm a teapot";
                    readonly 420: "Enhance Your Calm";
                    readonly 421: "Misdirected Request";
                    readonly 422: "Unprocessable Content";
                    readonly 423: "Locked";
                    readonly 424: "Failed Dependency";
                    readonly 425: "Too Early";
                    readonly 426: "Upgrade Required";
                    readonly 428: "Precondition Required";
                    readonly 429: "Too Many Requests";
                    readonly 431: "Request Header Fields Too Large";
                    readonly 451: "Unavailable For Legal Reasons";
                    readonly 500: "Internal Server Error";
                    readonly 501: "Not Implemented";
                    readonly 502: "Bad Gateway";
                    readonly 503: "Service Unavailable";
                    readonly 504: "Gateway Timeout";
                    readonly 505: "HTTP Version Not Supported";
                    readonly 506: "Variant Also Negotiates";
                    readonly 507: "Insufficient Storage";
                    readonly 508: "Loop Detected";
                    readonly 510: "Not Extended";
                    readonly 511: "Network Authentication Required";
                }[Code] : Code>(code: Code, response?: T) => import("elysia").ElysiaCustomStatusResponse<Code, T, Code extends "Continue" | "Switching Protocols" | "Processing" | "Early Hints" | "OK" | "Created" | "Accepted" | "Non-Authoritative Information" | "No Content" | "Reset Content" | "Partial Content" | "Multi-Status" | "Already Reported" | "Multiple Choices" | "Moved Permanently" | "Found" | "See Other" | "Not Modified" | "Temporary Redirect" | "Permanent Redirect" | "Bad Request" | "Unauthorized" | "Payment Required" | "Forbidden" | "Not Found" | "Method Not Allowed" | "Not Acceptable" | "Proxy Authentication Required" | "Request Timeout" | "Conflict" | "Gone" | "Length Required" | "Precondition Failed" | "Payload Too Large" | "URI Too Long" | "Unsupported Media Type" | "Range Not Satisfiable" | "Expectation Failed" | "I'm a teapot" | "Enhance Your Calm" | "Misdirected Request" | "Unprocessable Content" | "Locked" | "Failed Dependency" | "Too Early" | "Upgrade Required" | "Precondition Required" | "Too Many Requests" | "Request Header Fields Too Large" | "Unavailable For Legal Reasons" | "Internal Server Error" | "Not Implemented" | "Bad Gateway" | "Service Unavailable" | "Gateway Timeout" | "HTTP Version Not Supported" | "Variant Also Negotiates" | "Insufficient Storage" | "Loop Detected" | "Not Extended" | "Network Authentication Required" ? {
                    readonly Continue: 100;
                    readonly "Switching Protocols": 101;
                    readonly Processing: 102;
                    readonly "Early Hints": 103;
                    readonly OK: 200;
                    readonly Created: 201;
                    readonly Accepted: 202;
                    readonly "Non-Authoritative Information": 203;
                    readonly "No Content": 204;
                    readonly "Reset Content": 205;
                    readonly "Partial Content": 206;
                    readonly "Multi-Status": 207;
                    readonly "Already Reported": 208;
                    readonly "Multiple Choices": 300;
                    readonly "Moved Permanently": 301;
                    readonly Found: 302;
                    readonly "See Other": 303;
                    readonly "Not Modified": 304;
                    readonly "Temporary Redirect": 307;
                    readonly "Permanent Redirect": 308;
                    readonly "Bad Request": 400;
                    readonly Unauthorized: 401;
                    readonly "Payment Required": 402;
                    readonly Forbidden: 403;
                    readonly "Not Found": 404;
                    readonly "Method Not Allowed": 405;
                    readonly "Not Acceptable": 406;
                    readonly "Proxy Authentication Required": 407;
                    readonly "Request Timeout": 408;
                    readonly Conflict: 409;
                    readonly Gone: 410;
                    readonly "Length Required": 411;
                    readonly "Precondition Failed": 412;
                    readonly "Payload Too Large": 413;
                    readonly "URI Too Long": 414;
                    readonly "Unsupported Media Type": 415;
                    readonly "Range Not Satisfiable": 416;
                    readonly "Expectation Failed": 417;
                    readonly "I'm a teapot": 418;
                    readonly "Enhance Your Calm": 420;
                    readonly "Misdirected Request": 421;
                    readonly "Unprocessable Content": 422;
                    readonly Locked: 423;
                    readonly "Failed Dependency": 424;
                    readonly "Too Early": 425;
                    readonly "Upgrade Required": 426;
                    readonly "Precondition Required": 428;
                    readonly "Too Many Requests": 429;
                    readonly "Request Header Fields Too Large": 431;
                    readonly "Unavailable For Legal Reasons": 451;
                    readonly "Internal Server Error": 500;
                    readonly "Not Implemented": 501;
                    readonly "Bad Gateway": 502;
                    readonly "Service Unavailable": 503;
                    readonly "Gateway Timeout": 504;
                    readonly "HTTP Version Not Supported": 505;
                    readonly "Variant Also Negotiates": 506;
                    readonly "Insufficient Storage": 507;
                    readonly "Loop Detected": 508;
                    readonly "Not Extended": 510;
                    readonly "Network Authentication Required": 511;
                }[Code] : Code>;
            }) => Promise<import("elysia").ElysiaCustomStatusResponse<403, any, 403> | import("elysia").ElysiaCustomStatusResponse<404, any, 404> | undefined>;
        };
        readonly participant: {
            readonly resolve: ({ status, store: { sessionUser }, params }: {
                body: unknown;
                query: Record<string, string>;
                params: {};
                headers: Record<string, string | undefined>;
                cookie: Record<string, import("elysia").Cookie<unknown>>;
                server: import("elysia/universal/server").Server | null;
                redirect: import("elysia").redirect;
                set: {
                    headers: import("elysia").HTTPHeaders;
                    status?: number | keyof import("elysia").StatusMap;
                    redirect?: string;
                    cookie?: Record<string, import("elysia/cookies").ElysiaCookie>;
                };
                path: string;
                route: string;
                request: Request;
                store: {
                    sessionUser: Omit<{
                        id: string;
                        name: string;
                        email: string | null;
                        emailVerified: boolean;
                        image: string | null;
                        createdAt: Date;
                        updatedAt: Date;
                        username: string | null;
                        displayUsername: string | null;
                        bio: string | null;
                        isGuest: boolean;
                        managedBy: string | null;
                        currencyId: string | null;
                        inviteToken: string | null;
                        role: string | null;
                        banned: boolean | null;
                        banReason: string | null;
                        banExpires: Date | null;
                        lastLoginMethod: string | null;
                        profileCompletedAt: Date | null;
                        deletedAt: Date | null;
                        guestState: "managed" | "archived" | "merged" | null;
                        guestClaimedAt: Date | null;
                        guestArchivedAt: Date | null;
                        guestMergedAt: Date | null;
                        mergedIntoUserId: string | null;
                    }, "email" | "image"> & {
                        email: string;
                        image?: string | null;
                    };
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        expiresAt: Date;
                        token: string;
                        ipAddress?: string | null | undefined;
                        userAgent?: string | null | undefined;
                    } | null;
                };
                status: <const Code extends number | keyof import("elysia").StatusMap, const T = Code extends 100 | 410 | 500 | 401 | 101 | 102 | 103 | 200 | 201 | 202 | 203 | 204 | 205 | 206 | 207 | 208 | 300 | 301 | 302 | 303 | 304 | 307 | 308 | 400 | 402 | 403 | 404 | 405 | 406 | 407 | 408 | 409 | 411 | 412 | 413 | 414 | 415 | 416 | 417 | 418 | 420 | 421 | 422 | 423 | 424 | 425 | 426 | 428 | 429 | 431 | 451 | 501 | 502 | 503 | 504 | 505 | 506 | 507 | 508 | 510 | 511 ? {
                    readonly 100: "Continue";
                    readonly 101: "Switching Protocols";
                    readonly 102: "Processing";
                    readonly 103: "Early Hints";
                    readonly 200: "OK";
                    readonly 201: "Created";
                    readonly 202: "Accepted";
                    readonly 203: "Non-Authoritative Information";
                    readonly 204: "No Content";
                    readonly 205: "Reset Content";
                    readonly 206: "Partial Content";
                    readonly 207: "Multi-Status";
                    readonly 208: "Already Reported";
                    readonly 300: "Multiple Choices";
                    readonly 301: "Moved Permanently";
                    readonly 302: "Found";
                    readonly 303: "See Other";
                    readonly 304: "Not Modified";
                    readonly 307: "Temporary Redirect";
                    readonly 308: "Permanent Redirect";
                    readonly 400: "Bad Request";
                    readonly 401: "Unauthorized";
                    readonly 402: "Payment Required";
                    readonly 403: "Forbidden";
                    readonly 404: "Not Found";
                    readonly 405: "Method Not Allowed";
                    readonly 406: "Not Acceptable";
                    readonly 407: "Proxy Authentication Required";
                    readonly 408: "Request Timeout";
                    readonly 409: "Conflict";
                    readonly 410: "Gone";
                    readonly 411: "Length Required";
                    readonly 412: "Precondition Failed";
                    readonly 413: "Payload Too Large";
                    readonly 414: "URI Too Long";
                    readonly 415: "Unsupported Media Type";
                    readonly 416: "Range Not Satisfiable";
                    readonly 417: "Expectation Failed";
                    readonly 418: "I'm a teapot";
                    readonly 420: "Enhance Your Calm";
                    readonly 421: "Misdirected Request";
                    readonly 422: "Unprocessable Content";
                    readonly 423: "Locked";
                    readonly 424: "Failed Dependency";
                    readonly 425: "Too Early";
                    readonly 426: "Upgrade Required";
                    readonly 428: "Precondition Required";
                    readonly 429: "Too Many Requests";
                    readonly 431: "Request Header Fields Too Large";
                    readonly 451: "Unavailable For Legal Reasons";
                    readonly 500: "Internal Server Error";
                    readonly 501: "Not Implemented";
                    readonly 502: "Bad Gateway";
                    readonly 503: "Service Unavailable";
                    readonly 504: "Gateway Timeout";
                    readonly 505: "HTTP Version Not Supported";
                    readonly 506: "Variant Also Negotiates";
                    readonly 507: "Insufficient Storage";
                    readonly 508: "Loop Detected";
                    readonly 510: "Not Extended";
                    readonly 511: "Network Authentication Required";
                }[Code] : Code>(code: Code, response?: T) => import("elysia").ElysiaCustomStatusResponse<Code, T, Code extends "Continue" | "Switching Protocols" | "Processing" | "Early Hints" | "OK" | "Created" | "Accepted" | "Non-Authoritative Information" | "No Content" | "Reset Content" | "Partial Content" | "Multi-Status" | "Already Reported" | "Multiple Choices" | "Moved Permanently" | "Found" | "See Other" | "Not Modified" | "Temporary Redirect" | "Permanent Redirect" | "Bad Request" | "Unauthorized" | "Payment Required" | "Forbidden" | "Not Found" | "Method Not Allowed" | "Not Acceptable" | "Proxy Authentication Required" | "Request Timeout" | "Conflict" | "Gone" | "Length Required" | "Precondition Failed" | "Payload Too Large" | "URI Too Long" | "Unsupported Media Type" | "Range Not Satisfiable" | "Expectation Failed" | "I'm a teapot" | "Enhance Your Calm" | "Misdirected Request" | "Unprocessable Content" | "Locked" | "Failed Dependency" | "Too Early" | "Upgrade Required" | "Precondition Required" | "Too Many Requests" | "Request Header Fields Too Large" | "Unavailable For Legal Reasons" | "Internal Server Error" | "Not Implemented" | "Bad Gateway" | "Service Unavailable" | "Gateway Timeout" | "HTTP Version Not Supported" | "Variant Also Negotiates" | "Insufficient Storage" | "Loop Detected" | "Not Extended" | "Network Authentication Required" ? {
                    readonly Continue: 100;
                    readonly "Switching Protocols": 101;
                    readonly Processing: 102;
                    readonly "Early Hints": 103;
                    readonly OK: 200;
                    readonly Created: 201;
                    readonly Accepted: 202;
                    readonly "Non-Authoritative Information": 203;
                    readonly "No Content": 204;
                    readonly "Reset Content": 205;
                    readonly "Partial Content": 206;
                    readonly "Multi-Status": 207;
                    readonly "Already Reported": 208;
                    readonly "Multiple Choices": 300;
                    readonly "Moved Permanently": 301;
                    readonly Found: 302;
                    readonly "See Other": 303;
                    readonly "Not Modified": 304;
                    readonly "Temporary Redirect": 307;
                    readonly "Permanent Redirect": 308;
                    readonly "Bad Request": 400;
                    readonly Unauthorized: 401;
                    readonly "Payment Required": 402;
                    readonly Forbidden: 403;
                    readonly "Not Found": 404;
                    readonly "Method Not Allowed": 405;
                    readonly "Not Acceptable": 406;
                    readonly "Proxy Authentication Required": 407;
                    readonly "Request Timeout": 408;
                    readonly Conflict: 409;
                    readonly Gone: 410;
                    readonly "Length Required": 411;
                    readonly "Precondition Failed": 412;
                    readonly "Payload Too Large": 413;
                    readonly "URI Too Long": 414;
                    readonly "Unsupported Media Type": 415;
                    readonly "Range Not Satisfiable": 416;
                    readonly "Expectation Failed": 417;
                    readonly "I'm a teapot": 418;
                    readonly "Enhance Your Calm": 420;
                    readonly "Misdirected Request": 421;
                    readonly "Unprocessable Content": 422;
                    readonly Locked: 423;
                    readonly "Failed Dependency": 424;
                    readonly "Too Early": 425;
                    readonly "Upgrade Required": 426;
                    readonly "Precondition Required": 428;
                    readonly "Too Many Requests": 429;
                    readonly "Request Header Fields Too Large": 431;
                    readonly "Unavailable For Legal Reasons": 451;
                    readonly "Internal Server Error": 500;
                    readonly "Not Implemented": 501;
                    readonly "Bad Gateway": 502;
                    readonly "Service Unavailable": 503;
                    readonly "Gateway Timeout": 504;
                    readonly "HTTP Version Not Supported": 505;
                    readonly "Variant Also Negotiates": 506;
                    readonly "Insufficient Storage": 507;
                    readonly "Loop Detected": 508;
                    readonly "Not Extended": 510;
                    readonly "Network Authentication Required": 511;
                }[Code] : Code>;
            }) => Promise<import("elysia").ElysiaCustomStatusResponse<403, any, 403> | import("elysia").ElysiaCustomStatusResponse<404, any, 404> | undefined>;
        };
    };
    parser: {};
    response: {};
} & {
    schema: {};
    standaloneSchema: {};
    macro: Partial<{
        readonly auth: boolean;
        readonly "no-auth": boolean;
    }> & Partial<{
        readonly owner: boolean;
        readonly participant: boolean;
    }>;
    macroFn: {
        readonly auth: {
            readonly resolve: ({ request, status, store }: {
                body: unknown;
                query: Record<string, string>;
                params: {};
                headers: Record<string, string | undefined>;
                cookie: Record<string, import("elysia").Cookie<unknown>>;
                server: import("elysia/universal/server").Server | null;
                redirect: import("elysia").redirect;
                set: {
                    headers: import("elysia").HTTPHeaders;
                    status?: number | keyof import("elysia").StatusMap;
                    redirect?: string;
                    cookie?: Record<string, import("elysia/cookies").ElysiaCookie>;
                };
                path: string;
                route: string;
                request: Request;
                store: {
                    sessionUser: Omit<{
                        id: string;
                        name: string;
                        email: string | null;
                        emailVerified: boolean;
                        image: string | null;
                        createdAt: Date;
                        updatedAt: Date;
                        username: string | null;
                        displayUsername: string | null;
                        bio: string | null;
                        isGuest: boolean;
                        managedBy: string | null;
                        currencyId: string | null;
                        inviteToken: string | null;
                        role: string | null;
                        banned: boolean | null;
                        banReason: string | null;
                        banExpires: Date | null;
                        lastLoginMethod: string | null;
                        profileCompletedAt: Date | null;
                        deletedAt: Date | null;
                        guestState: "managed" | "archived" | "merged" | null;
                        guestClaimedAt: Date | null;
                        guestArchivedAt: Date | null;
                        guestMergedAt: Date | null;
                        mergedIntoUserId: string | null;
                    }, "email" | "image"> & {
                        email: string;
                        image?: string | null;
                    };
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        expiresAt: Date;
                        token: string;
                        ipAddress?: string | null | undefined;
                        userAgent?: string | null | undefined;
                    } | null;
                };
                status: <const Code extends number | keyof import("elysia").StatusMap, const T = Code extends 100 | 410 | 500 | 401 | 101 | 102 | 103 | 200 | 201 | 202 | 203 | 204 | 205 | 206 | 207 | 208 | 300 | 301 | 302 | 303 | 304 | 307 | 308 | 400 | 402 | 403 | 404 | 405 | 406 | 407 | 408 | 409 | 411 | 412 | 413 | 414 | 415 | 416 | 417 | 418 | 420 | 421 | 422 | 423 | 424 | 425 | 426 | 428 | 429 | 431 | 451 | 501 | 502 | 503 | 504 | 505 | 506 | 507 | 508 | 510 | 511 ? {
                    readonly 100: "Continue";
                    readonly 101: "Switching Protocols";
                    readonly 102: "Processing";
                    readonly 103: "Early Hints";
                    readonly 200: "OK";
                    readonly 201: "Created";
                    readonly 202: "Accepted";
                    readonly 203: "Non-Authoritative Information";
                    readonly 204: "No Content";
                    readonly 205: "Reset Content";
                    readonly 206: "Partial Content";
                    readonly 207: "Multi-Status";
                    readonly 208: "Already Reported";
                    readonly 300: "Multiple Choices";
                    readonly 301: "Moved Permanently";
                    readonly 302: "Found";
                    readonly 303: "See Other";
                    readonly 304: "Not Modified";
                    readonly 307: "Temporary Redirect";
                    readonly 308: "Permanent Redirect";
                    readonly 400: "Bad Request";
                    readonly 401: "Unauthorized";
                    readonly 402: "Payment Required";
                    readonly 403: "Forbidden";
                    readonly 404: "Not Found";
                    readonly 405: "Method Not Allowed";
                    readonly 406: "Not Acceptable";
                    readonly 407: "Proxy Authentication Required";
                    readonly 408: "Request Timeout";
                    readonly 409: "Conflict";
                    readonly 410: "Gone";
                    readonly 411: "Length Required";
                    readonly 412: "Precondition Failed";
                    readonly 413: "Payload Too Large";
                    readonly 414: "URI Too Long";
                    readonly 415: "Unsupported Media Type";
                    readonly 416: "Range Not Satisfiable";
                    readonly 417: "Expectation Failed";
                    readonly 418: "I'm a teapot";
                    readonly 420: "Enhance Your Calm";
                    readonly 421: "Misdirected Request";
                    readonly 422: "Unprocessable Content";
                    readonly 423: "Locked";
                    readonly 424: "Failed Dependency";
                    readonly 425: "Too Early";
                    readonly 426: "Upgrade Required";
                    readonly 428: "Precondition Required";
                    readonly 429: "Too Many Requests";
                    readonly 431: "Request Header Fields Too Large";
                    readonly 451: "Unavailable For Legal Reasons";
                    readonly 500: "Internal Server Error";
                    readonly 501: "Not Implemented";
                    readonly 502: "Bad Gateway";
                    readonly 503: "Service Unavailable";
                    readonly 504: "Gateway Timeout";
                    readonly 505: "HTTP Version Not Supported";
                    readonly 506: "Variant Also Negotiates";
                    readonly 507: "Insufficient Storage";
                    readonly 508: "Loop Detected";
                    readonly 510: "Not Extended";
                    readonly 511: "Network Authentication Required";
                }[Code] : Code>(code: Code, response?: T) => import("elysia").ElysiaCustomStatusResponse<Code, T, Code extends "Continue" | "Switching Protocols" | "Processing" | "Early Hints" | "OK" | "Created" | "Accepted" | "Non-Authoritative Information" | "No Content" | "Reset Content" | "Partial Content" | "Multi-Status" | "Already Reported" | "Multiple Choices" | "Moved Permanently" | "Found" | "See Other" | "Not Modified" | "Temporary Redirect" | "Permanent Redirect" | "Bad Request" | "Unauthorized" | "Payment Required" | "Forbidden" | "Not Found" | "Method Not Allowed" | "Not Acceptable" | "Proxy Authentication Required" | "Request Timeout" | "Conflict" | "Gone" | "Length Required" | "Precondition Failed" | "Payload Too Large" | "URI Too Long" | "Unsupported Media Type" | "Range Not Satisfiable" | "Expectation Failed" | "I'm a teapot" | "Enhance Your Calm" | "Misdirected Request" | "Unprocessable Content" | "Locked" | "Failed Dependency" | "Too Early" | "Upgrade Required" | "Precondition Required" | "Too Many Requests" | "Request Header Fields Too Large" | "Unavailable For Legal Reasons" | "Internal Server Error" | "Not Implemented" | "Bad Gateway" | "Service Unavailable" | "Gateway Timeout" | "HTTP Version Not Supported" | "Variant Also Negotiates" | "Insufficient Storage" | "Loop Detected" | "Not Extended" | "Network Authentication Required" ? {
                    readonly Continue: 100;
                    readonly "Switching Protocols": 101;
                    readonly Processing: 102;
                    readonly "Early Hints": 103;
                    readonly OK: 200;
                    readonly Created: 201;
                    readonly Accepted: 202;
                    readonly "Non-Authoritative Information": 203;
                    readonly "No Content": 204;
                    readonly "Reset Content": 205;
                    readonly "Partial Content": 206;
                    readonly "Multi-Status": 207;
                    readonly "Already Reported": 208;
                    readonly "Multiple Choices": 300;
                    readonly "Moved Permanently": 301;
                    readonly Found: 302;
                    readonly "See Other": 303;
                    readonly "Not Modified": 304;
                    readonly "Temporary Redirect": 307;
                    readonly "Permanent Redirect": 308;
                    readonly "Bad Request": 400;
                    readonly Unauthorized: 401;
                    readonly "Payment Required": 402;
                    readonly Forbidden: 403;
                    readonly "Not Found": 404;
                    readonly "Method Not Allowed": 405;
                    readonly "Not Acceptable": 406;
                    readonly "Proxy Authentication Required": 407;
                    readonly "Request Timeout": 408;
                    readonly Conflict: 409;
                    readonly Gone: 410;
                    readonly "Length Required": 411;
                    readonly "Precondition Failed": 412;
                    readonly "Payload Too Large": 413;
                    readonly "URI Too Long": 414;
                    readonly "Unsupported Media Type": 415;
                    readonly "Range Not Satisfiable": 416;
                    readonly "Expectation Failed": 417;
                    readonly "I'm a teapot": 418;
                    readonly "Enhance Your Calm": 420;
                    readonly "Misdirected Request": 421;
                    readonly "Unprocessable Content": 422;
                    readonly Locked: 423;
                    readonly "Failed Dependency": 424;
                    readonly "Too Early": 425;
                    readonly "Upgrade Required": 426;
                    readonly "Precondition Required": 428;
                    readonly "Too Many Requests": 429;
                    readonly "Request Header Fields Too Large": 431;
                    readonly "Unavailable For Legal Reasons": 451;
                    readonly "Internal Server Error": 500;
                    readonly "Not Implemented": 501;
                    readonly "Bad Gateway": 502;
                    readonly "Service Unavailable": 503;
                    readonly "Gateway Timeout": 504;
                    readonly "HTTP Version Not Supported": 505;
                    readonly "Variant Also Negotiates": 506;
                    readonly "Insufficient Storage": 507;
                    readonly "Loop Detected": 508;
                    readonly "Not Extended": 510;
                    readonly "Network Authentication Required": 511;
                }[Code] : Code>;
            }) => Promise<import("elysia").ElysiaCustomStatusResponse<401, any, 401> | import("elysia").ElysiaCustomStatusResponse<403, {
                code: string;
                message: string;
            }, 403> | {
                sessionUser: Omit<{
                    id: string;
                    name: string;
                    email: string | null;
                    emailVerified: boolean;
                    image: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                    username: string | null;
                    displayUsername: string | null;
                    bio: string | null;
                    isGuest: boolean;
                    managedBy: string | null;
                    currencyId: string | null;
                    inviteToken: string | null;
                    role: string | null;
                    banned: boolean | null;
                    banReason: string | null;
                    banExpires: Date | null;
                    lastLoginMethod: string | null;
                    profileCompletedAt: Date | null;
                    deletedAt: Date | null;
                    guestState: "managed" | "archived" | "merged" | null;
                    guestClaimedAt: Date | null;
                    guestArchivedAt: Date | null;
                    guestMergedAt: Date | null;
                    mergedIntoUserId: string | null;
                }, "email" | "image"> & {
                    email: string;
                    image?: string | null;
                };
                session: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    expiresAt: Date;
                    token: string;
                    ipAddress?: string | null | undefined;
                    userAgent?: string | null | undefined;
                } | null;
            }>;
        };
        readonly "no-auth": {
            readonly resolve: ({ status, request: { headers } }: {
                body: unknown;
                query: Record<string, string>;
                params: {};
                headers: Record<string, string | undefined>;
                cookie: Record<string, import("elysia").Cookie<unknown>>;
                server: import("elysia/universal/server").Server | null;
                redirect: import("elysia").redirect;
                set: {
                    headers: import("elysia").HTTPHeaders;
                    status?: number | keyof import("elysia").StatusMap;
                    redirect?: string;
                    cookie?: Record<string, import("elysia/cookies").ElysiaCookie>;
                };
                path: string;
                route: string;
                request: Request;
                store: {
                    sessionUser: Omit<{
                        id: string;
                        name: string;
                        email: string | null;
                        emailVerified: boolean;
                        image: string | null;
                        createdAt: Date;
                        updatedAt: Date;
                        username: string | null;
                        displayUsername: string | null;
                        bio: string | null;
                        isGuest: boolean;
                        managedBy: string | null;
                        currencyId: string | null;
                        inviteToken: string | null;
                        role: string | null;
                        banned: boolean | null;
                        banReason: string | null;
                        banExpires: Date | null;
                        lastLoginMethod: string | null;
                        profileCompletedAt: Date | null;
                        deletedAt: Date | null;
                        guestState: "managed" | "archived" | "merged" | null;
                        guestClaimedAt: Date | null;
                        guestArchivedAt: Date | null;
                        guestMergedAt: Date | null;
                        mergedIntoUserId: string | null;
                    }, "email" | "image"> & {
                        email: string;
                        image?: string | null;
                    };
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        expiresAt: Date;
                        token: string;
                        ipAddress?: string | null | undefined;
                        userAgent?: string | null | undefined;
                    } | null;
                };
                status: <const Code extends number | keyof import("elysia").StatusMap, const T = Code extends 100 | 410 | 500 | 401 | 101 | 102 | 103 | 200 | 201 | 202 | 203 | 204 | 205 | 206 | 207 | 208 | 300 | 301 | 302 | 303 | 304 | 307 | 308 | 400 | 402 | 403 | 404 | 405 | 406 | 407 | 408 | 409 | 411 | 412 | 413 | 414 | 415 | 416 | 417 | 418 | 420 | 421 | 422 | 423 | 424 | 425 | 426 | 428 | 429 | 431 | 451 | 501 | 502 | 503 | 504 | 505 | 506 | 507 | 508 | 510 | 511 ? {
                    readonly 100: "Continue";
                    readonly 101: "Switching Protocols";
                    readonly 102: "Processing";
                    readonly 103: "Early Hints";
                    readonly 200: "OK";
                    readonly 201: "Created";
                    readonly 202: "Accepted";
                    readonly 203: "Non-Authoritative Information";
                    readonly 204: "No Content";
                    readonly 205: "Reset Content";
                    readonly 206: "Partial Content";
                    readonly 207: "Multi-Status";
                    readonly 208: "Already Reported";
                    readonly 300: "Multiple Choices";
                    readonly 301: "Moved Permanently";
                    readonly 302: "Found";
                    readonly 303: "See Other";
                    readonly 304: "Not Modified";
                    readonly 307: "Temporary Redirect";
                    readonly 308: "Permanent Redirect";
                    readonly 400: "Bad Request";
                    readonly 401: "Unauthorized";
                    readonly 402: "Payment Required";
                    readonly 403: "Forbidden";
                    readonly 404: "Not Found";
                    readonly 405: "Method Not Allowed";
                    readonly 406: "Not Acceptable";
                    readonly 407: "Proxy Authentication Required";
                    readonly 408: "Request Timeout";
                    readonly 409: "Conflict";
                    readonly 410: "Gone";
                    readonly 411: "Length Required";
                    readonly 412: "Precondition Failed";
                    readonly 413: "Payload Too Large";
                    readonly 414: "URI Too Long";
                    readonly 415: "Unsupported Media Type";
                    readonly 416: "Range Not Satisfiable";
                    readonly 417: "Expectation Failed";
                    readonly 418: "I'm a teapot";
                    readonly 420: "Enhance Your Calm";
                    readonly 421: "Misdirected Request";
                    readonly 422: "Unprocessable Content";
                    readonly 423: "Locked";
                    readonly 424: "Failed Dependency";
                    readonly 425: "Too Early";
                    readonly 426: "Upgrade Required";
                    readonly 428: "Precondition Required";
                    readonly 429: "Too Many Requests";
                    readonly 431: "Request Header Fields Too Large";
                    readonly 451: "Unavailable For Legal Reasons";
                    readonly 500: "Internal Server Error";
                    readonly 501: "Not Implemented";
                    readonly 502: "Bad Gateway";
                    readonly 503: "Service Unavailable";
                    readonly 504: "Gateway Timeout";
                    readonly 505: "HTTP Version Not Supported";
                    readonly 506: "Variant Also Negotiates";
                    readonly 507: "Insufficient Storage";
                    readonly 508: "Loop Detected";
                    readonly 510: "Not Extended";
                    readonly 511: "Network Authentication Required";
                }[Code] : Code>(code: Code, response?: T) => import("elysia").ElysiaCustomStatusResponse<Code, T, Code extends "Continue" | "Switching Protocols" | "Processing" | "Early Hints" | "OK" | "Created" | "Accepted" | "Non-Authoritative Information" | "No Content" | "Reset Content" | "Partial Content" | "Multi-Status" | "Already Reported" | "Multiple Choices" | "Moved Permanently" | "Found" | "See Other" | "Not Modified" | "Temporary Redirect" | "Permanent Redirect" | "Bad Request" | "Unauthorized" | "Payment Required" | "Forbidden" | "Not Found" | "Method Not Allowed" | "Not Acceptable" | "Proxy Authentication Required" | "Request Timeout" | "Conflict" | "Gone" | "Length Required" | "Precondition Failed" | "Payload Too Large" | "URI Too Long" | "Unsupported Media Type" | "Range Not Satisfiable" | "Expectation Failed" | "I'm a teapot" | "Enhance Your Calm" | "Misdirected Request" | "Unprocessable Content" | "Locked" | "Failed Dependency" | "Too Early" | "Upgrade Required" | "Precondition Required" | "Too Many Requests" | "Request Header Fields Too Large" | "Unavailable For Legal Reasons" | "Internal Server Error" | "Not Implemented" | "Bad Gateway" | "Service Unavailable" | "Gateway Timeout" | "HTTP Version Not Supported" | "Variant Also Negotiates" | "Insufficient Storage" | "Loop Detected" | "Not Extended" | "Network Authentication Required" ? {
                    readonly Continue: 100;
                    readonly "Switching Protocols": 101;
                    readonly Processing: 102;
                    readonly "Early Hints": 103;
                    readonly OK: 200;
                    readonly Created: 201;
                    readonly Accepted: 202;
                    readonly "Non-Authoritative Information": 203;
                    readonly "No Content": 204;
                    readonly "Reset Content": 205;
                    readonly "Partial Content": 206;
                    readonly "Multi-Status": 207;
                    readonly "Already Reported": 208;
                    readonly "Multiple Choices": 300;
                    readonly "Moved Permanently": 301;
                    readonly Found: 302;
                    readonly "See Other": 303;
                    readonly "Not Modified": 304;
                    readonly "Temporary Redirect": 307;
                    readonly "Permanent Redirect": 308;
                    readonly "Bad Request": 400;
                    readonly Unauthorized: 401;
                    readonly "Payment Required": 402;
                    readonly Forbidden: 403;
                    readonly "Not Found": 404;
                    readonly "Method Not Allowed": 405;
                    readonly "Not Acceptable": 406;
                    readonly "Proxy Authentication Required": 407;
                    readonly "Request Timeout": 408;
                    readonly Conflict: 409;
                    readonly Gone: 410;
                    readonly "Length Required": 411;
                    readonly "Precondition Failed": 412;
                    readonly "Payload Too Large": 413;
                    readonly "URI Too Long": 414;
                    readonly "Unsupported Media Type": 415;
                    readonly "Range Not Satisfiable": 416;
                    readonly "Expectation Failed": 417;
                    readonly "I'm a teapot": 418;
                    readonly "Enhance Your Calm": 420;
                    readonly "Misdirected Request": 421;
                    readonly "Unprocessable Content": 422;
                    readonly Locked: 423;
                    readonly "Failed Dependency": 424;
                    readonly "Too Early": 425;
                    readonly "Upgrade Required": 426;
                    readonly "Precondition Required": 428;
                    readonly "Too Many Requests": 429;
                    readonly "Request Header Fields Too Large": 431;
                    readonly "Unavailable For Legal Reasons": 451;
                    readonly "Internal Server Error": 500;
                    readonly "Not Implemented": 501;
                    readonly "Bad Gateway": 502;
                    readonly "Service Unavailable": 503;
                    readonly "Gateway Timeout": 504;
                    readonly "HTTP Version Not Supported": 505;
                    readonly "Variant Also Negotiates": 506;
                    readonly "Insufficient Storage": 507;
                    readonly "Loop Detected": 508;
                    readonly "Not Extended": 510;
                    readonly "Network Authentication Required": 511;
                }[Code] : Code>;
            }) => Promise<import("elysia").ElysiaCustomStatusResponse<403, any, 403> | undefined>;
        };
    } & {
        readonly owner: {
            readonly resolve: ({ status, store: { sessionUser }, params }: {
                body: unknown;
                query: Record<string, string>;
                params: {};
                headers: Record<string, string | undefined>;
                cookie: Record<string, import("elysia").Cookie<unknown>>;
                server: import("elysia/universal/server").Server | null;
                redirect: import("elysia").redirect;
                set: {
                    headers: import("elysia").HTTPHeaders;
                    status?: number | keyof import("elysia").StatusMap;
                    redirect?: string;
                    cookie?: Record<string, import("elysia/cookies").ElysiaCookie>;
                };
                path: string;
                route: string;
                request: Request;
                store: {
                    sessionUser: Omit<{
                        id: string;
                        name: string;
                        email: string | null;
                        emailVerified: boolean;
                        image: string | null;
                        createdAt: Date;
                        updatedAt: Date;
                        username: string | null;
                        displayUsername: string | null;
                        bio: string | null;
                        isGuest: boolean;
                        managedBy: string | null;
                        currencyId: string | null;
                        inviteToken: string | null;
                        role: string | null;
                        banned: boolean | null;
                        banReason: string | null;
                        banExpires: Date | null;
                        lastLoginMethod: string | null;
                        profileCompletedAt: Date | null;
                        deletedAt: Date | null;
                        guestState: "managed" | "archived" | "merged" | null;
                        guestClaimedAt: Date | null;
                        guestArchivedAt: Date | null;
                        guestMergedAt: Date | null;
                        mergedIntoUserId: string | null;
                    }, "email" | "image"> & {
                        email: string;
                        image?: string | null;
                    };
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        expiresAt: Date;
                        token: string;
                        ipAddress?: string | null | undefined;
                        userAgent?: string | null | undefined;
                    } | null;
                };
                status: <const Code extends number | keyof import("elysia").StatusMap, const T = Code extends 100 | 410 | 500 | 401 | 101 | 102 | 103 | 200 | 201 | 202 | 203 | 204 | 205 | 206 | 207 | 208 | 300 | 301 | 302 | 303 | 304 | 307 | 308 | 400 | 402 | 403 | 404 | 405 | 406 | 407 | 408 | 409 | 411 | 412 | 413 | 414 | 415 | 416 | 417 | 418 | 420 | 421 | 422 | 423 | 424 | 425 | 426 | 428 | 429 | 431 | 451 | 501 | 502 | 503 | 504 | 505 | 506 | 507 | 508 | 510 | 511 ? {
                    readonly 100: "Continue";
                    readonly 101: "Switching Protocols";
                    readonly 102: "Processing";
                    readonly 103: "Early Hints";
                    readonly 200: "OK";
                    readonly 201: "Created";
                    readonly 202: "Accepted";
                    readonly 203: "Non-Authoritative Information";
                    readonly 204: "No Content";
                    readonly 205: "Reset Content";
                    readonly 206: "Partial Content";
                    readonly 207: "Multi-Status";
                    readonly 208: "Already Reported";
                    readonly 300: "Multiple Choices";
                    readonly 301: "Moved Permanently";
                    readonly 302: "Found";
                    readonly 303: "See Other";
                    readonly 304: "Not Modified";
                    readonly 307: "Temporary Redirect";
                    readonly 308: "Permanent Redirect";
                    readonly 400: "Bad Request";
                    readonly 401: "Unauthorized";
                    readonly 402: "Payment Required";
                    readonly 403: "Forbidden";
                    readonly 404: "Not Found";
                    readonly 405: "Method Not Allowed";
                    readonly 406: "Not Acceptable";
                    readonly 407: "Proxy Authentication Required";
                    readonly 408: "Request Timeout";
                    readonly 409: "Conflict";
                    readonly 410: "Gone";
                    readonly 411: "Length Required";
                    readonly 412: "Precondition Failed";
                    readonly 413: "Payload Too Large";
                    readonly 414: "URI Too Long";
                    readonly 415: "Unsupported Media Type";
                    readonly 416: "Range Not Satisfiable";
                    readonly 417: "Expectation Failed";
                    readonly 418: "I'm a teapot";
                    readonly 420: "Enhance Your Calm";
                    readonly 421: "Misdirected Request";
                    readonly 422: "Unprocessable Content";
                    readonly 423: "Locked";
                    readonly 424: "Failed Dependency";
                    readonly 425: "Too Early";
                    readonly 426: "Upgrade Required";
                    readonly 428: "Precondition Required";
                    readonly 429: "Too Many Requests";
                    readonly 431: "Request Header Fields Too Large";
                    readonly 451: "Unavailable For Legal Reasons";
                    readonly 500: "Internal Server Error";
                    readonly 501: "Not Implemented";
                    readonly 502: "Bad Gateway";
                    readonly 503: "Service Unavailable";
                    readonly 504: "Gateway Timeout";
                    readonly 505: "HTTP Version Not Supported";
                    readonly 506: "Variant Also Negotiates";
                    readonly 507: "Insufficient Storage";
                    readonly 508: "Loop Detected";
                    readonly 510: "Not Extended";
                    readonly 511: "Network Authentication Required";
                }[Code] : Code>(code: Code, response?: T) => import("elysia").ElysiaCustomStatusResponse<Code, T, Code extends "Continue" | "Switching Protocols" | "Processing" | "Early Hints" | "OK" | "Created" | "Accepted" | "Non-Authoritative Information" | "No Content" | "Reset Content" | "Partial Content" | "Multi-Status" | "Already Reported" | "Multiple Choices" | "Moved Permanently" | "Found" | "See Other" | "Not Modified" | "Temporary Redirect" | "Permanent Redirect" | "Bad Request" | "Unauthorized" | "Payment Required" | "Forbidden" | "Not Found" | "Method Not Allowed" | "Not Acceptable" | "Proxy Authentication Required" | "Request Timeout" | "Conflict" | "Gone" | "Length Required" | "Precondition Failed" | "Payload Too Large" | "URI Too Long" | "Unsupported Media Type" | "Range Not Satisfiable" | "Expectation Failed" | "I'm a teapot" | "Enhance Your Calm" | "Misdirected Request" | "Unprocessable Content" | "Locked" | "Failed Dependency" | "Too Early" | "Upgrade Required" | "Precondition Required" | "Too Many Requests" | "Request Header Fields Too Large" | "Unavailable For Legal Reasons" | "Internal Server Error" | "Not Implemented" | "Bad Gateway" | "Service Unavailable" | "Gateway Timeout" | "HTTP Version Not Supported" | "Variant Also Negotiates" | "Insufficient Storage" | "Loop Detected" | "Not Extended" | "Network Authentication Required" ? {
                    readonly Continue: 100;
                    readonly "Switching Protocols": 101;
                    readonly Processing: 102;
                    readonly "Early Hints": 103;
                    readonly OK: 200;
                    readonly Created: 201;
                    readonly Accepted: 202;
                    readonly "Non-Authoritative Information": 203;
                    readonly "No Content": 204;
                    readonly "Reset Content": 205;
                    readonly "Partial Content": 206;
                    readonly "Multi-Status": 207;
                    readonly "Already Reported": 208;
                    readonly "Multiple Choices": 300;
                    readonly "Moved Permanently": 301;
                    readonly Found: 302;
                    readonly "See Other": 303;
                    readonly "Not Modified": 304;
                    readonly "Temporary Redirect": 307;
                    readonly "Permanent Redirect": 308;
                    readonly "Bad Request": 400;
                    readonly Unauthorized: 401;
                    readonly "Payment Required": 402;
                    readonly Forbidden: 403;
                    readonly "Not Found": 404;
                    readonly "Method Not Allowed": 405;
                    readonly "Not Acceptable": 406;
                    readonly "Proxy Authentication Required": 407;
                    readonly "Request Timeout": 408;
                    readonly Conflict: 409;
                    readonly Gone: 410;
                    readonly "Length Required": 411;
                    readonly "Precondition Failed": 412;
                    readonly "Payload Too Large": 413;
                    readonly "URI Too Long": 414;
                    readonly "Unsupported Media Type": 415;
                    readonly "Range Not Satisfiable": 416;
                    readonly "Expectation Failed": 417;
                    readonly "I'm a teapot": 418;
                    readonly "Enhance Your Calm": 420;
                    readonly "Misdirected Request": 421;
                    readonly "Unprocessable Content": 422;
                    readonly Locked: 423;
                    readonly "Failed Dependency": 424;
                    readonly "Too Early": 425;
                    readonly "Upgrade Required": 426;
                    readonly "Precondition Required": 428;
                    readonly "Too Many Requests": 429;
                    readonly "Request Header Fields Too Large": 431;
                    readonly "Unavailable For Legal Reasons": 451;
                    readonly "Internal Server Error": 500;
                    readonly "Not Implemented": 501;
                    readonly "Bad Gateway": 502;
                    readonly "Service Unavailable": 503;
                    readonly "Gateway Timeout": 504;
                    readonly "HTTP Version Not Supported": 505;
                    readonly "Variant Also Negotiates": 506;
                    readonly "Insufficient Storage": 507;
                    readonly "Loop Detected": 508;
                    readonly "Not Extended": 510;
                    readonly "Network Authentication Required": 511;
                }[Code] : Code>;
            }) => Promise<import("elysia").ElysiaCustomStatusResponse<403, any, 403> | import("elysia").ElysiaCustomStatusResponse<404, any, 404> | undefined>;
        };
        readonly participant: {
            readonly resolve: ({ status, store: { sessionUser }, params }: {
                body: unknown;
                query: Record<string, string>;
                params: {};
                headers: Record<string, string | undefined>;
                cookie: Record<string, import("elysia").Cookie<unknown>>;
                server: import("elysia/universal/server").Server | null;
                redirect: import("elysia").redirect;
                set: {
                    headers: import("elysia").HTTPHeaders;
                    status?: number | keyof import("elysia").StatusMap;
                    redirect?: string;
                    cookie?: Record<string, import("elysia/cookies").ElysiaCookie>;
                };
                path: string;
                route: string;
                request: Request;
                store: {
                    sessionUser: Omit<{
                        id: string;
                        name: string;
                        email: string | null;
                        emailVerified: boolean;
                        image: string | null;
                        createdAt: Date;
                        updatedAt: Date;
                        username: string | null;
                        displayUsername: string | null;
                        bio: string | null;
                        isGuest: boolean;
                        managedBy: string | null;
                        currencyId: string | null;
                        inviteToken: string | null;
                        role: string | null;
                        banned: boolean | null;
                        banReason: string | null;
                        banExpires: Date | null;
                        lastLoginMethod: string | null;
                        profileCompletedAt: Date | null;
                        deletedAt: Date | null;
                        guestState: "managed" | "archived" | "merged" | null;
                        guestClaimedAt: Date | null;
                        guestArchivedAt: Date | null;
                        guestMergedAt: Date | null;
                        mergedIntoUserId: string | null;
                    }, "email" | "image"> & {
                        email: string;
                        image?: string | null;
                    };
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        expiresAt: Date;
                        token: string;
                        ipAddress?: string | null | undefined;
                        userAgent?: string | null | undefined;
                    } | null;
                };
                status: <const Code extends number | keyof import("elysia").StatusMap, const T = Code extends 100 | 410 | 500 | 401 | 101 | 102 | 103 | 200 | 201 | 202 | 203 | 204 | 205 | 206 | 207 | 208 | 300 | 301 | 302 | 303 | 304 | 307 | 308 | 400 | 402 | 403 | 404 | 405 | 406 | 407 | 408 | 409 | 411 | 412 | 413 | 414 | 415 | 416 | 417 | 418 | 420 | 421 | 422 | 423 | 424 | 425 | 426 | 428 | 429 | 431 | 451 | 501 | 502 | 503 | 504 | 505 | 506 | 507 | 508 | 510 | 511 ? {
                    readonly 100: "Continue";
                    readonly 101: "Switching Protocols";
                    readonly 102: "Processing";
                    readonly 103: "Early Hints";
                    readonly 200: "OK";
                    readonly 201: "Created";
                    readonly 202: "Accepted";
                    readonly 203: "Non-Authoritative Information";
                    readonly 204: "No Content";
                    readonly 205: "Reset Content";
                    readonly 206: "Partial Content";
                    readonly 207: "Multi-Status";
                    readonly 208: "Already Reported";
                    readonly 300: "Multiple Choices";
                    readonly 301: "Moved Permanently";
                    readonly 302: "Found";
                    readonly 303: "See Other";
                    readonly 304: "Not Modified";
                    readonly 307: "Temporary Redirect";
                    readonly 308: "Permanent Redirect";
                    readonly 400: "Bad Request";
                    readonly 401: "Unauthorized";
                    readonly 402: "Payment Required";
                    readonly 403: "Forbidden";
                    readonly 404: "Not Found";
                    readonly 405: "Method Not Allowed";
                    readonly 406: "Not Acceptable";
                    readonly 407: "Proxy Authentication Required";
                    readonly 408: "Request Timeout";
                    readonly 409: "Conflict";
                    readonly 410: "Gone";
                    readonly 411: "Length Required";
                    readonly 412: "Precondition Failed";
                    readonly 413: "Payload Too Large";
                    readonly 414: "URI Too Long";
                    readonly 415: "Unsupported Media Type";
                    readonly 416: "Range Not Satisfiable";
                    readonly 417: "Expectation Failed";
                    readonly 418: "I'm a teapot";
                    readonly 420: "Enhance Your Calm";
                    readonly 421: "Misdirected Request";
                    readonly 422: "Unprocessable Content";
                    readonly 423: "Locked";
                    readonly 424: "Failed Dependency";
                    readonly 425: "Too Early";
                    readonly 426: "Upgrade Required";
                    readonly 428: "Precondition Required";
                    readonly 429: "Too Many Requests";
                    readonly 431: "Request Header Fields Too Large";
                    readonly 451: "Unavailable For Legal Reasons";
                    readonly 500: "Internal Server Error";
                    readonly 501: "Not Implemented";
                    readonly 502: "Bad Gateway";
                    readonly 503: "Service Unavailable";
                    readonly 504: "Gateway Timeout";
                    readonly 505: "HTTP Version Not Supported";
                    readonly 506: "Variant Also Negotiates";
                    readonly 507: "Insufficient Storage";
                    readonly 508: "Loop Detected";
                    readonly 510: "Not Extended";
                    readonly 511: "Network Authentication Required";
                }[Code] : Code>(code: Code, response?: T) => import("elysia").ElysiaCustomStatusResponse<Code, T, Code extends "Continue" | "Switching Protocols" | "Processing" | "Early Hints" | "OK" | "Created" | "Accepted" | "Non-Authoritative Information" | "No Content" | "Reset Content" | "Partial Content" | "Multi-Status" | "Already Reported" | "Multiple Choices" | "Moved Permanently" | "Found" | "See Other" | "Not Modified" | "Temporary Redirect" | "Permanent Redirect" | "Bad Request" | "Unauthorized" | "Payment Required" | "Forbidden" | "Not Found" | "Method Not Allowed" | "Not Acceptable" | "Proxy Authentication Required" | "Request Timeout" | "Conflict" | "Gone" | "Length Required" | "Precondition Failed" | "Payload Too Large" | "URI Too Long" | "Unsupported Media Type" | "Range Not Satisfiable" | "Expectation Failed" | "I'm a teapot" | "Enhance Your Calm" | "Misdirected Request" | "Unprocessable Content" | "Locked" | "Failed Dependency" | "Too Early" | "Upgrade Required" | "Precondition Required" | "Too Many Requests" | "Request Header Fields Too Large" | "Unavailable For Legal Reasons" | "Internal Server Error" | "Not Implemented" | "Bad Gateway" | "Service Unavailable" | "Gateway Timeout" | "HTTP Version Not Supported" | "Variant Also Negotiates" | "Insufficient Storage" | "Loop Detected" | "Not Extended" | "Network Authentication Required" ? {
                    readonly Continue: 100;
                    readonly "Switching Protocols": 101;
                    readonly Processing: 102;
                    readonly "Early Hints": 103;
                    readonly OK: 200;
                    readonly Created: 201;
                    readonly Accepted: 202;
                    readonly "Non-Authoritative Information": 203;
                    readonly "No Content": 204;
                    readonly "Reset Content": 205;
                    readonly "Partial Content": 206;
                    readonly "Multi-Status": 207;
                    readonly "Already Reported": 208;
                    readonly "Multiple Choices": 300;
                    readonly "Moved Permanently": 301;
                    readonly Found: 302;
                    readonly "See Other": 303;
                    readonly "Not Modified": 304;
                    readonly "Temporary Redirect": 307;
                    readonly "Permanent Redirect": 308;
                    readonly "Bad Request": 400;
                    readonly Unauthorized: 401;
                    readonly "Payment Required": 402;
                    readonly Forbidden: 403;
                    readonly "Not Found": 404;
                    readonly "Method Not Allowed": 405;
                    readonly "Not Acceptable": 406;
                    readonly "Proxy Authentication Required": 407;
                    readonly "Request Timeout": 408;
                    readonly Conflict: 409;
                    readonly Gone: 410;
                    readonly "Length Required": 411;
                    readonly "Precondition Failed": 412;
                    readonly "Payload Too Large": 413;
                    readonly "URI Too Long": 414;
                    readonly "Unsupported Media Type": 415;
                    readonly "Range Not Satisfiable": 416;
                    readonly "Expectation Failed": 417;
                    readonly "I'm a teapot": 418;
                    readonly "Enhance Your Calm": 420;
                    readonly "Misdirected Request": 421;
                    readonly "Unprocessable Content": 422;
                    readonly Locked: 423;
                    readonly "Failed Dependency": 424;
                    readonly "Too Early": 425;
                    readonly "Upgrade Required": 426;
                    readonly "Precondition Required": 428;
                    readonly "Too Many Requests": 429;
                    readonly "Request Header Fields Too Large": 431;
                    readonly "Unavailable For Legal Reasons": 451;
                    readonly "Internal Server Error": 500;
                    readonly "Not Implemented": 501;
                    readonly "Bad Gateway": 502;
                    readonly "Service Unavailable": 503;
                    readonly "Gateway Timeout": 504;
                    readonly "HTTP Version Not Supported": 505;
                    readonly "Variant Also Negotiates": 506;
                    readonly "Insufficient Storage": 507;
                    readonly "Loop Detected": 508;
                    readonly "Not Extended": 510;
                    readonly "Network Authentication Required": 511;
                }[Code] : Code>;
            }) => Promise<import("elysia").ElysiaCustomStatusResponse<403, any, 403> | import("elysia").ElysiaCustomStatusResponse<404, any, 404> | undefined>;
        };
    };
    parser: {};
    response: {};
} & {
    schema: {};
    standaloneSchema: {};
    macro: Partial<{
        readonly auth: boolean;
        readonly "no-auth": boolean;
    }> & Partial<{
        readonly role: ("admin" | "member" | "self")[];
    }>;
    macroFn: {
        readonly auth: {
            readonly resolve: ({ request, status, store }: {
                body: unknown;
                query: Record<string, string>;
                params: {};
                headers: Record<string, string | undefined>;
                cookie: Record<string, import("elysia").Cookie<unknown>>;
                server: import("elysia/universal/server").Server | null;
                redirect: import("elysia").redirect;
                set: {
                    headers: import("elysia").HTTPHeaders;
                    status?: number | keyof import("elysia").StatusMap;
                    redirect?: string;
                    cookie?: Record<string, import("elysia/cookies").ElysiaCookie>;
                };
                path: string;
                route: string;
                request: Request;
                store: {
                    sessionUser: Omit<{
                        id: string;
                        name: string;
                        email: string | null;
                        emailVerified: boolean;
                        image: string | null;
                        createdAt: Date;
                        updatedAt: Date;
                        username: string | null;
                        displayUsername: string | null;
                        bio: string | null;
                        isGuest: boolean;
                        managedBy: string | null;
                        currencyId: string | null;
                        inviteToken: string | null;
                        role: string | null;
                        banned: boolean | null;
                        banReason: string | null;
                        banExpires: Date | null;
                        lastLoginMethod: string | null;
                        profileCompletedAt: Date | null;
                        deletedAt: Date | null;
                        guestState: "managed" | "archived" | "merged" | null;
                        guestClaimedAt: Date | null;
                        guestArchivedAt: Date | null;
                        guestMergedAt: Date | null;
                        mergedIntoUserId: string | null;
                    }, "email" | "image"> & {
                        email: string;
                        image?: string | null;
                    };
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        expiresAt: Date;
                        token: string;
                        ipAddress?: string | null | undefined;
                        userAgent?: string | null | undefined;
                    } | null;
                };
                status: <const Code extends number | keyof import("elysia").StatusMap, const T = Code extends 100 | 410 | 500 | 401 | 101 | 102 | 103 | 200 | 201 | 202 | 203 | 204 | 205 | 206 | 207 | 208 | 300 | 301 | 302 | 303 | 304 | 307 | 308 | 400 | 402 | 403 | 404 | 405 | 406 | 407 | 408 | 409 | 411 | 412 | 413 | 414 | 415 | 416 | 417 | 418 | 420 | 421 | 422 | 423 | 424 | 425 | 426 | 428 | 429 | 431 | 451 | 501 | 502 | 503 | 504 | 505 | 506 | 507 | 508 | 510 | 511 ? {
                    readonly 100: "Continue";
                    readonly 101: "Switching Protocols";
                    readonly 102: "Processing";
                    readonly 103: "Early Hints";
                    readonly 200: "OK";
                    readonly 201: "Created";
                    readonly 202: "Accepted";
                    readonly 203: "Non-Authoritative Information";
                    readonly 204: "No Content";
                    readonly 205: "Reset Content";
                    readonly 206: "Partial Content";
                    readonly 207: "Multi-Status";
                    readonly 208: "Already Reported";
                    readonly 300: "Multiple Choices";
                    readonly 301: "Moved Permanently";
                    readonly 302: "Found";
                    readonly 303: "See Other";
                    readonly 304: "Not Modified";
                    readonly 307: "Temporary Redirect";
                    readonly 308: "Permanent Redirect";
                    readonly 400: "Bad Request";
                    readonly 401: "Unauthorized";
                    readonly 402: "Payment Required";
                    readonly 403: "Forbidden";
                    readonly 404: "Not Found";
                    readonly 405: "Method Not Allowed";
                    readonly 406: "Not Acceptable";
                    readonly 407: "Proxy Authentication Required";
                    readonly 408: "Request Timeout";
                    readonly 409: "Conflict";
                    readonly 410: "Gone";
                    readonly 411: "Length Required";
                    readonly 412: "Precondition Failed";
                    readonly 413: "Payload Too Large";
                    readonly 414: "URI Too Long";
                    readonly 415: "Unsupported Media Type";
                    readonly 416: "Range Not Satisfiable";
                    readonly 417: "Expectation Failed";
                    readonly 418: "I'm a teapot";
                    readonly 420: "Enhance Your Calm";
                    readonly 421: "Misdirected Request";
                    readonly 422: "Unprocessable Content";
                    readonly 423: "Locked";
                    readonly 424: "Failed Dependency";
                    readonly 425: "Too Early";
                    readonly 426: "Upgrade Required";
                    readonly 428: "Precondition Required";
                    readonly 429: "Too Many Requests";
                    readonly 431: "Request Header Fields Too Large";
                    readonly 451: "Unavailable For Legal Reasons";
                    readonly 500: "Internal Server Error";
                    readonly 501: "Not Implemented";
                    readonly 502: "Bad Gateway";
                    readonly 503: "Service Unavailable";
                    readonly 504: "Gateway Timeout";
                    readonly 505: "HTTP Version Not Supported";
                    readonly 506: "Variant Also Negotiates";
                    readonly 507: "Insufficient Storage";
                    readonly 508: "Loop Detected";
                    readonly 510: "Not Extended";
                    readonly 511: "Network Authentication Required";
                }[Code] : Code>(code: Code, response?: T) => import("elysia").ElysiaCustomStatusResponse<Code, T, Code extends "Continue" | "Switching Protocols" | "Processing" | "Early Hints" | "OK" | "Created" | "Accepted" | "Non-Authoritative Information" | "No Content" | "Reset Content" | "Partial Content" | "Multi-Status" | "Already Reported" | "Multiple Choices" | "Moved Permanently" | "Found" | "See Other" | "Not Modified" | "Temporary Redirect" | "Permanent Redirect" | "Bad Request" | "Unauthorized" | "Payment Required" | "Forbidden" | "Not Found" | "Method Not Allowed" | "Not Acceptable" | "Proxy Authentication Required" | "Request Timeout" | "Conflict" | "Gone" | "Length Required" | "Precondition Failed" | "Payload Too Large" | "URI Too Long" | "Unsupported Media Type" | "Range Not Satisfiable" | "Expectation Failed" | "I'm a teapot" | "Enhance Your Calm" | "Misdirected Request" | "Unprocessable Content" | "Locked" | "Failed Dependency" | "Too Early" | "Upgrade Required" | "Precondition Required" | "Too Many Requests" | "Request Header Fields Too Large" | "Unavailable For Legal Reasons" | "Internal Server Error" | "Not Implemented" | "Bad Gateway" | "Service Unavailable" | "Gateway Timeout" | "HTTP Version Not Supported" | "Variant Also Negotiates" | "Insufficient Storage" | "Loop Detected" | "Not Extended" | "Network Authentication Required" ? {
                    readonly Continue: 100;
                    readonly "Switching Protocols": 101;
                    readonly Processing: 102;
                    readonly "Early Hints": 103;
                    readonly OK: 200;
                    readonly Created: 201;
                    readonly Accepted: 202;
                    readonly "Non-Authoritative Information": 203;
                    readonly "No Content": 204;
                    readonly "Reset Content": 205;
                    readonly "Partial Content": 206;
                    readonly "Multi-Status": 207;
                    readonly "Already Reported": 208;
                    readonly "Multiple Choices": 300;
                    readonly "Moved Permanently": 301;
                    readonly Found: 302;
                    readonly "See Other": 303;
                    readonly "Not Modified": 304;
                    readonly "Temporary Redirect": 307;
                    readonly "Permanent Redirect": 308;
                    readonly "Bad Request": 400;
                    readonly Unauthorized: 401;
                    readonly "Payment Required": 402;
                    readonly Forbidden: 403;
                    readonly "Not Found": 404;
                    readonly "Method Not Allowed": 405;
                    readonly "Not Acceptable": 406;
                    readonly "Proxy Authentication Required": 407;
                    readonly "Request Timeout": 408;
                    readonly Conflict: 409;
                    readonly Gone: 410;
                    readonly "Length Required": 411;
                    readonly "Precondition Failed": 412;
                    readonly "Payload Too Large": 413;
                    readonly "URI Too Long": 414;
                    readonly "Unsupported Media Type": 415;
                    readonly "Range Not Satisfiable": 416;
                    readonly "Expectation Failed": 417;
                    readonly "I'm a teapot": 418;
                    readonly "Enhance Your Calm": 420;
                    readonly "Misdirected Request": 421;
                    readonly "Unprocessable Content": 422;
                    readonly Locked: 423;
                    readonly "Failed Dependency": 424;
                    readonly "Too Early": 425;
                    readonly "Upgrade Required": 426;
                    readonly "Precondition Required": 428;
                    readonly "Too Many Requests": 429;
                    readonly "Request Header Fields Too Large": 431;
                    readonly "Unavailable For Legal Reasons": 451;
                    readonly "Internal Server Error": 500;
                    readonly "Not Implemented": 501;
                    readonly "Bad Gateway": 502;
                    readonly "Service Unavailable": 503;
                    readonly "Gateway Timeout": 504;
                    readonly "HTTP Version Not Supported": 505;
                    readonly "Variant Also Negotiates": 506;
                    readonly "Insufficient Storage": 507;
                    readonly "Loop Detected": 508;
                    readonly "Not Extended": 510;
                    readonly "Network Authentication Required": 511;
                }[Code] : Code>;
            }) => Promise<import("elysia").ElysiaCustomStatusResponse<401, any, 401> | import("elysia").ElysiaCustomStatusResponse<403, {
                code: string;
                message: string;
            }, 403> | {
                sessionUser: Omit<{
                    id: string;
                    name: string;
                    email: string | null;
                    emailVerified: boolean;
                    image: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                    username: string | null;
                    displayUsername: string | null;
                    bio: string | null;
                    isGuest: boolean;
                    managedBy: string | null;
                    currencyId: string | null;
                    inviteToken: string | null;
                    role: string | null;
                    banned: boolean | null;
                    banReason: string | null;
                    banExpires: Date | null;
                    lastLoginMethod: string | null;
                    profileCompletedAt: Date | null;
                    deletedAt: Date | null;
                    guestState: "managed" | "archived" | "merged" | null;
                    guestClaimedAt: Date | null;
                    guestArchivedAt: Date | null;
                    guestMergedAt: Date | null;
                    mergedIntoUserId: string | null;
                }, "email" | "image"> & {
                    email: string;
                    image?: string | null;
                };
                session: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    expiresAt: Date;
                    token: string;
                    ipAddress?: string | null | undefined;
                    userAgent?: string | null | undefined;
                } | null;
            }>;
        };
        readonly "no-auth": {
            readonly resolve: ({ status, request: { headers } }: {
                body: unknown;
                query: Record<string, string>;
                params: {};
                headers: Record<string, string | undefined>;
                cookie: Record<string, import("elysia").Cookie<unknown>>;
                server: import("elysia/universal/server").Server | null;
                redirect: import("elysia").redirect;
                set: {
                    headers: import("elysia").HTTPHeaders;
                    status?: number | keyof import("elysia").StatusMap;
                    redirect?: string;
                    cookie?: Record<string, import("elysia/cookies").ElysiaCookie>;
                };
                path: string;
                route: string;
                request: Request;
                store: {
                    sessionUser: Omit<{
                        id: string;
                        name: string;
                        email: string | null;
                        emailVerified: boolean;
                        image: string | null;
                        createdAt: Date;
                        updatedAt: Date;
                        username: string | null;
                        displayUsername: string | null;
                        bio: string | null;
                        isGuest: boolean;
                        managedBy: string | null;
                        currencyId: string | null;
                        inviteToken: string | null;
                        role: string | null;
                        banned: boolean | null;
                        banReason: string | null;
                        banExpires: Date | null;
                        lastLoginMethod: string | null;
                        profileCompletedAt: Date | null;
                        deletedAt: Date | null;
                        guestState: "managed" | "archived" | "merged" | null;
                        guestClaimedAt: Date | null;
                        guestArchivedAt: Date | null;
                        guestMergedAt: Date | null;
                        mergedIntoUserId: string | null;
                    }, "email" | "image"> & {
                        email: string;
                        image?: string | null;
                    };
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        expiresAt: Date;
                        token: string;
                        ipAddress?: string | null | undefined;
                        userAgent?: string | null | undefined;
                    } | null;
                };
                status: <const Code extends number | keyof import("elysia").StatusMap, const T = Code extends 100 | 410 | 500 | 401 | 101 | 102 | 103 | 200 | 201 | 202 | 203 | 204 | 205 | 206 | 207 | 208 | 300 | 301 | 302 | 303 | 304 | 307 | 308 | 400 | 402 | 403 | 404 | 405 | 406 | 407 | 408 | 409 | 411 | 412 | 413 | 414 | 415 | 416 | 417 | 418 | 420 | 421 | 422 | 423 | 424 | 425 | 426 | 428 | 429 | 431 | 451 | 501 | 502 | 503 | 504 | 505 | 506 | 507 | 508 | 510 | 511 ? {
                    readonly 100: "Continue";
                    readonly 101: "Switching Protocols";
                    readonly 102: "Processing";
                    readonly 103: "Early Hints";
                    readonly 200: "OK";
                    readonly 201: "Created";
                    readonly 202: "Accepted";
                    readonly 203: "Non-Authoritative Information";
                    readonly 204: "No Content";
                    readonly 205: "Reset Content";
                    readonly 206: "Partial Content";
                    readonly 207: "Multi-Status";
                    readonly 208: "Already Reported";
                    readonly 300: "Multiple Choices";
                    readonly 301: "Moved Permanently";
                    readonly 302: "Found";
                    readonly 303: "See Other";
                    readonly 304: "Not Modified";
                    readonly 307: "Temporary Redirect";
                    readonly 308: "Permanent Redirect";
                    readonly 400: "Bad Request";
                    readonly 401: "Unauthorized";
                    readonly 402: "Payment Required";
                    readonly 403: "Forbidden";
                    readonly 404: "Not Found";
                    readonly 405: "Method Not Allowed";
                    readonly 406: "Not Acceptable";
                    readonly 407: "Proxy Authentication Required";
                    readonly 408: "Request Timeout";
                    readonly 409: "Conflict";
                    readonly 410: "Gone";
                    readonly 411: "Length Required";
                    readonly 412: "Precondition Failed";
                    readonly 413: "Payload Too Large";
                    readonly 414: "URI Too Long";
                    readonly 415: "Unsupported Media Type";
                    readonly 416: "Range Not Satisfiable";
                    readonly 417: "Expectation Failed";
                    readonly 418: "I'm a teapot";
                    readonly 420: "Enhance Your Calm";
                    readonly 421: "Misdirected Request";
                    readonly 422: "Unprocessable Content";
                    readonly 423: "Locked";
                    readonly 424: "Failed Dependency";
                    readonly 425: "Too Early";
                    readonly 426: "Upgrade Required";
                    readonly 428: "Precondition Required";
                    readonly 429: "Too Many Requests";
                    readonly 431: "Request Header Fields Too Large";
                    readonly 451: "Unavailable For Legal Reasons";
                    readonly 500: "Internal Server Error";
                    readonly 501: "Not Implemented";
                    readonly 502: "Bad Gateway";
                    readonly 503: "Service Unavailable";
                    readonly 504: "Gateway Timeout";
                    readonly 505: "HTTP Version Not Supported";
                    readonly 506: "Variant Also Negotiates";
                    readonly 507: "Insufficient Storage";
                    readonly 508: "Loop Detected";
                    readonly 510: "Not Extended";
                    readonly 511: "Network Authentication Required";
                }[Code] : Code>(code: Code, response?: T) => import("elysia").ElysiaCustomStatusResponse<Code, T, Code extends "Continue" | "Switching Protocols" | "Processing" | "Early Hints" | "OK" | "Created" | "Accepted" | "Non-Authoritative Information" | "No Content" | "Reset Content" | "Partial Content" | "Multi-Status" | "Already Reported" | "Multiple Choices" | "Moved Permanently" | "Found" | "See Other" | "Not Modified" | "Temporary Redirect" | "Permanent Redirect" | "Bad Request" | "Unauthorized" | "Payment Required" | "Forbidden" | "Not Found" | "Method Not Allowed" | "Not Acceptable" | "Proxy Authentication Required" | "Request Timeout" | "Conflict" | "Gone" | "Length Required" | "Precondition Failed" | "Payload Too Large" | "URI Too Long" | "Unsupported Media Type" | "Range Not Satisfiable" | "Expectation Failed" | "I'm a teapot" | "Enhance Your Calm" | "Misdirected Request" | "Unprocessable Content" | "Locked" | "Failed Dependency" | "Too Early" | "Upgrade Required" | "Precondition Required" | "Too Many Requests" | "Request Header Fields Too Large" | "Unavailable For Legal Reasons" | "Internal Server Error" | "Not Implemented" | "Bad Gateway" | "Service Unavailable" | "Gateway Timeout" | "HTTP Version Not Supported" | "Variant Also Negotiates" | "Insufficient Storage" | "Loop Detected" | "Not Extended" | "Network Authentication Required" ? {
                    readonly Continue: 100;
                    readonly "Switching Protocols": 101;
                    readonly Processing: 102;
                    readonly "Early Hints": 103;
                    readonly OK: 200;
                    readonly Created: 201;
                    readonly Accepted: 202;
                    readonly "Non-Authoritative Information": 203;
                    readonly "No Content": 204;
                    readonly "Reset Content": 205;
                    readonly "Partial Content": 206;
                    readonly "Multi-Status": 207;
                    readonly "Already Reported": 208;
                    readonly "Multiple Choices": 300;
                    readonly "Moved Permanently": 301;
                    readonly Found: 302;
                    readonly "See Other": 303;
                    readonly "Not Modified": 304;
                    readonly "Temporary Redirect": 307;
                    readonly "Permanent Redirect": 308;
                    readonly "Bad Request": 400;
                    readonly Unauthorized: 401;
                    readonly "Payment Required": 402;
                    readonly Forbidden: 403;
                    readonly "Not Found": 404;
                    readonly "Method Not Allowed": 405;
                    readonly "Not Acceptable": 406;
                    readonly "Proxy Authentication Required": 407;
                    readonly "Request Timeout": 408;
                    readonly Conflict: 409;
                    readonly Gone: 410;
                    readonly "Length Required": 411;
                    readonly "Precondition Failed": 412;
                    readonly "Payload Too Large": 413;
                    readonly "URI Too Long": 414;
                    readonly "Unsupported Media Type": 415;
                    readonly "Range Not Satisfiable": 416;
                    readonly "Expectation Failed": 417;
                    readonly "I'm a teapot": 418;
                    readonly "Enhance Your Calm": 420;
                    readonly "Misdirected Request": 421;
                    readonly "Unprocessable Content": 422;
                    readonly Locked: 423;
                    readonly "Failed Dependency": 424;
                    readonly "Too Early": 425;
                    readonly "Upgrade Required": 426;
                    readonly "Precondition Required": 428;
                    readonly "Too Many Requests": 429;
                    readonly "Request Header Fields Too Large": 431;
                    readonly "Unavailable For Legal Reasons": 451;
                    readonly "Internal Server Error": 500;
                    readonly "Not Implemented": 501;
                    readonly "Bad Gateway": 502;
                    readonly "Service Unavailable": 503;
                    readonly "Gateway Timeout": 504;
                    readonly "HTTP Version Not Supported": 505;
                    readonly "Variant Also Negotiates": 506;
                    readonly "Insufficient Storage": 507;
                    readonly "Loop Detected": 508;
                    readonly "Not Extended": 510;
                    readonly "Network Authentication Required": 511;
                }[Code] : Code>;
            }) => Promise<import("elysia").ElysiaCustomStatusResponse<403, any, 403> | undefined>;
        };
    } & {
        readonly role: (role: Array<"admin" | "member" | "self">) => {
            readonly resolve: ({ status, store: { sessionUser }, params }: {
                body: unknown;
                query: Record<string, string>;
                params: {};
                headers: Record<string, string | undefined>;
                cookie: Record<string, import("elysia").Cookie<unknown>>;
                server: import("elysia/universal/server").Server | null;
                redirect: import("elysia").redirect;
                set: {
                    headers: import("elysia").HTTPHeaders;
                    status?: number | keyof import("elysia").StatusMap;
                    redirect?: string;
                    cookie?: Record<string, import("elysia/cookies").ElysiaCookie>;
                };
                path: string;
                route: string;
                request: Request;
                store: {
                    sessionUser: Omit<{
                        id: string;
                        name: string;
                        email: string | null;
                        emailVerified: boolean;
                        image: string | null;
                        createdAt: Date;
                        updatedAt: Date;
                        username: string | null;
                        displayUsername: string | null;
                        bio: string | null;
                        isGuest: boolean;
                        managedBy: string | null;
                        currencyId: string | null;
                        inviteToken: string | null;
                        role: string | null;
                        banned: boolean | null;
                        banReason: string | null;
                        banExpires: Date | null;
                        lastLoginMethod: string | null;
                        profileCompletedAt: Date | null;
                        deletedAt: Date | null;
                        guestState: "managed" | "archived" | "merged" | null;
                        guestClaimedAt: Date | null;
                        guestArchivedAt: Date | null;
                        guestMergedAt: Date | null;
                        mergedIntoUserId: string | null;
                    }, "email" | "image"> & {
                        email: string;
                        image?: string | null;
                    };
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        expiresAt: Date;
                        token: string;
                        ipAddress?: string | null | undefined;
                        userAgent?: string | null | undefined;
                    } | null;
                };
                status: <const Code extends number | keyof import("elysia").StatusMap, const T = Code extends 100 | 410 | 500 | 401 | 101 | 102 | 103 | 200 | 201 | 202 | 203 | 204 | 205 | 206 | 207 | 208 | 300 | 301 | 302 | 303 | 304 | 307 | 308 | 400 | 402 | 403 | 404 | 405 | 406 | 407 | 408 | 409 | 411 | 412 | 413 | 414 | 415 | 416 | 417 | 418 | 420 | 421 | 422 | 423 | 424 | 425 | 426 | 428 | 429 | 431 | 451 | 501 | 502 | 503 | 504 | 505 | 506 | 507 | 508 | 510 | 511 ? {
                    readonly 100: "Continue";
                    readonly 101: "Switching Protocols";
                    readonly 102: "Processing";
                    readonly 103: "Early Hints";
                    readonly 200: "OK";
                    readonly 201: "Created";
                    readonly 202: "Accepted";
                    readonly 203: "Non-Authoritative Information";
                    readonly 204: "No Content";
                    readonly 205: "Reset Content";
                    readonly 206: "Partial Content";
                    readonly 207: "Multi-Status";
                    readonly 208: "Already Reported";
                    readonly 300: "Multiple Choices";
                    readonly 301: "Moved Permanently";
                    readonly 302: "Found";
                    readonly 303: "See Other";
                    readonly 304: "Not Modified";
                    readonly 307: "Temporary Redirect";
                    readonly 308: "Permanent Redirect";
                    readonly 400: "Bad Request";
                    readonly 401: "Unauthorized";
                    readonly 402: "Payment Required";
                    readonly 403: "Forbidden";
                    readonly 404: "Not Found";
                    readonly 405: "Method Not Allowed";
                    readonly 406: "Not Acceptable";
                    readonly 407: "Proxy Authentication Required";
                    readonly 408: "Request Timeout";
                    readonly 409: "Conflict";
                    readonly 410: "Gone";
                    readonly 411: "Length Required";
                    readonly 412: "Precondition Failed";
                    readonly 413: "Payload Too Large";
                    readonly 414: "URI Too Long";
                    readonly 415: "Unsupported Media Type";
                    readonly 416: "Range Not Satisfiable";
                    readonly 417: "Expectation Failed";
                    readonly 418: "I'm a teapot";
                    readonly 420: "Enhance Your Calm";
                    readonly 421: "Misdirected Request";
                    readonly 422: "Unprocessable Content";
                    readonly 423: "Locked";
                    readonly 424: "Failed Dependency";
                    readonly 425: "Too Early";
                    readonly 426: "Upgrade Required";
                    readonly 428: "Precondition Required";
                    readonly 429: "Too Many Requests";
                    readonly 431: "Request Header Fields Too Large";
                    readonly 451: "Unavailable For Legal Reasons";
                    readonly 500: "Internal Server Error";
                    readonly 501: "Not Implemented";
                    readonly 502: "Bad Gateway";
                    readonly 503: "Service Unavailable";
                    readonly 504: "Gateway Timeout";
                    readonly 505: "HTTP Version Not Supported";
                    readonly 506: "Variant Also Negotiates";
                    readonly 507: "Insufficient Storage";
                    readonly 508: "Loop Detected";
                    readonly 510: "Not Extended";
                    readonly 511: "Network Authentication Required";
                }[Code] : Code>(code: Code, response?: T) => import("elysia").ElysiaCustomStatusResponse<Code, T, Code extends "Continue" | "Switching Protocols" | "Processing" | "Early Hints" | "OK" | "Created" | "Accepted" | "Non-Authoritative Information" | "No Content" | "Reset Content" | "Partial Content" | "Multi-Status" | "Already Reported" | "Multiple Choices" | "Moved Permanently" | "Found" | "See Other" | "Not Modified" | "Temporary Redirect" | "Permanent Redirect" | "Bad Request" | "Unauthorized" | "Payment Required" | "Forbidden" | "Not Found" | "Method Not Allowed" | "Not Acceptable" | "Proxy Authentication Required" | "Request Timeout" | "Conflict" | "Gone" | "Length Required" | "Precondition Failed" | "Payload Too Large" | "URI Too Long" | "Unsupported Media Type" | "Range Not Satisfiable" | "Expectation Failed" | "I'm a teapot" | "Enhance Your Calm" | "Misdirected Request" | "Unprocessable Content" | "Locked" | "Failed Dependency" | "Too Early" | "Upgrade Required" | "Precondition Required" | "Too Many Requests" | "Request Header Fields Too Large" | "Unavailable For Legal Reasons" | "Internal Server Error" | "Not Implemented" | "Bad Gateway" | "Service Unavailable" | "Gateway Timeout" | "HTTP Version Not Supported" | "Variant Also Negotiates" | "Insufficient Storage" | "Loop Detected" | "Not Extended" | "Network Authentication Required" ? {
                    readonly Continue: 100;
                    readonly "Switching Protocols": 101;
                    readonly Processing: 102;
                    readonly "Early Hints": 103;
                    readonly OK: 200;
                    readonly Created: 201;
                    readonly Accepted: 202;
                    readonly "Non-Authoritative Information": 203;
                    readonly "No Content": 204;
                    readonly "Reset Content": 205;
                    readonly "Partial Content": 206;
                    readonly "Multi-Status": 207;
                    readonly "Already Reported": 208;
                    readonly "Multiple Choices": 300;
                    readonly "Moved Permanently": 301;
                    readonly Found: 302;
                    readonly "See Other": 303;
                    readonly "Not Modified": 304;
                    readonly "Temporary Redirect": 307;
                    readonly "Permanent Redirect": 308;
                    readonly "Bad Request": 400;
                    readonly Unauthorized: 401;
                    readonly "Payment Required": 402;
                    readonly Forbidden: 403;
                    readonly "Not Found": 404;
                    readonly "Method Not Allowed": 405;
                    readonly "Not Acceptable": 406;
                    readonly "Proxy Authentication Required": 407;
                    readonly "Request Timeout": 408;
                    readonly Conflict: 409;
                    readonly Gone: 410;
                    readonly "Length Required": 411;
                    readonly "Precondition Failed": 412;
                    readonly "Payload Too Large": 413;
                    readonly "URI Too Long": 414;
                    readonly "Unsupported Media Type": 415;
                    readonly "Range Not Satisfiable": 416;
                    readonly "Expectation Failed": 417;
                    readonly "I'm a teapot": 418;
                    readonly "Enhance Your Calm": 420;
                    readonly "Misdirected Request": 421;
                    readonly "Unprocessable Content": 422;
                    readonly Locked: 423;
                    readonly "Failed Dependency": 424;
                    readonly "Too Early": 425;
                    readonly "Upgrade Required": 426;
                    readonly "Precondition Required": 428;
                    readonly "Too Many Requests": 429;
                    readonly "Request Header Fields Too Large": 431;
                    readonly "Unavailable For Legal Reasons": 451;
                    readonly "Internal Server Error": 500;
                    readonly "Not Implemented": 501;
                    readonly "Bad Gateway": 502;
                    readonly "Service Unavailable": 503;
                    readonly "Gateway Timeout": 504;
                    readonly "HTTP Version Not Supported": 505;
                    readonly "Variant Also Negotiates": 506;
                    readonly "Insufficient Storage": 507;
                    readonly "Loop Detected": 508;
                    readonly "Not Extended": 510;
                    readonly "Network Authentication Required": 511;
                }[Code] : Code>;
            }) => Promise<import("elysia").ElysiaCustomStatusResponse<403, any, 403> | import("elysia").ElysiaCustomStatusResponse<404, any, 404> | {
                membership: {
                    id: string;
                    groupId: string;
                    userId: string;
                    role: string;
                    joinedAt: Date;
                    createdAt: Date;
                    updatedAt: Date;
                    deletedAt: Date | null;
                    pinnedAt: Date | null;
                    archivedAt: Date | null;
                    defaultSplitPercentage: string | null;
                };
            }>;
        };
    };
    parser: {};
    response: {};
} & {
    schema: {};
    standaloneSchema: {};
    macro: Partial<{
        readonly auth: boolean;
        readonly "no-auth": boolean;
    }> & Partial<{
        readonly friendship: boolean;
        readonly acceptedFriendship: boolean;
    }>;
    macroFn: {
        readonly auth: {
            readonly resolve: ({ request, status, store }: {
                body: unknown;
                query: Record<string, string>;
                params: {};
                headers: Record<string, string | undefined>;
                cookie: Record<string, import("elysia").Cookie<unknown>>;
                server: import("elysia/universal/server").Server | null;
                redirect: import("elysia").redirect;
                set: {
                    headers: import("elysia").HTTPHeaders;
                    status?: number | keyof import("elysia").StatusMap;
                    redirect?: string;
                    cookie?: Record<string, import("elysia/cookies").ElysiaCookie>;
                };
                path: string;
                route: string;
                request: Request;
                store: {
                    sessionUser: Omit<{
                        id: string;
                        name: string;
                        email: string | null;
                        emailVerified: boolean;
                        image: string | null;
                        createdAt: Date;
                        updatedAt: Date;
                        username: string | null;
                        displayUsername: string | null;
                        bio: string | null;
                        isGuest: boolean;
                        managedBy: string | null;
                        currencyId: string | null;
                        inviteToken: string | null;
                        role: string | null;
                        banned: boolean | null;
                        banReason: string | null;
                        banExpires: Date | null;
                        lastLoginMethod: string | null;
                        profileCompletedAt: Date | null;
                        deletedAt: Date | null;
                        guestState: "managed" | "archived" | "merged" | null;
                        guestClaimedAt: Date | null;
                        guestArchivedAt: Date | null;
                        guestMergedAt: Date | null;
                        mergedIntoUserId: string | null;
                    }, "email" | "image"> & {
                        email: string;
                        image?: string | null;
                    };
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        expiresAt: Date;
                        token: string;
                        ipAddress?: string | null | undefined;
                        userAgent?: string | null | undefined;
                    } | null;
                };
                status: <const Code extends number | keyof import("elysia").StatusMap, const T = Code extends 100 | 410 | 500 | 401 | 101 | 102 | 103 | 200 | 201 | 202 | 203 | 204 | 205 | 206 | 207 | 208 | 300 | 301 | 302 | 303 | 304 | 307 | 308 | 400 | 402 | 403 | 404 | 405 | 406 | 407 | 408 | 409 | 411 | 412 | 413 | 414 | 415 | 416 | 417 | 418 | 420 | 421 | 422 | 423 | 424 | 425 | 426 | 428 | 429 | 431 | 451 | 501 | 502 | 503 | 504 | 505 | 506 | 507 | 508 | 510 | 511 ? {
                    readonly 100: "Continue";
                    readonly 101: "Switching Protocols";
                    readonly 102: "Processing";
                    readonly 103: "Early Hints";
                    readonly 200: "OK";
                    readonly 201: "Created";
                    readonly 202: "Accepted";
                    readonly 203: "Non-Authoritative Information";
                    readonly 204: "No Content";
                    readonly 205: "Reset Content";
                    readonly 206: "Partial Content";
                    readonly 207: "Multi-Status";
                    readonly 208: "Already Reported";
                    readonly 300: "Multiple Choices";
                    readonly 301: "Moved Permanently";
                    readonly 302: "Found";
                    readonly 303: "See Other";
                    readonly 304: "Not Modified";
                    readonly 307: "Temporary Redirect";
                    readonly 308: "Permanent Redirect";
                    readonly 400: "Bad Request";
                    readonly 401: "Unauthorized";
                    readonly 402: "Payment Required";
                    readonly 403: "Forbidden";
                    readonly 404: "Not Found";
                    readonly 405: "Method Not Allowed";
                    readonly 406: "Not Acceptable";
                    readonly 407: "Proxy Authentication Required";
                    readonly 408: "Request Timeout";
                    readonly 409: "Conflict";
                    readonly 410: "Gone";
                    readonly 411: "Length Required";
                    readonly 412: "Precondition Failed";
                    readonly 413: "Payload Too Large";
                    readonly 414: "URI Too Long";
                    readonly 415: "Unsupported Media Type";
                    readonly 416: "Range Not Satisfiable";
                    readonly 417: "Expectation Failed";
                    readonly 418: "I'm a teapot";
                    readonly 420: "Enhance Your Calm";
                    readonly 421: "Misdirected Request";
                    readonly 422: "Unprocessable Content";
                    readonly 423: "Locked";
                    readonly 424: "Failed Dependency";
                    readonly 425: "Too Early";
                    readonly 426: "Upgrade Required";
                    readonly 428: "Precondition Required";
                    readonly 429: "Too Many Requests";
                    readonly 431: "Request Header Fields Too Large";
                    readonly 451: "Unavailable For Legal Reasons";
                    readonly 500: "Internal Server Error";
                    readonly 501: "Not Implemented";
                    readonly 502: "Bad Gateway";
                    readonly 503: "Service Unavailable";
                    readonly 504: "Gateway Timeout";
                    readonly 505: "HTTP Version Not Supported";
                    readonly 506: "Variant Also Negotiates";
                    readonly 507: "Insufficient Storage";
                    readonly 508: "Loop Detected";
                    readonly 510: "Not Extended";
                    readonly 511: "Network Authentication Required";
                }[Code] : Code>(code: Code, response?: T) => import("elysia").ElysiaCustomStatusResponse<Code, T, Code extends "Continue" | "Switching Protocols" | "Processing" | "Early Hints" | "OK" | "Created" | "Accepted" | "Non-Authoritative Information" | "No Content" | "Reset Content" | "Partial Content" | "Multi-Status" | "Already Reported" | "Multiple Choices" | "Moved Permanently" | "Found" | "See Other" | "Not Modified" | "Temporary Redirect" | "Permanent Redirect" | "Bad Request" | "Unauthorized" | "Payment Required" | "Forbidden" | "Not Found" | "Method Not Allowed" | "Not Acceptable" | "Proxy Authentication Required" | "Request Timeout" | "Conflict" | "Gone" | "Length Required" | "Precondition Failed" | "Payload Too Large" | "URI Too Long" | "Unsupported Media Type" | "Range Not Satisfiable" | "Expectation Failed" | "I'm a teapot" | "Enhance Your Calm" | "Misdirected Request" | "Unprocessable Content" | "Locked" | "Failed Dependency" | "Too Early" | "Upgrade Required" | "Precondition Required" | "Too Many Requests" | "Request Header Fields Too Large" | "Unavailable For Legal Reasons" | "Internal Server Error" | "Not Implemented" | "Bad Gateway" | "Service Unavailable" | "Gateway Timeout" | "HTTP Version Not Supported" | "Variant Also Negotiates" | "Insufficient Storage" | "Loop Detected" | "Not Extended" | "Network Authentication Required" ? {
                    readonly Continue: 100;
                    readonly "Switching Protocols": 101;
                    readonly Processing: 102;
                    readonly "Early Hints": 103;
                    readonly OK: 200;
                    readonly Created: 201;
                    readonly Accepted: 202;
                    readonly "Non-Authoritative Information": 203;
                    readonly "No Content": 204;
                    readonly "Reset Content": 205;
                    readonly "Partial Content": 206;
                    readonly "Multi-Status": 207;
                    readonly "Already Reported": 208;
                    readonly "Multiple Choices": 300;
                    readonly "Moved Permanently": 301;
                    readonly Found: 302;
                    readonly "See Other": 303;
                    readonly "Not Modified": 304;
                    readonly "Temporary Redirect": 307;
                    readonly "Permanent Redirect": 308;
                    readonly "Bad Request": 400;
                    readonly Unauthorized: 401;
                    readonly "Payment Required": 402;
                    readonly Forbidden: 403;
                    readonly "Not Found": 404;
                    readonly "Method Not Allowed": 405;
                    readonly "Not Acceptable": 406;
                    readonly "Proxy Authentication Required": 407;
                    readonly "Request Timeout": 408;
                    readonly Conflict: 409;
                    readonly Gone: 410;
                    readonly "Length Required": 411;
                    readonly "Precondition Failed": 412;
                    readonly "Payload Too Large": 413;
                    readonly "URI Too Long": 414;
                    readonly "Unsupported Media Type": 415;
                    readonly "Range Not Satisfiable": 416;
                    readonly "Expectation Failed": 417;
                    readonly "I'm a teapot": 418;
                    readonly "Enhance Your Calm": 420;
                    readonly "Misdirected Request": 421;
                    readonly "Unprocessable Content": 422;
                    readonly Locked: 423;
                    readonly "Failed Dependency": 424;
                    readonly "Too Early": 425;
                    readonly "Upgrade Required": 426;
                    readonly "Precondition Required": 428;
                    readonly "Too Many Requests": 429;
                    readonly "Request Header Fields Too Large": 431;
                    readonly "Unavailable For Legal Reasons": 451;
                    readonly "Internal Server Error": 500;
                    readonly "Not Implemented": 501;
                    readonly "Bad Gateway": 502;
                    readonly "Service Unavailable": 503;
                    readonly "Gateway Timeout": 504;
                    readonly "HTTP Version Not Supported": 505;
                    readonly "Variant Also Negotiates": 506;
                    readonly "Insufficient Storage": 507;
                    readonly "Loop Detected": 508;
                    readonly "Not Extended": 510;
                    readonly "Network Authentication Required": 511;
                }[Code] : Code>;
            }) => Promise<import("elysia").ElysiaCustomStatusResponse<401, any, 401> | import("elysia").ElysiaCustomStatusResponse<403, {
                code: string;
                message: string;
            }, 403> | {
                sessionUser: Omit<{
                    id: string;
                    name: string;
                    email: string | null;
                    emailVerified: boolean;
                    image: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                    username: string | null;
                    displayUsername: string | null;
                    bio: string | null;
                    isGuest: boolean;
                    managedBy: string | null;
                    currencyId: string | null;
                    inviteToken: string | null;
                    role: string | null;
                    banned: boolean | null;
                    banReason: string | null;
                    banExpires: Date | null;
                    lastLoginMethod: string | null;
                    profileCompletedAt: Date | null;
                    deletedAt: Date | null;
                    guestState: "managed" | "archived" | "merged" | null;
                    guestClaimedAt: Date | null;
                    guestArchivedAt: Date | null;
                    guestMergedAt: Date | null;
                    mergedIntoUserId: string | null;
                }, "email" | "image"> & {
                    email: string;
                    image?: string | null;
                };
                session: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    expiresAt: Date;
                    token: string;
                    ipAddress?: string | null | undefined;
                    userAgent?: string | null | undefined;
                } | null;
            }>;
        };
        readonly "no-auth": {
            readonly resolve: ({ status, request: { headers } }: {
                body: unknown;
                query: Record<string, string>;
                params: {};
                headers: Record<string, string | undefined>;
                cookie: Record<string, import("elysia").Cookie<unknown>>;
                server: import("elysia/universal/server").Server | null;
                redirect: import("elysia").redirect;
                set: {
                    headers: import("elysia").HTTPHeaders;
                    status?: number | keyof import("elysia").StatusMap;
                    redirect?: string;
                    cookie?: Record<string, import("elysia/cookies").ElysiaCookie>;
                };
                path: string;
                route: string;
                request: Request;
                store: {
                    sessionUser: Omit<{
                        id: string;
                        name: string;
                        email: string | null;
                        emailVerified: boolean;
                        image: string | null;
                        createdAt: Date;
                        updatedAt: Date;
                        username: string | null;
                        displayUsername: string | null;
                        bio: string | null;
                        isGuest: boolean;
                        managedBy: string | null;
                        currencyId: string | null;
                        inviteToken: string | null;
                        role: string | null;
                        banned: boolean | null;
                        banReason: string | null;
                        banExpires: Date | null;
                        lastLoginMethod: string | null;
                        profileCompletedAt: Date | null;
                        deletedAt: Date | null;
                        guestState: "managed" | "archived" | "merged" | null;
                        guestClaimedAt: Date | null;
                        guestArchivedAt: Date | null;
                        guestMergedAt: Date | null;
                        mergedIntoUserId: string | null;
                    }, "email" | "image"> & {
                        email: string;
                        image?: string | null;
                    };
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        expiresAt: Date;
                        token: string;
                        ipAddress?: string | null | undefined;
                        userAgent?: string | null | undefined;
                    } | null;
                };
                status: <const Code extends number | keyof import("elysia").StatusMap, const T = Code extends 100 | 410 | 500 | 401 | 101 | 102 | 103 | 200 | 201 | 202 | 203 | 204 | 205 | 206 | 207 | 208 | 300 | 301 | 302 | 303 | 304 | 307 | 308 | 400 | 402 | 403 | 404 | 405 | 406 | 407 | 408 | 409 | 411 | 412 | 413 | 414 | 415 | 416 | 417 | 418 | 420 | 421 | 422 | 423 | 424 | 425 | 426 | 428 | 429 | 431 | 451 | 501 | 502 | 503 | 504 | 505 | 506 | 507 | 508 | 510 | 511 ? {
                    readonly 100: "Continue";
                    readonly 101: "Switching Protocols";
                    readonly 102: "Processing";
                    readonly 103: "Early Hints";
                    readonly 200: "OK";
                    readonly 201: "Created";
                    readonly 202: "Accepted";
                    readonly 203: "Non-Authoritative Information";
                    readonly 204: "No Content";
                    readonly 205: "Reset Content";
                    readonly 206: "Partial Content";
                    readonly 207: "Multi-Status";
                    readonly 208: "Already Reported";
                    readonly 300: "Multiple Choices";
                    readonly 301: "Moved Permanently";
                    readonly 302: "Found";
                    readonly 303: "See Other";
                    readonly 304: "Not Modified";
                    readonly 307: "Temporary Redirect";
                    readonly 308: "Permanent Redirect";
                    readonly 400: "Bad Request";
                    readonly 401: "Unauthorized";
                    readonly 402: "Payment Required";
                    readonly 403: "Forbidden";
                    readonly 404: "Not Found";
                    readonly 405: "Method Not Allowed";
                    readonly 406: "Not Acceptable";
                    readonly 407: "Proxy Authentication Required";
                    readonly 408: "Request Timeout";
                    readonly 409: "Conflict";
                    readonly 410: "Gone";
                    readonly 411: "Length Required";
                    readonly 412: "Precondition Failed";
                    readonly 413: "Payload Too Large";
                    readonly 414: "URI Too Long";
                    readonly 415: "Unsupported Media Type";
                    readonly 416: "Range Not Satisfiable";
                    readonly 417: "Expectation Failed";
                    readonly 418: "I'm a teapot";
                    readonly 420: "Enhance Your Calm";
                    readonly 421: "Misdirected Request";
                    readonly 422: "Unprocessable Content";
                    readonly 423: "Locked";
                    readonly 424: "Failed Dependency";
                    readonly 425: "Too Early";
                    readonly 426: "Upgrade Required";
                    readonly 428: "Precondition Required";
                    readonly 429: "Too Many Requests";
                    readonly 431: "Request Header Fields Too Large";
                    readonly 451: "Unavailable For Legal Reasons";
                    readonly 500: "Internal Server Error";
                    readonly 501: "Not Implemented";
                    readonly 502: "Bad Gateway";
                    readonly 503: "Service Unavailable";
                    readonly 504: "Gateway Timeout";
                    readonly 505: "HTTP Version Not Supported";
                    readonly 506: "Variant Also Negotiates";
                    readonly 507: "Insufficient Storage";
                    readonly 508: "Loop Detected";
                    readonly 510: "Not Extended";
                    readonly 511: "Network Authentication Required";
                }[Code] : Code>(code: Code, response?: T) => import("elysia").ElysiaCustomStatusResponse<Code, T, Code extends "Continue" | "Switching Protocols" | "Processing" | "Early Hints" | "OK" | "Created" | "Accepted" | "Non-Authoritative Information" | "No Content" | "Reset Content" | "Partial Content" | "Multi-Status" | "Already Reported" | "Multiple Choices" | "Moved Permanently" | "Found" | "See Other" | "Not Modified" | "Temporary Redirect" | "Permanent Redirect" | "Bad Request" | "Unauthorized" | "Payment Required" | "Forbidden" | "Not Found" | "Method Not Allowed" | "Not Acceptable" | "Proxy Authentication Required" | "Request Timeout" | "Conflict" | "Gone" | "Length Required" | "Precondition Failed" | "Payload Too Large" | "URI Too Long" | "Unsupported Media Type" | "Range Not Satisfiable" | "Expectation Failed" | "I'm a teapot" | "Enhance Your Calm" | "Misdirected Request" | "Unprocessable Content" | "Locked" | "Failed Dependency" | "Too Early" | "Upgrade Required" | "Precondition Required" | "Too Many Requests" | "Request Header Fields Too Large" | "Unavailable For Legal Reasons" | "Internal Server Error" | "Not Implemented" | "Bad Gateway" | "Service Unavailable" | "Gateway Timeout" | "HTTP Version Not Supported" | "Variant Also Negotiates" | "Insufficient Storage" | "Loop Detected" | "Not Extended" | "Network Authentication Required" ? {
                    readonly Continue: 100;
                    readonly "Switching Protocols": 101;
                    readonly Processing: 102;
                    readonly "Early Hints": 103;
                    readonly OK: 200;
                    readonly Created: 201;
                    readonly Accepted: 202;
                    readonly "Non-Authoritative Information": 203;
                    readonly "No Content": 204;
                    readonly "Reset Content": 205;
                    readonly "Partial Content": 206;
                    readonly "Multi-Status": 207;
                    readonly "Already Reported": 208;
                    readonly "Multiple Choices": 300;
                    readonly "Moved Permanently": 301;
                    readonly Found: 302;
                    readonly "See Other": 303;
                    readonly "Not Modified": 304;
                    readonly "Temporary Redirect": 307;
                    readonly "Permanent Redirect": 308;
                    readonly "Bad Request": 400;
                    readonly Unauthorized: 401;
                    readonly "Payment Required": 402;
                    readonly Forbidden: 403;
                    readonly "Not Found": 404;
                    readonly "Method Not Allowed": 405;
                    readonly "Not Acceptable": 406;
                    readonly "Proxy Authentication Required": 407;
                    readonly "Request Timeout": 408;
                    readonly Conflict: 409;
                    readonly Gone: 410;
                    readonly "Length Required": 411;
                    readonly "Precondition Failed": 412;
                    readonly "Payload Too Large": 413;
                    readonly "URI Too Long": 414;
                    readonly "Unsupported Media Type": 415;
                    readonly "Range Not Satisfiable": 416;
                    readonly "Expectation Failed": 417;
                    readonly "I'm a teapot": 418;
                    readonly "Enhance Your Calm": 420;
                    readonly "Misdirected Request": 421;
                    readonly "Unprocessable Content": 422;
                    readonly Locked: 423;
                    readonly "Failed Dependency": 424;
                    readonly "Too Early": 425;
                    readonly "Upgrade Required": 426;
                    readonly "Precondition Required": 428;
                    readonly "Too Many Requests": 429;
                    readonly "Request Header Fields Too Large": 431;
                    readonly "Unavailable For Legal Reasons": 451;
                    readonly "Internal Server Error": 500;
                    readonly "Not Implemented": 501;
                    readonly "Bad Gateway": 502;
                    readonly "Service Unavailable": 503;
                    readonly "Gateway Timeout": 504;
                    readonly "HTTP Version Not Supported": 505;
                    readonly "Variant Also Negotiates": 506;
                    readonly "Insufficient Storage": 507;
                    readonly "Loop Detected": 508;
                    readonly "Not Extended": 510;
                    readonly "Network Authentication Required": 511;
                }[Code] : Code>;
            }) => Promise<import("elysia").ElysiaCustomStatusResponse<403, any, 403> | undefined>;
        };
    } & {
        readonly friendship: {
            readonly resolve: ({ status, store, params }: {
                body: unknown;
                query: Record<string, string>;
                params: {};
                headers: Record<string, string | undefined>;
                cookie: Record<string, import("elysia").Cookie<unknown>>;
                server: import("elysia/universal/server").Server | null;
                redirect: import("elysia").redirect;
                set: {
                    headers: import("elysia").HTTPHeaders;
                    status?: number | keyof import("elysia").StatusMap;
                    redirect?: string;
                    cookie?: Record<string, import("elysia/cookies").ElysiaCookie>;
                };
                path: string;
                route: string;
                request: Request;
                store: {
                    sessionUser: Omit<{
                        id: string;
                        name: string;
                        email: string | null;
                        emailVerified: boolean;
                        image: string | null;
                        createdAt: Date;
                        updatedAt: Date;
                        username: string | null;
                        displayUsername: string | null;
                        bio: string | null;
                        isGuest: boolean;
                        managedBy: string | null;
                        currencyId: string | null;
                        inviteToken: string | null;
                        role: string | null;
                        banned: boolean | null;
                        banReason: string | null;
                        banExpires: Date | null;
                        lastLoginMethod: string | null;
                        profileCompletedAt: Date | null;
                        deletedAt: Date | null;
                        guestState: "managed" | "archived" | "merged" | null;
                        guestClaimedAt: Date | null;
                        guestArchivedAt: Date | null;
                        guestMergedAt: Date | null;
                        mergedIntoUserId: string | null;
                    }, "email" | "image"> & {
                        email: string;
                        image?: string | null;
                    };
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        expiresAt: Date;
                        token: string;
                        ipAddress?: string | null | undefined;
                        userAgent?: string | null | undefined;
                    } | null;
                };
                status: <const Code extends number | keyof import("elysia").StatusMap, const T = Code extends 100 | 410 | 500 | 401 | 101 | 102 | 103 | 200 | 201 | 202 | 203 | 204 | 205 | 206 | 207 | 208 | 300 | 301 | 302 | 303 | 304 | 307 | 308 | 400 | 402 | 403 | 404 | 405 | 406 | 407 | 408 | 409 | 411 | 412 | 413 | 414 | 415 | 416 | 417 | 418 | 420 | 421 | 422 | 423 | 424 | 425 | 426 | 428 | 429 | 431 | 451 | 501 | 502 | 503 | 504 | 505 | 506 | 507 | 508 | 510 | 511 ? {
                    readonly 100: "Continue";
                    readonly 101: "Switching Protocols";
                    readonly 102: "Processing";
                    readonly 103: "Early Hints";
                    readonly 200: "OK";
                    readonly 201: "Created";
                    readonly 202: "Accepted";
                    readonly 203: "Non-Authoritative Information";
                    readonly 204: "No Content";
                    readonly 205: "Reset Content";
                    readonly 206: "Partial Content";
                    readonly 207: "Multi-Status";
                    readonly 208: "Already Reported";
                    readonly 300: "Multiple Choices";
                    readonly 301: "Moved Permanently";
                    readonly 302: "Found";
                    readonly 303: "See Other";
                    readonly 304: "Not Modified";
                    readonly 307: "Temporary Redirect";
                    readonly 308: "Permanent Redirect";
                    readonly 400: "Bad Request";
                    readonly 401: "Unauthorized";
                    readonly 402: "Payment Required";
                    readonly 403: "Forbidden";
                    readonly 404: "Not Found";
                    readonly 405: "Method Not Allowed";
                    readonly 406: "Not Acceptable";
                    readonly 407: "Proxy Authentication Required";
                    readonly 408: "Request Timeout";
                    readonly 409: "Conflict";
                    readonly 410: "Gone";
                    readonly 411: "Length Required";
                    readonly 412: "Precondition Failed";
                    readonly 413: "Payload Too Large";
                    readonly 414: "URI Too Long";
                    readonly 415: "Unsupported Media Type";
                    readonly 416: "Range Not Satisfiable";
                    readonly 417: "Expectation Failed";
                    readonly 418: "I'm a teapot";
                    readonly 420: "Enhance Your Calm";
                    readonly 421: "Misdirected Request";
                    readonly 422: "Unprocessable Content";
                    readonly 423: "Locked";
                    readonly 424: "Failed Dependency";
                    readonly 425: "Too Early";
                    readonly 426: "Upgrade Required";
                    readonly 428: "Precondition Required";
                    readonly 429: "Too Many Requests";
                    readonly 431: "Request Header Fields Too Large";
                    readonly 451: "Unavailable For Legal Reasons";
                    readonly 500: "Internal Server Error";
                    readonly 501: "Not Implemented";
                    readonly 502: "Bad Gateway";
                    readonly 503: "Service Unavailable";
                    readonly 504: "Gateway Timeout";
                    readonly 505: "HTTP Version Not Supported";
                    readonly 506: "Variant Also Negotiates";
                    readonly 507: "Insufficient Storage";
                    readonly 508: "Loop Detected";
                    readonly 510: "Not Extended";
                    readonly 511: "Network Authentication Required";
                }[Code] : Code>(code: Code, response?: T) => import("elysia").ElysiaCustomStatusResponse<Code, T, Code extends "Continue" | "Switching Protocols" | "Processing" | "Early Hints" | "OK" | "Created" | "Accepted" | "Non-Authoritative Information" | "No Content" | "Reset Content" | "Partial Content" | "Multi-Status" | "Already Reported" | "Multiple Choices" | "Moved Permanently" | "Found" | "See Other" | "Not Modified" | "Temporary Redirect" | "Permanent Redirect" | "Bad Request" | "Unauthorized" | "Payment Required" | "Forbidden" | "Not Found" | "Method Not Allowed" | "Not Acceptable" | "Proxy Authentication Required" | "Request Timeout" | "Conflict" | "Gone" | "Length Required" | "Precondition Failed" | "Payload Too Large" | "URI Too Long" | "Unsupported Media Type" | "Range Not Satisfiable" | "Expectation Failed" | "I'm a teapot" | "Enhance Your Calm" | "Misdirected Request" | "Unprocessable Content" | "Locked" | "Failed Dependency" | "Too Early" | "Upgrade Required" | "Precondition Required" | "Too Many Requests" | "Request Header Fields Too Large" | "Unavailable For Legal Reasons" | "Internal Server Error" | "Not Implemented" | "Bad Gateway" | "Service Unavailable" | "Gateway Timeout" | "HTTP Version Not Supported" | "Variant Also Negotiates" | "Insufficient Storage" | "Loop Detected" | "Not Extended" | "Network Authentication Required" ? {
                    readonly Continue: 100;
                    readonly "Switching Protocols": 101;
                    readonly Processing: 102;
                    readonly "Early Hints": 103;
                    readonly OK: 200;
                    readonly Created: 201;
                    readonly Accepted: 202;
                    readonly "Non-Authoritative Information": 203;
                    readonly "No Content": 204;
                    readonly "Reset Content": 205;
                    readonly "Partial Content": 206;
                    readonly "Multi-Status": 207;
                    readonly "Already Reported": 208;
                    readonly "Multiple Choices": 300;
                    readonly "Moved Permanently": 301;
                    readonly Found: 302;
                    readonly "See Other": 303;
                    readonly "Not Modified": 304;
                    readonly "Temporary Redirect": 307;
                    readonly "Permanent Redirect": 308;
                    readonly "Bad Request": 400;
                    readonly Unauthorized: 401;
                    readonly "Payment Required": 402;
                    readonly Forbidden: 403;
                    readonly "Not Found": 404;
                    readonly "Method Not Allowed": 405;
                    readonly "Not Acceptable": 406;
                    readonly "Proxy Authentication Required": 407;
                    readonly "Request Timeout": 408;
                    readonly Conflict: 409;
                    readonly Gone: 410;
                    readonly "Length Required": 411;
                    readonly "Precondition Failed": 412;
                    readonly "Payload Too Large": 413;
                    readonly "URI Too Long": 414;
                    readonly "Unsupported Media Type": 415;
                    readonly "Range Not Satisfiable": 416;
                    readonly "Expectation Failed": 417;
                    readonly "I'm a teapot": 418;
                    readonly "Enhance Your Calm": 420;
                    readonly "Misdirected Request": 421;
                    readonly "Unprocessable Content": 422;
                    readonly Locked: 423;
                    readonly "Failed Dependency": 424;
                    readonly "Too Early": 425;
                    readonly "Upgrade Required": 426;
                    readonly "Precondition Required": 428;
                    readonly "Too Many Requests": 429;
                    readonly "Request Header Fields Too Large": 431;
                    readonly "Unavailable For Legal Reasons": 451;
                    readonly "Internal Server Error": 500;
                    readonly "Not Implemented": 501;
                    readonly "Bad Gateway": 502;
                    readonly "Service Unavailable": 503;
                    readonly "Gateway Timeout": 504;
                    readonly "HTTP Version Not Supported": 505;
                    readonly "Variant Also Negotiates": 506;
                    readonly "Insufficient Storage": 507;
                    readonly "Loop Detected": 508;
                    readonly "Not Extended": 510;
                    readonly "Network Authentication Required": 511;
                }[Code] : Code>;
            }) => Promise<import("elysia").ElysiaCustomStatusResponse<403, any, 403> | import("elysia").ElysiaCustomStatusResponse<404, any, 404> | {
                friendship: {
                    id: string;
                    userId1: string;
                    userId2: string;
                    status: "deleted" | "pending" | "accepted" | "rejected";
                    requestedById: string;
                    acceptedAt: Date | null;
                    createdAt: Date;
                    updatedAt: Date;
                };
                sessionUser: Omit<{
                    id: string;
                    name: string;
                    email: string | null;
                    emailVerified: boolean;
                    image: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                    username: string | null;
                    displayUsername: string | null;
                    bio: string | null;
                    isGuest: boolean;
                    managedBy: string | null;
                    currencyId: string | null;
                    inviteToken: string | null;
                    role: string | null;
                    banned: boolean | null;
                    banReason: string | null;
                    banExpires: Date | null;
                    lastLoginMethod: string | null;
                    profileCompletedAt: Date | null;
                    deletedAt: Date | null;
                    guestState: "managed" | "archived" | "merged" | null;
                    guestClaimedAt: Date | null;
                    guestArchivedAt: Date | null;
                    guestMergedAt: Date | null;
                    mergedIntoUserId: string | null;
                }, "email" | "image"> & {
                    email: string;
                    image?: string | null;
                };
            }>;
        };
        readonly acceptedFriendship: {
            readonly resolve: ({ status, store, params }: {
                body: unknown;
                query: Record<string, string>;
                params: {};
                headers: Record<string, string | undefined>;
                cookie: Record<string, import("elysia").Cookie<unknown>>;
                server: import("elysia/universal/server").Server | null;
                redirect: import("elysia").redirect;
                set: {
                    headers: import("elysia").HTTPHeaders;
                    status?: number | keyof import("elysia").StatusMap;
                    redirect?: string;
                    cookie?: Record<string, import("elysia/cookies").ElysiaCookie>;
                };
                path: string;
                route: string;
                request: Request;
                store: {
                    sessionUser: Omit<{
                        id: string;
                        name: string;
                        email: string | null;
                        emailVerified: boolean;
                        image: string | null;
                        createdAt: Date;
                        updatedAt: Date;
                        username: string | null;
                        displayUsername: string | null;
                        bio: string | null;
                        isGuest: boolean;
                        managedBy: string | null;
                        currencyId: string | null;
                        inviteToken: string | null;
                        role: string | null;
                        banned: boolean | null;
                        banReason: string | null;
                        banExpires: Date | null;
                        lastLoginMethod: string | null;
                        profileCompletedAt: Date | null;
                        deletedAt: Date | null;
                        guestState: "managed" | "archived" | "merged" | null;
                        guestClaimedAt: Date | null;
                        guestArchivedAt: Date | null;
                        guestMergedAt: Date | null;
                        mergedIntoUserId: string | null;
                    }, "email" | "image"> & {
                        email: string;
                        image?: string | null;
                    };
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        expiresAt: Date;
                        token: string;
                        ipAddress?: string | null | undefined;
                        userAgent?: string | null | undefined;
                    } | null;
                };
                status: <const Code extends number | keyof import("elysia").StatusMap, const T = Code extends 100 | 410 | 500 | 401 | 101 | 102 | 103 | 200 | 201 | 202 | 203 | 204 | 205 | 206 | 207 | 208 | 300 | 301 | 302 | 303 | 304 | 307 | 308 | 400 | 402 | 403 | 404 | 405 | 406 | 407 | 408 | 409 | 411 | 412 | 413 | 414 | 415 | 416 | 417 | 418 | 420 | 421 | 422 | 423 | 424 | 425 | 426 | 428 | 429 | 431 | 451 | 501 | 502 | 503 | 504 | 505 | 506 | 507 | 508 | 510 | 511 ? {
                    readonly 100: "Continue";
                    readonly 101: "Switching Protocols";
                    readonly 102: "Processing";
                    readonly 103: "Early Hints";
                    readonly 200: "OK";
                    readonly 201: "Created";
                    readonly 202: "Accepted";
                    readonly 203: "Non-Authoritative Information";
                    readonly 204: "No Content";
                    readonly 205: "Reset Content";
                    readonly 206: "Partial Content";
                    readonly 207: "Multi-Status";
                    readonly 208: "Already Reported";
                    readonly 300: "Multiple Choices";
                    readonly 301: "Moved Permanently";
                    readonly 302: "Found";
                    readonly 303: "See Other";
                    readonly 304: "Not Modified";
                    readonly 307: "Temporary Redirect";
                    readonly 308: "Permanent Redirect";
                    readonly 400: "Bad Request";
                    readonly 401: "Unauthorized";
                    readonly 402: "Payment Required";
                    readonly 403: "Forbidden";
                    readonly 404: "Not Found";
                    readonly 405: "Method Not Allowed";
                    readonly 406: "Not Acceptable";
                    readonly 407: "Proxy Authentication Required";
                    readonly 408: "Request Timeout";
                    readonly 409: "Conflict";
                    readonly 410: "Gone";
                    readonly 411: "Length Required";
                    readonly 412: "Precondition Failed";
                    readonly 413: "Payload Too Large";
                    readonly 414: "URI Too Long";
                    readonly 415: "Unsupported Media Type";
                    readonly 416: "Range Not Satisfiable";
                    readonly 417: "Expectation Failed";
                    readonly 418: "I'm a teapot";
                    readonly 420: "Enhance Your Calm";
                    readonly 421: "Misdirected Request";
                    readonly 422: "Unprocessable Content";
                    readonly 423: "Locked";
                    readonly 424: "Failed Dependency";
                    readonly 425: "Too Early";
                    readonly 426: "Upgrade Required";
                    readonly 428: "Precondition Required";
                    readonly 429: "Too Many Requests";
                    readonly 431: "Request Header Fields Too Large";
                    readonly 451: "Unavailable For Legal Reasons";
                    readonly 500: "Internal Server Error";
                    readonly 501: "Not Implemented";
                    readonly 502: "Bad Gateway";
                    readonly 503: "Service Unavailable";
                    readonly 504: "Gateway Timeout";
                    readonly 505: "HTTP Version Not Supported";
                    readonly 506: "Variant Also Negotiates";
                    readonly 507: "Insufficient Storage";
                    readonly 508: "Loop Detected";
                    readonly 510: "Not Extended";
                    readonly 511: "Network Authentication Required";
                }[Code] : Code>(code: Code, response?: T) => import("elysia").ElysiaCustomStatusResponse<Code, T, Code extends "Continue" | "Switching Protocols" | "Processing" | "Early Hints" | "OK" | "Created" | "Accepted" | "Non-Authoritative Information" | "No Content" | "Reset Content" | "Partial Content" | "Multi-Status" | "Already Reported" | "Multiple Choices" | "Moved Permanently" | "Found" | "See Other" | "Not Modified" | "Temporary Redirect" | "Permanent Redirect" | "Bad Request" | "Unauthorized" | "Payment Required" | "Forbidden" | "Not Found" | "Method Not Allowed" | "Not Acceptable" | "Proxy Authentication Required" | "Request Timeout" | "Conflict" | "Gone" | "Length Required" | "Precondition Failed" | "Payload Too Large" | "URI Too Long" | "Unsupported Media Type" | "Range Not Satisfiable" | "Expectation Failed" | "I'm a teapot" | "Enhance Your Calm" | "Misdirected Request" | "Unprocessable Content" | "Locked" | "Failed Dependency" | "Too Early" | "Upgrade Required" | "Precondition Required" | "Too Many Requests" | "Request Header Fields Too Large" | "Unavailable For Legal Reasons" | "Internal Server Error" | "Not Implemented" | "Bad Gateway" | "Service Unavailable" | "Gateway Timeout" | "HTTP Version Not Supported" | "Variant Also Negotiates" | "Insufficient Storage" | "Loop Detected" | "Not Extended" | "Network Authentication Required" ? {
                    readonly Continue: 100;
                    readonly "Switching Protocols": 101;
                    readonly Processing: 102;
                    readonly "Early Hints": 103;
                    readonly OK: 200;
                    readonly Created: 201;
                    readonly Accepted: 202;
                    readonly "Non-Authoritative Information": 203;
                    readonly "No Content": 204;
                    readonly "Reset Content": 205;
                    readonly "Partial Content": 206;
                    readonly "Multi-Status": 207;
                    readonly "Already Reported": 208;
                    readonly "Multiple Choices": 300;
                    readonly "Moved Permanently": 301;
                    readonly Found: 302;
                    readonly "See Other": 303;
                    readonly "Not Modified": 304;
                    readonly "Temporary Redirect": 307;
                    readonly "Permanent Redirect": 308;
                    readonly "Bad Request": 400;
                    readonly Unauthorized: 401;
                    readonly "Payment Required": 402;
                    readonly Forbidden: 403;
                    readonly "Not Found": 404;
                    readonly "Method Not Allowed": 405;
                    readonly "Not Acceptable": 406;
                    readonly "Proxy Authentication Required": 407;
                    readonly "Request Timeout": 408;
                    readonly Conflict: 409;
                    readonly Gone: 410;
                    readonly "Length Required": 411;
                    readonly "Precondition Failed": 412;
                    readonly "Payload Too Large": 413;
                    readonly "URI Too Long": 414;
                    readonly "Unsupported Media Type": 415;
                    readonly "Range Not Satisfiable": 416;
                    readonly "Expectation Failed": 417;
                    readonly "I'm a teapot": 418;
                    readonly "Enhance Your Calm": 420;
                    readonly "Misdirected Request": 421;
                    readonly "Unprocessable Content": 422;
                    readonly Locked: 423;
                    readonly "Failed Dependency": 424;
                    readonly "Too Early": 425;
                    readonly "Upgrade Required": 426;
                    readonly "Precondition Required": 428;
                    readonly "Too Many Requests": 429;
                    readonly "Request Header Fields Too Large": 431;
                    readonly "Unavailable For Legal Reasons": 451;
                    readonly "Internal Server Error": 500;
                    readonly "Not Implemented": 501;
                    readonly "Bad Gateway": 502;
                    readonly "Service Unavailable": 503;
                    readonly "Gateway Timeout": 504;
                    readonly "HTTP Version Not Supported": 505;
                    readonly "Variant Also Negotiates": 506;
                    readonly "Insufficient Storage": 507;
                    readonly "Loop Detected": 508;
                    readonly "Not Extended": 510;
                    readonly "Network Authentication Required": 511;
                }[Code] : Code>;
            }) => Promise<import("elysia").ElysiaCustomStatusResponse<403, any, 403> | import("elysia").ElysiaCustomStatusResponse<404, any, 404> | {
                friendship: {
                    id: string;
                    userId1: string;
                    userId2: string;
                    status: "deleted" | "pending" | "accepted" | "rejected";
                    requestedById: string;
                    acceptedAt: Date | null;
                    createdAt: Date;
                    updatedAt: Date;
                };
                sessionUser: Omit<{
                    id: string;
                    name: string;
                    email: string | null;
                    emailVerified: boolean;
                    image: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                    username: string | null;
                    displayUsername: string | null;
                    bio: string | null;
                    isGuest: boolean;
                    managedBy: string | null;
                    currencyId: string | null;
                    inviteToken: string | null;
                    role: string | null;
                    banned: boolean | null;
                    banReason: string | null;
                    banExpires: Date | null;
                    lastLoginMethod: string | null;
                    profileCompletedAt: Date | null;
                    deletedAt: Date | null;
                    guestState: "managed" | "archived" | "merged" | null;
                    guestClaimedAt: Date | null;
                    guestArchivedAt: Date | null;
                    guestMergedAt: Date | null;
                    mergedIntoUserId: string | null;
                }, "email" | "image"> & {
                    email: string;
                    image?: string | null;
                };
            }>;
        };
    };
    parser: {};
    response: {};
} & {
    schema: {};
    standaloneSchema: {};
    macro: Partial<{
        readonly auth: boolean;
        readonly "no-auth": boolean;
    }> & Partial<{
        readonly notificationOwner: boolean;
    }>;
    macroFn: {
        readonly auth: {
            readonly resolve: ({ request, status, store }: {
                body: unknown;
                query: Record<string, string>;
                params: {};
                headers: Record<string, string | undefined>;
                cookie: Record<string, import("elysia").Cookie<unknown>>;
                server: import("elysia/universal/server").Server | null;
                redirect: import("elysia").redirect;
                set: {
                    headers: import("elysia").HTTPHeaders;
                    status?: number | keyof import("elysia").StatusMap;
                    redirect?: string;
                    cookie?: Record<string, import("elysia/cookies").ElysiaCookie>;
                };
                path: string;
                route: string;
                request: Request;
                store: {
                    sessionUser: Omit<{
                        id: string;
                        name: string;
                        email: string | null;
                        emailVerified: boolean;
                        image: string | null;
                        createdAt: Date;
                        updatedAt: Date;
                        username: string | null;
                        displayUsername: string | null;
                        bio: string | null;
                        isGuest: boolean;
                        managedBy: string | null;
                        currencyId: string | null;
                        inviteToken: string | null;
                        role: string | null;
                        banned: boolean | null;
                        banReason: string | null;
                        banExpires: Date | null;
                        lastLoginMethod: string | null;
                        profileCompletedAt: Date | null;
                        deletedAt: Date | null;
                        guestState: "managed" | "archived" | "merged" | null;
                        guestClaimedAt: Date | null;
                        guestArchivedAt: Date | null;
                        guestMergedAt: Date | null;
                        mergedIntoUserId: string | null;
                    }, "email" | "image"> & {
                        email: string;
                        image?: string | null;
                    };
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        expiresAt: Date;
                        token: string;
                        ipAddress?: string | null | undefined;
                        userAgent?: string | null | undefined;
                    } | null;
                };
                status: <const Code extends number | keyof import("elysia").StatusMap, const T = Code extends 100 | 410 | 500 | 401 | 101 | 102 | 103 | 200 | 201 | 202 | 203 | 204 | 205 | 206 | 207 | 208 | 300 | 301 | 302 | 303 | 304 | 307 | 308 | 400 | 402 | 403 | 404 | 405 | 406 | 407 | 408 | 409 | 411 | 412 | 413 | 414 | 415 | 416 | 417 | 418 | 420 | 421 | 422 | 423 | 424 | 425 | 426 | 428 | 429 | 431 | 451 | 501 | 502 | 503 | 504 | 505 | 506 | 507 | 508 | 510 | 511 ? {
                    readonly 100: "Continue";
                    readonly 101: "Switching Protocols";
                    readonly 102: "Processing";
                    readonly 103: "Early Hints";
                    readonly 200: "OK";
                    readonly 201: "Created";
                    readonly 202: "Accepted";
                    readonly 203: "Non-Authoritative Information";
                    readonly 204: "No Content";
                    readonly 205: "Reset Content";
                    readonly 206: "Partial Content";
                    readonly 207: "Multi-Status";
                    readonly 208: "Already Reported";
                    readonly 300: "Multiple Choices";
                    readonly 301: "Moved Permanently";
                    readonly 302: "Found";
                    readonly 303: "See Other";
                    readonly 304: "Not Modified";
                    readonly 307: "Temporary Redirect";
                    readonly 308: "Permanent Redirect";
                    readonly 400: "Bad Request";
                    readonly 401: "Unauthorized";
                    readonly 402: "Payment Required";
                    readonly 403: "Forbidden";
                    readonly 404: "Not Found";
                    readonly 405: "Method Not Allowed";
                    readonly 406: "Not Acceptable";
                    readonly 407: "Proxy Authentication Required";
                    readonly 408: "Request Timeout";
                    readonly 409: "Conflict";
                    readonly 410: "Gone";
                    readonly 411: "Length Required";
                    readonly 412: "Precondition Failed";
                    readonly 413: "Payload Too Large";
                    readonly 414: "URI Too Long";
                    readonly 415: "Unsupported Media Type";
                    readonly 416: "Range Not Satisfiable";
                    readonly 417: "Expectation Failed";
                    readonly 418: "I'm a teapot";
                    readonly 420: "Enhance Your Calm";
                    readonly 421: "Misdirected Request";
                    readonly 422: "Unprocessable Content";
                    readonly 423: "Locked";
                    readonly 424: "Failed Dependency";
                    readonly 425: "Too Early";
                    readonly 426: "Upgrade Required";
                    readonly 428: "Precondition Required";
                    readonly 429: "Too Many Requests";
                    readonly 431: "Request Header Fields Too Large";
                    readonly 451: "Unavailable For Legal Reasons";
                    readonly 500: "Internal Server Error";
                    readonly 501: "Not Implemented";
                    readonly 502: "Bad Gateway";
                    readonly 503: "Service Unavailable";
                    readonly 504: "Gateway Timeout";
                    readonly 505: "HTTP Version Not Supported";
                    readonly 506: "Variant Also Negotiates";
                    readonly 507: "Insufficient Storage";
                    readonly 508: "Loop Detected";
                    readonly 510: "Not Extended";
                    readonly 511: "Network Authentication Required";
                }[Code] : Code>(code: Code, response?: T) => import("elysia").ElysiaCustomStatusResponse<Code, T, Code extends "Continue" | "Switching Protocols" | "Processing" | "Early Hints" | "OK" | "Created" | "Accepted" | "Non-Authoritative Information" | "No Content" | "Reset Content" | "Partial Content" | "Multi-Status" | "Already Reported" | "Multiple Choices" | "Moved Permanently" | "Found" | "See Other" | "Not Modified" | "Temporary Redirect" | "Permanent Redirect" | "Bad Request" | "Unauthorized" | "Payment Required" | "Forbidden" | "Not Found" | "Method Not Allowed" | "Not Acceptable" | "Proxy Authentication Required" | "Request Timeout" | "Conflict" | "Gone" | "Length Required" | "Precondition Failed" | "Payload Too Large" | "URI Too Long" | "Unsupported Media Type" | "Range Not Satisfiable" | "Expectation Failed" | "I'm a teapot" | "Enhance Your Calm" | "Misdirected Request" | "Unprocessable Content" | "Locked" | "Failed Dependency" | "Too Early" | "Upgrade Required" | "Precondition Required" | "Too Many Requests" | "Request Header Fields Too Large" | "Unavailable For Legal Reasons" | "Internal Server Error" | "Not Implemented" | "Bad Gateway" | "Service Unavailable" | "Gateway Timeout" | "HTTP Version Not Supported" | "Variant Also Negotiates" | "Insufficient Storage" | "Loop Detected" | "Not Extended" | "Network Authentication Required" ? {
                    readonly Continue: 100;
                    readonly "Switching Protocols": 101;
                    readonly Processing: 102;
                    readonly "Early Hints": 103;
                    readonly OK: 200;
                    readonly Created: 201;
                    readonly Accepted: 202;
                    readonly "Non-Authoritative Information": 203;
                    readonly "No Content": 204;
                    readonly "Reset Content": 205;
                    readonly "Partial Content": 206;
                    readonly "Multi-Status": 207;
                    readonly "Already Reported": 208;
                    readonly "Multiple Choices": 300;
                    readonly "Moved Permanently": 301;
                    readonly Found: 302;
                    readonly "See Other": 303;
                    readonly "Not Modified": 304;
                    readonly "Temporary Redirect": 307;
                    readonly "Permanent Redirect": 308;
                    readonly "Bad Request": 400;
                    readonly Unauthorized: 401;
                    readonly "Payment Required": 402;
                    readonly Forbidden: 403;
                    readonly "Not Found": 404;
                    readonly "Method Not Allowed": 405;
                    readonly "Not Acceptable": 406;
                    readonly "Proxy Authentication Required": 407;
                    readonly "Request Timeout": 408;
                    readonly Conflict: 409;
                    readonly Gone: 410;
                    readonly "Length Required": 411;
                    readonly "Precondition Failed": 412;
                    readonly "Payload Too Large": 413;
                    readonly "URI Too Long": 414;
                    readonly "Unsupported Media Type": 415;
                    readonly "Range Not Satisfiable": 416;
                    readonly "Expectation Failed": 417;
                    readonly "I'm a teapot": 418;
                    readonly "Enhance Your Calm": 420;
                    readonly "Misdirected Request": 421;
                    readonly "Unprocessable Content": 422;
                    readonly Locked: 423;
                    readonly "Failed Dependency": 424;
                    readonly "Too Early": 425;
                    readonly "Upgrade Required": 426;
                    readonly "Precondition Required": 428;
                    readonly "Too Many Requests": 429;
                    readonly "Request Header Fields Too Large": 431;
                    readonly "Unavailable For Legal Reasons": 451;
                    readonly "Internal Server Error": 500;
                    readonly "Not Implemented": 501;
                    readonly "Bad Gateway": 502;
                    readonly "Service Unavailable": 503;
                    readonly "Gateway Timeout": 504;
                    readonly "HTTP Version Not Supported": 505;
                    readonly "Variant Also Negotiates": 506;
                    readonly "Insufficient Storage": 507;
                    readonly "Loop Detected": 508;
                    readonly "Not Extended": 510;
                    readonly "Network Authentication Required": 511;
                }[Code] : Code>;
            }) => Promise<import("elysia").ElysiaCustomStatusResponse<401, any, 401> | import("elysia").ElysiaCustomStatusResponse<403, {
                code: string;
                message: string;
            }, 403> | {
                sessionUser: Omit<{
                    id: string;
                    name: string;
                    email: string | null;
                    emailVerified: boolean;
                    image: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                    username: string | null;
                    displayUsername: string | null;
                    bio: string | null;
                    isGuest: boolean;
                    managedBy: string | null;
                    currencyId: string | null;
                    inviteToken: string | null;
                    role: string | null;
                    banned: boolean | null;
                    banReason: string | null;
                    banExpires: Date | null;
                    lastLoginMethod: string | null;
                    profileCompletedAt: Date | null;
                    deletedAt: Date | null;
                    guestState: "managed" | "archived" | "merged" | null;
                    guestClaimedAt: Date | null;
                    guestArchivedAt: Date | null;
                    guestMergedAt: Date | null;
                    mergedIntoUserId: string | null;
                }, "email" | "image"> & {
                    email: string;
                    image?: string | null;
                };
                session: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    expiresAt: Date;
                    token: string;
                    ipAddress?: string | null | undefined;
                    userAgent?: string | null | undefined;
                } | null;
            }>;
        };
        readonly "no-auth": {
            readonly resolve: ({ status, request: { headers } }: {
                body: unknown;
                query: Record<string, string>;
                params: {};
                headers: Record<string, string | undefined>;
                cookie: Record<string, import("elysia").Cookie<unknown>>;
                server: import("elysia/universal/server").Server | null;
                redirect: import("elysia").redirect;
                set: {
                    headers: import("elysia").HTTPHeaders;
                    status?: number | keyof import("elysia").StatusMap;
                    redirect?: string;
                    cookie?: Record<string, import("elysia/cookies").ElysiaCookie>;
                };
                path: string;
                route: string;
                request: Request;
                store: {
                    sessionUser: Omit<{
                        id: string;
                        name: string;
                        email: string | null;
                        emailVerified: boolean;
                        image: string | null;
                        createdAt: Date;
                        updatedAt: Date;
                        username: string | null;
                        displayUsername: string | null;
                        bio: string | null;
                        isGuest: boolean;
                        managedBy: string | null;
                        currencyId: string | null;
                        inviteToken: string | null;
                        role: string | null;
                        banned: boolean | null;
                        banReason: string | null;
                        banExpires: Date | null;
                        lastLoginMethod: string | null;
                        profileCompletedAt: Date | null;
                        deletedAt: Date | null;
                        guestState: "managed" | "archived" | "merged" | null;
                        guestClaimedAt: Date | null;
                        guestArchivedAt: Date | null;
                        guestMergedAt: Date | null;
                        mergedIntoUserId: string | null;
                    }, "email" | "image"> & {
                        email: string;
                        image?: string | null;
                    };
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        expiresAt: Date;
                        token: string;
                        ipAddress?: string | null | undefined;
                        userAgent?: string | null | undefined;
                    } | null;
                };
                status: <const Code extends number | keyof import("elysia").StatusMap, const T = Code extends 100 | 410 | 500 | 401 | 101 | 102 | 103 | 200 | 201 | 202 | 203 | 204 | 205 | 206 | 207 | 208 | 300 | 301 | 302 | 303 | 304 | 307 | 308 | 400 | 402 | 403 | 404 | 405 | 406 | 407 | 408 | 409 | 411 | 412 | 413 | 414 | 415 | 416 | 417 | 418 | 420 | 421 | 422 | 423 | 424 | 425 | 426 | 428 | 429 | 431 | 451 | 501 | 502 | 503 | 504 | 505 | 506 | 507 | 508 | 510 | 511 ? {
                    readonly 100: "Continue";
                    readonly 101: "Switching Protocols";
                    readonly 102: "Processing";
                    readonly 103: "Early Hints";
                    readonly 200: "OK";
                    readonly 201: "Created";
                    readonly 202: "Accepted";
                    readonly 203: "Non-Authoritative Information";
                    readonly 204: "No Content";
                    readonly 205: "Reset Content";
                    readonly 206: "Partial Content";
                    readonly 207: "Multi-Status";
                    readonly 208: "Already Reported";
                    readonly 300: "Multiple Choices";
                    readonly 301: "Moved Permanently";
                    readonly 302: "Found";
                    readonly 303: "See Other";
                    readonly 304: "Not Modified";
                    readonly 307: "Temporary Redirect";
                    readonly 308: "Permanent Redirect";
                    readonly 400: "Bad Request";
                    readonly 401: "Unauthorized";
                    readonly 402: "Payment Required";
                    readonly 403: "Forbidden";
                    readonly 404: "Not Found";
                    readonly 405: "Method Not Allowed";
                    readonly 406: "Not Acceptable";
                    readonly 407: "Proxy Authentication Required";
                    readonly 408: "Request Timeout";
                    readonly 409: "Conflict";
                    readonly 410: "Gone";
                    readonly 411: "Length Required";
                    readonly 412: "Precondition Failed";
                    readonly 413: "Payload Too Large";
                    readonly 414: "URI Too Long";
                    readonly 415: "Unsupported Media Type";
                    readonly 416: "Range Not Satisfiable";
                    readonly 417: "Expectation Failed";
                    readonly 418: "I'm a teapot";
                    readonly 420: "Enhance Your Calm";
                    readonly 421: "Misdirected Request";
                    readonly 422: "Unprocessable Content";
                    readonly 423: "Locked";
                    readonly 424: "Failed Dependency";
                    readonly 425: "Too Early";
                    readonly 426: "Upgrade Required";
                    readonly 428: "Precondition Required";
                    readonly 429: "Too Many Requests";
                    readonly 431: "Request Header Fields Too Large";
                    readonly 451: "Unavailable For Legal Reasons";
                    readonly 500: "Internal Server Error";
                    readonly 501: "Not Implemented";
                    readonly 502: "Bad Gateway";
                    readonly 503: "Service Unavailable";
                    readonly 504: "Gateway Timeout";
                    readonly 505: "HTTP Version Not Supported";
                    readonly 506: "Variant Also Negotiates";
                    readonly 507: "Insufficient Storage";
                    readonly 508: "Loop Detected";
                    readonly 510: "Not Extended";
                    readonly 511: "Network Authentication Required";
                }[Code] : Code>(code: Code, response?: T) => import("elysia").ElysiaCustomStatusResponse<Code, T, Code extends "Continue" | "Switching Protocols" | "Processing" | "Early Hints" | "OK" | "Created" | "Accepted" | "Non-Authoritative Information" | "No Content" | "Reset Content" | "Partial Content" | "Multi-Status" | "Already Reported" | "Multiple Choices" | "Moved Permanently" | "Found" | "See Other" | "Not Modified" | "Temporary Redirect" | "Permanent Redirect" | "Bad Request" | "Unauthorized" | "Payment Required" | "Forbidden" | "Not Found" | "Method Not Allowed" | "Not Acceptable" | "Proxy Authentication Required" | "Request Timeout" | "Conflict" | "Gone" | "Length Required" | "Precondition Failed" | "Payload Too Large" | "URI Too Long" | "Unsupported Media Type" | "Range Not Satisfiable" | "Expectation Failed" | "I'm a teapot" | "Enhance Your Calm" | "Misdirected Request" | "Unprocessable Content" | "Locked" | "Failed Dependency" | "Too Early" | "Upgrade Required" | "Precondition Required" | "Too Many Requests" | "Request Header Fields Too Large" | "Unavailable For Legal Reasons" | "Internal Server Error" | "Not Implemented" | "Bad Gateway" | "Service Unavailable" | "Gateway Timeout" | "HTTP Version Not Supported" | "Variant Also Negotiates" | "Insufficient Storage" | "Loop Detected" | "Not Extended" | "Network Authentication Required" ? {
                    readonly Continue: 100;
                    readonly "Switching Protocols": 101;
                    readonly Processing: 102;
                    readonly "Early Hints": 103;
                    readonly OK: 200;
                    readonly Created: 201;
                    readonly Accepted: 202;
                    readonly "Non-Authoritative Information": 203;
                    readonly "No Content": 204;
                    readonly "Reset Content": 205;
                    readonly "Partial Content": 206;
                    readonly "Multi-Status": 207;
                    readonly "Already Reported": 208;
                    readonly "Multiple Choices": 300;
                    readonly "Moved Permanently": 301;
                    readonly Found: 302;
                    readonly "See Other": 303;
                    readonly "Not Modified": 304;
                    readonly "Temporary Redirect": 307;
                    readonly "Permanent Redirect": 308;
                    readonly "Bad Request": 400;
                    readonly Unauthorized: 401;
                    readonly "Payment Required": 402;
                    readonly Forbidden: 403;
                    readonly "Not Found": 404;
                    readonly "Method Not Allowed": 405;
                    readonly "Not Acceptable": 406;
                    readonly "Proxy Authentication Required": 407;
                    readonly "Request Timeout": 408;
                    readonly Conflict: 409;
                    readonly Gone: 410;
                    readonly "Length Required": 411;
                    readonly "Precondition Failed": 412;
                    readonly "Payload Too Large": 413;
                    readonly "URI Too Long": 414;
                    readonly "Unsupported Media Type": 415;
                    readonly "Range Not Satisfiable": 416;
                    readonly "Expectation Failed": 417;
                    readonly "I'm a teapot": 418;
                    readonly "Enhance Your Calm": 420;
                    readonly "Misdirected Request": 421;
                    readonly "Unprocessable Content": 422;
                    readonly Locked: 423;
                    readonly "Failed Dependency": 424;
                    readonly "Too Early": 425;
                    readonly "Upgrade Required": 426;
                    readonly "Precondition Required": 428;
                    readonly "Too Many Requests": 429;
                    readonly "Request Header Fields Too Large": 431;
                    readonly "Unavailable For Legal Reasons": 451;
                    readonly "Internal Server Error": 500;
                    readonly "Not Implemented": 501;
                    readonly "Bad Gateway": 502;
                    readonly "Service Unavailable": 503;
                    readonly "Gateway Timeout": 504;
                    readonly "HTTP Version Not Supported": 505;
                    readonly "Variant Also Negotiates": 506;
                    readonly "Insufficient Storage": 507;
                    readonly "Loop Detected": 508;
                    readonly "Not Extended": 510;
                    readonly "Network Authentication Required": 511;
                }[Code] : Code>;
            }) => Promise<import("elysia").ElysiaCustomStatusResponse<403, any, 403> | undefined>;
        };
    } & {
        readonly notificationOwner: {
            readonly resolve: ({ params, store, status }: {
                body: unknown;
                query: Record<string, string>;
                params: {};
                headers: Record<string, string | undefined>;
                cookie: Record<string, import("elysia").Cookie<unknown>>;
                server: import("elysia/universal/server").Server | null;
                redirect: import("elysia").redirect;
                set: {
                    headers: import("elysia").HTTPHeaders;
                    status?: number | keyof import("elysia").StatusMap;
                    redirect?: string;
                    cookie?: Record<string, import("elysia/cookies").ElysiaCookie>;
                };
                path: string;
                route: string;
                request: Request;
                store: {
                    sessionUser: Omit<{
                        id: string;
                        name: string;
                        email: string | null;
                        emailVerified: boolean;
                        image: string | null;
                        createdAt: Date;
                        updatedAt: Date;
                        username: string | null;
                        displayUsername: string | null;
                        bio: string | null;
                        isGuest: boolean;
                        managedBy: string | null;
                        currencyId: string | null;
                        inviteToken: string | null;
                        role: string | null;
                        banned: boolean | null;
                        banReason: string | null;
                        banExpires: Date | null;
                        lastLoginMethod: string | null;
                        profileCompletedAt: Date | null;
                        deletedAt: Date | null;
                        guestState: "managed" | "archived" | "merged" | null;
                        guestClaimedAt: Date | null;
                        guestArchivedAt: Date | null;
                        guestMergedAt: Date | null;
                        mergedIntoUserId: string | null;
                    }, "email" | "image"> & {
                        email: string;
                        image?: string | null;
                    };
                    session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        expiresAt: Date;
                        token: string;
                        ipAddress?: string | null | undefined;
                        userAgent?: string | null | undefined;
                    } | null;
                };
                status: <const Code extends number | keyof import("elysia").StatusMap, const T = Code extends 100 | 410 | 500 | 401 | 101 | 102 | 103 | 200 | 201 | 202 | 203 | 204 | 205 | 206 | 207 | 208 | 300 | 301 | 302 | 303 | 304 | 307 | 308 | 400 | 402 | 403 | 404 | 405 | 406 | 407 | 408 | 409 | 411 | 412 | 413 | 414 | 415 | 416 | 417 | 418 | 420 | 421 | 422 | 423 | 424 | 425 | 426 | 428 | 429 | 431 | 451 | 501 | 502 | 503 | 504 | 505 | 506 | 507 | 508 | 510 | 511 ? {
                    readonly 100: "Continue";
                    readonly 101: "Switching Protocols";
                    readonly 102: "Processing";
                    readonly 103: "Early Hints";
                    readonly 200: "OK";
                    readonly 201: "Created";
                    readonly 202: "Accepted";
                    readonly 203: "Non-Authoritative Information";
                    readonly 204: "No Content";
                    readonly 205: "Reset Content";
                    readonly 206: "Partial Content";
                    readonly 207: "Multi-Status";
                    readonly 208: "Already Reported";
                    readonly 300: "Multiple Choices";
                    readonly 301: "Moved Permanently";
                    readonly 302: "Found";
                    readonly 303: "See Other";
                    readonly 304: "Not Modified";
                    readonly 307: "Temporary Redirect";
                    readonly 308: "Permanent Redirect";
                    readonly 400: "Bad Request";
                    readonly 401: "Unauthorized";
                    readonly 402: "Payment Required";
                    readonly 403: "Forbidden";
                    readonly 404: "Not Found";
                    readonly 405: "Method Not Allowed";
                    readonly 406: "Not Acceptable";
                    readonly 407: "Proxy Authentication Required";
                    readonly 408: "Request Timeout";
                    readonly 409: "Conflict";
                    readonly 410: "Gone";
                    readonly 411: "Length Required";
                    readonly 412: "Precondition Failed";
                    readonly 413: "Payload Too Large";
                    readonly 414: "URI Too Long";
                    readonly 415: "Unsupported Media Type";
                    readonly 416: "Range Not Satisfiable";
                    readonly 417: "Expectation Failed";
                    readonly 418: "I'm a teapot";
                    readonly 420: "Enhance Your Calm";
                    readonly 421: "Misdirected Request";
                    readonly 422: "Unprocessable Content";
                    readonly 423: "Locked";
                    readonly 424: "Failed Dependency";
                    readonly 425: "Too Early";
                    readonly 426: "Upgrade Required";
                    readonly 428: "Precondition Required";
                    readonly 429: "Too Many Requests";
                    readonly 431: "Request Header Fields Too Large";
                    readonly 451: "Unavailable For Legal Reasons";
                    readonly 500: "Internal Server Error";
                    readonly 501: "Not Implemented";
                    readonly 502: "Bad Gateway";
                    readonly 503: "Service Unavailable";
                    readonly 504: "Gateway Timeout";
                    readonly 505: "HTTP Version Not Supported";
                    readonly 506: "Variant Also Negotiates";
                    readonly 507: "Insufficient Storage";
                    readonly 508: "Loop Detected";
                    readonly 510: "Not Extended";
                    readonly 511: "Network Authentication Required";
                }[Code] : Code>(code: Code, response?: T) => import("elysia").ElysiaCustomStatusResponse<Code, T, Code extends "Continue" | "Switching Protocols" | "Processing" | "Early Hints" | "OK" | "Created" | "Accepted" | "Non-Authoritative Information" | "No Content" | "Reset Content" | "Partial Content" | "Multi-Status" | "Already Reported" | "Multiple Choices" | "Moved Permanently" | "Found" | "See Other" | "Not Modified" | "Temporary Redirect" | "Permanent Redirect" | "Bad Request" | "Unauthorized" | "Payment Required" | "Forbidden" | "Not Found" | "Method Not Allowed" | "Not Acceptable" | "Proxy Authentication Required" | "Request Timeout" | "Conflict" | "Gone" | "Length Required" | "Precondition Failed" | "Payload Too Large" | "URI Too Long" | "Unsupported Media Type" | "Range Not Satisfiable" | "Expectation Failed" | "I'm a teapot" | "Enhance Your Calm" | "Misdirected Request" | "Unprocessable Content" | "Locked" | "Failed Dependency" | "Too Early" | "Upgrade Required" | "Precondition Required" | "Too Many Requests" | "Request Header Fields Too Large" | "Unavailable For Legal Reasons" | "Internal Server Error" | "Not Implemented" | "Bad Gateway" | "Service Unavailable" | "Gateway Timeout" | "HTTP Version Not Supported" | "Variant Also Negotiates" | "Insufficient Storage" | "Loop Detected" | "Not Extended" | "Network Authentication Required" ? {
                    readonly Continue: 100;
                    readonly "Switching Protocols": 101;
                    readonly Processing: 102;
                    readonly "Early Hints": 103;
                    readonly OK: 200;
                    readonly Created: 201;
                    readonly Accepted: 202;
                    readonly "Non-Authoritative Information": 203;
                    readonly "No Content": 204;
                    readonly "Reset Content": 205;
                    readonly "Partial Content": 206;
                    readonly "Multi-Status": 207;
                    readonly "Already Reported": 208;
                    readonly "Multiple Choices": 300;
                    readonly "Moved Permanently": 301;
                    readonly Found: 302;
                    readonly "See Other": 303;
                    readonly "Not Modified": 304;
                    readonly "Temporary Redirect": 307;
                    readonly "Permanent Redirect": 308;
                    readonly "Bad Request": 400;
                    readonly Unauthorized: 401;
                    readonly "Payment Required": 402;
                    readonly Forbidden: 403;
                    readonly "Not Found": 404;
                    readonly "Method Not Allowed": 405;
                    readonly "Not Acceptable": 406;
                    readonly "Proxy Authentication Required": 407;
                    readonly "Request Timeout": 408;
                    readonly Conflict: 409;
                    readonly Gone: 410;
                    readonly "Length Required": 411;
                    readonly "Precondition Failed": 412;
                    readonly "Payload Too Large": 413;
                    readonly "URI Too Long": 414;
                    readonly "Unsupported Media Type": 415;
                    readonly "Range Not Satisfiable": 416;
                    readonly "Expectation Failed": 417;
                    readonly "I'm a teapot": 418;
                    readonly "Enhance Your Calm": 420;
                    readonly "Misdirected Request": 421;
                    readonly "Unprocessable Content": 422;
                    readonly Locked: 423;
                    readonly "Failed Dependency": 424;
                    readonly "Too Early": 425;
                    readonly "Upgrade Required": 426;
                    readonly "Precondition Required": 428;
                    readonly "Too Many Requests": 429;
                    readonly "Request Header Fields Too Large": 431;
                    readonly "Unavailable For Legal Reasons": 451;
                    readonly "Internal Server Error": 500;
                    readonly "Not Implemented": 501;
                    readonly "Bad Gateway": 502;
                    readonly "Service Unavailable": 503;
                    readonly "Gateway Timeout": 504;
                    readonly "HTTP Version Not Supported": 505;
                    readonly "Variant Also Negotiates": 506;
                    readonly "Insufficient Storage": 507;
                    readonly "Loop Detected": 508;
                    readonly "Not Extended": 510;
                    readonly "Network Authentication Required": 511;
                }[Code] : Code>;
            }) => Promise<import("elysia").ElysiaCustomStatusResponse<403, "Unauthorized", 403> | import("elysia").ElysiaCustomStatusResponse<404, "Notification not found", 404> | undefined>;
        };
    };
    parser: {};
    response: {};
}, {
    health: {
        live: {
            get: {
                body: unknown;
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        status: "healthy";
                        timestamp: string;
                        uptime: number;
                    };
                };
            };
        };
    };
} & {
    health: {
        get: {
            body: unknown;
            params: {};
            query: unknown;
            headers: unknown;
            response: {
                200: {
                    status: string;
                    timestamp: string;
                    uptime: number;
                    checks: Record<string, import("./server/health").HealthCheckResult>;
                };
            };
        };
    };
} & {
    "current-user": {
        get: {
            body: {};
            params: {};
            query: {};
            headers: {};
            response: {
                401: "Unauthorized";
                200: ({
                    id: string;
                    name: string;
                    email: string | null;
                    emailVerified: boolean;
                    image: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                    username: string | null;
                    displayUsername: string | null;
                    bio: string | null;
                    isGuest: boolean;
                    managedBy: string | null;
                    currencyId: string | null;
                    inviteToken: string | null;
                    role: string | null;
                    banned: boolean | null;
                    banReason: string | null;
                    banExpires: Date | null;
                    lastLoginMethod: string | null;
                    profileCompletedAt: Date | null;
                    deletedAt: Date | null;
                    guestState: "managed" | "archived" | "merged" | null;
                    guestClaimedAt: Date | null;
                    guestArchivedAt: Date | null;
                    guestMergedAt: Date | null;
                    mergedIntoUserId: string | null;
                } & Pick<Partial<{
                    currency: {
                        id: string;
                        name: string;
                        code: string;
                        symbol: string | null;
                        exchangeRateToBase: string;
                        updatedAt: Date;
                        decimals: number;
                        type: "fiat" | "crypto";
                    };
                    id: string;
                    name: string;
                    email: string | null;
                    emailVerified: boolean;
                    image: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                    username: string | null;
                    displayUsername: string | null;
                    bio: string | null;
                    isGuest: boolean;
                    managedBy: string | null;
                    currencyId: string | null;
                    inviteToken: string | null;
                    role: string | null;
                    banned: boolean | null;
                    banReason: string | null;
                    banExpires: Date | null;
                    lastLoginMethod: string | null;
                    profileCompletedAt: Date | null;
                    deletedAt: Date | null;
                    guestState: "managed" | "archived" | "merged" | null;
                    guestClaimedAt: Date | null;
                    guestArchivedAt: Date | null;
                    guestMergedAt: Date | null;
                    mergedIntoUserId: string | null;
                }>, "currency">) | null;
                403: {
                    code: string;
                    message: string;
                };
            };
        };
    };
} & {
    auth: {};
} & {
    auth: {
        "sign-up": {
            post: {
                body: {
                    username?: string | undefined;
                    currencyId?: string | undefined;
                    name: string;
                    email: string;
                    inviteToken: string;
                };
                params: {};
                query: {};
                headers: {};
                response: {
                    500: "Failed to create user";
                    200: {
                        id: string;
                        name: string;
                        email: string | null;
                        emailVerified: boolean;
                        image: string | null;
                        createdAt: Date;
                        updatedAt: Date;
                        username: string | null;
                        displayUsername: string | null;
                        bio: string | null;
                        isGuest: boolean;
                        managedBy: string | null;
                        currencyId: string | null;
                        inviteToken: string | null;
                        role: string | null;
                        banned: boolean | null;
                        banReason: string | null;
                        banExpires: Date | null;
                        lastLoginMethod: string | null;
                        profileCompletedAt: Date | null;
                        deletedAt: Date | null;
                        guestState: "managed" | "archived" | "merged" | null;
                        guestClaimedAt: Date | null;
                        guestArchivedAt: Date | null;
                        guestMergedAt: Date | null;
                        mergedIntoUserId: string | null;
                    } & Pick<Partial<{
                        currency: {
                            id: string;
                            name: string;
                            code: string;
                            symbol: string | null;
                            exchangeRateToBase: string;
                            updatedAt: Date;
                            decimals: number;
                            type: "fiat" | "crypto";
                        };
                        id: string;
                        name: string;
                        email: string | null;
                        emailVerified: boolean;
                        image: string | null;
                        createdAt: Date;
                        updatedAt: Date;
                        username: string | null;
                        displayUsername: string | null;
                        bio: string | null;
                        isGuest: boolean;
                        managedBy: string | null;
                        currencyId: string | null;
                        inviteToken: string | null;
                        role: string | null;
                        banned: boolean | null;
                        banReason: string | null;
                        banExpires: Date | null;
                        lastLoginMethod: string | null;
                        profileCompletedAt: Date | null;
                        deletedAt: Date | null;
                        guestState: "managed" | "archived" | "merged" | null;
                        guestClaimedAt: Date | null;
                        guestArchivedAt: Date | null;
                        guestMergedAt: Date | null;
                        mergedIntoUserId: string | null;
                    }>, "currency">;
                    400: string;
                    403: "Forbidden";
                    409: {
                        readonly code: "GUEST_LOGIN_REQUIRED";
                        readonly message: "This email belongs to an invited guest. Sign in with email OTP or a verified OAuth provider to claim it.";
                    } | {
                        readonly code: "EMAIL_ALREADY_EXISTS";
                        readonly message: "Email already taken";
                    };
                    422: {
                        type: "validation";
                        on: string;
                        summary?: string;
                        message?: string;
                        found?: unknown;
                        property?: string;
                        expected?: string;
                    };
                };
            };
        };
    };
} & {
    admin: {
        metrics: {
            latest: {
                get: {
                    body: {};
                    params: {};
                    query: {
                        l?: number | undefined;
                        p?: number | undefined;
                    };
                    headers: {};
                    response: {
                        200: {
                            limit: number;
                            items: ({
                                createdAt: string;
                                entityType: "user";
                                item: {
                                    name: string;
                                    emailVerified: boolean;
                                    createdAt: string;
                                    username: string | null;
                                    isGuest: boolean;
                                    inviteToken: string | null;
                                    lastLoginMethod: string | null;
                                    currency: string | null;
                                    groupCount: number;
                                    friendCount: number;
                                    hasGroups: boolean;
                                    expenseShareCount: number;
                                    hasExpenseShares: boolean;
                                    createdPaymentCount: number;
                                    hasCreatedPayment: boolean;
                                    lastActivityAt: string;
                                    profileCompleted: boolean;
                                    hasAvatar: boolean;
                                    hasBio: boolean;
                                };
                            } | {
                                createdAt: string;
                                entityType: "expense";
                                item: {
                                    date: string;
                                    amount: number;
                                    createdAt: string;
                                    timezone: string;
                                    title: string;
                                    splitType: string;
                                    currency: string | null;
                                    category: {
                                        name: string;
                                        key: string | null;
                                    } | null;
                                    groupName: string | null;
                                    hasDescription: boolean;
                                    hasImage: boolean;
                                    amountInEuro: number;
                                    context: string;
                                    paidBy: {
                                        name: string;
                                        username: string | null;
                                    } | null;
                                    createdBy: {
                                        name: string;
                                        username: string | null;
                                    } | null;
                                    participantCount: number;
                                    isRecurring: boolean;
                                };
                            } | {
                                createdAt: string;
                                entityType: "payment";
                                item: {
                                    date: string;
                                    amount: number;
                                    createdAt: string;
                                    description: string | null;
                                    timezone: string;
                                    isSettlement: boolean;
                                    currency: string | null;
                                    fromUser: {
                                        name: string;
                                        username: string | null;
                                    } | null;
                                    toUser: {
                                        name: string;
                                        username: string | null;
                                    } | null;
                                    groupName: string | null;
                                    hasDescription: boolean;
                                    amountInEuro: number;
                                    context: string;
                                    createdBy: {
                                        name: string;
                                        username: string | null;
                                    } | null;
                                };
                            } | {
                                createdAt: string;
                                entityType: "group";
                                item: {
                                    name: string;
                                    createdAt: string;
                                    type: string;
                                    useOptimalSettlement: boolean;
                                    defaultSplitType: string;
                                    expenseCount: number;
                                    paymentCount: number;
                                    currency: string | null;
                                    creator: {
                                        name: string;
                                        username: string | null;
                                    } | null;
                                    memberCount: number;
                                    totalExpenseAmountInEuro: number;
                                    hasDescription: boolean;
                                    hasImage: boolean;
                                };
                            })[];
                            metric: "latest";
                            page: number;
                            totalItems: number;
                            totalPages: number;
                        };
                        403: "Unauthorized" | "Forbidden";
                        422: {
                            type: "validation";
                            on: string;
                            summary?: string;
                            message?: string;
                            found?: unknown;
                            property?: string;
                            expected?: string;
                        };
                    };
                };
            };
        };
    };
} & {
    admin: {
        metrics: {
            invites: {};
        } & {
            invites: {
                insights: {
                    get: {
                        body: {};
                        params: {};
                        query: {
                            window?: "all" | "24h" | "7d" | "30d" | undefined;
                        };
                        headers: {};
                        response: {
                            200: {
                                window: "all" | "24h" | "7d" | "30d";
                                metric: "insights";
                                current: {
                                    newUserCount: number;
                                    invitedSignupCount: number;
                                    invitedSignupRate: number;
                                    successfulInviterCount: number;
                                    averageInvitedSignupsPerSuccessfulInviter: number;
                                };
                                previousWindow: {
                                    newUserCount: number;
                                    invitedSignupCount: number;
                                    invitedSignupRate: number;
                                    successfulInviterCount: number;
                                    averageInvitedSignupsPerSuccessfulInviter: number;
                                } | null;
                            };
                            403: "Unauthorized" | "Forbidden";
                            422: {
                                type: "validation";
                                on: string;
                                summary?: string;
                                message?: string;
                                found?: unknown;
                                property?: string;
                                expected?: string;
                            };
                        };
                    };
                };
            };
        } & {
            invites: {
                "top-inviters": {
                    get: {
                        body: {};
                        params: {};
                        query: {
                            l?: number | undefined;
                            p?: number | undefined;
                            window?: "all" | "24h" | "7d" | "30d" | undefined;
                        };
                        headers: {};
                        response: {
                            200: {
                                limit: number;
                                items: {
                                    name: string;
                                    username: string | null;
                                    invitedSignupCount: number;
                                    rank: number;
                                }[];
                                window: "all" | "24h" | "7d" | "30d";
                                metric: "top-inviters";
                                page: number;
                                totalItems: number;
                                totalPages: number;
                            };
                            403: "Unauthorized" | "Forbidden";
                            422: {
                                type: "validation";
                                on: string;
                                summary?: string;
                                message?: string;
                                found?: unknown;
                                property?: string;
                                expected?: string;
                            };
                        };
                    };
                };
            };
        };
    };
} & {
    admin: {
        metrics: {
            users: {};
        } & {
            users: {
                new: {
                    get: {
                        body: {};
                        params: {};
                        query: {
                            window?: "all" | "24h" | "7d" | "30d" | undefined;
                        };
                        headers: {};
                        response: {
                            200: {
                                count: number;
                                window: "all" | "24h" | "7d" | "30d";
                                metric: "active" | "new";
                                previousWindowValue: number | null;
                                averages: {
                                    previousWindowValue: number | null;
                                    granularity: "month" | "day" | "week";
                                    averageUserCount: number;
                                    bucketCount: number;
                                    previousBucketCount: number | null;
                                }[];
                            };
                            403: "Unauthorized" | "Forbidden";
                            422: {
                                type: "validation";
                                on: string;
                                summary?: string;
                                message?: string;
                                found?: unknown;
                                property?: string;
                                expected?: string;
                            };
                        };
                    };
                };
            };
        } & {
            users: {
                active: {
                    get: {
                        body: {};
                        params: {};
                        query: {
                            window?: "all" | "24h" | "7d" | "30d" | undefined;
                        };
                        headers: {};
                        response: {
                            200: {
                                count: number;
                                window: "all" | "24h" | "7d" | "30d";
                                metric: "active" | "new";
                                previousWindowValue: number | null;
                                averages: {
                                    previousWindowValue: number | null;
                                    granularity: "month" | "day" | "week";
                                    averageUserCount: number;
                                    bucketCount: number;
                                    previousBucketCount: number | null;
                                }[];
                            };
                            403: "Unauthorized" | "Forbidden";
                            422: {
                                type: "validation";
                                on: string;
                                summary?: string;
                                message?: string;
                                found?: unknown;
                                property?: string;
                                expected?: string;
                            };
                        };
                    };
                };
            };
        } & {
            users: {
                "new-series": {
                    get: {
                        body: {};
                        params: {};
                        query: {
                            window?: "all" | "24h" | "7d" | "30d" | undefined;
                        };
                        headers: {};
                        response: {
                            200: {
                                count: number;
                                window: "all" | "24h" | "7d" | "30d";
                                metric: string;
                                granularity: "month" | "day" | "hour";
                                buckets: {
                                    count: number;
                                    bucketStart: string;
                                }[];
                            };
                            403: "Unauthorized" | "Forbidden";
                            422: {
                                type: "validation";
                                on: string;
                                summary?: string;
                                message?: string;
                                found?: unknown;
                                property?: string;
                                expected?: string;
                            };
                        };
                    };
                };
            };
        } & {
            users: {
                latest: {
                    get: {
                        body: {};
                        params: {};
                        query: {
                            l?: number | undefined;
                            p?: number | undefined;
                        };
                        headers: {};
                        response: {
                            200: {
                                limit: number;
                                items: {
                                    name: string;
                                    emailVerified: boolean;
                                    createdAt: string;
                                    username: string | null;
                                    isGuest: boolean;
                                    inviteToken: string | null;
                                    lastLoginMethod: string | null;
                                    currency: string | null;
                                    groupCount: number;
                                    friendCount: number;
                                    hasGroups: boolean;
                                    expenseShareCount: number;
                                    hasExpenseShares: boolean;
                                    createdPaymentCount: number;
                                    hasCreatedPayment: boolean;
                                    lastActivityAt: string;
                                    profileCompleted: boolean;
                                    hasAvatar: boolean;
                                    hasBio: boolean;
                                }[];
                                metric: "latest";
                                page: number;
                                totalItems: number;
                                totalPages: number;
                            };
                            403: "Unauthorized" | "Forbidden";
                            422: {
                                type: "validation";
                                on: string;
                                summary?: string;
                                message?: string;
                                found?: unknown;
                                property?: string;
                                expected?: string;
                            };
                        };
                    };
                };
            };
        } & {
            users: {
                total: {
                    get: {
                        body: {};
                        params: {};
                        query: {};
                        headers: {};
                        response: {
                            200: {
                                count: number;
                                window: "all" | "24h" | "7d" | "30d";
                                metric: string;
                                previousWindowValue: number | null;
                            };
                            403: "Unauthorized" | "Forbidden";
                            422: {
                                type: "validation";
                                on: string;
                                summary?: string;
                                message?: string;
                                found?: unknown;
                                property?: string;
                                expected?: string;
                            };
                        };
                    };
                };
            };
        } & {
            users: {
                "has-avatar": {
                    get: {
                        body: {};
                        params: {};
                        query: {
                            window?: "all" | "24h" | "7d" | "30d" | undefined;
                        };
                        headers: {};
                        response: {
                            200: {
                                count: number;
                                window: "all" | "24h" | "7d" | "30d";
                                metric: string;
                                previousWindowValue: number | null;
                            };
                            403: "Unauthorized" | "Forbidden";
                            422: {
                                type: "validation";
                                on: string;
                                summary?: string;
                                message?: string;
                                found?: unknown;
                                property?: string;
                                expected?: string;
                            };
                        };
                    };
                };
            };
        } & {
            users: {
                "has-bio": {
                    get: {
                        body: {};
                        params: {};
                        query: {
                            window?: "all" | "24h" | "7d" | "30d" | undefined;
                        };
                        headers: {};
                        response: {
                            200: {
                                count: number;
                                window: "all" | "24h" | "7d" | "30d";
                                metric: string;
                                previousWindowValue: number | null;
                            };
                            403: "Unauthorized" | "Forbidden";
                            422: {
                                type: "validation";
                                on: string;
                                summary?: string;
                                message?: string;
                                found?: unknown;
                                property?: string;
                                expected?: string;
                            };
                        };
                    };
                };
            };
        } & {
            users: {
                verified: {
                    get: {
                        body: {};
                        params: {};
                        query: {
                            window?: "all" | "24h" | "7d" | "30d" | undefined;
                        };
                        headers: {};
                        response: {
                            200: {
                                count: number;
                                window: "all" | "24h" | "7d" | "30d";
                                metric: string;
                                previousWindowValue: number | null;
                            };
                            403: "Unauthorized" | "Forbidden";
                            422: {
                                type: "validation";
                                on: string;
                                summary?: string;
                                message?: string;
                                found?: unknown;
                                property?: string;
                                expected?: string;
                            };
                        };
                    };
                };
            };
        } & {
            users: {
                "is-guest": {
                    get: {
                        body: {};
                        params: {};
                        query: {
                            window?: "all" | "24h" | "7d" | "30d" | undefined;
                        };
                        headers: {};
                        response: {
                            200: {
                                count: number;
                                window: "all" | "24h" | "7d" | "30d";
                                metric: string;
                                previousWindowValue: number | null;
                            };
                            403: "Unauthorized" | "Forbidden";
                            422: {
                                type: "validation";
                                on: string;
                                summary?: string;
                                message?: string;
                                found?: unknown;
                                property?: string;
                                expected?: string;
                            };
                        };
                    };
                };
            };
        } & {
            users: {
                "has-username": {
                    get: {
                        body: {};
                        params: {};
                        query: {
                            window?: "all" | "24h" | "7d" | "30d" | undefined;
                        };
                        headers: {};
                        response: {
                            200: {
                                count: number;
                                window: "all" | "24h" | "7d" | "30d";
                                metric: string;
                                previousWindowValue: number | null;
                            };
                            403: "Unauthorized" | "Forbidden";
                            422: {
                                type: "validation";
                                on: string;
                                summary?: string;
                                message?: string;
                                found?: unknown;
                                property?: string;
                                expected?: string;
                            };
                        };
                    };
                };
            };
        } & {
            users: {
                "has-group": {
                    get: {
                        body: {};
                        params: {};
                        query: {
                            window?: "all" | "24h" | "7d" | "30d" | undefined;
                        };
                        headers: {};
                        response: {
                            200: {
                                count: number;
                                window: "all" | "24h" | "7d" | "30d";
                                metric: string;
                                previousWindowValue: number | null;
                            };
                            403: "Unauthorized" | "Forbidden";
                            422: {
                                type: "validation";
                                on: string;
                                summary?: string;
                                message?: string;
                                found?: unknown;
                                property?: string;
                                expected?: string;
                            };
                        };
                    };
                };
            };
        };
    };
} & {
    admin: {
        metrics: {
            sessions: {};
        } & {
            sessions: {
                active: {
                    get: {
                        body: {};
                        params: {};
                        query: {
                            window?: "all" | "24h" | "7d" | "30d" | undefined;
                        };
                        headers: {};
                        response: {
                            200: {
                                window: "all" | "24h" | "7d" | "30d";
                                metric: "active";
                                previousWindowValue: number | null;
                                sessionCount: number;
                                uniqueUserCount: number;
                            };
                            403: "Unauthorized" | "Forbidden";
                            422: {
                                type: "validation";
                                on: string;
                                summary?: string;
                                message?: string;
                                found?: unknown;
                                property?: string;
                                expected?: string;
                            };
                        };
                    };
                };
            };
        } & {
            sessions: {
                "by-device": {
                    get: {
                        body: {};
                        params: {};
                        query: {
                            window?: "all" | "24h" | "7d" | "30d" | undefined;
                        };
                        headers: {};
                        response: {
                            200: {
                                window: "all" | "24h" | "7d" | "30d";
                                metric: "by-device";
                                buckets: {
                                    count: number;
                                    device: string;
                                }[];
                                sessionCount: number;
                            };
                            403: "Unauthorized" | "Forbidden";
                            422: {
                                type: "validation";
                                on: string;
                                summary?: string;
                                message?: string;
                                found?: unknown;
                                property?: string;
                                expected?: string;
                            };
                        };
                    };
                };
            };
        } & {
            sessions: {
                "by-country": {
                    get: {
                        body: {};
                        params: {};
                        query: {
                            window?: "all" | "24h" | "7d" | "30d" | undefined;
                        };
                        headers: {};
                        response: {
                            200: {
                                window: "all" | "24h" | "7d" | "30d";
                                metric: "by-country";
                                buckets: {
                                    count: number;
                                    country: string;
                                }[];
                                sessionCount: number;
                            };
                            403: "Unauthorized" | "Forbidden";
                            422: {
                                type: "validation";
                                on: string;
                                summary?: string;
                                message?: string;
                                found?: unknown;
                                property?: string;
                                expected?: string;
                            };
                        };
                    };
                };
            };
        } & {
            sessions: {
                retention: {
                    get: {
                        body: {};
                        params: {};
                        query: {
                            window?: "24h" | "7d" | "30d" | undefined;
                        };
                        headers: {};
                        response: {
                            200: {
                                window: "24h" | "7d" | "30d";
                                metric: "retention";
                                previousWindowValue: number | null;
                                cohortUserCount: number;
                                currentUserCount: number;
                                retainedUserCount: number;
                                retentionRate: number;
                            };
                            403: "Unauthorized" | "Forbidden";
                            422: {
                                type: "validation";
                                on: string;
                                summary?: string;
                                message?: string;
                                found?: unknown;
                                property?: string;
                                expected?: string;
                            };
                        };
                    };
                };
            };
        } & {
            sessions: {
                "retention-by-device": {
                    get: {
                        body: {};
                        params: {};
                        query: {
                            window?: "24h" | "7d" | "30d" | undefined;
                        };
                        headers: {};
                        response: {
                            200: {
                                window: "24h" | "7d" | "30d";
                                metric: "retention-by-device";
                                buckets: {
                                    device: string;
                                    cohortUserCount: number;
                                    retainedUserCount: number;
                                    retentionRate: number;
                                }[];
                                cohortUserCount: number;
                                currentUserCount: number;
                                retainedUserCount: number;
                                retentionRate: number;
                            };
                            403: "Unauthorized" | "Forbidden";
                            422: {
                                type: "validation";
                                on: string;
                                summary?: string;
                                message?: string;
                                found?: unknown;
                                property?: string;
                                expected?: string;
                            };
                        };
                    };
                };
            };
        };
    };
} & {
    admin: {
        metrics: {
            expenses: {};
        } & {
            expenses: {
                new: {
                    get: {
                        body: {};
                        params: {};
                        query: {
                            window?: "all" | "24h" | "7d" | "30d" | undefined;
                        };
                        headers: {};
                        response: {
                            200: {
                                count: number;
                                window: "all" | "24h" | "7d" | "30d";
                                metric: string;
                                previousWindowValue: number | null;
                            };
                            403: "Unauthorized" | "Forbidden";
                            422: {
                                type: "validation";
                                on: string;
                                summary?: string;
                                message?: string;
                                found?: unknown;
                                property?: string;
                                expected?: string;
                            };
                        };
                    };
                };
            };
        } & {
            expenses: {
                latest: {
                    get: {
                        body: {};
                        params: {};
                        query: {
                            l?: number | undefined;
                            p?: number | undefined;
                        };
                        headers: {};
                        response: {
                            200: {
                                limit: number;
                                items: {
                                    date: string;
                                    amount: number;
                                    createdAt: string;
                                    timezone: string;
                                    title: string;
                                    splitType: string;
                                    currency: string | null;
                                    category: {
                                        name: string;
                                        key: string | null;
                                    } | null;
                                    groupName: string | null;
                                    hasDescription: boolean;
                                    hasImage: boolean;
                                    amountInEuro: number;
                                    context: string;
                                    paidBy: {
                                        name: string;
                                        username: string | null;
                                    } | null;
                                    createdBy: {
                                        name: string;
                                        username: string | null;
                                    } | null;
                                    participantCount: number;
                                    isRecurring: boolean;
                                }[];
                                metric: "latest";
                                page: number;
                                totalItems: number;
                                totalPages: number;
                            };
                            403: "Unauthorized" | "Forbidden";
                            422: {
                                type: "validation";
                                on: string;
                                summary?: string;
                                message?: string;
                                found?: unknown;
                                property?: string;
                                expected?: string;
                            };
                        };
                    };
                };
            };
        } & {
            expenses: {
                total: {
                    get: {
                        body: {};
                        params: {};
                        query: {};
                        headers: {};
                        response: {
                            200: {
                                count: number;
                                window: "all" | "24h" | "7d" | "30d";
                                metric: string;
                                previousWindowValue: number | null;
                            };
                            403: "Unauthorized" | "Forbidden";
                            422: {
                                type: "validation";
                                on: string;
                                summary?: string;
                                message?: string;
                                found?: unknown;
                                property?: string;
                                expected?: string;
                            };
                        };
                    };
                };
            };
        } & {
            expenses: {
                "total-amount": {
                    get: {
                        body: {};
                        params: {};
                        query: {
                            window?: "all" | "24h" | "7d" | "30d" | undefined;
                        };
                        headers: {};
                        response: {
                            200: {
                                count: number;
                                totalAmount: number;
                                window: "all" | "24h" | "7d" | "30d";
                                metric: "total-amount";
                                previousWindowValue: number | null;
                            };
                            403: "Unauthorized" | "Forbidden";
                            422: {
                                type: "validation";
                                on: string;
                                summary?: string;
                                message?: string;
                                found?: unknown;
                                property?: string;
                                expected?: string;
                            };
                        };
                    };
                };
            };
        } & {
            expenses: {
                "avg-amount": {
                    get: {
                        body: {};
                        params: {};
                        query: {
                            window?: "all" | "24h" | "7d" | "30d" | undefined;
                        };
                        headers: {};
                        response: {
                            200: {
                                count: number;
                                window: "all" | "24h" | "7d" | "30d";
                                metric: "avg-amount";
                                previousWindowValue: number | null;
                                averageAmount: number;
                            };
                            403: "Unauthorized" | "Forbidden";
                            422: {
                                type: "validation";
                                on: string;
                                summary?: string;
                                message?: string;
                                found?: unknown;
                                property?: string;
                                expected?: string;
                            };
                        };
                    };
                };
            };
        } & {
            expenses: {
                "avg-participants": {
                    get: {
                        body: {};
                        params: {};
                        query: {
                            window?: "all" | "24h" | "7d" | "30d" | undefined;
                        };
                        headers: {};
                        response: {
                            200: {
                                expenseCount: number;
                                window: "all" | "24h" | "7d" | "30d";
                                metric: "avg-participants";
                                previousWindowValue: number | null;
                                averageParticipants: number;
                            };
                            403: "Unauthorized" | "Forbidden";
                            422: {
                                type: "validation";
                                on: string;
                                summary?: string;
                                message?: string;
                                found?: unknown;
                                property?: string;
                                expected?: string;
                            };
                        };
                    };
                };
            };
        };
    };
} & {
    admin: {
        metrics: {
            payments: {};
        } & {
            payments: {
                new: {
                    get: {
                        body: {};
                        params: {};
                        query: {
                            window?: "all" | "24h" | "7d" | "30d" | undefined;
                        };
                        headers: {};
                        response: {
                            200: {
                                count: number;
                                window: "all" | "24h" | "7d" | "30d";
                                metric: string;
                                previousWindowValue: number | null;
                            };
                            403: "Unauthorized" | "Forbidden";
                            422: {
                                type: "validation";
                                on: string;
                                summary?: string;
                                message?: string;
                                found?: unknown;
                                property?: string;
                                expected?: string;
                            };
                        };
                    };
                };
            };
        } & {
            payments: {
                latest: {
                    get: {
                        body: {};
                        params: {};
                        query: {
                            l?: number | undefined;
                            p?: number | undefined;
                        };
                        headers: {};
                        response: {
                            200: {
                                limit: number;
                                items: {
                                    date: string;
                                    amount: number;
                                    createdAt: string;
                                    description: string | null;
                                    timezone: string;
                                    isSettlement: boolean;
                                    currency: string | null;
                                    fromUser: {
                                        name: string;
                                        username: string | null;
                                    } | null;
                                    toUser: {
                                        name: string;
                                        username: string | null;
                                    } | null;
                                    groupName: string | null;
                                    hasDescription: boolean;
                                    amountInEuro: number;
                                    context: string;
                                    createdBy: {
                                        name: string;
                                        username: string | null;
                                    } | null;
                                }[];
                                metric: "latest";
                                page: number;
                                totalItems: number;
                                totalPages: number;
                            };
                            403: "Unauthorized" | "Forbidden";
                            422: {
                                type: "validation";
                                on: string;
                                summary?: string;
                                message?: string;
                                found?: unknown;
                                property?: string;
                                expected?: string;
                            };
                        };
                    };
                };
            };
        } & {
            payments: {
                total: {
                    get: {
                        body: {};
                        params: {};
                        query: {};
                        headers: {};
                        response: {
                            200: {
                                count: number;
                                window: "all" | "24h" | "7d" | "30d";
                                metric: string;
                                previousWindowValue: number | null;
                            };
                            403: "Unauthorized" | "Forbidden";
                            422: {
                                type: "validation";
                                on: string;
                                summary?: string;
                                message?: string;
                                found?: unknown;
                                property?: string;
                                expected?: string;
                            };
                        };
                    };
                };
            };
        } & {
            payments: {
                "total-amount": {
                    get: {
                        body: {};
                        params: {};
                        query: {
                            window?: "all" | "24h" | "7d" | "30d" | undefined;
                        };
                        headers: {};
                        response: {
                            200: {
                                count: number;
                                totalAmount: number;
                                window: "all" | "24h" | "7d" | "30d";
                                metric: "total-amount";
                                previousWindowValue: number | null;
                            };
                            403: "Unauthorized" | "Forbidden";
                            422: {
                                type: "validation";
                                on: string;
                                summary?: string;
                                message?: string;
                                found?: unknown;
                                property?: string;
                                expected?: string;
                            };
                        };
                    };
                };
            };
        } & {
            payments: {
                "avg-amount": {
                    get: {
                        body: {};
                        params: {};
                        query: {
                            window?: "all" | "24h" | "7d" | "30d" | undefined;
                        };
                        headers: {};
                        response: {
                            200: {
                                count: number;
                                window: "all" | "24h" | "7d" | "30d";
                                metric: "avg-amount";
                                previousWindowValue: number | null;
                                averageAmount: number;
                            };
                            403: "Unauthorized" | "Forbidden";
                            422: {
                                type: "validation";
                                on: string;
                                summary?: string;
                                message?: string;
                                found?: unknown;
                                property?: string;
                                expected?: string;
                            };
                        };
                    };
                };
            };
        };
    };
} & {
    admin: {
        metrics: {
            campaigns: {};
        } & {
            campaigns: {
                get: {
                    body: {};
                    params: {};
                    query: {
                        l?: number | undefined;
                        sort?: "groups" | "friends" | "payments" | "expenses" | "createdAt" | "invites" | undefined;
                        direction?: "asc" | "desc" | undefined;
                        p?: number | undefined;
                        window?: "all" | "24h" | "7d" | "30d" | "post-festival" | undefined;
                        postFestivalStart?: string | undefined;
                        campaign: string | string[];
                    };
                    headers: {};
                    response: {
                        200: {
                            expenseCount: number;
                            paymentCount: number;
                            limit: number;
                            window: "all" | "24h" | "7d" | "30d" | "post-festival";
                            metric: string[];
                            groupCount: number;
                            page: number;
                            totalPages: number;
                            joinedUserCount: number;
                            guestCreatedCount: number;
                            activeUserCount: number;
                            activeUsers: {
                                name: string;
                                createdAt: string;
                                username: string | null;
                                expenseCount: number;
                                paymentCount: number;
                                groupCount: number;
                                friendCount: number;
                                inviteCount: number;
                            }[];
                        };
                        403: "Unauthorized" | "Forbidden";
                        422: {
                            type: "validation";
                            on: string;
                            summary?: string;
                            message?: string;
                            found?: unknown;
                            property?: string;
                            expected?: string;
                        };
                    };
                };
            };
        } & {
            campaigns: {
                users: {
                    get: {
                        body: {};
                        params: {};
                        query: {
                            l?: number | undefined;
                            p?: number | undefined;
                            window?: "all" | "24h" | "7d" | "30d" | "post-festival" | undefined;
                            postFestivalStart?: string | undefined;
                            campaign: string | string[];
                        };
                        headers: {};
                        response: {
                            200: {
                                limit: number;
                                items: {
                                    name: string;
                                    emailVerified: boolean;
                                    createdAt: string;
                                    username: string | null;
                                    isGuest: boolean;
                                    inviteToken: string | null;
                                    lastLoginMethod: string | null;
                                    currency: string | null;
                                    groupCount: number;
                                    friendCount: number;
                                    hasGroups: boolean;
                                    expenseShareCount: number;
                                    hasExpenseShares: boolean;
                                    createdPaymentCount: number;
                                    hasCreatedPayment: boolean;
                                    lastActivityAt: string;
                                    profileCompleted: boolean;
                                    hasAvatar: boolean;
                                    hasBio: boolean;
                                }[];
                                window: "all" | "24h" | "7d" | "30d" | "post-festival";
                                metric: string[];
                                page: number;
                                totalItems: number;
                                totalPages: number;
                            };
                            403: "Unauthorized" | "Forbidden";
                            422: {
                                type: "validation";
                                on: string;
                                summary?: string;
                                message?: string;
                                found?: unknown;
                                property?: string;
                                expected?: string;
                            };
                        };
                    };
                };
            };
        } & {
            campaigns: {
                groups: {
                    get: {
                        body: {};
                        params: {};
                        query: {
                            l?: number | undefined;
                            p?: number | undefined;
                            window?: "all" | "24h" | "7d" | "30d" | "post-festival" | undefined;
                            postFestivalStart?: string | undefined;
                            campaign: string | string[];
                        };
                        headers: {};
                        response: {
                            200: {
                                limit: number;
                                items: {
                                    name: string;
                                    createdAt: string;
                                    type: string;
                                    useOptimalSettlement: boolean;
                                    defaultSplitType: string;
                                    expenseCount: number;
                                    paymentCount: number;
                                    currency: string | null;
                                    creator: {
                                        name: string;
                                        username: string | null;
                                    } | null;
                                    memberCount: number;
                                    totalExpenseAmountInEuro: number;
                                    hasDescription: boolean;
                                    hasImage: boolean;
                                }[];
                                window: "all" | "24h" | "7d" | "30d" | "post-festival";
                                metric: string[];
                                page: number;
                                totalItems: number;
                                totalPages: number;
                            };
                            403: "Unauthorized" | "Forbidden";
                            422: {
                                type: "validation";
                                on: string;
                                summary?: string;
                                message?: string;
                                found?: unknown;
                                property?: string;
                                expected?: string;
                            };
                        };
                    };
                };
            };
        } & {
            campaigns: {
                expenses: {
                    get: {
                        body: {};
                        params: {};
                        query: {
                            l?: number | undefined;
                            p?: number | undefined;
                            window?: "all" | "24h" | "7d" | "30d" | "post-festival" | undefined;
                            postFestivalStart?: string | undefined;
                            campaign: string | string[];
                        };
                        headers: {};
                        response: {
                            200: {
                                limit: number;
                                items: {
                                    date: string;
                                    amount: number;
                                    createdAt: string;
                                    timezone: string;
                                    title: string;
                                    splitType: string;
                                    currency: string | null;
                                    category: {
                                        name: string;
                                        key: string | null;
                                    } | null;
                                    groupName: string | null;
                                    hasDescription: boolean;
                                    hasImage: boolean;
                                    amountInEuro: number;
                                    context: string;
                                    paidBy: {
                                        name: string;
                                        username: string | null;
                                    } | null;
                                    createdBy: {
                                        name: string;
                                        username: string | null;
                                    } | null;
                                    participantCount: number;
                                    isRecurring: boolean;
                                }[];
                                window: "all" | "24h" | "7d" | "30d" | "post-festival";
                                metric: string[];
                                page: number;
                                totalItems: number;
                                totalPages: number;
                            };
                            403: "Unauthorized" | "Forbidden";
                            422: {
                                type: "validation";
                                on: string;
                                summary?: string;
                                message?: string;
                                found?: unknown;
                                property?: string;
                                expected?: string;
                            };
                        };
                    };
                };
            };
        } & {
            campaigns: {
                payments: {
                    get: {
                        body: {};
                        params: {};
                        query: {
                            l?: number | undefined;
                            p?: number | undefined;
                            window?: "all" | "24h" | "7d" | "30d" | "post-festival" | undefined;
                            postFestivalStart?: string | undefined;
                            campaign: string | string[];
                        };
                        headers: {};
                        response: {
                            200: {
                                limit: number;
                                items: {
                                    date: string;
                                    amount: number;
                                    createdAt: string;
                                    description: string | null;
                                    timezone: string;
                                    isSettlement: boolean;
                                    currency: string | null;
                                    fromUser: {
                                        name: string;
                                        username: string | null;
                                    } | null;
                                    toUser: {
                                        name: string;
                                        username: string | null;
                                    } | null;
                                    groupName: string | null;
                                    hasDescription: boolean;
                                    amountInEuro: number;
                                    context: string;
                                    createdBy: {
                                        name: string;
                                        username: string | null;
                                    } | null;
                                }[];
                                window: "all" | "24h" | "7d" | "30d" | "post-festival";
                                metric: string[];
                                page: number;
                                totalItems: number;
                                totalPages: number;
                            };
                            403: "Unauthorized" | "Forbidden";
                            422: {
                                type: "validation";
                                on: string;
                                summary?: string;
                                message?: string;
                                found?: unknown;
                                property?: string;
                                expected?: string;
                            };
                        };
                    };
                };
            };
        } & {
            campaigns: {
                "active-users": {
                    get: {
                        body: {};
                        params: {};
                        query: {
                            l?: number | undefined;
                            p?: number | undefined;
                            window?: "all" | "24h" | "7d" | "30d" | "post-festival" | undefined;
                            postFestivalStart?: string | undefined;
                            campaign: string | string[];
                        };
                        headers: {};
                        response: {
                            200: {
                                limit: number;
                                items: {
                                    name: string;
                                    createdAt: string;
                                    username: string | null;
                                    expenseCount: number;
                                    paymentCount: number;
                                    groupCount: number;
                                    friendCount: number;
                                    inviteCount: number;
                                }[];
                                window: "all" | "24h" | "7d" | "30d" | "post-festival";
                                metric: string[];
                                page: number;
                                totalItems: number;
                                totalPages: number;
                            };
                            403: "Unauthorized" | "Forbidden";
                            422: {
                                type: "validation";
                                on: string;
                                summary?: string;
                                message?: string;
                                found?: unknown;
                                property?: string;
                                expected?: string;
                            };
                        };
                    };
                };
            };
        } & {
            campaigns: {
                guests: {
                    get: {
                        body: {};
                        params: {};
                        query: {
                            l?: number | undefined;
                            p?: number | undefined;
                            window?: "all" | "24h" | "7d" | "30d" | "post-festival" | undefined;
                            postFestivalStart?: string | undefined;
                            campaign: string | string[];
                        };
                        headers: {};
                        response: {
                            200: {
                                limit: number;
                                items: {
                                    name: string;
                                    emailVerified: boolean;
                                    createdAt: string;
                                    username: string | null;
                                    isGuest: boolean;
                                    inviteToken: string | null;
                                    lastLoginMethod: string | null;
                                    currency: string | null;
                                    groupCount: number;
                                    friendCount: number;
                                    hasGroups: boolean;
                                    expenseShareCount: number;
                                    hasExpenseShares: boolean;
                                    createdPaymentCount: number;
                                    hasCreatedPayment: boolean;
                                    lastActivityAt: string;
                                    profileCompleted: boolean;
                                    hasAvatar: boolean;
                                    hasBio: boolean;
                                }[];
                                window: "all" | "24h" | "7d" | "30d" | "post-festival";
                                metric: string[];
                                page: number;
                                totalItems: number;
                                totalPages: number;
                            };
                            403: "Unauthorized" | "Forbidden";
                            422: {
                                type: "validation";
                                on: string;
                                summary?: string;
                                message?: string;
                                found?: unknown;
                                property?: string;
                                expected?: string;
                            };
                        };
                    };
                };
            };
        };
    };
} & {
    admin: {
        metrics: {
            groups: {};
        } & {
            groups: {
                new: {
                    get: {
                        body: {};
                        params: {};
                        query: {
                            window?: "all" | "24h" | "7d" | "30d" | undefined;
                        };
                        headers: {};
                        response: {
                            200: {
                                count: number;
                                window: "all" | "24h" | "7d" | "30d";
                                metric: string;
                                previousWindowValue: number | null;
                            };
                            403: "Unauthorized" | "Forbidden";
                            422: {
                                type: "validation";
                                on: string;
                                summary?: string;
                                message?: string;
                                found?: unknown;
                                property?: string;
                                expected?: string;
                            };
                        };
                    };
                };
            };
        } & {
            groups: {
                latest: {
                    get: {
                        body: {};
                        params: {};
                        query: {
                            l?: number | undefined;
                            p?: number | undefined;
                        };
                        headers: {};
                        response: {
                            200: {
                                limit: number;
                                items: {
                                    name: string;
                                    createdAt: string;
                                    type: string;
                                    useOptimalSettlement: boolean;
                                    defaultSplitType: string;
                                    expenseCount: number;
                                    paymentCount: number;
                                    currency: string | null;
                                    creator: {
                                        name: string;
                                        username: string | null;
                                    } | null;
                                    memberCount: number;
                                    totalExpenseAmountInEuro: number;
                                    hasDescription: boolean;
                                    hasImage: boolean;
                                }[];
                                metric: "latest";
                                page: number;
                                totalItems: number;
                                totalPages: number;
                            };
                            403: "Unauthorized" | "Forbidden";
                            422: {
                                type: "validation";
                                on: string;
                                summary?: string;
                                message?: string;
                                found?: unknown;
                                property?: string;
                                expected?: string;
                            };
                        };
                    };
                };
            };
        } & {
            groups: {
                total: {
                    get: {
                        body: {};
                        params: {};
                        query: {};
                        headers: {};
                        response: {
                            200: {
                                count: number;
                                window: "all" | "24h" | "7d" | "30d";
                                metric: string;
                                previousWindowValue: number | null;
                            };
                            403: "Unauthorized" | "Forbidden";
                            422: {
                                type: "validation";
                                on: string;
                                summary?: string;
                                message?: string;
                                found?: unknown;
                                property?: string;
                                expected?: string;
                            };
                        };
                    };
                };
            };
        } & {
            groups: {
                "has-description": {
                    get: {
                        body: {};
                        params: {};
                        query: {
                            window?: "all" | "24h" | "7d" | "30d" | undefined;
                        };
                        headers: {};
                        response: {
                            200: {
                                count: number;
                                window: "all" | "24h" | "7d" | "30d";
                                metric: string;
                                previousWindowValue: number | null;
                            };
                            403: "Unauthorized" | "Forbidden";
                            422: {
                                type: "validation";
                                on: string;
                                summary?: string;
                                message?: string;
                                found?: unknown;
                                property?: string;
                                expected?: string;
                            };
                        };
                    };
                };
            };
        } & {
            groups: {
                "optimal-settlement-enabled": {
                    get: {
                        body: {};
                        params: {};
                        query: {
                            window?: "all" | "24h" | "7d" | "30d" | undefined;
                        };
                        headers: {};
                        response: {
                            200: {
                                count: number;
                                window: "all" | "24h" | "7d" | "30d";
                                metric: string;
                                previousWindowValue: number | null;
                            };
                            403: "Unauthorized" | "Forbidden";
                            422: {
                                type: "validation";
                                on: string;
                                summary?: string;
                                message?: string;
                                found?: unknown;
                                property?: string;
                                expected?: string;
                            };
                        };
                    };
                };
            };
        } & {
            groups: {
                "size-count": {
                    get: {
                        body: {};
                        params: {};
                        query: {
                            window?: "all" | "24h" | "7d" | "30d" | undefined;
                        };
                        headers: {};
                        response: {
                            200: {
                                window: "all" | "24h" | "7d" | "30d";
                                metric: "size-count";
                                buckets: {
                                    size: number;
                                    count: number;
                                }[];
                                groupCount: number;
                            };
                            403: "Unauthorized" | "Forbidden";
                            422: {
                                type: "validation";
                                on: string;
                                summary?: string;
                                message?: string;
                                found?: unknown;
                                property?: string;
                                expected?: string;
                            };
                        };
                    };
                };
            };
        } & {
            groups: {
                "avg-size": {
                    get: {
                        body: {};
                        params: {};
                        query: {
                            window?: "all" | "24h" | "7d" | "30d" | undefined;
                        };
                        headers: {};
                        response: {
                            200: {
                                window: "all" | "24h" | "7d" | "30d";
                                metric: "avg-size";
                                previousWindowValue: number | null;
                                groupCount: number;
                                averageSize: number;
                                memberCount: number;
                            };
                            403: "Unauthorized" | "Forbidden";
                            422: {
                                type: "validation";
                                on: string;
                                summary?: string;
                                message?: string;
                                found?: unknown;
                                property?: string;
                                expected?: string;
                            };
                        };
                    };
                };
            };
        } & {
            groups: {
                "avg-spent": {
                    get: {
                        body: {};
                        params: {};
                        query: {
                            window?: "all" | "24h" | "7d" | "30d" | undefined;
                        };
                        headers: {};
                        response: {
                            200: {
                                window: "all" | "24h" | "7d" | "30d";
                                metric: "avg-spent";
                                previousWindowValue: number | null;
                                groupCount: number;
                                averageSpent: number;
                                totalSpent: number;
                            };
                            403: "Unauthorized" | "Forbidden";
                            422: {
                                type: "validation";
                                on: string;
                                summary?: string;
                                message?: string;
                                found?: unknown;
                                property?: string;
                                expected?: string;
                            };
                        };
                    };
                };
            };
        } & {
            groups: {
                "avg-creators-per-payer": {
                    get: {
                        body: {};
                        params: {};
                        query: {
                            window?: "all" | "24h" | "7d" | "30d" | undefined;
                        };
                        headers: {};
                        response: {
                            200: {
                                window: "all" | "24h" | "7d" | "30d";
                                metric: "avg-creators-per-payer";
                                previousWindowValue: number | null;
                                groupCount: number;
                                averageCreatorsPerPayer: number;
                            };
                            403: "Unauthorized" | "Forbidden";
                            422: {
                                type: "validation";
                                on: string;
                                summary?: string;
                                message?: string;
                                found?: unknown;
                                property?: string;
                                expected?: string;
                            };
                        };
                    };
                };
            };
        } & {
            groups: {
                "avg-creators-per-member": {
                    get: {
                        body: {};
                        params: {};
                        query: {
                            window?: "all" | "24h" | "7d" | "30d" | undefined;
                        };
                        headers: {};
                        response: {
                            200: {
                                window: "all" | "24h" | "7d" | "30d";
                                metric: "avg-creators-per-member";
                                previousWindowValue: number | null;
                                groupCount: number;
                                averageCreatorsPerMember: number;
                            };
                            403: "Unauthorized" | "Forbidden";
                            422: {
                                type: "validation";
                                on: string;
                                summary?: string;
                                message?: string;
                                found?: unknown;
                                property?: string;
                                expected?: string;
                            };
                        };
                    };
                };
            };
        };
    };
} & {
    admin: {
        metrics: {
            guests: {};
        } & {
            guests: {
                new: {
                    get: {
                        body: {};
                        params: {};
                        query: {
                            window?: "all" | "24h" | "7d" | "30d" | undefined;
                        };
                        headers: {};
                        response: {
                            200: {
                                count: number;
                                window: "all" | "24h" | "7d" | "30d";
                                metric: string;
                                previousWindowValue: number | null;
                            };
                            403: "Unauthorized" | "Forbidden";
                            422: {
                                type: "validation";
                                on: string;
                                summary?: string;
                                message?: string;
                                found?: unknown;
                                property?: string;
                                expected?: string;
                            };
                        };
                    };
                };
            };
        } & {
            guests: {
                "new-active": {
                    get: {
                        body: {};
                        params: {};
                        query: {
                            window?: "all" | "24h" | "7d" | "30d" | undefined;
                        };
                        headers: {};
                        response: {
                            200: {
                                count: number;
                                window: "all" | "24h" | "7d" | "30d";
                                metric: string;
                                previousWindowValue: number | null;
                            };
                            403: "Unauthorized" | "Forbidden";
                            422: {
                                type: "validation";
                                on: string;
                                summary?: string;
                                message?: string;
                                found?: unknown;
                                property?: string;
                                expected?: string;
                            };
                        };
                    };
                };
            };
        } & {
            guests: {
                total: {
                    get: {
                        body: {};
                        params: {};
                        query: {};
                        headers: {};
                        response: {
                            200: {
                                count: number;
                                window: "all" | "24h" | "7d" | "30d";
                                metric: string;
                                previousWindowValue: number | null;
                            };
                            403: "Unauthorized" | "Forbidden";
                            422: {
                                type: "validation";
                                on: string;
                                summary?: string;
                                message?: string;
                                found?: unknown;
                                property?: string;
                                expected?: string;
                            };
                        };
                    };
                };
            };
        } & {
            guests: {
                claimed: {
                    get: {
                        body: {};
                        params: {};
                        query: {
                            window?: "all" | "24h" | "7d" | "30d" | undefined;
                        };
                        headers: {};
                        response: {
                            200: {
                                count: number;
                                window: "all" | "24h" | "7d" | "30d";
                                metric: string;
                                previousWindowValue: number | null;
                            };
                            403: "Unauthorized" | "Forbidden";
                            422: {
                                type: "validation";
                                on: string;
                                summary?: string;
                                message?: string;
                                found?: unknown;
                                property?: string;
                                expected?: string;
                            };
                        };
                    };
                };
            };
        } & {
            guests: {
                archived: {
                    get: {
                        body: {};
                        params: {};
                        query: {
                            window?: "all" | "24h" | "7d" | "30d" | undefined;
                        };
                        headers: {};
                        response: {
                            200: {
                                count: number;
                                window: "all" | "24h" | "7d" | "30d";
                                metric: string;
                                previousWindowValue: number | null;
                            };
                            403: "Unauthorized" | "Forbidden";
                            422: {
                                type: "validation";
                                on: string;
                                summary?: string;
                                message?: string;
                                found?: unknown;
                                property?: string;
                                expected?: string;
                            };
                        };
                    };
                };
            };
        } & {
            guests: {
                merged: {
                    get: {
                        body: {};
                        params: {};
                        query: {
                            window?: "all" | "24h" | "7d" | "30d" | undefined;
                        };
                        headers: {};
                        response: {
                            200: {
                                count: number;
                                window: "all" | "24h" | "7d" | "30d";
                                metric: string;
                                previousWindowValue: number | null;
                            };
                            403: "Unauthorized" | "Forbidden";
                            422: {
                                type: "validation";
                                on: string;
                                summary?: string;
                                message?: string;
                                found?: unknown;
                                property?: string;
                                expected?: string;
                            };
                        };
                    };
                };
            };
        } & {
            guests: {
                "has-email": {
                    get: {
                        body: {};
                        params: {};
                        query: {
                            window?: "all" | "24h" | "7d" | "30d" | undefined;
                        };
                        headers: {};
                        response: {
                            200: {
                                count: number;
                                window: "all" | "24h" | "7d" | "30d";
                                metric: string;
                                previousWindowValue: number | null;
                            };
                            403: "Unauthorized" | "Forbidden";
                            422: {
                                type: "validation";
                                on: string;
                                summary?: string;
                                message?: string;
                                found?: unknown;
                                property?: string;
                                expected?: string;
                            };
                        };
                    };
                };
            };
        } & {
            guests: {
                "has-group": {
                    get: {
                        body: {};
                        params: {};
                        query: {
                            window?: "all" | "24h" | "7d" | "30d" | undefined;
                        };
                        headers: {};
                        response: {
                            200: {
                                count: number;
                                window: "all" | "24h" | "7d" | "30d";
                                metric: string;
                                previousWindowValue: number | null;
                            };
                            403: "Unauthorized" | "Forbidden";
                            422: {
                                type: "validation";
                                on: string;
                                summary?: string;
                                message?: string;
                                found?: unknown;
                                property?: string;
                                expected?: string;
                            };
                        };
                    };
                };
            };
        } & {
            guests: {
                "manager-count": {
                    get: {
                        body: {};
                        params: {};
                        query: {
                            window?: "all" | "24h" | "7d" | "30d" | undefined;
                        };
                        headers: {};
                        response: {
                            200: {
                                count: number;
                                window: "all" | "24h" | "7d" | "30d";
                                metric: string;
                                previousWindowValue: number | null;
                            };
                            403: "Unauthorized" | "Forbidden";
                            422: {
                                type: "validation";
                                on: string;
                                summary?: string;
                                message?: string;
                                found?: unknown;
                                property?: string;
                                expected?: string;
                            };
                        };
                    };
                };
            };
        } & {
            guests: {
                latest: {
                    get: {
                        body: {};
                        params: {};
                        query: {
                            l?: number | undefined;
                            p?: number | undefined;
                        };
                        headers: {};
                        response: {
                            200: {
                                limit: number;
                                items: {
                                    name: string;
                                    emailVerified: boolean;
                                    createdAt: string;
                                    username: string | null;
                                    isGuest: boolean;
                                    inviteToken: string | null;
                                    lastLoginMethod: string | null;
                                    currency: string | null;
                                    groupCount: number;
                                    friendCount: number;
                                    hasGroups: boolean;
                                    expenseShareCount: number;
                                    hasExpenseShares: boolean;
                                    createdPaymentCount: number;
                                    hasCreatedPayment: boolean;
                                    lastActivityAt: string;
                                    profileCompleted: boolean;
                                    hasAvatar: boolean;
                                    hasBio: boolean;
                                }[];
                                metric: "latest";
                                page: number;
                                totalItems: number;
                                totalPages: number;
                            };
                            403: "Unauthorized" | "Forbidden";
                            422: {
                                type: "validation";
                                on: string;
                                summary?: string;
                                message?: string;
                                found?: unknown;
                                property?: string;
                                expected?: string;
                            };
                        };
                    };
                };
            };
        };
    };
} & {
    admin: {
        metrics: {
            "snap-it": {};
        } & {
            "snap-it": {
                insights: {
                    get: {
                        body: {};
                        params: {};
                        query: {
                            months?: number | undefined;
                        };
                        headers: {};
                        response: {
                            200: {
                                featureKey: "snap.scan";
                                period: "calendar_month";
                                metric: "insights";
                                buckets: {
                                    periodStart: string;
                                    periodEnd: string;
                                    scanCount: number;
                                    scanningUserCount: number;
                                    averageScansPerScanningUser: number;
                                }[];
                                months: number;
                                currentMonth: {
                                    periodStart: string;
                                    periodEnd: string;
                                    scanCount: number;
                                    scanningUserCount: number;
                                    averageScansPerScanningUser: number;
                                };
                                previousMonth: {
                                    periodStart: string;
                                    periodEnd: string;
                                    scanCount: number;
                                    scanningUserCount: number;
                                    averageScansPerScanningUser: number;
                                };
                            };
                            403: "Unauthorized" | "Forbidden";
                            422: {
                                type: "validation";
                                on: string;
                                summary?: string;
                                message?: string;
                                found?: unknown;
                                property?: string;
                                expected?: string;
                            };
                        };
                    };
                };
            };
        };
    };
} & {
    users: {};
} & {
    users: {
        ":id": {
            get: {
                body: {};
                params: {
                    id: string;
                };
                query: {};
                headers: {};
                response: {
                    410: {};
                    401: "Unauthorized";
                    200: {
                        deletedAt: Date | null;
                        currency: {
                            id: string;
                            name: string;
                            code: string;
                            symbol: string | null;
                            exchangeRateToBase: string;
                            updatedAt: Date;
                            decimals: number;
                            type: "fiat" | "crypto";
                        } | undefined;
                        isGold: boolean;
                        managedBy?: string | null | undefined;
                        id: string;
                        name: string;
                        image: string | null;
                        username: string | null;
                        bio: string | null;
                        isGuest: boolean;
                    } | {
                        isGold: boolean;
                        id: string;
                        name: string;
                        email: string | null;
                        emailVerified: boolean;
                        image: string | null;
                        createdAt: Date;
                        updatedAt: Date;
                        username: string | null;
                        displayUsername: string | null;
                        bio: string | null;
                        isGuest: boolean;
                        managedBy: string | null;
                        currencyId: string | null;
                        inviteToken: string | null;
                        role: string | null;
                        banned: boolean | null;
                        banReason: string | null;
                        banExpires: Date | null;
                        lastLoginMethod: string | null;
                        profileCompletedAt: Date | null;
                        deletedAt: Date | null;
                        guestState: "managed" | "archived" | "merged" | null;
                        guestClaimedAt: Date | null;
                        guestArchivedAt: Date | null;
                        guestMergedAt: Date | null;
                        mergedIntoUserId: string | null;
                        currency?: {
                            id: string;
                            name: string;
                            code: string;
                            symbol: string | null;
                            exchangeRateToBase: string;
                            updatedAt: Date;
                            decimals: number;
                            type: "fiat" | "crypto";
                        } | undefined;
                    } | {
                        friendship: {
                            id: string;
                            userId1: string;
                            userId2: string;
                            status: "deleted" | "pending" | "accepted" | "rejected";
                            requestedById: string;
                            acceptedAt: Date | null;
                            createdAt: Date;
                            updatedAt: Date;
                        };
                        deletedAt: Date | null;
                        currency: {
                            id: string;
                            name: string;
                            code: string;
                            symbol: string | null;
                            exchangeRateToBase: string;
                            updatedAt: Date;
                            decimals: number;
                            type: "fiat" | "crypto";
                        } | undefined;
                        isGold: boolean;
                        managedBy?: string | null | undefined;
                        id: string;
                        name: string;
                        image: string | null;
                        username: string | null;
                        bio: string | null;
                        isGuest: boolean;
                    } | {
                        friendship: {
                            id: string;
                            userId1: string;
                            userId2: string;
                            status: "deleted" | "pending" | "accepted" | "rejected";
                            requestedById: string;
                            acceptedAt: Date | null;
                            createdAt: Date;
                            updatedAt: Date;
                        };
                        balance: number;
                        deletedAt: Date | null;
                        currency: {
                            id: string;
                            name: string;
                            code: string;
                            symbol: string | null;
                            exchangeRateToBase: string;
                            updatedAt: Date;
                            decimals: number;
                            type: "fiat" | "crypto";
                        } | undefined;
                        isGold: boolean;
                        managedBy?: string | null | undefined;
                        id: string;
                        name: string;
                        image: string | null;
                        username: string | null;
                        bio: string | null;
                        isGuest: boolean;
                    };
                    403: {
                        code: string;
                        message: string;
                    };
                    404: {};
                    422: {
                        type: "validation";
                        on: string;
                        summary?: string;
                        message?: string;
                        found?: unknown;
                        property?: string;
                        expected?: string;
                    };
                };
            };
        };
    };
} & {
    users: {
        search: {
            get: {
                body: {};
                params: {};
                query: {
                    q: string;
                };
                headers: {};
                response: {
                    401: "Unauthorized";
                    403: {
                        code: string;
                        message: string;
                    };
                    422: {
                        type: "validation";
                        on: string;
                        summary?: string;
                        message?: string;
                        found?: unknown;
                        property?: string;
                        expected?: string;
                    };
                };
            };
        };
    };
} & {
    users: {
        ":id": {
            put: {
                body: {
                    name?: string | undefined;
                    bio?: string | undefined;
                    currencyId?: string | undefined;
                    inviteToken?: string | undefined;
                };
                params: {
                    id: string;
                };
                query: {};
                headers: {};
                response: {
                    401: "Unauthorized";
                    403: {
                        code: string;
                        message: string;
                    };
                    422: {
                        type: "validation";
                        on: string;
                        summary?: string;
                        message?: string;
                        found?: unknown;
                        property?: string;
                        expected?: string;
                    };
                };
            };
        };
    };
} & {
    users: {
        ":id": {
            delete: {
                body: {};
                params: {
                    id: string;
                };
                query: {};
                headers: {};
                response: {
                    401: "Unauthorized";
                    403: {
                        code: string;
                        message: string;
                    };
                    422: {
                        type: "validation";
                        on: string;
                        summary?: string;
                        message?: string;
                        found?: unknown;
                        property?: string;
                        expected?: string;
                    };
                };
            };
        };
    };
} & {
    users: {
        avatar: {
            post: {
                body: {
                    image: File;
                };
                params: {};
                query: {};
                headers: {};
                response: {
                    401: "Unauthorized";
                    403: {
                        code: string;
                        message: string;
                    };
                    422: {
                        type: "validation";
                        on: string;
                        summary?: string;
                        message?: string;
                        found?: unknown;
                        property?: string;
                        expected?: string;
                    };
                };
            };
        };
    };
} & {
    users: {
        ":id": {
            balances: {
                get: {
                    body: {};
                    params: {
                        id: string;
                    };
                    query: {};
                    headers: {};
                    response: {
                        401: "Unauthorized";
                        403: {
                            code: string;
                            message: string;
                        };
                        422: {
                            type: "validation";
                            on: string;
                            summary?: string;
                            message?: string;
                            found?: unknown;
                            property?: string;
                            expected?: string;
                        };
                    };
                };
            };
        };
    };
} & {
    users: {
        guests: {};
    } & {
        guests: {
            post: {
                body: {
                    email?: string | undefined;
                    image?: string | null | undefined;
                    name: string;
                };
                params: {};
                query: {};
                headers: {};
                response: {
                    410: {
                        mergedIntoUserId?: string | null | undefined;
                        code: "GUEST_NOT_FOUND" | "GUEST_NOT_MANAGED" | "USER_MERGED" | "GUEST_NAME_REQUIRED" | "GUEST_NAME_TOO_LONG" | "GUEST_EMAIL_INVALID" | "GUEST_EMAIL_TOO_LONG" | "GUEST_CURRENCY_INVALID" | "GUEST_UPDATE_EMPTY" | "GUEST_FUSION_NOT_FOUND" | "GUEST_FUSION_EXPIRED" | "GUEST_FUSION_REVOKED" | "GUEST_FUSION_ALREADY_COMPLETED" | "GUEST_FUSION_TARGET_CONFLICT" | "GUEST_FUSION_TARGET_INVALID" | "GUEST_FUSION_TOKEN_MALFORMED" | "GUEST_FUSION_LEGACY_UNSUPPORTED" | "GUEST_FUSION_SOURCE_ANOMALY" | "GUEST_FUSION_PROJECTION_CONFLICT" | "GUEST_FUSION_TRANSFER_CONFLICT" | "GUEST_SESSION_FORBIDDEN" | "EMAIL_ALREADY_EXISTS" | "GUEST_MANAGER_INVALID" | "GUEST_UPDATE_CONFLICT";
                        message: string;
                    };
                    401: "Unauthorized";
                    201: {
                        currency?: {
                            symbol: string | null;
                            id: string;
                            name: string;
                            updatedAt: Date;
                            code: string;
                            exchangeRateToBase: string;
                            decimals: number;
                            type: "fiat" | "crypto";
                        } | null | undefined;
                        id: string;
                        name: string;
                        email: string | null;
                        emailVerified: boolean;
                        image: string | null;
                        createdAt: Date;
                        updatedAt: Date;
                        username: string | null;
                        displayUsername: string | null;
                        bio: string | null;
                        isGuest: boolean;
                        managedBy: string | null;
                        currencyId: string | null;
                        inviteToken: string | null;
                        role: string | null;
                        banned: boolean | null;
                        banReason: string | null;
                        banExpires: Date | null;
                        lastLoginMethod: string | null;
                        profileCompletedAt: Date | null;
                        deletedAt: Date | null;
                        guestState: "managed" | "archived" | "merged" | null;
                        guestClaimedAt: Date | null;
                        guestArchivedAt: Date | null;
                        guestMergedAt: Date | null;
                        mergedIntoUserId: string | null;
                    };
                    403: {
                        mergedIntoUserId?: string | null | undefined;
                        code: "GUEST_NOT_FOUND" | "GUEST_NOT_MANAGED" | "USER_MERGED" | "GUEST_NAME_REQUIRED" | "GUEST_NAME_TOO_LONG" | "GUEST_EMAIL_INVALID" | "GUEST_EMAIL_TOO_LONG" | "GUEST_CURRENCY_INVALID" | "GUEST_UPDATE_EMPTY" | "GUEST_FUSION_NOT_FOUND" | "GUEST_FUSION_EXPIRED" | "GUEST_FUSION_REVOKED" | "GUEST_FUSION_ALREADY_COMPLETED" | "GUEST_FUSION_TARGET_CONFLICT" | "GUEST_FUSION_TARGET_INVALID" | "GUEST_FUSION_TOKEN_MALFORMED" | "GUEST_FUSION_LEGACY_UNSUPPORTED" | "GUEST_FUSION_SOURCE_ANOMALY" | "GUEST_FUSION_PROJECTION_CONFLICT" | "GUEST_FUSION_TRANSFER_CONFLICT" | "GUEST_SESSION_FORBIDDEN" | "EMAIL_ALREADY_EXISTS" | "GUEST_MANAGER_INVALID" | "GUEST_UPDATE_CONFLICT";
                        message: string;
                    };
                    404: {
                        mergedIntoUserId?: string | null | undefined;
                        code: "GUEST_NOT_FOUND" | "GUEST_NOT_MANAGED" | "USER_MERGED" | "GUEST_NAME_REQUIRED" | "GUEST_NAME_TOO_LONG" | "GUEST_EMAIL_INVALID" | "GUEST_EMAIL_TOO_LONG" | "GUEST_CURRENCY_INVALID" | "GUEST_UPDATE_EMPTY" | "GUEST_FUSION_NOT_FOUND" | "GUEST_FUSION_EXPIRED" | "GUEST_FUSION_REVOKED" | "GUEST_FUSION_ALREADY_COMPLETED" | "GUEST_FUSION_TARGET_CONFLICT" | "GUEST_FUSION_TARGET_INVALID" | "GUEST_FUSION_TOKEN_MALFORMED" | "GUEST_FUSION_LEGACY_UNSUPPORTED" | "GUEST_FUSION_SOURCE_ANOMALY" | "GUEST_FUSION_PROJECTION_CONFLICT" | "GUEST_FUSION_TRANSFER_CONFLICT" | "GUEST_SESSION_FORBIDDEN" | "EMAIL_ALREADY_EXISTS" | "GUEST_MANAGER_INVALID" | "GUEST_UPDATE_CONFLICT";
                        message: string;
                    };
                    409: {
                        mergedIntoUserId?: string | null | undefined;
                        code: "GUEST_NOT_FOUND" | "GUEST_NOT_MANAGED" | "USER_MERGED" | "GUEST_NAME_REQUIRED" | "GUEST_NAME_TOO_LONG" | "GUEST_EMAIL_INVALID" | "GUEST_EMAIL_TOO_LONG" | "GUEST_CURRENCY_INVALID" | "GUEST_UPDATE_EMPTY" | "GUEST_FUSION_NOT_FOUND" | "GUEST_FUSION_EXPIRED" | "GUEST_FUSION_REVOKED" | "GUEST_FUSION_ALREADY_COMPLETED" | "GUEST_FUSION_TARGET_CONFLICT" | "GUEST_FUSION_TARGET_INVALID" | "GUEST_FUSION_TOKEN_MALFORMED" | "GUEST_FUSION_LEGACY_UNSUPPORTED" | "GUEST_FUSION_SOURCE_ANOMALY" | "GUEST_FUSION_PROJECTION_CONFLICT" | "GUEST_FUSION_TRANSFER_CONFLICT" | "GUEST_SESSION_FORBIDDEN" | "EMAIL_ALREADY_EXISTS" | "GUEST_MANAGER_INVALID" | "GUEST_UPDATE_CONFLICT";
                        message: string;
                    };
                    422: {
                        mergedIntoUserId?: string | null | undefined;
                        code: "GUEST_NOT_FOUND" | "GUEST_NOT_MANAGED" | "USER_MERGED" | "GUEST_NAME_REQUIRED" | "GUEST_NAME_TOO_LONG" | "GUEST_EMAIL_INVALID" | "GUEST_EMAIL_TOO_LONG" | "GUEST_CURRENCY_INVALID" | "GUEST_UPDATE_EMPTY" | "GUEST_FUSION_NOT_FOUND" | "GUEST_FUSION_EXPIRED" | "GUEST_FUSION_REVOKED" | "GUEST_FUSION_ALREADY_COMPLETED" | "GUEST_FUSION_TARGET_CONFLICT" | "GUEST_FUSION_TARGET_INVALID" | "GUEST_FUSION_TOKEN_MALFORMED" | "GUEST_FUSION_LEGACY_UNSUPPORTED" | "GUEST_FUSION_SOURCE_ANOMALY" | "GUEST_FUSION_PROJECTION_CONFLICT" | "GUEST_FUSION_TRANSFER_CONFLICT" | "GUEST_SESSION_FORBIDDEN" | "EMAIL_ALREADY_EXISTS" | "GUEST_MANAGER_INVALID" | "GUEST_UPDATE_CONFLICT";
                        message: string;
                    };
                };
            };
        };
    } & {
        guests: {
            ":id": {
                merge: {
                    request: {
                        post: {
                            body: {};
                            params: {
                                id: string;
                            };
                            query: {};
                            headers: {};
                            response: {
                                410: {
                                    mergedIntoUserId?: string | null | undefined;
                                    code: "GUEST_NOT_FOUND" | "GUEST_NOT_MANAGED" | "USER_MERGED" | "GUEST_NAME_REQUIRED" | "GUEST_NAME_TOO_LONG" | "GUEST_EMAIL_INVALID" | "GUEST_EMAIL_TOO_LONG" | "GUEST_CURRENCY_INVALID" | "GUEST_UPDATE_EMPTY" | "GUEST_FUSION_NOT_FOUND" | "GUEST_FUSION_EXPIRED" | "GUEST_FUSION_REVOKED" | "GUEST_FUSION_ALREADY_COMPLETED" | "GUEST_FUSION_TARGET_CONFLICT" | "GUEST_FUSION_TARGET_INVALID" | "GUEST_FUSION_TOKEN_MALFORMED" | "GUEST_FUSION_LEGACY_UNSUPPORTED" | "GUEST_FUSION_SOURCE_ANOMALY" | "GUEST_FUSION_PROJECTION_CONFLICT" | "GUEST_FUSION_TRANSFER_CONFLICT" | "GUEST_SESSION_FORBIDDEN" | "EMAIL_ALREADY_EXISTS" | "GUEST_MANAGER_INVALID" | "GUEST_UPDATE_CONFLICT";
                                    message: string;
                                };
                                401: "Unauthorized";
                                201: {
                                    expiresAt: Date;
                                    token: string;
                                };
                                403: {
                                    mergedIntoUserId?: string | null | undefined;
                                    code: "GUEST_NOT_FOUND" | "GUEST_NOT_MANAGED" | "USER_MERGED" | "GUEST_NAME_REQUIRED" | "GUEST_NAME_TOO_LONG" | "GUEST_EMAIL_INVALID" | "GUEST_EMAIL_TOO_LONG" | "GUEST_CURRENCY_INVALID" | "GUEST_UPDATE_EMPTY" | "GUEST_FUSION_NOT_FOUND" | "GUEST_FUSION_EXPIRED" | "GUEST_FUSION_REVOKED" | "GUEST_FUSION_ALREADY_COMPLETED" | "GUEST_FUSION_TARGET_CONFLICT" | "GUEST_FUSION_TARGET_INVALID" | "GUEST_FUSION_TOKEN_MALFORMED" | "GUEST_FUSION_LEGACY_UNSUPPORTED" | "GUEST_FUSION_SOURCE_ANOMALY" | "GUEST_FUSION_PROJECTION_CONFLICT" | "GUEST_FUSION_TRANSFER_CONFLICT" | "GUEST_SESSION_FORBIDDEN" | "EMAIL_ALREADY_EXISTS" | "GUEST_MANAGER_INVALID" | "GUEST_UPDATE_CONFLICT";
                                    message: string;
                                };
                                404: {
                                    mergedIntoUserId?: string | null | undefined;
                                    code: "GUEST_NOT_FOUND" | "GUEST_NOT_MANAGED" | "USER_MERGED" | "GUEST_NAME_REQUIRED" | "GUEST_NAME_TOO_LONG" | "GUEST_EMAIL_INVALID" | "GUEST_EMAIL_TOO_LONG" | "GUEST_CURRENCY_INVALID" | "GUEST_UPDATE_EMPTY" | "GUEST_FUSION_NOT_FOUND" | "GUEST_FUSION_EXPIRED" | "GUEST_FUSION_REVOKED" | "GUEST_FUSION_ALREADY_COMPLETED" | "GUEST_FUSION_TARGET_CONFLICT" | "GUEST_FUSION_TARGET_INVALID" | "GUEST_FUSION_TOKEN_MALFORMED" | "GUEST_FUSION_LEGACY_UNSUPPORTED" | "GUEST_FUSION_SOURCE_ANOMALY" | "GUEST_FUSION_PROJECTION_CONFLICT" | "GUEST_FUSION_TRANSFER_CONFLICT" | "GUEST_SESSION_FORBIDDEN" | "EMAIL_ALREADY_EXISTS" | "GUEST_MANAGER_INVALID" | "GUEST_UPDATE_CONFLICT";
                                    message: string;
                                };
                                409: {
                                    mergedIntoUserId?: string | null | undefined;
                                    code: "GUEST_NOT_FOUND" | "GUEST_NOT_MANAGED" | "USER_MERGED" | "GUEST_NAME_REQUIRED" | "GUEST_NAME_TOO_LONG" | "GUEST_EMAIL_INVALID" | "GUEST_EMAIL_TOO_LONG" | "GUEST_CURRENCY_INVALID" | "GUEST_UPDATE_EMPTY" | "GUEST_FUSION_NOT_FOUND" | "GUEST_FUSION_EXPIRED" | "GUEST_FUSION_REVOKED" | "GUEST_FUSION_ALREADY_COMPLETED" | "GUEST_FUSION_TARGET_CONFLICT" | "GUEST_FUSION_TARGET_INVALID" | "GUEST_FUSION_TOKEN_MALFORMED" | "GUEST_FUSION_LEGACY_UNSUPPORTED" | "GUEST_FUSION_SOURCE_ANOMALY" | "GUEST_FUSION_PROJECTION_CONFLICT" | "GUEST_FUSION_TRANSFER_CONFLICT" | "GUEST_SESSION_FORBIDDEN" | "EMAIL_ALREADY_EXISTS" | "GUEST_MANAGER_INVALID" | "GUEST_UPDATE_CONFLICT";
                                    message: string;
                                };
                                422: {
                                    mergedIntoUserId?: string | null | undefined;
                                    code: "GUEST_NOT_FOUND" | "GUEST_NOT_MANAGED" | "USER_MERGED" | "GUEST_NAME_REQUIRED" | "GUEST_NAME_TOO_LONG" | "GUEST_EMAIL_INVALID" | "GUEST_EMAIL_TOO_LONG" | "GUEST_CURRENCY_INVALID" | "GUEST_UPDATE_EMPTY" | "GUEST_FUSION_NOT_FOUND" | "GUEST_FUSION_EXPIRED" | "GUEST_FUSION_REVOKED" | "GUEST_FUSION_ALREADY_COMPLETED" | "GUEST_FUSION_TARGET_CONFLICT" | "GUEST_FUSION_TARGET_INVALID" | "GUEST_FUSION_TOKEN_MALFORMED" | "GUEST_FUSION_LEGACY_UNSUPPORTED" | "GUEST_FUSION_SOURCE_ANOMALY" | "GUEST_FUSION_PROJECTION_CONFLICT" | "GUEST_FUSION_TRANSFER_CONFLICT" | "GUEST_SESSION_FORBIDDEN" | "EMAIL_ALREADY_EXISTS" | "GUEST_MANAGER_INVALID" | "GUEST_UPDATE_CONFLICT";
                                    message: string;
                                };
                            };
                        };
                    };
                };
            };
        };
    } & {
        guests: {
            ":id": {
                merge: {
                    request: {
                        delete: {
                            body: {};
                            params: {
                                id: string;
                            };
                            query: {};
                            headers: {};
                            response: {
                                410: {
                                    mergedIntoUserId?: string | null | undefined;
                                    code: "GUEST_NOT_FOUND" | "GUEST_NOT_MANAGED" | "USER_MERGED" | "GUEST_NAME_REQUIRED" | "GUEST_NAME_TOO_LONG" | "GUEST_EMAIL_INVALID" | "GUEST_EMAIL_TOO_LONG" | "GUEST_CURRENCY_INVALID" | "GUEST_UPDATE_EMPTY" | "GUEST_FUSION_NOT_FOUND" | "GUEST_FUSION_EXPIRED" | "GUEST_FUSION_REVOKED" | "GUEST_FUSION_ALREADY_COMPLETED" | "GUEST_FUSION_TARGET_CONFLICT" | "GUEST_FUSION_TARGET_INVALID" | "GUEST_FUSION_TOKEN_MALFORMED" | "GUEST_FUSION_LEGACY_UNSUPPORTED" | "GUEST_FUSION_SOURCE_ANOMALY" | "GUEST_FUSION_PROJECTION_CONFLICT" | "GUEST_FUSION_TRANSFER_CONFLICT" | "GUEST_SESSION_FORBIDDEN" | "EMAIL_ALREADY_EXISTS" | "GUEST_MANAGER_INVALID" | "GUEST_UPDATE_CONFLICT";
                                    message: string;
                                };
                                401: "Unauthorized";
                                204: void;
                                403: {
                                    mergedIntoUserId?: string | null | undefined;
                                    code: "GUEST_NOT_FOUND" | "GUEST_NOT_MANAGED" | "USER_MERGED" | "GUEST_NAME_REQUIRED" | "GUEST_NAME_TOO_LONG" | "GUEST_EMAIL_INVALID" | "GUEST_EMAIL_TOO_LONG" | "GUEST_CURRENCY_INVALID" | "GUEST_UPDATE_EMPTY" | "GUEST_FUSION_NOT_FOUND" | "GUEST_FUSION_EXPIRED" | "GUEST_FUSION_REVOKED" | "GUEST_FUSION_ALREADY_COMPLETED" | "GUEST_FUSION_TARGET_CONFLICT" | "GUEST_FUSION_TARGET_INVALID" | "GUEST_FUSION_TOKEN_MALFORMED" | "GUEST_FUSION_LEGACY_UNSUPPORTED" | "GUEST_FUSION_SOURCE_ANOMALY" | "GUEST_FUSION_PROJECTION_CONFLICT" | "GUEST_FUSION_TRANSFER_CONFLICT" | "GUEST_SESSION_FORBIDDEN" | "EMAIL_ALREADY_EXISTS" | "GUEST_MANAGER_INVALID" | "GUEST_UPDATE_CONFLICT";
                                    message: string;
                                };
                                404: {
                                    mergedIntoUserId?: string | null | undefined;
                                    code: "GUEST_NOT_FOUND" | "GUEST_NOT_MANAGED" | "USER_MERGED" | "GUEST_NAME_REQUIRED" | "GUEST_NAME_TOO_LONG" | "GUEST_EMAIL_INVALID" | "GUEST_EMAIL_TOO_LONG" | "GUEST_CURRENCY_INVALID" | "GUEST_UPDATE_EMPTY" | "GUEST_FUSION_NOT_FOUND" | "GUEST_FUSION_EXPIRED" | "GUEST_FUSION_REVOKED" | "GUEST_FUSION_ALREADY_COMPLETED" | "GUEST_FUSION_TARGET_CONFLICT" | "GUEST_FUSION_TARGET_INVALID" | "GUEST_FUSION_TOKEN_MALFORMED" | "GUEST_FUSION_LEGACY_UNSUPPORTED" | "GUEST_FUSION_SOURCE_ANOMALY" | "GUEST_FUSION_PROJECTION_CONFLICT" | "GUEST_FUSION_TRANSFER_CONFLICT" | "GUEST_SESSION_FORBIDDEN" | "EMAIL_ALREADY_EXISTS" | "GUEST_MANAGER_INVALID" | "GUEST_UPDATE_CONFLICT";
                                    message: string;
                                };
                                409: {
                                    mergedIntoUserId?: string | null | undefined;
                                    code: "GUEST_NOT_FOUND" | "GUEST_NOT_MANAGED" | "USER_MERGED" | "GUEST_NAME_REQUIRED" | "GUEST_NAME_TOO_LONG" | "GUEST_EMAIL_INVALID" | "GUEST_EMAIL_TOO_LONG" | "GUEST_CURRENCY_INVALID" | "GUEST_UPDATE_EMPTY" | "GUEST_FUSION_NOT_FOUND" | "GUEST_FUSION_EXPIRED" | "GUEST_FUSION_REVOKED" | "GUEST_FUSION_ALREADY_COMPLETED" | "GUEST_FUSION_TARGET_CONFLICT" | "GUEST_FUSION_TARGET_INVALID" | "GUEST_FUSION_TOKEN_MALFORMED" | "GUEST_FUSION_LEGACY_UNSUPPORTED" | "GUEST_FUSION_SOURCE_ANOMALY" | "GUEST_FUSION_PROJECTION_CONFLICT" | "GUEST_FUSION_TRANSFER_CONFLICT" | "GUEST_SESSION_FORBIDDEN" | "EMAIL_ALREADY_EXISTS" | "GUEST_MANAGER_INVALID" | "GUEST_UPDATE_CONFLICT";
                                    message: string;
                                };
                                422: {
                                    mergedIntoUserId?: string | null | undefined;
                                    code: "GUEST_NOT_FOUND" | "GUEST_NOT_MANAGED" | "USER_MERGED" | "GUEST_NAME_REQUIRED" | "GUEST_NAME_TOO_LONG" | "GUEST_EMAIL_INVALID" | "GUEST_EMAIL_TOO_LONG" | "GUEST_CURRENCY_INVALID" | "GUEST_UPDATE_EMPTY" | "GUEST_FUSION_NOT_FOUND" | "GUEST_FUSION_EXPIRED" | "GUEST_FUSION_REVOKED" | "GUEST_FUSION_ALREADY_COMPLETED" | "GUEST_FUSION_TARGET_CONFLICT" | "GUEST_FUSION_TARGET_INVALID" | "GUEST_FUSION_TOKEN_MALFORMED" | "GUEST_FUSION_LEGACY_UNSUPPORTED" | "GUEST_FUSION_SOURCE_ANOMALY" | "GUEST_FUSION_PROJECTION_CONFLICT" | "GUEST_FUSION_TRANSFER_CONFLICT" | "GUEST_SESSION_FORBIDDEN" | "EMAIL_ALREADY_EXISTS" | "GUEST_MANAGER_INVALID" | "GUEST_UPDATE_CONFLICT";
                                    message: string;
                                };
                            };
                        };
                    };
                };
            };
        };
    } & {
        guests: {
            merge: {
                preview: {
                    post: {
                        body: {
                            token: string;
                        };
                        params: {};
                        query: {};
                        headers: {};
                        response: {
                            410: {
                                mergedIntoUserId?: string | null | undefined;
                                code: "GUEST_NOT_FOUND" | "GUEST_NOT_MANAGED" | "USER_MERGED" | "GUEST_NAME_REQUIRED" | "GUEST_NAME_TOO_LONG" | "GUEST_EMAIL_INVALID" | "GUEST_EMAIL_TOO_LONG" | "GUEST_CURRENCY_INVALID" | "GUEST_UPDATE_EMPTY" | "GUEST_FUSION_NOT_FOUND" | "GUEST_FUSION_EXPIRED" | "GUEST_FUSION_REVOKED" | "GUEST_FUSION_ALREADY_COMPLETED" | "GUEST_FUSION_TARGET_CONFLICT" | "GUEST_FUSION_TARGET_INVALID" | "GUEST_FUSION_TOKEN_MALFORMED" | "GUEST_FUSION_LEGACY_UNSUPPORTED" | "GUEST_FUSION_SOURCE_ANOMALY" | "GUEST_FUSION_PROJECTION_CONFLICT" | "GUEST_FUSION_TRANSFER_CONFLICT" | "GUEST_SESSION_FORBIDDEN" | "EMAIL_ALREADY_EXISTS" | "GUEST_MANAGER_INVALID" | "GUEST_UPDATE_CONFLICT";
                                message: string;
                            };
                            401: "Unauthorized";
                            200: {
                                expiresAt: Date;
                                status: "pending";
                                summary: {
                                    groups: {
                                        id: string;
                                        name: string;
                                        currency: {
                                            symbol: string | null;
                                            code: string;
                                            decimals: number;
                                        };
                                        balance: number;
                                        activities: ({
                                            id?: string | undefined;
                                            image?: string | null | undefined;
                                            createdAt?: Date | undefined;
                                            updatedAt?: Date | undefined;
                                            exchangeRateToBase?: string | undefined;
                                            deletedAt?: Date | null | undefined;
                                            description?: string | null | undefined;
                                            groupId?: string | null | undefined;
                                            timezone?: string | undefined;
                                            latitude?: number | null | undefined;
                                            longitude?: number | null | undefined;
                                            exchangeRateSnapshotId?: string | null | undefined;
                                            friendshipId?: string | null | undefined;
                                            splitType?: "custom" | "equal" | "percentage" | "shares" | undefined;
                                            locationId?: string | null | undefined;
                                            categoryId?: string | null | undefined;
                                            recurringExpenseRuleId?: string | null | undefined;
                                            importId?: string | null | undefined;
                                            importSourceRow?: number | null | undefined;
                                            location?: {
                                                id: string;
                                                label: string;
                                                latitude: number;
                                                longitude: number;
                                            } | null | undefined;
                                            date: Date;
                                            amount: string;
                                            entity: "expense";
                                            currencyId: string;
                                            createdById: string;
                                            title: string;
                                            paidById: string;
                                            group: {
                                                id: string;
                                                name: string;
                                                image: string | null;
                                                emoji: string | null;
                                                color: string | null;
                                            } | null;
                                            currency: {
                                                symbol: string | null;
                                                id: string;
                                                code: string;
                                                decimals: number;
                                            };
                                            share: {
                                                id?: string | undefined;
                                                createdAt?: Date | undefined;
                                                updatedAt?: Date | undefined;
                                                deletedAt?: Date | null | undefined;
                                                amount: string;
                                                userId: string;
                                                expenseId: string;
                                            } | null;
                                            paidByUser: {
                                                id: string;
                                                name: string;
                                                image: string | null;
                                                username: string | null;
                                            };
                                            category: {
                                                id?: string | undefined;
                                                createdAt?: Date | undefined;
                                                icon?: string | null | undefined;
                                                key?: string | null | undefined;
                                                order?: number | null | undefined;
                                                name: string;
                                            } | null;
                                            recurrence: {
                                                active?: boolean | undefined;
                                                id?: string | undefined;
                                                createdAt?: Date | undefined;
                                                updatedAt?: Date | undefined;
                                                deletedAt?: Date | null | undefined;
                                                description?: string | null | undefined;
                                                groupId?: string | null | undefined;
                                                timezone?: string | undefined;
                                                latitude?: number | null | undefined;
                                                longitude?: number | null | undefined;
                                                splitType?: "custom" | "equal" | "percentage" | "shares" | undefined;
                                                interval?: number | undefined;
                                                endDate?: Date | null | undefined;
                                                lastGenerated?: Date | null | undefined;
                                                locationId?: string | null | undefined;
                                                categoryId?: string | null | undefined;
                                                location?: {
                                                    id: string;
                                                    label: string;
                                                    latitude: number;
                                                    longitude: number;
                                                } | null | undefined;
                                                amount: string;
                                                currencyId: string;
                                                creatorId: string;
                                                title: string;
                                                paidById: string;
                                                frequency: "daily" | "weekly" | "monthly" | "yearly";
                                                startDate: Date;
                                            } | null;
                                        } | {
                                            date?: Date | undefined;
                                            id?: string | undefined;
                                            createdAt?: Date | undefined;
                                            updatedAt?: Date | undefined;
                                            exchangeRateToBase?: string | undefined;
                                            deletedAt?: Date | null | undefined;
                                            description?: string | null | undefined;
                                            groupId?: string | null | undefined;
                                            timezone?: string | undefined;
                                            exchangeRateSnapshotId?: string | null | undefined;
                                            importId?: string | null | undefined;
                                            importSourceRow?: number | null | undefined;
                                            isSettlement?: boolean | undefined;
                                            usedOptimalSettlement?: boolean | undefined;
                                            amount: string;
                                            entity: "payment";
                                            currencyId: string;
                                            createdById: string;
                                            fromUserId: string;
                                            toUserId: string;
                                            group: {
                                                id: string;
                                                name: string;
                                                image: string | null;
                                                emoji: string | null;
                                                color: string | null;
                                            } | null;
                                            currency: {
                                                symbol: string | null;
                                                id: string;
                                                code: string;
                                                decimals: number;
                                            };
                                            fromUser: {
                                                id: string;
                                                name: string;
                                                image: string | null;
                                                username: string | null;
                                            };
                                            toUser: {
                                                id: string;
                                                name: string;
                                                image: string | null;
                                                username: string | null;
                                            };
                                        })[];
                                        totalActivities: number;
                                    }[];
                                    friendships: {
                                        id: string;
                                        name: string;
                                        image: string | null;
                                        activities: ({
                                            id?: string | undefined;
                                            image?: string | null | undefined;
                                            createdAt?: Date | undefined;
                                            updatedAt?: Date | undefined;
                                            exchangeRateToBase?: string | undefined;
                                            deletedAt?: Date | null | undefined;
                                            description?: string | null | undefined;
                                            groupId?: string | null | undefined;
                                            timezone?: string | undefined;
                                            latitude?: number | null | undefined;
                                            longitude?: number | null | undefined;
                                            exchangeRateSnapshotId?: string | null | undefined;
                                            friendshipId?: string | null | undefined;
                                            splitType?: "custom" | "equal" | "percentage" | "shares" | undefined;
                                            locationId?: string | null | undefined;
                                            categoryId?: string | null | undefined;
                                            recurringExpenseRuleId?: string | null | undefined;
                                            importId?: string | null | undefined;
                                            importSourceRow?: number | null | undefined;
                                            location?: {
                                                id: string;
                                                label: string;
                                                latitude: number;
                                                longitude: number;
                                            } | null | undefined;
                                            date: Date;
                                            amount: string;
                                            entity: "expense";
                                            currencyId: string;
                                            createdById: string;
                                            title: string;
                                            paidById: string;
                                            group: {
                                                id: string;
                                                name: string;
                                                image: string | null;
                                                emoji: string | null;
                                                color: string | null;
                                            } | null;
                                            currency: {
                                                symbol: string | null;
                                                id: string;
                                                code: string;
                                                decimals: number;
                                            };
                                            share: {
                                                id?: string | undefined;
                                                createdAt?: Date | undefined;
                                                updatedAt?: Date | undefined;
                                                deletedAt?: Date | null | undefined;
                                                amount: string;
                                                userId: string;
                                                expenseId: string;
                                            } | null;
                                            paidByUser: {
                                                id: string;
                                                name: string;
                                                image: string | null;
                                                username: string | null;
                                            };
                                            category: {
                                                id?: string | undefined;
                                                createdAt?: Date | undefined;
                                                icon?: string | null | undefined;
                                                key?: string | null | undefined;
                                                order?: number | null | undefined;
                                                name: string;
                                            } | null;
                                            recurrence: {
                                                active?: boolean | undefined;
                                                id?: string | undefined;
                                                createdAt?: Date | undefined;
                                                updatedAt?: Date | undefined;
                                                deletedAt?: Date | null | undefined;
                                                description?: string | null | undefined;
                                                groupId?: string | null | undefined;
                                                timezone?: string | undefined;
                                                latitude?: number | null | undefined;
                                                longitude?: number | null | undefined;
                                                splitType?: "custom" | "equal" | "percentage" | "shares" | undefined;
                                                interval?: number | undefined;
                                                endDate?: Date | null | undefined;
                                                lastGenerated?: Date | null | undefined;
                                                locationId?: string | null | undefined;
                                                categoryId?: string | null | undefined;
                                                location?: {
                                                    id: string;
                                                    label: string;
                                                    latitude: number;
                                                    longitude: number;
                                                } | null | undefined;
                                                amount: string;
                                                currencyId: string;
                                                creatorId: string;
                                                title: string;
                                                paidById: string;
                                                frequency: "daily" | "weekly" | "monthly" | "yearly";
                                                startDate: Date;
                                            } | null;
                                        } | {
                                            date?: Date | undefined;
                                            id?: string | undefined;
                                            createdAt?: Date | undefined;
                                            updatedAt?: Date | undefined;
                                            exchangeRateToBase?: string | undefined;
                                            deletedAt?: Date | null | undefined;
                                            description?: string | null | undefined;
                                            groupId?: string | null | undefined;
                                            timezone?: string | undefined;
                                            exchangeRateSnapshotId?: string | null | undefined;
                                            importId?: string | null | undefined;
                                            importSourceRow?: number | null | undefined;
                                            isSettlement?: boolean | undefined;
                                            usedOptimalSettlement?: boolean | undefined;
                                            amount: string;
                                            entity: "payment";
                                            currencyId: string;
                                            createdById: string;
                                            fromUserId: string;
                                            toUserId: string;
                                            group: {
                                                id: string;
                                                name: string;
                                                image: string | null;
                                                emoji: string | null;
                                                color: string | null;
                                            } | null;
                                            currency: {
                                                symbol: string | null;
                                                id: string;
                                                code: string;
                                                decimals: number;
                                            };
                                            fromUser: {
                                                id: string;
                                                name: string;
                                                image: string | null;
                                                username: string | null;
                                            };
                                            toUser: {
                                                id: string;
                                                name: string;
                                                image: string | null;
                                                username: string | null;
                                            };
                                        })[];
                                        totalActivities: number;
                                    }[];
                                    user: {
                                        name: string;
                                        image: string | null;
                                    };
                                    currency: {
                                        symbol: string | null;
                                        id: string;
                                        code: string;
                                        decimals: number;
                                    };
                                    balance: number;
                                    totalOwed: number;
                                    totalOwing: number;
                                    acceptedFriendCount: number;
                                };
                            };
                            403: {
                                mergedIntoUserId?: string | null | undefined;
                                code: "GUEST_NOT_FOUND" | "GUEST_NOT_MANAGED" | "USER_MERGED" | "GUEST_NAME_REQUIRED" | "GUEST_NAME_TOO_LONG" | "GUEST_EMAIL_INVALID" | "GUEST_EMAIL_TOO_LONG" | "GUEST_CURRENCY_INVALID" | "GUEST_UPDATE_EMPTY" | "GUEST_FUSION_NOT_FOUND" | "GUEST_FUSION_EXPIRED" | "GUEST_FUSION_REVOKED" | "GUEST_FUSION_ALREADY_COMPLETED" | "GUEST_FUSION_TARGET_CONFLICT" | "GUEST_FUSION_TARGET_INVALID" | "GUEST_FUSION_TOKEN_MALFORMED" | "GUEST_FUSION_LEGACY_UNSUPPORTED" | "GUEST_FUSION_SOURCE_ANOMALY" | "GUEST_FUSION_PROJECTION_CONFLICT" | "GUEST_FUSION_TRANSFER_CONFLICT" | "GUEST_SESSION_FORBIDDEN" | "EMAIL_ALREADY_EXISTS" | "GUEST_MANAGER_INVALID" | "GUEST_UPDATE_CONFLICT";
                                message: string;
                            };
                            404: {
                                mergedIntoUserId?: string | null | undefined;
                                code: "GUEST_NOT_FOUND" | "GUEST_NOT_MANAGED" | "USER_MERGED" | "GUEST_NAME_REQUIRED" | "GUEST_NAME_TOO_LONG" | "GUEST_EMAIL_INVALID" | "GUEST_EMAIL_TOO_LONG" | "GUEST_CURRENCY_INVALID" | "GUEST_UPDATE_EMPTY" | "GUEST_FUSION_NOT_FOUND" | "GUEST_FUSION_EXPIRED" | "GUEST_FUSION_REVOKED" | "GUEST_FUSION_ALREADY_COMPLETED" | "GUEST_FUSION_TARGET_CONFLICT" | "GUEST_FUSION_TARGET_INVALID" | "GUEST_FUSION_TOKEN_MALFORMED" | "GUEST_FUSION_LEGACY_UNSUPPORTED" | "GUEST_FUSION_SOURCE_ANOMALY" | "GUEST_FUSION_PROJECTION_CONFLICT" | "GUEST_FUSION_TRANSFER_CONFLICT" | "GUEST_SESSION_FORBIDDEN" | "EMAIL_ALREADY_EXISTS" | "GUEST_MANAGER_INVALID" | "GUEST_UPDATE_CONFLICT";
                                message: string;
                            };
                            409: {
                                mergedIntoUserId?: string | null | undefined;
                                code: "GUEST_NOT_FOUND" | "GUEST_NOT_MANAGED" | "USER_MERGED" | "GUEST_NAME_REQUIRED" | "GUEST_NAME_TOO_LONG" | "GUEST_EMAIL_INVALID" | "GUEST_EMAIL_TOO_LONG" | "GUEST_CURRENCY_INVALID" | "GUEST_UPDATE_EMPTY" | "GUEST_FUSION_NOT_FOUND" | "GUEST_FUSION_EXPIRED" | "GUEST_FUSION_REVOKED" | "GUEST_FUSION_ALREADY_COMPLETED" | "GUEST_FUSION_TARGET_CONFLICT" | "GUEST_FUSION_TARGET_INVALID" | "GUEST_FUSION_TOKEN_MALFORMED" | "GUEST_FUSION_LEGACY_UNSUPPORTED" | "GUEST_FUSION_SOURCE_ANOMALY" | "GUEST_FUSION_PROJECTION_CONFLICT" | "GUEST_FUSION_TRANSFER_CONFLICT" | "GUEST_SESSION_FORBIDDEN" | "EMAIL_ALREADY_EXISTS" | "GUEST_MANAGER_INVALID" | "GUEST_UPDATE_CONFLICT";
                                message: string;
                            };
                            422: {
                                mergedIntoUserId?: string | null | undefined;
                                code: "GUEST_NOT_FOUND" | "GUEST_NOT_MANAGED" | "USER_MERGED" | "GUEST_NAME_REQUIRED" | "GUEST_NAME_TOO_LONG" | "GUEST_EMAIL_INVALID" | "GUEST_EMAIL_TOO_LONG" | "GUEST_CURRENCY_INVALID" | "GUEST_UPDATE_EMPTY" | "GUEST_FUSION_NOT_FOUND" | "GUEST_FUSION_EXPIRED" | "GUEST_FUSION_REVOKED" | "GUEST_FUSION_ALREADY_COMPLETED" | "GUEST_FUSION_TARGET_CONFLICT" | "GUEST_FUSION_TARGET_INVALID" | "GUEST_FUSION_TOKEN_MALFORMED" | "GUEST_FUSION_LEGACY_UNSUPPORTED" | "GUEST_FUSION_SOURCE_ANOMALY" | "GUEST_FUSION_PROJECTION_CONFLICT" | "GUEST_FUSION_TRANSFER_CONFLICT" | "GUEST_SESSION_FORBIDDEN" | "EMAIL_ALREADY_EXISTS" | "GUEST_MANAGER_INVALID" | "GUEST_UPDATE_CONFLICT";
                                message: string;
                            };
                        };
                    };
                };
            };
        };
    } & {
        guests: {
            merge: {
                confirm: {
                    post: {
                        body: {
                            token: string;
                        };
                        params: {};
                        query: {};
                        headers: {};
                        response: {
                            410: {
                                mergedIntoUserId?: string | null | undefined;
                                code: "GUEST_NOT_FOUND" | "GUEST_NOT_MANAGED" | "USER_MERGED" | "GUEST_NAME_REQUIRED" | "GUEST_NAME_TOO_LONG" | "GUEST_EMAIL_INVALID" | "GUEST_EMAIL_TOO_LONG" | "GUEST_CURRENCY_INVALID" | "GUEST_UPDATE_EMPTY" | "GUEST_FUSION_NOT_FOUND" | "GUEST_FUSION_EXPIRED" | "GUEST_FUSION_REVOKED" | "GUEST_FUSION_ALREADY_COMPLETED" | "GUEST_FUSION_TARGET_CONFLICT" | "GUEST_FUSION_TARGET_INVALID" | "GUEST_FUSION_TOKEN_MALFORMED" | "GUEST_FUSION_LEGACY_UNSUPPORTED" | "GUEST_FUSION_SOURCE_ANOMALY" | "GUEST_FUSION_PROJECTION_CONFLICT" | "GUEST_FUSION_TRANSFER_CONFLICT" | "GUEST_SESSION_FORBIDDEN" | "EMAIL_ALREADY_EXISTS" | "GUEST_MANAGER_INVALID" | "GUEST_UPDATE_CONFLICT";
                                message: string;
                            };
                            401: "Unauthorized";
                            200: {
                                status: "completed";
                                completedAt: Date;
                                requestId: string;
                                idempotent: boolean;
                            };
                            403: {
                                mergedIntoUserId?: string | null | undefined;
                                code: "GUEST_NOT_FOUND" | "GUEST_NOT_MANAGED" | "USER_MERGED" | "GUEST_NAME_REQUIRED" | "GUEST_NAME_TOO_LONG" | "GUEST_EMAIL_INVALID" | "GUEST_EMAIL_TOO_LONG" | "GUEST_CURRENCY_INVALID" | "GUEST_UPDATE_EMPTY" | "GUEST_FUSION_NOT_FOUND" | "GUEST_FUSION_EXPIRED" | "GUEST_FUSION_REVOKED" | "GUEST_FUSION_ALREADY_COMPLETED" | "GUEST_FUSION_TARGET_CONFLICT" | "GUEST_FUSION_TARGET_INVALID" | "GUEST_FUSION_TOKEN_MALFORMED" | "GUEST_FUSION_LEGACY_UNSUPPORTED" | "GUEST_FUSION_SOURCE_ANOMALY" | "GUEST_FUSION_PROJECTION_CONFLICT" | "GUEST_FUSION_TRANSFER_CONFLICT" | "GUEST_SESSION_FORBIDDEN" | "EMAIL_ALREADY_EXISTS" | "GUEST_MANAGER_INVALID" | "GUEST_UPDATE_CONFLICT";
                                message: string;
                            };
                            404: {
                                mergedIntoUserId?: string | null | undefined;
                                code: "GUEST_NOT_FOUND" | "GUEST_NOT_MANAGED" | "USER_MERGED" | "GUEST_NAME_REQUIRED" | "GUEST_NAME_TOO_LONG" | "GUEST_EMAIL_INVALID" | "GUEST_EMAIL_TOO_LONG" | "GUEST_CURRENCY_INVALID" | "GUEST_UPDATE_EMPTY" | "GUEST_FUSION_NOT_FOUND" | "GUEST_FUSION_EXPIRED" | "GUEST_FUSION_REVOKED" | "GUEST_FUSION_ALREADY_COMPLETED" | "GUEST_FUSION_TARGET_CONFLICT" | "GUEST_FUSION_TARGET_INVALID" | "GUEST_FUSION_TOKEN_MALFORMED" | "GUEST_FUSION_LEGACY_UNSUPPORTED" | "GUEST_FUSION_SOURCE_ANOMALY" | "GUEST_FUSION_PROJECTION_CONFLICT" | "GUEST_FUSION_TRANSFER_CONFLICT" | "GUEST_SESSION_FORBIDDEN" | "EMAIL_ALREADY_EXISTS" | "GUEST_MANAGER_INVALID" | "GUEST_UPDATE_CONFLICT";
                                message: string;
                            };
                            409: {
                                mergedIntoUserId?: string | null | undefined;
                                code: "GUEST_NOT_FOUND" | "GUEST_NOT_MANAGED" | "USER_MERGED" | "GUEST_NAME_REQUIRED" | "GUEST_NAME_TOO_LONG" | "GUEST_EMAIL_INVALID" | "GUEST_EMAIL_TOO_LONG" | "GUEST_CURRENCY_INVALID" | "GUEST_UPDATE_EMPTY" | "GUEST_FUSION_NOT_FOUND" | "GUEST_FUSION_EXPIRED" | "GUEST_FUSION_REVOKED" | "GUEST_FUSION_ALREADY_COMPLETED" | "GUEST_FUSION_TARGET_CONFLICT" | "GUEST_FUSION_TARGET_INVALID" | "GUEST_FUSION_TOKEN_MALFORMED" | "GUEST_FUSION_LEGACY_UNSUPPORTED" | "GUEST_FUSION_SOURCE_ANOMALY" | "GUEST_FUSION_PROJECTION_CONFLICT" | "GUEST_FUSION_TRANSFER_CONFLICT" | "GUEST_SESSION_FORBIDDEN" | "EMAIL_ALREADY_EXISTS" | "GUEST_MANAGER_INVALID" | "GUEST_UPDATE_CONFLICT";
                                message: string;
                            };
                            422: {
                                mergedIntoUserId?: string | null | undefined;
                                code: "GUEST_NOT_FOUND" | "GUEST_NOT_MANAGED" | "USER_MERGED" | "GUEST_NAME_REQUIRED" | "GUEST_NAME_TOO_LONG" | "GUEST_EMAIL_INVALID" | "GUEST_EMAIL_TOO_LONG" | "GUEST_CURRENCY_INVALID" | "GUEST_UPDATE_EMPTY" | "GUEST_FUSION_NOT_FOUND" | "GUEST_FUSION_EXPIRED" | "GUEST_FUSION_REVOKED" | "GUEST_FUSION_ALREADY_COMPLETED" | "GUEST_FUSION_TARGET_CONFLICT" | "GUEST_FUSION_TARGET_INVALID" | "GUEST_FUSION_TOKEN_MALFORMED" | "GUEST_FUSION_LEGACY_UNSUPPORTED" | "GUEST_FUSION_SOURCE_ANOMALY" | "GUEST_FUSION_PROJECTION_CONFLICT" | "GUEST_FUSION_TRANSFER_CONFLICT" | "GUEST_SESSION_FORBIDDEN" | "EMAIL_ALREADY_EXISTS" | "GUEST_MANAGER_INVALID" | "GUEST_UPDATE_CONFLICT";
                                message: string;
                            };
                        };
                    };
                };
            };
        };
    } & {
        guests: {
            ":id": {
                put: {
                    body: {
                        name?: string | undefined;
                        image?: string | null | undefined;
                        currencyId?: string | undefined;
                    };
                    params: {
                        id: string;
                    };
                    query: {};
                    headers: {};
                    response: {
                        410: {
                            mergedIntoUserId?: string | null | undefined;
                            code: "GUEST_NOT_FOUND" | "GUEST_NOT_MANAGED" | "USER_MERGED" | "GUEST_NAME_REQUIRED" | "GUEST_NAME_TOO_LONG" | "GUEST_EMAIL_INVALID" | "GUEST_EMAIL_TOO_LONG" | "GUEST_CURRENCY_INVALID" | "GUEST_UPDATE_EMPTY" | "GUEST_FUSION_NOT_FOUND" | "GUEST_FUSION_EXPIRED" | "GUEST_FUSION_REVOKED" | "GUEST_FUSION_ALREADY_COMPLETED" | "GUEST_FUSION_TARGET_CONFLICT" | "GUEST_FUSION_TARGET_INVALID" | "GUEST_FUSION_TOKEN_MALFORMED" | "GUEST_FUSION_LEGACY_UNSUPPORTED" | "GUEST_FUSION_SOURCE_ANOMALY" | "GUEST_FUSION_PROJECTION_CONFLICT" | "GUEST_FUSION_TRANSFER_CONFLICT" | "GUEST_SESSION_FORBIDDEN" | "EMAIL_ALREADY_EXISTS" | "GUEST_MANAGER_INVALID" | "GUEST_UPDATE_CONFLICT";
                            message: string;
                        };
                        401: "Unauthorized";
                        200: {
                            currency?: {
                                symbol: string | null;
                                id: string;
                                name: string;
                                updatedAt: Date;
                                code: string;
                                exchangeRateToBase: string;
                                decimals: number;
                                type: "fiat" | "crypto";
                            } | null | undefined;
                            id: string;
                            name: string;
                            email: string | null;
                            emailVerified: boolean;
                            image: string | null;
                            createdAt: Date;
                            updatedAt: Date;
                            username: string | null;
                            displayUsername: string | null;
                            bio: string | null;
                            isGuest: boolean;
                            managedBy: string | null;
                            currencyId: string | null;
                            inviteToken: string | null;
                            role: string | null;
                            banned: boolean | null;
                            banReason: string | null;
                            banExpires: Date | null;
                            lastLoginMethod: string | null;
                            profileCompletedAt: Date | null;
                            deletedAt: Date | null;
                            guestState: "managed" | "archived" | "merged" | null;
                            guestClaimedAt: Date | null;
                            guestArchivedAt: Date | null;
                            guestMergedAt: Date | null;
                            mergedIntoUserId: string | null;
                        };
                        403: {
                            mergedIntoUserId?: string | null | undefined;
                            code: "GUEST_NOT_FOUND" | "GUEST_NOT_MANAGED" | "USER_MERGED" | "GUEST_NAME_REQUIRED" | "GUEST_NAME_TOO_LONG" | "GUEST_EMAIL_INVALID" | "GUEST_EMAIL_TOO_LONG" | "GUEST_CURRENCY_INVALID" | "GUEST_UPDATE_EMPTY" | "GUEST_FUSION_NOT_FOUND" | "GUEST_FUSION_EXPIRED" | "GUEST_FUSION_REVOKED" | "GUEST_FUSION_ALREADY_COMPLETED" | "GUEST_FUSION_TARGET_CONFLICT" | "GUEST_FUSION_TARGET_INVALID" | "GUEST_FUSION_TOKEN_MALFORMED" | "GUEST_FUSION_LEGACY_UNSUPPORTED" | "GUEST_FUSION_SOURCE_ANOMALY" | "GUEST_FUSION_PROJECTION_CONFLICT" | "GUEST_FUSION_TRANSFER_CONFLICT" | "GUEST_SESSION_FORBIDDEN" | "EMAIL_ALREADY_EXISTS" | "GUEST_MANAGER_INVALID" | "GUEST_UPDATE_CONFLICT";
                            message: string;
                        };
                        404: {
                            mergedIntoUserId?: string | null | undefined;
                            code: "GUEST_NOT_FOUND" | "GUEST_NOT_MANAGED" | "USER_MERGED" | "GUEST_NAME_REQUIRED" | "GUEST_NAME_TOO_LONG" | "GUEST_EMAIL_INVALID" | "GUEST_EMAIL_TOO_LONG" | "GUEST_CURRENCY_INVALID" | "GUEST_UPDATE_EMPTY" | "GUEST_FUSION_NOT_FOUND" | "GUEST_FUSION_EXPIRED" | "GUEST_FUSION_REVOKED" | "GUEST_FUSION_ALREADY_COMPLETED" | "GUEST_FUSION_TARGET_CONFLICT" | "GUEST_FUSION_TARGET_INVALID" | "GUEST_FUSION_TOKEN_MALFORMED" | "GUEST_FUSION_LEGACY_UNSUPPORTED" | "GUEST_FUSION_SOURCE_ANOMALY" | "GUEST_FUSION_PROJECTION_CONFLICT" | "GUEST_FUSION_TRANSFER_CONFLICT" | "GUEST_SESSION_FORBIDDEN" | "EMAIL_ALREADY_EXISTS" | "GUEST_MANAGER_INVALID" | "GUEST_UPDATE_CONFLICT";
                            message: string;
                        };
                        409: {
                            mergedIntoUserId?: string | null | undefined;
                            code: "GUEST_NOT_FOUND" | "GUEST_NOT_MANAGED" | "USER_MERGED" | "GUEST_NAME_REQUIRED" | "GUEST_NAME_TOO_LONG" | "GUEST_EMAIL_INVALID" | "GUEST_EMAIL_TOO_LONG" | "GUEST_CURRENCY_INVALID" | "GUEST_UPDATE_EMPTY" | "GUEST_FUSION_NOT_FOUND" | "GUEST_FUSION_EXPIRED" | "GUEST_FUSION_REVOKED" | "GUEST_FUSION_ALREADY_COMPLETED" | "GUEST_FUSION_TARGET_CONFLICT" | "GUEST_FUSION_TARGET_INVALID" | "GUEST_FUSION_TOKEN_MALFORMED" | "GUEST_FUSION_LEGACY_UNSUPPORTED" | "GUEST_FUSION_SOURCE_ANOMALY" | "GUEST_FUSION_PROJECTION_CONFLICT" | "GUEST_FUSION_TRANSFER_CONFLICT" | "GUEST_SESSION_FORBIDDEN" | "EMAIL_ALREADY_EXISTS" | "GUEST_MANAGER_INVALID" | "GUEST_UPDATE_CONFLICT";
                            message: string;
                        };
                        422: {
                            mergedIntoUserId?: string | null | undefined;
                            code: "GUEST_NOT_FOUND" | "GUEST_NOT_MANAGED" | "USER_MERGED" | "GUEST_NAME_REQUIRED" | "GUEST_NAME_TOO_LONG" | "GUEST_EMAIL_INVALID" | "GUEST_EMAIL_TOO_LONG" | "GUEST_CURRENCY_INVALID" | "GUEST_UPDATE_EMPTY" | "GUEST_FUSION_NOT_FOUND" | "GUEST_FUSION_EXPIRED" | "GUEST_FUSION_REVOKED" | "GUEST_FUSION_ALREADY_COMPLETED" | "GUEST_FUSION_TARGET_CONFLICT" | "GUEST_FUSION_TARGET_INVALID" | "GUEST_FUSION_TOKEN_MALFORMED" | "GUEST_FUSION_LEGACY_UNSUPPORTED" | "GUEST_FUSION_SOURCE_ANOMALY" | "GUEST_FUSION_PROJECTION_CONFLICT" | "GUEST_FUSION_TRANSFER_CONFLICT" | "GUEST_SESSION_FORBIDDEN" | "EMAIL_ALREADY_EXISTS" | "GUEST_MANAGER_INVALID" | "GUEST_UPDATE_CONFLICT";
                            message: string;
                        };
                    };
                };
            };
        };
    } & {
        guests: {
            ":id": {
                delete: {
                    body: {};
                    params: {
                        id: string;
                    };
                    query: {};
                    headers: {};
                    response: {
                        410: {
                            mergedIntoUserId?: string | null | undefined;
                            code: "GUEST_NOT_FOUND" | "GUEST_NOT_MANAGED" | "USER_MERGED" | "GUEST_NAME_REQUIRED" | "GUEST_NAME_TOO_LONG" | "GUEST_EMAIL_INVALID" | "GUEST_EMAIL_TOO_LONG" | "GUEST_CURRENCY_INVALID" | "GUEST_UPDATE_EMPTY" | "GUEST_FUSION_NOT_FOUND" | "GUEST_FUSION_EXPIRED" | "GUEST_FUSION_REVOKED" | "GUEST_FUSION_ALREADY_COMPLETED" | "GUEST_FUSION_TARGET_CONFLICT" | "GUEST_FUSION_TARGET_INVALID" | "GUEST_FUSION_TOKEN_MALFORMED" | "GUEST_FUSION_LEGACY_UNSUPPORTED" | "GUEST_FUSION_SOURCE_ANOMALY" | "GUEST_FUSION_PROJECTION_CONFLICT" | "GUEST_FUSION_TRANSFER_CONFLICT" | "GUEST_SESSION_FORBIDDEN" | "EMAIL_ALREADY_EXISTS" | "GUEST_MANAGER_INVALID" | "GUEST_UPDATE_CONFLICT";
                            message: string;
                        };
                        401: "Unauthorized";
                        200: {
                            userId: string;
                            outcome: "deleted" | "archived";
                        };
                        403: {
                            mergedIntoUserId?: string | null | undefined;
                            code: "GUEST_NOT_FOUND" | "GUEST_NOT_MANAGED" | "USER_MERGED" | "GUEST_NAME_REQUIRED" | "GUEST_NAME_TOO_LONG" | "GUEST_EMAIL_INVALID" | "GUEST_EMAIL_TOO_LONG" | "GUEST_CURRENCY_INVALID" | "GUEST_UPDATE_EMPTY" | "GUEST_FUSION_NOT_FOUND" | "GUEST_FUSION_EXPIRED" | "GUEST_FUSION_REVOKED" | "GUEST_FUSION_ALREADY_COMPLETED" | "GUEST_FUSION_TARGET_CONFLICT" | "GUEST_FUSION_TARGET_INVALID" | "GUEST_FUSION_TOKEN_MALFORMED" | "GUEST_FUSION_LEGACY_UNSUPPORTED" | "GUEST_FUSION_SOURCE_ANOMALY" | "GUEST_FUSION_PROJECTION_CONFLICT" | "GUEST_FUSION_TRANSFER_CONFLICT" | "GUEST_SESSION_FORBIDDEN" | "EMAIL_ALREADY_EXISTS" | "GUEST_MANAGER_INVALID" | "GUEST_UPDATE_CONFLICT";
                            message: string;
                        };
                        404: {
                            mergedIntoUserId?: string | null | undefined;
                            code: "GUEST_NOT_FOUND" | "GUEST_NOT_MANAGED" | "USER_MERGED" | "GUEST_NAME_REQUIRED" | "GUEST_NAME_TOO_LONG" | "GUEST_EMAIL_INVALID" | "GUEST_EMAIL_TOO_LONG" | "GUEST_CURRENCY_INVALID" | "GUEST_UPDATE_EMPTY" | "GUEST_FUSION_NOT_FOUND" | "GUEST_FUSION_EXPIRED" | "GUEST_FUSION_REVOKED" | "GUEST_FUSION_ALREADY_COMPLETED" | "GUEST_FUSION_TARGET_CONFLICT" | "GUEST_FUSION_TARGET_INVALID" | "GUEST_FUSION_TOKEN_MALFORMED" | "GUEST_FUSION_LEGACY_UNSUPPORTED" | "GUEST_FUSION_SOURCE_ANOMALY" | "GUEST_FUSION_PROJECTION_CONFLICT" | "GUEST_FUSION_TRANSFER_CONFLICT" | "GUEST_SESSION_FORBIDDEN" | "EMAIL_ALREADY_EXISTS" | "GUEST_MANAGER_INVALID" | "GUEST_UPDATE_CONFLICT";
                            message: string;
                        };
                        409: {
                            mergedIntoUserId?: string | null | undefined;
                            code: "GUEST_NOT_FOUND" | "GUEST_NOT_MANAGED" | "USER_MERGED" | "GUEST_NAME_REQUIRED" | "GUEST_NAME_TOO_LONG" | "GUEST_EMAIL_INVALID" | "GUEST_EMAIL_TOO_LONG" | "GUEST_CURRENCY_INVALID" | "GUEST_UPDATE_EMPTY" | "GUEST_FUSION_NOT_FOUND" | "GUEST_FUSION_EXPIRED" | "GUEST_FUSION_REVOKED" | "GUEST_FUSION_ALREADY_COMPLETED" | "GUEST_FUSION_TARGET_CONFLICT" | "GUEST_FUSION_TARGET_INVALID" | "GUEST_FUSION_TOKEN_MALFORMED" | "GUEST_FUSION_LEGACY_UNSUPPORTED" | "GUEST_FUSION_SOURCE_ANOMALY" | "GUEST_FUSION_PROJECTION_CONFLICT" | "GUEST_FUSION_TRANSFER_CONFLICT" | "GUEST_SESSION_FORBIDDEN" | "EMAIL_ALREADY_EXISTS" | "GUEST_MANAGER_INVALID" | "GUEST_UPDATE_CONFLICT";
                            message: string;
                        };
                        422: {
                            mergedIntoUserId?: string | null | undefined;
                            code: "GUEST_NOT_FOUND" | "GUEST_NOT_MANAGED" | "USER_MERGED" | "GUEST_NAME_REQUIRED" | "GUEST_NAME_TOO_LONG" | "GUEST_EMAIL_INVALID" | "GUEST_EMAIL_TOO_LONG" | "GUEST_CURRENCY_INVALID" | "GUEST_UPDATE_EMPTY" | "GUEST_FUSION_NOT_FOUND" | "GUEST_FUSION_EXPIRED" | "GUEST_FUSION_REVOKED" | "GUEST_FUSION_ALREADY_COMPLETED" | "GUEST_FUSION_TARGET_CONFLICT" | "GUEST_FUSION_TARGET_INVALID" | "GUEST_FUSION_TOKEN_MALFORMED" | "GUEST_FUSION_LEGACY_UNSUPPORTED" | "GUEST_FUSION_SOURCE_ANOMALY" | "GUEST_FUSION_PROJECTION_CONFLICT" | "GUEST_FUSION_TRANSFER_CONFLICT" | "GUEST_SESSION_FORBIDDEN" | "EMAIL_ALREADY_EXISTS" | "GUEST_MANAGER_INVALID" | "GUEST_UPDATE_CONFLICT";
                            message: string;
                        };
                    };
                };
            };
        };
    };
} & {
    balance: {};
} & {
    balance: {
        get: {
            body: {};
            params: {};
            query: {};
            headers: {};
            response: {
                401: "Unauthorized";
                200: {
                    totalOwing: number;
                    totalOwed: number;
                    balance: number;
                };
                403: {
                    code: string;
                    message: string;
                };
            };
        };
    };
} & {
    balance: {
        users: {
            get: {
                body: {};
                params: {};
                query: {};
                headers: {};
                response: {
                    401: "Unauthorized";
                    200: {
                        user: {
                            id: string;
                            name: string;
                            image: string | null;
                        };
                        totalOwed: number;
                        totalOwing: number;
                        balance: number;
                    }[];
                    403: {
                        code: string;
                        message: string;
                    };
                };
            };
        };
    };
} & {
    quotas: {};
} & {
    quotas: {
        get: {
            body: {};
            params: {};
            query: {};
            headers: {};
            response: {
                401: "Unauthorized";
                200: {
                    "snap.scan": {
                        remaining: number | null;
                        period: "calendar_month" | "lifetime";
                        used: number;
                        limit: number | null;
                        resetsAt: any;
                    };
                    "recurring.expense": {
                        remaining: number | null;
                        period: "calendar_month" | "lifetime";
                        used: number;
                        limit: number | null;
                        resetsAt: any;
                    };
                    "payment.reminder": {
                        remaining: number | null;
                        period: "calendar_month" | "lifetime";
                        used: number;
                        limit: number | null;
                        resetsAt: any;
                    };
                };
                403: {
                    code: string;
                    message: string;
                };
                422: {
                    type: "validation";
                    on: string;
                    summary?: string;
                    message?: string;
                    found?: unknown;
                    property?: string;
                    expected?: string;
                };
            };
        };
    };
} & {
    billing: {};
} & {
    billing: {
        entitlements: {
            get: {
                body: {};
                params: {};
                query: {};
                headers: {};
                response: {
                    401: "Unauthorized";
                    200: import("./lib/billing").BillingEntitlements;
                    403: {
                        code: string;
                        message: string;
                    };
                };
            };
        };
    };
} & {
    billing: {
        "checkout-session": {
            post: {
                body: {
                    successUrl: string;
                    cancelUrl: string;
                };
                params: {};
                query: {};
                headers: {};
                response: {
                    [x: number]: string;
                };
            };
        };
    };
} & {
    billing: {
        "customer-portal": {
            post: {
                body: {
                    returnUrl: string;
                };
                params: {};
                query: {};
                headers: {};
                response: {
                    [x: number]: string;
                };
            };
        };
    };
} & {
    billing: {
        admin: {
            grants: {
                gold: {
                    post: {
                        body: {
                            expiresAt?: string | null | undefined;
                            grantId?: string | null | undefined;
                            userId: string;
                            provider: "admin" | "reward";
                        };
                        params: {};
                        query: {};
                        headers: {};
                        response: {
                            401: "Unauthorized";
                            200: import("./lib/billing").ManagedGoldGrantResult;
                            400: string;
                            403: "Forbidden" | {
                                code: string;
                                message: string;
                            };
                            404: string;
                            422: {
                                type: "validation";
                                on: string;
                                summary?: string;
                                message?: string;
                                found?: unknown;
                                property?: string;
                                expected?: string;
                            };
                        };
                    };
                };
            };
        };
    };
} & {
    billing: {
        webhooks: {
            stripe: {
                post: {
                    body: {
                        [x: string]: any;
                    };
                    params: {};
                    query: {};
                    headers: {};
                    response: {
                        [x: number]: string;
                    };
                };
            };
        };
    };
} & {
    billing: {
        webhooks: {
            revenuecat: {
                post: {
                    body: {
                        [x: string]: any;
                    };
                    params: {};
                    query: {};
                    headers: {};
                    response: {
                        [x: number]: string;
                    };
                };
            };
        };
    };
} & {
    activities: {};
} & {
    activities: {
        get: {
            body: {};
            params: {};
            query: {
                l?: number | undefined;
                cursor?: string | undefined;
                type?: ("all" | "groups" | "friends" | "payments" | "expenses" | "recurring_expenses")[] | undefined;
                action?: ("created" | "updated" | "deleted" | "restored")[] | undefined;
                entityStatus?: "deleted" | "active" | undefined;
            };
            headers: {};
            response: {
                401: "Unauthorized";
                200: {
                    items: {
                        amount?: string | null | undefined;
                        id?: string | undefined;
                        createdAt?: Date | undefined;
                        currencyId?: string | null | undefined;
                        metadata?: import("drizzle-typebox").Json | undefined;
                        groupId?: string | null | undefined;
                        member?: {
                            id: string;
                            name: string;
                            image: string | null;
                            username: string | null;
                        } | null | undefined;
                        friendshipId?: string | null | undefined;
                        group?: {
                            id?: string | undefined;
                            image?: string | null | undefined;
                            createdAt?: Date | undefined;
                            updatedAt?: Date | undefined;
                            type?: "vacation" | "roommates" | "couple" | "travel" | "party" | "other" | undefined;
                            deletedAt?: Date | null | undefined;
                            token?: string | null | undefined;
                            description?: string | null | undefined;
                            emoji?: string | null | undefined;
                            color?: string | null | undefined;
                            useOptimalSettlement?: boolean | undefined;
                            defaultSplitType?: "equal" | "percentage" | undefined;
                            memberBalanceVisibility?: "all_members" | "admins_only" | "no_one" | undefined;
                            name: string;
                            currencyId: string;
                            creatorId: string;
                        } | null | undefined;
                        expense?: {
                            id?: string | undefined;
                            image?: string | null | undefined;
                            createdAt?: Date | undefined;
                            updatedAt?: Date | undefined;
                            exchangeRateToBase?: string | undefined;
                            deletedAt?: Date | null | undefined;
                            description?: string | null | undefined;
                            groupId?: string | null | undefined;
                            timezone?: string | undefined;
                            latitude?: number | null | undefined;
                            longitude?: number | null | undefined;
                            exchangeRateSnapshotId?: string | null | undefined;
                            friendshipId?: string | null | undefined;
                            splitType?: "custom" | "equal" | "percentage" | "shares" | undefined;
                            locationId?: string | null | undefined;
                            categoryId?: string | null | undefined;
                            recurringExpenseRuleId?: string | null | undefined;
                            importId?: string | null | undefined;
                            importSourceRow?: number | null | undefined;
                            location?: {
                                id: string;
                                label: string;
                                latitude: number;
                                longitude: number;
                            } | null | undefined;
                            date: Date;
                            amount: string;
                            currencyId: string;
                            createdById: string;
                            title: string;
                            paidById: string;
                        } | null | undefined;
                        payment?: {
                            date?: Date | undefined;
                            id?: string | undefined;
                            createdAt?: Date | undefined;
                            updatedAt?: Date | undefined;
                            exchangeRateToBase?: string | undefined;
                            deletedAt?: Date | null | undefined;
                            description?: string | null | undefined;
                            groupId?: string | null | undefined;
                            timezone?: string | undefined;
                            exchangeRateSnapshotId?: string | null | undefined;
                            importId?: string | null | undefined;
                            importSourceRow?: number | null | undefined;
                            isSettlement?: boolean | undefined;
                            usedOptimalSettlement?: boolean | undefined;
                            amount: string;
                            currencyId: string;
                            createdById: string;
                            fromUserId: string;
                            toUserId: string;
                        } | null | undefined;
                        friendship?: {
                            id?: string | undefined;
                            createdAt?: Date | undefined;
                            updatedAt?: Date | undefined;
                            status?: "deleted" | "pending" | "accepted" | "rejected" | undefined;
                            acceptedAt?: Date | null | undefined;
                            userId1: string;
                            userId2: string;
                            requestedById: string;
                        } | null | undefined;
                        action?: import("./lib/activities").ACTIVITY_ACTION | undefined;
                        entityRevisionId?: string | null | undefined;
                        currency?: {
                            symbol?: string | null | undefined;
                            id?: string | undefined;
                            updatedAt?: Date | undefined;
                            decimals?: number | undefined;
                            type?: "fiat" | "crypto" | undefined;
                            name: string;
                            code: string;
                            exchangeRateToBase: string;
                        } | null | undefined;
                        category?: {
                            id?: string | undefined;
                            createdAt?: Date | undefined;
                            icon?: string | null | undefined;
                            key?: string | null | undefined;
                            order?: number | null | undefined;
                            name: string;
                        } | null | undefined;
                        creator?: {
                            id: string;
                            name: string;
                            image: string | null;
                            username: string | null;
                        } | null | undefined;
                        fromUser?: {
                            id: string;
                            name: string;
                            image: string | null;
                            username: string | null;
                        } | null | undefined;
                        toUser?: {
                            id: string;
                            name: string;
                            image: string | null;
                            username: string | null;
                        } | null | undefined;
                        expenseShare?: {
                            id?: string | undefined;
                            createdAt?: Date | undefined;
                            updatedAt?: Date | undefined;
                            deletedAt?: Date | null | undefined;
                            amount: string;
                            userId: string;
                            expenseId: string;
                        } | null | undefined;
                        recurringExpenseRule?: {
                            active?: boolean | undefined;
                            id?: string | undefined;
                            createdAt?: Date | undefined;
                            updatedAt?: Date | undefined;
                            deletedAt?: Date | null | undefined;
                            description?: string | null | undefined;
                            groupId?: string | null | undefined;
                            timezone?: string | undefined;
                            latitude?: number | null | undefined;
                            longitude?: number | null | undefined;
                            splitType?: "custom" | "equal" | "percentage" | "shares" | undefined;
                            interval?: number | undefined;
                            endDate?: Date | null | undefined;
                            lastGenerated?: Date | null | undefined;
                            locationId?: string | null | undefined;
                            categoryId?: string | null | undefined;
                            location?: {
                                id: string;
                                label: string;
                                latitude: number;
                                longitude: number;
                            } | null | undefined;
                            amount: string;
                            currencyId: string;
                            creatorId: string;
                            title: string;
                            paidById: string;
                            frequency: "daily" | "weekly" | "monthly" | "yearly";
                            startDate: Date;
                        } | null | undefined;
                        groupMember?: {
                            id?: string | undefined;
                            createdAt?: Date | undefined;
                            updatedAt?: Date | undefined;
                            role?: string | undefined;
                            deletedAt?: Date | null | undefined;
                            joinedAt?: Date | undefined;
                            defaultSplitPercentage?: string | null | undefined;
                            userId: string;
                            groupId: string;
                        } | null | undefined;
                        guestUser?: {
                            id: string;
                            name: string;
                            image: string | null;
                            username: string | null;
                        } | null | undefined;
                        friend?: {
                            id: string;
                            name: string;
                            image: string | null;
                            username: string | null;
                        } | null | undefined;
                        history?: {
                            createdAt: Date;
                            action: string;
                            schemaVersion: number;
                            diff: any;
                        } | null | undefined;
                        entity: "recurring_expense_rules" | "group" | "expense" | "expense_share" | "payment" | "group_member" | "friendship" | "user" | "recurring_expense";
                        userId: string;
                        creatorId: string;
                        entityId: string;
                        summary: string;
                    }[];
                    nextCursor: string | null;
                    hasMore: boolean;
                };
                400: string;
                403: {
                    code: string;
                    message: string;
                };
                422: {
                    type: "validation";
                    on: string;
                    summary?: string;
                    message?: string;
                    found?: unknown;
                    property?: string;
                    expected?: string;
                };
            };
        };
    };
} & {
    activities: {
        search: {
            get: {
                body: {};
                params: {};
                query: {
                    l?: number | undefined;
                    cursor?: string | undefined;
                    type?: ("all" | "groups" | "friends" | "payments" | "expenses" | "recurring_expenses")[] | undefined;
                    action?: ("created" | "updated" | "deleted" | "restored")[] | undefined;
                    entityStatus?: "deleted" | "active" | undefined;
                    q: string;
                };
                headers: {};
                response: {
                    401: "Unauthorized";
                    200: {
                        items: {
                            amount?: string | null | undefined;
                            id?: string | undefined;
                            createdAt?: Date | undefined;
                            currencyId?: string | null | undefined;
                            metadata?: import("drizzle-typebox").Json | undefined;
                            groupId?: string | null | undefined;
                            member?: {
                                id: string;
                                name: string;
                                image: string | null;
                                username: string | null;
                            } | null | undefined;
                            friendshipId?: string | null | undefined;
                            group?: {
                                id?: string | undefined;
                                image?: string | null | undefined;
                                createdAt?: Date | undefined;
                                updatedAt?: Date | undefined;
                                type?: "vacation" | "roommates" | "couple" | "travel" | "party" | "other" | undefined;
                                deletedAt?: Date | null | undefined;
                                token?: string | null | undefined;
                                description?: string | null | undefined;
                                emoji?: string | null | undefined;
                                color?: string | null | undefined;
                                useOptimalSettlement?: boolean | undefined;
                                defaultSplitType?: "equal" | "percentage" | undefined;
                                memberBalanceVisibility?: "all_members" | "admins_only" | "no_one" | undefined;
                                name: string;
                                currencyId: string;
                                creatorId: string;
                            } | null | undefined;
                            expense?: {
                                id?: string | undefined;
                                image?: string | null | undefined;
                                createdAt?: Date | undefined;
                                updatedAt?: Date | undefined;
                                exchangeRateToBase?: string | undefined;
                                deletedAt?: Date | null | undefined;
                                description?: string | null | undefined;
                                groupId?: string | null | undefined;
                                timezone?: string | undefined;
                                latitude?: number | null | undefined;
                                longitude?: number | null | undefined;
                                exchangeRateSnapshotId?: string | null | undefined;
                                friendshipId?: string | null | undefined;
                                splitType?: "custom" | "equal" | "percentage" | "shares" | undefined;
                                locationId?: string | null | undefined;
                                categoryId?: string | null | undefined;
                                recurringExpenseRuleId?: string | null | undefined;
                                importId?: string | null | undefined;
                                importSourceRow?: number | null | undefined;
                                location?: {
                                    id: string;
                                    label: string;
                                    latitude: number;
                                    longitude: number;
                                } | null | undefined;
                                date: Date;
                                amount: string;
                                currencyId: string;
                                createdById: string;
                                title: string;
                                paidById: string;
                            } | null | undefined;
                            payment?: {
                                date?: Date | undefined;
                                id?: string | undefined;
                                createdAt?: Date | undefined;
                                updatedAt?: Date | undefined;
                                exchangeRateToBase?: string | undefined;
                                deletedAt?: Date | null | undefined;
                                description?: string | null | undefined;
                                groupId?: string | null | undefined;
                                timezone?: string | undefined;
                                exchangeRateSnapshotId?: string | null | undefined;
                                importId?: string | null | undefined;
                                importSourceRow?: number | null | undefined;
                                isSettlement?: boolean | undefined;
                                usedOptimalSettlement?: boolean | undefined;
                                amount: string;
                                currencyId: string;
                                createdById: string;
                                fromUserId: string;
                                toUserId: string;
                            } | null | undefined;
                            friendship?: {
                                id?: string | undefined;
                                createdAt?: Date | undefined;
                                updatedAt?: Date | undefined;
                                status?: "deleted" | "pending" | "accepted" | "rejected" | undefined;
                                acceptedAt?: Date | null | undefined;
                                userId1: string;
                                userId2: string;
                                requestedById: string;
                            } | null | undefined;
                            action?: import("./lib/activities").ACTIVITY_ACTION | undefined;
                            entityRevisionId?: string | null | undefined;
                            currency?: {
                                symbol?: string | null | undefined;
                                id?: string | undefined;
                                updatedAt?: Date | undefined;
                                decimals?: number | undefined;
                                type?: "fiat" | "crypto" | undefined;
                                name: string;
                                code: string;
                                exchangeRateToBase: string;
                            } | null | undefined;
                            category?: {
                                id?: string | undefined;
                                createdAt?: Date | undefined;
                                icon?: string | null | undefined;
                                key?: string | null | undefined;
                                order?: number | null | undefined;
                                name: string;
                            } | null | undefined;
                            creator?: {
                                id: string;
                                name: string;
                                image: string | null;
                                username: string | null;
                            } | null | undefined;
                            fromUser?: {
                                id: string;
                                name: string;
                                image: string | null;
                                username: string | null;
                            } | null | undefined;
                            toUser?: {
                                id: string;
                                name: string;
                                image: string | null;
                                username: string | null;
                            } | null | undefined;
                            expenseShare?: {
                                id?: string | undefined;
                                createdAt?: Date | undefined;
                                updatedAt?: Date | undefined;
                                deletedAt?: Date | null | undefined;
                                amount: string;
                                userId: string;
                                expenseId: string;
                            } | null | undefined;
                            recurringExpenseRule?: {
                                active?: boolean | undefined;
                                id?: string | undefined;
                                createdAt?: Date | undefined;
                                updatedAt?: Date | undefined;
                                deletedAt?: Date | null | undefined;
                                description?: string | null | undefined;
                                groupId?: string | null | undefined;
                                timezone?: string | undefined;
                                latitude?: number | null | undefined;
                                longitude?: number | null | undefined;
                                splitType?: "custom" | "equal" | "percentage" | "shares" | undefined;
                                interval?: number | undefined;
                                endDate?: Date | null | undefined;
                                lastGenerated?: Date | null | undefined;
                                locationId?: string | null | undefined;
                                categoryId?: string | null | undefined;
                                location?: {
                                    id: string;
                                    label: string;
                                    latitude: number;
                                    longitude: number;
                                } | null | undefined;
                                amount: string;
                                currencyId: string;
                                creatorId: string;
                                title: string;
                                paidById: string;
                                frequency: "daily" | "weekly" | "monthly" | "yearly";
                                startDate: Date;
                            } | null | undefined;
                            groupMember?: {
                                id?: string | undefined;
                                createdAt?: Date | undefined;
                                updatedAt?: Date | undefined;
                                role?: string | undefined;
                                deletedAt?: Date | null | undefined;
                                joinedAt?: Date | undefined;
                                defaultSplitPercentage?: string | null | undefined;
                                userId: string;
                                groupId: string;
                            } | null | undefined;
                            guestUser?: {
                                id: string;
                                name: string;
                                image: string | null;
                                username: string | null;
                            } | null | undefined;
                            friend?: {
                                id: string;
                                name: string;
                                image: string | null;
                                username: string | null;
                            } | null | undefined;
                            history?: {
                                createdAt: Date;
                                action: string;
                                schemaVersion: number;
                                diff: any;
                            } | null | undefined;
                            entity: "recurring_expense_rules" | "group" | "expense" | "expense_share" | "payment" | "group_member" | "friendship" | "user" | "recurring_expense";
                            userId: string;
                            creatorId: string;
                            entityId: string;
                            summary: string;
                        }[];
                        nextCursor: string | null;
                        hasMore: boolean;
                    };
                    400: string;
                    403: {
                        code: string;
                        message: string;
                    };
                    422: {
                        type: "validation";
                        on: string;
                        summary?: string;
                        message?: string;
                        found?: unknown;
                        property?: string;
                        expected?: string;
                    };
                };
            };
        };
    };
} & {
    "payment-reminders": {};
} & {
    "payment-reminders": {
        post: {
            body: {
                groupId?: string | undefined;
                debtorUserId: string;
            };
            params: {};
            query: {};
            headers: {};
            response: {
                401: "Unauthorized";
                202: {
                    deliveryChannel: "email" | "push";
                    sentAt: Date;
                    nextAllowedAt: Date;
                };
                400: {
                    code: "SELF_REMINDER" | "GROUP_MEMBERSHIP_REQUIRED" | "USER_NOT_FOUND" | "GROUP_NOT_FOUND" | "NO_OUTSTANDING_BALANCE" | "NO_DELIVERY_CHANNEL" | "REMINDER_COOLDOWN" | "REMINDER_DELIVERY_FAILED";
                    message: string;
                };
                403: {
                    code: string;
                    message: string;
                } | {
                    code: "SELF_REMINDER" | "GROUP_MEMBERSHIP_REQUIRED" | "USER_NOT_FOUND" | "GROUP_NOT_FOUND" | "NO_OUTSTANDING_BALANCE" | "NO_DELIVERY_CHANNEL" | "REMINDER_COOLDOWN" | "REMINDER_DELIVERY_FAILED";
                    message: string;
                };
                404: {
                    code: "SELF_REMINDER" | "GROUP_MEMBERSHIP_REQUIRED" | "USER_NOT_FOUND" | "GROUP_NOT_FOUND" | "NO_OUTSTANDING_BALANCE" | "NO_DELIVERY_CHANNEL" | "REMINDER_COOLDOWN" | "REMINDER_DELIVERY_FAILED";
                    message: string;
                };
                409: {
                    code: "SELF_REMINDER" | "GROUP_MEMBERSHIP_REQUIRED" | "USER_NOT_FOUND" | "GROUP_NOT_FOUND" | "NO_OUTSTANDING_BALANCE" | "NO_DELIVERY_CHANNEL" | "REMINDER_COOLDOWN" | "REMINDER_DELIVERY_FAILED";
                    message: string;
                };
                422: {
                    code: "SELF_REMINDER" | "GROUP_MEMBERSHIP_REQUIRED" | "USER_NOT_FOUND" | "GROUP_NOT_FOUND" | "NO_OUTSTANDING_BALANCE" | "NO_DELIVERY_CHANNEL" | "REMINDER_COOLDOWN" | "REMINDER_DELIVERY_FAILED";
                    message: string;
                } | {
                    type: "validation";
                    on: string;
                    summary?: string;
                    message?: string;
                    found?: unknown;
                    property?: string;
                    expected?: string;
                };
                429: {
                    code: typeof import("./lib/billing").FEATURE_QUOTA_EXCEEDED;
                    featureKey: string;
                    plan: "free" | "gold";
                    used: number;
                    limit: number;
                    remaining: number;
                    resetsAt: Date | null;
                    upgradeRequired?: true | undefined;
                } | {
                    code: "SELF_REMINDER" | "GROUP_MEMBERSHIP_REQUIRED" | "USER_NOT_FOUND" | "GROUP_NOT_FOUND" | "NO_OUTSTANDING_BALANCE" | "NO_DELIVERY_CHANNEL" | "REMINDER_COOLDOWN" | "REMINDER_DELIVERY_FAILED";
                    message: string;
                };
                502: {
                    code: "SELF_REMINDER" | "GROUP_MEMBERSHIP_REQUIRED" | "USER_NOT_FOUND" | "GROUP_NOT_FOUND" | "NO_OUTSTANDING_BALANCE" | "NO_DELIVERY_CHANNEL" | "REMINDER_COOLDOWN" | "REMINDER_DELIVERY_FAILED";
                    message: string;
                };
            };
        };
    };
} & {
    payments: {};
} & {
    payments: {
        ":id": {
            history: {
                get: {
                    body: {};
                    params: {
                        id: string;
                    };
                    query: {
                        l?: number | undefined;
                        cursor?: string | undefined;
                    };
                    headers: {};
                    response: {
                        401: "Unauthorized";
                        200: {
                            items: {
                                id?: string | undefined;
                                createdAt?: Date | undefined;
                                schemaVersion?: number | undefined;
                                diff?: import("drizzle-typebox").Json | undefined;
                                entity: "recurring_expense_rules" | "group" | "expense" | "expense_share" | "payment" | "group_member" | "friendship" | "user";
                                entityId: string;
                                action: import("./lib/activities").ACTIVITY_ACTION;
                                actorId: string;
                            }[];
                            nextCursor: string | null;
                            hasMore: boolean;
                        };
                        400: string;
                        403: string;
                        404: string;
                        422: {
                            type: "validation";
                            on: string;
                            summary?: string;
                            message?: string;
                            found?: unknown;
                            property?: string;
                            expected?: string;
                        };
                    };
                };
            };
        };
    };
} & {
    payments: {
        ":id": {
            get: {
                body: {};
                params: {
                    id: string;
                };
                query: {};
                headers: {};
                response: {
                    401: "Unauthorized";
                    200: {
                        fromUser: {
                            id: string;
                            name: string;
                            image: string | null;
                            username: string | null;
                        };
                        toUser: {
                            id: string;
                            name: string;
                            image: string | null;
                            username: string | null;
                        };
                        currency: {
                            id: string;
                            name: string;
                            code: string;
                            symbol: string | null;
                            exchangeRateToBase: string;
                            updatedAt: Date;
                            decimals: number;
                            type: "fiat" | "crypto";
                        };
                        creator: {
                            id: string;
                            name: string;
                            image: string | null;
                            username: string | null;
                        };
                        group: {
                            id: string;
                            name: string;
                            description: string | null;
                            image: string | null;
                            creatorId: string;
                            currencyId: string;
                            emoji: string | null;
                            color: string | null;
                            createdAt: Date;
                            updatedAt: Date;
                            deletedAt: Date | null;
                            token: string | null;
                            useOptimalSettlement: boolean;
                            defaultSplitType: "equal" | "percentage";
                            type: "vacation" | "roommates" | "couple" | "travel" | "party" | "other";
                            memberBalanceVisibility: "all_members" | "admins_only" | "no_one";
                        } | null;
                        id: string;
                        fromUserId: string;
                        toUserId: string;
                        amount: string;
                        currencyId: string;
                        exchangeRateToBase: string;
                        exchangeRateSnapshotId: string | null;
                        date: Date;
                        timezone: string;
                        description: string | null;
                        createdAt: Date;
                        updatedAt: Date;
                        groupId: string | null;
                        createdById: string;
                        deletedAt: Date | null;
                        isSettlement: boolean;
                        usedOptimalSettlement: boolean;
                        importId: string | null;
                        importSourceRow: number | null;
                    };
                    403: "Forbidden" | {
                        code: string;
                        message: string;
                    };
                    404: "Payment not found";
                    422: {
                        type: "validation";
                        on: string;
                        summary?: string;
                        message?: string;
                        found?: unknown;
                        property?: string;
                        expected?: string;
                    };
                };
            };
        };
    };
} & {
    payments: {
        ":id": {
            put: {
                body: {
                    date?: string | undefined;
                    amount?: string | undefined;
                    currencyId?: string | undefined;
                    description?: string | null | undefined;
                    groupId?: string | null | undefined;
                    timezone?: string | undefined;
                    importId?: string | null | undefined;
                    importSourceRow?: number | null | undefined;
                    fromUserId?: string | undefined;
                    toUserId?: string | undefined;
                };
                params: {
                    id: string;
                };
                query: {};
                headers: {};
                response: {
                    [x: number]: string;
                };
            };
        };
    };
} & {
    payments: {
        ":id": {
            delete: {
                body: {};
                params: {
                    id: string;
                };
                query: {};
                headers: {};
                response: {
                    401: "Unauthorized";
                    200: {
                        date: Date;
                        amount: string;
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        exchangeRateToBase: string;
                        currencyId: string;
                        deletedAt: Date | null;
                        description: string | null;
                        groupId: string | null;
                        createdById: string;
                        timezone: string;
                        exchangeRateSnapshotId: string | null;
                        importId: string | null;
                        importSourceRow: number | null;
                        fromUserId: string;
                        toUserId: string;
                        isSettlement: boolean;
                        usedOptimalSettlement: boolean;
                    };
                    403: "Forbidden" | {
                        code: string;
                        message: string;
                    };
                    404: "Not Found";
                    422: {
                        type: "validation";
                        on: string;
                        summary?: string;
                        message?: string;
                        found?: unknown;
                        property?: string;
                        expected?: string;
                    };
                };
            };
        };
    };
} & {
    payments: {
        post: {
            body: {
                description?: string | null | undefined;
                groupId?: string | null | undefined;
                timezone?: string | undefined;
                importId?: string | null | undefined;
                importSourceRow?: number | null | undefined;
                date: string;
                amount: string;
                currencyId: string;
                fromUserId: string;
                toUserId: string;
            };
            params: {};
            query: {};
            headers: {};
            response: {
                401: "Unauthorized";
                200: {
                    date: Date;
                    amount: string;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    exchangeRateToBase: string;
                    currencyId: string;
                    deletedAt: Date | null;
                    description: string | null;
                    groupId: string | null;
                    createdById: string;
                    timezone: string;
                    exchangeRateSnapshotId: string | null;
                    importId: string | null;
                    importSourceRow: number | null;
                    fromUserId: string;
                    toUserId: string;
                    isSettlement: boolean;
                    usedOptimalSettlement: boolean;
                } | {
                    date: Date;
                    amount: string;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    exchangeRateToBase: string;
                    currencyId: string;
                    deletedAt: Date | null;
                    description: string | null;
                    groupId: string | null;
                    createdById: string;
                    timezone: string;
                    exchangeRateSnapshotId: string | null;
                    importId: string | null;
                    importSourceRow: number | null;
                    fromUserId: string;
                    toUserId: string;
                    isSettlement: boolean;
                    usedOptimalSettlement: boolean;
                }[];
                400: string;
                403: "Currency not found" | {
                    code: string;
                    message: string;
                } | "You are not a member of this group" | "Group not found" | "From user is not a member of this group" | "To user is not a member of this group" | "Group currency not found" | "Inactive payment participants must have a group balance" | "Inactive payment cannot exceed the current group balance" | "You can only create payments involving yourself" | "You are not friends with this user";
                422: {
                    type: "validation";
                    on: string;
                    summary?: string;
                    message?: string;
                    found?: unknown;
                    property?: string;
                    expected?: string;
                };
            };
        };
    };
} & {
    payments: {
        settlement: {
            summary: {
                post: {
                    body: {
                        description?: string | null | undefined;
                        groupId?: string | null | undefined;
                        timezone?: string | undefined;
                        importId?: string | null | undefined;
                        importSourceRow?: number | null | undefined;
                        date: string;
                        amount: string;
                        currencyId: string;
                        fromUserId: string;
                        toUserId: string;
                    };
                    params: {};
                    query: {};
                    headers: {};
                    response: {
                        401: "Unauthorized";
                        200: {
                            isSettlement: boolean;
                            payments: {
                                amount: string;
                                currencyId: string;
                                groupId: string | null;
                                createdById: string;
                                fromUserId: string;
                                toUserId: string;
                                fromUser: {
                                    id: string;
                                    name: string;
                                    image: string | null;
                                    username: string | null;
                                };
                                toUser: {
                                    id: string;
                                    name: string;
                                    image: string | null;
                                    username: string | null;
                                };
                                group: {
                                    name: string;
                                    id: string;
                                    createdAt: Date;
                                    updatedAt: Date;
                                    token: string | null;
                                    description: string | null;
                                    currencyId: string;
                                    emoji: string | null;
                                    creatorId: string;
                                    color: string | null;
                                    deletedAt: Date | null;
                                    useOptimalSettlement: boolean;
                                } | null;
                            }[];
                        };
                        400: string;
                        403: "Currency not found" | {
                            code: string;
                            message: string;
                        } | "You are not a member of this group" | "Group not found" | "From user is not a member of this group" | "To user is not a member of this group" | "Group currency not found" | "Inactive payment participants must have a group balance" | "Inactive payment cannot exceed the current group balance" | "You can only create payments involving yourself" | "You are not friends with this user";
                        422: {
                            type: "validation";
                            on: string;
                            summary?: string;
                            message?: string;
                            found?: unknown;
                            property?: string;
                            expected?: string;
                        };
                    };
                };
            };
        };
    };
} & {
    places: {};
} & {
    places: {
        get: {
            body: {};
            params: {};
            query: {
                l?: number | undefined;
                q?: string | undefined;
            };
            headers: {};
            response: {
                401: "Unauthorized";
                200: {
                    id: string;
                    label: string;
                    latitude: number;
                    longitude: number;
                }[];
                400: string;
                403: {
                    code: string;
                    message: string;
                };
                404: string;
                422: {
                    type: "validation";
                    on: string;
                    summary?: string;
                    message?: string;
                    found?: unknown;
                    property?: string;
                    expected?: string;
                };
            };
        };
    };
} & {
    places: {
        nearby: {
            get: {
                body: {};
                params: {};
                query: {
                    l?: number | undefined;
                    radiusMeters?: number | undefined;
                    latitude: number;
                    longitude: number;
                };
                headers: {};
                response: {
                    401: "Unauthorized";
                    200: {
                        id: string;
                        label: string;
                        latitude: number;
                        longitude: number;
                        distanceMeters: number;
                    }[];
                    400: string;
                    403: {
                        code: string;
                        message: string;
                    };
                    404: string;
                    422: {
                        type: "validation";
                        on: string;
                        summary?: string;
                        message?: string;
                        found?: unknown;
                        property?: string;
                        expected?: string;
                    };
                };
            };
        };
    };
} & {
    expenses: {};
} & {
    expenses: {
        get: {
            body: {};
            params: {};
            query: {
                l?: number | undefined;
                cursor?: string | undefined;
                sort?: "date" | "amount" | undefined;
                direction?: "asc" | "desc" | undefined;
                recurring?: boolean | undefined;
            };
            headers: {};
            response: {
                401: "Unauthorized";
                200: {
                    items: {
                        id?: string | undefined;
                        image?: string | null | undefined;
                        createdAt?: Date | undefined;
                        updatedAt?: Date | undefined;
                        exchangeRateToBase?: string | undefined;
                        deletedAt?: Date | null | undefined;
                        description?: string | null | undefined;
                        groupId?: string | null | undefined;
                        timezone?: string | undefined;
                        latitude?: number | null | undefined;
                        longitude?: number | null | undefined;
                        exchangeRateSnapshotId?: string | null | undefined;
                        friendshipId?: string | null | undefined;
                        splitType?: "custom" | "equal" | "percentage" | "shares" | undefined;
                        locationId?: string | null | undefined;
                        categoryId?: string | null | undefined;
                        recurringExpenseRuleId?: string | null | undefined;
                        importId?: string | null | undefined;
                        importSourceRow?: number | null | undefined;
                        location?: {
                            id: string;
                            label: string;
                            latitude: number;
                            longitude: number;
                        } | null | undefined;
                        date: Date;
                        amount: string;
                        currencyId: string;
                        createdById: string;
                        title: string;
                        paidById: string;
                        group: {
                            id?: string | undefined;
                            image?: string | null | undefined;
                            createdAt?: Date | undefined;
                            updatedAt?: Date | undefined;
                            type?: "vacation" | "roommates" | "couple" | "travel" | "party" | "other" | undefined;
                            deletedAt?: Date | null | undefined;
                            token?: string | null | undefined;
                            description?: string | null | undefined;
                            emoji?: string | null | undefined;
                            color?: string | null | undefined;
                            useOptimalSettlement?: boolean | undefined;
                            defaultSplitType?: "equal" | "percentage" | undefined;
                            memberBalanceVisibility?: "all_members" | "admins_only" | "no_one" | undefined;
                            name: string;
                            currencyId: string;
                            creatorId: string;
                        } | null;
                        currency: {
                            symbol?: string | null | undefined;
                            id?: string | undefined;
                            updatedAt?: Date | undefined;
                            decimals?: number | undefined;
                            type?: "fiat" | "crypto" | undefined;
                            name: string;
                            code: string;
                            exchangeRateToBase: string;
                        };
                        share: {
                            id?: string | undefined;
                            createdAt?: Date | undefined;
                            updatedAt?: Date | undefined;
                            deletedAt?: Date | null | undefined;
                            amount: string;
                            userId: string;
                            expenseId: string;
                        } | null;
                        paidByUser: {
                            id: string;
                            name: string;
                            image: string | null;
                            username: string | null;
                        };
                        category: {
                            id?: string | undefined;
                            createdAt?: Date | undefined;
                            icon?: string | null | undefined;
                            key?: string | null | undefined;
                            order?: number | null | undefined;
                            name: string;
                        } | null;
                        recurrence: {
                            active?: boolean | undefined;
                            id?: string | undefined;
                            createdAt?: Date | undefined;
                            updatedAt?: Date | undefined;
                            deletedAt?: Date | null | undefined;
                            description?: string | null | undefined;
                            groupId?: string | null | undefined;
                            timezone?: string | undefined;
                            latitude?: number | null | undefined;
                            longitude?: number | null | undefined;
                            splitType?: "custom" | "equal" | "percentage" | "shares" | undefined;
                            interval?: number | undefined;
                            endDate?: Date | null | undefined;
                            lastGenerated?: Date | null | undefined;
                            locationId?: string | null | undefined;
                            categoryId?: string | null | undefined;
                            location?: {
                                id: string;
                                label: string;
                                latitude: number;
                                longitude: number;
                            } | null | undefined;
                            amount: string;
                            currencyId: string;
                            creatorId: string;
                            title: string;
                            paidById: string;
                            frequency: "daily" | "weekly" | "monthly" | "yearly";
                            startDate: Date;
                        } | null;
                    }[];
                    nextCursor: string | null;
                    hasMore: boolean;
                };
                400: string;
                403: string | object | {
                    code: string;
                    message: string;
                };
                404: string | object;
                409: string | object;
                422: {
                    type: "validation";
                    on: string;
                    summary?: string;
                    message?: string;
                    found?: unknown;
                    property?: string;
                    expected?: string;
                };
                429: string | object;
            };
        };
    };
} & {
    expenses: {
        post: {
            body: {
                image?: string | null | undefined;
                description?: string | null | undefined;
                groupId?: string | null | undefined;
                timezone?: string | undefined;
                latitude?: number | null | undefined;
                longitude?: number | null | undefined;
                friendshipId?: string | null | undefined;
                splitType?: "custom" | "equal" | "percentage" | "shares" | undefined;
                locationId?: string | null | undefined;
                categoryId?: string | null | undefined;
                recurringExpenseRuleId?: string | null | undefined;
                importId?: string | null | undefined;
                importSourceRow?: number | null | undefined;
                date: string;
                amount: string;
                currencyId: string;
                title: string;
                paidById: string;
                splits: {
                    amount: string;
                    userId: string;
                }[];
            };
            params: {};
            query: {};
            headers: {};
            response: {
                401: "Unauthorized";
                200: {
                    shares: {
                        amount: string;
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        deletedAt: Date | null;
                        userId: string;
                        expenseId: string;
                    }[];
                    location: {
                        id: string;
                        label: string;
                        latitude: number;
                        longitude: number;
                    } | null;
                    id: string;
                    title: string;
                    description: string | null;
                    amount: string;
                    currencyId: string;
                    exchangeRateToBase: string;
                    exchangeRateSnapshotId: string | null;
                    paidById: string;
                    groupId: string | null;
                    friendshipId: string | null;
                    date: Date;
                    timezone: string;
                    createdAt: Date;
                    updatedAt: Date;
                    createdById: string;
                    deletedAt: Date | null;
                    splitType: "custom" | "equal" | "percentage" | "shares";
                    recurringExpenseRuleId: string | null;
                    image: string | null;
                    latitude: number | null;
                    longitude: number | null;
                    locationId: string | null;
                    categoryId: string | null;
                    importId: string | null;
                    importSourceRow: number | null;
                };
                400: string | object;
                403: string | object | {
                    code: string;
                    message: string;
                };
                404: string | object;
                409: string | object;
                422: {
                    type: "validation";
                    on: string;
                    summary?: string;
                    message?: string;
                    found?: unknown;
                    property?: string;
                    expected?: string;
                };
                429: string | object;
            };
        };
    };
} & {
    expenses: {
        bulk: {
            post: {
                body: {
                    image?: string | null | undefined;
                    description?: string | null | undefined;
                    groupId?: string | null | undefined;
                    timezone?: string | undefined;
                    latitude?: number | null | undefined;
                    longitude?: number | null | undefined;
                    friendshipId?: string | null | undefined;
                    splitType?: "custom" | "equal" | "percentage" | "shares" | undefined;
                    locationId?: string | null | undefined;
                    categoryId?: string | null | undefined;
                    recurringExpenseRuleId?: string | null | undefined;
                    importId?: string | null | undefined;
                    importSourceRow?: number | null | undefined;
                    date: string;
                    amount: string;
                    currencyId: string;
                    title: string;
                    paidById: string;
                    splits: {
                        amount: string;
                        userId: string;
                    }[];
                }[];
                params: {};
                query: {};
                headers: {};
                response: {
                    401: "Unauthorized";
                    200: "OK";
                    400: string | object;
                    403: string | object | {
                        code: string;
                        message: string;
                    };
                    404: string | object;
                    409: string | object;
                    422: {
                        type: "validation";
                        on: string;
                        summary?: string;
                        message?: string;
                        found?: unknown;
                        property?: string;
                        expected?: string;
                    };
                    429: string | object;
                };
            };
        };
    };
} & {
    expenses: {
        image: {
            post: {
                body: {
                    image: File;
                };
                params: {};
                query: {};
                headers: {};
                response: {
                    401: "Unauthorized";
                    200: string;
                    400: string | object;
                    403: string | object | {
                        code: string;
                        message: string;
                    };
                    404: string | object;
                    409: string | object;
                    422: {
                        type: "validation";
                        on: string;
                        summary?: string;
                        message?: string;
                        found?: unknown;
                        property?: string;
                        expected?: string;
                    };
                    429: string | object;
                };
            };
        };
    };
} & {
    expenses: {
        ":id": {
            history: {
                get: {
                    body: {};
                    params: {
                        id: string;
                    };
                    query: {
                        l?: number | undefined;
                        cursor?: string | undefined;
                    };
                    headers: {};
                    response: {
                        401: "Unauthorized";
                        200: {
                            items: {
                                id?: string | undefined;
                                createdAt?: Date | undefined;
                                schemaVersion?: number | undefined;
                                diff?: import("drizzle-typebox").Json | undefined;
                                entity: "recurring_expense_rules" | "group" | "expense" | "expense_share" | "payment" | "group_member" | "friendship" | "user";
                                entityId: string;
                                action: import("./lib/activities").ACTIVITY_ACTION;
                                actorId: string;
                            }[];
                            nextCursor: string | null;
                            hasMore: boolean;
                        };
                        400: string;
                        403: string;
                        404: string;
                        409: string | object;
                        422: {
                            type: "validation";
                            on: string;
                            summary?: string;
                            message?: string;
                            found?: unknown;
                            property?: string;
                            expected?: string;
                        };
                        429: string | object;
                    };
                };
            };
        };
    };
} & {
    expenses: {
        ":id": {
            get: {
                body: {};
                params: {
                    id: string;
                };
                query: {};
                headers: {};
                response: {
                    401: "Unauthorized";
                    200: {
                        shares: {
                            user: {
                                id: string;
                                name: string;
                                image: string | null;
                                username: string | null;
                            } | null;
                            id: string;
                            expenseId: string;
                            userId: string;
                            amount: string;
                            createdAt: Date;
                            updatedAt: Date;
                            deletedAt: Date | null;
                        }[];
                        location: {
                            id: string;
                            label: string;
                            latitude: number;
                            longitude: number;
                        } | null;
                        paidByUser: {
                            id: string;
                            name: string;
                            image: string | null;
                            username: string | null;
                        };
                        currency: {
                            id: string;
                            name: string;
                            code: string;
                            symbol: string | null;
                            exchangeRateToBase: string;
                            updatedAt: Date;
                            decimals: number;
                            type: "fiat" | "crypto";
                        };
                        creator: {
                            id: string;
                            name: string;
                            image: string | null;
                            username: string | null;
                        };
                        group: {
                            id: string;
                            name: string;
                            description: string | null;
                            image: string | null;
                            creatorId: string;
                            currencyId: string;
                            emoji: string | null;
                            color: string | null;
                            createdAt: Date;
                            updatedAt: Date;
                            deletedAt: Date | null;
                            token: string | null;
                            useOptimalSettlement: boolean;
                            defaultSplitType: "equal" | "percentage";
                            type: "vacation" | "roommates" | "couple" | "travel" | "party" | "other";
                            memberBalanceVisibility: "all_members" | "admins_only" | "no_one";
                        } | null;
                        category: {
                            id: string;
                            key: string | null;
                            name: string;
                            icon: string | null;
                            order: number | null;
                            createdAt: Date;
                        } | null;
                        recurrence: {
                            location: {
                                id: string;
                                label: string;
                                latitude: number;
                                longitude: number;
                            } | null;
                            id: string;
                            paidById: string;
                            creatorId: string;
                            groupId: string | null;
                            title: string;
                            description: string | null;
                            amount: string;
                            currencyId: string;
                            frequency: "daily" | "weekly" | "monthly" | "yearly";
                            interval: number;
                            startDate: Date;
                            endDate: Date | null;
                            timezone: string;
                            lastGenerated: Date | null;
                            active: boolean;
                            splitType: "custom" | "equal" | "percentage" | "shares";
                            createdAt: Date;
                            updatedAt: Date;
                            deletedAt: Date | null;
                            latitude: number | null;
                            longitude: number | null;
                            locationId: string | null;
                            categoryId: string | null;
                        } | null;
                        id: string;
                        title: string;
                        description: string | null;
                        amount: string;
                        currencyId: string;
                        exchangeRateToBase: string;
                        exchangeRateSnapshotId: string | null;
                        paidById: string;
                        groupId: string | null;
                        friendshipId: string | null;
                        date: Date;
                        timezone: string;
                        createdAt: Date;
                        updatedAt: Date;
                        createdById: string;
                        deletedAt: Date | null;
                        splitType: "custom" | "equal" | "percentage" | "shares";
                        recurringExpenseRuleId: string | null;
                        image: string | null;
                        latitude: number | null;
                        longitude: number | null;
                        locationId: string | null;
                        categoryId: string | null;
                        importId: string | null;
                        importSourceRow: number | null;
                    };
                    400: string | object;
                    403: string | object | {
                        code: string;
                        message: string;
                    };
                    404: string | object;
                    409: string | object;
                    422: {
                        type: "validation";
                        on: string;
                        summary?: string;
                        message?: string;
                        found?: unknown;
                        property?: string;
                        expected?: string;
                    };
                    429: string | object;
                };
            };
        };
    };
} & {
    expenses: {
        ":id": {
            put: {
                body: {
                    date?: string | undefined;
                    amount?: string | undefined;
                    image?: string | null | undefined;
                    currencyId?: string | undefined;
                    description?: string | null | undefined;
                    groupId?: string | null | undefined;
                    timezone?: string | undefined;
                    latitude?: number | null | undefined;
                    longitude?: number | null | undefined;
                    title?: string | undefined;
                    paidById?: string | undefined;
                    friendshipId?: string | null | undefined;
                    splitType?: "custom" | "equal" | "percentage" | "shares" | undefined;
                    locationId?: string | null | undefined;
                    categoryId?: string | null | undefined;
                    recurringExpenseRuleId?: string | null | undefined;
                    importId?: string | null | undefined;
                    importSourceRow?: number | null | undefined;
                    recurrence?: {
                        endDate?: string | undefined;
                        frequency: "daily" | "weekly" | "monthly" | "yearly";
                        interval: number;
                    } | undefined;
                    splits?: {
                        amount: string;
                        userId: string;
                    }[] | undefined;
                };
                params: {
                    id: string;
                };
                query: {};
                headers: {};
                response: {
                    401: "Unauthorized";
                    200: {
                        location: {
                            id: string;
                            label: string;
                            latitude: number;
                            longitude: number;
                        } | null;
                        id: string;
                        title: string;
                        description: string | null;
                        amount: string;
                        currencyId: string;
                        exchangeRateToBase: string;
                        exchangeRateSnapshotId: string | null;
                        paidById: string;
                        groupId: string | null;
                        friendshipId: string | null;
                        date: Date;
                        timezone: string;
                        createdAt: Date;
                        updatedAt: Date;
                        createdById: string;
                        deletedAt: Date | null;
                        splitType: "custom" | "equal" | "percentage" | "shares";
                        recurringExpenseRuleId: string | null;
                        image: string | null;
                        latitude: number | null;
                        longitude: number | null;
                        locationId: string | null;
                        categoryId: string | null;
                        importId: string | null;
                        importSourceRow: number | null;
                    } & {
                        location: {
                            id: string;
                            label: string;
                            latitude: number;
                            longitude: number;
                        } | null;
                        id: string;
                        title: string;
                        description: string | null;
                        amount: string;
                        currencyId: string;
                        exchangeRateToBase: string;
                        exchangeRateSnapshotId: string | null;
                        paidById: string;
                        groupId: string | null;
                        friendshipId: string | null;
                        date: Date;
                        timezone: string;
                        createdAt: Date;
                        updatedAt: Date;
                        createdById: string;
                        deletedAt: Date | null;
                        splitType: "custom" | "equal" | "percentage" | "shares";
                        recurringExpenseRuleId: string | null;
                        image: string | null;
                        latitude: number | null;
                        longitude: number | null;
                        locationId: string | null;
                        categoryId: string | null;
                        importId: string | null;
                        importSourceRow: number | null;
                    };
                    400: string | object;
                    403: string | object | {
                        code: string;
                        message: string;
                    };
                    404: string | object;
                    409: string | object;
                    422: {
                        type: "validation";
                        on: string;
                        summary?: string;
                        message?: string;
                        found?: unknown;
                        property?: string;
                        expected?: string;
                    };
                    429: string | object;
                };
            };
        };
    };
} & {
    expenses: {
        ":id": {
            delete: {
                body: {};
                params: {
                    id: string;
                };
                query: {};
                headers: {};
                response: {
                    401: "Unauthorized";
                    200: {
                        location: {
                            id: string;
                            label: string;
                            latitude: number;
                            longitude: number;
                        } | null;
                        id: string;
                        title: string;
                        description: string | null;
                        amount: string;
                        currencyId: string;
                        exchangeRateToBase: string;
                        exchangeRateSnapshotId: string | null;
                        paidById: string;
                        groupId: string | null;
                        friendshipId: string | null;
                        date: Date;
                        timezone: string;
                        createdAt: Date;
                        updatedAt: Date;
                        createdById: string;
                        deletedAt: Date | null;
                        splitType: "custom" | "equal" | "percentage" | "shares";
                        recurringExpenseRuleId: string | null;
                        image: string | null;
                        latitude: number | null;
                        longitude: number | null;
                        locationId: string | null;
                        categoryId: string | null;
                        importId: string | null;
                        importSourceRow: number | null;
                    };
                    400: string | object;
                    403: string | object | {
                        code: string;
                        message: string;
                    };
                    404: string | object;
                    409: string | object;
                    422: {
                        type: "validation";
                        on: string;
                        summary?: string;
                        message?: string;
                        found?: unknown;
                        property?: string;
                        expected?: string;
                    };
                    429: string | object;
                };
            };
        };
    };
} & {
    expenses: {
        recurring: {};
    };
} & {
    expenses: {
        recurring: {
            get: {
                body: {};
                params: {};
                query: {
                    status?: "all" | "active" | "inactive" | undefined;
                };
                headers: {};
                response: {
                    401: "Unauthorized";
                    200: {
                        nextOccurrence: Date | null;
                        location: {
                            id: string;
                            label: string;
                            latitude: number;
                            longitude: number;
                        } | null;
                        totalOccurrences: number;
                        id: string;
                        paidById: string;
                        creatorId: string;
                        groupId: string | null;
                        title: string;
                        description: string | null;
                        amount: string;
                        currencyId: string;
                        frequency: "daily" | "weekly" | "monthly" | "yearly";
                        interval: number;
                        startDate: Date | (Date & string);
                        endDate: Date | (Date & string) | null;
                        timezone: string;
                        lastGenerated: Date | (Date & string) | null;
                        active: boolean;
                        splitType: "custom" | "equal" | "percentage" | "shares";
                        createdAt: Date;
                        updatedAt: Date;
                        deletedAt: Date | null;
                        latitude: number | null;
                        longitude: number | null;
                        locationId: string | null;
                        categoryId: string | null;
                    }[];
                    400: string | object;
                    403: string | object | {
                        code: string;
                        message: string;
                    };
                    404: string | object;
                    409: string | object;
                    422: {
                        type: "validation";
                        on: string;
                        summary?: string;
                        message?: string;
                        found?: unknown;
                        property?: string;
                        expected?: string;
                    };
                    429: string | object;
                };
            };
        };
    };
} & {
    expenses: {
        recurring: {
            post: {
                body: {
                    active?: boolean | undefined;
                    createdAt?: Date | undefined;
                    updatedAt?: Date | undefined;
                    deletedAt?: Date | null | undefined;
                    description?: string | null | undefined;
                    groupId?: string | null | undefined;
                    timezone?: string | undefined;
                    latitude?: number | null | undefined;
                    longitude?: number | null | undefined;
                    splitType?: "custom" | "equal" | "percentage" | "shares" | undefined;
                    endDate?: string | undefined;
                    lastGenerated?: Date | null | undefined;
                    locationId?: string | null | undefined;
                    categoryId?: string | null | undefined;
                    amount: string;
                    currencyId: string;
                    title: string;
                    paidById: string;
                    frequency: "daily" | "weekly" | "monthly" | "yearly";
                    interval: number;
                    startDate: string;
                    splits: {
                        amount: string;
                        userId: string;
                    }[];
                };
                params: {};
                query: {};
                headers: {};
                response: {
                    401: "Unauthorized";
                    201: "Created";
                    400: string | object;
                    403: string | object | {
                        code: string;
                        message: string;
                    };
                    404: string | object;
                    409: string | object;
                    422: {
                        type: "validation";
                        on: string;
                        summary?: string;
                        message?: string;
                        found?: unknown;
                        property?: string;
                        expected?: string;
                    };
                    429: string | object;
                };
            };
        };
    };
} & {
    expenses: {
        recurring: {
            update: {
                post: {
                    body: {};
                    params: {};
                    query: {};
                    headers: {};
                    response: {
                        400: string | object;
                        403: string | object;
                        404: string | object;
                        409: string | object;
                        429: string | object;
                    };
                };
            };
        };
    };
} & {
    expenses: {
        recurring: {
            ":id": {
                history: {
                    get: {
                        body: {};
                        params: {
                            id: string;
                        };
                        query: {};
                        headers: {};
                        response: {
                            401: "Unauthorized";
                            200: {
                                id: string;
                                entity: "recurring_expense_rules" | "group" | "expense" | "expense_share" | "payment" | "group_member" | "friendship" | "user";
                                entityId: string;
                                action: import("./lib/activities").ACTIVITY_ACTION;
                                actorId: string;
                                schemaVersion: number;
                                diff: {
                                    [x: string]: unknown;
                                } | null;
                                createdAt: Date;
                            }[];
                            400: string | object;
                            403: string | object | {
                                code: string;
                                message: string;
                            };
                            404: string | object;
                            409: string | object;
                            422: {
                                type: "validation";
                                on: string;
                                summary?: string;
                                message?: string;
                                found?: unknown;
                                property?: string;
                                expected?: string;
                            };
                            429: string | object;
                        };
                    };
                };
            };
        };
    };
} & {
    expenses: {
        recurring: {
            ":id": {
                get: {
                    body: {};
                    params: {
                        id: string;
                    };
                    query: {};
                    headers: {};
                    response: {
                        401: "Unauthorized";
                        200: {
                            shares: {
                                id: string;
                                recurringExpenseRuleId: string;
                                userId: string;
                                amount: string;
                                createdAt: Date;
                                updatedAt: Date;
                                deletedAt: Date | null;
                            }[];
                            related: {
                                shares: {
                                    user: {
                                        id: string;
                                        name: string;
                                        image: string | null;
                                        username: string | null;
                                    } | null;
                                    id: string;
                                    expenseId: string;
                                    userId: string;
                                    amount: string;
                                    createdAt: Date;
                                    updatedAt: Date;
                                    deletedAt: Date | null;
                                }[];
                                location: {
                                    id: string;
                                    label: string;
                                    latitude: number;
                                    longitude: number;
                                } | null;
                                paidByUser: {
                                    id: string;
                                    name: string;
                                    email: string | null;
                                    emailVerified: boolean;
                                    image: string | null;
                                    createdAt: Date;
                                    updatedAt: Date;
                                    username: string | null;
                                    displayUsername: string | null;
                                    bio: string | null;
                                    isGuest: boolean;
                                    managedBy: string | null;
                                    currencyId: string | null;
                                    inviteToken: string | null;
                                    role: string | null;
                                    banned: boolean | null;
                                    banReason: string | null;
                                    banExpires: Date | null;
                                    lastLoginMethod: string | null;
                                    profileCompletedAt: Date | null;
                                    deletedAt: Date | null;
                                    guestState: "managed" | "archived" | "merged" | null;
                                    guestClaimedAt: Date | null;
                                    guestArchivedAt: Date | null;
                                    guestMergedAt: Date | null;
                                    mergedIntoUserId: string | null;
                                };
                                currency: {
                                    id: string;
                                    name: string;
                                    code: string;
                                    symbol: string | null;
                                    exchangeRateToBase: string;
                                    updatedAt: Date;
                                    decimals: number;
                                    type: "fiat" | "crypto";
                                };
                                category: {
                                    id: string;
                                    key: string | null;
                                    name: string;
                                    icon: string | null;
                                    order: number | null;
                                    createdAt: Date;
                                } | null;
                                recurrence: {
                                    location: {
                                        id: string;
                                        label: string;
                                        latitude: number;
                                        longitude: number;
                                    } | null;
                                    id: string;
                                    paidById: string;
                                    creatorId: string;
                                    groupId: string | null;
                                    title: string;
                                    description: string | null;
                                    amount: string;
                                    currencyId: string;
                                    frequency: "daily" | "weekly" | "monthly" | "yearly";
                                    interval: number;
                                    startDate: Date;
                                    endDate: Date | null;
                                    timezone: string;
                                    lastGenerated: Date | null;
                                    active: boolean;
                                    splitType: "custom" | "equal" | "percentage" | "shares";
                                    createdAt: Date;
                                    updatedAt: Date;
                                    deletedAt: Date | null;
                                    latitude: number | null;
                                    longitude: number | null;
                                    locationId: string | null;
                                    categoryId: string | null;
                                } | null;
                                id: string;
                                title: string;
                                description: string | null;
                                amount: string;
                                currencyId: string;
                                exchangeRateToBase: string;
                                exchangeRateSnapshotId: string | null;
                                paidById: string;
                                groupId: string | null;
                                friendshipId: string | null;
                                date: Date;
                                timezone: string;
                                createdAt: Date;
                                updatedAt: Date;
                                createdById: string;
                                deletedAt: Date | null;
                                splitType: "custom" | "equal" | "percentage" | "shares";
                                recurringExpenseRuleId: string | null;
                                image: string | null;
                                latitude: number | null;
                                longitude: number | null;
                                locationId: string | null;
                                categoryId: string | null;
                                importId: string | null;
                                importSourceRow: number | null;
                            }[];
                            location: {
                                id: string;
                                label: string;
                                latitude: number;
                                longitude: number;
                            } | null;
                            id: string;
                            paidById: string;
                            creatorId: string;
                            groupId: string | null;
                            title: string;
                            description: string | null;
                            amount: string;
                            currencyId: string;
                            frequency: "daily" | "weekly" | "monthly" | "yearly";
                            interval: number;
                            startDate: Date;
                            endDate: Date | null;
                            timezone: string;
                            lastGenerated: Date | null;
                            active: boolean;
                            splitType: "custom" | "equal" | "percentage" | "shares";
                            createdAt: Date;
                            updatedAt: Date;
                            deletedAt: Date | null;
                            latitude: number | null;
                            longitude: number | null;
                            locationId: string | null;
                            categoryId: string | null;
                        };
                        400: string | object;
                        403: string | object | {
                            code: string;
                            message: string;
                        };
                        404: string | object;
                        409: string | object;
                        422: {
                            type: "validation";
                            on: string;
                            summary?: string;
                            message?: string;
                            found?: unknown;
                            property?: string;
                            expected?: string;
                        };
                        429: string | object;
                    };
                };
            };
        };
    };
} & {
    expenses: {
        recurring: {
            ":id": {
                put: {
                    body: {
                        active?: boolean | undefined;
                        amount?: string | undefined;
                        createdAt?: Date | undefined;
                        updatedAt?: Date | undefined;
                        currencyId?: string | undefined;
                        deletedAt?: Date | null | undefined;
                        description?: string | null | undefined;
                        groupId?: string | null | undefined;
                        timezone?: string | undefined;
                        latitude?: number | null | undefined;
                        longitude?: number | null | undefined;
                        title?: string | undefined;
                        paidById?: string | undefined;
                        splitType?: "custom" | "equal" | "percentage" | "shares" | undefined;
                        frequency?: "daily" | "weekly" | "monthly" | "yearly" | undefined;
                        interval?: number | undefined;
                        startDate?: string | undefined;
                        endDate?: string | undefined;
                        lastGenerated?: Date | null | undefined;
                        locationId?: string | null | undefined;
                        categoryId?: string | null | undefined;
                        splits?: {
                            amount: string;
                            userId: string;
                        }[] | undefined;
                    };
                    params: {
                        id: string;
                    };
                    query: {};
                    headers: {};
                    response: {
                        401: "Unauthorized";
                        200: {
                            location: {
                                id: string;
                                label: string;
                                latitude: number;
                                longitude: number;
                            } | null;
                            id: string;
                            paidById: string;
                            creatorId: string;
                            groupId: string | null;
                            title: string;
                            description: string | null;
                            amount: string;
                            currencyId: string;
                            frequency: "daily" | "weekly" | "monthly" | "yearly";
                            interval: number;
                            startDate: Date;
                            endDate: Date | null;
                            timezone: string;
                            lastGenerated: Date | null;
                            active: boolean;
                            splitType: "custom" | "equal" | "percentage" | "shares";
                            createdAt: Date;
                            updatedAt: Date;
                            deletedAt: Date | null;
                            latitude: number | null;
                            longitude: number | null;
                            locationId: string | null;
                            categoryId: string | null;
                        } & {
                            location: {
                                id: string;
                                label: string;
                                latitude: number;
                                longitude: number;
                            } | null;
                            id: string;
                            paidById: string;
                            creatorId: string;
                            groupId: string | null;
                            title: string;
                            description: string | null;
                            amount: string;
                            currencyId: string;
                            frequency: "daily" | "weekly" | "monthly" | "yearly";
                            interval: number;
                            startDate: Date;
                            endDate: Date | null;
                            timezone: string;
                            lastGenerated: Date | null;
                            active: boolean;
                            splitType: "custom" | "equal" | "percentage" | "shares";
                            createdAt: Date;
                            updatedAt: Date;
                            deletedAt: Date | null;
                            latitude: number | null;
                            longitude: number | null;
                            locationId: string | null;
                            categoryId: string | null;
                        };
                        400: string | object;
                        403: string | object | {
                            code: string;
                            message: string;
                        };
                        404: string | object;
                        409: string | object;
                        422: {
                            type: "validation";
                            on: string;
                            summary?: string;
                            message?: string;
                            found?: unknown;
                            property?: string;
                            expected?: string;
                        };
                        429: string | object;
                    };
                };
            };
        };
    };
} & {
    expenses: {
        recurring: {
            ":id": {
                delete: {
                    body: {};
                    params: {
                        id: string;
                    };
                    query: {};
                    headers: {};
                    response: {
                        401: "Unauthorized";
                        200: {
                            location: {
                                id: string;
                                label: string;
                                latitude: number;
                                longitude: number;
                            } | null;
                            id: string;
                            paidById: string;
                            creatorId: string;
                            groupId: string | null;
                            title: string;
                            description: string | null;
                            amount: string;
                            currencyId: string;
                            frequency: "daily" | "weekly" | "monthly" | "yearly";
                            interval: number;
                            startDate: Date;
                            endDate: Date | null;
                            timezone: string;
                            lastGenerated: Date | null;
                            active: boolean;
                            splitType: "custom" | "equal" | "percentage" | "shares";
                            createdAt: Date;
                            updatedAt: Date;
                            deletedAt: Date | null;
                            latitude: number | null;
                            longitude: number | null;
                            locationId: string | null;
                            categoryId: string | null;
                        };
                        400: string | object;
                        403: string | object | {
                            code: string;
                            message: string;
                        };
                        404: string | object;
                        409: string | object;
                        422: {
                            type: "validation";
                            on: string;
                            summary?: string;
                            message?: string;
                            found?: unknown;
                            property?: string;
                            expected?: string;
                        };
                        429: string | object;
                    };
                };
            };
        };
    };
} & {
    groups: {};
} & {
    groups: {
        get: {
            body: {};
            params: {};
            query: {
                l?: number | undefined;
                cursor?: string | undefined;
                sort?: import("./lib/groups").GROUP_SORT | undefined;
                archived?: boolean | undefined;
                q?: string | undefined;
            };
            headers: {};
            response: {
                401: "Unauthorized";
                200: {
                    items: {
                        groupMembers: {
                            id: string;
                            name: string;
                            image: string | null;
                        }[];
                        balance: number;
                        hasActivity: boolean;
                        absBalance: number;
                        mostRecentActivity: Date | null;
                        id: string;
                        name: string;
                        image: string | null;
                        createdAt: Date;
                        updatedAt: Date;
                        type: "vacation" | "roommates" | "couple" | "travel" | "party" | "other";
                        currencyId: string;
                        deletedAt: Date | null;
                        token: string | null;
                        description: string | null;
                        creatorId: string;
                        emoji: string | null;
                        color: string | null;
                        useOptimalSettlement: boolean;
                        defaultSplitType: "equal" | "percentage";
                        memberBalanceVisibility: "all_members" | "admins_only" | "no_one";
                        currency: import("./lib/db/schema").Currency;
                        archivedAt: import("./lib/db/schema").GroupMember["archivedAt"];
                        pinnedAt: import("./lib/db/schema").GroupMember["pinnedAt"];
                    }[];
                    nextCursor: string | null;
                    hasMore: boolean;
                };
                400: string;
                403: {
                    code: string;
                    message: string;
                };
                422: {
                    type: "validation";
                    on: string;
                    summary?: string;
                    message?: string;
                    found?: unknown;
                    property?: string;
                    expected?: string;
                };
            };
        };
    };
} & {
    groups: {
        hot: {
            get: {
                body: {};
                params: {};
                query: {
                    l?: number | undefined;
                    sort?: import("./lib/groups").GROUP_SORT | undefined;
                    archived?: boolean | undefined;
                    p?: number | undefined;
                };
                headers: {};
                response: {
                    401: "Unauthorized";
                    200: {
                        groupMembers: {
                            id: string;
                            name: string;
                            image: string | null;
                        }[];
                        balance: number;
                        hasActivity: boolean;
                        absBalance: number;
                        mostRecentActivity: Date | null;
                        id: string;
                        name: string;
                        image: string | null;
                        createdAt: Date;
                        updatedAt: Date;
                        type: "vacation" | "roommates" | "couple" | "travel" | "party" | "other";
                        currencyId: string;
                        deletedAt: Date | null;
                        token: string | null;
                        description: string | null;
                        creatorId: string;
                        emoji: string | null;
                        color: string | null;
                        useOptimalSettlement: boolean;
                        defaultSplitType: "equal" | "percentage";
                        memberBalanceVisibility: "all_members" | "admins_only" | "no_one";
                        currency: import("./lib/db/schema").Currency;
                        archivedAt: import("./lib/db/schema").GroupMember["archivedAt"];
                        pinnedAt: import("./lib/db/schema").GroupMember["pinnedAt"];
                    }[];
                    403: {
                        code: string;
                        message: string;
                    };
                    422: {
                        type: "validation";
                        on: string;
                        summary?: string;
                        message?: string;
                        found?: unknown;
                        property?: string;
                        expected?: string;
                    };
                };
            };
        };
    };
} & {
    groups: {
        search: {
            get: {
                body: {};
                params: {};
                query: {
                    l?: number | undefined;
                    archived?: boolean | undefined;
                    p?: number | undefined;
                    q: string;
                };
                headers: {};
                response: {
                    401: "Unauthorized";
                    200: {
                        groupMembers: {
                            id: string;
                            name: string;
                            image: string | null;
                        }[];
                        balance: number;
                        hasActivity: boolean;
                        absBalance: number;
                        mostRecentActivity: Date | null;
                        id: string;
                        name: string;
                        image: string | null;
                        createdAt: Date;
                        updatedAt: Date;
                        type: "vacation" | "roommates" | "couple" | "travel" | "party" | "other";
                        currencyId: string;
                        deletedAt: Date | null;
                        token: string | null;
                        description: string | null;
                        creatorId: string;
                        emoji: string | null;
                        color: string | null;
                        useOptimalSettlement: boolean;
                        defaultSplitType: "equal" | "percentage";
                        memberBalanceVisibility: "all_members" | "admins_only" | "no_one";
                        currency: import("./lib/db/schema").Currency;
                        archivedAt: import("./lib/db/schema").GroupMember["archivedAt"];
                        pinnedAt: import("./lib/db/schema").GroupMember["pinnedAt"];
                    }[];
                    403: {
                        code: string;
                        message: string;
                    };
                    422: {
                        type: "validation";
                        on: string;
                        summary?: string;
                        message?: string;
                        found?: unknown;
                        property?: string;
                        expected?: string;
                    };
                };
            };
        };
    };
} & {
    groups: {
        post: {
            body: {
                image?: string | undefined;
                type?: "vacation" | "roommates" | "couple" | "travel" | "party" | "other" | undefined;
                description?: string | undefined;
                emoji?: string | undefined;
                color?: string | undefined;
                memberBalanceVisibility?: "all_members" | "admins_only" | "no_one" | undefined;
                groupMembers?: string[] | undefined;
                name: string;
                currencyId: string;
            };
            params: {};
            query: {};
            headers: {};
            response: {
                401: "Unauthorized";
                200: {
                    token: string;
                    id: string;
                    name: string;
                    image: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                    type: "vacation" | "roommates" | "couple" | "travel" | "party" | "other";
                    currencyId: string;
                    deletedAt: Date | null;
                    description: string | null;
                    creatorId: string;
                    emoji: string | null;
                    color: string | null;
                    useOptimalSettlement: boolean;
                    defaultSplitType: "equal" | "percentage";
                    memberBalanceVisibility: "all_members" | "admins_only" | "no_one";
                };
                400: "Invalid pending group image";
                403: {
                    code: string;
                    message: string;
                };
                422: {
                    type: "validation";
                    on: string;
                    summary?: string;
                    message?: string;
                    found?: unknown;
                    property?: string;
                    expected?: string;
                };
            };
        };
    };
} & {
    groups: {
        invites: {
            ":token": {
                get: {
                    body: {};
                    params: {
                        token: string;
                    };
                    query: {};
                    headers: {};
                    response: {
                        [x: number]: string;
                    };
                };
            };
        };
    };
} & {
    groups: {
        invites: {
            ":token": {
                accept: {
                    post: {
                        body: {};
                        params: {
                            token: string;
                        };
                        query: {};
                        headers: {};
                        response: {
                            [x: number]: string;
                        };
                    };
                };
            };
        };
    };
} & {
    groups: {
        image: {
            post: {
                body: {
                    image: File;
                };
                params: {};
                query: {};
                headers: {};
                response: {
                    401: "Unauthorized";
                    200: {
                        image: string;
                    };
                    400: "No image file provided";
                    403: {
                        code: string;
                        message: string;
                    };
                    422: {
                        type: "validation";
                        on: string;
                        summary?: string;
                        message?: string;
                        found?: unknown;
                        property?: string;
                        expected?: string;
                    };
                };
            };
        };
    };
} & {
    groups: {
        ":id": {
            get: {
                body: {};
                params: {
                    id: string;
                };
                query: {};
                headers: {};
                response: {
                    401: "Unauthorized";
                    200: {
                        token: string;
                        totalOwing: number;
                        totalOwed: number;
                        balance: number;
                        currency: {
                            id: string;
                            name: string;
                            code: string;
                            symbol: string | null;
                            exchangeRateToBase: string;
                            updatedAt: Date;
                            decimals: number;
                            type: "fiat" | "crypto";
                        };
                        id: string;
                        name: string;
                        description: string | null;
                        image: string | null;
                        creatorId: string;
                        currencyId: string;
                        emoji: string | null;
                        color: string | null;
                        createdAt: Date;
                        updatedAt: Date;
                        deletedAt: Date | null;
                        useOptimalSettlement: boolean;
                        defaultSplitType: "equal" | "percentage";
                        type: "vacation" | "roommates" | "couple" | "travel" | "party" | "other";
                        memberBalanceVisibility: "all_members" | "admins_only" | "no_one";
                    };
                    403: "Forbidden" | {
                        code: string;
                        message: string;
                    };
                    404: "Not Found" | "Group not found";
                    422: {
                        type: "validation";
                        on: string;
                        summary?: string;
                        message?: string;
                        found?: unknown;
                        property?: string;
                        expected?: string;
                    };
                };
            };
        };
    };
} & {
    groups: {
        ":id": {
            stats: {
                get: {
                    body: {};
                    params: {
                        id: string;
                    };
                    query: {};
                    headers: {};
                    response: {
                        401: "Unauthorized";
                        200: {
                            total: number;
                            totalExpenses: number;
                            currency: {
                                id: string;
                                name: string;
                                code: string;
                                symbol: string | null;
                                exchangeRateToBase: string;
                                updatedAt: Date;
                                decimals: number;
                                type: "fiat" | "crypto";
                            };
                            paidByUser: ({
                                id: string;
                                name: string;
                                image: string | null;
                                username: string | null;
                            } & {
                                total: number;
                                totalPaidExpenses: number;
                            })[];
                            spentByUser: ({
                                id: string;
                                name: string;
                                image: string | null;
                                username: string | null;
                            } & {
                                total: number;
                            })[];
                            spentByCategory: {
                                id: string | null;
                                key: string | null;
                                name: string;
                                icon: string | null;
                                total: number;
                                totalExpenses: number;
                                avgTotal: number;
                                highestExpense: number;
                            }[];
                        };
                        403: "Forbidden" | {
                            code: string;
                            message: string;
                        };
                        404: "Not Found" | "Group not found";
                        422: {
                            type: "validation";
                            on: string;
                            summary?: string;
                            message?: string;
                            found?: unknown;
                            property?: string;
                            expected?: string;
                        };
                    };
                };
            };
        };
    };
} & {
    groups: {
        ":id": {
            stats: {
                "spent-series": {
                    get: {
                        body: {};
                        params: {
                            id: string;
                        };
                        query: {
                            categoryIds?: string[] | undefined;
                            userIds?: string[] | undefined;
                            startDate: string;
                            endDate: string;
                            granularity: "month" | "day" | "week";
                        };
                        headers: {};
                        response: {
                            401: "Unauthorized";
                            200: {
                                granularity: "month" | "day" | "week";
                                currency: {
                                    id: string;
                                    name: string;
                                    code: string;
                                    symbol: string | null;
                                    exchangeRateToBase: string;
                                    updatedAt: Date;
                                    decimals: number;
                                    type: "fiat" | "crypto";
                                };
                                total: number;
                                buckets: {
                                    bucketStart: string;
                                    total: number;
                                }[];
                            };
                            400: "Invalid date range";
                            403: "Forbidden" | {
                                code: string;
                                message: string;
                            } | {
                                readonly code: "banana_gold_required";
                                readonly message: "Banana Gold required";
                                readonly upgradeRequired: true;
                            };
                            404: "Not Found" | "Group not found";
                            422: {
                                type: "validation";
                                on: string;
                                summary?: string;
                                message?: string;
                                found?: unknown;
                                property?: string;
                                expected?: string;
                            };
                        };
                    };
                };
            };
        };
    };
} & {
    groups: {
        ":id": {
            put: {
                body: {
                    name?: string | undefined;
                    image?: null | undefined;
                    type?: "vacation" | "roommates" | "couple" | "travel" | "party" | "other" | undefined;
                    currencyId?: string | undefined;
                    description?: string | undefined;
                    emoji?: string | undefined;
                    color?: string | undefined;
                    useOptimalSettlement?: boolean | undefined;
                    memberBalanceVisibility?: "all_members" | "admins_only" | "no_one" | undefined;
                };
                params: {
                    id: string;
                };
                query: {};
                headers: {};
                response: {
                    401: "Unauthorized";
                    200: {
                        id: string;
                        name: string;
                        description: string | null;
                        image: string | null;
                        creatorId: string;
                        currencyId: string;
                        emoji: string | null;
                        color: string | null;
                        createdAt: Date;
                        updatedAt: Date;
                        deletedAt: Date | null;
                        token: string | null;
                        useOptimalSettlement: boolean;
                        defaultSplitType: "equal" | "percentage";
                        type: "vacation" | "roommates" | "couple" | "travel" | "party" | "other";
                        memberBalanceVisibility: "all_members" | "admins_only" | "no_one";
                    };
                    403: "Forbidden" | {
                        code: string;
                        message: string;
                    };
                    404: "Not Found";
                    422: {
                        type: "validation";
                        on: string;
                        summary?: string;
                        message?: string;
                        found?: unknown;
                        property?: string;
                        expected?: string;
                    };
                };
            };
        };
    };
} & {
    groups: {
        ":id": {
            preferences: {
                put: {
                    body: {
                        archived?: boolean | undefined;
                        pinned?: boolean | undefined;
                    };
                    params: {
                        id: string;
                    };
                    query: {};
                    headers: {};
                    response: {
                        401: "Unauthorized";
                        200: {
                            id: string;
                            groupId: string;
                            userId: string;
                            role: string;
                            joinedAt: Date;
                            createdAt: Date;
                            updatedAt: Date;
                            deletedAt: Date | null;
                            pinnedAt: Date | null;
                            archivedAt: Date | null;
                            defaultSplitPercentage: string | null;
                        };
                        400: "At least one preference must be provided";
                        403: "Forbidden" | {
                            code: string;
                            message: string;
                        };
                        404: "Not Found";
                        422: {
                            type: "validation";
                            on: string;
                            summary?: string;
                            message?: string;
                            found?: unknown;
                            property?: string;
                            expected?: string;
                        };
                    };
                };
            };
        };
    };
} & {
    groups: {
        ":id": {
            image: {
                post: {
                    body: {
                        image: File;
                    };
                    params: {
                        id: string;
                    };
                    query: {};
                    headers: {};
                    response: {
                        401: "Unauthorized";
                        200: {
                            id: string;
                            name: string;
                            description: string | null;
                            image: string | null;
                            creatorId: string;
                            currencyId: string;
                            emoji: string | null;
                            color: string | null;
                            createdAt: Date;
                            updatedAt: Date;
                            deletedAt: Date | null;
                            token: string | null;
                            useOptimalSettlement: boolean;
                            defaultSplitType: "equal" | "percentage";
                            type: "vacation" | "roommates" | "couple" | "travel" | "party" | "other";
                            memberBalanceVisibility: "all_members" | "admins_only" | "no_one";
                        };
                        400: "No image file provided";
                        403: "Forbidden" | {
                            code: string;
                            message: string;
                        };
                        404: "Not Found" | "Group not found";
                        422: {
                            type: "validation";
                            on: string;
                            summary?: string;
                            message?: string;
                            found?: unknown;
                            property?: string;
                            expected?: string;
                        };
                    };
                };
            };
        };
    };
} & {
    groups: {
        ":id": {
            delete: {
                body: {};
                params: {
                    id: string;
                };
                query: {};
                headers: {};
                response: {
                    401: "Unauthorized";
                    200: {
                        id: string;
                        name: string;
                        description: string | null;
                        image: string | null;
                        creatorId: string;
                        currencyId: string;
                        emoji: string | null;
                        color: string | null;
                        createdAt: Date;
                        updatedAt: Date;
                        deletedAt: Date | null;
                        token: string | null;
                        useOptimalSettlement: boolean;
                        defaultSplitType: "equal" | "percentage";
                        type: "vacation" | "roommates" | "couple" | "travel" | "party" | "other";
                        memberBalanceVisibility: "all_members" | "admins_only" | "no_one";
                    };
                    403: "Forbidden" | {
                        code: string;
                        message: string;
                    };
                    404: "Not Found" | "Group not found";
                    422: {
                        type: "validation";
                        on: string;
                        summary?: string;
                        message?: string;
                        found?: unknown;
                        property?: string;
                        expected?: string;
                    };
                };
            };
        };
    };
} & {
    groups: {
        ":id": {
            activities: {
                get: {
                    body: {};
                    params: {
                        id: string;
                    };
                    query: {
                        l?: number | undefined;
                        cursor?: string | undefined;
                        sort?: "date" | "amount" | undefined;
                        direction?: "asc" | "desc" | undefined;
                        type?: "all" | "payments" | "expenses" | "recurring_expenses" | undefined;
                        categoryIds?: string[] | undefined;
                        paidByIds?: string[] | undefined;
                        participantIds?: string[] | undefined;
                        creatorIds?: string[] | undefined;
                    };
                    headers: {};
                    response: {
                        401: "Unauthorized";
                        200: {
                            items: (({
                                location: {
                                    id: string;
                                    label: string;
                                    latitude: number;
                                    longitude: number;
                                } | null;
                                paidByUser: {
                                    id: string;
                                    name: string;
                                    email: string | null;
                                    emailVerified: boolean;
                                    image: string | null;
                                    createdAt: Date;
                                    updatedAt: Date;
                                    username: string | null;
                                    displayUsername: string | null;
                                    bio: string | null;
                                    isGuest: boolean;
                                    managedBy: string | null;
                                    currencyId: string | null;
                                    inviteToken: string | null;
                                    role: string | null;
                                    banned: boolean | null;
                                    banReason: string | null;
                                    banExpires: Date | null;
                                    lastLoginMethod: string | null;
                                    profileCompletedAt: Date | null;
                                    deletedAt: Date | null;
                                    guestState: "managed" | "archived" | "merged" | null;
                                    guestClaimedAt: Date | null;
                                    guestArchivedAt: Date | null;
                                    guestMergedAt: Date | null;
                                    mergedIntoUserId: string | null;
                                };
                                currency: {
                                    id: string;
                                    name: string;
                                    code: string;
                                    symbol: string | null;
                                    exchangeRateToBase: string;
                                    updatedAt: Date;
                                    decimals: number;
                                    type: "fiat" | "crypto";
                                };
                                share: {
                                    id: string;
                                    expenseId: string;
                                    userId: string;
                                    amount: string;
                                    createdAt: Date;
                                    updatedAt: Date;
                                    deletedAt: Date | null;
                                } | null;
                                category: {
                                    id: string;
                                    key: string | null;
                                    name: string;
                                    icon: string | null;
                                    order: number | null;
                                    createdAt: Date;
                                } | null;
                                recurrence: {
                                    location: {
                                        id: string;
                                        label: string;
                                        latitude: number;
                                        longitude: number;
                                    } | null;
                                    id: string;
                                    paidById: string;
                                    creatorId: string;
                                    groupId: string | null;
                                    title: string;
                                    description: string | null;
                                    amount: string;
                                    currencyId: string;
                                    frequency: "daily" | "weekly" | "monthly" | "yearly";
                                    interval: number;
                                    startDate: Date;
                                    endDate: Date | null;
                                    timezone: string;
                                    lastGenerated: Date | null;
                                    active: boolean;
                                    splitType: "custom" | "equal" | "percentage" | "shares";
                                    createdAt: Date;
                                    updatedAt: Date;
                                    deletedAt: Date | null;
                                    latitude: number | null;
                                    longitude: number | null;
                                    locationId: string | null;
                                    categoryId: string | null;
                                } | null;
                                group: {
                                    id: string;
                                    name: string;
                                    description: string | null;
                                    image: string | null;
                                    creatorId: string;
                                    currencyId: string;
                                    emoji: string | null;
                                    color: string | null;
                                    createdAt: Date;
                                    updatedAt: Date;
                                    deletedAt: Date | null;
                                    token: string | null;
                                    useOptimalSettlement: boolean;
                                    defaultSplitType: "equal" | "percentage";
                                    type: "vacation" | "roommates" | "couple" | "travel" | "party" | "other";
                                    memberBalanceVisibility: "all_members" | "admins_only" | "no_one";
                                };
                                id: string;
                                title: string;
                                description: string | null;
                                amount: string;
                                currencyId: string;
                                exchangeRateToBase: string;
                                exchangeRateSnapshotId: string | null;
                                paidById: string;
                                groupId: string | null;
                                friendshipId: string | null;
                                date: Date;
                                timezone: string;
                                createdAt: Date;
                                updatedAt: Date;
                                createdById: string;
                                deletedAt: Date | null;
                                splitType: "custom" | "equal" | "percentage" | "shares";
                                recurringExpenseRuleId: string | null;
                                image: string | null;
                                latitude: number | null;
                                longitude: number | null;
                                locationId: string | null;
                                categoryId: string | null;
                                importId: string | null;
                                importSourceRow: number | null;
                            } & {
                                entity: import("./lib/activities").ACTIVITY_ENTITY.expense;
                                date: Date;
                            }) | ({
                                fromUser: {
                                    id: string;
                                    name: string;
                                    image: string | null;
                                    username: string | null;
                                };
                                toUser: {
                                    id: string;
                                    name: string;
                                    image: string | null;
                                    username: string | null;
                                };
                                currency: {
                                    id: string;
                                    name: string;
                                    code: string;
                                    symbol: string | null;
                                    exchangeRateToBase: string;
                                    updatedAt: Date;
                                    decimals: number;
                                    type: "fiat" | "crypto";
                                };
                                group: {
                                    id: string;
                                    name: string;
                                    description: string | null;
                                    image: string | null;
                                    creatorId: string;
                                    currencyId: string;
                                    emoji: string | null;
                                    color: string | null;
                                    createdAt: Date;
                                    updatedAt: Date;
                                    deletedAt: Date | null;
                                    token: string | null;
                                    useOptimalSettlement: boolean;
                                    defaultSplitType: "equal" | "percentage";
                                    type: "vacation" | "roommates" | "couple" | "travel" | "party" | "other";
                                    memberBalanceVisibility: "all_members" | "admins_only" | "no_one";
                                };
                                id: string;
                                fromUserId: string;
                                toUserId: string;
                                amount: string;
                                currencyId: string;
                                exchangeRateToBase: string;
                                exchangeRateSnapshotId: string | null;
                                date: Date;
                                timezone: string;
                                description: string | null;
                                createdAt: Date;
                                updatedAt: Date;
                                groupId: string | null;
                                createdById: string;
                                deletedAt: Date | null;
                                isSettlement: boolean;
                                usedOptimalSettlement: boolean;
                                importId: string | null;
                                importSourceRow: number | null;
                            } & {
                                entity: import("./lib/activities").ACTIVITY_ENTITY.payment;
                                date: Date;
                            }))[];
                            nextCursor: string | null;
                            hasMore: boolean;
                        };
                        400: string;
                        403: "Forbidden" | {
                            code: string;
                            message: string;
                        };
                        404: "Not Found";
                        422: {
                            type: "validation";
                            on: string;
                            summary?: string;
                            message?: string;
                            found?: unknown;
                            property?: string;
                            expected?: string;
                        };
                    };
                };
            };
        };
    };
} & {
    groups: {
        ":id": {
            activities: {
                search: {
                    get: {
                        body: {};
                        params: {
                            id: string;
                        };
                        query: {
                            l?: number | undefined;
                            cursor?: string | undefined;
                            sort?: "date" | "amount" | undefined;
                            direction?: "asc" | "desc" | undefined;
                            type?: "all" | "payments" | "expenses" | "recurring_expenses" | undefined;
                            categoryIds?: string[] | undefined;
                            paidByIds?: string[] | undefined;
                            participantIds?: string[] | undefined;
                            creatorIds?: string[] | undefined;
                            q: string;
                        };
                        headers: {};
                        response: {
                            401: "Unauthorized";
                            200: {
                                items: (({
                                    location: {
                                        id: string;
                                        label: string;
                                        latitude: number;
                                        longitude: number;
                                    } | null;
                                    paidByUser: {
                                        id: string;
                                        name: string;
                                        email: string | null;
                                        emailVerified: boolean;
                                        image: string | null;
                                        createdAt: Date;
                                        updatedAt: Date;
                                        username: string | null;
                                        displayUsername: string | null;
                                        bio: string | null;
                                        isGuest: boolean;
                                        managedBy: string | null;
                                        currencyId: string | null;
                                        inviteToken: string | null;
                                        role: string | null;
                                        banned: boolean | null;
                                        banReason: string | null;
                                        banExpires: Date | null;
                                        lastLoginMethod: string | null;
                                        profileCompletedAt: Date | null;
                                        deletedAt: Date | null;
                                        guestState: "managed" | "archived" | "merged" | null;
                                        guestClaimedAt: Date | null;
                                        guestArchivedAt: Date | null;
                                        guestMergedAt: Date | null;
                                        mergedIntoUserId: string | null;
                                    };
                                    currency: {
                                        id: string;
                                        name: string;
                                        code: string;
                                        symbol: string | null;
                                        exchangeRateToBase: string;
                                        updatedAt: Date;
                                        decimals: number;
                                        type: "fiat" | "crypto";
                                    };
                                    share: {
                                        id: string;
                                        expenseId: string;
                                        userId: string;
                                        amount: string;
                                        createdAt: Date;
                                        updatedAt: Date;
                                        deletedAt: Date | null;
                                    } | null;
                                    category: {
                                        id: string;
                                        key: string | null;
                                        name: string;
                                        icon: string | null;
                                        order: number | null;
                                        createdAt: Date;
                                    } | null;
                                    recurrence: {
                                        location: {
                                            id: string;
                                            label: string;
                                            latitude: number;
                                            longitude: number;
                                        } | null;
                                        id: string;
                                        paidById: string;
                                        creatorId: string;
                                        groupId: string | null;
                                        title: string;
                                        description: string | null;
                                        amount: string;
                                        currencyId: string;
                                        frequency: "daily" | "weekly" | "monthly" | "yearly";
                                        interval: number;
                                        startDate: Date;
                                        endDate: Date | null;
                                        timezone: string;
                                        lastGenerated: Date | null;
                                        active: boolean;
                                        splitType: "custom" | "equal" | "percentage" | "shares";
                                        createdAt: Date;
                                        updatedAt: Date;
                                        deletedAt: Date | null;
                                        latitude: number | null;
                                        longitude: number | null;
                                        locationId: string | null;
                                        categoryId: string | null;
                                    } | null;
                                    group: {
                                        id: string;
                                        name: string;
                                        description: string | null;
                                        image: string | null;
                                        creatorId: string;
                                        currencyId: string;
                                        emoji: string | null;
                                        color: string | null;
                                        createdAt: Date;
                                        updatedAt: Date;
                                        deletedAt: Date | null;
                                        token: string | null;
                                        useOptimalSettlement: boolean;
                                        defaultSplitType: "equal" | "percentage";
                                        type: "vacation" | "roommates" | "couple" | "travel" | "party" | "other";
                                        memberBalanceVisibility: "all_members" | "admins_only" | "no_one";
                                    };
                                    id: string;
                                    title: string;
                                    description: string | null;
                                    amount: string;
                                    currencyId: string;
                                    exchangeRateToBase: string;
                                    exchangeRateSnapshotId: string | null;
                                    paidById: string;
                                    groupId: string | null;
                                    friendshipId: string | null;
                                    date: Date;
                                    timezone: string;
                                    createdAt: Date;
                                    updatedAt: Date;
                                    createdById: string;
                                    deletedAt: Date | null;
                                    splitType: "custom" | "equal" | "percentage" | "shares";
                                    recurringExpenseRuleId: string | null;
                                    image: string | null;
                                    latitude: number | null;
                                    longitude: number | null;
                                    locationId: string | null;
                                    categoryId: string | null;
                                    importId: string | null;
                                    importSourceRow: number | null;
                                } & {
                                    entity: import("./lib/activities").ACTIVITY_ENTITY.expense;
                                    date: Date;
                                }) | ({
                                    fromUser: {
                                        id: string;
                                        name: string;
                                        image: string | null;
                                        username: string | null;
                                    };
                                    toUser: {
                                        id: string;
                                        name: string;
                                        image: string | null;
                                        username: string | null;
                                    };
                                    currency: {
                                        id: string;
                                        name: string;
                                        code: string;
                                        symbol: string | null;
                                        exchangeRateToBase: string;
                                        updatedAt: Date;
                                        decimals: number;
                                        type: "fiat" | "crypto";
                                    };
                                    group: {
                                        id: string;
                                        name: string;
                                        description: string | null;
                                        image: string | null;
                                        creatorId: string;
                                        currencyId: string;
                                        emoji: string | null;
                                        color: string | null;
                                        createdAt: Date;
                                        updatedAt: Date;
                                        deletedAt: Date | null;
                                        token: string | null;
                                        useOptimalSettlement: boolean;
                                        defaultSplitType: "equal" | "percentage";
                                        type: "vacation" | "roommates" | "couple" | "travel" | "party" | "other";
                                        memberBalanceVisibility: "all_members" | "admins_only" | "no_one";
                                    };
                                    id: string;
                                    fromUserId: string;
                                    toUserId: string;
                                    amount: string;
                                    currencyId: string;
                                    exchangeRateToBase: string;
                                    exchangeRateSnapshotId: string | null;
                                    date: Date;
                                    timezone: string;
                                    description: string | null;
                                    createdAt: Date;
                                    updatedAt: Date;
                                    groupId: string | null;
                                    createdById: string;
                                    deletedAt: Date | null;
                                    isSettlement: boolean;
                                    usedOptimalSettlement: boolean;
                                    importId: string | null;
                                    importSourceRow: number | null;
                                } & {
                                    entity: import("./lib/activities").ACTIVITY_ENTITY.payment;
                                    date: Date;
                                }))[];
                                nextCursor: string | null;
                                hasMore: boolean;
                            };
                            400: string;
                            403: "Forbidden" | {
                                code: string;
                                message: string;
                            };
                            404: "Not Found";
                            422: {
                                type: "validation";
                                on: string;
                                summary?: string;
                                message?: string;
                                found?: unknown;
                                property?: string;
                                expected?: string;
                            };
                        };
                    };
                };
            };
        };
    };
} & {
    groups: {
        ":id": {
            activities: {
                unsettled: {
                    get: {
                        body: {};
                        params: {
                            id: string;
                        };
                        query: {
                            l?: number | undefined;
                            cursor?: string | undefined;
                            sort?: "date" | "amount" | undefined;
                            direction?: "asc" | "desc" | undefined;
                            type?: "all" | "payments" | "expenses" | "recurring_expenses" | undefined;
                            categoryIds?: string[] | undefined;
                            paidByIds?: string[] | undefined;
                            participantIds?: string[] | undefined;
                            creatorIds?: string[] | undefined;
                        };
                        headers: {};
                        response: {
                            401: "Unauthorized";
                            200: {
                                items: (({
                                    location: {
                                        id: string;
                                        label: string;
                                        latitude: number;
                                        longitude: number;
                                    } | null;
                                    paidByUser: {
                                        id: string;
                                        name: string;
                                        email: string | null;
                                        emailVerified: boolean;
                                        image: string | null;
                                        createdAt: Date;
                                        updatedAt: Date;
                                        username: string | null;
                                        displayUsername: string | null;
                                        bio: string | null;
                                        isGuest: boolean;
                                        managedBy: string | null;
                                        currencyId: string | null;
                                        inviteToken: string | null;
                                        role: string | null;
                                        banned: boolean | null;
                                        banReason: string | null;
                                        banExpires: Date | null;
                                        lastLoginMethod: string | null;
                                        profileCompletedAt: Date | null;
                                        deletedAt: Date | null;
                                        guestState: "managed" | "archived" | "merged" | null;
                                        guestClaimedAt: Date | null;
                                        guestArchivedAt: Date | null;
                                        guestMergedAt: Date | null;
                                        mergedIntoUserId: string | null;
                                    };
                                    currency: {
                                        id: string;
                                        name: string;
                                        code: string;
                                        symbol: string | null;
                                        exchangeRateToBase: string;
                                        updatedAt: Date;
                                        decimals: number;
                                        type: "fiat" | "crypto";
                                    };
                                    share: {
                                        id: string;
                                        expenseId: string;
                                        userId: string;
                                        amount: string;
                                        createdAt: Date;
                                        updatedAt: Date;
                                        deletedAt: Date | null;
                                    } | null;
                                    category: {
                                        id: string;
                                        key: string | null;
                                        name: string;
                                        icon: string | null;
                                        order: number | null;
                                        createdAt: Date;
                                    } | null;
                                    recurrence: {
                                        location: {
                                            id: string;
                                            label: string;
                                            latitude: number;
                                            longitude: number;
                                        } | null;
                                        id: string;
                                        paidById: string;
                                        creatorId: string;
                                        groupId: string | null;
                                        title: string;
                                        description: string | null;
                                        amount: string;
                                        currencyId: string;
                                        frequency: "daily" | "weekly" | "monthly" | "yearly";
                                        interval: number;
                                        startDate: Date;
                                        endDate: Date | null;
                                        timezone: string;
                                        lastGenerated: Date | null;
                                        active: boolean;
                                        splitType: "custom" | "equal" | "percentage" | "shares";
                                        createdAt: Date;
                                        updatedAt: Date;
                                        deletedAt: Date | null;
                                        latitude: number | null;
                                        longitude: number | null;
                                        locationId: string | null;
                                        categoryId: string | null;
                                    } | null;
                                    group: {
                                        id: string;
                                        name: string;
                                        description: string | null;
                                        image: string | null;
                                        creatorId: string;
                                        currencyId: string;
                                        emoji: string | null;
                                        color: string | null;
                                        createdAt: Date;
                                        updatedAt: Date;
                                        deletedAt: Date | null;
                                        token: string | null;
                                        useOptimalSettlement: boolean;
                                        defaultSplitType: "equal" | "percentage";
                                        type: "vacation" | "roommates" | "couple" | "travel" | "party" | "other";
                                        memberBalanceVisibility: "all_members" | "admins_only" | "no_one";
                                    };
                                    id: string;
                                    title: string;
                                    description: string | null;
                                    amount: string;
                                    currencyId: string;
                                    exchangeRateToBase: string;
                                    exchangeRateSnapshotId: string | null;
                                    paidById: string;
                                    groupId: string | null;
                                    friendshipId: string | null;
                                    date: Date;
                                    timezone: string;
                                    createdAt: Date;
                                    updatedAt: Date;
                                    createdById: string;
                                    deletedAt: Date | null;
                                    splitType: "custom" | "equal" | "percentage" | "shares";
                                    recurringExpenseRuleId: string | null;
                                    image: string | null;
                                    latitude: number | null;
                                    longitude: number | null;
                                    locationId: string | null;
                                    categoryId: string | null;
                                    importId: string | null;
                                    importSourceRow: number | null;
                                } & {
                                    entity: import("./lib/activities").ACTIVITY_ENTITY.expense;
                                    date: Date;
                                }) | ({
                                    fromUser: {
                                        id: string;
                                        name: string;
                                        image: string | null;
                                        username: string | null;
                                    };
                                    toUser: {
                                        id: string;
                                        name: string;
                                        image: string | null;
                                        username: string | null;
                                    };
                                    currency: {
                                        id: string;
                                        name: string;
                                        code: string;
                                        symbol: string | null;
                                        exchangeRateToBase: string;
                                        updatedAt: Date;
                                        decimals: number;
                                        type: "fiat" | "crypto";
                                    };
                                    group: {
                                        id: string;
                                        name: string;
                                        description: string | null;
                                        image: string | null;
                                        creatorId: string;
                                        currencyId: string;
                                        emoji: string | null;
                                        color: string | null;
                                        createdAt: Date;
                                        updatedAt: Date;
                                        deletedAt: Date | null;
                                        token: string | null;
                                        useOptimalSettlement: boolean;
                                        defaultSplitType: "equal" | "percentage";
                                        type: "vacation" | "roommates" | "couple" | "travel" | "party" | "other";
                                        memberBalanceVisibility: "all_members" | "admins_only" | "no_one";
                                    };
                                    id: string;
                                    fromUserId: string;
                                    toUserId: string;
                                    amount: string;
                                    currencyId: string;
                                    exchangeRateToBase: string;
                                    exchangeRateSnapshotId: string | null;
                                    date: Date;
                                    timezone: string;
                                    description: string | null;
                                    createdAt: Date;
                                    updatedAt: Date;
                                    groupId: string | null;
                                    createdById: string;
                                    deletedAt: Date | null;
                                    isSettlement: boolean;
                                    usedOptimalSettlement: boolean;
                                    importId: string | null;
                                    importSourceRow: number | null;
                                } & {
                                    entity: import("./lib/activities").ACTIVITY_ENTITY.payment;
                                    date: Date;
                                }))[];
                                nextCursor: string | null;
                                hasMore: boolean;
                            };
                            400: string;
                            403: "Forbidden" | {
                                code: string;
                                message: string;
                            };
                            404: "Not Found";
                            422: {
                                type: "validation";
                                on: string;
                                summary?: string;
                                message?: string;
                                found?: unknown;
                                property?: string;
                                expected?: string;
                            };
                        };
                    };
                };
            };
        };
    };
} & {
    groups: {
        ":id": {
            activities: {
                settled: {
                    get: {
                        body: {};
                        params: {
                            id: string;
                        };
                        query: {
                            l?: number | undefined;
                            cursor?: string | undefined;
                            sort?: "date" | "amount" | undefined;
                            direction?: "asc" | "desc" | undefined;
                            type?: "all" | "payments" | "expenses" | "recurring_expenses" | undefined;
                            categoryIds?: string[] | undefined;
                            paidByIds?: string[] | undefined;
                            participantIds?: string[] | undefined;
                            creatorIds?: string[] | undefined;
                        };
                        headers: {};
                        response: {
                            401: "Unauthorized";
                            200: {
                                items: (({
                                    location: {
                                        id: string;
                                        label: string;
                                        latitude: number;
                                        longitude: number;
                                    } | null;
                                    paidByUser: {
                                        id: string;
                                        name: string;
                                        email: string | null;
                                        emailVerified: boolean;
                                        image: string | null;
                                        createdAt: Date;
                                        updatedAt: Date;
                                        username: string | null;
                                        displayUsername: string | null;
                                        bio: string | null;
                                        isGuest: boolean;
                                        managedBy: string | null;
                                        currencyId: string | null;
                                        inviteToken: string | null;
                                        role: string | null;
                                        banned: boolean | null;
                                        banReason: string | null;
                                        banExpires: Date | null;
                                        lastLoginMethod: string | null;
                                        profileCompletedAt: Date | null;
                                        deletedAt: Date | null;
                                        guestState: "managed" | "archived" | "merged" | null;
                                        guestClaimedAt: Date | null;
                                        guestArchivedAt: Date | null;
                                        guestMergedAt: Date | null;
                                        mergedIntoUserId: string | null;
                                    };
                                    currency: {
                                        id: string;
                                        name: string;
                                        code: string;
                                        symbol: string | null;
                                        exchangeRateToBase: string;
                                        updatedAt: Date;
                                        decimals: number;
                                        type: "fiat" | "crypto";
                                    };
                                    share: {
                                        id: string;
                                        expenseId: string;
                                        userId: string;
                                        amount: string;
                                        createdAt: Date;
                                        updatedAt: Date;
                                        deletedAt: Date | null;
                                    } | null;
                                    category: {
                                        id: string;
                                        key: string | null;
                                        name: string;
                                        icon: string | null;
                                        order: number | null;
                                        createdAt: Date;
                                    } | null;
                                    recurrence: {
                                        location: {
                                            id: string;
                                            label: string;
                                            latitude: number;
                                            longitude: number;
                                        } | null;
                                        id: string;
                                        paidById: string;
                                        creatorId: string;
                                        groupId: string | null;
                                        title: string;
                                        description: string | null;
                                        amount: string;
                                        currencyId: string;
                                        frequency: "daily" | "weekly" | "monthly" | "yearly";
                                        interval: number;
                                        startDate: Date;
                                        endDate: Date | null;
                                        timezone: string;
                                        lastGenerated: Date | null;
                                        active: boolean;
                                        splitType: "custom" | "equal" | "percentage" | "shares";
                                        createdAt: Date;
                                        updatedAt: Date;
                                        deletedAt: Date | null;
                                        latitude: number | null;
                                        longitude: number | null;
                                        locationId: string | null;
                                        categoryId: string | null;
                                    } | null;
                                    group: {
                                        id: string;
                                        name: string;
                                        description: string | null;
                                        image: string | null;
                                        creatorId: string;
                                        currencyId: string;
                                        emoji: string | null;
                                        color: string | null;
                                        createdAt: Date;
                                        updatedAt: Date;
                                        deletedAt: Date | null;
                                        token: string | null;
                                        useOptimalSettlement: boolean;
                                        defaultSplitType: "equal" | "percentage";
                                        type: "vacation" | "roommates" | "couple" | "travel" | "party" | "other";
                                        memberBalanceVisibility: "all_members" | "admins_only" | "no_one";
                                    };
                                    id: string;
                                    title: string;
                                    description: string | null;
                                    amount: string;
                                    currencyId: string;
                                    exchangeRateToBase: string;
                                    exchangeRateSnapshotId: string | null;
                                    paidById: string;
                                    groupId: string | null;
                                    friendshipId: string | null;
                                    date: Date;
                                    timezone: string;
                                    createdAt: Date;
                                    updatedAt: Date;
                                    createdById: string;
                                    deletedAt: Date | null;
                                    splitType: "custom" | "equal" | "percentage" | "shares";
                                    recurringExpenseRuleId: string | null;
                                    image: string | null;
                                    latitude: number | null;
                                    longitude: number | null;
                                    locationId: string | null;
                                    categoryId: string | null;
                                    importId: string | null;
                                    importSourceRow: number | null;
                                } & {
                                    entity: import("./lib/activities").ACTIVITY_ENTITY.expense;
                                    date: Date;
                                }) | ({
                                    fromUser: {
                                        id: string;
                                        name: string;
                                        image: string | null;
                                        username: string | null;
                                    };
                                    toUser: {
                                        id: string;
                                        name: string;
                                        image: string | null;
                                        username: string | null;
                                    };
                                    currency: {
                                        id: string;
                                        name: string;
                                        code: string;
                                        symbol: string | null;
                                        exchangeRateToBase: string;
                                        updatedAt: Date;
                                        decimals: number;
                                        type: "fiat" | "crypto";
                                    };
                                    group: {
                                        id: string;
                                        name: string;
                                        description: string | null;
                                        image: string | null;
                                        creatorId: string;
                                        currencyId: string;
                                        emoji: string | null;
                                        color: string | null;
                                        createdAt: Date;
                                        updatedAt: Date;
                                        deletedAt: Date | null;
                                        token: string | null;
                                        useOptimalSettlement: boolean;
                                        defaultSplitType: "equal" | "percentage";
                                        type: "vacation" | "roommates" | "couple" | "travel" | "party" | "other";
                                        memberBalanceVisibility: "all_members" | "admins_only" | "no_one";
                                    };
                                    id: string;
                                    fromUserId: string;
                                    toUserId: string;
                                    amount: string;
                                    currencyId: string;
                                    exchangeRateToBase: string;
                                    exchangeRateSnapshotId: string | null;
                                    date: Date;
                                    timezone: string;
                                    description: string | null;
                                    createdAt: Date;
                                    updatedAt: Date;
                                    groupId: string | null;
                                    createdById: string;
                                    deletedAt: Date | null;
                                    isSettlement: boolean;
                                    usedOptimalSettlement: boolean;
                                    importId: string | null;
                                    importSourceRow: number | null;
                                } & {
                                    entity: import("./lib/activities").ACTIVITY_ENTITY.payment;
                                    date: Date;
                                }))[];
                                nextCursor: string | null;
                                hasMore: boolean;
                            };
                            400: string;
                            403: "Forbidden" | {
                                code: string;
                                message: string;
                            };
                            404: "Not Found";
                            422: {
                                type: "validation";
                                on: string;
                                summary?: string;
                                message?: string;
                                found?: unknown;
                                property?: string;
                                expected?: string;
                            };
                        };
                    };
                };
            };
        };
    };
} & {
    groups: {
        ":id": {
            balances: {
                get: {
                    body: {};
                    params: {
                        id: string;
                    };
                    query: {};
                    headers: {};
                    response: {
                        401: "Unauthorized";
                        200: {
                            balances: import("./lib/group").BalanceResult[];
                            currency: {
                                id: string;
                                name: string;
                                code: string;
                                symbol: string | null;
                                exchangeRateToBase: string;
                                updatedAt: Date;
                                decimals: number;
                                type: "fiat" | "crypto";
                            };
                        };
                        403: "Forbidden" | {
                            code: string;
                            message: string;
                        };
                        404: "Not Found";
                        422: {
                            type: "validation";
                            on: string;
                            summary?: string;
                            message?: string;
                            found?: unknown;
                            property?: string;
                            expected?: string;
                        };
                    };
                };
            };
        };
    };
} & {
    groups: {
        ":id": {
            "member-balances": {
                get: {
                    body: {};
                    params: {
                        id: string;
                    };
                    query: {};
                    headers: {};
                    response: {
                        401: "Unauthorized";
                        200: {
                            memberBalances: {
                                member: {
                                    id: string;
                                    name: string;
                                    image: string | null;
                                };
                                balance: number;
                                balances: {
                                    member: {
                                        id: string;
                                        name: string;
                                        image: string | null;
                                        active: boolean;
                                    };
                                    balance: number;
                                }[];
                            }[];
                            currency: {
                                id: string;
                                name: string;
                                code: string;
                                symbol: string | null;
                                exchangeRateToBase: string;
                                updatedAt: Date;
                                decimals: number;
                                type: "fiat" | "crypto";
                            };
                        };
                        403: "Forbidden" | {
                            code: string;
                            message: string;
                        } | "Member balances are hidden for this group";
                        404: "Not Found" | "Group not found";
                        422: {
                            type: "validation";
                            on: string;
                            summary?: string;
                            message?: string;
                            found?: unknown;
                            property?: string;
                            expected?: string;
                        };
                    };
                };
            };
        };
    };
} & {
    groups: {
        ":id": {
            "smart-settle": {
                get: {
                    body: {};
                    params: {
                        id: string;
                    };
                    query: {};
                    headers: {};
                    response: {
                        401: "Unauthorized";
                        200: {
                            currency: {
                                id: string;
                                name: string;
                                code: string;
                                symbol: string | null;
                                exchangeRateToBase: string;
                                updatedAt: Date;
                                decimals: number;
                                type: "fiat" | "crypto";
                            };
                            settlements: {
                                from: {
                                    id: string;
                                    name: string;
                                    image: string | null;
                                    active: boolean;
                                } | undefined;
                                to: {
                                    id: string;
                                    name: string;
                                    image: string | null;
                                    active: boolean;
                                } | undefined;
                                amount: number;
                            }[];
                        };
                        403: "Forbidden" | {
                            code: string;
                            message: string;
                        };
                        404: "Not Found";
                        422: {
                            type: "validation";
                            on: string;
                            summary?: string;
                            message?: string;
                            found?: unknown;
                            property?: string;
                            expected?: string;
                        };
                    };
                };
            };
        };
    };
} & {
    groups: {
        ":id": {
            payments: {
                get: {
                    body: {};
                    params: {
                        id: string;
                    };
                    query: {};
                    headers: {};
                    response: {
                        401: "Unauthorized";
                        200: {
                            fromUser: {
                                id: string;
                                name: string;
                                image: string | null;
                                username: string | null;
                            };
                            toUser: {
                                id: string;
                                name: string;
                                image: string | null;
                                username: string | null;
                            };
                            currency: {
                                id: string;
                                name: string;
                                code: string;
                                symbol: string | null;
                                exchangeRateToBase: string;
                                updatedAt: Date;
                                decimals: number;
                                type: "fiat" | "crypto";
                            };
                            group: {
                                id: string;
                                name: string;
                                description: string | null;
                                image: string | null;
                                creatorId: string;
                                currencyId: string;
                                emoji: string | null;
                                color: string | null;
                                createdAt: Date;
                                updatedAt: Date;
                                deletedAt: Date | null;
                                token: string | null;
                                useOptimalSettlement: boolean;
                                defaultSplitType: "equal" | "percentage";
                                type: "vacation" | "roommates" | "couple" | "travel" | "party" | "other";
                                memberBalanceVisibility: "all_members" | "admins_only" | "no_one";
                            };
                            id: string;
                            fromUserId: string;
                            toUserId: string;
                            amount: string;
                            currencyId: string;
                            exchangeRateToBase: string;
                            exchangeRateSnapshotId: string | null;
                            date: Date;
                            timezone: string;
                            description: string | null;
                            createdAt: Date;
                            updatedAt: Date;
                            groupId: string | null;
                            createdById: string;
                            deletedAt: Date | null;
                            isSettlement: boolean;
                            usedOptimalSettlement: boolean;
                            importId: string | null;
                            importSourceRow: number | null;
                        }[];
                        403: "Forbidden" | {
                            code: string;
                            message: string;
                        };
                        404: "Not Found";
                        422: {
                            type: "validation";
                            on: string;
                            summary?: string;
                            message?: string;
                            found?: unknown;
                            property?: string;
                            expected?: string;
                        };
                    };
                };
            };
        };
    };
} & {
    groups: {
        ":id": {
            members: {
                get: {
                    body: {};
                    params: {
                        id: string;
                    };
                    query: {};
                    headers: {};
                    response: {
                        401: "Unauthorized";
                        200: {
                            isGuest: boolean;
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            role: string;
                            deletedAt: Date | null;
                            userId: string;
                            groupId: string;
                            joinedAt: Date;
                            defaultSplitPercentage: string | null;
                            name: string;
                            image: string | null;
                            isGold: boolean;
                        }[];
                        403: "Forbidden" | {
                            code: string;
                            message: string;
                        };
                        404: "Not Found";
                        422: {
                            type: "validation";
                            on: string;
                            summary?: string;
                            message?: string;
                            found?: unknown;
                            property?: string;
                            expected?: string;
                        };
                    };
                };
            };
        };
    };
} & {
    groups: {
        ":id": {
            "default-splits": {
                put: {
                    body: {
                        splitType: "equal" | "percentage";
                        members: {
                            percentage?: string | null | undefined;
                            memberId: string;
                        }[];
                    };
                    params: {
                        id: string;
                    };
                    query: {};
                    headers: {};
                    response: {
                        401: "Unauthorized";
                        200: {
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            role: string;
                            deletedAt: Date | null;
                            userId: string;
                            groupId: string;
                            joinedAt: Date;
                            defaultSplitPercentage: string | null;
                            name: string;
                            image: string | null;
                            isGold: boolean;
                        }[];
                        400: "Duplicate group member in default split request" | "Default splits can only include active members" | "Percentage defaults must include every active group member" | "Percentages must be numeric and non-negative" | "Percentage defaults must total 100";
                        403: "Forbidden" | {
                            code: string;
                            message: string;
                        };
                        404: "Not Found";
                        422: {
                            type: "validation";
                            on: string;
                            summary?: string;
                            message?: string;
                            found?: unknown;
                            property?: string;
                            expected?: string;
                        };
                    };
                };
            };
        };
    };
} & {
    groups: {
        ":id": {
            members: {
                post: {
                    body: {
                        members: string[];
                    };
                    params: {
                        id: string;
                    };
                    query: {};
                    headers: {};
                    response: {
                        401: "Unauthorized";
                        200: Omit<{
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            role: string;
                            deletedAt: Date | null;
                            userId: string;
                            groupId: string;
                            joinedAt: Date;
                            pinnedAt: Date | null;
                            archivedAt: Date | null;
                            defaultSplitPercentage: string | null;
                        }, "pinnedAt" | "archivedAt">[][];
                        400: "Member already exists in this group";
                        403: "Forbidden" | {
                            code: string;
                            message: string;
                        };
                        404: "Not Found";
                        422: {
                            type: "validation";
                            on: string;
                            summary?: string;
                            message?: string;
                            found?: unknown;
                            property?: string;
                            expected?: string;
                        };
                    };
                };
            };
        };
    };
} & {
    groups: {
        ":id": {
            expenses: {
                get: {
                    body: {};
                    params: {
                        id: string;
                    };
                    query: {};
                    headers: {};
                    response: {
                        401: "Unauthorized";
                        200: {
                            location: {
                                id: string;
                                label: string;
                                latitude: number;
                                longitude: number;
                            } | null;
                            paidByUser: {
                                id: string;
                                name: string;
                                email: string | null;
                                emailVerified: boolean;
                                image: string | null;
                                createdAt: Date;
                                updatedAt: Date;
                                username: string | null;
                                displayUsername: string | null;
                                bio: string | null;
                                isGuest: boolean;
                                managedBy: string | null;
                                currencyId: string | null;
                                inviteToken: string | null;
                                role: string | null;
                                banned: boolean | null;
                                banReason: string | null;
                                banExpires: Date | null;
                                lastLoginMethod: string | null;
                                profileCompletedAt: Date | null;
                                deletedAt: Date | null;
                                guestState: "managed" | "archived" | "merged" | null;
                                guestClaimedAt: Date | null;
                                guestArchivedAt: Date | null;
                                guestMergedAt: Date | null;
                                mergedIntoUserId: string | null;
                            };
                            currency: {
                                id: string;
                                name: string;
                                code: string;
                                symbol: string | null;
                                exchangeRateToBase: string;
                                updatedAt: Date;
                                decimals: number;
                                type: "fiat" | "crypto";
                            };
                            share: {
                                id: string;
                                expenseId: string;
                                userId: string;
                                amount: string;
                                createdAt: Date;
                                updatedAt: Date;
                                deletedAt: Date | null;
                            } | null;
                            category: {
                                id: string;
                                key: string | null;
                                name: string;
                                icon: string | null;
                                order: number | null;
                                createdAt: Date;
                            } | null;
                            recurrence: {
                                location: {
                                    id: string;
                                    label: string;
                                    latitude: number;
                                    longitude: number;
                                } | null;
                                id: string;
                                paidById: string;
                                creatorId: string;
                                groupId: string | null;
                                title: string;
                                description: string | null;
                                amount: string;
                                currencyId: string;
                                frequency: "daily" | "weekly" | "monthly" | "yearly";
                                interval: number;
                                startDate: Date;
                                endDate: Date | null;
                                timezone: string;
                                lastGenerated: Date | null;
                                active: boolean;
                                splitType: "custom" | "equal" | "percentage" | "shares";
                                createdAt: Date;
                                updatedAt: Date;
                                deletedAt: Date | null;
                                latitude: number | null;
                                longitude: number | null;
                                locationId: string | null;
                                categoryId: string | null;
                            } | null;
                            group: {
                                id: string;
                                name: string;
                                description: string | null;
                                image: string | null;
                                creatorId: string;
                                currencyId: string;
                                emoji: string | null;
                                color: string | null;
                                createdAt: Date;
                                updatedAt: Date;
                                deletedAt: Date | null;
                                token: string | null;
                                useOptimalSettlement: boolean;
                                defaultSplitType: "equal" | "percentage";
                                type: "vacation" | "roommates" | "couple" | "travel" | "party" | "other";
                                memberBalanceVisibility: "all_members" | "admins_only" | "no_one";
                            };
                            id: string;
                            title: string;
                            description: string | null;
                            amount: string;
                            currencyId: string;
                            exchangeRateToBase: string;
                            exchangeRateSnapshotId: string | null;
                            paidById: string;
                            groupId: string | null;
                            friendshipId: string | null;
                            date: Date;
                            timezone: string;
                            createdAt: Date;
                            updatedAt: Date;
                            createdById: string;
                            deletedAt: Date | null;
                            splitType: "custom" | "equal" | "percentage" | "shares";
                            recurringExpenseRuleId: string | null;
                            image: string | null;
                            latitude: number | null;
                            longitude: number | null;
                            locationId: string | null;
                            categoryId: string | null;
                            importId: string | null;
                            importSourceRow: number | null;
                        }[];
                        403: "Forbidden" | {
                            code: string;
                            message: string;
                        };
                        404: "Not Found";
                        422: {
                            type: "validation";
                            on: string;
                            summary?: string;
                            message?: string;
                            found?: unknown;
                            property?: string;
                            expected?: string;
                        };
                    };
                };
            };
        };
    };
} & {
    groups: {
        ":id": {
            expenses: {
                recurring: {
                    get: {
                        body: {};
                        params: {
                            id: string;
                        };
                        query: {};
                        headers: {};
                        response: {
                            401: "Unauthorized";
                            200: ({
                                location: {
                                    id: string;
                                    label: string;
                                    latitude: number;
                                    longitude: number;
                                } | null;
                                id: string;
                                paidById: string;
                                creatorId: string;
                                groupId: string | null;
                                title: string;
                                description: string | null;
                                amount: string;
                                currencyId: string;
                                frequency: "daily" | "weekly" | "monthly" | "yearly";
                                interval: number;
                                startDate: Date;
                                endDate: Date | null;
                                timezone: string;
                                lastGenerated: Date | null;
                                active: boolean;
                                splitType: "custom" | "equal" | "percentage" | "shares";
                                createdAt: Date;
                                updatedAt: Date;
                                deletedAt: Date | null;
                                latitude: number | null;
                                longitude: number | null;
                                locationId: string | null;
                                categoryId: string | null;
                            } & {
                                timezone?: string | null;
                                startDate?: Date | string | null;
                                endDate?: Date | string | null;
                                lastGenerated?: Date | string | null;
                            })[];
                            403: "Forbidden" | {
                                code: string;
                                message: string;
                            };
                            404: "Not Found";
                            422: {
                                type: "validation";
                                on: string;
                                summary?: string;
                                message?: string;
                                found?: unknown;
                                property?: string;
                                expected?: string;
                            };
                        };
                    };
                };
            };
        };
    };
} & {
    groups: {
        ":id": {
            members: {
                ":memberId": {
                    get: {
                        body: {};
                        params: {
                            id: string;
                            memberId: string;
                        };
                        query: {};
                        headers: {};
                        response: {
                            401: "Unauthorized";
                            200: {
                                isGold: boolean;
                                isGuest: boolean;
                                id: string;
                                createdAt: Date;
                                updatedAt: Date;
                                role: string;
                                deletedAt: Date | null;
                                userId: string;
                                groupId: string;
                                joinedAt: Date;
                                defaultSplitPercentage: string | null;
                                user: {
                                    id: string;
                                    name: string;
                                    email: string | null;
                                    emailVerified: boolean;
                                    image: string | null;
                                    createdAt: Date;
                                    updatedAt: Date;
                                    username: string | null;
                                    displayUsername: string | null;
                                    bio: string | null;
                                    isGuest: boolean;
                                    managedBy: string | null;
                                    currencyId: string | null;
                                    inviteToken: string | null;
                                    role: string | null;
                                    banned: boolean | null;
                                    banReason: string | null;
                                    banExpires: Date | null;
                                    lastLoginMethod: string | null;
                                    profileCompletedAt: Date | null;
                                    deletedAt: Date | null;
                                    guestState: "managed" | "archived" | "merged" | null;
                                    guestClaimedAt: Date | null;
                                    guestArchivedAt: Date | null;
                                    guestMergedAt: Date | null;
                                    mergedIntoUserId: string | null;
                                };
                            };
                            403: "Forbidden" | {
                                code: string;
                                message: string;
                            };
                            404: "Not Found" | "Group member not found";
                            422: {
                                type: "validation";
                                on: string;
                                summary?: string;
                                message?: string;
                                found?: unknown;
                                property?: string;
                                expected?: string;
                            };
                        };
                    };
                };
            };
        };
    };
} & {
    groups: {
        ":id": {
            members: {
                ":memberId": {
                    put: {
                        body: {
                            role: string;
                        };
                        params: {
                            id: string;
                            memberId: string;
                        };
                        query: {};
                        headers: {};
                        response: {
                            401: "Unauthorized";
                            200: Omit<{
                                id: string;
                                groupId: string;
                                userId: string;
                                role: string;
                                joinedAt: Date;
                                createdAt: Date;
                                updatedAt: Date;
                                deletedAt: Date | null;
                                pinnedAt: Date | null;
                                archivedAt: Date | null;
                                defaultSplitPercentage: string | null;
                            }, "pinnedAt" | "archivedAt">;
                            400: "Can not change role of group creator" | "Group must have at least one admin";
                            403: "Forbidden" | {
                                code: string;
                                message: string;
                            };
                            404: "Not Found" | "Group member not found";
                            422: {
                                type: "validation";
                                on: string;
                                summary?: string;
                                message?: string;
                                found?: unknown;
                                property?: string;
                                expected?: string;
                            };
                        };
                    };
                };
            };
        };
    };
} & {
    groups: {
        ":id": {
            members: {
                ":memberId": {
                    delete: {
                        body: {};
                        params: {
                            id: string;
                            memberId: string;
                        };
                        query: {};
                        headers: {};
                        response: {
                            401: "Unauthorized";
                            200: Omit<{
                                id: string;
                                groupId: string;
                                userId: string;
                                role: string;
                                joinedAt: Date;
                                createdAt: Date;
                                updatedAt: Date;
                                deletedAt: Date | null;
                                pinnedAt: Date | null;
                                archivedAt: Date | null;
                                defaultSplitPercentage: string | null;
                            }, "pinnedAt" | "archivedAt">;
                            400: "Can not remove group creator";
                            403: "Forbidden" | {
                                code: string;
                                message: string;
                            } | "Only admins can remove other admins";
                            404: "Not Found" | "Group member not found";
                            422: {
                                type: "validation";
                                on: string;
                                summary?: string;
                                message?: string;
                                found?: unknown;
                                property?: string;
                                expected?: string;
                            };
                        };
                    };
                };
            };
        };
    };
} & {
    groups: {
        ":id": {
            members: {
                current: {
                    get: {
                        body: {};
                        params: {
                            id: string;
                        };
                        query: {};
                        headers: {};
                        response: {
                            401: "Unauthorized";
                            200: {
                                isGold: boolean;
                                isGuest: boolean;
                                id: string;
                                groupId: string;
                                userId: string;
                                role: string;
                                joinedAt: Date;
                                createdAt: Date;
                                updatedAt: Date;
                                deletedAt: Date | null;
                                pinnedAt: Date | null;
                                archivedAt: Date | null;
                                defaultSplitPercentage: string | null;
                            };
                            403: {
                                code: string;
                                message: string;
                            };
                            404: "Not Found";
                            422: {
                                type: "validation";
                                on: string;
                                summary?: string;
                                message?: string;
                                found?: unknown;
                                property?: string;
                                expected?: string;
                            };
                        };
                    };
                };
            };
        };
    };
} & {
    groups: {
        ":id": {
            imports: {
                splitwise: {
                    post: {
                        body: {
                            timezone?: any;
                            file?: any;
                            previewToken?: any;
                            memberMappings?: any;
                        };
                        params: {
                            id: string;
                        };
                        query: {};
                        headers: {};
                        response: {
                            [x: number]: {
                                [x: string]: unknown;
                            };
                        };
                    };
                };
            };
        };
    };
} & {
    groups: {
        ":id": {
            export: {
                csv: {
                    get: {
                        body: {};
                        params: {
                            id: string;
                        };
                        query: {};
                        headers: {};
                        response: {
                            401: "Unauthorized";
                            200: string;
                            403: "Forbidden" | {
                                code: string;
                                message: string;
                            };
                            404: "Not Found";
                            422: {
                                type: "validation";
                                on: string;
                                summary?: string;
                                message?: string;
                                found?: unknown;
                                property?: string;
                                expected?: string;
                            };
                        };
                    };
                };
            };
        };
    };
} & {
    friends: {};
} & {
    friends: {
        get: {
            body: {};
            params: {};
            query: {
                l?: number | undefined;
                cursor?: string | undefined;
                sort?: import("./lib/friendships").FRIENDSHIP_SORT | undefined;
                filter?: import("./lib/friendships").FRIENDSHIP_FILTER | undefined;
                q?: string | undefined;
            };
            headers: {};
            response: {
                401: "Unauthorized";
                200: {
                    items: ({
                        user: {
                            id: string;
                            name: string;
                            image: string | null;
                            isGuest: boolean;
                        };
                        id: string;
                        userId1: string;
                        userId2: string;
                        status: "deleted" | "pending" | "accepted" | "rejected";
                        requestedById: string;
                        acceptedAt: Date | null;
                        createdAt: Date;
                        updatedAt: Date;
                    } & {
                        currency: {
                            id: string;
                            name: string;
                            code: string;
                            symbol: string | null;
                            exchangeRateToBase: string;
                            updatedAt: Date;
                            decimals: number;
                            type: "fiat" | "crypto";
                        };
                        balance: number;
                        hasActivity: boolean;
                        absBalance: number;
                        mostRecentActivity: Date | null;
                    } & {
                        user: {
                            isGold: boolean;
                            id: string;
                        } | null;
                    })[];
                    nextCursor: string | null;
                    hasMore: boolean;
                };
                400: string;
                403: {
                    code: string;
                    message: string;
                };
                422: {
                    type: "validation";
                    on: string;
                    summary?: string;
                    message?: string;
                    found?: unknown;
                    property?: string;
                    expected?: string;
                };
            };
        };
    };
} & {
    friends: {
        hot: {
            get: {
                body: {};
                params: {};
                query: {
                    l?: number | undefined;
                    sort?: import("./lib/friendships").FRIENDSHIP_SORT | undefined;
                    p?: number | undefined;
                };
                headers: {};
                response: {
                    401: "Unauthorized";
                    200: ({
                        user: {
                            id: string;
                            name: string;
                            image: string | null;
                            isGuest: boolean;
                        };
                        id: string;
                        userId1: string;
                        userId2: string;
                        status: "deleted" | "pending" | "accepted" | "rejected";
                        requestedById: string;
                        acceptedAt: Date | null;
                        createdAt: Date;
                        updatedAt: Date;
                    } & {
                        currency: {
                            id: string;
                            name: string;
                            code: string;
                            symbol: string | null;
                            exchangeRateToBase: string;
                            updatedAt: Date;
                            decimals: number;
                            type: "fiat" | "crypto";
                        };
                        balance: number;
                        hasActivity: boolean;
                        absBalance: number;
                        mostRecentActivity: Date | null;
                    } & {
                        user: {
                            isGold: boolean;
                            id: string;
                        } | null;
                    })[];
                    403: {
                        code: string;
                        message: string;
                    };
                    422: {
                        type: "validation";
                        on: string;
                        summary?: string;
                        message?: string;
                        found?: unknown;
                        property?: string;
                        expected?: string;
                    };
                };
            };
        };
    };
} & {
    friends: {
        search: {
            get: {
                body: {};
                params: {};
                query: {
                    l?: number | undefined;
                    p?: number | undefined;
                    q: string;
                };
                headers: {};
                response: {
                    401: "Unauthorized";
                    200: ({
                        mostRecentActivity: Date | null;
                        id: string;
                        userId1: string;
                        userId2: string;
                        status: "deleted" | "pending" | "accepted" | "rejected";
                        requestedById: string;
                        acceptedAt: Date | null;
                        createdAt: Date;
                        updatedAt: Date;
                        user: {
                            isGuest: boolean;
                            id: string;
                            name: string;
                            image: string | null;
                            username: string | null;
                        };
                        currency: {
                            id: string;
                            name: string;
                            code: string;
                            symbol: string | null;
                            exchangeRateToBase: string;
                            updatedAt: Date;
                            decimals: number;
                            type: "fiat" | "crypto";
                        };
                        balance: number;
                        absBalance: number;
                    } & {
                        user: {
                            isGold: boolean;
                            id: string;
                        } | null;
                    })[];
                    403: {
                        code: string;
                        message: string;
                    };
                    422: {
                        type: "validation";
                        on: string;
                        summary?: string;
                        message?: string;
                        found?: unknown;
                        property?: string;
                        expected?: string;
                    };
                };
            };
        };
    };
} & {
    friends: {
        ":id": {
            get: {
                body: {};
                params: {
                    id: string;
                };
                query: {};
                headers: {};
                response: {
                    401: "Unauthorized";
                    200: {
                        user: {
                            id: string;
                            name: string;
                            image: string | null;
                            isGuest: boolean;
                            isGold: boolean;
                        };
                        id: string;
                        userId1: string;
                        userId2: string;
                        status: "deleted" | "pending" | "accepted" | "rejected";
                        requestedById: string;
                        acceptedAt: Date | null;
                        createdAt: Date;
                        updatedAt: Date;
                    };
                    403: "Forbidden" | {
                        code: string;
                        message: string;
                    };
                    404: "Not Found" | "User not found";
                    422: {
                        type: "validation";
                        on: string;
                        summary?: string;
                        message?: string;
                        found?: unknown;
                        property?: string;
                        expected?: string;
                    };
                };
            };
        };
    };
} & {
    friends: {
        post: {
            body: {
                userId: string;
            };
            params: {};
            query: {};
            headers: {};
            response: {
                401: "Unauthorized";
                200: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    status: "deleted" | "pending" | "accepted" | "rejected";
                    userId1: string;
                    userId2: string;
                    requestedById: string;
                    acceptedAt: Date | null;
                };
                400: "Friendship already exists";
                403: {
                    code: string;
                    message: string;
                };
                404: "Not Found";
                422: {
                    type: "validation";
                    on: string;
                    summary?: string;
                    message?: string;
                    found?: unknown;
                    property?: string;
                    expected?: string;
                };
            };
        };
    };
} & {
    friends: {
        ":id": {
            put: {
                body: {
                    status: import("./lib/friendships").FRIENDSHIP_STATUS.accepted | import("./lib/friendships").FRIENDSHIP_STATUS.rejected;
                };
                params: {
                    id: string;
                };
                query: {};
                headers: {};
                response: {
                    401: "Unauthorized";
                    200: {
                        id: string;
                        userId1: string;
                        userId2: string;
                        status: "deleted" | "pending" | "accepted" | "rejected";
                        requestedById: string;
                        acceptedAt: Date | null;
                        createdAt: Date;
                        updatedAt: Date;
                    };
                    400: "Requester can't accept friendship";
                    403: "Forbidden" | {
                        code: string;
                        message: string;
                    };
                    404: "Not Found" | "User not found";
                    422: {
                        type: "validation";
                        on: string;
                        summary?: string;
                        message?: string;
                        found?: unknown;
                        property?: string;
                        expected?: string;
                    };
                };
            };
        };
    };
} & {
    friends: {
        ":id": {
            delete: {
                body: {};
                params: {
                    id: string;
                };
                query: {};
                headers: {};
                response: {
                    401: "Unauthorized";
                    200: {
                        id: string;
                        userId1: string;
                        userId2: string;
                        status: "deleted" | "pending" | "accepted" | "rejected";
                        requestedById: string;
                        acceptedAt: Date | null;
                        createdAt: Date;
                        updatedAt: Date;
                    };
                    403: "Forbidden" | {
                        code: string;
                        message: string;
                    };
                    404: "Not Found" | "User not found";
                    422: {
                        type: "validation";
                        on: string;
                        summary?: string;
                        message?: string;
                        found?: unknown;
                        property?: string;
                        expected?: string;
                    };
                };
            };
        };
    };
} & {
    friends: {
        ":id": {
            activities: {
                get: {
                    body: {};
                    params: {
                        id: string;
                    };
                    query: {
                        l?: number | undefined;
                        cursor?: string | undefined;
                        sort?: "date" | "amount" | undefined;
                        direction?: "asc" | "desc" | undefined;
                        type?: "all" | "payments" | "expenses" | "recurring_expenses" | undefined;
                        groupId?: string | undefined;
                        paidById?: string | undefined;
                        categoryId?: string | undefined;
                        group?: "all" | "group" | "non_group" | undefined;
                        categoryIds?: string[] | undefined;
                        paidByIds?: string[] | undefined;
                        participantIds?: string[] | undefined;
                        creatorIds?: string[] | undefined;
                    };
                    headers: {};
                    response: {
                        401: "Unauthorized";
                        200: {
                            items: (({
                                location: {
                                    id: string;
                                    label: string;
                                    latitude: number;
                                    longitude: number;
                                } | null;
                                paidByUser: {
                                    id: string;
                                    name: string;
                                    image: string | null;
                                    username: string | null;
                                };
                                share: {
                                    id: string;
                                    expenseId: string;
                                    userId: string;
                                    amount: string;
                                    createdAt: Date;
                                    updatedAt: Date;
                                    deletedAt: Date | null;
                                };
                                currency: {
                                    id: string;
                                    name: string;
                                    code: string;
                                    symbol: string | null;
                                    exchangeRateToBase: string;
                                    updatedAt: Date;
                                    decimals: number;
                                    type: "fiat" | "crypto";
                                };
                                category: {
                                    id: string;
                                    key: string | null;
                                    name: string;
                                    icon: string | null;
                                    order: number | null;
                                    createdAt: Date;
                                } | null;
                                recurrence: {
                                    location: {
                                        id: string;
                                        label: string;
                                        latitude: number;
                                        longitude: number;
                                    } | null;
                                    id: string;
                                    paidById: string;
                                    creatorId: string;
                                    groupId: string | null;
                                    title: string;
                                    description: string | null;
                                    amount: string;
                                    currencyId: string;
                                    frequency: "daily" | "weekly" | "monthly" | "yearly";
                                    interval: number;
                                    startDate: Date;
                                    endDate: Date | null;
                                    timezone: string;
                                    lastGenerated: Date | null;
                                    active: boolean;
                                    splitType: "custom" | "equal" | "percentage" | "shares";
                                    createdAt: Date;
                                    updatedAt: Date;
                                    deletedAt: Date | null;
                                    latitude: number | null;
                                    longitude: number | null;
                                    locationId: string | null;
                                    categoryId: string | null;
                                } | null;
                                group: {
                                    id: string;
                                    name: string;
                                    description: string | null;
                                    image: string | null;
                                    creatorId: string;
                                    currencyId: string;
                                    emoji: string | null;
                                    color: string | null;
                                    createdAt: Date;
                                    updatedAt: Date;
                                    deletedAt: Date | null;
                                    token: string | null;
                                    useOptimalSettlement: boolean;
                                    defaultSplitType: "equal" | "percentage";
                                    type: "vacation" | "roommates" | "couple" | "travel" | "party" | "other";
                                    memberBalanceVisibility: "all_members" | "admins_only" | "no_one";
                                } | null;
                                id: string;
                                title: string;
                                description: string | null;
                                amount: string;
                                currencyId: string;
                                exchangeRateToBase: string;
                                exchangeRateSnapshotId: string | null;
                                paidById: string;
                                groupId: string | null;
                                friendshipId: string | null;
                                date: Date;
                                timezone: string;
                                createdAt: Date;
                                updatedAt: Date;
                                createdById: string;
                                deletedAt: Date | null;
                                splitType: "custom" | "equal" | "percentage" | "shares";
                                recurringExpenseRuleId: string | null;
                                image: string | null;
                                latitude: number | null;
                                longitude: number | null;
                                locationId: string | null;
                                categoryId: string | null;
                                importId: string | null;
                                importSourceRow: number | null;
                            } & {
                                entity: import("./lib/activities").ACTIVITY_ENTITY.expense;
                                date: Date;
                            }) | ({
                                fromUser: {
                                    id: string;
                                    name: string;
                                    image: string | null;
                                    username: string | null;
                                };
                                toUser: {
                                    id: string;
                                    name: string;
                                    image: string | null;
                                    username: string | null;
                                };
                                currency: {
                                    id: string;
                                    name: string;
                                    code: string;
                                    symbol: string | null;
                                    exchangeRateToBase: string;
                                    updatedAt: Date;
                                    decimals: number;
                                    type: "fiat" | "crypto";
                                };
                                group: {
                                    id: string;
                                    name: string;
                                    description: string | null;
                                    image: string | null;
                                    creatorId: string;
                                    currencyId: string;
                                    emoji: string | null;
                                    color: string | null;
                                    createdAt: Date;
                                    updatedAt: Date;
                                    deletedAt: Date | null;
                                    token: string | null;
                                    useOptimalSettlement: boolean;
                                    defaultSplitType: "equal" | "percentage";
                                    type: "vacation" | "roommates" | "couple" | "travel" | "party" | "other";
                                    memberBalanceVisibility: "all_members" | "admins_only" | "no_one";
                                } | null;
                                id: string;
                                fromUserId: string;
                                toUserId: string;
                                amount: string;
                                currencyId: string;
                                exchangeRateToBase: string;
                                exchangeRateSnapshotId: string | null;
                                date: Date;
                                timezone: string;
                                description: string | null;
                                createdAt: Date;
                                updatedAt: Date;
                                groupId: string | null;
                                createdById: string;
                                deletedAt: Date | null;
                                isSettlement: boolean;
                                usedOptimalSettlement: boolean;
                                importId: string | null;
                                importSourceRow: number | null;
                            } & {
                                entity: import("./lib/activities").ACTIVITY_ENTITY.payment;
                                date: Date;
                            }))[];
                            nextCursor: string | null;
                            hasMore: boolean;
                        };
                        400: string;
                        403: "Forbidden" | {
                            code: string;
                            message: string;
                        };
                        404: "Not Found";
                        422: {
                            type: "validation";
                            on: string;
                            summary?: string;
                            message?: string;
                            found?: unknown;
                            property?: string;
                            expected?: string;
                        };
                    };
                };
            };
        };
    };
} & {
    friends: {
        ":id": {
            activities: {
                search: {
                    get: {
                        body: {};
                        params: {
                            id: string;
                        };
                        query: {
                            l?: number | undefined;
                            cursor?: string | undefined;
                            sort?: "date" | "amount" | undefined;
                            direction?: "asc" | "desc" | undefined;
                            type?: "all" | "payments" | "expenses" | "recurring_expenses" | undefined;
                            groupId?: string | undefined;
                            paidById?: string | undefined;
                            categoryId?: string | undefined;
                            group?: "all" | "group" | "non_group" | undefined;
                            categoryIds?: string[] | undefined;
                            paidByIds?: string[] | undefined;
                            participantIds?: string[] | undefined;
                            creatorIds?: string[] | undefined;
                            q: string;
                        };
                        headers: {};
                        response: {
                            401: "Unauthorized";
                            200: {
                                items: (({
                                    location: {
                                        id: string;
                                        label: string;
                                        latitude: number;
                                        longitude: number;
                                    } | null;
                                    paidByUser: {
                                        id: string;
                                        name: string;
                                        image: string | null;
                                        username: string | null;
                                    };
                                    share: {
                                        id: string;
                                        expenseId: string;
                                        userId: string;
                                        amount: string;
                                        createdAt: Date;
                                        updatedAt: Date;
                                        deletedAt: Date | null;
                                    };
                                    currency: {
                                        id: string;
                                        name: string;
                                        code: string;
                                        symbol: string | null;
                                        exchangeRateToBase: string;
                                        updatedAt: Date;
                                        decimals: number;
                                        type: "fiat" | "crypto";
                                    };
                                    category: {
                                        id: string;
                                        key: string | null;
                                        name: string;
                                        icon: string | null;
                                        order: number | null;
                                        createdAt: Date;
                                    } | null;
                                    recurrence: {
                                        location: {
                                            id: string;
                                            label: string;
                                            latitude: number;
                                            longitude: number;
                                        } | null;
                                        id: string;
                                        paidById: string;
                                        creatorId: string;
                                        groupId: string | null;
                                        title: string;
                                        description: string | null;
                                        amount: string;
                                        currencyId: string;
                                        frequency: "daily" | "weekly" | "monthly" | "yearly";
                                        interval: number;
                                        startDate: Date;
                                        endDate: Date | null;
                                        timezone: string;
                                        lastGenerated: Date | null;
                                        active: boolean;
                                        splitType: "custom" | "equal" | "percentage" | "shares";
                                        createdAt: Date;
                                        updatedAt: Date;
                                        deletedAt: Date | null;
                                        latitude: number | null;
                                        longitude: number | null;
                                        locationId: string | null;
                                        categoryId: string | null;
                                    } | null;
                                    group: {
                                        id: string;
                                        name: string;
                                        description: string | null;
                                        image: string | null;
                                        creatorId: string;
                                        currencyId: string;
                                        emoji: string | null;
                                        color: string | null;
                                        createdAt: Date;
                                        updatedAt: Date;
                                        deletedAt: Date | null;
                                        token: string | null;
                                        useOptimalSettlement: boolean;
                                        defaultSplitType: "equal" | "percentage";
                                        type: "vacation" | "roommates" | "couple" | "travel" | "party" | "other";
                                        memberBalanceVisibility: "all_members" | "admins_only" | "no_one";
                                    } | null;
                                    id: string;
                                    title: string;
                                    description: string | null;
                                    amount: string;
                                    currencyId: string;
                                    exchangeRateToBase: string;
                                    exchangeRateSnapshotId: string | null;
                                    paidById: string;
                                    groupId: string | null;
                                    friendshipId: string | null;
                                    date: Date;
                                    timezone: string;
                                    createdAt: Date;
                                    updatedAt: Date;
                                    createdById: string;
                                    deletedAt: Date | null;
                                    splitType: "custom" | "equal" | "percentage" | "shares";
                                    recurringExpenseRuleId: string | null;
                                    image: string | null;
                                    latitude: number | null;
                                    longitude: number | null;
                                    locationId: string | null;
                                    categoryId: string | null;
                                    importId: string | null;
                                    importSourceRow: number | null;
                                } & {
                                    entity: import("./lib/activities").ACTIVITY_ENTITY.expense;
                                    date: Date;
                                }) | ({
                                    fromUser: {
                                        id: string;
                                        name: string;
                                        image: string | null;
                                        username: string | null;
                                    };
                                    toUser: {
                                        id: string;
                                        name: string;
                                        image: string | null;
                                        username: string | null;
                                    };
                                    currency: {
                                        id: string;
                                        name: string;
                                        code: string;
                                        symbol: string | null;
                                        exchangeRateToBase: string;
                                        updatedAt: Date;
                                        decimals: number;
                                        type: "fiat" | "crypto";
                                    };
                                    group: {
                                        id: string;
                                        name: string;
                                        description: string | null;
                                        image: string | null;
                                        creatorId: string;
                                        currencyId: string;
                                        emoji: string | null;
                                        color: string | null;
                                        createdAt: Date;
                                        updatedAt: Date;
                                        deletedAt: Date | null;
                                        token: string | null;
                                        useOptimalSettlement: boolean;
                                        defaultSplitType: "equal" | "percentage";
                                        type: "vacation" | "roommates" | "couple" | "travel" | "party" | "other";
                                        memberBalanceVisibility: "all_members" | "admins_only" | "no_one";
                                    } | null;
                                    id: string;
                                    fromUserId: string;
                                    toUserId: string;
                                    amount: string;
                                    currencyId: string;
                                    exchangeRateToBase: string;
                                    exchangeRateSnapshotId: string | null;
                                    date: Date;
                                    timezone: string;
                                    description: string | null;
                                    createdAt: Date;
                                    updatedAt: Date;
                                    groupId: string | null;
                                    createdById: string;
                                    deletedAt: Date | null;
                                    isSettlement: boolean;
                                    usedOptimalSettlement: boolean;
                                    importId: string | null;
                                    importSourceRow: number | null;
                                } & {
                                    entity: import("./lib/activities").ACTIVITY_ENTITY.payment;
                                    date: Date;
                                }))[];
                                nextCursor: string | null;
                                hasMore: boolean;
                            };
                            400: string;
                            403: "Forbidden" | {
                                code: string;
                                message: string;
                            };
                            404: "Not Found";
                            422: {
                                type: "validation";
                                on: string;
                                summary?: string;
                                message?: string;
                                found?: unknown;
                                property?: string;
                                expected?: string;
                            };
                        };
                    };
                };
            };
        };
    };
} & {
    friends: {
        ":id": {
            groups: {
                get: {
                    body: {};
                    params: {
                        id: string;
                    };
                    query: {};
                    headers: {};
                    response: {
                        401: "Unauthorized";
                        200: {
                            id: string;
                            name: string;
                            description: string | null;
                            image: string | null;
                            creatorId: string;
                            currencyId: string;
                            emoji: string | null;
                            color: string | null;
                            createdAt: Date;
                            updatedAt: Date;
                            deletedAt: Date | null;
                            token: string | null;
                            useOptimalSettlement: boolean;
                            defaultSplitType: "equal" | "percentage";
                            type: "vacation" | "roommates" | "couple" | "travel" | "party" | "other";
                            memberBalanceVisibility: "all_members" | "admins_only" | "no_one";
                        }[];
                        403: "Forbidden" | {
                            code: string;
                            message: string;
                        };
                        404: "Not Found" | "User not found";
                        422: {
                            type: "validation";
                            on: string;
                            summary?: string;
                            message?: string;
                            found?: unknown;
                            property?: string;
                            expected?: string;
                        };
                    };
                };
            };
        };
    };
} & {
    friends: {
        requests: {
            incoming: {
                get: {
                    body: {};
                    params: {};
                    query: {};
                    headers: {};
                    response: {
                        401: "Unauthorized";
                        200: ({
                            id: string;
                            userId1: string;
                            userId2: string;
                            status: "deleted" | "pending" | "accepted" | "rejected";
                            requestedById: string;
                            acceptedAt: Date | null;
                            createdAt: Date;
                            updatedAt: Date;
                            user: {
                                isGuest: boolean;
                                id: string;
                                name: string;
                                image: string | null;
                                username: string | null;
                            } | null;
                        } & {
                            user: {
                                isGold: boolean;
                                id: string;
                            } | null;
                        })[];
                        403: {
                            code: string;
                            message: string;
                        };
                    };
                };
            };
        };
    };
} & {
    friends: {
        requests: {
            pending: {
                get: {
                    body: {};
                    params: {};
                    query: {};
                    headers: {};
                    response: {
                        401: "Unauthorized";
                        200: ({
                            id: string;
                            userId1: string;
                            userId2: string;
                            status: "deleted" | "pending" | "accepted" | "rejected";
                            requestedById: string;
                            acceptedAt: Date | null;
                            createdAt: Date;
                            updatedAt: Date;
                            user: {
                                isGuest: boolean;
                                id: string;
                                name: string;
                                image: string | null;
                                username: string | null;
                            } | null;
                        } & {
                            user: {
                                isGold: boolean;
                                id: string;
                            } | null;
                        })[];
                        403: {
                            code: string;
                            message: string;
                        };
                    };
                };
            };
        };
    };
} & {
    connections: {};
} & {
    connections: {
        get: {
            body: {};
            params: {};
            query: {
                l?: number | undefined;
                p?: number | undefined;
            };
            headers: {};
            response: {
                401: "Unauthorized";
                200: {
                    user: {
                        id: string;
                        name: string;
                        image: string | null;
                    };
                    currency: {
                        id: string;
                        name: string;
                        code: string;
                        symbol: string | null;
                        exchangeRateToBase: string;
                        updatedAt: Date;
                        decimals: number;
                        type: "fiat" | "crypto";
                    };
                    balance: number;
                    absBalance: number;
                    isFriend: false;
                }[];
                403: {
                    code: string;
                    message: string;
                };
                422: {
                    type: "validation";
                    on: string;
                    summary?: string;
                    message?: string;
                    found?: unknown;
                    property?: string;
                    expected?: string;
                };
            };
        };
    };
} & {
    currencies: {};
} & {
    currencies: {
        get: {
            body: {};
            params: {};
            query: {};
            headers: {};
            response: {
                200: {
                    id: string;
                    name: string;
                    code: string;
                    symbol: string | null;
                    exchangeRateToBase: string;
                    updatedAt: Date;
                    decimals: number;
                    type: "fiat" | "crypto";
                }[];
            };
        };
    };
} & {
    currencies: {
        ":id": {
            get: {
                body: {};
                params: {
                    id: string;
                };
                query: {};
                headers: {};
                response: {
                    401: "Unauthorized";
                    200: {
                        id: string;
                        name: string;
                        code: string;
                        symbol: string | null;
                        exchangeRateToBase: string;
                        updatedAt: Date;
                        decimals: number;
                        type: "fiat" | "crypto";
                    };
                    403: {
                        code: string;
                        message: string;
                    };
                    404: "Not Found";
                    422: {
                        type: "validation";
                        on: string;
                        summary?: string;
                        message?: string;
                        found?: unknown;
                        property?: string;
                        expected?: string;
                    };
                };
            };
        };
    };
} & {
    currencies: {
        "update-rates": {
            post: {
                body: {};
                params: {};
                query: {};
                headers: {};
                response: {
                    403: "Unauthorized" | "Forbidden";
                };
            };
        };
    };
} & {
    ai: {};
} & {
    ai: {
        scan: {
            post: {
                body: {
                    date?: string | undefined;
                    context?: string | undefined;
                    locale?: string | undefined;
                    image: File;
                };
                params: {};
                query: {};
                headers: {};
                response: {
                    401: "Unauthorized";
                    200: {
                        type: "bill";
                        content: {
                            items: Array<{
                                name: string;
                                value: number;
                                quantity: number;
                            }>;
                            date: string;
                            currency: string | null;
                            summary: string;
                            error: boolean;
                        };
                    } | {
                        type: "bank";
                        content: {
                            items: Array<{
                                name: string;
                                value: number;
                                date: string;
                                currency: string;
                            }>;
                            error: boolean;
                        };
                    } | {
                        type: "generic";
                        content: {
                            price: number | null;
                            currency: string | null;
                            date: string | null;
                            summary: string | null;
                        };
                    };
                    400: string;
                    403: {
                        code: string;
                        message: string;
                    };
                    422: {
                        type: "validation";
                        on: string;
                        summary?: string;
                        message?: string;
                        found?: unknown;
                        property?: string;
                        expected?: string;
                    };
                    429: {
                        code: typeof import("./lib/billing").FEATURE_QUOTA_EXCEEDED;
                        featureKey: string;
                        plan: "free" | "gold";
                        used: number;
                        limit: number;
                        remaining: number;
                        resetsAt: Date | null;
                        upgradeRequired?: true | undefined;
                    };
                };
            };
        };
    };
} & {
    ai: {
        generic: {
            post: {
                body: {
                    date?: string | undefined;
                    context?: string | undefined;
                    locale?: string | undefined;
                    image: File;
                };
                params: {};
                query: {};
                headers: {};
                response: {
                    401: "Unauthorized";
                    200: {
                        content: {
                            price: number | null;
                            currency: string | null;
                            date: string | null;
                            summary: string | null;
                        };
                    };
                    400: string;
                    403: {
                        code: string;
                        message: string;
                    };
                    422: {
                        type: "validation";
                        on: string;
                        summary?: string;
                        message?: string;
                        found?: unknown;
                        property?: string;
                        expected?: string;
                    };
                    429: {
                        code: typeof import("./lib/billing").FEATURE_QUOTA_EXCEEDED;
                        featureKey: string;
                        plan: "free" | "gold";
                        used: number;
                        limit: number;
                        remaining: number;
                        resetsAt: Date | null;
                        upgradeRequired?: true | undefined;
                    };
                };
            };
        };
    };
} & {
    ai: {
        bill: {
            items: {
                post: {
                    body: {
                        date?: string | undefined;
                        context?: string | undefined;
                        locale?: string | undefined;
                        image: File;
                    };
                    params: {};
                    query: {};
                    headers: {};
                    response: {
                        401: "Unauthorized";
                        200: {
                            content: {
                                items: Array<{
                                    name: string;
                                    value: number;
                                    quantity: number;
                                }>;
                                date: string;
                                currency: string | null;
                                summary: string;
                                error: boolean;
                            };
                        };
                        400: string;
                        403: {
                            code: string;
                            message: string;
                        };
                        422: {
                            type: "validation";
                            on: string;
                            summary?: string;
                            message?: string;
                            found?: unknown;
                            property?: string;
                            expected?: string;
                        };
                        429: {
                            code: typeof import("./lib/billing").FEATURE_QUOTA_EXCEEDED;
                            featureKey: string;
                            plan: "free" | "gold";
                            used: number;
                            limit: number;
                            remaining: number;
                            resetsAt: Date | null;
                            upgradeRequired?: true | undefined;
                        };
                    };
                };
            };
        };
    };
} & {
    ai: {
        bank: {
            items: {
                post: {
                    body: {
                        date?: string | undefined;
                        context?: string | undefined;
                        locale?: string | undefined;
                        image: File;
                    };
                    params: {};
                    query: {};
                    headers: {};
                    response: {
                        401: "Unauthorized";
                        200: {
                            content: {
                                items: Array<{
                                    name: string;
                                    value: number;
                                    date: string;
                                    currency: string;
                                }>;
                                error: boolean;
                            };
                        };
                        400: string;
                        403: {
                            code: string;
                            message: string;
                        };
                        422: {
                            type: "validation";
                            on: string;
                            summary?: string;
                            message?: string;
                            found?: unknown;
                            property?: string;
                            expected?: string;
                        };
                        429: {
                            code: typeof import("./lib/billing").FEATURE_QUOTA_EXCEEDED;
                            featureKey: string;
                            plan: "free" | "gold";
                            used: number;
                            limit: number;
                            remaining: number;
                            resetsAt: Date | null;
                            upgradeRequired?: true | undefined;
                        };
                    };
                };
            };
        };
    };
} & {
    invites: {};
} & {
    invites: {
        get: {
            body: {};
            params: {};
            query: {};
            headers: {};
            response: {
                401: "Unauthorized";
                200: {
                    id: string;
                    inviterId: string;
                    token: string;
                    createdAt: Date;
                    expiresAt: Date | null;
                    expiryMode: "soft" | "hard" | null;
                }[];
                403: {
                    code: string;
                    message: string;
                };
            };
        };
    };
} & {
    invites: {
        users: {
            get: {
                body: {};
                params: {};
                query: {};
                headers: {};
                response: {
                    401: "Unauthorized";
                    200: {
                        id: string | null;
                        name: string | null;
                        image: string | null;
                        username: string | null;
                    }[];
                    403: {
                        code: string;
                        message: string;
                    };
                };
            };
        };
    };
} & {
    invites: {
        current: {
            get: {
                body: {};
                params: {};
                query: {};
                headers: {};
                response: {
                    401: "Unauthorized";
                    403: {
                        code: string;
                        message: string;
                    };
                };
            };
        };
    };
} & {
    invites: {
        post: {
            body: {};
            params: {};
            query: {};
            headers: {};
            response: {
                401: "Unauthorized";
                403: {
                    code: string;
                    message: string;
                };
            };
        };
    };
} & {
    imports: {};
} & {
    imports: {
        splitwise: {
            preview: {
                post: {
                    body: {
                        timezone?: any;
                        file?: any;
                    };
                    params: {};
                    query: {};
                    headers: {};
                    response: {
                        [x: number]: {
                            [x: string]: unknown;
                        };
                    };
                };
            };
        };
    };
} & {
    imports: {
        "member-matches": {
            post: {
                body: {
                    source?: "splitwise" | undefined;
                    groupId?: string | undefined;
                    participants: {
                        name: string;
                        columnIndex: number;
                    }[];
                };
                params: {};
                query: {};
                headers: {};
                response: {
                    [x: number]: {
                        readonly code: string;
                        readonly message: string;
                    };
                };
            };
        };
    };
} & {
    unsubscribe: {
        get: {
            body: unknown;
            params: {};
            query: {
                channel?: string | undefined;
                token: string;
            };
            headers: unknown;
            response: {
                200: Response;
                422: {
                    type: "validation";
                    on: string;
                    summary?: string;
                    message?: string;
                    found?: unknown;
                    property?: string;
                    expected?: string;
                };
            };
        };
    };
} & {
    unsubscribe: {
        post: {
            body: any;
            params: {};
            query: {
                channel?: string | undefined;
                token: string;
            };
            headers: unknown;
            response: {
                200: Response;
                422: {
                    type: "validation";
                    on: string;
                    summary?: string;
                    message?: string;
                    found?: unknown;
                    property?: string;
                    expected?: string;
                };
            };
        };
    };
} & {
    marketing: {};
} & {
    marketing: {
        preferences: {
            get: {
                body: {};
                params: {};
                query: {
                    channel?: string | undefined;
                };
                headers: {};
                response: {
                    401: "Unauthorized";
                    200: import("./lib/marketing").MarketingPreference;
                    403: {
                        code: string;
                        message: string;
                    };
                    422: {
                        type: "validation";
                        on: string;
                        summary?: string;
                        message?: string;
                        found?: unknown;
                        property?: string;
                        expected?: string;
                    };
                };
            };
        };
    };
} & {
    marketing: {
        preferences: {
            put: {
                body: {
                    channel?: string | undefined;
                    subscribed: boolean;
                };
                params: {};
                query: {};
                headers: {};
                response: {
                    401: "Unauthorized";
                    200: import("./lib/marketing").MarketingPreference;
                    400: "User does not have an email address";
                    403: {
                        code: string;
                        message: string;
                    };
                    422: {
                        type: "validation";
                        on: string;
                        summary?: string;
                        message?: string;
                        found?: unknown;
                        property?: string;
                        expected?: string;
                    };
                };
            };
        };
    };
} & {
    marketing: {
        preferences: {
            token: {
                post: {
                    body: {};
                    params: {};
                    query: {};
                    headers: {};
                    response: {
                        [x: number]: string;
                    };
                };
            };
        };
    };
} & {
    marketing: {
        preferences: {
            session: {
                post: {
                    body: {
                        channel?: string | undefined;
                        token: string;
                    };
                    params: {};
                    query: {};
                    headers: {};
                    response: {
                        [x: number]: string;
                    };
                };
            };
        };
    };
} & {
    marketing: {
        preferences: {
            session: {
                get: {
                    body: {};
                    params: {};
                    query: {
                        channel?: string | undefined;
                    };
                    headers: {};
                    response: {
                        [x: number]: string;
                    };
                };
            };
        };
    };
} & {
    marketing: {
        preferences: {
            session: {
                put: {
                    body: {
                        channel?: string | undefined;
                        subscribed: boolean;
                    };
                    params: {};
                    query: {};
                    headers: {};
                    response: {
                        [x: number]: string;
                    };
                };
            };
        };
    };
} & {
    marketing: {
        preferences: {
            session: {
                delete: {
                    body: {};
                    params: {};
                    query: {};
                    headers: {};
                    response: {
                        200: Response;
                    };
                };
            };
        };
    };
} & {
    marketing: {
        admin: {
            campaigns: {
                get: {
                    body: {};
                    params: {};
                    query: {
                        limit?: number | undefined;
                    };
                    headers: {};
                    response: {
                        401: "Unauthorized";
                        200: {};
                        403: {
                            code: string;
                            message: string;
                        };
                        422: {
                            type: "validation";
                            on: string;
                            summary?: string;
                            message?: string;
                            found?: unknown;
                            property?: string;
                            expected?: string;
                        };
                    };
                };
            };
        };
    };
} & {
    marketing: {
        admin: {
            campaigns: {
                ":campaignId": {
                    get: {
                        body: {};
                        params: {
                            campaignId: string;
                        };
                        query: {};
                        headers: {};
                        response: {
                            401: "Unauthorized";
                            200: {};
                            403: {
                                code: string;
                                message: string;
                            };
                            422: {
                                type: "validation";
                                on: string;
                                summary?: string;
                                message?: string;
                                found?: unknown;
                                property?: string;
                                expected?: string;
                            };
                        };
                    };
                };
            };
        };
    };
} & {
    marketing: {
        admin: {
            campaigns: {
                post: {
                    body: {
                        channel?: string | undefined;
                        previewText?: string | undefined;
                        from?: string | undefined;
                        replyTo?: string[] | undefined;
                        html?: string | undefined;
                        text?: string | undefined;
                        segmentId?: string | undefined;
                        topicId?: string | null | undefined;
                        templateKey?: string | undefined;
                        name: string;
                        subject: string;
                    };
                    params: {};
                    query: {};
                    headers: {};
                    response: {
                        401: "Unauthorized";
                        200: {};
                        403: {
                            code: string;
                            message: string;
                        };
                        422: {
                            type: "validation";
                            on: string;
                            summary?: string;
                            message?: string;
                            found?: unknown;
                            property?: string;
                            expected?: string;
                        };
                    };
                };
            };
        };
    };
} & {
    marketing: {
        admin: {
            campaigns: {
                ":campaignId": {
                    send: {
                        post: {
                            body: {
                                scheduledFor?: string | null | undefined;
                            };
                            params: {
                                campaignId: string;
                            };
                            query: {};
                            headers: {};
                            response: {
                                401: "Unauthorized";
                                200: {};
                                403: {
                                    code: string;
                                    message: string;
                                };
                                422: {
                                    type: "validation";
                                    on: string;
                                    summary?: string;
                                    message?: string;
                                    found?: unknown;
                                    property?: string;
                                    expected?: string;
                                };
                            };
                        };
                    };
                };
            };
        };
    };
} & {
    marketing: {
        admin: {
            sequences: {
                get: {
                    body: {};
                    params: {};
                    query: {
                        limit?: number | undefined;
                    };
                    headers: {};
                    response: {
                        401: "Unauthorized";
                        200: {};
                        403: {
                            code: string;
                            message: string;
                        };
                        422: {
                            type: "validation";
                            on: string;
                            summary?: string;
                            message?: string;
                            found?: unknown;
                            property?: string;
                            expected?: string;
                        };
                    };
                };
            };
        };
    };
} & {
    marketing: {
        admin: {
            sequences: {
                ":sequenceId": {
                    get: {
                        body: {};
                        params: {
                            sequenceId: string;
                        };
                        query: {};
                        headers: {};
                        response: {
                            401: "Unauthorized";
                            200: {};
                            403: {
                                code: string;
                                message: string;
                            };
                            422: {
                                type: "validation";
                                on: string;
                                summary?: string;
                                message?: string;
                                found?: unknown;
                                property?: string;
                                expected?: string;
                            };
                        };
                    };
                };
            };
        };
    };
} & {
    marketing: {
        admin: {
            "monthly-summary": {
                send: {
                    post: {
                        body: {
                            month?: string | undefined;
                            limit?: number | undefined;
                        };
                        params: {};
                        query: {};
                        headers: {};
                        response: {
                            401: "Unauthorized";
                            200: {};
                            403: {
                                code: string;
                                message: string;
                            };
                            422: {
                                type: "validation";
                                on: string;
                                summary?: string;
                                message?: string;
                                found?: unknown;
                                property?: string;
                                expected?: string;
                            };
                        };
                    };
                };
            };
        };
    };
} & {
    marketing: {
        internal: {
            "monthly-summary": {
                send: {
                    post: {
                        body: {
                            month?: string | undefined;
                            limit?: number | undefined;
                        };
                        params: {};
                        query: {};
                        headers: {};
                        response: {
                            [x: number]: string;
                        };
                    };
                };
            };
        };
    };
} & {
    marketing: {
        admin: {
            sequences: {
                post: {
                    body: {
                        status?: "active" | "archived" | "draft" | undefined;
                        channel?: string | undefined;
                        autoEnrollNewUsers?: boolean | undefined;
                        name: string;
                    };
                    params: {};
                    query: {};
                    headers: {};
                    response: {
                        401: "Unauthorized";
                        200: {};
                        403: {
                            code: string;
                            message: string;
                        };
                        422: {
                            type: "validation";
                            on: string;
                            summary?: string;
                            message?: string;
                            found?: unknown;
                            property?: string;
                            expected?: string;
                        };
                    };
                };
            };
        };
    };
} & {
    marketing: {
        admin: {
            sequences: {
                ":sequenceId": {
                    steps: {
                        post: {
                            body: {
                                previewText?: string | undefined;
                                from?: string | undefined;
                                replyTo?: string[] | undefined;
                                html?: string | undefined;
                                text?: string | undefined;
                                topicId?: string | null | undefined;
                                templateKey?: string | undefined;
                                subject: string;
                                stepNumber: number;
                                delayDays: number;
                            };
                            params: {
                                sequenceId: string;
                            };
                            query: {};
                            headers: {};
                            response: {
                                401: "Unauthorized";
                                200: {};
                                403: {
                                    code: string;
                                    message: string;
                                };
                                422: {
                                    type: "validation";
                                    on: string;
                                    summary?: string;
                                    message?: string;
                                    found?: unknown;
                                    property?: string;
                                    expected?: string;
                                };
                            };
                        };
                    };
                };
            };
        };
    };
} & {
    marketing: {
        admin: {
            sequences: {
                ":sequenceId": {
                    "enroll-existing": {
                        post: {
                            body: {
                                limit?: number | undefined;
                                asOf?: string | undefined;
                                processImmediately?: boolean | undefined;
                            };
                            params: {
                                sequenceId: string;
                            };
                            query: {};
                            headers: {};
                            response: {
                                401: "Unauthorized";
                                200: {};
                                403: {
                                    code: string;
                                    message: string;
                                };
                                422: {
                                    type: "validation";
                                    on: string;
                                    summary?: string;
                                    message?: string;
                                    found?: unknown;
                                    property?: string;
                                    expected?: string;
                                };
                            };
                        };
                    };
                };
            };
        };
    };
} & {
    marketing: {
        admin: {
            sequences: {
                "process-due": {
                    post: {
                        body: {
                            limit?: number | undefined;
                            asOf?: string | undefined;
                        };
                        params: {};
                        query: {};
                        headers: {};
                        response: {
                            401: "Unauthorized";
                            200: {};
                            403: {
                                code: string;
                                message: string;
                            };
                            422: {
                                type: "validation";
                                on: string;
                                summary?: string;
                                message?: string;
                                found?: unknown;
                                property?: string;
                                expected?: string;
                            };
                        };
                    };
                };
            };
        };
    };
} & {
    marketing: {
        internal: {
            sequences: {
                "process-due": {
                    post: {
                        body: {
                            limit?: number | undefined;
                            asOf?: string | undefined;
                        };
                        params: {};
                        query: {};
                        headers: {};
                        response: {
                            200: {
                                asOf: Date;
                                processed: number;
                                sent: number;
                                completed: number;
                                skipped: number;
                                errors: {
                                    enrollmentId: string;
                                    message: string;
                                }[];
                            };
                            403: "Unauthorized" | "Forbidden";
                            422: {
                                type: "validation";
                                on: string;
                                summary?: string;
                                message?: string;
                                found?: unknown;
                                property?: string;
                                expected?: string;
                            };
                        };
                    };
                };
            };
        };
    };
} & {
    marketing: {
        admin: {
            users: {
                ":userId": {
                    "last-email": {
                        get: {
                            body: {};
                            params: {
                                userId: string;
                            };
                            query: {};
                            headers: {};
                            response: {
                                401: "Unauthorized";
                                200: {};
                                403: {
                                    code: string;
                                    message: string;
                                };
                                422: {
                                    type: "validation";
                                    on: string;
                                    summary?: string;
                                    message?: string;
                                    found?: unknown;
                                    property?: string;
                                    expected?: string;
                                };
                            };
                        };
                    };
                };
            };
        };
    };
} & {
    marketing: {
        webhooks: {
            resend: {
                post: {
                    body: {
                        [x: string]: any;
                    };
                    params: {};
                    query: {};
                    headers: {};
                    response: {
                        [x: number]: string;
                    };
                };
            };
        };
    };
} & {
    my: {};
} & {
    my: {
        activities: {
            get: {
                body: {};
                params: {};
                query: {
                    l?: number | undefined;
                    cursor?: string | undefined;
                    sort?: "date" | "amount" | undefined;
                    direction?: "asc" | "desc" | undefined;
                    categoryId?: string | undefined;
                    recurring?: boolean | undefined;
                };
                headers: {};
                response: {
                    401: "Unauthorized";
                    200: {
                        items: {
                            entity: import("./lib/activities").ACTIVITY_ENTITY.expense;
                            location: {
                                id: string;
                                label: string;
                                latitude: number;
                                longitude: number;
                            } | null;
                            paidByUser: {
                                id: string;
                                name: string;
                                image: string | null;
                                username: string | null;
                            };
                            share: {
                                id: string;
                                expenseId: string;
                                userId: string;
                                amount: string;
                                createdAt: Date;
                                updatedAt: Date;
                                deletedAt: Date | null;
                            } | null;
                            currency: {
                                id: string;
                                name: string;
                                code: string;
                                symbol: string | null;
                                exchangeRateToBase: string;
                                updatedAt: Date;
                                decimals: number;
                                type: "fiat" | "crypto";
                            };
                            category: {
                                id: string;
                                key: string | null;
                                name: string;
                                icon: string | null;
                                order: number | null;
                                createdAt: Date;
                            } | null;
                            recurrence: {
                                location: {
                                    id: string;
                                    label: string;
                                    latitude: number;
                                    longitude: number;
                                } | null;
                                id: string;
                                paidById: string;
                                creatorId: string;
                                groupId: string | null;
                                title: string;
                                description: string | null;
                                amount: string;
                                currencyId: string;
                                frequency: "daily" | "weekly" | "monthly" | "yearly";
                                interval: number;
                                startDate: Date;
                                endDate: Date | null;
                                timezone: string;
                                lastGenerated: Date | null;
                                active: boolean;
                                splitType: "custom" | "equal" | "percentage" | "shares";
                                createdAt: Date;
                                updatedAt: Date;
                                deletedAt: Date | null;
                                latitude: number | null;
                                longitude: number | null;
                                locationId: string | null;
                                categoryId: string | null;
                            } | null;
                            id: string;
                            title: string;
                            description: string | null;
                            amount: string;
                            currencyId: string;
                            exchangeRateToBase: string;
                            exchangeRateSnapshotId: string | null;
                            paidById: string;
                            groupId: string | null;
                            friendshipId: string | null;
                            date: Date;
                            timezone: string;
                            createdAt: Date;
                            updatedAt: Date;
                            createdById: string;
                            deletedAt: Date | null;
                            splitType: "custom" | "equal" | "percentage" | "shares";
                            recurringExpenseRuleId: string | null;
                            image: string | null;
                            latitude: number | null;
                            longitude: number | null;
                            locationId: string | null;
                            categoryId: string | null;
                            importId: string | null;
                            importSourceRow: number | null;
                        }[];
                        nextCursor: string | null;
                        hasMore: boolean;
                    };
                    400: string;
                    403: {
                        code: string;
                        message: string;
                    };
                    422: {
                        type: "validation";
                        on: string;
                        summary?: string;
                        message?: string;
                        found?: unknown;
                        property?: string;
                        expected?: string;
                    };
                };
            };
        };
    };
} & {
    my: {
        balance: {
            get: {
                body: {};
                params: {};
                query: {
                    period?: "lifetime" | "daily" | "monthly" | "yearly" | undefined;
                    timezone?: string | undefined;
                };
                headers: {};
                response: {
                    401: "Unauthorized";
                    200: {
                        balance: number;
                        currency: {
                            id: string;
                            name: string;
                            code: string;
                            symbol: string | null;
                            exchangeRateToBase: string;
                            updatedAt: Date;
                            decimals: number;
                            type: "fiat" | "crypto";
                        };
                    };
                    400: string;
                    403: {
                        code: string;
                        message: string;
                    };
                    422: {
                        type: "validation";
                        on: string;
                        summary?: string;
                        message?: string;
                        found?: unknown;
                        property?: string;
                        expected?: string;
                    };
                };
            };
        };
    };
} & {
    notifications: {};
} & {
    notifications: {
        ":pushToken": {
            settings: {
                get: {
                    body: {};
                    params: {
                        pushToken: string;
                    };
                    query: {};
                    headers: {};
                    response: {
                        401: "Unauthorized";
                        200: {
                            pushToken: string;
                            enabled: boolean;
                        };
                        403: "Unauthorized" | {
                            code: string;
                            message: string;
                        };
                        404: "Notification not found";
                        422: {
                            type: "validation";
                            on: string;
                            summary?: string;
                            message?: string;
                            found?: unknown;
                            property?: string;
                            expected?: string;
                        };
                    };
                };
            };
        };
    };
} & {
    notifications: {
        token: {
            post: {
                body: {
                    enabled: boolean;
                    pushToken: string;
                };
                params: {};
                query: {};
                headers: {};
                response: {
                    401: "Unauthorized";
                    200: "OK";
                    403: "Unauthorized" | {
                        code: string;
                        message: string;
                    };
                    409: "Notification token state changed, please retry";
                    422: {
                        type: "validation";
                        on: string;
                        summary?: string;
                        message?: string;
                        found?: unknown;
                        property?: string;
                        expected?: string;
                    };
                };
            };
        };
    };
} & {
    notifications: {
        ":pushToken": {
            settings: {
                put: {
                    body: {
                        enabled: boolean;
                    };
                    params: {
                        pushToken: string;
                    };
                    query: {};
                    headers: {};
                    response: {
                        401: "Unauthorized";
                        200: {
                            id: string;
                            userId: string;
                            pushToken: string;
                            enabled: boolean;
                            createdAt: Date;
                            updatedAt: Date;
                        };
                        403: "Unauthorized" | {
                            code: string;
                            message: string;
                        };
                        404: "Notification not found";
                        422: {
                            type: "validation";
                            on: string;
                            summary?: string;
                            message?: string;
                            found?: unknown;
                            property?: string;
                            expected?: string;
                        };
                    };
                };
            };
        };
    };
} & {
    notifications: {
        "check-receipts": {
            post: {
                body: {};
                params: {};
                query: {};
                headers: {};
                response: {
                    403: "Unauthorized" | "Forbidden";
                };
            };
        };
    };
} & {
    categories: {};
} & {
    categories: {
        get: {
            body: {};
            params: {};
            query: {};
            headers: {};
            response: {
                401: "Unauthorized";
                200: {
                    id: string;
                    name: string;
                    createdAt: Date;
                    icon: string | null;
                    key: string | null;
                    order: number | null;
                }[];
                403: {
                    code: string;
                    message: string;
                };
            };
        };
    };
} & {
    updates: {
        get: {
            body: unknown;
            params: {};
            query: unknown;
            headers: unknown;
            response: {
                200: {
                    ios: string | null;
                    android: string | null;
                };
            };
        };
    };
} & {
    "robots.txt": {
        get: {
            body: {};
            params: {};
            query: {};
            headers: {};
            response: {
                200: string;
            };
        };
    };
} & {
    get: {
        body: {};
        params: {};
        query: {};
        headers: {};
        response: {
            200: string;
        };
    };
}, {
    derive: {};
    resolve: {};
    schema: {};
    standaloneSchema: {};
    response: {};
}, {
    derive: {};
    resolve: {};
    schema: {};
    standaloneSchema: {};
    response: {};
} & {
    derive: {};
    resolve: {};
    schema: {};
    standaloneSchema: {};
    response: {};
} & {
    derive: {};
    resolve: {};
    schema: {};
    standaloneSchema: {};
    response: {};
} & {
    derive: {};
    resolve: {};
    schema: {};
    standaloneSchema: {};
    response: {};
}>;
export type App = typeof appType;
