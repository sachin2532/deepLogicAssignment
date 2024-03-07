const http = require("http");
const https = require("https");

const PORT = 8000;

http
  .createServer((request, response) => {
    if (request.method === "GET" && request.url === "/getTimeStories") {
      // Function to fetch HTML content from Time.com
      const getHtmlContent = () => {
        return new Promise((resolve, reject) => {
          https
            .get("https://time.com", (res) => {
              let data = "";
              res.on("data", (chunk) => {
                data += chunk;
              });
              res.on("end", () => {
                resolve(data);
              });
            })
            .on("error", (e) => {
              reject(e);
            });
        });
      };

      // Function to parse HTML and extract latest stories
      const latestStories = (html) => {
        const storyRegex = /<li class="latest-stories__item">([\s\S]*?)<\/li>/g;
        const stories = [];
        let match;
        while ((match = storyRegex.exec(html)) !== null) {
          const item = match[1];

          const titleMatch = item.match(
            /<h3 class="latest-stories__item-headline">([^<]+)<\/h3>/
          );
          const title = titleMatch ? titleMatch[1].trim() : null;

          const linkMatch = item.match(/<a href="([^"]+)"/);
          const link = linkMatch ? `https://time.com${linkMatch[1]}` : null;

          if (title && link) {
            stories.push({ title, link });
          }
        }
        return stories;
      };

      // Fetch and parse the content
      getHtmlContent()
        .then((html) => {
          const newStories = latestStories(html);
          response.writeHead(200, { "Content-Type": "application/json" });
          response.end(JSON.stringify(newStories));
        })
        .catch((error) => {
          response.writeHead(500);
          response.end("Error fetching data from time.com");
          console.error(error);
        });
    } else {
      // Not Found
      response.writeHead(404);
      response.end("Not Found");
    }
  })
  .listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
