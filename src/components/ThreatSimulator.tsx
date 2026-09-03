import React, { useState, useContext } from 'react';
import { ShieldAlert, MapPin, Clock, Navigation, Loader2 } from 'lucide-react';
import { AlertContext } from '../App';

interface ThreatAnalysis {
  success: boolean;
  riskScore: number;
  reasoning: string;
  recommendation: string;
}

export default function ThreatSimulator() {
  const { refreshAlertCount } = useContext(AlertContext);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ThreatAnalysis | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [location, setLocation] = useState('Lagos Mainland, High-risk zone at 2AM');
  const [time, setTime] = useState('02:15 AM');
  const [movementPattern, setMovementPattern] = useState('Erratic swerving, frequent stops near unmapped areas');

  const analyzeThreat = async () => {
    setLoading(true);
    setResult(null);
    setErrorMsg(null);
    try {
      const token = localStorage.getItem('vshield_token');
      const response = await fetch('/api/ai/analyze-threat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ location, time, movement_pattern: movementPattern })
      });
      
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        setErrorMsg("Threat analysis is temporarily unavailable. Please try again.");
        return;
      }
      
      if (!response.ok || data.success !== true) {
        let safeMessage = "Threat analysis is temporarily unavailable. Please try again.";
        if (data.error === "AI_SERVICE_TEMPORARILY_UNAVAILABLE") {
          safeMessage = "Gemini is temporarily busy. Please try again in a moment.";
        } else if (data.message) {
          safeMessage = data.message;
        }
        setErrorMsg(safeMessage);
        return;
      }

      const riskScore = Number(data.riskScore);
      const reasoning = data.reasoning;
      const recommendation = data.recommendation;

      if (!Number.isFinite(Number(riskScore)) || typeof reasoning !== 'string' || !reasoning.trim() || typeof recommendation !== 'string' || !recommendation.trim()) {
        setErrorMsg("Received invalid response format from the AI service.");
        return;
      }

      setResult({
        success: true,
        riskScore,
        reasoning,
        recommendation
      });

      if (riskScore >= 70) {
        await refreshAlertCount();
      }
    } catch (error) {
      console.error("Threat analysis request failed:", error);
      setErrorMsg("Threat analysis is temporarily unavailable. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-emerald-100">
      <div className="flex items-center space-x-2 mb-6">
        <ShieldAlert className="w-6 h-6 text-emerald-600" />
        <h2 className="text-lg font-bold text-gray-900">AI Threat Simulator (Gemini)</h2>
      </div>

      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center space-x-1">
            <MapPin className="w-4 h-4 text-emerald-500" /> <span>Location Context</span>
          </label>
          <input 
            type="text" 
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full p-2 border border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center space-x-1">
              <Clock className="w-4 h-4 text-emerald-500" /> <span>Time</span>
            </label>
            <input 
              type="text" 
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full p-2 border border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center space-x-1">
              <Navigation className="w-4 h-4 text-emerald-500" /> <span>Movement Pattern</span>
            </label>
            <input 
              type="text" 
              value={movementPattern}
              onChange={(e) => setMovementPattern(e.target.value)}
              className="w-full p-2 border border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      <button 
        onClick={analyzeThreat}
        disabled={loading}
        className="w-full bg-emerald-600 text-white font-medium py-3 rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center space-x-2 disabled:bg-emerald-300"
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldAlert className="w-5 h-5" />}
        <span>{loading ? 'Analyzing with Gemini...' : 'Run Threat Analysis'}</span>
      </button>

      {errorMsg && (
        <div className="mt-6 p-4 rounded-lg border bg-amber-50 border-amber-200">
          <p className="text-sm font-medium text-amber-800">{errorMsg}</p>
        </div>
      )}

      {result && result.success && (
        <div className={`mt-6 p-4 rounded-lg border ${result.riskScore > 60 ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-900">Analysis Result</h3>
            <span className={`px-3 py-1 rounded-full text-sm font-bold ${result.riskScore > 60 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
              Risk Score: {result.riskScore.toFixed(0)}%
            </span>
          </div>
          <p className="text-sm text-gray-800 mb-2"><strong>Reasoning:</strong> {result.reasoning}</p>
          <p className="text-sm text-gray-800"><strong>Recommendation:</strong> {result.recommendation}</p>
        </div>
      )}
    </div>
  );
}
