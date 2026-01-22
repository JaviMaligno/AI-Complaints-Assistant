"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BarChart3,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  ArrowLeft,
  RefreshCw,
  Bot,
  TrendingUp,
  PlayCircle,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface Stats {
  totalComplaints: number;
  openComplaints: number;
  aiResolved: number;
  aiResolvedPercent: number;
  avgResolutionTimeHours: number;
  escalatedCount: number;
  todayComplaints: number;
  csatAverage: number;
}

interface Complaint {
  id: string;
  referenceNumber: string;
  customerName: string;
  customerEmail: string;
  category: string;
  status: string;
  priority: string;
  aiHandled: boolean;
  createdAt: string;
  vehicleInfo: string | null;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, complaintsRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch(`/api/complaints${statusFilter ? `?status=${statusFilter}` : ""}`),
      ]);

      const statsData = await statsRes.json();
      const complaintsData = await complaintsRes.json();

      if (statsData.success) setStats(statsData.data);
      if (complaintsData.success) setComplaints(complaintsData.data.complaints);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const statusColors: Record<string, string> = {
    OPEN: "bg-blue-100 text-blue-700",
    IN_PROGRESS: "bg-yellow-100 text-yellow-700",
    ESCALATED: "bg-red-100 text-red-700",
    RESOLVED: "bg-green-100 text-green-700",
    CLOSED: "bg-gray-100 text-gray-700",
  };

  const priorityColors: Record<string, string> = {
    LOW: "text-gray-500",
    NORMAL: "text-blue-500",
    HIGH: "text-orange-500",
    URGENT: "text-red-500",
  };

  const categoryLabels: Record<string, string> = {
    DELIVERY: "Delivery",
    VEHICLE_CONDITION: "Vehicle",
    MISSING_ITEMS: "Missing Items",
    ADMIN_FINANCE: "Admin/Finance",
    WARRANTY: "Warranty",
    COMMUNICATION: "Communication",
    OTHER: "Other",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-carsa-primary text-white">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-white/80 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </Link>
            <div className="h-6 w-px bg-white/20" />
            <h1 className="text-xl font-bold">Admin Dashboard</h1>
            <div className="h-6 w-px bg-white/20" />
            <Link
              href="/admin/simulations"
              className="flex items-center gap-2 text-white/80 hover:text-white text-sm"
            >
              <PlayCircle className="w-4 h-4" />
              AI Simulations
            </Link>
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

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-500 text-sm">Total Complaints</span>
              <MessageSquare className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {stats?.totalComplaints ?? "-"}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {stats?.todayComplaints ?? 0} today
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-500 text-sm">Open</span>
              <Clock className="w-5 h-5 text-yellow-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {stats?.openComplaints ?? "-"}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {stats?.escalatedCount ?? 0} escalated
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-500 text-sm">AI Resolved</span>
              <Bot className="w-5 h-5 text-carsa-primary" />
            </div>
            <p className="text-3xl font-bold text-carsa-primary">
              {stats?.aiResolvedPercent ?? 0}%
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {stats?.aiResolved ?? 0} complaints
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-500 text-sm">CSAT Score</span>
              <TrendingUp className="w-5 h-5 text-carsa-success" />
            </div>
            <p className="text-3xl font-bold text-carsa-success">
              {stats?.csatAverage?.toFixed(1) ?? "-"}/5
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Avg {stats?.avgResolutionTimeHours ?? "-"}h resolution
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">Filter by status:</span>
            <div className="flex gap-2">
              {["", "OPEN", "IN_PROGRESS", "ESCALATED", "RESOLVED"].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm transition-colors",
                    statusFilter === status
                      ? "bg-carsa-primary text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                >
                  {status || "All"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Complaints Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Recent Complaints</h2>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500">
              <RefreshCw className="w-8 h-8 mx-auto animate-spin mb-2" />
              Loading...
            </div>
          ) : complaints.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
              No complaints found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 text-left text-sm text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Reference</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Priority</th>
                    <th className="px-4 py-3">AI</th>
                    <th className="px-4 py-3">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {complaints.map((complaint) => (
                    <tr key={complaint.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm text-carsa-primary">
                          {complaint.referenceNumber}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900 text-sm">
                            {complaint.customerName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {complaint.customerEmail}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-700">
                          {categoryLabels[complaint.category] || complaint.category}
                        </span>
                        {complaint.vehicleInfo && (
                          <p className="text-xs text-gray-500">{complaint.vehicleInfo}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "px-2 py-1 rounded-full text-xs font-medium",
                            statusColors[complaint.status] || "bg-gray-100"
                          )}
                        >
                          {complaint.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "text-sm font-medium",
                            priorityColors[complaint.priority]
                          )}
                        >
                          {complaint.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {complaint.aiHandled ? (
                          <span className="flex items-center gap-1 text-carsa-success text-sm">
                            <CheckCircle className="w-4 h-4" />
                            Yes
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-gray-400 text-sm">
                            <Users className="w-4 h-4" />
                            No
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {formatDate(complaint.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
