import * as net from "net";

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
}
// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log("Logs from your program will appear here!");

const HTTPV = "HTTP/1.1";
const CRLF = "\r\n";

// Uncomment this to pass the first stage
// const server = net.createServer((socket) => {
//   socket.on("data", (data) => {
//     const request = data.toString();

//     if (getPath(request) !== "/") {
//       return socket.write(HTTPV + " " + HTTP_STATUS.NOTFOUND + CRLF + CRLF);
//     }
//     socket.write(HTTPV + " " + HTTP_STATUS.OK + CRLF + CRLF);

//     socket.on("close", () => {
//       socket.end();
//     });
//   });
//   socket.on("close", () => {
//     socket.end();
//   });
// });

class Server {
  private _port: number;
  private _hostname: string;
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
  };

  constructor(port: number, hostname: string) {
    this._instance = net.createServer((socket) => {
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
    });
    this._port = port;
    this._hostname = hostname;
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

        return `${this._httpVersion} ${HTTP_STATUS.NOTFOUND}${CRLF}${CRLF}`;
      }

      default:
        return `${this._httpVersion} ${HTTP_STATUS.FORBIDDEN}${CRLF}${CRLF}`;
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

  public set endPoint(endPoints: { [key: string]: string }[]) {
    this._endPoints = {
      ...this._endPoints,
      ...endPoints,
    };
  }

  public listen() {
    this._instance.listen(this._port, this._hostname);
    return this._instance;
  }
}

const server = new Server(4221, "localhost");

server.listen();

// server.listen(4221, "localhost");
