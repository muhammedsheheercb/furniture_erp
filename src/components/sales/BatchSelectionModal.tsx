"use client";
import React from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { IBatch, IItem } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import { Calendar, Package, Tag } from "lucide-react";

interface BatchSelectionModalProps {
    open: boolean;
    onClose: () => void;
    item: IItem | null;
    onSelect: (batch: IBatch) => void;
}

export default function BatchSelectionModal({ open, onClose, item, onSelect }: BatchSelectionModalProps) {
    if (!item) return null;

    const availableBatches = (item.batches || []).filter(b => b.quantity > 0);

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={`Select Batch for: ${item.name}`}
            size="lg"
        >
            <div className="flex flex-col gap-4">
                <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 flex items-center justify-between">
                    <div className="text-sm font-medium text-indigo-900">Total Available Stock</div>
                    <div className="text-xl font-bold text-indigo-600">{item.quantity}</div>
                </div>

                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 px-1">Available Batches (FIFO Recommended)</div>
                
                {availableBatches.length === 0 ? (
                    <div className="py-8 text-center text-gray-400 italic bg-gray-50 rounded-xl border-2 border-dashed border-gray-100">
                        No active batches found for this item.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-2.5">
                        {availableBatches.map((batch, idx) => {
                            const isExpired = batch.expiryDate && new Date(batch.expiryDate) < new Date();
                            const isNearExpiry = batch.expiryDate && !isExpired && 
                                (new Date(batch.expiryDate).getTime() - new Date().getTime()) < (30 * 24 * 60 * 60 * 1000); // 30 days

                            return (
                                <button
                                    key={idx}
                                    onClick={() => onSelect(batch)}
                                    className="group text-left p-4 rounded-2xl border-2 border-gray-100 bg-white hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-200 relative overflow-hidden"
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                                    <Tag size={14} />
                                                </div>
                                                <span className="font-bold text-gray-900">{batch.batchNumber || "UNNAMED BATCH"}</span>
                                                <span className="text-[10px] font-mono text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100 group-hover:bg-white/10 group-hover:border-white/20">#{batch.purchaseNumber || "N/A"}</span>
                                            </div>
                                            
                                            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
                                                <div className="flex items-center gap-1.5 text-gray-500">
                                                    <Calendar size={12} className="text-gray-400" />
                                                    <span>Exp: <span className={`font-semibold ${isExpired ? 'text-red-500' : isNearExpiry ? 'text-amber-500' : 'text-gray-700'}`}>
                                                        {batch.expiryDate ? formatDate(batch.expiryDate) : "No Date"}
                                                    </span></span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-gray-500">
                                                    <Package size={12} className="text-gray-400" />
                                                    <span>In Stock: <span className="font-bold text-gray-800">{batch.quantity}</span></span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end gap-1 px-4 border-l border-gray-100 h-full justify-center">
                                            <div className="text-[10px] text-gray-400 uppercase tracking-tighter">Current Sale Price</div>
                                            <div className="text-lg font-black text-indigo-600 font-mono">{formatCurrency(batch.salePrice)}</div>
                                        </div>
                                    </div>

                                    {idx === 0 && (
                                        <div className="absolute top-0 right-0">
                                            <div className="bg-emerald-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-bl-lg shadow-sm">
                                                OLDEST FIRST
                                            </div>
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}
                
                <div className="mt-2 text-center">
                    <Button variant="ghost" onClick={onClose} className="text-gray-400 hover:text-gray-600 text-sm">
                        Cancel selection
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
