"use client"

import * as React from "react"
import {
    ChevronDownIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
} from "lucide-react"
import {
    DayPicker,
    getDefaultClassNames,
} from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

function Calendar({
    className,
    classNames,
    showOutsideDays = true,
    captionLayout = "label",
    buttonVariant = "outline",
    locale,
    formatters,
    components,
    ...props
}) {
    const defaultClassNames = getDefaultClassNames()

    return (
        <DayPicker
            showOutsideDays={showOutsideDays}
            className={cn(
                "group/calendar bg-popover p-3 text-popover-foreground rounded-xl shadow-xl border border-border",
                "rtl:[&_.rdp-button_next>svg]:rotate-180",
                "rtl:[&_.rdp-button_previous>svg]:rotate-180",
                className
            )}
            captionLayout={captionLayout}
            locale={locale}
            formatters={{
                formatMonthDropdown: (date) =>
                    date.toLocaleString(locale?.code, { month: "short" }),
                ...formatters,
            }}
            classNames={{
                root: cn("w-fit", defaultClassNames.root),
                months: cn(
                    "relative flex flex-col gap-4 md:flex-row",
                    defaultClassNames.months
                ),
                month: cn("flex w-full flex-col gap-4", defaultClassNames.month),
                nav: cn(
                    "absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1",
                    defaultClassNames.nav
                ),
                button_previous: cn(
                    buttonVariants({ variant: buttonVariant }),
                    "h-8 w-8 p-0 hover:bg-accent hover:text-accent-foreground text-muted-foreground select-none aria-disabled:opacity-50",
                    defaultClassNames.button_previous
                ),
                button_next: cn(
                    buttonVariants({ variant: buttonVariant }),
                    "h-8 w-8 p-0 hover:bg-accent hover:text-accent-foreground text-muted-foreground select-none aria-disabled:opacity-50",
                    defaultClassNames.button_next
                ),
                month_caption: cn(
                    "flex h-8 w-full items-center justify-center",
                    defaultClassNames.month_caption
                ),
                dropdowns: cn(
                    "flex h-8 w-full items-center justify-center gap-1.5 text-base font-semibold",
                    defaultClassNames.dropdowns
                ),
                dropdown_root: cn(
                    "relative",
                    defaultClassNames.dropdown_root
                ),
                dropdown: cn(
                    "",
                    defaultClassNames.dropdown
                ),
                caption_label: cn(
                    "font-medium select-none text-foreground",
                    captionLayout === "label"
                        ? "text-sm"
                        : "hidden",
                    defaultClassNames.caption_label
                ),
                month_grid: cn("w-full border-collapse space-y-1", defaultClassNames.month_grid),
                weekdays: cn("flex pb-2", defaultClassNames.weekdays),
                weekday: cn(
                    "flex-1 rounded-md text-xs font-medium text-muted-foreground select-none",
                    defaultClassNames.weekday
                ),
                week: cn("mt-1 flex w-full gap-1", defaultClassNames.week),
                week_number_header: cn(
                    "w-9 select-none",
                    defaultClassNames.week_number_header
                ),
                week_number: cn(
                    "text-xs text-muted-foreground select-none",
                    defaultClassNames.week_number
                ),
                day: cn(
                    "group/day relative flex items-center justify-center aspect-square h-9 w-9 rounded-xl p-0 text-center select-none",
                    props.showWeekNumber
                        ? "[&:nth-child(2)[data-selected=true]_button]:rounded-l-xl"
                        : "[&:first-child[data-selected=true]_button]:rounded-l-xl",
                    "[&:last-child[data-selected=true]_button]:rounded-r-xl",
                    defaultClassNames.day
                ),
                range_start: cn(
                    "relative isolate z-0 rounded-l-xl bg-accent",
                    defaultClassNames.range_start
                ),
                range_middle: cn("rounded-none", defaultClassNames.range_middle),
                range_end: cn(
                    "relative isolate z-0 rounded-r-xl bg-accent",
                    defaultClassNames.range_end
                ),
                today: cn(
                    "rounded-xl bg-accent text-accent-foreground data-[selected=true]:rounded-none",
                    defaultClassNames.today
                ),
                outside: cn(
                    "text-muted-foreground aria-selected:text-muted-foreground",
                    defaultClassNames.outside
                ),
                disabled: cn(
                    "text-muted-foreground opacity-50",
                    defaultClassNames.disabled
                ),
                hidden: cn("invisible", defaultClassNames.hidden),
                ...classNames,
            }}
            components={{
                Root: ({ className, rootRef, ...props }) => {
                    return (
                        <div
                            data-slot="calendar"
                            ref={rootRef}
                            className={cn(className)}
                            {...props}
                        />
                    )
                },
                Chevron: ({ className, orientation, ...props }) => {
                    if (orientation === "left") {
                        return (
                            <ChevronLeftIcon
                                className={cn("size-4", className)}
                                {...props}
                            />
                        )
                    }

                    if (orientation === "right") {
                        return (
                            <ChevronRightIcon
                                className={cn("size-4", className)}
                                {...props}
                            />
                        )
                    }

                    return (
                        <ChevronDownIcon className={cn("size-4", className)} {...props} />
                    )
                },
                Dropdown: ({ value, onChange, className, ...props }) => {
                    const options = props.options;
                    if (!options) return null;
                    const selected = options.find((child) => child.value === value)
                    const handleChange = (value) => {
                        const changeEvent = {
                            target: { value },
                        }
                        onChange?.(changeEvent)
                    }
                    return (
                        <Select
                            value={value?.toString()}
                            onValueChange={handleChange}
                        >
                            <SelectTrigger
                                className={cn(
                                    "flex h-8 w-fit items-center justify-between gap-1 rounded-md border-0 bg-transparent px-2 py-1 text-base font-semibold hover:bg-accent hover:text-accent-foreground focus:ring-0 focus:ring-offset-0 focus:bg-accent shadow-none [&>span]:line-clamp-none",
                                )}
                            >
                                <SelectValue>{selected?.label}</SelectValue>
                            </SelectTrigger>
                            <SelectContent className="max-h-[250px]">
                                {options.map((option) => (
                                    <SelectItem
                                        key={option.value}
                                        value={option.value?.toString()}
                                        disabled={option.disabled}
                                    >
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )
                },
                DayButton: ({ ...props }) => (
                    <CalendarDayButton locale={locale} {...props} />
                ),
                WeekNumber: ({ children, ...props }) => {
                    return (
                        <td {...props}>
                            <div className="flex h-9 w-9 items-center justify-center text-center">
                                {children}
                            </div>
                        </td>
                    )
                },
                ...components,
            }}
            {...props}
        />
    )
}

function CalendarDayButton({
    className,
    day,
    modifiers,
    locale,
    ...props
}) {
    const defaultClassNames = getDefaultClassNames()

    const ref = React.useRef(null)
    React.useEffect(() => {
        if (modifiers.focused) ref.current?.focus()
    }, [modifiers.focused])

    return (
        <Button
            ref={ref}
            variant="ghost"
            size="icon"
            data-day={day.date.toLocaleDateString(locale?.code)}
            data-selected-single={
                modifiers.selected &&
                !modifiers.range_start &&
                !modifiers.range_end &&
                !modifiers.range_middle
            }
            data-range-start={modifiers.range_start}
            data-range-end={modifiers.range_end}
            data-range-middle={modifiers.range_middle}
            className={cn(
                "relative isolate z-10 flex aspect-square h-9 w-9 flex-col items-center justify-center gap-1 border-0 leading-none font-medium transition-all hover:bg-accent hover:text-accent-foreground",
                "data-[range-end=true]:rounded-xl data-[range-end=true]:rounded-r-xl data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground",
                "data-[range-middle=true]:rounded-none data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground",
                "data-[range-start=true]:rounded-xl data-[range-start=true]:rounded-l-xl data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground",
                "data-[selected-single=true]:rounded-xl data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground",
                "[&>span]:text-xs [&>span]:opacity-70",
                defaultClassNames.day,
                className
            )}
            {...props}
        />
    )
}

export { Calendar, CalendarDayButton }
