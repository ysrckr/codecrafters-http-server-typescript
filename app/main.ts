import * as net from "net";

import fs from "fs";
import path from "path";

enum HTTP_STATUS {
  OK = "200 OK",
  NOTFOUND = "404 Not Found",
  FORBIDDEN = "403 Forbidden",
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
// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log("Logs from your program will appear here!");

const HTTPV = "HTTP/1.1";
const CRLF = "\r\n";

class Server {
  private _port: number = 3000;
  private _hostname: string = "localhost";
  private _instance: net.Server;
  private _request = "";
  private _method: HTTP_METHOD = HTTP_METHOD.GET;
  private _path = "";
  private _httpVersion = HTTPV;
  private _headers: { [key: string]: string }[] = [];
  private _endPoints = {
    root: "/",
    echo: "/echo",
    userAgent: "/user-agent",
    file: "/files",
  };

  constructor() {
    this._instance = net.createServer((socket) =>
      this.connectionListener(socket),
    );
  }

  private connectionListener(socket: net.Socket) {
    socket.on("data", (data) => {
      this._request = data.toString();

      this.extractPath();
      this.extractHttpVersion();
      this.extractHeaders();
      this.extractMethod();

      socket.write(this.response, () => {
        socket.end();
      });
    });
    socket.on("close", () => {
      socket.end();
    });
  }

  private extractMethod() {
    if (!this._request) return;
    this._method = this._request
      .split(CRLF)[0]
      .split(" ")[0]
      .toLowerCase() as HTTP_METHOD;
  }

  private extractPath() {
    if (!this._request) return;
    this._path = this._request.split(CRLF)[0].split(" ")[1];
  }

  private extractHttpVersion() {
    if (!this._request) return;
    this._request.split(CRLF)[0].split(" ")[2];
  }

  private extractHeaders() {
    if (!this._request) return;
    this._headers = this._request
      .split(CRLF)
      .slice(1)
      .filter((el) => el.length !== 0)
      .map((el) => {
        const keyVal = el.split(": ");
        return {
          [keyVal[0]]: keyVal[1],
        };
      });
  }

  private get response() {
    switch (this._method) {
      case HTTP_METHOD.GET: {
        if (this.isRootPath) {
          return `${this._httpVersion} ${HTTP_STATUS.OK}${CRLF}${CRLF}`;
        }

        if (this.isEchoPath) {
          const content = this._path
            .replace("/echo", "")
            .split("/")
            .join("")
            .trim();
          const contentSize = content.length;
          return `${this._httpVersion} ${HTTP_STATUS.OK}${CRLF}Content-Type: ${CONTENT_TYPE.PLAIN_TEXT}${CRLF}Content-Length: ${contentSize}${CRLF}${CRLF}${content}`;
        }

        if (this.isUserAgentPath) {
          const content =
            this._headers.find((header) => header["User-Agent"])?.[
              "User-Agent"
            ] || "";
          console.log(content);
          const contentSize = content.length;
          return `${this._httpVersion} ${HTTP_STATUS.OK}${CRLF}Content-Type: ${CONTENT_TYPE.PLAIN_TEXT}${CRLF}Content-Length: ${contentSize}${CRLF}${CRLF}${content}`;
        }
        const filename = this.fileNameFromRequest || "";
        const filePath = path.resolve(
          "/tmp/data/codecrafters.io/http-server-tester/",
          filename,
        );

        if (this.isFilePath(filePath)) {
          if (!filename) {
            return `${this._httpVersion} ${HTTP_STATUS.NOTFOUND}${CRLF}${CRLF}`;
          }

          if (!this.checkIfFileExists(filePath)) {
            return `${this._httpVersion} ${HTTP_STATUS.NOTFOUND}${CRLF}${CRLF}`;
          }

          const fileSize = this.fileSize(filePath);
          const fileContent = this.fileContent(filePath);

          console.log(fileContent);

          return `${this._httpVersion} ${HTTP_STATUS.OK}${CRLF}Content-Type: ${CONTENT_TYPE.OCTATE_STREAM}${CRLF}Content-Length: ${fileSize}${CRLF}${CRLF}${fileContent}`;
        }
        return `${this._httpVersion} ${HTTP_STATUS.NOTFOUND}${CRLF}${CRLF}`;
      }

      default:
        return `${this._httpVersion} ${HTTP_STATUS.FORBIDDEN}${CRLF}${CRLF}`;
    }
  }

  private checkIfFileExists(path: string) {
    const isFileExists = fs.existsSync(path);
    return isFileExists;
  }

  private fileContent(path: string) {
    const fileContent = fs.readFileSync(path);
    return Buffer.from(fileContent);
  }

  private fileSize(path: string) {
    try {
      const file = Bun.file(path);

      const fileSize = file.size;
      return fileSize;
    } catch (error) {
      console.error(error);
      return 0;
    }
  }

  private get isRootPath() {
    if (!this._path) return;
    return this._path === this._endPoints.root;
  }

  private get isEchoPath() {
    if (!this._path) return;
    return this._path.startsWith(this._endPoints.echo);
  }

  private get isUserAgentPath() {
    if (!this._path) return;
    return this._path.startsWith(this._endPoints.userAgent);
  }

  private isFilePath(path: string) {
    if (!this._path) return;
    const isFileExists = this.checkIfFileExists(path);

    return this._path.startsWith(this._endPoints.file) && isFileExists;
  }

  private get fileNameFromRequest() {
    if (!this.isFilePath) return null;
    return this._path
      .replace(this._endPoints.file, "")
      .split("/")
      .join("")
      .trim();
  }

  public set endPoint(endPoints: { [key: string]: string }[]) {
    this._endPoints = {
      ...this._endPoints,
      ...endPoints,
    };
  }

  public listen(port: number, hostname: string) {
    this._port = port;
    this._hostname = hostname;
    this._instance.listen(this._port, this._hostname);
    return this._instance;
  }
}

const server = new Server();

server.listen(4221, "localhost");
