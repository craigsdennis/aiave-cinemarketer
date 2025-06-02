import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAgent } from 'agents/react';
import type {HollywoodAgentState, UIElement} from '../../worker/agents/hollywood';

export default function Movie() {
  const { slug } = useParams<{ slug: string }>();
  const [movieTitle, setMovieTitle] = useState("");
  const [description, setDescription] = useState("");

  const agent = useAgent({
    agent: "hollywood-agent",
    name: slug || "default",
    onStateUpdate: (state: HollywoodAgentState) => {
      setMovieTitle(state.movieTitle);
      if (state.description) {
        setDescription(state.description);
      }
    }
  });

  const lockInput = async (input: UIElement) => {
    await agent.call("lock", [input]);
  }
  
  const unlockInput = async (input: UIElement) => {
    await agent.call("unlock", [input]);
  }
  
  const submitTitle = async (form: FormData) => {
    const movieTitle = form.get("movie_title");
    await agent.call("regenerate", [movieTitle]);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Link 
            to="/" 
            className="text-blue-200 hover:text-white transition-colors flex items-center gap-2"
          >
            ← Back to Title Input
          </Link>
          <div className="text-blue-200 text-sm">Slug: {slug}</div>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 shadow-2xl">
          <h2 className="text-3xl font-bold text-white mb-6">{movieTitle || "Untitled Movie"}</h2>
          
          <form action={submitTitle} className="mb-8">
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-blue-100 mb-2">
                  Movie Title
                </label>
                <input 
                  name="movie_title" 
                  type="text" 
                  className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  placeholder="Enter movie title..."
                />
              </div>
              <button 
                type="submit"
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105"
              >
                Regenerate
              </button>
            </div>
          </form>

          <div>
            <h3 className="text-xl font-semibold text-white mb-4">Description</h3>
            <div className="bg-white/5 rounded-lg p-4 text-blue-100 min-h-[100px]">
              {description || "No description generated yet..."}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}