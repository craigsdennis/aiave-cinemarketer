import { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { useAgent } from 'agents/react';
import type {HollywoodAgentState, UIElement} from '../../worker/agents/hollywood';

export default function Movie() {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const [movieTitle, setMovieTitle] = useState("");
  const [description, setDescription] = useState("");
  const [lockedInputs, setLockedInputs] = useState<UIElement[]>([]);

  const agent = useAgent({
    agent: "hollywood-agent",
    name: slug || "default",
    onStateUpdate: (state: HollywoodAgentState) => {
      setMovieTitle(state.movieTitle);
      if (state.description) {
        setDescription(state.description);
      }
      setLockedInputs(state.lockedInputs);
    }
  });

  // Trigger regeneration when component mounts with a title from navigation
  useEffect(() => {
    const titleFromNavigation = location.state?.title;
    if (titleFromNavigation && agent.isReady) {
      agent.call("regenerate", [titleFromNavigation]);
    }
  }, [agent.isReady, location.state?.title]);

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

  const isLocked = (input: UIElement) => lockedInputs.includes(input);

  const LockIcon = ({ locked, onClick }: { locked: boolean; onClick: () => void }) => (
    <button
      onClick={onClick}
      className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
      title={locked ? "Unlock to edit" : "Lock to prevent changes"}
    >
      {locked ? (
        <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
        </svg>
      ) : (
        <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2H7V7a3 3 0 015.905-.75 1 1 0 001.937-.5A5.002 5.002 0 0010 2z" />
        </svg>
      )}
    </button>
  );

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
          {/* Title Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-3xl font-bold text-white">{movieTitle || "Untitled Movie"}</h2>
              <LockIcon 
                locked={isLocked("title")} 
                onClick={() => isLocked("title") ? unlockInput("title") : lockInput("title")}
              />
            </div>
            
            {!isLocked("title") && (
              <form action={submitTitle}>
                <div className="flex gap-4 items-end">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-blue-100 mb-2">
                      Movie Title
                    </label>
                    <input 
                      name="movie_title" 
                      type="text" 
                      defaultValue={movieTitle}
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
            )}
          </div>

          {/* Description Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">Description</h3>
              <LockIcon 
                locked={isLocked("description")} 
                onClick={() => isLocked("description") ? unlockInput("description") : lockInput("description")}
              />
            </div>
            
            <div className="bg-white/5 rounded-lg p-4 text-blue-100 min-h-[100px]">
              {description || "No description generated yet..."}
            </div>
            
            {!isLocked("description") && description && (
              <div className="mt-4">
                <button 
                  onClick={() => agent.call("regenerate", [movieTitle])}
                  className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200"
                >
                  Regenerate Description
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}