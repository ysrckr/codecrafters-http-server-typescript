import * as net from "net";

import fs from "fs";
import path from "path";

enum HTTP_STATUS {
  OK = "200 OK",
  NOTFOUND = "404 Not Found",
  FORBIDDEN = "403 Forbidden",
  ERROR = "500 Server Error",
}

enum HTTP_METHOD {
  GET = "get",
  POST = "post",
  PUT = "put",
  PATCH = "patch",
  DELETE = "delete",
  OPTION = "option",
}

enum CONTENT_TYPE {
  PLAIN_TEXT = "text/plain",
  OCTATE_STREAM = "application/octet-stream",
}

enum HEADERS_TYPE {
  CONTENT_TYPE = "content-type",
}

const CRLF = "\r\n";

class Request {
  public headers: { [key: HEADERS_TYPE | string]: string } = {};
  private _body: string = "";
  private _version: string = "HTTP/1.1";
  private _data: string = "";
  private _method: HTTP_METHOD | null = null;
  private _path: string = "/";
  private _params: { [key: string]: string } = {};

  constructor() {}

  private extractPath() {
    if (!this._data) return;
    this._path = this._data.split(CRLF)[0].split(" ")[1];
  }

  private extractMethod() {
    if (!this._data) return;
    this._method = this._data
      .split(CRLF)[0]
      .split(" ")[0]
      .toLowerCase() as HTTP_METHOD;
  }

  private extractHeaders() {
    if (!this._data) return;
    const headers = this._data
      .split(CRLF)
      .slice(2)
      .filter((header) => Boolean(header));
    headers.forEach((header) => {
      const headerKey = header.split(":")[0].trim();
      const headerValue = header.split(":")[1].trim();

      this.headers[headerKey] = headerValue;
    });
  }

  private extractParams() {
    if (!this._path) return;
    const pathParts = this._path.split("/").slice(1); // Remove leading slash

    for (let i = 1; i < pathParts.length; i += 2) {
      if (pathParts[i]) {
        this._params[pathParts[i - 1]] = pathParts[i];
      }
    }
  }

  private extractHttpVersion() {
    if (!this._data) return;
    this._version = this._data.split(CRLF)[0].split(" ")[2];
  }

  public get httpVersion() {
    return this._version;
  }

  public get method() {
    return this._method;
  }

  public get path() {
    return this._path;
  }

  public get params() {
    return this._params;
  }

  public init(data: Buffer<ArrayBufferLike>) {
    this._data = data.toString();
    this.extractHttpVersion();
    this.extractHeaders();
    this.extractMethod();
    this.extractPath();
    this.extractParams();
  }
}

class Response {
  private _headers: { [key: HEADERS_TYPE | string]: string } = {};
  private _body: string | Buffer = "";
  private _value: string = "";
  private _version: string = "HTTP/1.1";
  private _path: string = "";

  constructor(httpVersion: string) {
    this._version = httpVersion;
  }

  private writeableHeaders() {
    if (Object.keys(this._headers).length === 0) return "";
    let headers = "";
    for (const [key, value] of Object.entries(this._headers)) {
      headers += `${key}: ${value}${CRLF}`;
    }
    return headers;
  }

  public send(
    status: HTTP_STATUS,
    options?: {
      headers?: { [key: HEADERS_TYPE | string]: string };
      body?: string | Buffer;
    },
  ) {
    if (!options) {
      this.value = `${this._version} ${status}${CRLF}${CRLF}`;
      return;
    }

    if (options?.headers && Object.keys(options.headers).length > 0) {
      this._headers = options.headers;
    }

    if (options.body && options.body.length > 0) {
      this._body = options.body;
    }

    const headers = this.writeableHeaders();

    const body = options.body ? options.body : "";

    this.value = `${this._version} ${status}${CRLF}${headers}${CRLF}${body}`;
  }

  public forbidden() {
    this._value = `${this._version} ${HTTP_STATUS.FORBIDDEN}${CRLF}${CRLF}`;
  }

  public notFound() {
    this._value = `${this._version} ${HTTP_STATUS.NOTFOUND}${CRLF}${CRLF}`;
  }

  public get value() {
    return this._value;
  }
  public set value(value: string) {
    this._value = value;
  }

  public get path() {
    return this._path;
  }
}

class Server {
  private _port: number = 4221;
  private _hostname: string = "localhost";
  private _instance: net.Server;
  private _routes: {
    method: HTTP_METHOD;
    path: string;
    handler: (request: Request, response: Response) => void;
    params?: string[];
  }[] = [];
  private _request: Request;
  private _response: Response;

