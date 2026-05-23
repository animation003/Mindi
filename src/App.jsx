import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { GameProvider } from './context/GameContext';
import HomeView from './components/HomeView';
import CreateRoomView from './components/CreateRoomView';
import JoinRoomView from './components/JoinRoomView';
import LobbyView from './components/LobbyView';
import GameTable from './components/GameTable';

function App() {
  return (
    <GameProvider>
      <Router>
        <div className="app-container">
          <Routes>
            <Route path="/" element={<HomeView />} />
            <Route path="/create" element={<CreateRoomView />} />
            <Route path="/join" element={<JoinRoomView />} />
            <Route path="/room/:roomId/lobby" element={<LobbyView />} />
            <Route path="/room/:roomId/game" element={<GameTable />} />
          </Routes>
        </div>
      </Router>
    </GameProvider>
  );
}

export default App;
