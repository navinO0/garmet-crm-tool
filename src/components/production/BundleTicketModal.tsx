"use client";

import React, { useRef } from "react";
import { useProductionStore } from "@/store/productionStore";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, QrCode, X, Scissors, Layers, CheckSquare } from "lucide-react";

interface BundleTicketModalProps {
  orderId: string;
  onClose: () => void;
}

export function BundleTicketModal({ orderId, onClose }: BundleTicketModalProps) {
  const { orders, bundles, settings, generateBundleTicketsForOrder } = useProductionStore();

  const order = orders.find((o) => o.id === orderId);
  const orderBundles = bundles.filter((b) => b.orderId === orderId);

  // If no bundles exist yet, auto-generate them
  const handleAutoGenerate = () => {
    generateBundleTicketsForOrder(orderId);
  };

  const handlePrint = () => {
    window.print();
  };

  if (!order) return null;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-zinc-900 print:p-0 print:max-w-none print:shadow-none">
        <DialogHeader className="print:hidden border-b border-zinc-200 dark:border-zinc-800 pb-4">
          <div className="flex justify-between items-center pr-6">
            <div>
              <DialogTitle className="text-lg font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                <Printer className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />
                Factory Floor Bundle Ticket Sheet: {order.orderNumber}
              </DialogTitle>
              <p className="text-xs text-zinc-500 mt-1">
                Print cut bundle tickets to attach to fabric bundles for sewing line scanning.
              </p>
            </div>
            <div className="flex gap-2">
              {orderBundles.length === 0 && (
                <Button size="sm" onClick={handleAutoGenerate} className="bg-blue-600 hover:bg-blue-700 text-white text-xs">
                  Generate Tickets from Matrix
                </Button>
              )}
              <Button size="sm" onClick={handlePrint} className="bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900">
                <Printer className="h-4 w-4 mr-2" /> Print Sheet
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Printable Ticket Content Container */}
        <div className="p-4 space-y-6 print:p-2 font-sans">
          {orderBundles.length === 0 ? (
            <div className="text-center py-12 text-zinc-400 text-sm space-y-3">
              <Scissors className="h-10 w-10 mx-auto text-zinc-300" />
              <p>No bundle tickets generated yet for Order {order.orderNumber}.</p>
              <Button onClick={handleAutoGenerate} size="sm" className="bg-blue-600 text-white">
                Generate Cut Tickets Now
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-2 print:gap-3">
              {orderBundles.map((ticket, idx) => (
                <div
                  key={ticket.id}
                  className="border-2 border-dashed border-zinc-400 p-4 rounded-lg bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 space-y-3 relative print:border-black print:bg-white print:text-black print:break-inside-avoid"
                >
                  {/* Top Bar */}
                  <div className="flex justify-between items-start border-b border-zinc-300 dark:border-zinc-800 pb-2 print:border-black">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 print:text-black">
                        {settings.companyName || "Garment Factory"} Ticket #{idx + 1}
                      </span>
                      <h3 className="text-base font-extrabold font-mono tracking-tight text-zinc-950 dark:text-zinc-50 print:text-black">
                        {ticket.bundleNumber}
                      </h3>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 print:text-black">
                        {ticket.orderNumber}
                      </span>
                      <span className="block text-[10px] text-zinc-500 font-mono">
                        {new Date(ticket.cutDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Product Details Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase block font-semibold print:text-black">Style Name</span>
                      <span className="font-bold text-zinc-900 dark:text-zinc-100 print:text-black">{ticket.productName}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase block font-semibold print:text-black">Color / Shade</span>
                      <span className="font-bold text-zinc-900 dark:text-zinc-100 print:text-black">{ticket.color}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase block font-semibold print:text-black">Garment Size</span>
                      <span className="font-extrabold text-sm text-blue-600 dark:text-blue-400 print:text-black">{ticket.size}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase block font-semibold print:text-black">Bundle Quantity</span>
                      <span className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400 print:text-black">{ticket.quantity} Pcs</span>
                    </div>
                  </div>

                  {/* Simulated Barcode Banner */}
                  <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 print:border-black flex items-center justify-between">
                    <div>
                      <div className="font-mono text-xs font-bold tracking-widest bg-zinc-200 dark:bg-zinc-800 print:bg-transparent px-2 py-1 rounded inline-block">
                        ||||| ||| |||| |||||| ||| {ticket.barcode.slice(-4)}
                      </div>
                      <span className="block text-[9px] font-mono text-zinc-500 mt-0.5">{ticket.barcode}</span>
                    </div>
                    <div className="text-right text-[10px] text-zinc-500">
                      <span className="font-semibold text-zinc-700 dark:text-zinc-300 print:text-black block">Station Signatures</span>
                      <span>Cut [  ] Sew [  ] QC [  ]</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
