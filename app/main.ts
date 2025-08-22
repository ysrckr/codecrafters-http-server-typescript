import { CONTENT_TYPE, HTTP_STATUS } from "./enums";
import {
  echoHandler,
  fileHandler,
  filePostHandler,
  rootHandler,
  userAgentHandler,
} from "./handlers";

import { Server } from "./server.class";

const server = new Server();

server.get("/", rootHandler);
server.get("/echo/:message", echoHandler);
server.get("/user-agent", userAgentHandler);
server.get("/files/:filename", fileHandler);
server.post("/files/:filename", filePostHandler);

server.listen(4221, "localhost");
