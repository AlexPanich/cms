import { DomainError } from "@/server/errors";

export type MediaErrorCode =
  "invalid_file" | "unsupported_image" | "unsupported_document" | "media_not_found";

export class MediaError extends DomainError<MediaErrorCode> {}
