"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  MessageSquare,
  Bot,
  User,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import ConversationReplay from "@/components/simulation/ConversationReplay";

interface SimulationMessage {
  id: string;
  role: string;
  content: string;
  personaIntent?: string;
  emotionLevel?: number;
  intent?: string;
  confidence?: number;
  responseLatency?: number;
  actionTaken?: string;
}

interface Simulation {
  id: string;
  personaId: string;
  personaName: string;
  scenarioType: string;
  scenarioDescription: string;
  status: string;
  durationSeconds?: number;
  messageCount: number;
  wasResolved: boolean;
  wasEscalated: boolean;
  escalateReason?: string;
  actionsTaken: string;
  avgResponseLatency?: number;
  simulatedCsat?: number;
  evaluationNotes?: string;
  injectionAttempts: number;
  blockedAttempts: number;
  messages: SimulationMessage[];
}

interface SimulationRun {
  id: string;
  name: string;
  status: string;
  personaSet: string;
  scenarioCount: number;
  completedCount: number;
  avgDuration?: number;
  avgMessageCount?: number;
  resolutionRate?: number;
  escalationRate?: number;
  avgSatisfaction?: number;
  avgLatency?: number;
  createdAt: string;
  completedAt?: string;
  simulations: Simulation[];
}

export default function SimulationRunPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [run, setRun] = useState<SimulationRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSimulation, setExpandedSimulation] = useState<string | null>(null);

  const fetchRun = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/simulations/${id}`);
      const data = await res.json();
      if (data.success) {
        setRun(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch run:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRun();
  }, [id]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const statusColors: Record<string, string> = {
    PENDING: "bg-gray-100 text-gray-700",
    RUNNING: "bg-blue-100 text-blue-700",
    COMPLETED: "bg-green-100 text-green-700",
    FAILED: "bg-red-100 text-red-700",
    TIMEOUT: "bg-orange-100 text-orange-700",
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-carsa-primary" />
      </div>
    );
  }

  if (!run) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <p className="text-gray-600">Simulation run not found</p>
          <Link href="/admin/simulations" className="text-carsa-primary hover:underline mt-2 block">
            Back to Simulations
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-carsa-primary text-white">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/simulations"
              className="flex items-center gap-2 text-white/80 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
              Simulations
            </Link>
            <div className="h-6 w-px bg-white/20" />
            <h1 className="text-xl font-bold">{run.name}</h1>
          </div>
          <span className={cn("px-3 py-1 rounded-full text-sm", statusColors[run.status])}>
            {run.status}
          </span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-gray-500 text-xs mb-1">Scenarios</p>
            <p className="text-2xl font-bold text-gray-900">
              {run.completedCount}/{run.scenarioCount}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-gray-500 text-xs mb-1">Resolution</p>
            <p className="text-2xl font-bold text-carsa-success">
              {run.resolutionRate != null ? `${Math.round(run.resolutionRate * 100)}%` : "-"}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-gray-500 text-xs mb-1">Escalation</p>
            <p className="text-2xl font-bold text-yellow-600">
              {run.escalationRate != null ? `${Math.round(run.escalationRate * 100)}%` : "-"}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-gray-500 text-xs mb-1">Avg CSAT</p>
            <p className="text-2xl font-bold text-carsa-primary">
              {run.avgSatisfaction?.toFixed(1) || "-"}/5
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-gray-500 text-xs mb-1">Avg Latency</p>
            <p className="text-2xl font-bold text-gray-900">
              {run.avgLatency ? `${Math.round(run.avgLatency)}ms` : "-"}
            </p>
          </div>
        </div>

        {/* Simulations List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Individual Simulations</h2>
          </div>

          <div className="divide-y divide-gray-100">
            {run.simulations.map((sim) => {
              const isExpanded = expandedSimulation === sim.id;
              const actions = JSON.parse(sim.actionsTaken || "[]") as string[];

              return (
                <div key={sim.id} className="bg-white">
                  {/* Simulation Header */}
                  <button
                    onClick={() => setExpandedSimulation(isExpanded ? null : sim.id)}
                    className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-carsa-primary/10 flex items-center justify-center">
                        <Bot className="w-5 h-5 text-carsa-primary" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-gray-900">{sim.personaName}</p>
                        <p className="text-xs text-gray-500">{sim.scenarioType}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      {/* Status indicators */}
                      <div className="flex items-center gap-2">
                        {sim.wasResolved && (
                          <span className="flex items-center gap-1 text-xs text-carsa-success">
                            <CheckCircle className="w-4 h-4" />
                            Resolved
                          </span>
                        )}
                        {sim.wasEscalated && (
                          <span className="flex items-center gap-1 text-xs text-yellow-600">
                            <AlertTriangle className="w-4 h-4" />
                            Escalated
                          </span>
                        )}
                        {sim.blockedAttempts > 0 && (
                          <span className="flex items-center gap-1 text-xs text-red-500">
                            <XCircle className="w-4 h-4" />
                            Blocked
                          </span>
                        )}
                      </div>

                      {/* Metrics */}
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-4 h-4" />
                          {sim.messageCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {sim.avgResponseLatency ? `${Math.round(sim.avgResponseLatency)}ms` : "-"}
                        </span>
                        {sim.simulatedCsat && (
                          <span className="text-carsa-primary font-medium">
                            {sim.simulatedCsat.toFixed(1)}/5
                          </span>
                        )}
                      </div>

                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </button>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-gray-100 bg-gray-50">
                      <div className="pt-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Conversation Replay */}
                        <div>
                          <ConversationReplay
                            messages={sim.messages}
                            personaName={sim.personaName}
                          />
                        </div>

                        {/* Details */}
                        <div className="space-y-4">
                          <div className="bg-white rounded-lg p-4 border border-gray-200">
                            <h4 className="font-medium text-gray-900 mb-2">Scenario</h4>
                            <p className="text-sm text-gray-600">{sim.scenarioDescription}</p>
                          </div>

                          {actions.length > 0 && (
                            <div className="bg-white rounded-lg p-4 border border-gray-200">
                              <h4 className="font-medium text-gray-900 mb-2">Actions Taken</h4>
                              <div className="flex flex-wrap gap-2">
                                {actions.map((action, i) => (
                                  <span
                                    key={i}
                                    className="px-2 py-1 bg-carsa-primary/10 text-carsa-primary text-xs rounded"
                                  >
                                    {action}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {sim.escalateReason && (
                            <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                              <h4 className="font-medium text-yellow-800 mb-1">Escalation Reason</h4>
                              <p className="text-sm text-yellow-700">{sim.escalateReason}</p>
                            </div>
                          )}

                          {sim.evaluationNotes && (
                            <div className="bg-white rounded-lg p-4 border border-gray-200">
                              <h4 className="font-medium text-gray-900 mb-2">Evaluation Notes</h4>
                              <p className="text-sm text-gray-600 whitespace-pre-wrap">
                                {sim.evaluationNotes}
                              </p>
                            </div>
                          )}

                          {sim.injectionAttempts > 0 && (
                            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                              <h4 className="font-medium text-red-800 mb-1">Security Test Results</h4>
                              <p className="text-sm text-red-700">
                                Injection attempts: {sim.injectionAttempts} |
                                Blocked: {sim.blockedAttempts}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
