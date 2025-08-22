import { CRLF } from "./constants";
import { HTTP_METHOD } from "./enums";

export class Request {
  public headers: { [key: string]: string } = {};
  public body: string | null = "";
  private _version: string = "HTTP/1.1";
  private _data: string = "";
  private _method: HTTP_METHOD | null = null;
  private _path: string = "/";
  private _params: { [key: string]: string } = {};

  constructor() {}

  public get httpVersion() {
    return this._version;
  }

  public get method() {
    return this._method;
  }

  public get path() {
    return this._path;
  }

  public set path(path: string) {
    this._path = path;
  }

  public get params() {
    return this._params;
  }

  public init(data: Buffer<ArrayBufferLike>) {
    if (!data) return;
    const requestData = data.toString();
    this._data = requestData;
    const version = requestData.split(CRLF)[0].split(" ")[2] || "HTTP/1.1";
    const method = requestData
      .split(CRLF)[0]
      .split(" ")[0]
      ?.toLowerCase() as HTTP_METHOD;
    const headers = requestData.split(CRLF).slice(1, -2);
    const path = requestData.split(CRLF)[0].split(" ")[1];
    this._version = version || "HTTP/1.1";
    this._method = method || HTTP_METHOD.GET;
    this.path = path;
    this.headers = {};
    headers.forEach((header) => {
      const [key, value] = header.split(": ");
      this.headers[key] = value;
    });
    const pathParts = this.path.split("/").slice(1);

    for (let i = 1; i < pathParts.length; i += 2) {
      if (pathParts[i]) {
        this._params[pathParts[i - 1]] = pathParts[i];
      }
    }

    if (this.method === HTTP_METHOD.POST) {
      console.log("Handling POST request");
      const data = requestData.split(CRLF);
      if (data.length === 0) return;
      const body = data[data.length - 1];
      this.body = body;
    }
  }
}
