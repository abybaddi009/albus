import { request } from "http";
import { RequestOptions } from "https";

interface StreamBody {
  prompt: string;
  temperature: number;
  repeat_penalty: number;
  seed: number;
  stop: Array<string>;
  stream: boolean;
  max_tokens: number;
}

export async function streamResponse(
  options: RequestOptions,
  body: StreamBody,
  cb: (chunk: string, resolve: () => void) => void,
) {
  const req = request(options, (res) => {
    res.on("data", (chunk: string) => {
      cb(chunk.toString(), () => {
        res.destroy();
      });
    });
  });

  req.on("error", (error) => {
    console.error(`Request error: ${error.message}`);
  });

  req.write(JSON.stringify(body));
  req.end();
}
