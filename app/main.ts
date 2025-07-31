import * as net from "net";

enum HTTP_STATUS {
  OK = "200 OK",
  NOTFOUND = "404 Not Found"
}
// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log("Logs from your program will appear here!");

const HTTPV = "HTTP/1.1"
const CRLF = "\r\n"

const getRequestType = (request: string) => {
  return request.split(CRLF)[0].split(" ")[0]
}

const getPath = (request: string) => {
  return request.split(CRLF)[0].split(" ")[1]
}

const getHTTPV = (request: string) => {
  return request.split(CRLF)[0].split(" ")[2]
}

const getHeaders = (request: string) => {
  return request.split(CRLF).slice(1).filter((el) => el.length !== 0).map((el) => {
    const keyVal = el.split(": ")
    return {
      [keyVal[0]]: keyVal[1]
    }
  })
}

// Uncomment this to pass the first stage
const server = net.createServer((socket) => {

  socket.on("data", (data) => {
    const request = data.toString();

    if (getPath(request) !== "/") {
      return socket.write(HTTPV + " " + HTTP_STATUS.NOTFOUND + CRLF + CRLF)
    }
    socket.write(HTTPV + " " + HTTP_STATUS.OK + CRLF + CRLF)
    
    socket.on("close", () => {
    socket.end();
    });

  
  })
    socket.on("close", () => {
    socket.end();
  });
  
});

server.listen(4221, "localhost");
