const fs = require('fs');

const path = '/home/sheheer/freelance/furniture_erp/src/app/api/sales/route.ts';
let code = fs.readFileSync(path, 'utf8');

// We need to replace the entire section from "// 2 — decrease item quantities and batches (manual or FIFO)"
// down to "// 7 — if converted from quotation, update quotation"

const startMarker = "// 2 — decrease item quantities and batches (manual or FIFO)";
const endMarker = "// 7 — if converted from quotation, update quotation";

const startIndex = code.indexOf(startMarker);
const endIndex = code.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
  console.error("Markers not found!");
  process.exit(1);
}

const replacement = `// 2 — Split items into manufactured and direct-buy, and decrease stock for direct-buy
    const directBuyItems: any[] = [];
    const manufacturedItems: any[] = [];
    
    for (const saleItem of body.items) {
      if (!saleItem.itemId) {
        // Custom items not in DB, assume direct buy so it skips production unless it's a conversion?
        // Let's assume manufactured if it's a quotation conversion, to be safe, or direct buy.
        if (body.isDirect) {
          directBuyItems.push(saleItem);
        } else {
          manufacturedItems.push(saleItem);
        }
        continue;
      }
      
      const item = await Item.findById(saleItem.itemId).session(dbSession);
      if (!item) {
        if (body.isDirect) directBuyItems.push(saleItem);
        else manufacturedItems.push(saleItem);
        continue;
      }
      
      // If it's a direct sale (not from quotation), everything acts as direct buy (already in stock).
      // Otherwise, if it's from quotation and isManufactured is true, it goes to production.
      if (!body.isDirect && item.isManufactured) {
        manufacturedItems.push(saleItem);
        continue; // Do NOT deduct stock here. Stock will be added when production finishes.
      }
      
      // Otherwise, it's a direct buy item (or a direct sale of a manufactured item already in stock)
      directBuyItems.push(saleItem);

      if ((item.quantity || 0) < saleItem.quantity) {
        throw new Error(
          \`Insufficient stock for item: \${saleItem.itemName} (Available: \${item.quantity || 0}, Requested: \${saleItem.quantity})\`,
        );
      }

      // Update total quantity
      item.quantity = (item.quantity || 0) - saleItem.quantity;

      // Update batches (Manual Selection if provided, else FIFO)
      if (item.batches && item.batches.length > 0) {
        if (saleItem.batch) {
          const batch = item.batches.find((b: any) => b.batchNumber === saleItem.batch);
          if (batch) {
            batch.quantity -= saleItem.quantity;
          } else {
            let remainingToDeduct = saleItem.quantity;
            item.batches.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
            for (const b of item.batches) {
              if (remainingToDeduct <= 0) break;
              const deductFromThisBatch = Math.min(b.quantity, remainingToDeduct);
              b.quantity -= deductFromThisBatch;
              remainingToDeduct -= deductFromThisBatch;
            }
          }
        } else {
          let remainingToDeduct = saleItem.quantity;
          item.batches.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          for (const batch of item.batches) {
            if (remainingToDeduct <= 0) break;
            const deductFromThisBatch = Math.min(batch.quantity, remainingToDeduct);
            batch.quantity -= deductFromThisBatch;
            remainingToDeduct -= deductFromThisBatch;
          }
        }
      }

      await item.save({ session: dbSession });
    }

    // 3 — update customer outstanding for any sale that has an unpaid balance
    const outstandingAmount = Number(body.total) - Number(body.advancePaid || 0);
    if (outstandingAmount > 0) {
      const customer = await Customer.findById(body.customerId).session(dbSession);
      if (customer) {
        if (!customer.balanceHistory) customer.balanceHistory = [];
        customer.creditBalance = (customer.creditBalance || 0) + outstandingAmount;
        customer.balanceHistory.push({
          date: new Date(),
          amount: outstandingAmount,
          type: "adjustment",
          paymentMethod: body.paymentType,
          note: \`Sale Entry — \${saleNumber}\`,
        });
        await customer.save({ session: dbSession });
      }
    }
    
    // Note: We no longer reserve materials here (3.5). Materials are deducted when Production starts in PUT /api/production/[id]

    // 4 — create production entry for manufactured items
    if (manufacturedItems.length > 0) {
      await Production.create(
        [
          {
            saleId: sale._id,
            saleNumber: sale.saleNumber,
            customerId: sale.customerId,
            customerName: sale.customerName,
            items: manufacturedItems.map((it: any) => ({
              itemName: it.itemName,
              quantity: it.quantity,
              color: it.color,
              material: it.material,
              size: it.size,
              dimensions: it.dimensions,
              bom: it.bom,
              pricing: it.pricing,
              variants: it.variants,
              status: "pending", // manufactured items always start as pending
            })),
            status: "pending",
            remarks: body.remarks || "",
            deliveryDate: body.deliveryDate ? new Date(body.deliveryDate) : undefined,
          },
        ],
        { session: dbSession },
      );
    }

    // 5 — create a delivery entry for direct buy items immediately
    if (directBuyItems.length > 0) {
      await Delivery.create(
        [
          {
            saleId: sale._id,
            saleNumber: sale.saleNumber,
            customerId: sale.customerId,
            customerName: sale.customerName,
            items: directBuyItems.map((it: any) => ({
              itemName: it.itemName,
              quantity: it.quantity,
              status: "pending",
            })),
            status: "pending",
            deliveryDate: body.deliveryDate ? new Date(body.deliveryDate) : undefined,
            deliveryAddress: body.deliveryAddress || "",
            remarks: body.remarks || "",
          },
        ],
        { session: dbSession },
      );
    }

    `;

const newCode = code.substring(0, startIndex) + replacement + code.substring(endIndex);
fs.writeFileSync(path, newCode);
console.log("Updated sales API.");
