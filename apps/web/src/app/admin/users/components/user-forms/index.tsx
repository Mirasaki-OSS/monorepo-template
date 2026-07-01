import type { ClientAuthContext } from '@md-oss/api/types';
import { DangerZone } from '@md-oss/design-system/components/auth/delete-user/danger-zone';
import { Button } from '@md-oss/design-system/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@md-oss/design-system/components/ui/card';
import {
  Field,
  FieldGroup,
  FieldSeparator,
} from '@md-oss/design-system/components/ui/field';
import { Scroller } from '@md-oss/design-system/components/ui/scroller';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@md-oss/design-system/components/ui/tabs';
import { cn } from '@md-oss/design-system/lib/utils';
import {
  BanFieldSet,
  BioField,
  DatesFieldSet,
  DisplayUsernameField,
  EmailField,
  EmailVerifiedField,
  ImageField,
  MetadataFieldSet,
  NameField,
  RolesField,
  type UserFormPieceProps,
  UsernameField,
  userFormHasValidationErrors,
} from './pieces';
import type {
  UserFormSubmitValues,
  UserFormValues,
  UseUserFormReturn,
} from './types';

export type UserFormControlButtonsClassNames = {
  all?: string;
  reset?: string;
  submit?: string;
};

export type UserFormControlClassNames = {
  field?: string;
  buttons?: UserFormControlButtonsClassNames;
};

export type UserFormControlButtonsProps = {
  form: UseUserFormReturn;
  classNames?: UserFormControlClassNames;
  disabled?:
    | boolean
    | {
        all?: boolean;
        reset?: boolean;
        submit?: boolean;
      };
  content?: {
    reset?: React.ReactNode;
    submit?: React.ReactNode;
  };
};

export const UserFormControlButtons = ({
  form,
  classNames,
  disabled,
  content,
}: UserFormControlButtonsProps) => {
  const withDisabled = (
    key: keyof Exclude<
      UserFormControlButtonsProps['disabled'],
      undefined | boolean
    >
  ) => {
    if (disabled === true) return true;
    if (disabled === false || disabled === undefined) return false;
    if (key !== 'all' && disabled.all === true) return true;
    return disabled[key] === true;
  };

  const { isDirty, isValid } = form.formState;
  const usesLiveValidation = form.control._options.mode !== 'onSubmit';
  const disabledIfLiveValidation = usesLiveValidation && !isValid;

  const isResetDisabled = !isDirty || withDisabled('reset');
  const isSubmitDisabled =
    !isDirty || disabledIfLiveValidation || withDisabled('submit');

  return (
    <Field orientation="horizontal" className={classNames?.field}>
      <Button
        type="button"
        variant="outline"
        disabled={isResetDisabled}
        onClick={() => form.reset()}
        className={cn(classNames?.buttons?.all, classNames?.buttons?.reset)}
      >
        {content?.reset ?? 'Reset'}
      </Button>
      <Button
        type="submit"
        disabled={isSubmitDisabled}
        form="edit-user-form"
        className={cn(classNames?.buttons?.all, classNames?.buttons?.submit)}
      >
        {content?.submit ?? 'Submit'}
      </Button>
    </Field>
  );
};

export type UserFormCardClassNames = {
  root?: string;
  header?: string;
  title?: string;
  description?: string;
  content?: string;
  footer?: string;
} & UserFormControlClassNames;

export type UserFormCardProps = {
  type?: 'create' | 'edit';
  content: React.ReactNode;
  form: UseUserFormReturn;
  className?: string;
  classNames?: UserFormCardClassNames;
};

export const UserFormCard = ({
  type = 'edit',
  className,
  content,
  form,
  classNames,
}: UserFormCardProps) => {
  return (
    <Card className={cn(className, classNames?.root)}>
      <CardHeader className={classNames?.header}>
        <CardTitle className={classNames?.title}>
          {type === 'edit' ? 'Edit User' : 'Create User'}
        </CardTitle>
        <CardDescription className={classNames?.description}>
          {type === 'edit'
            ? 'Make changes to the user details and click submit to save.'
            : 'Fill out the form below to create a new user.'}
        </CardDescription>
      </CardHeader>
      <CardContent className={classNames?.content}>{content}</CardContent>
      <CardFooter className={classNames?.footer}>
        <UserFormControlButtons form={form} classNames={classNames} />
      </CardFooter>
    </Card>
  );
};

