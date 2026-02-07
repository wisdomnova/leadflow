import { addDays, setHours, setMinutes, startOfHour, differenceInMinutes, isWeekend, nextMonday } from 'date-fns';

/**
 * Calculates the next optimal sending window for a lead based on their timezone
 * and the campaign's intentional wait period.
 * 
 * Logic:
 * 1. Start with (Now + User Wait Days)
 * 2. Shift to the next available Business Day (Mon-Fri)
 * 3. Select an optimal hour based on Industry/Role (Defaulting to 10:00 AM)
 * 4. Add human-like jitter (0-15 minutes)
 */
export function calculateOptimalSendTime(
    leadTimezone: string | null, 
    waitDays: number, 
    jobTitle?: string
): Date {
    const tz = leadTimezone || 'UTC';
    
    // 1. Calculate target date based on user's wait period
    let target = addDays(new Date(), waitDays);
    
    // Convert current time in target date to lead's timezone
    // Note: Since we are running in a serverless environment, we'll use Intl to handle TZ
    const leadLocalTime = new Date(target.toLocaleString('en-US', { timeZone: tz }));
    
    // 2. Avoid Weekends
    if (isWeekend(leadLocalTime)) {
        target = nextMonday(target);
    }

    // 3. Optimal Hour Selection (In Lead's Local Time)
    // Heuristic: Early morning for executives, Mid-morning for others
    let optimalHour = 10; // Default: 10 AM
    if (jobTitle) {
        const title = jobTitle.toLowerCase();
        if (title.includes('ceo') || title.includes('founder') || title.includes('president') || title.includes('vp')) {
            optimalHour = 8; // Catch them before morning meetings
        } else if (title.includes('developer') || title.includes('engineer')) {
            optimalHour = 13; // Post-lunch window
        }
    }

    // 4. Set the exact time and add jitter
    const jitterMinutes = Math.floor(Math.random() * 15);
    
    // We adjust the 'target' date but we need to ensure it's the 'optimalHour' in the REMOTE timezone
    // A simple way is to set the time in UTC and offset it, but Intl is better.
    // However, for scheduling in Inngest, we just need the UTC Date of when that local hour occurs.
    
    const year = target.getFullYear();
    const month = target.getMonth();
    const date = target.getDate();

    // Create a date string representing the local target time
    const localISO = `${year}-${String(month + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}T${String(optimalHour).padStart(2, '0')}:${String(jitterMinutes).padStart(2, '0')}:00`;
    
    // Parse it in the context of the remote timezone
    // (This is tricky in JS without date-fns-tz, so we use a trick with Intl)
    const remoteDate = new Date(new Date(localISO).toLocaleString('en-US', { timeZone: tz }));
    const offset = new Date(localISO).getTime() - remoteDate.getTime();
    
    const finalScheduledDate = new Date(new Date(localISO).getTime() + offset);

    // Ensure we don't accidentally schedule in the past
    return finalScheduledDate.getTime() < Date.now() ? addDays(finalScheduledDate, 1) : finalScheduledDate;
}

/**
 * Returns formatted delay string for Inngest (e.g. '120m')
 */
export function getInngestDelay(targetDate: Date): string {
    const diff = differenceInMinutes(targetDate, new Date());
    return `${Math.max(1, diff)}m`;
}
