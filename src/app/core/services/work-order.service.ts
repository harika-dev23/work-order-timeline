import { Injectable } from "@angular/core";
import { WorkCenterDocument } from "../models/work-center.model";
import { WorkOrderDocument, WorkOrderStatus } from "../models/work-order.model";
@Injectable ({ providedIn: 'root'})
export class WorkOrderService {
    private workCenters: WorkCenterDocument[] = [
    {
        docId: 'wc-1',
        docType: 'workCenter',
        data: { name: 'Extrusion Line A' }
    },
    {
        docId: 'wc-2',
        docType: 'workCenter',
        data: { name: 'CNC Machine 1' }
    },
    {
        docId: 'wc-3',
        docType: 'workCenter',
        data: { name: 'Assembly Station' }
    },
    {
        docId: 'wc-4',
        docType: 'workCenter',
        data: { name: 'Quality Control' }
    },
    {
        docId: 'wc-5',
        docType: 'workCenter',
        data: { name: 'Packaging Line' }
    }
];

private today = new Date();
private d(offset: number): string {
  const date = new Date(this.today);
  date.setDate(date.getDate() + offset);
  return date.toISOString().split('T')[0];
}

private workOrders: WorkOrderDocument[] = [
  { docId: 'wo-1', docType: 'workOrder', data: { name: 'Order Alpha',   workCenterId: 'wc-1', status: 'complete',    startDate: this.d(-14), endDate: this.d(-7)  }},
  { docId: 'wo-2', docType: 'workOrder', data: { name: 'Order Beta',    workCenterId: 'wc-3', status: 'in-progress', startDate: this.d(-5),  endDate: this.d(3)   }},
  { docId: 'wo-3', docType: 'workOrder', data: { name: 'Order Gamma',   workCenterId: 'wc-3', status: 'open',        startDate: this.d(5),   endDate: this.d(12)  }},
  { docId: 'wo-4', docType: 'workOrder', data: { name: 'Order Delta',   workCenterId: 'wc-4', status: 'blocked',     startDate: this.d(-3),  endDate: this.d(4)   }},
  { docId: 'wo-5', docType: 'workOrder', data: { name: 'Order Epsilon', workCenterId: 'wc-2', status: 'open',        startDate: this.d(1),   endDate: this.d(8)   }},
  { docId: 'wo-6', docType: 'workOrder', data: { name: 'Order Zeta',    workCenterId: 'wc-5', status: 'complete',    startDate: this.d(-10), endDate: this.d(-4)  }},
  { docId: 'wo-7', docType: 'workOrder', data: { name: 'Order Eta',     workCenterId: 'wc-1', status: 'in-progress', startDate: this.d(0),   endDate: this.d(7)   }},
  { docId: 'wo-8', docType: 'workOrder', data: { name: 'Order Theta',   workCenterId: 'wc-5', status: 'open',        startDate: this.d(10),  endDate: this.d(17)  }},
];

getWorkCenters(): WorkCenterDocument[] {
    return this.workCenters;
}

getWorkOrders(): WorkOrderDocument[] {
    return this.workOrders;
}

addWorkOrder(order: WorkOrderDocument): void {
  this.workOrders.push(order);
}

updateWorkOrder(docId: string, updated: WorkOrderDocument['data']): void {
  const idx = this.workOrders.findIndex(o => o.docId === docId);
  if (idx !== -1) this.workOrders[idx].data = updated;
}

deleteWorkOrder(docId: string): void {
  this.workOrders = this.workOrders.filter(o => o.docId !== docId);
}

checkOverlap(workCenterId: string, startDate: string, endDate: string, excludeDocId?: string): boolean {
  const start = new Date(startDate).getTime();
  const end   = new Date(endDate).getTime();
  return this.workOrders
    .filter(o => o.data.workCenterId === workCenterId && o.docId !== excludeDocId)
    .some(o => start < new Date(o.data.endDate).getTime() && end > new Date(o.data.startDate).getTime());
}
}
