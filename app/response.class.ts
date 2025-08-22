import { CRLF } from "./constants";
import { HTTP_STATUS } from "./enums";

export class Response {
  private _headers: { [key: string]: string } = {};
  public body: string | Buffer = "";
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
      headers?: { [key: string]: string };
      body?: string | Buffer;
    },
  ) {
    let headers = this.writeableHeaders();

    if (!options) {
      this.value = `${this._version} ${status}${CRLF}${headers}${CRLF}`;
      return;
    }

    if (options?.headers && Object.keys(options.headers).length > 0) {
      this.headers = { ...this._headers, ...options.headers };

      headers = this.writeableHeaders();
    }

    if (options.body && options.body.length > 0) {
      this.body = options.body;
    }

    const body = options.body ? options.body : "";

    this.value = `${this._version} ${status}${CRLF}${headers}${CRLF}`;
    this.body = body;
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

  public set headers(headers: { [key: string]: string }) {
    this._headers = { ...this.headers, ...headers };
  }
}
