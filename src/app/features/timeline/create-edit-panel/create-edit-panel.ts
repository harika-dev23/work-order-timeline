import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { WorkOrderService } from '../../../core/services/work-order.service';
import { WorkOrderDocument, WorkOrderStatus } from '../../../core/models/work-order.model';
import { WorkCenterDocument } from '../../../core/models/work-center.model';

function endAfterStart(group: AbstractControl): ValidationErrors | null {
  const start = group.get('startDate')?.value;
  const end   = group.get('endDate')?.value;
  if (!start || !end) return null;
  return new Date(end) <= new Date(start) ? { endBeforeStart: true } : null;
}

@Component({
  selector: 'app-create-edit-panel',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-edit-panel.html',
  styleUrl: './create-edit-panel.scss'
})
export class CreateEditPanelComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() mode: 'create' | 'edit' = 'create';
  @Input() prefillDate: string | null = null;
  @Input() prefillWorkCenterId: string | null = null;
  @Input() editingOrder: WorkOrderDocument | null = null;
  @Input() workCenters: WorkCenterDocument[] = [];

  @Output() closed = new EventEmitter<void>();
  @Output() saved  = new EventEmitter<void>();

  overlapError: string | null = null;

  form = new FormGroup({
    name:      new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    status:    new FormControl<WorkOrderStatus>('open', { nonNullable: true, validators: [Validators.required] }),
    startDate: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    endDate:   new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  }, { validators: endAfterStart });

  constructor(private svc: WorkOrderService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen']?.currentValue === true) {
      this.overlapError = null;
      if (this.mode === 'edit' && this.editingOrder) {
        const d = this.editingOrder.data;
        this.form.setValue({ name: d.name, status: d.status, startDate: d.startDate, endDate: d.endDate });
      } else {
        const start = this.prefillDate ?? this.todayIso();
        const end   = this.addDays(start, 7);
        this.form.reset({ name: '', status: 'open', startDate: start, endDate: end });
      }
    }
  }

  get isEdit()         { return this.mode === 'edit'; }
  get submitLabel()    { return this.isEdit ? 'Save' : 'Create'; }
  get endBeforeStart() { return !!(this.form.errors?.['endBeforeStart'] && this.form.get('endDate')?.touched); }

  hasError(field: string): boolean {
    const c = this.form.get(field);
    return !!(c?.invalid && c.touched);
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    const { name, status, startDate, endDate } = this.form.getRawValue();
    const workCenterId = this.isEdit
      ? this.editingOrder!.data.workCenterId
      : (this.prefillWorkCenterId ?? this.workCenters[0]?.docId ?? '');

    const hasOverlap = this.svc.checkOverlap(
      workCenterId, startDate, endDate,
      this.isEdit ? this.editingOrder!.docId : undefined
    );

    if (hasOverlap) {
      this.overlapError = 'This order overlaps with an existing order on the same work center.';
      return;
    }

    const orderData: WorkOrderDocument['data'] = { name, workCenterId, status, startDate, endDate };

    if (this.isEdit) {
      this.svc.updateWorkOrder(this.editingOrder!.docId, orderData);
    } else {
      this.svc.addWorkOrder({ docId: 'wo-' + Date.now(), docType: 'workOrder', data: orderData });
    }

    this.saved.emit();
  }

  onCancel(): void        { this.closed.emit(); }
  onOverlayClick(): void  { this.closed.emit(); }

  private todayIso(): string {
    return new Date().toISOString().split('T')[0];
  }
  private addDays(iso: string, days: number): string {
    const d = new Date(iso);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  }
}
