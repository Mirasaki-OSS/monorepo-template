import type { ClientAuthContext } from '@md-oss/api/types';
import { authzRoles, normalizeRoles } from '@md-oss/authz';
import { getErrorMessage } from '@md-oss/common';
import { titleCase } from '@md-oss/common/utils/strings';
import { DateTimePicker } from '@md-oss/design-system/components/shadcn-studio/date-time-picker';
import { Checkbox } from '@md-oss/design-system/components/ui/checkbox';
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  useComboboxAnchor,
} from '@md-oss/design-system/components/ui/combobox';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '@md-oss/design-system/components/ui/field';
import { Input } from '@md-oss/design-system/components/ui/input';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  InputGroupTextarea,
} from '@md-oss/design-system/components/ui/input-group';
import { JSONEditor } from '@md-oss/design-system/components/ui/json-editor';
import { RelativeTimeCard } from '@md-oss/design-system/components/ui/relative-time-card';
import { cn } from '@md-oss/design-system/lib/utils';
import { Controller } from 'react-hook-form';
import type { UserFormValues, UseUserFormReturn } from './types';

export const userFormCategories = [
  { value: 'profile', label: 'Profile' },
  { value: 'account', label: 'Account' },
  { value: 'access', label: 'Access' },
  { value: 'metadata', label: 'Metadata' },
  { value: 'danger', label: 'Danger Zone' },
] as const;

export type UserFormCategory = (typeof userFormCategories)[number]['value'];
export type UserFormValueKey = keyof UserFormValues;

export const userFormFieldsByCategory: Record<
  UserFormCategory,
  UserFormValueKey[]
> = {
  profile: ['name', 'username', 'displayUsername', 'bio', 'image'],
  account: ['email', 'emailVerified', 'createdAt', 'updatedAt'],
  access: ['roles', 'banned', 'banReason', 'banExpiresAt'],
  metadata: ['clientMetadata', 'clientReadonlyMetadata', 'serverMetadata'],
  danger: ['id', 'authMethods', 'lastSeenAt'], // [DEV] Danger zone has actions like delete, not fields
};

export const userFormHasValidationErrors = (
  form: UseUserFormReturn,
  category: UserFormCategory
) => {
  const fieldNames = userFormFieldsByCategory[category];
  return fieldNames.some((fieldName) => !!form.formState.errors[fieldName]);
};

// [DONE] name: string;
// [DONE] email: string;
// [DONE] emailVerified: boolean;
// [DONE] image: string | null;
// [DONE] username: string | null;
// [DONE] displayUsername: string | null;
// [DONE] bio: string | null;
// [DONE] clientMetadata: Record<string, never> | null;
// [DONE] clientReadonlyMetadata: Record<string, never> | null;
// [DONE] serverMetadata: Record<string, never> | null;
// [DONE] roles: ("owner" | "admin" | "support" | "user")[];
// [DONE] banned: boolean;
// [DONE] banReason: string | null;
// [DONE] banExpiresAt: Date | null;
// [DONE] createdAt: Date;
// [DONE] updatedAt: Date;
// DANGER ZONE AND VIRTUAL FIELDS (not stored in DB):
// id: string;
// lastSeenAt: Date | null;
// authMethods: readonly string[];

export type UserFormPieceProps = {
  form: UseUserFormReturn;
  auth: ClientAuthContext | null;
  showDescription?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  className?: string;
};

const resolveAdditionalUserFormPieceProps = (props: UserFormPieceProps) => {
  return {
    isUserMe: props.auth?.user?.id === props.form.getValues('id'),
  };
};

