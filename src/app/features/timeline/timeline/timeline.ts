import { Component, OnInit, HostListener, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WorkCenterDocument } from '../../../core/models/work-center.model';
import { WorkOrderDocument } from '../../../core/models/work-order.model';
import { WorkOrderService } from '../../../core/services/work-order.service';
import { CreateEditPanelComponent } from '../create-edit-panel/create-edit-panel';

export type ZoomLevel = 'day' | 'week' | 'month';

@Component({
  selector: 'app-timeline',
  standalone: true,
  imports: [CommonModule, FormsModule, CreateEditPanelComponent],
  templateUrl: './timeline.html',
  styleUrl: './timeline.scss',
})
export class TimelineComponent implements OnInit {

  @ViewChild('rightPanel') rightPanelRef!: ElementRef<HTMLElement>;
  workCenters: WorkCenterDocument[] = [];
  workOrders: WorkOrderDocument[] = [];
  zoomLevel: ZoomLevel = 'day';
  dayWidth = 60;
  visibleStartDate!: Date;
  visibleEndDate!: Date;
  visibleDates: Date[] = [];
  panelOpen = false;
  panelMode: 'create' | 'edit' = 'create';
  panelPrefillDate: string | null = null;
  panelPrefillWorkCenterId: string | null = null;
  panelEditingOrder: WorkOrderDocument | null = null;
  openMenuOrderId: string | null = null;

  constructor(private workOrderService: WorkOrderService) {}

  ngOnInit(): void {
    this.workCenters = this.workOrderService.getWorkCenters();
    this.workOrders  = this.workOrderService.getWorkOrders();
    this.generateVisibleRange();
  }

  onZoomChange(): void {
    this.generateVisibleRange();
  }

  generateVisibleRange(): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let bufferDays: number;

    if (this.zoomLevel === 'day') {
      this.dayWidth = 60;
      bufferDays = 21;
    } else if (this.zoomLevel === 'week') {
      this.dayWidth = 20;
      bufferDays = 90;
    } else {
      this.dayWidth = 6;
      bufferDays = 180;
    }

    this.visibleStartDate = new Date(today);
    this.visibleStartDate.setDate(today.getDate() - bufferDays);

    this.visibleEndDate = new Date(today);
    this.visibleEndDate.setDate(today.getDate() + bufferDays);

    this.visibleDates = [];
    let current = new Date(this.visibleStartDate);
    while (current <= this.visibleEndDate) {
      this.visibleDates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
  }

  getDateLabel(date: Date): string {
    if (this.zoomLevel === 'day') {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else if (this.zoomLevel === 'week') {
      return date.getDay() === 1
        ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : '';
    } else {
      return date.getDate() === 1
        ? date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
        : '';
    }
  }

  isColumnStart(date: Date): boolean {
    if (this.zoomLevel === 'week')  return date.getDay() === 1;
    if (this.zoomLevel === 'month') return date.getDate() === 1;
    return false;
  }

  getTodayLeftPx(): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = this.getDateDifferenceInDays(today, this.visibleStartDate);
    return diff * this.dayWidth;
  }

  getOrdersForWorkCenter(workCenterId: string): WorkOrderDocument[] {
    return this.workOrders.filter(o => o.data.workCenterId === workCenterId);
  }

  getDateDifferenceInDays(date1: Date, date2: Date): number {
    const msPerDay = 1000 * 60 * 60 * 24;
    return Math.floor((date1.getTime() - date2.getTime()) / msPerDay);
  }

  getLeftPosition(order: WorkOrderDocument): number {
    const start = new Date(order.data.startDate);
    start.setHours(0, 0, 0, 0);
    const diff = this.getDateDifferenceInDays(start, this.visibleStartDate);
    return diff * this.dayWidth;
  }

  getBarWidth(order: WorkOrderDocument): number {
    const start = new Date(order.data.startDate);
    const end   = new Date(order.data.endDate);
    const duration = this.getDateDifferenceInDays(end, start) + 1;
    return duration * this.dayWidth;
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'open': 'Open',
      'in-progress': 'In Progress',
      'complete': 'Complete',
      'blocked': 'Blocked'
    };
    return labels[status] ?? status;
  }

  onTimelineRowClick(wc: WorkCenterDocument, event: MouseEvent): void {
  const target = event.currentTarget as HTMLElement;
  const rect   = target.getBoundingClientRect();
  const clickX = event.clientX - rect.left;
  const dayIndex = Math.floor(clickX / this.dayWidth);
  const clickedDate = new Date(this.visibleStartDate);
  clickedDate.setDate(clickedDate.getDate() + dayIndex);

  this.panelMode               = 'create';
  this.panelPrefillDate        = clickedDate.toISOString().split('T')[0];
  this.panelPrefillWorkCenterId = wc.docId;
  this.panelEditingOrder       = null;
  this.panelOpen               = true;
}

onPanelSaved(): void {
  this.workOrders = this.workOrderService.getWorkOrders();
  this.panelOpen  = false;
}

onPanelClosed(): void {
  this.panelOpen = false;
}

toggleMenu(order: WorkOrderDocument, event: MouseEvent): void {
  event.stopPropagation();
  this.openMenuOrderId = this.openMenuOrderId === order.docId ? null : order.docId;
}

onEditOrder(order: WorkOrderDocument, event: MouseEvent): void {
  event.stopPropagation();
  this.openMenuOrderId   = null;
  this.panelMode         = 'edit';
  this.panelEditingOrder = order;
  this.panelOpen         = true;
}

onDeleteOrder(order: WorkOrderDocument, event: MouseEvent): void {
  event.stopPropagation();
  this.openMenuOrderId = null;
  this.workOrderService.deleteWorkOrder(order.docId);
  this.workOrders = this.workOrderService.getWorkOrders();
}

scrollToToday(): void {
  const todayPx = this.getTodayLeftPx();
  const panel = this.rightPanelRef?.nativeElement;
  if (panel) {
    panel.scrollLeft = todayPx - panel.clientWidth / 2;
  }
}

@HostListener('document:click')
onDocumentClick(): void {
  this.openMenuOrderId = null;
}
}
