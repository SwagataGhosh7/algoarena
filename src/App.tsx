/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Home } from './pages/Home';
import { Arena } from './pages/Arena';
import { Profile } from './pages/Profile';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { AuthModal } from './components/AuthModal';
import { ProfileSetupModal } from './components/ProfileSetupModal';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/room/:id" element={<Arena />} />
        <Route path="/arena/:id" element={<Arena />} />
        <Route path="/profile/:username" element={<Profile />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <AuthModal />
      <ProfileSetupModal />
    </BrowserRouter>
  );
}
