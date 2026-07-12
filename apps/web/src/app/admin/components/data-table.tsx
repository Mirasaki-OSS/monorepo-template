import { isRecord } from '@md-oss/common/utils/records';
import type {
  ColumnMeta,
  RowData,
} from '@md-oss/design-system/types/data-table';

export type AdvancedFilterItem = {
  id: string;
  value: unknown;
  variant: string;
  operator: string;
  filterId?: string;
};

export const isAdvancedFilterItem = (
  value: unknown
): value is AdvancedFilterItem => {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.variant === 'string' &&
    typeof value.operator === 'string'
  );
};

export const validateAdvancedFilters = (value: unknown) => {
  if (!Array.isArray(value)) return null;
  return value.every(isAdvancedFilterItem) ? value : null;
};

/**
 * Avoids type down-casting in column definitions
 */
export const columnMeta = <TData extends RowData, TValue>(
  meta: ColumnMeta<TData, TValue>
): ColumnMeta<TData, TValue> => {
  return meta;
};
