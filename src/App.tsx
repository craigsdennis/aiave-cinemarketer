import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import TitleInput from './components/TitleInput';
import Movie from './components/Movie';
import Research from './components/Research';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<TitleInput />} />
        <Route path="/movie/:slug" element={<Movie />} />
        <Route path="/research" element={<Research />} />
      </Routes>
    </Router>
  )
}

export default App