export type UserFormClassNames = {
  root?: string;
};

type WithConditionalFieldGroupProps = {
  variant: UserFormVariant;
  children: React.ReactNode;
};

const WithConditionalFieldGroup = ({
  variant,
  children,
}: WithConditionalFieldGroupProps) => {
  if (variant === 'flat') {
    return <>{children}</>;
  }
  if (variant === 'grouped' || variant === 'grouped-separated') {
    return <FieldGroup>{children}</FieldGroup>;
  }
  return <>{children}</>;
};

const WithConditionalSeparator = ({
  if: condition,
  className,
}: {
  if: boolean;
  className?: string;
}) => {
  if (condition) {
    return <FieldSeparator className={cn('mb-2', className)} />;
  }
  return null;
};

type WithConditionalCardProps = {
  variant: UserFormVariant;
  form: UseUserFormReturn;
  className?: string;
  classNames?: UserFormCardClassNames;
  children: React.ReactNode;
};

const WithConditionalCard = ({
  variant,
  form,
  className,
  classNames,
  children,
}: WithConditionalCardProps) => {
  if (variant === 'card') {
    return (
      <UserFormCard
        form={form}
        className={className}
        classNames={classNames}
        content={children}
      />
    );
  }
  return <>{children}</>;
};

export type UserFormVariant =
  | 'flat'
  | 'card'
  | 'grouped'
  | 'separated'
  | 'grouped-separated'
  | 'tabbed';

export type UserFormProps = {
  variant?: UserFormVariant;
  className?: string;
  classNames?: UserFormClassNames;
  form: UseUserFormReturn;
  value: UserFormValues;
  onSubmit: (data: UserFormSubmitValues) => void;
  disabled?: boolean;
  auth: ClientAuthContext | null;
  pieceProps?: Omit<UserFormPieceProps, 'form' | 'auth'>;
};

const WithScroller = ({
  children,
  enabled,
}: {
  children: React.ReactNode;
  enabled: boolean;
}) => {
  if (enabled) {
    return (
      <Scroller className="max-h-[55vh] overflow-y-auto pb-0.5" hideScrollbar>
        {children}
      </Scroller>
    );
  }
  return children;
};

/**
 * - `flat`: Renders all fields without any grouping or separation.
 * - `grouped`: Groups fields into sections using `FieldGroup` but without separators.
 * - `separated`: Renders fields in a single column with separators between them.
 * - `grouped-separated`: Combines grouping and separation by rendering fields in sections with separators between them.
 * - `tabbed`: Renders fields in a tabbed interface, allowing users to switch between different sections.
 */
