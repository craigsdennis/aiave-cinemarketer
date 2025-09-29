import { Agent, callable } from "agents";
import { z } from "zod";

const TrendsSchema = z.array(
  z.string().meta({ description: "The synopsis of the film" })
);

const ActorsSchema = z.array(z.string().meta({ description: "Actor's name" }));

export type ReporterState = {
  popularMoviesMarkdown?: string;
  trends?: string[];
  actors?: string[];
};

export class ReporterAgent extends Agent<Env, ReporterState> {
  initialState = {
    trends: [],
    actors: [],
  };

  // TODO: Schedule this!

  @callable()
  async gatherTrends() {
    const summary = await this.retrievePopularMovies();
    console.log({summary});
    const trends = await this.extractTrends(summary);
    const actors = await this.extractActors(summary);
    this.setState({
      ...this.state,
      actors,
      trends,
    });
  }

  async retrievePopularMovies() {
    const url = "https://editorial.rottentomatoes.com/guide/popular-movies/";
    const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${this.env.CLOUDFLARE_ACCOUNT_ID}/browser-rendering/markdown`, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.env.CLOUDFLARE_API_TOKEN}`
      },
      method: "POST",
      body: JSON.stringify({url})
    });
    const json = await response.json<{result: string}>();
    this.setState({
      ...this.state,
      popularMoviesMarkdown: json.result,
    });
    return json.result;
  }

  async extractTrends(summary: string) {
    const { response } = await this.env.AI.run(
      "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
      {
        messages: [
          {
            role: "system",
            content: `Your job is to find the current trends in movies.
                    The user is going to provide you with a markdown summary of current movies and your job is to identify current trends happening in the popular movies by examining the Synopsis of each movie.
                    `,
          },
          {
            role: "user",
            content: summary,
          },
        ],
        max_tokens: 5000,
        response_format: {
          type: "json_schema",
          json_schema: z.toJSONSchema(TrendsSchema),
        },
      }
    );
    console.log({ response });
    return response;
  }

  async extractActors(summary: string) {
    const { response } = await this.env.AI.run(
      "@cf/meta/llama-4-scout-17b-16e-instruct",
      {
        messages: [
          {
            role: "system",
            content: `Your job is to extract actors from a summary of current movies.`,
          },
          {
            role: "user",
            content: summary,
          },
        ],
        max_tokens: 10000,
        response_format: {
          type: "json_schema",
          json_schema: z.toJSONSchema(ActorsSchema),
        },
      }
    );
    console.log({ response });
    const actors: string[] = response;
    actors.sort((a, b) => {
      const lastA = a.split(" ").slice(-1)[0];
      const lastB = b.split(" ").slice(-1)[0];
      return lastA.localeCompare(lastB);
    });
    return actors;
  }

  getPopularTrends() {
    return this.state.trends as string[];
  }

  getPopularActors() {
    return this.state.actors as string[];
  }
}
