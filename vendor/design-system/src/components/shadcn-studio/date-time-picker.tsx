'use client';

import { Button } from '@md-oss/design-system/components/ui/button';
import { Calendar } from '@md-oss/design-system/components/ui/calendar';
import { Input } from '@md-oss/design-system/components/ui/input';
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@md-oss/design-system/components/ui/popover';
import { cn } from '@md-oss/design-system/lib/utils';
import { CalendarIcon } from 'lucide-react';
import React from 'react';

export type DateTimePickerProps = {
	id?: string;
	value?: Date | null;
	onChange?: (date: Date | null) => void;
	placeholder?: string;
	disabled?: boolean;
	className?: string;
};

const DateTimePicker = ({
	id,
	value,
	onChange,
	placeholder = 'Pick a date',
	disabled = false,
	className,
}: DateTimePickerProps) => {
	const [isOpen, setIsOpen] = React.useState(false);

	const timeValue = value
		? [
				String(value.getHours()).padStart(2, '0'),
				String(value.getMinutes()).padStart(2, '0'),
				String(value.getSeconds()).padStart(2, '0'),
			].join(':')
		: '';

	const handleDateSelect = (date: Date | undefined) => {
		if (!date) {
			onChange?.(null);
			setIsOpen(false);
			return;
		}
		const next = new Date(date);
		if (value) {
			next.setHours(value.getHours(), value.getMinutes(), value.getSeconds());
		}
		onChange?.(next);
		setIsOpen(false);
	};

	const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const [hours, minutes, seconds] = e.target.value.split(':').map(Number);
		const next = value ? new Date(value) : new Date();
		next.setHours(hours ?? 0, minutes ?? 0, seconds ?? 0);
		onChange?.(next);
	};

	return (
		<div className={cn('flex gap-2', className)}>
			<Popover open={isOpen} onOpenChange={setIsOpen}>
				<PopoverTrigger asChild>
					<Button
						id={id}
						variant="outline"
						disabled={disabled}
						className="flex-1 justify-between font-normal"
					>
						{value
							? value.toLocaleDateString('en-US', {
									day: '2-digit',
									month: 'short',
									year: 'numeric',
								})
							: placeholder}
						<CalendarIcon className="text-muted-foreground" />
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-auto overflow-hidden p-0" align="start">
					<Calendar
						mode="single"
						selected={value || undefined}
						onSelect={handleDateSelect}
					/>
				</PopoverContent>
			</Popover>

			<Input
				type="time"
				step="1"
				value={timeValue}
				onChange={handleTimeChange}
				disabled={disabled || !value}
				className="w-auto bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
			/>
		</div>
	);
};

export { DateTimePicker };
