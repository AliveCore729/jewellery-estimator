"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  Users,
  Phone,
  Mail,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/common/PageHeader";
import EmptyState from "@/components/common/EmptyState";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import CustomerForm from "@/components/customers/CustomerForm";
import { TableSkeleton } from "@/components/common/LoadingSkeleton";
import { formatDate, formatRelativeTime } from "@/lib/utils/formatters";

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  notes: string | null;
  estimateCount: number;
  lastEstimateDate: string | null;
  createdAt: string;
}

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [deleteCustomer, setDeleteCustomer] = useState<Customer | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const fetchCustomers = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      params.set("limit", "50");

      const res = await fetch(`/api/customers?${params}`);
      const data = await res.json();

      if (data.success) {
        setCustomers(data.data);
      }
    } catch {
      toast.error("Failed to load customers");
    } finally {
      setIsLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomers();
    }, 300); // Debounce search

    return () => clearTimeout(timer);
  }, [fetchCustomers]);

  const handleDelete = async () => {
    if (!deleteCustomer) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/customers/${deleteCustomer.id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to delete");
        return;
      }

      toast.success("Customer deleted");
      fetchCustomers();
    } catch {
      toast.error("Failed to delete customer");
    } finally {
      setIsDeleting(false);
      setDeleteCustomer(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Customers"
        description="Manage your customer database"
        action={
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setEditCustomer(null);
              setShowForm(true);
            }}
            className="btn-gold flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Customer
          </motion.button>
        }
      />

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone, or email..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-warm-200 bg-white font-inter text-sm
              text-navy placeholder:text-warm-400 transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold"
          />
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <TableSkeleton rows={5} />
      ) : customers.length === 0 ? (
        <div className="card-premium">
          <EmptyState
            icon={Users}
            title={search ? "No customers found" : "No customers yet"}
            description={
              search
                ? "Try a different search term"
                : "Add your first customer to start creating estimates."
            }
            action={
              !search ? (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowForm(true)}
                  className="btn-gold flex items-center gap-2 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add First Customer
                </motion.button>
              ) : undefined
            }
          />
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-premium"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-warm-100">
                  <th className="text-left text-xs font-inter font-medium text-warm-400 uppercase tracking-wider px-5 py-3">
                    Customer
                  </th>
                  <th className="text-left text-xs font-inter font-medium text-warm-400 uppercase tracking-wider px-5 py-3">
                    Phone
                  </th>
                  <th className="text-left text-xs font-inter font-medium text-warm-400 uppercase tracking-wider px-5 py-3 hidden md:table-cell">
                    Email
                  </th>
                  <th className="text-center text-xs font-inter font-medium text-warm-400 uppercase tracking-wider px-5 py-3">
                    Estimates
                  </th>
                  <th className="text-right text-xs font-inter font-medium text-warm-400 uppercase tracking-wider px-5 py-3 hidden sm:table-cell">
                    Last Estimate
                  </th>
                  <th className="text-right text-xs font-inter font-medium text-warm-400 uppercase tracking-wider px-5 py-3 w-16">
                    
                  </th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer, index) => (
                  <motion.tr
                    key={customer.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="border-b border-warm-50 hover:bg-warm-50/50 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <div
                        onClick={() => router.push(`/customers/${customer.id}`)}
                        className="cursor-pointer"
                      >
                        <p className="text-sm font-inter font-medium text-navy hover:text-gold transition-colors">
                          {customer.name}
                        </p>
                        {customer.address && (
                          <p className="text-xs text-warm-400 font-inter mt-0.5 truncate max-w-[200px]">
                            {customer.address}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5 text-sm text-warm-500 font-inter">
                        <Phone className="w-3.5 h-3.5 text-warm-300" />
                        {customer.phone}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      {customer.email ? (
                        <div className="flex items-center gap-1.5 text-sm text-warm-500 font-inter">
                          <Mail className="w-3.5 h-3.5 text-warm-300" />
                          <span className="truncate max-w-[180px]">{customer.email}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-warm-300 font-inter">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className="inline-flex items-center gap-1 text-sm font-inter text-navy">
                        <FileText className="w-3.5 h-3.5 text-warm-300" />
                        {customer.estimateCount}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right hidden sm:table-cell">
                      <span className="text-sm text-warm-400 font-inter">
                        {customer.lastEstimateDate
                          ? formatRelativeTime(customer.lastEstimateDate)
                          : "—"}
                      </span>
                    </td>
                                        <td className="px-5 py-3.5 text-right relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenDropdown(
                            openDropdown === customer.id ? null : customer.id
                          );
                        }}
                        className="p-1.5 rounded-lg hover:bg-warm-100 transition-colors"
                      >
                        <MoreHorizontal className="w-4 h-4 text-warm-400" />
                      </button>

                      {openDropdown === customer.id && (
                        <>
                          <div
                            className="fixed inset-0 z-30"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenDropdown(null);
                            }}
                          />
                          <motion.div
                            initial={{ opacity: 0, y: -5, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            className="fixed z-40 w-44 bg-surface border border-warm-200 
                              rounded-xl shadow-warm-lg py-1.5"
                            style={{
                              top: "auto",
                              right: "2rem",
                            }}
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenDropdown(null);
                                router.push(`/customers/${customer.id}`);
                              }}
                              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-navy 
                                hover:bg-warm-50 transition-colors font-inter"
                            >
                              <Eye className="w-3.5 h-3.5 text-warm-400" />
                              View Details
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenDropdown(null);
                                setEditCustomer(customer);
                                setShowForm(true);
                              }}
                              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-navy 
                                hover:bg-warm-50 transition-colors font-inter"
                            >
                              <Pencil className="w-3.5 h-3.5 text-warm-400" />
                              Edit
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenDropdown(null);
                                router.push(`/estimates/new?customer=${customer.id}`);
                              }}
                              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-navy 
                                hover:bg-warm-50 transition-colors font-inter"
                            >
                              <FileText className="w-3.5 h-3.5 text-warm-400" />
                              New Estimate
                            </button>
                            <div className="border-t border-warm-100 my-1" />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenDropdown(null);
                                setDeleteCustomer(customer);
                              }}
                              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-red-600 
                                hover:bg-red-50 transition-colors font-inter"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete
                            </button>
                          </motion.div>
                        </>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Customer Form Dialog */}
      <CustomerForm
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditCustomer(null);
        }}
        onSuccess={fetchCustomers}
        editData={editCustomer}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteCustomer}
        onClose={() => setDeleteCustomer(null)}
        onConfirm={handleDelete}
        title="Delete Customer"
        description={`Are you sure you want to delete "${deleteCustomer?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}