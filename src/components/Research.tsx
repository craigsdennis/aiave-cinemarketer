import { useState } from "react";
import { useAgent } from "agents/react";
import { Link } from "react-router-dom";
import type { ReporterState } from "../../worker/agents/reporter";

export default function Research() {
  const [trends, setTrends] = useState<string[]>([]);
  const [actors, setActors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const agent = useAgent({
    agent: "reporter-agent",
    name: "default",
    onStateUpdate: (state: ReporterState) => {
      if (state.trends) {
        setTrends(state.trends);
      }
      if (state.actors) {
        setActors(state.actors);
      }
    },
  });

  const handleGatherTrends = async () => {
    if (!agent) return;
    setIsLoading(true);
    try {
      await agent.call("gatherTrends", []);
    } catch (error) {
      console.error("Error gathering trends:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">
              📊 Competitive Research
            </h1>
            <p className="text-blue-200">
              Discover current movie trends, popular actors, and market insights
            </p>
          </div>

          <div className="flex justify-between items-center mb-8">
            <Link
              to="/"
              className="text-blue-300 hover:text-blue-200 transition-colors duration-200"
            >
              ← Back to Home
            </Link>

            <button
              onClick={handleGatherTrends}
              disabled={isLoading}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-transparent disabled:scale-100"
            >
              {isLoading ? "Gathering Data..." : "Gather Trends & Actors"}
            </button>
          </div>

          <div className="space-y-6">
            {trends && (
              <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                  📈 Current Movie Trends
                </h2>
                <div className="text-blue-100">
                  <ul className="space-y-2">
                    {trends.map((trend, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-blue-400 mr-2">•</span>
                        <span>{trend}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {actors && (
              <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                  🎭 Popular Actors
                </h2>
                <div className="text-blue-100">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {actors.map((actor, index) => (
                      <div key={index} className="bg-white/10 rounded-lg p-3 text-center">
                        <span className="text-sm font-medium">{actor}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {!trends && !isLoading && (
            <div className="text-center text-blue-200 py-12">
              <p>
                Click "Gather Trends & Actors" to see the latest movie industry
                insights and popular actors
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
