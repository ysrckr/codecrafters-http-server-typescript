import * as net from "net";

import { HTTP_METHOD } from "./enums";
import { Request } from "./request.class";
import { Response } from "./response.class";

export class Server {
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

      socket.write(this._response.value);
      socket.write(this._response.body, () => {
        if (this._request.headers["Connection"] === "close") {
          socket.end();
        }
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
    const route = this._routes.find((r) => {
      return (
        (r.path === this._request.path && r.method === this._request.method) ||
        (r.params &&
          r.params.length > 0 &&
          r.method === this._request.method &&
          this._request.path.startsWith(r.path))
      );
    });

    if (route) {
      this._response.headers = {};
      if (this._request.headers["Connection"] === "close") {
        this._response.headers = { Connection: "close" };
      }
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
