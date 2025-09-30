import { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { useAgent } from 'agents/react';
import type {HollywoodAgentState, CastMember, UIElement, Review, HollywoodAgent} from '../../worker/agents/hollywood';
import Footer from './Footer';

export default function Movie() {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const [movieTitle, setMovieTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tagline, setTagline] = useState("");
  const [posterUrl, setPosterUrl] = useState("");
  const [grittyScale, setGrittyScale] = useState<number>(3);
  const [cast, setCast] = useState<CastMember[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [lockedInputs, setLockedInputs] = useState<UIElement[]>([]);
  const [loadingInputs, setLoadingInputs] = useState<UIElement[]>([]);
  const [showPosterModal, setShowPosterModal] = useState(false);

  const agent = useAgent<HollywoodAgent, HollywoodAgentState>({
    agent: "hollywood-agent",
    name: slug || "default",
    onStateUpdate: (state: HollywoodAgentState) => {
      setMovieTitle(state.movieTitle);
      if (state.description) {
        setDescription(state.description);
      }
      if (state.tagline) {
        setTagline(state.tagline);
      }
      if (state.posterUrl) {
        setPosterUrl(state.posterUrl);
      }
      if (state.grittyScale) {
        setGrittyScale(state.grittyScale);
      }
      if (state.cast?.length > 0) {
        setCast(state.cast);
      }
      if (state.reviews?.length > 0) {
        setReviews(state.reviews);
      }
      setLockedInputs(state.lockedInputs);
      setLoadingInputs(state.loadingInputs);
    }
  });

  // Trigger regeneration when component mounts with a title from navigation
  useEffect(() => {
    const titleFromNavigation = location.state?.title;
    if (titleFromNavigation && agent) {
      agent.stub.regenerate(titleFromNavigation as string);
    }
  }, [agent, location.state?.title]);

  const lockInput = async (input: UIElement) => {
    await agent.stub.lock(input);
  }
  
  const unlockInput = async (input: UIElement) => {
    await agent.stub.unlock(input);
  }
  
  const submitTitle = async (form: FormData) => {
    const movieTitle = form.get("movie_title") as string;
    await agent.stub.regenerate(movieTitle);
  }

  const saveTagline = async (form: FormData) => {
    const taglineText = form.get("tagline") as string;
    await agent.stub.updateTagline(taglineText);
  }

  const addCastMember = async (form: FormData) => {
    const character = form.get("character");
    const actor = form.get("actor");
    if (character && actor) {
      const newCast = [...cast, { character: character.toString(), actor: actor.toString() }];
      await agent.stub.updateCast(newCast);
    }
  }

  const deleteCastMember = async (index: number) => {
    const newCast = cast.filter((_, i) => i !== index);
    await agent.stub.updateCast(newCast);
  }

  const regenerateAll = async () => {
    await agent.stub.regenerate(movieTitle);
  }

  const updateGrittyScale = async (newGrittyScale: number) => {
    await agent.stub.updateGrittyScale(newGrittyScale);
  }

  const isLocked = (input: UIElement) => lockedInputs.includes(input);
  const isLoading = (input: UIElement) => loadingInputs.includes(input);

  const LockIcon = ({ input }: { input: UIElement }) => {
    const locked = isLocked(input);
    const loading = isLoading(input);
    
    return (
      <button
        onClick={() => locked ? unlockInput(input) : lockInput(input)}
        className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
        title={loading ? "Generating..." : locked ? "Unlock to edit" : "Lock to prevent changes"}
        disabled={loading}
      >
        {loading ? (
          <svg className="w-5 h-5 text-blue-400 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
          </svg>
        ) : locked ? (
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
  };

  const FilmReelSpinner = () => (
    <div className="flex items-center justify-center space-x-3">
      <div className="text-4xl animate-spin">🍿</div>
      <span className="text-blue-200 animate-pulse">Generating...</span>
    </div>
  );

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4 pb-20">
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
          {/* Header with Title and Regenerate Button */}
          <div className="flex items-start justify-between mb-8">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <h2 className="text-3xl font-bold text-white">{movieTitle || "Untitled Movie"}</h2>
                <LockIcon input="title" />
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
                      Update Title
                    </button>
                  </div>
                </form>
              )}
            </div>
            
            <button 
              onClick={regenerateAll}
              className="ml-6 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Regenerate
            </button>
          </div>

          {/* Tagline Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">Tagline</h3>
              <LockIcon input="tagline" />
            </div>
            
            {isLocked("tagline") ? (
              <div className="bg-white/5 rounded-lg p-4 text-blue-100 min-h-[60px] flex items-center">
                <div className="text-lg italic">
                  {tagline ? `"${tagline}"` : "No tagline generated yet..."}
                </div>
              </div>
            ) : isLoading("tagline") ? (
              <div className="bg-white/5 rounded-lg p-4 text-blue-100 min-h-[60px] flex items-center justify-center">
                <FilmReelSpinner />
              </div>
            ) : (
              <form action={saveTagline}>
                <div className="flex gap-4 items-end">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-blue-100 mb-2">
                      Edit Tagline
                    </label>
                    <input 
                      name="tagline" 
                      type="text" 
                      defaultValue={tagline}
                      className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                      placeholder="Enter tagline..."
                    />
                  </div>
                  <button 
                    type="submit"
                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 flex items-center gap-2"
                    title="Save tagline"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Save
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Gritty Scale Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">Gritty Scale</h3>
              <LockIcon input="grittyScale" />
            </div>

            {isLocked("grittyScale") ? (
              <div className="bg-white/5 rounded-lg p-6 text-blue-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-lg font-medium">
                    Level {grittyScale} of 5
                  </div>
                  <div className="text-sm text-blue-200">
                    {grittyScale === 1 && "Family-friendly & lighthearted"}
                    {grittyScale === 2 && "Light drama with mild themes"}
                    {grittyScale === 3 && "Moderate drama with some intensity"}
                    {grittyScale === 4 && "Dark & mature with significant intensity"}
                    {grittyScale === 5 && "Extremely gritty & brutal"}
                  </div>
                </div>
                <div className="w-full bg-white/10 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-green-500 via-yellow-500 to-red-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${(grittyScale / 5) * 100}%` }}
                  ></div>
                </div>
              </div>
            ) : isLoading("grittyScale") ? (
              <div className="bg-white/5 rounded-lg p-6 text-blue-100 flex items-center justify-center">
                <FilmReelSpinner />
              </div>
            ) : (
              <div className="bg-white/5 rounded-lg p-6 text-blue-100">
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-lg font-medium">
                      Level {grittyScale} of 5
                    </div>
                    <div className="text-sm text-blue-200">
                      {grittyScale === 1 && "Family-friendly & lighthearted"}
                      {grittyScale === 2 && "Light drama with mild themes"}
                      {grittyScale === 3 && "Moderate drama with some intensity"}
                      {grittyScale === 4 && "Dark & mature with significant intensity"}
                      {grittyScale === 5 && "Extremely gritty & brutal"}
                    </div>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-3 mb-4">
                    <div
                      className="bg-gradient-to-r from-green-500 via-yellow-500 to-red-600 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${(grittyScale / 5) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={grittyScale}
                  onChange={(e) => {
                    const newValue = parseInt(e.target.value);
                    setGrittyScale(newValue);
                    updateGrittyScale(newValue);
                  }}
                  className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                  style={{
                    background: `linear-gradient(to right, #10b981 0%, #eab308 25%, #f97316 50%, #ef4444 75%, #dc2626 100%)`
                  }}
                />
                <div className="flex justify-between text-xs text-blue-300 mt-2">
                  <span>Family</span>
                  <span>Light</span>
                  <span>Moderate</span>
                  <span>Dark</span>
                  <span>Brutal</span>
                </div>
              </div>
            )}
          </div>

          {/* Movie Poster Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">Movie Poster</h3>
              <LockIcon input="posterUrl" />
            </div>
            
            <div className="bg-white/5 rounded-lg p-4 text-blue-100 min-h-[200px] flex items-center justify-center">
              {isLoading("posterUrl") ? (
                <FilmReelSpinner />
              ) : posterUrl ? (
                <div className="cursor-pointer" onClick={() => setShowPosterModal(true)}>
                  <img 
                    src={posterUrl} 
                    alt={`${movieTitle} poster`}
                    className="max-w-full max-h-96 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-200"
                  />
                </div>
              ) : (
                <div className="text-center">
                  <svg className="w-16 h-16 mx-auto mb-4 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <div>No poster generated yet...</div>
                  <div className="text-sm text-blue-300 mt-2">Poster will be generated automatically during regeneration</div>
                </div>
              )}
            </div>
          </div>

          {/* Description Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">Description</h3>
              <LockIcon input="description" />
            </div>
            
            <div className="bg-white/5 rounded-lg p-4 text-blue-100 min-h-[100px]">
              {isLoading("description") ? (
                <div className="flex items-center justify-center h-full">
                  <FilmReelSpinner />
                </div>
              ) : (
                description || "No description generated yet..."
              )}
            </div>
          </div>

          {/* Cast Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">Cast</h3>
              <LockIcon input="cast" />
            </div>
            
            {isLocked("cast") ? (
              <div className="bg-white/5 rounded-lg p-4 text-blue-100 min-h-[100px]">
                {cast.length > 0 ? (
                  <div className="space-y-2">
                    {cast.map((member, index) => (
                      <div key={index} className="text-lg">
                        <span className="font-semibold">{member.character}:</span> {member.actor}
                      </div>
                    ))}
                  </div>
                ) : (
                  "No cast members added yet..."
                )}
              </div>
            ) : isLoading("cast") ? (
              <div className="bg-white/5 rounded-lg p-4 text-blue-100 min-h-[100px] flex items-center justify-center">
                <FilmReelSpinner />
              </div>
            ) : (
              <div className="space-y-4">
                {cast.length > 0 && (
                  <div className="bg-white/5 rounded-lg p-4 text-blue-100 space-y-2">
                    {cast.map((member, index) => (
                      <div key={index} className="flex items-center justify-between text-lg">
                        <div>
                          <span className="font-semibold">{member.character}:</span> {member.actor}
                        </div>
                        <button
                          onClick={() => deleteCastMember(index)}
                          className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/40 transition-colors text-red-400 hover:text-red-300"
                          title="Delete cast member"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                <form action={addCastMember}>
                  <div className="bg-white/10 rounded-lg p-4 space-y-4">
                    <h4 className="text-lg font-medium text-white">Add Cast Member</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-blue-100 mb-2">
                          Character Name
                        </label>
                        <input 
                          name="character" 
                          type="text" 
                          required
                          className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                          placeholder="Enter character name..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-blue-100 mb-2">
                          Actor Name
                        </label>
                        <input 
                          name="actor" 
                          type="text" 
                          required
                          className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                          placeholder="Enter actor name..."
                        />
                      </div>
                    </div>
                    <button 
                      type="submit"
                      className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Add Cast Member
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Reviews Section */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">Reviews</h3>
              <LockIcon input="reviews" />
            </div>
            
            {isLocked("reviews") ? (
              <div className="bg-white/5 rounded-lg p-4 text-blue-100 min-h-[100px]">
                {reviews.length > 0 ? (
                  <div className="space-y-4">
                    {reviews.map((review, index) => (
                      <div key={index} className="border-b border-white/10 last:border-b-0 pb-4 last:pb-0">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-semibold text-white">{review.author}</div>
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <svg
                                key={i}
                                className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400' : 'text-gray-600'}`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                            <span className="ml-2 text-sm text-blue-200">({review.rating}/5)</span>
                          </div>
                        </div>
                        <div className="text-sm text-blue-100">{review.text}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  "No reviews generated yet..."
                )}
              </div>
            ) : isLoading("reviews") ? (
              <div className="bg-white/5 rounded-lg p-4 text-blue-100 min-h-[100px] flex items-center justify-center">
                <FilmReelSpinner />
              </div>
            ) : (
              <div className="bg-white/5 rounded-lg p-4 text-blue-100 min-h-[100px]">
                {reviews.length > 0 ? (
                  <div className="space-y-4">
                    {reviews.map((review, index) => (
                      <div key={index} className="border-b border-white/10 last:border-b-0 pb-4 last:pb-0">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-semibold text-white">{review.author}</div>
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <svg
                                key={i}
                                className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400' : 'text-gray-600'}`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                            <span className="ml-2 text-sm text-blue-200">({review.rating}/5)</span>
                          </div>
                        </div>
                        <div className="text-sm text-blue-100">{review.text}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  "No reviews generated yet..."
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Poster Modal */}
      {showPosterModal && posterUrl && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowPosterModal(false)}
        >
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => setShowPosterModal(false)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img 
              src={posterUrl} 
              alt={`${movieTitle} poster`}
              className="max-w-full max-h-full rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
      </div>
      <Footer />
    </>
  );
}