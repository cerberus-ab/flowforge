type ClassValue = string | false | undefined;

export function cx(...classes: ClassValue[]): string {
    return classes.filter(Boolean).join(' ');
}
