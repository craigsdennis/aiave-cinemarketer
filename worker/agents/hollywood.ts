import { Agent, unstable_callable as callable } from "agents";
import { stripIndents } from "common-tags";
import { file, z } from "zod/v4";

export const UI_ELEMENTS = [
  "title",
  "description",
  "genre",
  "tagline",
  "cast",
  "reviews",
  "posterUrl",
] as const;
export type UIElement = (typeof UI_ELEMENTS)[number];

export type Review = {
  text: string;
  author: string;
};

export type CastMember = {
  character: string;
  actor: string;
};

export type HollywoodAgentState = {
  movieTitle: string;
  description?: string;
  slug?: string;
  genre?: string;
  tagline?: string;
  director?: string;
  posterUrl?: string;
  cast: CastMember[];
  reviews: Review[];
  lockedInputs: UIElement[];
};

export class HollywoodAgent extends Agent<Env, HollywoodAgentState> {
  initialState: HollywoodAgentState = {
    movieTitle: "Unnamed",
    cast: [],
    reviews: [],
    lockedInputs: [],
  };

  @callable()
  async regenerate(movieTitle: string) {
    this.setState({
      ...this.state,
      movieTitle,
    });
    this.lock("title");

    if (!this.isLocked("description")) {
      const description = await this.generateDescription();
      await this.updateDescription(description);
    }
    if (!this.isLocked("tagline")) {
      const tagline = await this.generateTagline();
      await this.updateTagline(tagline);
    }
    if (!this.isLocked("cast")) {
      const cast = await this.generateCast();
      await this.updateCast(cast);
    }
    if (!this.isLocked("posterUrl")) {
      const posterUrl = await this.generatePoster();
      await this.updatePosterUrl(posterUrl);
    }
    // Generate reviews
  }

  async generateDescription() {
    const instructions = stripIndents`You are a script writer who is pitching a new movie.

    The user is going to provide you with details about the movie.
    
    Your job is to use the provided information to create the plot and brief description for the movie to make it a sure sale to Hollywood.
    
    Return only the description.
    `;
    let info = `<Title>\n${this.state.movieTitle}\n</Title>`;
    if (this.state.cast.length > 0) {
      info += `\n<Starring>\n${this.state.cast.map(
        (m) => m.actor + " as " + m.character
      )}(", ")}\n</Starring>`;
    }
    if (this.state.tagline) {
      info += `\n<Tagline>\n${this.state.tagline}\n</Tagline>`;
    }
    const results = await this.env.AI.run(
      "@cf/meta/llama-4-scout-17b-16e-instruct",
      {
        messages: [
          { role: "system", content: instructions },
          { role: "user", content: info },
        ],
      }
    );
    // @ts-expect-error - This is not in the type system correctly :(
    return results.response;
  }

  async generateTagline() {
    const instructions = stripIndents`You are a marketer who is trying to create catchy taglines for movies.

    The user is going to provide you with details about the movie.
    
    Your job is to use the provided information to create a tagline that can go on billboards.
    
    Return only the tagline. Do not put it in quotes.
    `;
    let info = `<Title>\n${this.state.movieTitle}\n</Title>`;
    if (this.state.description) {
      info += `\n<Description>\n${this.state.description}\n</Description>`;
    }
    const results = await this.env.AI.run(
      "@cf/meta/llama-4-scout-17b-16e-instruct",
      {
        messages: [
          { role: "system", content: instructions },
          { role: "user", content: info },
        ],
      }
    );
    // @ts-expect-error - This is not in the type system correctly :(
    return results.response;
  }

  async generateCast(): Promise<CastMember[]> {
    const instructions = stripIndents`You are a Hollywood casting agent.
    
    Your job is to create characters based on a brief as well as choose who you think would make the best casting decision.

    The user is going to provide you information about the movie, and you should be as creative as possible in your decisions.
    `;

    const info = `The movie is titled "${this.state.movieTitle}" and a brief description is as follows:
    <Description>
    ${this.state.description}
    </Description>
    
    Feel free to add additional characters and actors if you think it will help at the box office.
    `;

    const CastSchema = z.array(
      z.object({
        character: z
          .string()
          .meta({ description: "The name of the character" }),
        actor: z
          .string()
          .meta({ description: "The suggested actor to play this role" }),
      })
    );

    const { response } = await this.env.AI.run(
      "@cf/meta/llama-4-scout-17b-16e-instruct",
      {
        messages: [
          { role: "system", content: instructions },
          { role: "user", content: info },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            type: "object",
            properties: {
              cast: z.toJSONSchema(CastSchema),
            },
          },
        },
      }
    );
    const parsed = JSON.parse(response);
    return parsed.cast as CastMember[];
  }

  async generatePosterPrompt() {
    const instructions = stripIndents`You are a Prompt Engineer.
    
    The user is going to provide you information about a movie.

    Your job is to create the perfect Flux Schnell prompt that will generate a poster for their movie.

    Return only the prompt.
    `;

    let info = `The movie is titled "${this.state.movieTitle}" and a brief description is as follows:
    <Description>
    ${this.state.description}
    </Description>
    `;
    if (this.state.cast.length > 0) {
      info += `\n<Starring>\n${this.state.cast.map(
        (m) => m.actor + " as " + m.character
      )}(", ")}\n</Starring>`;
    }
    if (this.state.tagline) {
      info += `\n<Tagline>\n${this.state.tagline}\n</Tagline>`;
    }
    const results = await this.env.AI.run(
      "@cf/meta/llama-4-scout-17b-16e-instruct",
      {
        messages: [
          { role: "system", content: instructions },
          { role: "user", content: info },
        ],
      }
    );
    // @ts-expect-error - This is not in the type system correctly :(
    const prompt = results.response;
    console.log({prompt});
    return prompt;
  }

  async generatePoster() {
    const prompt = await this.generatePosterPrompt();
    console.log("Creating poster with prompt", prompt);
    const response = await this.env.AI.run("@cf/black-forest-labs/flux-1-schnell", {
      prompt
    });
    const imageResponse = await fetch(`data:image/jpeg;charset=utf-8;base64,${response.image}`);
    const fileName = `${this.state.slug}/${crypto.randomUUID()}.jpg`;
    await this.env.MOVIE_POSTERS.put(fileName, imageResponse.body);
    return `/images/posters/${fileName}`;
  }

  isLocked(input: UIElement) {
    return this.state.lockedInputs.includes(input);
  }

  @callable()
  async lock(input: UIElement) {
    const { lockedInputs } = this.state;
    lockedInputs.push(input);
    this.setState({
      ...this.state,
      lockedInputs,
    });
  }

  @callable()
  async unlock(input: UIElement) {
    const { lockedInputs } = this.state;
    const removed = lockedInputs.filter((name) => input !== name);
    this.setState({
      ...this.state,
      lockedInputs: removed,
    });
  }

  @callable()
  async updatePosterUrl(posterUrl: string) {
    this.setState({
      ...this.state,
      posterUrl,
    });
    await this.lock("posterUrl");
  }

  @callable()
  async updateDescription(description: string) {
    this.setState({
      ...this.state,
      description,
    });
    await this.lock("description");
  }

  @callable()
  async updateTagline(tagline: string) {
    this.setState({
      ...this.state,
      tagline,
    });
    await this.lock("tagline");
  }

  @callable()
  async updateCast(cast: CastMember[]) {
    this.setState({
      ...this.state,
      cast,
    });
    await this.lock("cast");
  }
}
