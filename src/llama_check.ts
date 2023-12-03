import { request } from "http";

export async function checkCompletions(host: string, port: number) {
  return new Promise((resolve, reject) => {
    const requestOptions = {
      hostname: host,
      port: port,
      path: "/openapi.json",
      method: "GET",
    };

    const req = request(requestOptions, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        try {
          const openApiJson = JSON.parse(data);

          if (
            openApiJson &&
            openApiJson.paths &&
            openApiJson.paths["/v1/completions"]
          ) {
            resolve(true);
          } else {
            resolve(false);
          }
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    req.end();
  });
}
