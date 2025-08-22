import { CONTENT_TYPE, HTTP_STATUS } from "./enums";
import { checkIfFileExists, compress, createFile, fileContent } from "./utils";

import { Request } from "./request.class";
import { Response } from "./response.class";
import path from "path";

export function rootHandler(req: Request, res: Response) {
  res.send(HTTP_STATUS.OK);
}

export function echoHandler(req: Request, res: Response) {
  const message = req.params.echo;
  const encodings = ["br", "gzip", "deflate", "zstd"];
  let acceptEncoding = req.headers?.["Accept-Encoding"]
    ?.split(",")
    .map((encoding) => encoding?.trim());
  acceptEncoding = acceptEncoding?.filter((encoding) =>
    encodings.includes(encoding),
  );

  let contentEncoding: { [key: string]: string } = {
    "Content-Encoding": "",
  };
  let body: {
    data: string | Buffer;
    compression: string | null;
  } = {
    data: message,
    compression: null,
  };

  let headers: { [key: string]: string } = {
    "Content-Type": CONTENT_TYPE.PLAIN_TEXT,
  };
  if (acceptEncoding?.length > 0) {
    const result = compress(acceptEncoding[0], body.data as string);
    body = { data: result.data, compression: result.compression };
    contentEncoding["Content-Encoding"] = result.compression || "";
  }

  if (acceptEncoding?.length > 0 && body.compression) {
    headers = { ...headers, ...contentEncoding };
  }

  const contentLength = body.data.length.toString();

  if (contentLength) {
    headers["Content-Length"] = contentLength;
  }

  res.send(HTTP_STATUS.OK, {
    headers,
    body: body.data,
  });
}

export function userAgentHandler(req: Request, res: Response) {
  const userAgent = req.headers["User-Agent"];

  res.send(HTTP_STATUS.OK, {
    headers: {
      "Content-Type": CONTENT_TYPE.PLAIN_TEXT,
      "Content-Length": userAgent.length.toString(),
    },
    body: userAgent,
  });
}

export function fileHandler(req: Request, res: Response) {
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

export function filePostHandler(req: Request, res: Response) {
  const filename = req.params.files;
  const filePath = path.resolve(
    "/tmp/data/codecrafters.io/http-server-tester/",
    filename,
  );

  const body = req.body;

  createFile(filePath, body!);

  res.send(HTTP_STATUS.CREATED);
}
