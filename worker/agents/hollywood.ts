import { Agent, unstable_callable as callable } from "agents";
import { stripIndents } from "common-tags";

const UI_ELEMENTS = [
  "title",
  "description",
  "genre",
  "tagline",
  "actors",
  "reviews",
] as const;
export type UIElement = (typeof UI_ELEMENTS)[number];

export type Review = {
  text: string;
  author: string;
};

export type HollywoodAgentState = {
  movieTitle: string;
  description?: string;
  slug?: string;
  genre?: string;
  tagline?: string;
  director?: string;
  posterUrl?: string;
  actors: string[];
  reviews: Review[];
  lockedInputs: UIElement[];
};

export class HollywoodAgent extends Agent<Env, HollywoodAgentState> {
  initialState: HollywoodAgentState = {
    movieTitle: "Unnamed",
    actors: [],
    reviews: [],
    lockedInputs: [],
  };

  @callable()
  async regenerate(movieTitle: string) {
    this.setState({
      ...this.state,
      movieTitle,
    });

    if (!this.isLocked("description")) {
      const description = await this.generateDescription();
      await this.updateDescription(description);
    }
    if (!this.isLocked("tagline")) {
      const tagline = await this.generateTagline();
      await this.updateTagline(tagline);
    }
    // Generate actors
    // Generate poster
    // Generate reviews
  }

  async generateDescription() {
    const instructions = stripIndents`You are a script writer who is pitching a new movie.

    The user is going to provide you with details about the movie.
    
    Your job is to use the provided information to create the plot and brief description for the movie to make it a sure sale to Hollywood.
    
    Return only the description.
    `;
    let info = `<Title>\n${this.state.movieTitle}\n</Title>`;
    if (this.state.actors.length > 0) {
      info += `\n<Starring>\n${this.state.actors.join(", ")}\n</Starring>`;
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
    
    Return only the tagline.
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

  async updateDescription(description: string) {
    this.setState({
      ...this.state,
      description,
    });
    await this.lock("description");
  }

  async updateTagline(tagline: string) {
    this.setState({
      ...this.state,
      tagline,
    });
    await this.lock("tagline");
  }
}