  constructor() {
    this._instance = net.createServer((socket) =>
      this.connectionListener(socket),
    );

    this._request = new Request();
    this._response = new Response(this._request.httpVersion);
  }

  private connectionListener(socket: net.Socket) {
    socket.on("data", (data) => {
      this._request.init(data);
      this.handle();
      socket.write(this._response.value, () => {
        socket.end();
      });
    });
    socket.on("error", () => {
      socket.write("Something went wrong", () => {
        socket.end();
      });
    });
    socket.on("close", () => {
      socket.end();
    });
  }

  private handle() {
    const route = this._routes.find(
      (r) =>
        (r.path === this._request.path && r.method === this._request.method) ||
        (r.params &&
          r.params.length > 0 &&
          r.method === this._request.method &&
          this._request.path.startsWith(r.path)),
    );

    if (route) {
      route.handler(this._request, this._response);
    } else {
      this._response.notFound();
    }
  }

  private extractParams(path: string) {
    const params: string[] = [];
    const pathParts = path.split("/");

    for (let i = 0; i < pathParts.length; i++) {
      if (pathParts[i].startsWith(":")) {
        params.push(pathParts[i].slice(1));
      }
    }

    return params;
  }

  public listen(port: number, hostname: string) {
    this._port = port;
    this._hostname = hostname;
    this._instance.listen(this._port, this._hostname);
    return this._instance;
  }

  public get(
    path: string,
    handler: (request: Request, response: Response) => void,
  ) {
    const hasParams = path.includes(":");
    const params = hasParams ? this.extractParams(path) : undefined;
    const method = HTTP_METHOD.GET;
    const cleanedPath = hasParams ? path.replace(/:\w+/g, "") : path;
    const normalizedPath =
      cleanedPath?.length > 1 && cleanedPath.endsWith("/")
        ? cleanedPath.slice(0, -1)
        : cleanedPath;

    this._routes.push({ method, path: normalizedPath, params, handler });
    return this;
  }

  public post(
    path: string,
    handler: (request: Request, response: Response) => void,
  ) {
    const hasParams = path.includes(":");
    const params = hasParams ? this.extractParams(path) : undefined;
    const method = HTTP_METHOD.POST;
    const cleanedPath = hasParams ? path.replace(/:\w+/g, "") : path;
    const normalizedPath =
      cleanedPath?.length > 1 && cleanedPath.endsWith("/")
        ? cleanedPath.slice(0, -1)
        : cleanedPath;

    this._routes.push({ method, path: normalizedPath, params, handler });
    return this;
  }
}

const server = new Server();

function rootHandler(req: Request, res: Response) {
  res.send(HTTP_STATUS.OK);
}

function echoHandler(req: Request, res: Response) {
  const message = req.params.echo;
  res.send(HTTP_STATUS.OK, {
    headers: {
      "Content-Type": CONTENT_TYPE.PLAIN_TEXT,
      "Content-Length": message.length.toString(),
    },
    body: message,
  });
}

function userAgentHandler(req: Request, res: Response) {
  const userAgent = req.headers["User-Agent"];
  res.send(HTTP_STATUS.OK, {
    headers: {
      "Content-Type": CONTENT_TYPE.PLAIN_TEXT,
      "Content-Length": userAgent.length.toString(),
    },
    body: userAgent,
  });
}

function fileHandler(req: Request, res: Response) {
  const filename = req.params.files;
  const filePath = path.resolve(
    "/tmp/data/codecrafters.io/http-server-tester/",
    filename,
  );
  const isFileExists = checkIfFileExists(filePath);
  if (!isFileExists) {
    return res.send(HTTP_STATUS.NOTFOUND);
  }
  const content = fileContent(filePath);

  res.send(HTTP_STATUS.OK, {
    headers: {
      "Content-Type": CONTENT_TYPE.OCTATE_STREAM,
      "Content-Length": content.length.toString(),
    },
    body: content,
  });
}

server.get("/", rootHandler);
server.get("/echo/:message", echoHandler);
server.get("/user-agent", userAgentHandler);
server.get("/files/:filename", fileHandler);

server.listen(4221, "localhost");

function checkIfFileExists(path: string) {
  const isFileExists = fs.existsSync(path);
  return isFileExists;
}

function fileContent(path: string) {
  const fileContent = fs.readFileSync(path);
  return Buffer.from(fileContent);
}