export const NameField = ({
  form,
  showDescription,
  className,
}: UserFormPieceProps) => {
  return (
    <Controller
      name="name"
      control={form.control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid} className={className}>
          <FieldLabel htmlFor="edit-user-form-name">Name</FieldLabel>
          <Input
            {...field}
            id="edit-user-form-name"
            aria-invalid={fieldState.invalid}
            placeholder="John Doe"
            autoComplete="off"
          />
          <FieldDescription className={showDescription ? 'block' : 'sr-only'}>
            The user's full name. This is typically used for display purposes
            and can be changed by the user at any time.
          </FieldDescription>
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
};

export const UsernameField = ({
  form,
  showDescription,
  className,
}: UserFormPieceProps) => {
  return (
    <Controller
      name="username"
      control={form.control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid} className={className}>
          <FieldLabel htmlFor="edit-user-form-username">Username</FieldLabel>
          <InputGroup>
            <Input
              {...field}
              value={field.value ?? ''}
              id="edit-user-form-username"
              aria-invalid={fieldState.invalid}
              placeholder="john_doe"
              autoComplete="username"
              className="rounded-l-none"
            />
            <InputGroupAddon align="inline-start" className="pr-2">
              <InputGroupText>@</InputGroupText>
            </InputGroupAddon>
          </InputGroup>
          <FieldDescription className={showDescription ? 'block' : 'sr-only'}>
            A unique identifier for the user, typically used in URLs and
            mentions. Usernames must be unique across the platform and can
            contain letters, numbers, underscores, and periods.
          </FieldDescription>
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
};

export const DisplayUsernameField = ({
  form,
  showDescription,
  className,
}: UserFormPieceProps) => {
  return (
    <Controller
      name="displayUsername"
      control={form.control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid} className={className}>
          <FieldLabel htmlFor="edit-user-form-display-username">
            Display Username
          </FieldLabel>
          <Input
            {...field}
            value={field.value ?? ''}
            id="edit-user-form-display-username"
            aria-invalid={fieldState.invalid}
            placeholder="Johnny"
            autoComplete="off"
          />
          <FieldDescription className={showDescription ? 'block' : 'sr-only'}>
            An optional username that can be used for display purposes. This is
            not required to be unique and can contain spaces and special
            characters. If not provided, the regular username will be used for
            display.
          </FieldDescription>
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
};

export const BioField = ({
  form,
  auth,
  showDescription,
  className,
}: UserFormPieceProps) => {
  const { isUserMe } = resolveAdditionalUserFormPieceProps({
    form,
    auth,
  });

  return (
    <Controller
      name="bio"
      control={form.control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid} className={className}>
          <FieldLabel htmlFor="edit-user-form-bio">Bio</FieldLabel>
          <InputGroup>
            <InputGroupTextarea
              {...field}
              value={field.value ?? ''}
              id="edit-user-form-bio"
              placeholder="I am a software developer with a passion for open source projects..."
              rows={6}
              className="min-h-24 resize-none"
              aria-invalid={fieldState.invalid}
            />
            <InputGroupAddon align="block-end">
              <InputGroupText className="tabular-nums">
                {field.value?.length ?? 0}/100 characters
              </InputGroupText>
            </InputGroupAddon>
          </InputGroup>
          <FieldDescription className={showDescription ? 'block' : 'sr-only'}>
            {isUserMe
              ? 'Tell us a bit about yourself. This will be displayed on your profile.'
              : 'A short biography or description of the user.'}
          </FieldDescription>
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
};

export const ImageField = ({
  form,
  showDescription,
  className,
}: UserFormPieceProps) => {
  return (
    <Controller
      name="image"
      control={form.control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid} className={className}>
          <FieldLabel htmlFor="edit-user-form-image">
            Profile Image URL
          </FieldLabel>
          <Input
            {...field}
            value={field.value ?? ''}
            id="edit-user-form-image"
            // Note: We use type="text" instead of type="url" to allow data URIs, which are
            // valid URLs but not accepted by some browsers when using type="url"
            type="text"
            aria-invalid={fieldState.invalid}
            placeholder="https://example.com/avatar.jpg"
            autoComplete="off"
          />
          <FieldDescription className={showDescription ? 'block' : 'sr-only'}>
            A URL pointing to the user's profile image or avatar. This should be
            a data URI, or direct link to an image file (e.g., .jpg, .png) and
            must be publicly accessible.
          </FieldDescription>
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
};

export const EmailField = ({
  form,
  showDescription,
  className,
}: UserFormPieceProps) => {
  return (
    <Controller
      name="email"
      control={form.control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid} className={className}>
          <FieldLabel htmlFor="edit-user-form-email">Email</FieldLabel>
          <Input
            {...field}
            id="edit-user-form-email"
            type="email"
            aria-invalid={fieldState.invalid}
            placeholder="john@google.com"
            autoComplete="email"
          />
          <FieldDescription className={showDescription ? 'block' : 'sr-only'}>
            The user's email address. This is used for account recovery,
            password resets, and important notifications. Each email address
            must be unique across the platform.
          </FieldDescription>
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
};

export const EmailVerifiedField = ({
  form,
  showDescription,
  className,
}: UserFormPieceProps) => {
  return (
    <Controller
      name="emailVerified"
      control={form.control}
      render={({ field, fieldState }) => (
        <div>
          <FieldSet data-invalid={fieldState.invalid} className={className}>
            <FieldLegend variant="label">Email Verified</FieldLegend>
            <FieldDescription className={showDescription ? 'block' : 'sr-only'}>
              Indicates whether the user's email address has been verified.
              Verified email addresses are required for account recovery and
              certain security features.
            </FieldDescription>
            <FieldGroup data-slot="checkbox-group">
              <Field orientation="horizontal" className="gap-1.5">
                <Checkbox
                  id="edit-user-form-email-verified"
                  name={field.name}
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled
                />
                <FieldLabel
                  htmlFor="edit-user-form-email-verified"
                  className="font-normal"
                >
                  {field.value ? 'Verified' : 'Not Verified'}
                </FieldLabel>
              </Field>
            </FieldGroup>
          </FieldSet>
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </div>
      )}
    />
  );
};

// RESOURCE: Select in form: https://ui.shadcn.com/docs/forms/react-hook-form#select
// RESOURCE: Array fields: https://ui.shadcn.com/docs/forms/react-hook-form#array-fields

export const RolesField = ({
  form,
  showDescription,
  className,
}: UserFormPieceProps) => {
  const anchor = useComboboxAnchor();

  return (
    <Controller
      name="roles"
      control={form.control}
      render={({ field, fieldState }) => (
        <Field
          orientation="responsive"
          data-invalid={fieldState.invalid}
          className={className}
        >
          <FieldContent className="my-auto">
            <FieldLabel htmlFor="edit-user-form-roles">Roles</FieldLabel>
            <FieldDescription className={showDescription ? 'block' : 'sr-only'}>
              Assign one or more roles to the user. This will determine their
              permissions and access levels within the application.
            </FieldDescription>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </FieldContent>
          <Combobox
            multiple
            autoHighlight
            items={authzRoles}
            value={normalizeRoles(field.value)}
            onValueChange={(val) => field.onChange(val)}
          >
            <ComboboxChips
              ref={anchor}
              aria-invalid={fieldState.invalid}
              className="w-45! my-auto"
            >
              {normalizeRoles(field.value).map((role) => (
                <ComboboxChip key={role}>{titleCase(role)}</ComboboxChip>
              ))}
              <ComboboxChipsInput
                id="edit-user-form-roles"
                placeholder={
                  normalizeRoles(field.value).length === 0
                    ? 'Select roles...'
                    : 'Add role...'
                }
              />
            </ComboboxChips>
            {/*
              Note: Pointer events bug with Radix primitives:
              - https://github.com/shadcn-ui/ui/issues/1748
              - https://github.com/radix-ui/primitives/issues/1088#issuecomment-1334006804
              - https://github.com/shadcn-ui/ui/issues/4277
              - https://github.com/shadcn-ui/ui/issues/9770
            */}
            <ComboboxContent
              anchor={anchor}
              onWheel={(e) => e.stopPropagation()}
              className="pointer-events-auto"
            >
              <ComboboxEmpty>No roles found.</ComboboxEmpty>
              <ComboboxList>
                {(role) => (
                  <ComboboxItem key={role} value={role}>
                    {titleCase(role)}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </Field>
      )}
    />
  );
};

export const CreatedAtField = ({
  form,
  showDescription,
  disabled,
  readonly,
  className,
}: UserFormPieceProps) => {
  return (
    <Controller
      name="createdAt"
      control={form.control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid} className={className}>
          <FieldLabel htmlFor="edit-user-form-created-at">
            Created At
          </FieldLabel>
          {readonly ? (
            <RelativeTimeCard
              disabled={disabled}
              date={field.value}
              variant={'muted'}
              className="justify-start"
            />
          ) : (
            <DateTimePicker
              {...field}
              id="edit-user-form-created-at"
              disabled={disabled}
              value={field.value}
              aria-invalid={fieldState.invalid}
              placeholder="N/A"
              onChange={field.onChange}
            />
          )}
          <FieldDescription className={showDescription ? 'block' : 'sr-only'}>
            The date and time when the user account was created.
          </FieldDescription>
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
};

export const UpdatedAtField = ({
  form,
  showDescription,
  disabled,
  readonly,
  className,
}: UserFormPieceProps) => {
  return (
    <Controller
      name="updatedAt"
      control={form.control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid} className={className}>
          <FieldLabel htmlFor="edit-user-form-updated-at">
            Updated At
          </FieldLabel>
          {readonly ? (
            <RelativeTimeCard
              disabled={disabled}
              date={field.value}
              variant={'muted'}
              className="justify-start"
            />
          ) : (
            <DateTimePicker
              {...field}
              id="edit-user-form-updated-at"
              disabled={disabled}
              value={field.value}
              aria-invalid={fieldState.invalid}
              placeholder="N/A"
              onChange={field.onChange}
            />
          )}
          <FieldDescription className={showDescription ? 'block' : 'sr-only'}>
            The date and time when the user account was last updated.
          </FieldDescription>
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
};

export const DatesFieldSet = ({ className, ...props }: UserFormPieceProps) => {
  return (
    <FieldSet className={cn('w-full', className)}>
      <FieldLegend>Account Dates</FieldLegend>
      <FieldDescription>
        Important dates related to the user account. These fields are read-only
        and automatically managed by the system.
      </FieldDescription>
      <FieldGroup className="w-full gap-4">
        <div className="grid grid-cols-2 gap-4">
          <CreatedAtField {...props} />
          <UpdatedAtField {...props} />
        </div>
      </FieldGroup>
    </FieldSet>
  );
};

export const BannedField = ({
  form,
  showDescription,
  className,
}: UserFormPieceProps) => {
  return (
    <Controller
      name="banned"
      control={form.control}
      render={({ field, fieldState }) => (
        <div>
          <FieldSet data-invalid={fieldState.invalid} className={className}>
            <FieldLegend variant="label">Banned</FieldLegend>
            <FieldDescription className={showDescription ? 'block' : 'sr-only'}>
              Wether or not the user is currently banned from the application.
            </FieldDescription>
            <FieldGroup data-slot="checkbox-group">
              <Field orientation="horizontal" className="gap-1.5">
                <Checkbox
                  id="edit-user-form-banned"
                  name={field.name}
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
                <FieldLabel
                  htmlFor="edit-user-form-banned"
                  className="font-normal"
                >
                  {field.value ? 'Banned' : 'Not Banned'}
                </FieldLabel>
              </Field>
            </FieldGroup>
          </FieldSet>
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </div>
      )}
    />
  );
};

export const BanExpiresAtField = ({
  form,
  showDescription,
  className,
}: UserFormPieceProps) => {
  return (
    <Controller
      name="banExpiresAt"
      control={form.control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid} className={className}>
          <FieldLabel htmlFor="edit-user-form-ban-expires-at">
            Ban Expires At
          </FieldLabel>
          <DateTimePicker
            {...field}
            id="edit-user-form-ban-expires-at"
            value={field.value}
            aria-invalid={fieldState.invalid}
            placeholder="N/A"
            onChange={field.onChange}
          />
          <FieldDescription className={showDescription ? 'block' : 'sr-only'}>
            The date and time when the user's ban will expire. If null, the ban
            is permanent.
          </FieldDescription>
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
};

export const BanReasonField = ({
  form,
  showDescription,
  className,
}: UserFormPieceProps) => {
  return (
    <Controller
      name="banReason"
      control={form.control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid} className={className}>
          <FieldLabel htmlFor="edit-user-form-ban-reason">
            Ban Reason
          </FieldLabel>
          <InputGroup>
            <InputGroupTextarea
              {...field}
              value={field.value ?? ''}
              id="edit-user-form-ban-reason"
              placeholder="Violation of terms of service"
              rows={6}
              className="min-h-24 resize-none"
              aria-invalid={fieldState.invalid}
            />
            <InputGroupAddon align="block-end">
              <InputGroupText className="tabular-nums">
                {field.value?.length ?? 0}/500 characters
              </InputGroupText>
            </InputGroupAddon>
          </InputGroup>
          <FieldDescription className={showDescription ? 'block' : 'sr-only'}>
            The reason for banning the user. This is used for internal
            record-keeping and is visible to the user.
          </FieldDescription>
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
};

export const BanFieldSet = (props: UserFormPieceProps) => {
  return (
    <FieldSet className="w-full">
      <FieldLegend>Ban Information</FieldLegend>
      <FieldDescription>
        Details about the user's ban status. Banned users are restricted from
        logging in and accessing the application.
      </FieldDescription>
      <FieldGroup className="w-full gap-4">
        <div className="grid grid-cols-2 gap-4">
          <BannedField {...props} />
          <BanExpiresAtField {...props} />
          <BanReasonField {...props} className="col-span-2" />
        </div>
      </FieldGroup>
    </FieldSet>
  );
};

export const ClientMetadataField = ({
  form,
  showDescription,
  className,
}: UserFormPieceProps) => {
  return (
    <Controller
      name="clientMetadata"
      control={form.control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid} className={className}>
          <FieldLabel htmlFor="edit-user-form-client-metadata">
            Client Metadata
          </FieldLabel>
          <InputGroup>
            <JSONEditor
              {...field}
              value={field.value ?? {}}
              id="edit-user-form-client-metadata"
              placeholder='{"key": "value"}'
              aria-invalid={fieldState.invalid}
              rows={6}
              className="min-h-24 font-mono"
              onJsonError={(error) => {
                form.setError('clientMetadata', {
                  type: 'manual',
                  message: getErrorMessage(error),
                });
              }}
            />
          </InputGroup>
          <FieldDescription className={showDescription ? 'block' : 'sr-only'}>
            This is typically used for user preferences, settings, or any other
            information that should be visible and editable by the user.
          </FieldDescription>
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
};

export const ClientReadonlyMetadataField = ({
  form,
  showDescription,
  className,
}: UserFormPieceProps) => {
  return (
    <Controller
      name="clientReadonlyMetadata"
      control={form.control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid} className={className}>
          <FieldLabel htmlFor="edit-user-form-client-readonly-metadata">
            Client Readonly Metadata
          </FieldLabel>
          <InputGroup>
            <JSONEditor
              {...field}
              value={field.value ?? {}}
              id="edit-user-form-client-readonly-metadata"
              placeholder='{"key": "value"}'
              aria-invalid={fieldState.invalid}
              rows={6}
              className="min-h-24 font-mono"
              onJsonError={(error) => {
                form.setError('clientReadonlyMetadata', {
                  type: 'manual',
                  message: getErrorMessage(error),
                });
              }}
            />
          </InputGroup>
          <FieldDescription className={showDescription ? 'block' : 'sr-only'}>
            This is typically used for information that should be visible to the
            user but not editable, such as account tier or plan details.
          </FieldDescription>
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
};

export const ServerMetadataField = ({
  form,
  showDescription,
  className,
}: UserFormPieceProps) => {
  return (
    <Controller
      name="serverMetadata"
      control={form.control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid} className={className}>
          <FieldLabel htmlFor="edit-user-form-server-metadata">
            Server Metadata
          </FieldLabel>
          <InputGroup>
            <JSONEditor
              {...field}
              value={field.value ?? {}}
              id="edit-user-form-server-metadata"
              placeholder='{"key": "value"}'
              aria-invalid={fieldState.invalid}
              rows={6}
              className="min-h-24 font-mono"
              onJsonError={(error) => {
                form.setError('serverMetadata', {
                  type: 'manual',
                  message: getErrorMessage(error),
                });
              }}
            />
          </InputGroup>
          <FieldDescription className={showDescription ? 'block' : 'sr-only'}>
            This is typically used for internal information that should not be
            exposed to the user, such as internal flags, metadata from
            third-party services, or any other information that is relevant to
            the server but should not be visible on the client.
          </FieldDescription>
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
};

export const MetadataFieldSet = (props: UserFormPieceProps) => {
  return (
    <FieldSet className={cn('w-full', props.className)}>
      <FieldLegend>Metadata</FieldLegend>
      <FieldDescription>
        Custom metadata fields for the user. Client and client read-only
        metadata are (currently) not encrypted and should not contain sensitive
        information. Server metadata is encrypted and can contain sensitive
        information, but is not visible to the user.
      </FieldDescription>
      <FieldGroup className="w-full gap-4">
        <ClientMetadataField {...props} />
        <ClientReadonlyMetadataField {...props} />
        <ServerMetadataField {...props} />
      </FieldGroup>
    </FieldSet>
  );
};
