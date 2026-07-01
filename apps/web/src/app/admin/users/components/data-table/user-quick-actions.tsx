import { Button } from '@md-oss/design-system/components/ui/button';
import { parseAsJson, useQueryState } from 'nuqs';
import React from 'react';
import { validateAdvancedFilters } from '@/app/admin/components/data-table';

export function QuickAdvancedUserFilters({
  authMethodOptions,
}: {
  authMethodOptions: Array<{ label: string; value: string }>;
}) {
  const [filters, setFilters] = useQueryState(
    'filters',
    parseAsJson(validateAdvancedFilters).withDefault([])
  );

  const setMultiSelectQuickFilter = React.useCallback(
    (id: 'status' | 'authMethods', value: string, variant: 'multiSelect') => {
      void setFilters((prev) => {
        const existing = prev.find((filter) => filter.id === id);

        if (!existing) {
          return [
            ...prev,
            {
              id,
              value: [value],
              variant,
              operator: 'inArray',
              filterId: `quick-${id}`,
            },
          ];
        }

        const currentValues = Array.isArray(existing.value)
          ? existing.value
          : [existing.value];

        const hasValue = currentValues.includes(value);
        const nextValues = hasValue
          ? currentValues.filter((item) => item !== value)
          : [...currentValues, value];

        if (nextValues.length === 0) {
          return prev.filter((filter) => filter.id !== id);
        }

        return prev.map((filter) =>
          filter.id === id
            ? {
                ...filter,
                value: nextValues,
                variant,
                operator: 'inArray',
              }
            : filter
        );
      });
    },
    [setFilters]
  );

  const hasMultiSelectFilterValue = React.useCallback(
    (id: 'status' | 'authMethods', value: string) => {
      const existing = filters.find((filter) => filter.id === id);
      if (!existing) {
        return false;
      }

      const values = Array.isArray(existing.value)
        ? existing.value
        : [existing.value];
      return values.includes(value);
    },
    [filters]
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-muted-foreground">Quick Filters:</span>
      {[
        { label: 'Verified', value: 'verified' },
        { label: 'Unverified', value: 'unverified' },
      ].map((item) => {
        const active = hasMultiSelectFilterValue('status', item.value);
        return (
          <Button
            key={item.value}
            size="sm"
            variant={active ? 'default' : 'outline'}
            className="h-7"
            onClick={() =>
              setMultiSelectQuickFilter('status', item.value, 'multiSelect')
            }
          >
            {item.label}
          </Button>
        );
      })}
      {authMethodOptions.map((item) => {
        const active = hasMultiSelectFilterValue('authMethods', item.value);
        return (
          <Button
            key={item.value}
            size="sm"
            variant={active ? 'default' : 'outline'}
            className="h-7"
            onClick={() =>
              setMultiSelectQuickFilter(
                'authMethods',
                item.value,
                'multiSelect'
              )
            }
          >
            {item.label}
          </Button>
        );
      })}
    </div>
  );
}
