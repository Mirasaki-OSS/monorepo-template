// Source: https://github.com/shadcn-ui/ui/discussions/3875#discussioncomment-9757232

import type { Button } from '@md-oss/design-system/components/ui/button';
import type React from 'react';
import { create, type StoreApi, type UseBoundStore } from 'zustand';

interface ConfirmationState {
	open: boolean;
	title: string | null;
	description: string | null;
	children?: React.ReactNode;
	cancelLabel: string | null;
	actionLabel: string | null;
	actionProps?: React.ComponentPropsWithoutRef<typeof Button>;
	cancelProps?: React.ComponentPropsWithoutRef<typeof Button>;
	onAction: () => void;
	onCancel: () => void;
}

interface ConfirmationActions {
	openConfirmation: (data: {
		title: string;
		description: string;
		children?: React.ReactNode;
		cancelLabel: string;
		actionLabel: string;
		actionProps?: React.ComponentPropsWithoutRef<typeof Button>;
		cancelProps?: React.ComponentPropsWithoutRef<typeof Button>;
		onAction: () => void;
		onCancel: () => void;
	}) => void;
	closeConfirmation: () => void;
}

const useConfirmationStore: UseBoundStore<
	StoreApi<ConfirmationState & ConfirmationActions>
> = create<ConfirmationState & ConfirmationActions>((set) => ({
	open: false,
	title: null,
	description: null,
	children: null,
	cancelLabel: null,
	actionLabel: null,
	actionProps: {},
	cancelProps: {},
	onAction: () => {},
	onCancel: () => {},
	openConfirmation: (data) =>
		set(() => ({
			open: true,
			title: data.title,
			description: data.description,
			children: data.children,
			cancelLabel: data.cancelLabel,
			actionLabel: data.actionLabel,
			actionProps: data.actionProps,
			cancelProps: data.cancelProps,
			onAction: data.onAction,
			onCancel: data.onCancel,
		})),
	closeConfirmation: () => {
		set((state) => ({
			...state,
			open: false,
		}));
		set((state) => ({
			...state,
			title: null,
			description: null,
			children: null,
			cancelLabel: null,
			actionLabel: null,
			actionProps: {},
			cancelProps: {},
			onAction: () => {},
			onCancel: () => {},
		}));
	},
}));

export {
	type ConfirmationActions,
	type ConfirmationState,
	useConfirmationStore,
};
