import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Pipeline from './pages/Pipeline.jsx';
import Reviews from './pages/Reviews.jsx';
import Intake from './pages/Intake.jsx';

export default function App() {
  return (
    <Routes>
      {/* Public-facing intake form — what your clients' customers see */}
      <Route path="/intake" element={<Intake />} />

      {/* Operator dashboard */}
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/pipeline" element={<Pipeline />} />
        <Route path="/reviews" element={<Reviews />} />
      </Route>
    </Routes>
  );
}
