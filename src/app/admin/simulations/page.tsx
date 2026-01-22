"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  RefreshCw,
  Play,
  Eye,
  Bot,
  AlertTriangle,
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface SimulationRun {
  id: string;
  name: string;
  status: string;
  personaSet: string;
  scenarioCount: number;
  completedCount: number;
  resolutionRate: number | null;
  escalationRate: number | null;
  avgSatisfaction: number | null;
  avgLatency: number | null;
  avgDuration: number | null;
  avgMessageCount: number | null;
  createdAt: string;
  completedAt: string | null;
}

interface Metrics {
  totalSimulations: number;
  completedSimulations: number;
  failedSimulations: number;
  avgDuration: number;
  avgMessageCount: number;
  avgResponseLatency: number;
  resolutionRate: number;
  escalationRate: number;
  blockRate: number;
  avgSimulatedCsat: number;
}

export default function SimulationsPage() {
  const [runs, setRuns] = useState<SimulationRun[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [runsRes, metricsRes] = await Promise.all([
        fetch("/api/simulations"),
        fetch("/api/simulations/metrics"),
      ]);

      const runsData = await runsRes.json();
      const metricsData = await metricsRes.json();

      if (runsData.success) setRuns(runsData.data.runs);
      if (metricsData.success) setMetrics(metricsData.data.metrics);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const createAndStartRun = async (personaSet: string) => {
    setCreating(personaSet);
    try {
      // Create run
      const createRes = await fetch("/api/simulations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personaSet }),
      });
      const createData = await createRes.json();

      if (!createData.success) {
        throw new Error("Failed to create run");
      }

      // Start run
      const startRes = await fetch(`/api/simulations/${createData.data.runId}/start`, {
        method: "POST",
      });
      const startData = await startRes.json();

      if (startData.success) {
        fetchData();
      }
    } catch (error) {
      console.error("Failed to create/start run:", error);
    } finally {
      setCreating(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const statusColors: Record<string, string> = {
    PENDING: "bg-gray-100 text-gray-700",
    RUNNING: "bg-blue-100 text-blue-700",
    COMPLETED: "bg-green-100 text-green-700",
    FAILED: "bg-red-100 text-red-700",
  };

  const personaSetLabels: Record<string, { label: string; icon: typeof Bot }> = {
    standard: { label: "Standard", icon: Bot },
    edge_cases: { label: "Edge Cases", icon: AlertTriangle },
    adversarial: { label: "Security", icon: Shield },
    all: { label: "All", icon: Bot },
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-carsa-primary text-white">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="flex items-center gap-2 text-white/80 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
              Dashboard
            </Link>
            <div className="h-6 w-px bg-white/20" />
            <h1 className="text-xl font-bold">AI Simulations</h1>
          </div>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg hover:bg-white/30 transition-colors"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            Refresh
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Metrics Cards */}
        {metrics && metrics.totalSimulations > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-500 text-sm">Resolution Rate</span>
                <CheckCircle className="w-5 h-5 text-carsa-success" />
              </div>
              <p className="text-3xl font-bold text-carsa-success">
                {Math.round(metrics.resolutionRate * 100)}%
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {metrics.completedSimulations} simulations
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-500 text-sm">Escalation Rate</span>
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
              </div>
              <p className="text-3xl font-bold text-yellow-600">
                {Math.round(metrics.escalationRate * 100)}%
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {Math.round(metrics.blockRate * 100)}% blocked
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-500 text-sm">Avg CSAT</span>
                <TrendingUp className="w-5 h-5 text-carsa-primary" />
              </div>
              <p className="text-3xl font-bold text-carsa-primary">
                {metrics.avgSimulatedCsat.toFixed(1)}/5
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Simulated satisfaction
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-500 text-sm">Avg Latency</span>
                <Clock className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {Math.round(metrics.avgResponseLatency)}ms
              </p>
              <p className="text-xs text-gray-500 mt-1">
                ~{metrics.avgMessageCount.toFixed(1)} messages/conv
              </p>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-900 mb-4">Run New Simulation</h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => createAndStartRun("standard")}
              disabled={creating !== null}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors",
                creating === "standard"
                  ? "bg-carsa-primary/50 text-white cursor-wait"
                  : "bg-carsa-primary text-white hover:bg-carsa-secondary"
              )}
            >
              {creating === "standard" ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              Standard Personas (10)
            </button>

            <button
              onClick={() => createAndStartRun("edge_cases")}
              disabled={creating !== null}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors",
                creating === "edge_cases"
                  ? "bg-orange-400 text-white cursor-wait"
                  : "bg-orange-500 text-white hover:bg-orange-600"
              )}
            >
              {creating === "edge_cases" ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <AlertTriangle className="w-4 h-4" />
              )}
              Edge Cases
            </button>

            <button
              onClick={() => createAndStartRun("adversarial")}
              disabled={creating !== null}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors",
                creating === "adversarial"
                  ? "bg-red-400 text-white cursor-wait"
                  : "bg-red-500 text-white hover:bg-red-600"
              )}
            >
              {creating === "adversarial" ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Shield className="w-4 h-4" />
              )}
              Security Tests (3)
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-4">
            Simulations run through the full AI pipeline including guardrails, classification, and response generation.
          </p>
        </div>

        {/* Runs Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Simulation Runs</h2>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500">
              <RefreshCw className="w-8 h-8 mx-auto animate-spin mb-2" />
              Loading...
            </div>
          ) : runs.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
              No simulation runs yet. Click a button above to start.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 text-left text-sm text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Progress</th>
                    <th className="px-4 py-3">Resolution</th>
                    <th className="px-4 py-3">CSAT</th>
                    <th className="px-4 py-3">Latency</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {runs.map((run) => {
                    const { icon: Icon } = personaSetLabels[run.personaSet] || personaSetLabels.standard;
                    return (
                      <tr key={run.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{run.name}</p>
                            <p className="text-xs text-gray-500">{formatDate(run.createdAt)}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-1 text-sm text-gray-700">
                            <Icon className="w-4 h-4" />
                            {personaSetLabels[run.personaSet]?.label || run.personaSet}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              "px-2 py-1 rounded-full text-xs font-medium",
                              statusColors[run.status]
                            )}
                          >
                            {run.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {run.completedCount}/{run.scenarioCount}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {run.resolutionRate != null ? (
                            <span className="text-carsa-success font-medium">
                              {Math.round(run.resolutionRate * 100)}%
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {run.avgSatisfaction != null ? (
                            <span className="text-carsa-primary font-medium">
                              {run.avgSatisfaction.toFixed(1)}/5
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {run.avgLatency != null ? `${Math.round(run.avgLatency)}ms` : "-"}
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/admin/simulations/${run.id}`}
                            className="text-carsa-primary hover:underline text-sm flex items-center gap-1"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
