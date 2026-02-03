import { serve } from "inngest/next";
import { inngest } from "@/lib/services/inngest";
import { 
  campaignLauncher, 
  emailProcessor, 
  uniboxSyncScheduler, 
  accountSyncProcessor,
  activityRetentionTask 
} from "@/lib/inngest/functions";

// Create an API that serves zero functions
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    campaignLauncher,
    emailProcessor,
    uniboxSyncScheduler,
    accountSyncProcessor,
    activityRetentionTask
  ],
});