export const UserForm = ({
  form,
  className,
  classNames,
  value: _value,
  onSubmit,
  disabled,
  auth,
  variant = 'tabbed',
  pieceProps: _pieceProps,
}: UserFormProps) => {
  const pieceProps = { form, auth, ..._pieceProps };

  const renderProfileFields = ({
    grouped,
    separated,
  }: {
    grouped: boolean;
    separated: boolean;
  }) => {
    const fields = (
      <>
        <NameField {...pieceProps} />
        {separated ? <FieldSeparator className="mb-2" /> : null}
        <UsernameField {...pieceProps} />
        {separated ? <FieldSeparator className="mb-2" /> : null}
        <DisplayUsernameField {...pieceProps} />
        {separated ? <FieldSeparator className="mb-2" /> : null}
        <BioField {...pieceProps} />
        {separated ? <FieldSeparator className="mb-2" /> : null}
        <ImageField {...pieceProps} />
      </>
    );

    return grouped ? <FieldGroup>{fields}</FieldGroup> : fields;
  };

  const renderAccountFields = ({
    grouped,
    separated,
  }: {
    grouped: boolean;
    separated: boolean;
  }) => {
    const fields = (
      <>
        <EmailField {...pieceProps} />
        {separated ? <FieldSeparator className="mb-2" /> : null}
        <EmailVerifiedField {...pieceProps} />
        {separated ? <FieldSeparator className="mb-2" /> : null}
        <DatesFieldSet {...pieceProps} disabled readonly />
      </>
    );

    return grouped ? <FieldGroup>{fields}</FieldGroup> : fields;
  };

  const renderAccessFields = ({
    grouped,
    separated,
  }: {
    grouped: boolean;
    separated: boolean;
  }) => {
    const fields = (
      <>
        <RolesField {...pieceProps} />
        {separated ? <FieldSeparator className="mb-2" /> : null}
        <BanFieldSet {...pieceProps} />
      </>
    );

    return grouped ? <FieldGroup>{fields}</FieldGroup> : fields;
  };

  const renderMetadataFields = ({
    grouped,
  }: {
    grouped: boolean;
    separated: boolean;
  }) => {
    const fields = (
      <>
        <MetadataFieldSet {...pieceProps} />
      </>
    );

    return grouped ? <FieldGroup>{fields}</FieldGroup> : fields;
  };

  const renderDangerZone = ({
    grouped,
    separated: _separated,
  }: {
    grouped: boolean;
    separated: boolean;
  }) => {
    const fields = (
      <>
        <DangerZone>Something</DangerZone>
      </>
    );

    return grouped ? <FieldGroup>{fields}</FieldGroup> : fields;
  };

  const renderTabbedView = () => {
    const tabs = [
      {
        value: 'profile',
        label: 'Profile',
        useScroller: true,
        content: renderProfileFields({ grouped: true, separated: false }),
      },
      {
        value: 'account',
        label: 'Account',
        useScroller: false,
        content: renderAccountFields({ grouped: true, separated: false }),
      },
      {
        value: 'access',
        label: 'Access',
        useScroller: false,
        content: renderAccessFields({ grouped: true, separated: false }),
      },
      {
        value: 'metadata',
        label: 'Metadata',
        useScroller: true,
        content: renderMetadataFields({ grouped: true, separated: false }),
      },
      {
        value: 'danger',
        label: 'Danger Zone',
        useScroller: true,
        content: renderDangerZone({ grouped: true, separated: false }),
      },
    ] as const;

    return (
      <Tabs defaultValue={tabs[0].value} className={cn('gap-4', className)}>
        <TabsList
          variant="line"
          className="h-auto w-full justify-start gap-1 overflow-x-auto rounded-lg! border border-border/70 bg-muted/30 p-1"
        >
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className={cn(
                'rounded-lg px-4 py-2 text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm',
                userFormHasValidationErrors(form, tab.value) &&
                  'text-destructive! after:bg-destructive!'
              )}
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <div>
          {tabs.map((tab) => (
            <WithScroller key={tab.value} enabled={tab.useScroller}>
              <TabsContent
                value={tab.value}
                className="mt-0 rounded-lg border border-border/70 bg-card/80 p-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-300"
              >
                {tab.content}
              </TabsContent>
            </WithScroller>
          ))}
        </div>
      </Tabs>
    );
  };

  return (
    <WithConditionalCard
      variant={variant}
      form={form}
      className={className}
      classNames={classNames}
    >
      <form
        id="edit-user-form"
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn(
          'space-y-4',
          disabled && 'pointer-events-none opacity-50',
          className,
          classNames?.root
        )}
      >
        {variant === 'tabbed' ? (
          renderTabbedView()
        ) : (
          <>
            <WithConditionalFieldGroup variant={variant}>
              {renderProfileFields({
                grouped: false,
                separated: variant === 'separated',
              })}
            </WithConditionalFieldGroup>

            <WithConditionalSeparator
              if={variant === 'separated' || variant === 'grouped-separated'}
            />

            <WithConditionalFieldGroup variant={variant}>
              {renderAccountFields({
                grouped: false,
                separated: variant === 'separated',
              })}
            </WithConditionalFieldGroup>

            <WithConditionalSeparator
              if={variant === 'separated' || variant === 'grouped-separated'}
            />

            <WithConditionalFieldGroup variant={variant}>
              {renderAccessFields({
                grouped: false,
                separated: variant === 'separated',
              })}
            </WithConditionalFieldGroup>

            <WithConditionalSeparator
              if={variant === 'separated' || variant === 'grouped-separated'}
            />

            <WithConditionalFieldGroup variant={variant}>
              {renderMetadataFields({
                grouped: false,
                separated: variant === 'separated',
              })}
            </WithConditionalFieldGroup>

            <WithConditionalSeparator
              if={variant === 'separated' || variant === 'grouped-separated'}
            />

            <WithConditionalFieldGroup variant={variant}>
              {renderDangerZone({
                grouped: false,
                separated: variant === 'separated',
              })}
            </WithConditionalFieldGroup>
          </>
        )}
      </form>
    </WithConditionalCard>
  );
};
