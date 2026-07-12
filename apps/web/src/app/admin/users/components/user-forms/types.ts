import type { userViewSchema } from '@md-oss/api/types';
import type { UseFormReturn } from 'react-hook-form';
import type { z } from 'zod/v4';

export type UserFormValues = z.input<typeof userViewSchema>;
export type UserFormSubmitValues = z.output<typeof userViewSchema>;

export type UseUserFormReturn = UseFormReturn<
  UserFormValues,
  unknown,
  UserFormSubmitValues
>;
