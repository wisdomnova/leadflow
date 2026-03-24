import { serve } from "inngest/next";
import { inngest } from "@/lib/services/inngest";
import { 
  campaignLauncher, 
  emailProcessor, 
  uniboxSyncScheduler, 
  accountSyncProcessor,
  powersendSyncProcessor,
  activityRetentionTask,
  warmupScheduler,
  warmupAccountProcessor,
  warmupRampUpScheduler,
  warmupReplyProcessor,
  leadEnrichmentProcessor,
  powersendReputationMonitor,
  powersendWarmupScheduler,
  powersendWarmupProcessor,
  powersendWarmupRampUp,
  planDowngradeApplier,
  replyClassifier
} from "@/lib/inngest/functions";

// Serve all Inngest functions
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    campaignLauncher,
    emailProcessor,
    uniboxSyncScheduler,
    accountSyncProcessor,
    powersendSyncProcessor,
    activityRetentionTask,
    warmupScheduler,
    warmupAccountProcessor,
    warmupRampUpScheduler,
    warmupReplyProcessor,
    leadEnrichmentProcessor,
    powersendReputationMonitor,
    powersendWarmupScheduler,
    powersendWarmupProcessor,
    powersendWarmupRampUp,
    planDowngradeApplier,
    replyClassifier
  ],
});
