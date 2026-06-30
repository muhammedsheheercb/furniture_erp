"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import { toast } from "sonner";
import { 
  Users, Plus, Phone, Search, Hammer, Clock, 
  PlayCircle, CheckCircle2, UserCheck, RefreshCw,
  ChevronLeft, ChevronRight, Calendar
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";

import { useDateFilter } from "@/context/DateFilterContext";

interface WorkerStats {
  pending: number;
  processing: number;
  finished: number;
  total: number;
}

interface IWorker {
  _id: string;
  name: string;
  contactNumber: string;
  stats?: WorkerStats;
  createdAt: string;
}

export default function ProductionWorkersPage() {
  const { startDate, endDate } = useDateFilter();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";
  const perms = (session?.user?.permissions as any)?.production;
  const canCreate = isAdmin || perms?.create;

  const [workers, setWorkers] = useState<IWorker[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "processing" | "finished">("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [saving, setSaving] = useState(false);

  // Field-level error messages
  const [nameError, setNameError] = useState("");
  const [contactError, setContactError] = useState("");

  // Details Modal
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedDetailsWorker, setSelectedDetailsWorker] = useState<IWorker | null>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobsPage, setJobsPage] = useState(1);
  const [jobsTotalPages, setJobsTotalPages] = useState(1);
  const [jobsTotalCount, setJobsTotalCount] = useState(0);

  const fetchWorkerJobs = async (workerId: string, page: number) => {
    setJobsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "5",
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
      });
      const res = await axios.get(`/api/workers/${workerId}/work?${params}`);
      if (res.data.success) {
        setJobs(res.data.data || []);
        setJobsTotalPages(res.data.pagination.totalPages || 1);
        setJobsTotalCount(res.data.pagination.total || 0);
      }
    } catch {
      toast.error("Failed to load worker jobs");
    } finally {
      setJobsLoading(false);
    }
  };

  useEffect(() => {
    if (detailsModalOpen && selectedDetailsWorker) {
      fetchWorkerJobs(selectedDetailsWorker._id, jobsPage);
    }
  }, [detailsModalOpen, selectedDetailsWorker, jobsPage, startDate, endDate]);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  const fetchWorkers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search: debouncedSearch,
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
      });
      const res = await axios.get(`/api/workers?${params}`);
      if (res.data.success) {
        setWorkers(res.data.data);
      }
    } catch {
      toast.error("Failed to load workers list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, [debouncedSearch, startDate, endDate]);

  // Handle form submission with proper validation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameError("");
    setContactError("");

    const trimmedName = name.trim();
    const trimmedContact = contactNumber.trim();

    let hasError = false;
    if (!trimmedName) {
      setNameError("Worker Name is required");
      hasError = true;
    } else if (trimmedName.length < 2) {
      setNameError("Worker Name must be at least 2 characters long");
      hasError = true;
    }

    if (!trimmedContact) {
      setContactError("Contact Number is required");
      hasError = true;
    } else if (!/^\+?[\d\s-]{7,15}$/.test(trimmedContact)) {
      setContactError("Enter a valid contact number (7 to 15 digits)");
      hasError = true;
    }

    if (hasError) return;

    setSaving(true);
    try {
      const res = await axios.post("/api/workers", {
        name: trimmedName,
        contactNumber: trimmedContact,
      });
      if (res.data.success) {
        toast.success("Worker created successfully!");
        setModalOpen(false);
        setName("");
        setContactNumber("");
        fetchWorkers();
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.error || "Failed to create worker";
      toast.error(errMsg);
    } finally {
      setSaving(false);
    }
  };

  // Filter local state based on work status
  const filteredWorkers = workers.filter(worker => {
    if (statusFilter === "all") return true;
    if (statusFilter === "pending") return (worker.stats?.pending || 0) > 0;
    if (statusFilter === "processing") return (worker.stats?.processing || 0) > 0;
    if (statusFilter === "finished") return (worker.stats?.finished || 0) > 0;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-[#1A1210]">Production Workers</h2>
          <p className="text-[#7A6055]">Manage manufacturing staff and track their work assignments.</p>
        </div>
        {canCreate && (
          <Button
            onClick={() => {
              setName("");
              setContactNumber("");
              setNameError("");
              setContactError("");
              setModalOpen(true);
            }}
            className="bg-[#2C1810] hover:bg-[#1A0F0A] text-white flex items-center gap-2 self-start sm:self-auto"
          >
            <Plus size={18} /> New Worker
          </Button>
        )}
      </div>

      {/* Filters and Search */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        {/* Search */}
        <div className="relative md:col-span-2">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#A89080]">
            <Search size={18} />
          </span>
          <input
            type="text"
            placeholder="Search workers by name or contact number..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full border border-[#E5DDD5] rounded-xl pl-10 pr-4 py-2.5 text-sm bg-white text-[#1A1210] focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/40 placeholder-[#A89080] font-medium"
          />
        </div>

        {/* Refresh Button */}
        <div className="flex justify-end">
          <button
            onClick={fetchWorkers}
            className="p-2.5 rounded-xl border border-[#E5DDD5] bg-white text-[#7A6055] hover:text-[#1A1210] hover:border-[#C9A84C] transition-colors"
            title="Refresh list"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Tabs for Work Status Filter */}
      <div className="flex bg-[#F5F2EA] p-1 rounded-xl gap-1 overflow-x-auto">
        {(["all", "pending", "processing", "finished"] as const).map(f => {
          const count = workers.filter(w => {
            if (f === "all") return true;
            if (f === "pending") return (w.stats?.pending || 0) > 0;
            if (f === "processing") return (w.stats?.processing || 0) > 0;
            if (f === "finished") return (w.stats?.finished || 0) > 0;
          }).length;

          return (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap uppercase tracking-wider ${
                statusFilter === f
                  ? "bg-[#2C1810] text-white shadow-sm"
                  : "text-[#7A6055] hover:text-[#1A1210]"
              }`}
            >
              {f === "all" ? "All Workers" : f === "processing" ? "Active Work" : `${f} Work`} ({count})
            </button>
          );
        })}
      </div>

      {/* Workers Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C9A84C]"></div>
        </div>
      ) : (
        <>
          {filteredWorkers.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#E5DDD5] py-20 text-center">
              <Users size={48} className="mx-auto text-[#E5DDD5] mb-4" />
              <p className="text-[#A89080] font-medium">No workers found matching selected filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredWorkers.map(worker => (
                <div 
                  key={worker._id} 
                  onClick={() => {
                    setSelectedDetailsWorker(worker);
                    setJobsPage(1);
                    setDetailsModalOpen(true);
                  }}
                  className="bg-white rounded-2xl border border-[#E5DDD5] hover:border-[#C9A84C] transition-all duration-300 p-5 shadow-sm hover:shadow-md flex flex-col justify-between cursor-pointer group"
                >
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-xl bg-[#FAF8F6] flex items-center justify-center text-[#8B5E3C] shrink-0 border border-[#E5DDD5]">
                        <UserCheck size={24} />
                      </div>
                      <div className="space-y-1 min-w-0">
                        <h4 className="font-bold text-[#1A1210] text-lg truncate" title={worker.name}>
                          {worker.name}
                        </h4>
                        <div className="flex items-center gap-1.5 text-sm text-[#7A6055]">
                          <Phone size={14} className="text-[#A89080]" />
                          <span className="font-mono">{worker.contactNumber}</span>
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2 py-3 px-4 bg-[#FAF8F6] rounded-xl border border-[#E5DDD5]">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-[#7A6055] mb-0.5">
                          <Clock size={12} className="text-gray-400" />
                          <span className="text-[10px] font-bold uppercase tracking-wider">Pending</span>
                        </div>
                        <p className="text-lg font-extrabold text-[#1A1210]">{worker.stats?.pending || 0}</p>
                      </div>
                      <div className="text-center border-x border-[#E5DDD5]">
                        <div className="flex items-center justify-center gap-1 text-[#7A6055] mb-0.5">
                          <PlayCircle size={12} className="text-amber-500" />
                          <span className="text-[10px] font-bold uppercase tracking-wider">Active</span>
                        </div>
                        <p className="text-lg font-extrabold text-[#1A1210]">{worker.stats?.processing || 0}</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-[#7A6055] mb-0.5">
                          <CheckCircle2 size={12} className="text-emerald-500" />
                          <span className="text-[10px] font-bold uppercase tracking-wider">Finished</span>
                        </div>
                        <p className="text-lg font-extrabold text-[#1A1210]">{worker.stats?.finished || 0}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-[#F0EBE5] flex items-center justify-between text-xs text-[#A89080]">
                    <span>Joined {new Date(worker.createdAt).toLocaleDateString()}</span>
                    <span className="font-bold text-[#8B5E3C] bg-[#FAF8F6] px-2.5 py-1 rounded-full border border-[#E5DDD5]">
                      Total Jobs: {worker.stats?.total || 0}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Create Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add New Production Worker"
        size="md"
        footer={
          <div className="flex gap-3 justify-end w-full">
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} loading={saving} className="bg-[#2C1810] hover:bg-[#1A0F0A] text-white">
              Create Worker
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <p className="text-sm text-[#7A6055]">
            Add a craftsman or workshop worker to assign production orders and monitor manufacturing pipelines.
          </p>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-[#7A6055] mb-1">
                Worker Name *
              </label>
              <input
                type="text"
                placeholder="Enter worker's full name"
                value={name}
                onChange={e => setName(e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 text-sm bg-white text-[#1A1210] focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/40 font-medium ${
                  nameError ? "border-rose-500 ring-1 ring-rose-500/20" : "border-[#E5DDD5]"
                }`}
                required
              />
              {nameError && <p className="text-xs text-rose-500 mt-1 font-medium">{nameError}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#7A6055] mb-1">
                Contact / Mobile Number *
              </label>
              <input
                type="text"
                placeholder="e.g. +968 9123 4567"
                value={contactNumber}
                onChange={e => setContactNumber(e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 text-sm bg-white text-[#1A1210] focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/40 font-medium ${
                  contactError ? "border-rose-500 ring-1 ring-rose-500/20" : "border-[#E5DDD5]"
                }`}
                required
              />
              {contactError && <p className="text-xs text-rose-500 mt-1 font-medium">{contactError}</p>}
            </div>
          </div>
        </form>
      </Modal>

      {/* Details & Jobs Modal */}
      <Modal
        open={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        title={`${selectedDetailsWorker?.name || "Worker"}'s Work Details`}
        size="lg"
        footer={
          <div className="flex justify-end w-full">
            <Button variant="outline" onClick={() => setDetailsModalOpen(false)}>
              Close
            </Button>
          </div>
        }
      >
        <div className="space-y-6 py-2">
          {/* Worker Info Card */}
          {selectedDetailsWorker && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-[#FAF8F6] rounded-xl border border-[#E5DDD5] gap-4">
              <div>
                <h3 className="text-lg font-bold text-[#1A1210]">{selectedDetailsWorker.name}</h3>
                <p className="text-sm text-[#7A6055] flex items-center gap-1.5 mt-0.5">
                  <Phone size={14} className="text-[#A89080]" />
                  <span className="font-mono">{selectedDetailsWorker.contactNumber}</span>
                </p>
              </div>
              <div className="flex gap-4">
                <div className="text-center bg-white px-3 py-1.5 rounded-lg border border-[#E5DDD5] min-w-[70px]">
                  <p className="text-[10px] uppercase font-bold text-gray-400">Pending</p>
                  <p className="text-sm font-extrabold text-[#1A1210]">{selectedDetailsWorker.stats?.pending || 0}</p>
                </div>
                <div className="text-center bg-white px-3 py-1.5 rounded-lg border border-[#E5DDD5] min-w-[70px]">
                  <p className="text-[10px] uppercase font-bold text-amber-500">Active</p>
                  <p className="text-sm font-extrabold text-[#1A1210]">{selectedDetailsWorker.stats?.processing || 0}</p>
                </div>
                <div className="text-center bg-white px-3 py-1.5 rounded-lg border border-[#E5DDD5] min-w-[70px]">
                  <p className="text-[10px] uppercase font-bold text-emerald-500">Finished</p>
                  <p className="text-sm font-extrabold text-[#1A1210]">{selectedDetailsWorker.stats?.finished || 0}</p>
                </div>
              </div>
            </div>
          )}

          {/* Jobs List Section */}
          <div className="space-y-4">
            <h4 className="font-bold text-[#1A1210] text-sm uppercase tracking-wider flex items-center gap-2">
              <Hammer size={16} className="text-[#8B5E3C]" />
              Assigned Production Jobs ({jobsTotalCount})
            </h4>

            {jobsLoading ? (
              <div className="flex items-center justify-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C9A84C]"></div>
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-[#E5DDD5] rounded-xl bg-white">
                <p className="text-[#A89080] text-sm">No production jobs assigned to this worker yet.</p>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {jobs.map((job) => (
                    <div 
                      key={job._id}
                      className="p-4 bg-white rounded-xl border border-[#E5DDD5] hover:border-[#C9A84C]/50 transition-colors space-y-3"
                    >
                      <div className="flex justify-between items-start gap-2 flex-wrap">
                        <div>
                          <span className="text-xs font-bold text-[#A89080] uppercase tracking-wider block">Order Reference</span>
                          <span className="font-bold text-[#1A1210]">{job.saleNumber}</span>
                          <span className="text-[#7A6055] text-xs ml-2">({job.customerName})</span>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                          job.status === "finished" 
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : job.status === "processing"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-gray-50 text-gray-700 border border-gray-200"
                        }`}>
                          {job.status === "processing" ? "Active" : job.status}
                        </span>
                      </div>

                      {/* Items List */}
                      <div className="bg-[#FAF8F6] p-3 rounded-lg border border-[#F0EBE5] space-y-1">
                        {job.items?.map((it: any, idx: number) => (
                          <div key={idx} className="flex justify-between text-xs text-[#1A1210]">
                            <span className="font-semibold">{it.itemName || it.productName}</span>
                            <span className="text-[#7A6055]">
                              {it.color && `Color: ${it.color}`} 
                              {it.size && ` | Size: ${it.size}`} 
                              {` | Qty: ${it.quantity}`}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-between items-center text-xs text-[#7A6055] pt-1">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} className="text-[#A89080]" />
                          Deadline: {job.deliveryDate ? new Date(job.deliveryDate).toLocaleDateString() : "—"}
                        </span>
                        <span>Last updated {new Date(job.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination Controls */}
                {jobsTotalPages > 1 && (
                  <div className="flex items-center justify-between pt-4 border-t border-[#F0EBE5]">
                    <span className="text-xs text-[#7A6055]">
                      Showing page <span className="font-bold text-[#1A1210]">{jobsPage}</span> of <span className="font-bold text-[#1A1210]">{jobsTotalPages}</span>
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="xs"
                        disabled={jobsPage === 1}
                        onClick={() => setJobsPage(prev => Math.max(prev - 1, 1))}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs"
                      >
                        <ChevronLeft size={14} /> Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="xs"
                        disabled={jobsPage === jobsTotalPages}
                        onClick={() => setJobsPage(prev => Math.min(prev + 1, jobsTotalPages))}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs"
                      >
                        Next <ChevronRight size={14} />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
