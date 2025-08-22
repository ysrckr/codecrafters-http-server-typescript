export enum HTTP_STATUS {
  OK = "200 OK",
  CREATED = "201 Created",
  NOTFOUND = "404 Not Found",
  FORBIDDEN = "403 Forbidden",
  ERROR = "500 Server Error",
}

export enum HTTP_METHOD {
  GET = "get",
  POST = "post",
  PUT = "put",
  PATCH = "patch",
  DELETE = "delete",
  OPTION = "option",
}

export enum CONTENT_TYPE {
  PLAIN_TEXT = "text/plain",
  OCTATE_STREAM = "application/octet-stream",
}
